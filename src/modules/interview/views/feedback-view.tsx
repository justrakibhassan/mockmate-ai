"use client";

import React, { useState } from "react";
import {
  Trophy,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Home,
  ArrowRight,
  AlertCircle,
  Printer,
  Sparkles,
  Loader2,
  Code2,
  MessagesSquare,
  Network,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Link from "next/link";
import { completeAndEvaluateInterview } from "@/actions/interview";

interface FeedbackItem {
  question: string;
  answer: string;
  feedback: string;
  rating: number;
  technicalAccuracy?: number;
  communication?: number;
  architectureTradeoffs?: number;
  idealAnswer: string;
}

interface FeedbackViewProps {
  interviewId: string;
  jobPosition?: string;
  initialFeedback?: FeedbackItem[];
  initialOverallRating?: number;
  initialError?: string | null;
  isCompleted?: boolean;
  isDemo?: boolean;
}

function scoreTone(score: number) {
  if (score >= 8)
    return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (score >= 6)
    return "text-primary bg-primary/10 border-primary/20";
  if (score >= 4)
    return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
  return "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
}

export const FeedbackView = ({
  interviewId,
  jobPosition,
  initialFeedback = [],
  initialOverallRating = 0,
  initialError = null,
  isCompleted = false,
  isDemo = false,
}: FeedbackViewProps) => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>(initialFeedback);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [overallRating, setOverallRating] = useState(initialOverallRating);

  const rubricAvg = (key: "technicalAccuracy" | "communication" | "architectureTradeoffs") => {
    const items = feedback.filter((f) => typeof f[key] === "number");
    if (!items.length) return null;
    return Math.round(
      items.reduce((acc, f) => acc + (f[key] as number), 0) / items.length
    );
  };

  const rubrics = [
    { key: "technicalAccuracy" as const, label: "Technical Accuracy", icon: Code2 },
    { key: "communication" as const, label: "Communication (STAR)", icon: MessagesSquare },
    { key: "architectureTradeoffs" as const, label: "Architecture & Trade-offs", icon: Network },
  ];

  const handleManualEvaluate = async () => {
    setEvaluating(true);
    setError(null);
    try {
      const result = await completeAndEvaluateInterview(interviewId);
      if (result.success && result.feedback?.length) {
        setFeedback(result.feedback);
        const total = result.feedback.reduce(
          (acc: number, item: { rating?: number }) => acc + (item.rating || 0),
          0
        );
        setOverallRating(
          typeof result.overallRating === "number"
            ? result.overallRating
            : Math.round(total / result.feedback.length)
        );
      } else {
        setError(result.error || "No feedback is available for this interview.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong while evaluating your responses.");
    } finally {
      setEvaluating(false);
    }
  };

  if (evaluating) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-primary/15" />
          <div className="absolute inset-0 h-20 w-20 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <BrainIcon />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-xl font-bold text-foreground">
            Generating AI Feedback...
          </h3>
          <p className="text-sm text-muted-foreground">
            Gemini is analyzing your answers across technical accuracy,
            communication, and architecture.
          </p>
        </div>
      </div>
    );
  }

  if (error || feedback.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          {error ? "Notice" : "Evaluation Pending"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {error ||
            "This interview has not been evaluated yet. Complete the interview to generate your AI feedback."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="h-12 px-6 font-semibold" asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-5 w-5" /> Back to Dashboard
            </Link>
          </Button>
          {!isCompleted ? (
            <Button className="h-12 px-6 font-semibold" asChild>
              <Link href={`/interview/${interviewId}/start`}>
                Resume Interview <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button
              className="h-12 px-6 font-semibold"
              onClick={handleManualEvaluate}
              disabled={evaluating}
            >
              {evaluating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                "Evaluate Saved Answers"
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 py-10 md:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-linear-to-b from-primary/8 to-transparent blur-2xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="space-y-10"
      >
        {isDemo && (
          <div className="no-print flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/25">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Recruiter Showcase Demo</p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Interactive evaluation report for a Senior Full-Stack Engineer session. No login or mic required to test!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" asChild className="font-semibold">
                <Link href="/">Back to Home</Link>
              </Button>
              <Button size="sm" asChild className="font-semibold shadow-md shadow-primary/20">
                <Link href="/sign-up">Sign Up Free</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Report Header */}
        <div className="space-y-5 text-center">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Performance Report
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {jobPosition ? `${jobPosition} Interview` : "Interview"} Results
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            You completed all questions. Here is your AI-driven evaluation with
            per-question scoring and improvement notes.
          </p>

          <div className="no-print flex justify-center pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-9 border-primary/20 px-4 font-semibold hover:bg-primary/5"
            >
              <Printer className="mr-2 h-4 w-4 text-primary" /> Export as PDF
            </Button>
          </div>
        </div>

        {/* Score Dashboard */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-border/70 bg-linear-to-b from-primary/8 to-transparent shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/25">
                <Trophy className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Overall Score
              </p>
              <p className="mt-1.5 text-4xl font-black text-foreground">
                {overallRating}
                <span className="text-xl font-normal text-muted-foreground">/10</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card/60 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Questions
              </p>
              <p className="mt-1.5 text-3xl font-black text-foreground">
                {feedback.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Evaluated by Gemini</p>
            </CardContent>
          </Card>

          {rubrics.map(({ key, label, icon: Icon }) => {
            const avg = rubricAvg(key);
            return (
              <Card key={key} className="border border-border/70 bg-card/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    {label}
                  </p>
                  <p className="mt-1.5 text-3xl font-black text-foreground">
                    {avg ?? "—"}
                    {avg !== null && (
                      <span className="text-base font-normal text-muted-foreground">/10</span>
                    )}
                  </p>
                  {avg !== null && (
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-border">
                      <motion.div
                        className="h-full rounded-full bg-linear-to-r from-primary to-secondary"
                        initial={{ width: 0 }}
                        animate={{ width: `${avg * 10}%` }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Question-wise Analysis */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <MessageSquare className="h-5 w-5 text-primary" />
              Question-wise Analysis
            </h2>
            <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
              <TrendingUp className="h-3.5 w-3.5" />
              Composite score is the average of the three rubric dimensions
            </span>
          </div>

          <Accordion
            type="single"
            collapsible
            className="w-full space-y-3.5"
          >
            {feedback.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="print-avoid-break overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-sm"
              >
                <AccordionTrigger className="px-5 py-4 hover:bg-muted/40 hover:no-underline sm:px-6">
                  <div className="flex items-center gap-3 text-left">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 font-bold text-primary text-sm">
                      {index + 1}
                    </span>
                    <span className="line-clamp-1 font-semibold text-foreground">
                      {item.question}
                    </span>
                    <Badge
                      variant="outline"
                      className={`ml-auto shrink-0 border text-[11px] font-bold sm:text-xs ${scoreTone(item.rating)}`}
                    >
                      {item.rating}/10
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-5 px-4 pb-5 pt-1 sm:px-6 sm:pb-6">
                  {/* Rubric chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                    {rubrics.map(({ key, label }) => (
                      <div
                        key={key}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium sm:flex-col sm:items-start sm:gap-0.5 ${scoreTone(item[key] ?? item.rating)}`}
                      >
                        <span className="opacity-80">{label.replace(" (STAR)", "")}</span>
                        <span className="font-bold">{item[key] ?? item.rating}/10</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs font-bold tracking-widest text-rose-500 uppercase">
                        Your Answer
                      </p>
                      <div className="whitespace-pre-wrap rounded-xl border border-rose-500/15 bg-rose-500/5 p-4 text-sm leading-relaxed text-muted-foreground">
                        {item.answer}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold tracking-widest text-emerald-500 uppercase">
                        Ideal Answer
                      </p>
                      <div className="whitespace-pre-wrap rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4 text-sm leading-relaxed text-foreground">
                        {item.idealAnswer}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-primary/15 bg-primary/5 p-4 sm:p-5">
                    <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase">
                      <Sparkles className="h-4 w-4" />
                      AI Feedback · Scored {item.rating}/10
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {item.feedback}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Action Buttons */}
        <div className="no-print action-buttons flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-7 font-semibold"
            asChild
          >
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
          <Button
            size="lg"
            className="h-12 bg-linear-to-r from-primary to-indigo-600 px-7 font-bold shadow-lg shadow-primary/25"
            asChild
          >
            <Link href="/dashboard">
              Start Another Interview <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

function BrainIcon() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Sparkles className="h-7 w-7 text-primary" />
    </div>
  );
}
