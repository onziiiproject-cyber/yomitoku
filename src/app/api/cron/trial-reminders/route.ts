import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushTrialEndingReminder } from "@/lib/line-message";

export const maxDuration = 60;

function daysBetween(a: Date, b: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((a.getTime() - b.getTime()) / oneDay);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const companies = await prisma.company.findMany({
      where: {
        status: "ACTIVE",
        trialEndsAt: { not: null },
        OR: [{ trialReminder7dSentAt: null }, { trialReminder1dSentAt: null }],
      },
      include: {
        lineRecipients: { where: { unfollowedAt: null } },
      },
    });

    let sent7d = 0;
    let sent1d = 0;

    for (const company of companies) {
      const daysLeft = daysBetween(company.trialEndsAt!, now);

      const shouldSend7d = daysLeft === 7 && !company.trialReminder7dSentAt;
      const shouldSend1d = daysLeft === 1 && !company.trialReminder1dSentAt;
      if (!shouldSend7d && !shouldSend1d) continue;

      const daysToNotify = shouldSend1d ? 1 : 7;
      for (const recipient of company.lineRecipients) {
        try {
          await pushTrialEndingReminder(recipient.lineUserId, daysToNotify);
        } catch (e) {
          console.error(`[cron/trial-reminders] push failed for ${company.id}:`, e);
        }
      }

      await prisma.company.update({
        where: { id: company.id },
        data: shouldSend1d ? { trialReminder1dSentAt: now } : { trialReminder7dSentAt: now },
      });

      if (shouldSend1d) sent1d++;
      else sent7d++;
    }

    return NextResponse.json({ ok: true, sent7d, sent1d, checked: companies.length });
  } catch (e) {
    console.error("[cron/trial-reminders] failed:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
