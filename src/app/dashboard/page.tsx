import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Interview from "@/models/Interview";
import { DashboardView } from "@/modules/dashboard/views/dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  await dbConnect();

  const [dbUser, interviews] = await Promise.all([
    User.findOne({ clerkId: userId }).lean(),
    Interview.find({ clerkId: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  const plan = dbUser?.plan || "Free";
  const credits = dbUser?.credits ?? 0;
  const serializedInterviews = JSON.parse(JSON.stringify(interviews || []));

  return (
    <DashboardView
      plan={plan}
      credits={credits}
      initialInterviews={serializedInterviews}
    />
  );
}

