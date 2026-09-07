"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Webcam from "react-webcam";
import {
  BrainCircuit,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Video,
  VideoOff,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RecordAnswer } from "../components/record-answer";
import { completeAndEvaluateInterview } from "@/actions/interview";

interface StartInterviewViewProps {
  interview: {
    _id: string;
    questions: string[];
    jobPosition: string;
    answers?: { question: string }[];
  };
}

function parseCameraError(err: unknown): string {
  if (typeof err === "string") return err;
  const error = err as { name?: string; message?: string };
  if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
    return "Camera permission denied. Allow camera access in your browser address bar.";
  }
  if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
    return "No camera device detected. Please connect a webcam.";
  }
  if (error?.name === "NotReadableError" || error?.name === "TrackStartError") {
    return "Camera is in use by another app (Zoom, Teams, or another tab).";
  }
  return error?.message || "Failed to access camera.";
}

export const StartInterviewView = ({ interview }: StartInterviewViewProps) => {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const [answered, setAnswered] = useState<Set<string>>(
    () => new Set((interview.answers ?? []).map((a) => a.question))
  );
  const [speaking, setSpeaking] = useState(false);
  const [completing, setCompleting] = useState(false);
  const router = useRouter();

  // Clean up media tracks when leaving the interview room
  useEffect(() => {
    return () => {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        videoStreamRef.current = null;
      }
    };
  }, []);

  const questions = interview.questions;
  const progress = Math.round((answered.size / questions.length) * 100);

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

  const onEndInterview = async () => {
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

    if (answered.size === 0) {
      toast.warning("Please save an answer for at least one question before ending the interview.");
      return;
    }

    setCompleting(true);
    try {
      const resp = await completeAndEvaluateInterview(interview._id);
      if (resp.success) {
        toast.success("Interview completed! Loading your evaluation...");
        router.push(`/interview/${interview._id}/feedback`);
      } else {
        toast.error(resp.error || "Failed to evaluate interview.");
        setCompleting(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete interview.");
      setCompleting(false);
    }
  };

  const cameraActive = webcamEnabled && !webcamError;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16">
      {/* Sticky Session Bar */}
      <div className="sticky top-0 z-20 -mx-4 mb-8 border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/25">
              <BrainCircuit className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">
                {interview.jobPosition}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live session · {answered.size}/{questions.length} answered
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-1.5 sm:flex">
            {questions.map((question, index) => {
              const isAnswered = answered.has(question);
              const isActive = activeQuestionIndex === index;
              return (
                <button
                  key={index}
                  type="button"
                  aria-label={`Question ${index + 1}${
                    isAnswered ? " (answered)" : " (not answered)"
                  }`}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => setActiveQuestionIndex(index)}
                  className={`relative h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                    isAnswered
                      ? "bg-emerald-500"
                      : isActive
                        ? "h-3 w-3 bg-primary"
                        : "bg-border hover:bg-muted-foreground/40"
                  } ${isActive ? "ring-4 ring-primary/15" : ""}`}
                />
              );
            })}
          </div>

          <Badge
            variant="outline"
            className="hidden shrink-0 border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-600 md:inline-flex dark:text-emerald-400"
          >
            {progress}% complete
          </Badge>
        </div>

        {/* Progress rail */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-primary to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Question Flow */}
        <div className="space-y-6 lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeQuestionIndex}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-sm"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-primary/6 to-transparent"
              />

              <div className="relative p-6 sm:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {activeQuestionIndex + 1}
                </span>
                <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Question {activeQuestionIndex + 1} of {questions.length}
                </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10"
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
                      <VolumeX className="h-4.5 w-4.5 text-primary" />
                    ) : (
                      <Volume2 className="h-4.5 w-4.5 text-primary" />
                    )}
                  </Button>
                </div>

                <p className="text-xl leading-relaxed font-medium text-foreground sm:text-2xl">
                  {questions[activeQuestionIndex]}
                </p>

                <p className="mt-6 flex items-start gap-2 rounded-xl border border-border/70 bg-background/50 p-3.5 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-primary">Tip:</span>
                  Structure your answer with a concrete example — situation,
                  action, result.
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Answer Recorder */}
          <div className="rounded-2xl border border-border/70 bg-card/60 p-6 shadow-sm sm:p-8">
            <RecordAnswer
              interviewId={interview._id}
              activeQuestion={questions[activeQuestionIndex]}
              onSaved={(question) =>
                setAnswered((prev) => new Set(prev).add(question))
              }
            />
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="lg"
              disabled={activeQuestionIndex === 0}
              onClick={() => setActiveQuestionIndex((prev) => prev - 1)}
              className="h-12 px-6 font-semibold"
            >
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Previous
            </Button>

            {activeQuestionIndex === questions.length - 1 ? (
              <Button
                size="lg"
                disabled={completing}
                className="h-12 bg-linear-to-r from-emerald-600 to-teal-500 px-6 font-bold shadow-lg shadow-emerald-500/25"
                onClick={onEndInterview}
              >
                {completing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Evaluating Responses...
                  </>
                ) : (
                  <>
                    End Interview <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                className="h-12 px-6 font-semibold shadow-md shadow-primary/20"
                onClick={() => setActiveQuestionIndex((prev) => prev + 1)}
              >
                Next Question <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Right: Presence Panel */}
        <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-32">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/70 bg-slate-950 shadow-lg">
            {cameraActive ? (
              <Webcam
                mirrored={true}
                onUserMedia={(stream) => {
                  videoStreamRef.current = stream;
                  setWebcamError(null);
                }}
                onUserMediaError={(err) => {
                  setWebcamError(parseCameraError(err));
                }}
                className="h-full w-full object-cover opacity-80"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-950 p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <VideoOff className="h-6 w-6 text-amber-500" />
                </div>
                <div className="max-w-xs space-y-1">
                  <p className="text-sm font-semibold text-white">
                    {webcamError ? "Camera Unavailable" : "Camera Off (Voice-Only Mode)"}
                  </p>
                  {webcamError && (
                    <p className="text-xs leading-relaxed text-slate-400">{webcamError}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setWebcamError(null);
                    setWebcamEnabled(true);
                  }}
                  className="mt-1 h-8 border-white/20 text-xs text-white hover:bg-white/10"
                >
                  <RefreshCw className="mr-1.5 h-3 w-3" /> Retry Camera
                </Button>
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 flex items-end bg-linear-to-t from-black/60 via-transparent to-transparent p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/90 shadow-lg">
                  {cameraActive ? (
                    <Video className="h-4 w-4 text-white" />
                  ) : (
                    <VideoOff className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-white/70 uppercase">
                    Presence Camera
                  </p>
                  <p className="text-xs font-semibold text-white/90">
                    {cameraActive ? "Live Preview" : "Voice / Text Mode"}
                  </p>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              type="button"
              className="absolute right-3 top-3 h-7 bg-black/40 text-[11px] font-semibold text-white/90 backdrop-blur-md hover:bg-black/60"
              onClick={() => {
                if (webcamEnabled) {
                  if (videoStreamRef.current) {
                    videoStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
                    videoStreamRef.current = null;
                  }
                  setWebcamEnabled(false);
                } else {
                  setWebcamError(null);
                  setWebcamEnabled(true);
                }
              }}
            >
              {cameraActive ? "Turn Off" : "Turn On"}
            </Button>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <VideoOff className="h-3.5 w-3.5" />
            Self-monitoring only — no video is recorded or uploaded.
          </p>
        </div>
      </div>
    </div>
  );
};
