"use client";

import React from "react";
import { AddInterviewDialog } from "../components/add-interview-dialog";
import { InterviewList, type DashboardInterviewItem } from "../components/interview-list";
import { motion } from "framer-motion";
import { Zap, TrendingUp, Award, BrainCircuit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DashboardViewProps {
  plan?: string;
  credits?: number;
  initialInterviews?: DashboardInterviewItem[];
}

export const DashboardView = ({
  plan = "Free",
  credits = 0,
  initialInterviews = [],
}: DashboardViewProps) => {
  const completedInterviews = initialInterviews.filter(
    (i) => i.status === "completed" && typeof i.overallRating === "number"
  );
  const completedCount = completedInterviews.length;

  const totalScore = completedInterviews.reduce(
    (acc, curr) => acc + (curr.overallRating || 0),
    0
  );
  const averageScore =
    completedCount > 0 ? (totalScore / completedCount).toFixed(1) : "0.0";

  let readinessBadge = {
    title: "Awaiting Assessment",
    description: "Complete your first session",
    color: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  };
  const avgNum = parseFloat(averageScore);
  if (completedCount > 0) {
    if (avgNum >= 8.5) {
      readinessBadge = {
        title: "Senior Level Ready",
        description: "Exceeds industry bar",
        color:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    } else if (avgNum >= 7.0) {
      readinessBadge = {
        title: "Interview Ready",
        description: "Solid technical fundamentals",
        color: "bg-primary/10 text-primary border-primary/20",
      };
    } else {
      readinessBadge = {
        title: "Practice in Progress",
        description: "Focus on technical depth",
        color:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      };
    }
  }

  const totalQuestionsPracticed = initialInterviews.reduce(
    (acc, curr) => acc + (curr.answers?.length || 0),
    0
  );

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            User <span className="text-primary italic">Dashboard</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create a new mock interview or continue your journey.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="group flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 shadow-sm transition-all hover:bg-primary/10"
            >
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
                {plan} Plan <span className="mx-1 opacity-20">|</span> {credits} Credits
                Left
              </span>
            </motion.div>
          </div>
        </div>
        <AddInterviewDialog />
      </motion.div>

      {/* Analytics & Performance Metrics Strip */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-10 grid gap-4 sm:grid-cols-3"
      >
        <Card className="border-none bg-background/60 backdrop-blur-xs ring-1 ring-slate-200/80 dark:ring-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Average Rating
              </p>
              <h3 className="text-2xl font-black text-foreground">
                {averageScore}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / 10
                </span>
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-background/60 backdrop-blur-xs ring-1 ring-slate-200/80 dark:ring-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Readiness Level
              </p>
              <Badge variant="outline" className={`mt-0.5 font-bold ${readinessBadge.color}`}>
                {readinessBadge.title}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-background/60 backdrop-blur-xs ring-1 ring-slate-200/80 dark:ring-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Practice Volume
              </p>
              <h3 className="text-2xl font-black text-foreground">
                {completedCount}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  Sessions ({totalQuestionsPracticed} Qs)
                </span>
              </h3>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="mb-6 text-xl font-semibold text-foreground flex items-center gap-2">
          Recent Interview Sessions
        </h2>
        <InterviewList initialInterviews={initialInterviews} />
      </motion.div>
    </div>
  );
};
