"use client";

import React, { useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import {
  BrainCircuit,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lightbulb,
  Video,
  VideoOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { RecordAnswer } from "../components/record-answer";

interface StartInterviewViewProps {
  interview: {
    _id: string;
    questions: string[];
    jobPosition: string;
    answers?: { question: string }[];
  };
}

export const StartInterviewView = ({ interview }: StartInterviewViewProps) => {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [webcamError, setWebcamError] = useState(false);
  const [answered, setAnswered] = useState<Set<string>>(
    () => new Set((interview.answers ?? []).map((a) => a.question))
  );
  const [speaking, setSpeaking] = useState(false);
  const router = useRouter();

  const questions = interview.questions;

  // AI Text-to-Speech
  const readQuestion = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  useEffect(() => {
    readQuestion(questions[activeQuestionIndex]);
  }, [activeQuestionIndex, questions, readQuestion]);

  // Otherwise the question keeps being read aloud after leaving the page.
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const unansweredCount = questions.length - answered.size;

  const onEndInterview = () => {
    if (
      unansweredCount > 0 &&
      !window.confirm(
        `You have ${unansweredCount} unanswered question${
          unansweredCount === 1 ? "" : "s"
        }. End the interview anyway?`
      )
    ) {
      return;
    }
    stopSpeaking();
    router.push(`/interview/${interview._id}/feedback`);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Session Header */}
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <BrainCircuit className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {interview.jobPosition} Interview
            </h1>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
              Live Session Active
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            Session ID:
          </span>
          <Badge variant="secondary" className="font-mono">
            {interview._id.slice(-8).toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Question & Controls (Content Focused) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Question Navigator */}
          <div className="flex flex-wrap items-center gap-2">
            {questions.map((question, index) => {
              const isAnswered = answered.has(question);
              return (
                <Button
                  key={index}
                  variant={activeQuestionIndex === index ? "default" : "outline"}
                  size="sm"
                  aria-label={`Question ${index + 1}${
                    isAnswered ? " (answered)" : " (not answered)"
                  }`}
                  aria-current={activeQuestionIndex === index ? "step" : undefined}
                  className={`relative w-10 h-10 rounded-xl font-bold transition-all ${
                    activeQuestionIndex === index
                      ? "scale-110 shadow-md shadow-primary/20"
                      : ""
                  } ${
                    isAnswered && activeQuestionIndex !== index
                      ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-500"
                      : ""
                  }`}
                  onClick={() => setActiveQuestionIndex(index)}
                >
                  {index + 1}
                  {isAnswered && (
                    <CheckCircle2 className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-background text-emerald-500" />
                  )}
                </Button>
              );
            })}
            <span className="ml-2 text-sm text-muted-foreground">
              {answered.size}/{questions.length} answered
            </span>
          </div>

          {/* Active Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="relative overflow-hidden border-none bg-background/50 shadow-xl ring-1 ring-primary/5">
                <div className="absolute top-0 right-0 p-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-primary/10"
                    onClick={() =>
                      speaking
                        ? stopSpeaking()
                        : readQuestion(questions[activeQuestionIndex])
                    }
                    aria-label={
                      speaking ? "Stop reading question" : "Read question aloud"
                    }
                  >
                    {speaking ? (
                      <VolumeX className="h-6 w-6 text-primary" />
                    ) : (
                      <Volume2 className="h-6 w-6 text-primary" />
                    )}
                  </Button>
                </div>
                <CardHeader className="pt-8">
                  <CardTitle className="text-xl font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Question #{activeQuestionIndex + 1}
                  </CardTitle>
                  <p className="text-2xl font-medium leading-tight text-foreground sm:text-3xl">
                    {questions[activeQuestionIndex]}
                  </p>
                </CardHeader>
                <CardContent className="pb-8">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 ring-1 ring-primary/10">
                    <Lightbulb className="h-6 w-6 text-primary shrink-0 mt-1" />
                    <p className="text-sm text-muted-foreground">
                      <strong>Tip:</strong> Be concise and use specific examples
                      from your past experience to answer this question.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="lg"
              disabled={activeQuestionIndex === 0}
              onClick={() => setActiveQuestionIndex((prev) => prev - 1)}
              className="h-14 px-8 font-bold"
            >
              <ChevronLeft className="mr-2 h-5 w-5" /> Previous Question
            </Button>

            {activeQuestionIndex === questions.length - 1 ? (
              <Button
                size="lg"
                variant="default"
                className="h-14 px-8 font-extrabold bg-linear-to-r from-emerald-600 to-teal-500 shadow-xl shadow-emerald-500/20"
                onClick={onEndInterview}
              >
                End Interview <CheckCircle2 className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button
                size="lg"
                className="h-14 px-8 font-bold"
                onClick={() => setActiveQuestionIndex((prev) => prev + 1)}
              >
                Next Question <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Experience Panel (Webcam & Feedback) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative aspect-video overflow-hidden rounded-3xl bg-slate-900 shadow-2xl ring-4 ring-background">
            {webcamError ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-slate-400 bg-slate-950">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900">
                  <VideoOff className="h-8 w-8 text-amber-500" />
                </div>
                <p className="text-sm font-medium">Camera Offline (Voice-Only Mode)</p>
              </div>
            ) : (
              <Webcam
                mirrored={true}
                onUserMediaError={() => setWebcamError(true)}
                className="h-full w-full object-cover opacity-80"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex items-end p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg">
                  {webcamError ? (
                    <VideoOff className="h-5 w-5 text-white" />
                  ) : (
                    <Video className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-widest opacity-80">
                    Recording Status
                  </p>
                  <p className="text-sm font-bold text-white italic">
                    {webcamError ? "Voice-only input active..." : "AI analyzing your engagement..."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-none bg-slate-50 dark:bg-slate-900">
            <CardContent className="p-8 text-center space-y-6">
              <RecordAnswer
                interviewId={interview._id}
                activeQuestion={questions[activeQuestionIndex]}
                onSaved={(question) =>
                  setAnswered((prev) => new Set(prev).add(question))
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
