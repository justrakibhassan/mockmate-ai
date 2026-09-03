import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let planType = "credits";
    try {
      const body = await req.json();
      if (body?.plan) planType = body.plan;
    } catch {
      // Body is optional; fallback to credits
    }

    const isPro = planType === "pro";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: isPro ? "Pro Plan (25 AI Interview Credits)" : "10 AI Interview Credits",
              description: isPro
                ? "Upgrade to Pro plan with 25 AI interview credits and priority AI feedback."
                : "Purchase 10 additional interview credits for MockMate AI.",
            },
            unit_amount: isPro ? 1900 : 1000, // $19.00 or $10.00
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        credits: isPro ? 25 : 10,
        plan: isPro ? "Pro" : "Free",
      },
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
