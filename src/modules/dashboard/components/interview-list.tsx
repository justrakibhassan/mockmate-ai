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
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface DashboardInterviewItem {
  _id: string;
  jobPosition: string;
  jobDesc?: string;
  jobExperience?: string;
  questions?: string[];
  answers?: { question: string; rating?: number }[];
  status: "pending" | "completed";
  overallRating?: number;
  createdAt: string;
}

interface InterviewListProps {
  initialInterviews?: DashboardInterviewItem[];
}

export const InterviewList = ({ initialInterviews }: InterviewListProps) => {
  const [interviews, setInterviews] = useState<DashboardInterviewItem[]>(
    initialInterviews || []
  );
  const [loading, setLoading] = useState(!initialInterviews);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DashboardInterviewItem | null>(null);

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

  const requestDelete = (item: DashboardInterviewItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget(item);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const targetId = deleteTarget._id;
    setDeletingId(targetId);
    try {
      const resp = await deleteInterview(targetId);
      if (resp.success) {
        setInterviews((prev) => prev.filter((item) => item._id !== targetId));
        toast.success("Interview session deleted.");
        setDeleteTarget(null);
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
                    onClick={(e) => requestDelete(interview, e)}
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

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deletingId) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md border-border/80 bg-background/95 backdrop-blur-xl p-6 shadow-2xl">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Delete Interview Session?
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <DialogDescription className="text-xs sm:text-sm leading-relaxed text-foreground/90 pt-1">
              Are you sure you want to permanently delete the session for{" "}
              <span className="font-semibold text-foreground">
                &ldquo;{deleteTarget?.jobPosition}&rdquo;
              </span>
              ? All associated questions, speech responses, scores, and evaluation feedback will be permanently removed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={!!deletingId}
              onClick={() => setDeleteTarget(null)}
              className="h-10 text-xs font-semibold"
            >
              Keep Session
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={!!deletingId}
              onClick={handleConfirmDelete}
              className="h-10 text-xs font-bold bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20"
            >
              {deletingId ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
