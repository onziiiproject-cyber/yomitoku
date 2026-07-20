"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const schema = z.object({
  companyName:  z.string().min(1).max(100),
  facilityName: z.string().min(1).max(100),
  contactName:  z.string().min(1).max(50),
  contactRole:  z.string().min(1),
  email:        z.string().email(),
  password:     z.string().min(8),
  phone:        z.string().optional(),
  prefecture:   z.string().optional(),
  tagKeys:      z.array(z.string()).min(1),
});

export async function startRegistration(_: unknown, formData: FormData) {
  const raw = {
    companyName:  formData.get("companyName"),
    facilityName: formData.get("facilityName"),
    contactName:  formData.get("contactName"),
    contactRole:  formData.get("contactRole"),
    email:        formData.get("email"),
    password:     formData.get("password"),
    phone:        formData.get("phone") || undefined,
    prefecture:   formData.get("prefecture") || undefined,
    tagKeys:      formData.getAll("tagKeys"),
  };
  const refCode = formData.get("ref");

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: "入力内容を確認してください。" };
  }

  const { companyName, facilityName, contactName, contactRole, email, password, phone, prefecture, tagKeys } = parsed.data;

  const tags = await prisma.tag.findMany({ where: { key: { in: tagKeys } } });
  if (tags.length === 0) {
    return { error: "受け取りたい情報を1つ以上選択してください。" };
  }

  const existing = await prisma.company.findUnique({ where: { email } });
  // 決済未完了（PENDING_PAYMENT）のまま離脱した場合は再登録として上書きを許可する。
  // それ以外（有効・解約済みなど）のステータスは本当に既存アカウントなのでブロックする。
  if (existing && existing.status !== "PENDING_PAYMENT") {
    return { error: "このメールアドレスはすでに登録されています。" };
  }

  const referralRaw = typeof refCode === "string" && refCode
    ? await prisma.referralCode.findUnique({ where: { code: refCode } })
    : null;
  const referral = referralRaw && (!referralRaw.expiresAt || referralRaw.expiresAt > new Date())
    ? referralRaw
    : null;

  // 既存のstripeCustomerIdは再利用しない。以前の登録時と異なるStripeモード
  // （test/live）で作られていた場合、そのIDは現在のキーでは存在せずエラーになるため、
  // リトライ時も常に新規のCustomerを作成する
  const stripeCustomer = await stripe.customers.create({
    name: companyName,
    email,
    metadata: { contactName, contactRole, prefecture: prefecture ?? "" },
  });

  const passwordHash = await bcrypt.hash(password, 12);

  const companyData = {
    name:         companyName,
    facilityName,
    contactName,
    contactRole,
    passwordHash,
    phone:        phone ?? null,
    prefecture:   prefecture ?? null,
    stripeCustomerId: stripeCustomer.id,
    referredByCodeId: referral?.id ?? null,
  };

  const company = existing
    ? await prisma.company.update({
        where: { id: existing.id },
        data: { ...companyData, tags: { deleteMany: {}, create: tags.map((t) => ({ tagId: t.id })) } },
      })
    : await prisma.company.create({
        data: { ...companyData, email, tags: { create: tags.map((t) => ({ tagId: t.id })) } },
      });

  const headersList = await headers();
  const host = headersList.get("host") ?? "yomitoku-base.com";
  const proto = headersList.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomer.id,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${baseUrl}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${baseUrl}/register?cancelled=1`,
    metadata:         { companyId: company.id },
    subscription_data: {
      metadata: { companyId: company.id },
      ...(referral ? { trial_period_days: 30 } : {}),
    },
  });

  redirect(session.url!);
}
