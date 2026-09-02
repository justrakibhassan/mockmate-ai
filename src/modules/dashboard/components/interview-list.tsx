"use client";

import React, { useEffect, useState } from "react";
import { getUserInterviews, deleteInterview } from "@/actions/interview";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Calendar,
  ArrowRight,
  BrainCircuit,
  Trash2,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Interview {
  _id: string;
  jobPosition: string;
  jobDesc: string;
  jobExperience: string;
  questions?: string[];
  answers?: { question: string; rating?: number }[];
  status: "pending" | "completed";
  overallRating?: number;
  createdAt: string;
}

interface InterviewListProps {
  initialInterviews?: Interview[];
}

export const InterviewList = ({ initialInterviews }: InterviewListProps) => {
  const [interviews, setInterviews] = useState<Interview[]>(initialInterviews || []);
  const [loading, setLoading] = useState(!initialInterviews);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialInterviews) return;

    const fetchInterviews = async () => {
      try {
        const result = await getUserInterviews();
        if (result.success && result.interviews) {
          setInterviews(result.interviews);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [initialInterviews]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this interview session? This cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    try {
      const resp = await deleteInterview(id);
      if (resp.success) {
        setInterviews((prev) => prev.filter((item) => item._id !== id));
        toast.success("Interview session deleted.");
      } else {
        toast.error(resp.error || "Failed to delete interview.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete interview.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[220px] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-muted p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
          <BrainCircuit className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground">No Interviews Yet</h3>
        <p className="mt-2 text-muted-foreground">
          Create your first mock interview to start practicing.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {interviews.map((interview) => {
        const isCompleted = interview.status === "completed";
        const totalQuestions = interview.questions?.length ?? 5;
        const answeredCount = interview.answers?.length ?? 0;

        return (
          <Card
            key={interview._id}
            className="group relative flex flex-col justify-between border-none bg-background/50 shadow-md transition-all hover:shadow-xl hover:ring-1 hover:ring-primary/20 backdrop-blur-sm overflow-hidden"
          >
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="border-primary/20 bg-primary/5 text-primary text-[11px]"
                  >
                    {interview.jobExperience} Yrs Exp
                  </Badge>

                  {isCompleted ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {typeof interview.overallRating === "number"
                        ? `${interview.overallRating}/10`
                        : "Completed"}
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold gap-1">
                      <Clock className="h-3 w-3" />
                      {answeredCount}/{totalQuestions} Answered
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(interview.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-70 group-hover:opacity-100"
                    title="Delete Interview"
                    disabled={deletingId === interview._id}
                    onClick={(e) => handleDelete(interview._id, e)}
                  >
                    {deletingId === interview._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">
                  {interview.jobPosition}
                </CardTitle>
                <CardDescription className="line-clamp-2 italic mt-1 text-xs leading-relaxed">
                  &quot;{interview.jobDesc}&quot;
                </CardDescription>
              </div>
            </CardHeader>

            <CardFooter className="pt-0 grid grid-cols-2 gap-2 mt-auto">
              {isCompleted ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full font-semibold h-10 rounded-xl text-xs"
                    asChild
                  >
                    <Link href={`/interview/${interview._id}`}>
                      Details
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    className="w-full font-bold shadow-md shadow-primary/10 h-10 rounded-xl text-xs bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    asChild
                  >
                    <Link href={`/interview/${interview._id}/feedback`}>
                      Feedback <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full font-semibold h-10 rounded-xl text-xs"
                    asChild
                  >
                    <Link href={`/interview/${interview._id}`}>
                      Prep Room
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    className="w-full font-bold shadow-md shadow-primary/10 h-10 rounded-xl text-xs"
                    asChild
                  >
                    <Link href={`/interview/${interview._id}/start`}>
                      Continue <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};
