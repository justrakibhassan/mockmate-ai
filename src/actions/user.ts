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
      }
    );

    return { success: true, user: JSON.parse(JSON.stringify(updatedUser)) };
  } catch (error: unknown) {
    console.error("Error syncing user:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getUserPlan() {
  try {
    const user = await currentUser();
    if (!user) return "Free";

    await dbConnect();
    const dbUser = await User.findOne({ clerkId: user.id });
    return dbUser?.plan || "Free";
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return "Free";
  }
}
