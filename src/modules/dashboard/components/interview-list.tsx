"use client";

import React, { useEffect, useState } from "react";
import { getUserInterviews } from "@/actions/interview";
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
import { Calendar, ArrowRight, BrainCircuit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Interview {
  _id: string;
  jobPosition: string;
  jobDesc: string;
  jobExperience: string;
  createdAt: string;
}

export const InterviewList = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-2xl" />
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
      {interviews.map((interview) => (
        <Card
          key={interview._id}
          className="group border-none bg-background/50 shadow-md transition-all hover:shadow-xl hover:ring-1 hover:ring-primary/20 backdrop-blur-sm"
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary"
              >
                {interview.jobExperience} Years Exp.
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(interview.createdAt).toLocaleDateString()}
              </span>
            </div>
            <CardTitle className="mt-4 text-xl font-bold group-hover:text-primary transition-colors">
              {interview.jobPosition}
            </CardTitle>
            <CardDescription className="line-clamp-2 italic">
              &quot;{interview.jobDesc}&quot;
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full font-semibold h-10 rounded-xl"
              asChild
            >
              <Link href={`/interview/${interview._id}/feedback`}>
                Feedback
              </Link>
            </Button>
            <Button
              size="sm"
              className="w-full font-bold shadow-md shadow-primary/10 h-10 rounded-xl"
              asChild
            >
              <Link href={`/interview/${interview._id}`}>
                Start <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
