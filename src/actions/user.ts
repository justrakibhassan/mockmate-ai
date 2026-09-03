"use server";

import { currentUser } from "@clerk/nextjs/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function syncUser() {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "No user found" };
    }

    await dbConnect();

    const userData = {
      clerkId: user.id,
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      imageUrl: user.imageUrl,
    };

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: user.id },
      userData,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    return { success: true, user: JSON.parse(JSON.stringify(updatedUser)) };
  } catch (error: unknown) {
    console.error("Error syncing user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

import { auth } from "@clerk/nextjs/server";

export async function getUserSummary() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { plan: "Free", credits: 0 };
    }

    await dbConnect();
    const dbUser = await User.findOne({ clerkId: userId }).lean();
    return {
      plan: dbUser?.plan || "Free",
      credits: dbUser?.credits ?? 0,
    };
  } catch (error) {
    console.error("Error fetching user summary:", error);
    return { plan: "Free", credits: 0 };
  }
}

export async function getUserPlan() {
  const summary = await getUserSummary();
  return summary.plan;
}

export async function getUserCredits() {
  const summary = await getUserSummary();
  return summary.credits;
}
