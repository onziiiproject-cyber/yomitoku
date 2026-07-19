import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await prisma.company.findUnique({ where: { id: session.companyId } });
  if (!company?.stripeCustomerId) {
    return NextResponse.json({ error: "Stripeカスタマー情報が見つかりません" }, { status: 400 });
  }

  const host = req.headers.get("host") ?? "yomitoku-base.com";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const returnUrl = `${proto}://${host}/base/settings`;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: company.stripeCustomerId,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: portalSession.url });
}
