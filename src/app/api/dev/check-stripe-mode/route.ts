import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  const priceId = process.env.STRIPE_PRICE_ID ?? "";
  return NextResponse.json({
    keyPrefix: key.slice(0, 12),
    keyLength: key.length,
    webhookSecretPrefix: webhookSecret.slice(0, 10),
    priceId,
  });
}
