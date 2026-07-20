import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, newName } = await req.json();

  let user;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.companyId !== session.companyId) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }
  } else if (newName && typeof newName === "string" && newName.trim().length > 0) {
    const trimmed = newName.trim().slice(0, 20);
    user = await prisma.user.create({
      data: { companyId: session.companyId, name: trimmed },
    });
  } else {
    return NextResponse.json({ error: "userId or newName required" }, { status: 400 });
  }

  const token = await createSession({
    ...session,
    userId: user.id,
    nickname: user.name,
    iconKey: user.iconKey ?? undefined,
    iconUrl: user.iconUrl ?? undefined,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
