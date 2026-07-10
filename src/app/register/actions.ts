"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const schema = z.object({
  companyName: z.string().min(1).max(100),
  contactName: z.string().min(1).max(50),
  email: z.string().email(),
  tagKeys: z.array(z.string()).min(1),
  lineUserId: z.string().min(1),
  lineDisplayName: z.string().optional(),
});

export async function startRegistration(_: unknown, formData: FormData) {
  const raw = {
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    tagKeys: formData.getAll("tagKeys"),
    lineUserId: formData.get("lineUserId"),
    lineDisplayName: formData.get("lineDisplayName") ?? undefined,
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: "入力内容を確認してください。" };
  }

  const { companyName, contactName, email, tagKeys, lineUserId, lineDisplayName } = parsed.data;

  const tags = await prisma.tag.findMany({ where: { key: { in: tagKeys } } });
  if (tags.length === 0) {
    return { error: "カテゴリを1つ以上選択してください。" };
  }

  const stripeCustomer = await stripe.customers.create({
    name: companyName,
    email,
    metadata: { contactName, lineUserId },
  });

  const company = await prisma.company.create({
    data: {
      name: companyName,
      contactName,
      email,
      stripeCustomerId: stripeCustomer.id,
      tags: { create: tags.map((t) => ({ tagId: t.id })) },
      lineRecipients: {
        create: { lineUserId, displayName: lineDisplayName ?? null },
      },
    },
  });

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomer.id,
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?cancelled=1`,
    metadata: { companyId: company.id },
    subscription_data: { metadata: { companyId: company.id } },
  });

  redirect(session.url!);
}
