import { notFound } from "next/navigation";
import { getInterviewDetails } from "@/actions/interview";
import { StartInterviewView } from "@/modules/interview/views/start-interview-view";

interface StartInterviewPageProps {
  params: Promise<{
    interviewId: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function StartInterviewPage({ params }: StartInterviewPageProps) {
  const { interviewId } = await params;
  
  const result = await getInterviewDetails(interviewId);

  if (!result.success || !result.interview) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <StartInterviewView interview={result.interview} />
    </div>
  );
}
