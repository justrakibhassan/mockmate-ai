import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

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
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  if (event.type === "checkout.session.completed") {
    const userId = session?.metadata?.userId;
    const credits = parseInt(session?.metadata?.credits || "0");

    if (!userId || !credits) {
      return new NextResponse("Webhook Error: Missing metadata", { status: 400 });
    }

    await dbConnect();

    await User.findOneAndUpdate(
      { clerkId: userId },
      { $inc: { credits: credits } }
    );
  }

  return new NextResponse(null, { status: 200 });
}
