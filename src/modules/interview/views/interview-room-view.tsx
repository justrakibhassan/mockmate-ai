"use client";

import React, { useState } from "react";
import Link from "next/link";
import Webcam from "react-webcam";
import {
  BrainCircuit,
  Video,
  VideoOff,
  Info,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Mic,
  FileText,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface InterviewRoomViewProps {
  interview: {
    _id: string;
    jobPosition: string;
    jobDesc: string;
    jobExperience: string;
    questions?: string[];
  };
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export const InterviewRoomView = ({ interview }: InterviewRoomViewProps) => {
  const [webcamEnabled, setWebcamEnabled] = useState(false);

  const questionCount = interview.questions?.length ?? 5;

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-10 md:py-16">
      {/* Subtle backdrop accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-linear-to-b from-primary/8 to-transparent blur-2xl"
      />

      {/* Header */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-primary uppercase">
            <BrainCircuit className="h-4 w-4" />
            Pre-Interview Check
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {interview.jobPosition} Session
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Review the brief, set up your camera, and enter the room when you
            are ready.
          </p>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 border-border bg-background px-3 py-1 font-mono text-xs text-muted-foreground"
        >
          #{interview._id.slice(-6).toUpperCase()}
        </Badge>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
        {/* Left: Brief + Checklist */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
          className="space-y-5 lg:col-span-3"
        >
          <Card className="border border-border/70 bg-card/60 shadow-sm">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div>
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Position
                </p>
                <p className="mt-1.5 text-lg font-semibold text-foreground">
                  {interview.jobPosition}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border/70 bg-background/50 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Experience
                  </p>
                  <p className="mt-1.5 font-semibold text-foreground">
                    {interview.jobExperience} {interview.jobExperience === "1" ? "Year" : "Years"}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/50 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> Questions
                  </p>
                  <p className="mt-1.5 font-semibold text-foreground">
                    {questionCount} Tailored by AI
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Job Description
                </p>
                <p className="mt-2 rounded-xl border border-border/70 bg-background/50 p-4 text-sm leading-relaxed text-muted-foreground">
                  {interview.jobDesc}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card className="border border-border/70 bg-card/60 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <p className="mb-5 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Info className="h-4 w-4 text-primary" />
                Before you begin
              </p>
              <ul className="space-y-3.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  Find a quiet spot — answers are captured via voice or typing.
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  The camera preview stays in your browser. Nothing is recorded
                  or uploaded.
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  Avoid refreshing mid-session — your progress is saved per
                  question.
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Camera card */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.16, ease: "easeOut" }}
          className="space-y-4 lg:col-span-2 lg:sticky lg:top-6"
        >
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/70 bg-slate-950 shadow-lg">
            {webcamEnabled ? (
              <Webcam
                mirrored={true}
                className="h-full w-full object-cover opacity-90"
                onUserMedia={() => setWebcamEnabled(true)}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <VideoOff className="h-6 w-6 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-300">
                    Camera is off
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    You can continue in voice-only mode
                  </p>
                </div>
              </div>
            )}

            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 backdrop-blur-md">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  webcamEnabled ? "animate-pulse bg-emerald-400" : "bg-slate-500"
                }`}
              />
              <span className="text-[10px] font-bold tracking-widest text-white/90 uppercase">
                {webcamEnabled ? "Live" : "Offline"}
              </span>
            </div>
          </div>

          <Button
            variant={webcamEnabled ? "outline" : "default"}
            className="h-11 w-full font-semibold"
            onClick={() => setWebcamEnabled(!webcamEnabled)}
          >
            {webcamEnabled ? (
              <>
                <VideoOff className="mr-2 h-4 w-4" /> Turn Camera Off
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" /> Enable Camera
              </>
            )}
          </Button>

          <Button
            asChild
            className="h-13 w-full bg-linear-to-r from-primary to-indigo-600 py-3.5 text-base font-bold shadow-lg shadow-primary/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Link href={`/interview/${interview._id}/start`}>
              <Mic className="mr-2 h-5 w-5" />
              Enter Interview Room
            </Link>
          </Button>

          {!webcamEnabled && (
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              Voice-only mode — camera stays private either way.
            </p>
          )}
        </motion.div>
      </div>

      {/* Bottom CTA strip */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.24, ease: "easeOut" }}
        className="mt-10 hidden items-center justify-between rounded-2xl border border-border/70 bg-card/60 px-6 py-5 shadow-sm lg:flex"
      >
        <p className="flex items-center gap-3 text-sm text-muted-foreground">
          <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
          <span>
            Roughly <strong className="text-foreground">15–20 minutes</strong>{" "}
            for a full session. Take it at your own pace.
          </span>
        </p>
        <Button
          asChild
          variant="ghost"
          className="font-semibold text-primary hover:bg-primary/5"
        >
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </motion.div>
    </div>
  );
};
