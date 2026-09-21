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
  Mic,
  Square,
  Sparkles,
  PhoneOff,
  Clock,
  User,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RecordAnswer } from "../components/record-answer";
import { completeAndEvaluateInterview } from "@/actions/interview";
import SpeechRecognition from "react-speech-recognition";

interface StartInterviewViewProps {
  interview: {
    _id: string;
    questions: string[];
    jobPosition: string;
    answers?: { question: string }[];
  };
}

const QUESTION_STAGES = [
  { tag: "Architecture & System Thinking", color: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  { tag: "Technical Deep-Dive", color: "border-purple-500/30 bg-purple-500/10 text-purple-400" },
  { tag: "Scalability, Caching & Performance", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  { tag: "Production Debugging & Edge Cases", color: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  { tag: "Trade-offs & Engineering Leadership", color: "border-rose-500/30 bg-rose-500/10 text-rose-400" },
];

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

interface VoicePersona {
  voice: SpeechSynthesisVoice | null;
  name: string;
}

function getBestVoiceAndPersona(): VoicePersona {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { voice: null, name: "Sarah" };
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) {
    return { voice: null, name: "Sarah" };
  }

  // 1. Prioritize natural sounding female English voices
  const femaleVoice = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Samantha") ||
        v.name.includes("Aria") ||
        v.name.includes("Jenny") ||
        v.name.includes("Zira") ||
        v.name.includes("Sonia") ||
        v.name.includes("Victoria") ||
        v.name.includes("Karen") ||
        v.name.includes("Google US English") ||
        v.name.toLowerCase().includes("female") ||
        v.name.includes("Natasha") ||
        v.name.includes("Ava") ||
        v.name.includes("Emma") ||
        v.name.includes("Ana"))
  );

  if (femaleVoice) {
    let name = "Sarah";
    if (femaleVoice.name.includes("Samantha")) name = "Samantha";
    else if (femaleVoice.name.includes("Aria")) name = "Aria";
    else if (femaleVoice.name.includes("Jenny")) name = "Jenny";
    else if (femaleVoice.name.includes("Victoria")) name = "Victoria";
    else if (femaleVoice.name.includes("Zira")) name = "Zira";
    else if (femaleVoice.name.includes("Emma")) name = "Emma";
    else if (femaleVoice.name.includes("Karen")) name = "Karen";
    else if (femaleVoice.name.includes("Sonia")) name = "Sonia";
    else if (femaleVoice.name.includes("Natasha")) name = "Natasha";
    else if (femaleVoice.name.includes("Ava")) name = "Ava";
    else name = "Sarah";
    return { voice: femaleVoice, name };
  }

  // 2. Check for male voices
  const maleVoice = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Guy") ||
        v.name.includes("David") ||
        v.name.includes("Daniel") ||
        v.name.includes("George") ||
        v.name.toLowerCase().includes("male"))
  );

  if (maleVoice) {
    let name = "Alex";
    if (maleVoice.name.includes("Daniel")) name = "Daniel";
    else if (maleVoice.name.includes("David")) name = "David";
    else name = "Alex";
    return { voice: maleVoice, name };
  }

  // 3. Fallback: Check if default voice is female
  const fallback =
    voices.find(
      (v) => v.lang.startsWith("en") && !v.name.toLowerCase().includes("espeak")
    ) || voices[0];

  const isFemale =
    /female|woman|girl|samantha|zira|aria|jenny|victoria|karen|susan|linda|sarah|google us english/i.test(
      fallback?.name || ""
    );

  return {
    voice: fallback || null,
    name: isFemale ? "Sarah" : "Alex",
  };
}

