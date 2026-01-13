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
  } catch (error: any) {
    console.error("Error syncing user:", error);
    return { success: false, error: error.message };
  }
}
