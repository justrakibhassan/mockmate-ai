import { FeedbackView } from "@/modules/interview/views/feedback-view";

interface FeedbackPageProps {
  params: Promise<{
    interviewId: string;
  }>;
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { interviewId } = await params;

  return (
    <div className="min-h-screen bg-background">
      <FeedbackView interviewId={interviewId} />
    </div>
  );
}
