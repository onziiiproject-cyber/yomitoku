import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOnboardingStep, ONBOARDING_DAYS, type OnboardingDay } from "@/lib/onboarding-drip";

export const maxDuration = 60;

const MAX_DAY = Math.max(...ONBOARDING_DAYS);

// User.createdAtは登録した時刻そのもの（時刻はバラバラ）なので、単純な
// ミリ秒差÷24hだと「23:59登録の翌9:00cron」のようなケースでDay1がずれる。
// JST日付そのものの差で数える（digest.tsのoneWeekAgo()と同じ考え方）。
function jstCalendarDaysSince(createdAt: Date, now: Date): number {
  const JST_OFFSET = 9 * 60 * 60 * 1000;
  const toJstMidnight = (d: Date) => {
    const t = new Date(d.getTime() + JST_OFFSET);
    t.setUTCHours(0, 0, 0, 0);
    return t.getTime() - JST_OFFSET;
  };
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((toJstMidnight(now) - toJstMidnight(createdAt)) / oneDay);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const since = new Date(now.getTime() - (MAX_DAY + 1) * 24 * 60 * 60 * 1000);

    const latestBatch = await prisma.messageBatch.findFirst({
      where: { kind: "WEEKLY_DIGEST" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yomitoku-base.com";
    const latestDigestUrl = latestBatch ? `${appUrl}/digest/${latestBatch.id}` : `${appUrl}/base`;

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: {
        id: true,
        createdAt: true,
        onboardingSentDays: true,
        lineRecipient: { select: { lineUserId: true, unfollowedAt: true } },
      },
    });

    let sent = 0;
    for (const user of users) {
      if (!user.lineRecipient || user.lineRecipient.unfollowedAt) continue;

      const daysSince = jstCalendarDaysSince(user.createdAt, now);
      const day = ONBOARDING_DAYS.find((d) => d !== 0 && d === daysSince) as OnboardingDay | undefined;
      if (day === undefined || user.onboardingSentDays.includes(day)) continue;

      try {
        await sendOnboardingStep(user.lineRecipient.lineUserId, day, latestDigestUrl);
        await prisma.user.update({
          where: { id: user.id },
          data: { onboardingSentDays: { push: day } },
        });
        sent++;
      } catch (e) {
        console.error(`[cron/onboarding-drip] push failed for user ${user.id}, day ${day}:`, e);
      }
    }

    return NextResponse.json({ ok: true, sent, checked: users.length });
  } catch (e) {
    console.error("[cron/onboarding-drip] failed:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
