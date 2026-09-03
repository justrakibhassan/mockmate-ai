import { FeedbackView } from "@/modules/interview/views/feedback-view";
import { getInterviewFeedback } from "@/actions/interview";

interface FeedbackPageProps {
  params: Promise<{
    interviewId: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { interviewId } = await params;
  const result = await getInterviewFeedback(interviewId);

  const interview = result.success ? result.interview : null;
  const feedback =
    interview?.answers?.filter(
      (a: { rating?: number; feedback?: string }) =>
        typeof a.rating === "number" && a.feedback
    ) || [];
  const overallRating = interview?.overallRating || 0;
  const isCompleted = interview?.status === "completed";

  return (
    <div className="min-h-screen bg-background">
      <FeedbackView
        interviewId={interviewId}
        initialFeedback={feedback}
        initialOverallRating={overallRating}
        initialError={
          result.success ? null : result.error || "Interview not found"
        }
        isCompleted={isCompleted}
      />
    </div>
  );
}
