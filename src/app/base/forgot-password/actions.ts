"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/resend";

export async function requestPasswordReset(_: unknown, formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim();
  if (!email) return { error: "メールアドレスを入力してください" };

  const company = await prisma.company.findUnique({ where: { email } });

  // セキュリティ上、存在しないアドレスでも同じメッセージを返す
  if (company) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1時間

    await prisma.company.update({
      where: { id: company.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    });

    const headersList = await headers();
    const host = headersList.get("host") ?? "yomitoku-base.com";
    const proto = headersList.get("x-forwarded-proto") ?? "https";
    const resetUrl = `${proto}://${host}/base/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl).catch(console.error);
  }

  return { success: true };
}
