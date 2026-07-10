import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { nanoid } from "nanoid";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const idempotencyKey = `stripe:${event.id}`;
  const existing = await prisma.webhookEvent.findUnique({
    where: { source_externalEventId: { source: "STRIPE", externalEventId: event.id } },
  });
  if (existing?.processedAt) {
    return NextResponse.json({ ok: true });
  }

  await prisma.webhookEvent.upsert({
    where: { source_externalEventId: { source: "STRIPE", externalEventId: event.id } },
    update: {},
    create: {
      source: "STRIPE",
      externalEventId: event.id,
      type: event.type,
      payload: JSON.stringify(event),
    },
  });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const companyId = session.metadata?.companyId;
      if (!companyId) throw new Error("Missing companyId in session metadata");

      const company = await prisma.company.update({
        where: { id: companyId },
        data: {
          status: "ACTIVE",
          stripeSubscriptionId: session.subscription as string,
          inviteCode: nanoid(10),
        },
      });

      await sendWelcomeEmail(company.email, company.name).catch(console.error);
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const companyId = sub.metadata?.companyId;
      if (companyId) {
        await prisma.company.update({
          where: { id: companyId },
          data: { status: "CANCELED" },
        });
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      await prisma.company.updateMany({
        where: { stripeCustomerId: customerId },
        data: { status: "PAST_DUE" },
      });
    }

    await prisma.webhookEvent.update({
      where: { source_externalEventId: { source: "STRIPE", externalEventId: event.id } },
      data: { processedAt: new Date() },
    });

    void idempotencyKey;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
