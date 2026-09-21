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
    let dbUser = await User.findOne({ clerkId: userId }).lean();

    // Auto-create user with 3 starter credits if not synced yet
    if (!dbUser) {
      const user = await currentUser();
      if (user) {
        dbUser = await User.findOneAndUpdate(
          { clerkId: user.id },
          {
            clerkId: user.id,
            email: user.emailAddresses[0]?.emailAddress || "",
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            imageUrl: user.imageUrl || "",
            plan: "Free",
            credits: 5,
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        ).lean();
      }
    }

    return {
      plan: dbUser?.plan || "Free",
      credits: dbUser?.credits ?? 5,
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

export async function addDemoCredits(amount = 5) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    const updated = await User.findOneAndUpdate(
      { clerkId: userId },
      { $inc: { credits: amount } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return { success: true, credits: updated.credits };
  } catch (err) {
    console.error("Error adding demo credits:", err);
    return { success: false, error: "Failed to add demo credits" };
  }
}
