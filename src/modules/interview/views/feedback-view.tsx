"use client";

import React, { useState } from "react";
import {
  Trophy,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Star,
  Home,
  ArrowRight,
  AlertCircle,
  Printer,
  Sparkles,
  Loader2,
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
  initialFeedback?: FeedbackItem[];
  initialOverallRating?: number;
  initialError?: string | null;
  isCompleted?: boolean;
  isDemo?: boolean;
}

export const FeedbackView = ({
  interviewId,
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 h-24 w-24 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">Generating AI Feedback...</h3>
          <p className="text-muted-foreground italic">
            Gemini is analyzing your answers and performance.
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
          <Button variant="outline" className="h-12 px-6 font-bold" asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-5 w-5" /> Back to Dashboard
            </Link>
          </Button>
          {!isCompleted ? (
            <Button className="h-12 px-6 font-bold" asChild>
              <Link href={`/interview/${interviewId}/start`}>
                Resume Interview <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button
              className="h-12 px-6 font-bold"
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
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10"
      >
        {isDemo && (
          <div className="p-5 rounded-3xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 no-print shadow-lg shadow-primary/5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-foreground text-base">Recruiter Showcase Demo</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Interactive evaluation report for a Senior Full-Stack Engineer session. No login or mic required to test!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" asChild className="rounded-xl font-bold">
                <Link href="/">Back to Home</Link>
              </Button>
              <Button size="sm" asChild className="rounded-xl font-bold shadow-md shadow-primary/20">
                <Link href="/sign-up">Sign Up Free</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Congratulations Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Congratulations!
          </h1>
          <p className="text-lg text-muted-foreground mx-auto max-w-2xl">
            You have successfully completed your mock interview. Here is your
            AI-driven performance review.
          </p>
          <div className="pt-2 no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-10 px-5 font-bold rounded-xl border-primary/20 hover:bg-primary/5 shadow-xs"
            >
              <Printer className="mr-2 h-4 w-4 text-primary" /> Export Evaluation (PDF)
            </Button>
          </div>
        </div>

        {/* Score Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-none bg-primary/5 ring-1 ring-primary/10 shadow-none">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="mx-auto h-8 w-8 text-primary mb-3" />
              <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Overall Rating
              </h4>
              <p className="text-5xl font-black mt-2 text-primary">
                {overallRating}
                <span className="text-2xl font-normal opacity-50">/10</span>
              </p>
            </CardContent>
          </Card>
          <Card className="border-none bg-emerald-500/5 ring-1 ring-emerald-500/10 shadow-none col-span-2">
            <CardContent className="pt-6 flex flex-col justify-center h-full">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">
                    Completed Session
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Your responses have been validated against industry
                    standards.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Accordion */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Question-wise Analysis
          </h2>

          <Accordion
            type="single"
            collapsible
            className="w-full space-y-4 border-none"
          >
            {feedback.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-none bg-background/50 rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-200 dark:ring-slate-800"
              >
                <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-4 text-left">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-lg line-clamp-1">
                      {item.question}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <h5 className="text-sm font-bold flex items-center gap-2 text-rose-500 uppercase">
                        Your Answer
                      </h5>
                      <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 italic text-muted-foreground whitespace-pre-wrap">
                        &quot;{item.answer}&quot;
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h5 className="text-sm font-bold flex items-center gap-2 text-emerald-500 uppercase">
                        Ideal Answer
                      </h5>
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-foreground whitespace-pre-wrap">
                        {item.idealAnswer}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-amber-500/5 ring-1 ring-amber-500/20 space-y-3">
                    <div className="flex gap-4">
                      <Star className="h-6 w-6 text-amber-500 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-amber-600 uppercase text-xs tracking-widest">
                            Feedback & Evaluation
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs font-bold bg-amber-100 dark:bg-amber-900/40 border-amber-200 text-amber-700 dark:text-amber-300"
                          >
                            Composite Score: {item.rating}/10
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap pt-1">
                          {item.feedback}
                        </p>
                      </div>
                    </div>

                    {/* Multi-Dimensional Rubric Breakdown */}
                    <div className="pt-3 border-t border-amber-500/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="flex items-center justify-between rounded-xl bg-background/80 px-3 py-2 text-xs ring-1 ring-slate-200/60 dark:ring-slate-800">
                        <span className="text-muted-foreground font-medium">Technical Accuracy</span>
                        <span className="font-bold text-primary">
                          {item.technicalAccuracy ?? item.rating}/10
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-background/80 px-3 py-2 text-xs ring-1 ring-slate-200/60 dark:ring-slate-800">
                        <span className="text-muted-foreground font-medium">Communication (STAR)</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {item.communication ?? item.rating}/10
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-background/80 px-3 py-2 text-xs ring-1 ring-slate-200/60 dark:ring-slate-800">
                        <span className="text-muted-foreground font-medium">Architecture & Trade-offs</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {item.architectureTradeoffs ?? item.rating}/10
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10 no-print action-buttons">
          <Button
            size="lg"
            variant="outline"
            className="h-14 px-8 font-bold rounded-2xl"
            asChild
          >
            <Link href="/dashboard">
              <Home className="mr-2 h-5 w-5" /> Back to Dashboard
            </Link>
          </Button>
          <Button
            size="lg"
            className="h-14 px-8 font-bold rounded-2xl shadow-xl shadow-primary/20 bg-linear-to-r from-primary to-indigo-600"
            asChild
          >
            <Link href="/dashboard">
              Start Another Interview <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
