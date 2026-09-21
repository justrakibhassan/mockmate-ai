import React from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Interview from "@/models/Interview";
import ProcessedEvent from "@/models/ProcessedEvent";
import { stripe } from "@/lib/stripe";
import { DashboardView } from "@/modules/dashboard/views/dashboard-view";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams?: Promise<{
    success?: string;
    session_id?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const params = searchParams ? await searchParams : {};
  const { success, session_id } = params;

  await dbConnect();

  // Instant fulfillment for Demo / Localhost / Stripe Checkout returns
  if (success === "true" && session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (
        session.payment_status === "paid" &&
        session.metadata?.userId === userId
      ) {
        const creditsToAdd = parseInt(session.metadata?.credits || "0", 10);
        const plan = session.metadata?.plan;

        try {
          // Idempotent marker: prevent duplicate fulfillment on page refresh
          await ProcessedEvent.create({ eventId: session.id });

          const updateOps: { $inc: { credits: number }; plan?: string } = {
            $inc: { credits: creditsToAdd },
          };
          if (plan && plan !== "Free") {
            updateOps.plan = plan;
          }

          await User.findOneAndUpdate({ clerkId: userId }, updateOps, {
            upsert: true,
            setDefaultsOnInsert: true,
          });
        } catch (eventErr: unknown) {
          // If code 11000, already processed (either by webhook or previous page load)
          if ((eventErr as { code?: number })?.code !== 11000) {
            console.error("Error creating ProcessedEvent in dashboard:", eventErr);
          }
        }
      }
    } catch (checkoutErr) {
      console.error("Failed to verify checkout session:", checkoutErr);
    }
  }

  let dbUser = await User.findOne({ clerkId: userId }).lean();

  // If user does not exist in DB yet, auto-create them on the server with 5 starter credits
  if (!dbUser) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      const email = clerkUser.emailAddresses[0]?.emailAddress || "";
      const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
      const imageUrl = clerkUser.imageUrl || "";

      dbUser = await User.findOneAndUpdate(
        { clerkId: userId },
        {
          clerkId: userId,
          email,
          name,
          imageUrl,
          credits: 5,
          plan: "Free",
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      ).lean();
    }
  }

  const interviews = await Interview.find({ clerkId: userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const plan = dbUser?.plan || "Free";
  const credits = dbUser?.credits ?? 5;
  const serializedInterviews = JSON.parse(JSON.stringify(interviews || []));

  return (
    <DashboardView
      plan={plan}
      credits={credits}
      initialInterviews={serializedInterviews}
    />
  );
}
