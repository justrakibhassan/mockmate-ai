import { DashboardView } from "@/modules/dashboard/views/dashboard-view";
import { getUserPlan, getUserCredits } from "@/actions/user";

export default async function DashboardPage() {
  const plan = await getUserPlan();
  const credits = await getUserCredits();

  return <DashboardView plan={plan} credits={credits} />;
}