const emptySubscribe = () => () => {};
function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
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
  const [candidateListening, setCandidateListening] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [startTime, setStartTime] = useState(() => Date.now());
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const [persona, setPersona] = useState<VoicePersona>(() => getBestVoiceAndPersona());
  const mounted = useMounted();
  const router = useRouter();

  // Dynamically resolve and synchronize interviewer voice persona
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const handleVoices = () => {
      setPersona(getBestVoiceAndPersona());
    };

    handleVoices();
    window.speechSynthesis.addEventListener("voiceschanged", handleVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoices);
    };
  }, []);

  // Clean up media tracks when leaving the interview room
  useEffect(() => {
    return () => {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        videoStreamRef.current = null;
      }
    };
  }, []);

  // Per-question timer without cascading setState in effect body
  useEffect(() => {
    const interval = setInterval(() => {
      setQuestionSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const questions = interview.questions;
  const progress = Math.round((answered.size / questions.length) * 100);
  const currentStage = QUESTION_STAGES[activeQuestionIndex % QUESTION_STAGES.length];

  // Natural AI Text-to-Speech
  const readQuestion = useCallback(
    (text: string) => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const currentVoice = persona.voice || getBestVoiceAndPersona().voice;
        if (currentVoice) {
          utterance.voice = currentVoice;
        }
        utterance.rate = 0.96;
        utterance.pitch = 1.0;
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    },
    [persona.voice]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  const handleSwitchQuestion = useCallback(
    (newIndex: number) => {
      stopSpeaking();
      SpeechRecognition.stopListening();
      setActiveQuestionIndex(newIndex);
      setStartTime(Date.now());
      setQuestionSeconds(0);
    },
    [stopSpeaking]
  );

  // Auto-read question when switching questions
  useEffect(() => {
    readQuestion(questions[activeQuestionIndex]);
  }, [activeQuestionIndex, questions, readQuestion]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
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
    SpeechRecognition.stopListening();

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

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`;
  };

  const cameraActive = webcamEnabled && !webcamError;
  const isCurrentAnswered = answered.has(questions[activeQuestionIndex]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Setting up secure virtual interview room...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Meeting Header Bar (Google Meet Style) */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
          {/* Left: Meeting Details & Rec Badge */}
          <div className="flex items-center gap-2 min-w-0 sm:gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-rose-500 shrink-0 sm:text-[11px] sm:px-2.5 sm:py-1">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-rose-500" />
              </span>
              <span className="hidden xs:inline">REC · </span>LIVE
            </div>

            <div className="hidden h-4 w-[1px] bg-border sm:block" />

            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-foreground max-w-[110px] xs:max-w-[150px] sm:max-w-xs md:max-w-md sm:text-sm">
                {interview.jobPosition}
              </p>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                MockMate AI Executive Technical Session
              </p>
            </div>
          </div>

          {/* Center: Question Timer & Pacing */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-2.5 py-0.5 text-xs font-mono font-medium shadow-xs sm:px-3 sm:py-1">
              <Clock className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
              <span>{formatTimer(questionSeconds)}</span>
              <span className="hidden text-[10px] text-muted-foreground md:inline">
                {questionSeconds > 150 ? "(Wrap up)" : "(Pace: ~2m)"}
              </span>
            </div>
          </div>

          {/* Right: Step Indicator & Completion Badge */}
          <div className="flex items-center gap-2 shrink-0 sm:gap-3">
            <div className="hidden items-center gap-1 sm:flex">
              {questions.map((q, idx) => {
                const isAns = answered.has(q);
                const isCurr = activeQuestionIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSwitchQuestion(idx)}
                    aria-label={`Jump to question ${idx + 1}`}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                      isCurr
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                        : isAns
                          ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/30"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {isAns ? "✓" : idx + 1}
                  </button>
                );
              })}
            </div>

            <Badge
              variant="outline"
              className="border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 sm:px-2.5 sm:text-xs"
            >
              {progress}%<span className="hidden xs:inline">&nbsp;Done</span>
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Conference Room Stage */}
      <main className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-6 space-y-3 sm:space-y-6">
        {/* 2-Way Video Conference Grid */}
        <div className="grid gap-3 sm:gap-6 lg:grid-cols-2">
          {/* Tile 1: AI Lead Interviewer Tile */}
          <div className="relative flex min-h-[300px] sm:min-h-[360px] md:min-h-[420px] flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-slate-950 p-4 sm:p-5 shadow-xl">
            {/* Ambient Lighting Gradient */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-radial from-primary/10 via-transparent to-transparent opacity-70"
            />

            {/* Top Bar of AI Tile */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs backdrop-blur-md">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  <BrainCircuit className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold text-white">{persona.name}</span>
                <span className="text-[10px] text-slate-400">· Lead AI Interviewer</span>
              </div>

              {/* AI Status Badge */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`border text-[11px] font-medium backdrop-blur-md ${
                    speaking
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400 animate-pulse"
                      : candidateListening
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-white/10 bg-black/30 text-slate-400"
                  }`}
                >
                  {speaking ? (
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="h-3 w-3" /> Speaking...
                    </span>
                  ) : candidateListening ? (
                    <span className="flex items-center gap-1.5">
                      <Radio className="h-3 w-3 animate-pulse" /> Listening to you...
                    </span>
                  ) : (
                    "Ready"
                  )}
                </Badge>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full border border-white/10 bg-black/40 text-slate-300 hover:bg-white/10 hover:text-white"
                  onClick={() =>
                    speaking ? stopSpeaking() : readQuestion(questions[activeQuestionIndex])
                  }
                  title={speaking ? "Stop voice" : "Re-read question"}
                >
                  {speaking ? (
                    <VolumeX className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Center: Dynamic AI Avatar & Sound Waveform */}
            <div className="relative z-10 my-auto flex flex-col items-center justify-center py-4 sm:py-6">
              <div className="relative flex h-20 w-20 sm:h-28 sm:w-28 md:h-32 md:w-32 items-center justify-center">
                {/* Sonic Pulses when AI is speaking */}
                {speaking && (
                  <>
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                    <span className="absolute -inset-3 animate-pulse rounded-full border border-primary/30" />
                  </>
                )}

                {/* Avatar Circle */}
                <div
                  className={`flex h-18 w-18 sm:h-24 sm:w-24 md:h-28 md:w-28 items-center justify-center rounded-full border shadow-2xl transition-all duration-300 ${
                    speaking
                      ? "border-primary bg-linear-to-b from-primary/30 to-indigo-950/60 shadow-primary/40 ring-4 ring-primary/20"
                      : candidateListening
                        ? "border-emerald-500/60 bg-linear-to-b from-emerald-950/40 to-slate-950 shadow-emerald-500/20 ring-4 ring-emerald-500/20"
                        : "border-white/10 bg-slate-900 shadow-black"
                  }`}
                >
                  <Sparkles
                    className={`h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 transition-colors duration-300 ${
                      speaking
                        ? "text-cyan-400"
                        : candidateListening
                          ? "text-emerald-400"
                          : "text-slate-400"
                    }`}
                  />
                </div>
              </div>

              {/* Dynamic Equalizer Bars */}
              <div className="mt-3 sm:mt-4 flex h-5 sm:h-6 items-center gap-1">
                {[40, 70, 100, 60, 80, 50, 90].map((height, i) => (
                  <motion.span
                    key={i}
                    animate={
                      speaking
                        ? { height: [`${Math.max(15, height * 0.2)}%`, `${height}%`, `${Math.max(20, height * 0.3)}%`] }
                        : candidateListening
                          ? { height: ["20%", "50%", "20%"] }
                          : { height: "15%" }
                    }
                    transition={{
                      repeat: Infinity,
                      duration: speaking ? 0.4 + i * 0.08 : 1.2,
                      ease: "easeInOut",
                    }}
                    className={`w-0.5 sm:w-1 rounded-full ${
                      speaking
                        ? "bg-primary"
                        : candidateListening
                          ? "bg-emerald-500"
                          : "bg-slate-700"
                    }`}
                    style={{ minHeight: "4px" }}
                  />
                ))}
              </div>
            </div>

            {/* Bottom: Question Closed-Captions Overlay */}
            <div className="relative z-10 space-y-1.5 sm:space-y-2 rounded-xl border border-white/10 bg-black/60 p-3 sm:p-4 backdrop-blur-md">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className={`text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase ${currentStage.color}`}
                >
                  {currentStage.tag}
                </Badge>
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">
                  Question {activeQuestionIndex + 1} of {questions.length}
                </span>
              </div>

              <p className="text-xs sm:text-sm md:text-base font-semibold text-white leading-snug">
                {questions[activeQuestionIndex]}
              </p>
            </div>
          </div>

          {/* Tile 2: Candidate Live Camera Tile (You) */}
          <div className="relative flex aspect-video min-h-[220px] sm:min-h-[360px] md:min-h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-slate-950 shadow-xl">
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
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 sm:gap-3 p-4 sm:p-6 text-center">
                <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <User className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
                </div>
                <div className="max-w-xs space-y-1">
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    {webcamError ? "Camera Unavailable" : "Camera is Paused"}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    {webcamError || "Voice-only mode is active. You can still answer via microphone."}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setWebcamError(null);
                    setWebcamEnabled(true);
                  }}
                  className="mt-1 border-white/20 text-[11px] sm:text-xs text-white hover:bg-white/10"
                >
                  <RefreshCw className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" /> Enable Camera
                </Button>
              </div>
            )}

            {/* Top-Right Badge: Video Quality */}
            <div className="absolute right-3 top-3 sm:right-4 sm:top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-white/90 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>HD 720p</span>
            </div>

            {/* Bottom Bar: Candidate Name & Mic Audio Level */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/80 via-black/40 to-transparent p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/10 bg-black/50 px-2.5 py-0.5 sm:px-3 sm:py-1 backdrop-blur-md">
                <span className="text-[11px] sm:text-xs font-semibold text-white">You</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400">· Candidate</span>
              </div>

              {/* Live Mic Indicator */}
              <div
                className={`flex items-center gap-1 sm:gap-1.5 rounded-full border px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-medium backdrop-blur-md ${
                  candidateListening
                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                    : "border-white/10 bg-black/50 text-slate-400"
                }`}
              >
                {candidateListening ? (
                  <>
                    <Mic className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-400" />
                    <span className="text-[10px] sm:text-[11px] font-bold">Speaking</span>
                    <div className="flex items-center gap-0.5 ml-1">
                      <span className="h-2 w-0.5 sm:h-2.5 animate-pulse rounded-full bg-emerald-400 [animation-delay:0ms]" />
                      <span className="h-3 w-0.5 sm:h-3.5 animate-pulse rounded-full bg-emerald-400 [animation-delay:150ms]" />
                      <span className="h-1.5 w-0.5 sm:h-2 animate-pulse rounded-full bg-emerald-400 [animation-delay:300ms]" />
                    </div>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                    <span className="text-[10px] sm:text-[11px]">Mic Idle</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Answer Subtitles & Response Drawer */}
        <RecordAnswer
          interviewId={interview._id}
          activeQuestion={questions[activeQuestionIndex]}
          onSaved={(question) => setAnswered((prev) => new Set(prev).add(question))}
          onListeningChange={setCandidateListening}
          isSavedExternal={isCurrentAnswered}
        />
      </main>

      {/* Floating Bottom Control Dock (Google Meet / Zoom Style) */}
      <footer className="sticky bottom-2 sm:bottom-3 z-30 mx-auto max-w-3xl px-2 sm:px-4">
        <div className="flex items-center justify-between gap-1.5 sm:gap-4 rounded-full border border-border/80 bg-background/95 p-1.5 sm:px-4 shadow-2xl backdrop-blur-xl">
          {/* Left: Device Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Primary Mic Toggle */}
            <Button
              size="sm"
              variant={candidateListening ? "destructive" : "default"}
              onClick={() => {
                if (candidateListening) {
                  SpeechRecognition.stopListening();
                } else {
                  SpeechRecognition.startListening({ continuous: true });
                }
              }}
              className={`h-9 sm:h-10 px-2.5 sm:px-4 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                candidateListening
                  ? "bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/30 text-white animate-pulse"
                  : "shadow-md shadow-primary/20"
              }`}
            >
              {candidateListening ? (
                <>
                  <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 fill-current" />
                  <span className="hidden sm:inline">Finish Speaking</span>
                  <span className="sm:hidden">Finish</span>
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Start Answering</span>
                  <span className="sm:hidden">Answer</span>
                </>
              )}
            </Button>

            {/* Camera Toggle */}
            <Button
              variant="outline"
              size="icon"
              className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full border-border/70 ${
                !cameraActive ? "text-amber-500 bg-amber-500/10 border-amber-500/30" : ""
              }`}
              onClick={() => {
                if (webcamEnabled) {
                  if (videoStreamRef.current) {
                    videoStreamRef.current.getTracks().forEach((t) => t.stop());
                    videoStreamRef.current = null;
                  }
                  setWebcamEnabled(false);
                } else {
                  setWebcamError(null);
                  setWebcamEnabled(true);
                }
              }}
              title={cameraActive ? "Turn off camera" : "Turn on camera"}
            >
              {cameraActive ? <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <VideoOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </Button>

            {/* Repeat Question Voice */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-border/70"
              onClick={() =>
                speaking ? stopSpeaking() : readQuestion(questions[activeQuestionIndex])
              }
              title={`Replay ${persona.name}'s voice`}
            >
              {speaking ? (
                <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>

          {/* Center / Right: Question Navigation & Submit */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={activeQuestionIndex === 0}
              onClick={() => handleSwitchQuestion(activeQuestionIndex - 1)}
              className="h-9 sm:h-10 rounded-full px-2 sm:px-3 text-xs font-semibold"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="hidden md:inline">Previous</span>
            </Button>

            {activeQuestionIndex === questions.length - 1 ? (
              <Button
                size="sm"
                disabled={completing}
                onClick={onEndInterview}
                className="h-9 sm:h-10 rounded-full bg-linear-to-r from-emerald-600 to-teal-500 px-3 sm:px-4 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 text-white"
              >
                {completing ? (
                  <>
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    <span className="hidden sm:inline">Evaluating...</span>
                    <span className="sm:hidden">Evaluating</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    <span className="hidden xs:inline">Finish Session</span>
                    <span className="xs:hidden">Finish</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleSwitchQuestion(activeQuestionIndex + 1)}
                className="h-9 sm:h-10 rounded-full font-bold px-3 sm:px-4 text-xs sm:text-sm shadow-md shadow-primary/20"
              >
                <span className="hidden xs:inline">Next Question</span>
                <span className="xs:hidden">Next</span>
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            )}

            {/* End Call Button (Google Meet Red Phone) */}
            <Button
              variant="destructive"
              size="icon"
              onClick={onEndInterview}
              disabled={completing}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30"
              title="Leave / End Interview"
            >
              <PhoneOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};
