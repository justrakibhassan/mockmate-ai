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
  Target,
  BrainCircuit,
  Award,
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
  executiveSummary?: string;
  hiringVerdict?: "STRONG HIRE" | "HIRE" | "LEAN HIRE" | "NEEDS PRACTICE";
  keyStrengths?: string[];
  keyImprovements?: string[];
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

const QUESTION_STAGES = [
  { stage: "Stage 1", title: "Architecture & Systems", badge: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400" },
  { stage: "Stage 2", title: "Technical Deep-Dive", badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400" },
  { stage: "Stage 3", title: "Scalability & Caching", badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  { stage: "Stage 4", title: "Debugging & Edge Cases", badge: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  { stage: "Stage 5", title: "Trade-offs & Leadership", badge: "border-purple-500/30 bg-purple-500/10 text-purple-400" },
];

export const FeedbackView = ({
  interviewId,
  jobPosition,
  initialFeedback = [],
  initialOverallRating = 0,
  initialError = null,
  isCompleted = false,
  isDemo = false,
  executiveSummary: initialExecutiveSummary,
  hiringVerdict: initialHiringVerdict,
  keyStrengths: initialKeyStrengths,
  keyImprovements: initialKeyImprovements,
}: FeedbackViewProps) => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>(initialFeedback);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [overallRating, setOverallRating] = useState(initialOverallRating);
  const [executiveSummary, setExecutiveSummary] = useState<string | undefined>(initialExecutiveSummary);
  const [hiringVerdict, setHiringVerdict] = useState<
    "STRONG HIRE" | "HIRE" | "LEAN HIRE" | "NEEDS PRACTICE" | undefined
  >(initialHiringVerdict);
  const [keyStrengths, setKeyStrengths] = useState<string[]>(initialKeyStrengths || []);
  const [keyImprovements, setKeyImprovements] = useState<string[]>(initialKeyImprovements || []);

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
        if (result.executiveSummary) setExecutiveSummary(result.executiveSummary);
        if (result.hiringVerdict) setHiringVerdict(result.hiringVerdict);
        if (result.keyStrengths) setKeyStrengths(result.keyStrengths);
        if (result.keyImprovements) setKeyImprovements(result.keyImprovements);
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

  // Compute standard Hiring Verdict fallback
  const computedVerdict: "STRONG HIRE" | "HIRE" | "LEAN HIRE" | "NEEDS PRACTICE" =
    hiringVerdict ||
    (overallRating >= 8
      ? "STRONG HIRE"
      : overallRating >= 7
        ? "HIRE"
        : overallRating >= 5
          ? "LEAN HIRE"
          : "NEEDS PRACTICE");

  const verdictConfig = {
    "STRONG HIRE": {
      badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
      accent: "from-emerald-500/15 via-emerald-500/5 to-transparent",
      icon: Award,
      label: "Strong Hire",
      sub: "Performs in the top tier with exceptional technical depth and systems thinking.",
    },
    HIRE: {
      badge: "border-teal-500/30 bg-teal-500/10 text-teal-400",
      accent: "from-teal-500/15 via-teal-500/5 to-transparent",
      icon: CheckCircle2,
      label: "Hire",
      sub: "Solid technical competence and reliable engineering problem-solving.",
    },
    "LEAN HIRE": {
      badge: "border-amber-500/30 bg-amber-500/10 text-amber-500",
      accent: "from-amber-500/15 via-amber-500/5 to-transparent",
      icon: TrendingUp,
      label: "Lean Hire",
      sub: "Demonstrates core foundation with targeted technical topics to refine.",
    },
    "NEEDS PRACTICE": {
      badge: "border-rose-500/30 bg-rose-500/10 text-rose-500",
      accent: "from-rose-500/15 via-rose-500/5 to-transparent",
      icon: AlertCircle,
      label: "Needs Practice",
      sub: "Recommended to practice core concepts and structured STAR methodology.",
    },
  }[computedVerdict];

  const summaryStatement =
    executiveSummary ||
    `Candidate completed the ${jobPosition || "technical"} session with an overall score of ${overallRating}/10. Demonstrated ${
      overallRating >= 7 ? "solid" : "emerging"
    } technical competence and problem-solving, with clear opportunities for deeper architectural metrics and trade-off analysis.`;

  const strengthsList =
    keyStrengths.length > 0
      ? keyStrengths
      : [
          "Demonstrated solid domain fundamentals and structured problem formulation",
          "Clear, concise communication when articulating complex technical workflows",
        ];

  const improvementsList =
    keyImprovements.length > 0
      ? keyImprovements
      : [
          "Detail concrete architecture metrics, caching SLAs, and production edge cases",
          "Deepen explanations around distributed failure modes and error recovery patterns",
        ];

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
            Generating Executive Feedback Report...
          </h3>
          <p className="text-sm text-muted-foreground">
            Gemini is analyzing your answers across technical accuracy, communication, and architecture.
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
    <div className="relative mx-auto w-full max-w-5xl px-3 py-8 sm:px-4 sm:py-12 md:py-14 space-y-8 sm:space-y-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-linear-to-b from-primary/8 to-transparent blur-2xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="space-y-8 sm:space-y-10"
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
                  Executive evaluation report for a Senior Full-Stack Engineer session. Test AI feedback, scoring, and rubric breakdown without signing in!
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
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-xs font-bold text-primary">
              <BrainCircuit className="mr-1 h-3.5 w-3.5" />
              Executive Hiring Report
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {jobPosition ? `${jobPosition} Technical Assessment` : "Technical Assessment"}
          </h1>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-muted-foreground">
            Complete multi-stage evaluation across system architecture, technical accuracy, and engineering communication.
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

        {/* Executive Hiring Committee Hero Card */}
        <Card className="border border-primary/25 bg-linear-to-br from-primary/5 via-card/85 to-card/95 shadow-lg backdrop-blur-md overflow-hidden">
          <CardContent className="p-5 sm:p-7 space-y-6">
            {/* Top Bar: Verdict Badge & Score */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-inner">
                  <verdictConfig.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold tracking-widest text-primary uppercase">
                    Hiring Committee Verdict
                  </p>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <h2 className="text-xl sm:text-2xl font-black text-foreground">
                      {verdictConfig.label}
                    </h2>
                    <Badge variant="outline" className={`px-2.5 py-0.5 text-xs font-bold ${verdictConfig.badge}`}>
                      {computedVerdict}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {verdictConfig.sub}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  Composite Rating
                </p>
                <p className="text-2xl sm:text-3xl font-black text-foreground">
                  {overallRating}
                  <span className="text-base font-normal text-muted-foreground">/10</span>
                </p>
              </div>
            </div>

            {/* Executive Statement */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                Executive Assessment Statement
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 font-medium">
                {summaryStatement}
              </p>
            </div>

            {/* Strengths & Growth Areas Grid */}
            <div className="grid gap-4 sm:grid-cols-2 pt-1">
              {/* Key Strengths */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2.5">
                <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Key Technical Strengths
                </p>
                <ul className="space-y-2 text-xs text-foreground/90">
                  {strengthsList.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for Growth */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2.5">
                <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                  <Target className="h-4 w-4 shrink-0" />
                  Targeted Areas for Growth
                </p>
                <ul className="space-y-2 text-xs text-foreground/90">
                  {improvementsList.map((imp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold mt-0.5">→</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown Metrics */}
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-border/70 bg-linear-to-b from-primary/8 to-transparent shadow-sm">
            <CardContent className="p-5 text-center">
              <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/25">
                <Trophy className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                Overall Score
              </p>
              <p className="mt-1 text-3xl font-black text-foreground">
                {overallRating}
                <span className="text-lg font-normal text-muted-foreground">/10</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card/60 shadow-sm">
            <CardContent className="p-5">
              <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                Questions
              </p>
              <p className="mt-1 text-3xl font-black text-foreground">
                {feedback.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Evaluated by Gemini AI</p>
            </CardContent>
          </Card>

          {rubrics.map(({ key, label, icon: Icon }) => {
            const avg = rubricAvg(key);
            return (
              <Card key={key} className="border border-border/70 bg-card/60 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                    {label}
                  </p>
                  <p className="mt-1 text-3xl font-black text-foreground">
                    {avg ?? "—"}
                    {avg !== null && (
                      <span className="text-base font-normal text-muted-foreground">/10</span>
                    )}
                  </p>
                  {avg !== null && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-foreground">
              <MessageSquare className="h-5 w-5 text-primary" />
              Question-wise Engineering Breakdown
            </h2>
            <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
              <TrendingUp className="h-3.5 w-3.5" />
              5-Stage Technical Evaluation
            </span>
          </div>

          <Accordion
            type="single"
            collapsible
            className="w-full space-y-3"
          >
            {feedback.map((item, index) => {
              const stage = QUESTION_STAGES[index % QUESTION_STAGES.length];
              return (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="print-avoid-break overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-sm"
                >
                  <AccordionTrigger className="px-4 py-3.5 sm:px-6 sm:py-4 hover:bg-muted/40 hover:no-underline">
                    <div className="flex items-center gap-2.5 sm:gap-3 text-left min-w-0 pr-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 font-bold text-primary text-xs">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className={`text-[10px] px-2 py-0 font-semibold ${stage.badge}`}>
                            {stage.title}
                          </Badge>
                        </div>
                        <p className="line-clamp-1 font-semibold text-xs sm:text-sm text-foreground">
                          {item.question}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`ml-auto shrink-0 border text-[11px] font-bold sm:text-xs ${scoreTone(item.rating)}`}
                      >
                        {item.rating}/10
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 px-4 pb-5 pt-1 sm:px-6 sm:pb-6">
                    {/* Rubric chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

                    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold tracking-widest text-rose-500 uppercase">
                          Your Answer
                        </p>
                        <div className="whitespace-pre-wrap rounded-xl border border-rose-500/15 bg-rose-500/5 p-3.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                          {item.answer}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold tracking-widest text-emerald-500 uppercase">
                          Reference Ideal Answer
                        </p>
                        <div className="whitespace-pre-wrap rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3.5 text-xs sm:text-sm leading-relaxed text-foreground">
                          {item.idealAnswer}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-xl border border-primary/15 bg-primary/5 p-3.5 sm:p-4">
                      <p className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-primary uppercase">
                        <Sparkles className="h-3.5 w-3.5" />
                        AI Detailed Feedback · Scored {item.rating}/10
                      </p>
                      <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-muted-foreground">
                        {item.feedback}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
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
