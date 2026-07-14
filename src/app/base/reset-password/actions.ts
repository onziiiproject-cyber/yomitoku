"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function resetPassword(_: unknown, formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const passwordConfirm = formData.get("passwordConfirm") as string;

  if (!token) return { error: "無効なリンクです" };
  if (!password || password.length < 8) return { error: "パスワードは8文字以上で入力してください" };
  if (password !== passwordConfirm) return { error: "パスワードが一致しません" };

  const company = await prisma.company.findUnique({ where: { passwordResetToken: token } });

  if (!company || !company.passwordResetExpiry) return { error: "無効または期限切れのリンクです" };
  if (company.passwordResetExpiry < new Date()) return { error: "リセットリンクの有効期限が切れています。もう一度お試しください。" };

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.company.update({
    where: { id: company.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  redirect("/base/login?reset=1");
}
