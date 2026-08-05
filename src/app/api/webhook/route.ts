import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import ProcessedEvent from "@/models/ProcessedEvent";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    const userId = session?.metadata?.userId;
    const credits = parseInt(session?.metadata?.credits || "0");

    if (!userId || !credits) {
      // Nothing actionable — ack so Stripe stops retrying.
      console.error("[STRIPE_WEBHOOK] Missing metadata on event", event.id);
      return new NextResponse(null, { status: 200 });
    }

    await dbConnect();

    // Stripe retries deliveries; the unique index makes this insert the
    // idempotency guard so a replayed event cannot grant credits twice.
    try {
      await ProcessedEvent.create({ eventId: event.id });
    } catch (error) {
      if ((error as { code?: number })?.code === 11000) {
        return new NextResponse(null, { status: 200 });
      }
      // A real failure (e.g. DB down) — let Stripe retry.
      console.error("[STRIPE_WEBHOOK] Failed to record event", error);
      return new NextResponse("Failed to record event", { status: 500 });
    }

    try {
      await User.findOneAndUpdate(
        { clerkId: userId },
        { $inc: { credits: credits } }
      );
    } catch (error) {
      // Let Stripe retry, but drop the marker first so the retry can proceed.
      await ProcessedEvent.deleteOne({ eventId: event.id });
      console.error("[STRIPE_WEBHOOK] Failed to grant credits", error);
      return new NextResponse("Failed to grant credits", { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
