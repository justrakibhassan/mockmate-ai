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

    /**
     * IDEMPOTENCY PATTERN (At-Least-Once Delivery Defense):
     * Stripe delivers webhooks with at-least-once semantics; network blips or timeouts
     * can trigger duplicate event deliveries. We insert the event ID into ProcessedEvent
     * which holds a unique index. If code 11000 (duplicate key) is caught, we know this
     * event has already been acknowledged or is in flight, preventing double-crediting.
     */
    try {
      await ProcessedEvent.create({ eventId: event.id });
    } catch (error) {
      if ((error as { code?: number })?.code === 11000) {
        // Idempotent duplicate: ack 200 immediately so Stripe stops retrying.
        return new NextResponse(null, { status: 200 });
      }
      // Infrastructure failure (e.g. DB connection dropped): return 500 for Stripe retry.
      console.error("[STRIPE_WEBHOOK] Failed to record event marker", error);
      return new NextResponse("Failed to record event", { status: 500 });
    }

    const plan = session?.metadata?.plan;
    const updateOps: { $inc: { credits: number }; plan?: string } = {
      $inc: { credits: credits },
    };
    if (plan && plan !== "Free") {
      updateOps.plan = plan;
    }

    /**
     * COMPENSATING ROLLBACK:
     * If user credit update fails, remove the ProcessedEvent lock marker so Stripe's
     * subsequent retry attempts can re-acquire the lock and grant the user's purchase.
     */
    try {
      await User.findOneAndUpdate(
        { clerkId: userId },
        updateOps
      );
    } catch (error) {
      await ProcessedEvent.deleteOne({ eventId: event.id });
      console.error("[STRIPE_WEBHOOK] Failed to grant credits, rolled back marker", error);
      return new NextResponse("Failed to grant credits", { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
