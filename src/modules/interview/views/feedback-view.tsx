"use client";

import React, { useEffect, useState } from "react";
import { generateFeedback } from "@/actions/interview";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  Trophy,
  Star,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Home,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import Link from "next/link";

interface FeedbackItem {
  question: string;
  answer: string;
  feedback: string;
  rating: number;
  idealAnswer: string;
}

interface FeedbackViewProps {
  interviewId: string;
}

export const FeedbackView = ({ interviewId }: FeedbackViewProps) => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overallRating, setOverallRating] = useState(0);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const result = await generateFeedback(interviewId);
        if (result.success && result.feedback?.length) {
          setFeedback(result.feedback);

          // Calculate average rating
          const total = result.feedback.reduce(
            (acc: number, item: { rating?: number }) =>
              acc + (item.rating || 0),
            0
          );
          setOverallRating(Math.round(total / result.feedback.length));
        } else {
          setError(result.error || "No feedback is available for this interview.");
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong while generating your feedback.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [interviewId]);

  if (loading) {
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

  if (error) {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">No Feedback Yet</h1>
        <p className="mt-3 text-muted-foreground">{error}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Answer at least one question during the session to get an AI review.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="h-12 px-6 font-bold" asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-5 w-5" /> Back to Dashboard
            </Link>
          </Button>
          <Button className="h-12 px-6 font-bold" asChild>
            <Link href={`/interview/${interviewId}/start`}>
              Resume Interview <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
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

                  <div className="p-5 rounded-2xl bg-amber-500/5 ring-1 ring-amber-500/20">
                    <div className="flex gap-4">
                      <Star className="h-6 w-6 text-amber-500 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-amber-600 uppercase text-xs tracking-widest">
                            Feedback & Rating
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs bg-amber-100 dark:bg-amber-900/40 border-amber-200 text-amber-700"
                          >
                            Score: {item.rating}/10
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap pt-1">
                          {item.feedback}
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
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
