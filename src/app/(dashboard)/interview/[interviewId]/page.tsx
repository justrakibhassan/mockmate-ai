import { notFound } from "next/navigation";
import { getInterviewDetails } from "@/actions/interview";
import { InterviewRoomView } from "@/modules/interview/views/interview-room-view";

interface InterviewPageProps {
  params: Promise<{
    interviewId: string;
  }>;
}

export default async function InterviewPage({ params }: InterviewPageProps) {
  const { interviewId } = await params;

  const result = await getInterviewDetails(interviewId);

  if (!result.success || !result.interview) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <InterviewRoomView interview={result.interview} />
    </div>
  );
}
