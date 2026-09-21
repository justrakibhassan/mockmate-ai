"use client";

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import Webcam from "react-webcam";
import {
  BrainCircuit,
  Video,
  VideoOff,
  Info,
  ShieldCheck,
  AlertCircle,
  Mic,
  MicOff,
  FileText,
  Clock,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Headphones,
  Activity,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface InterviewRoomViewProps {
  interview: {
    _id: string;
    jobPosition: string;
    jobDesc: string;
    jobExperience: string;
    questions?: string[];
  };
}

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function parseCameraError(err: unknown): string {
  if (typeof err === "string") return err;
  const error = err as { name?: string; message?: string };
  if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
    return "Camera permission denied. Allow camera access in your browser.";
  }
  if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
    return "No camera device detected. Please connect a webcam.";
  }
  if (error?.name === "NotReadableError" || error?.name === "TrackStartError") {
    return "Camera is in use by another app (Zoom, Teams, or another tab).";
  }
  return error?.message || "Failed to access camera.";
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const STAGES = [
  { title: "Architecture & Systems", desc: "Foundational architecture, design principles, and patterns" },
  { title: "Technical Deep-Dive", desc: "Algorithms, data structures, and framework specifics" },
  { title: "Scalability & Caching", desc: "High throughput, distributed caching, and performance" },
  { title: "Debugging & Edge Cases", desc: "Failure recovery, race conditions, and error mitigation" },
  { title: "Trade-offs & Leadership", desc: "Engineering trade-offs, decision-making, and communication" },
];

export const InterviewRoomView = ({ interview }: InterviewRoomViewProps) => {
  const mounted = useMounted();
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  // Microphone VU Meter State
  const [micTesting, setMicTesting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [micStatus, setMicStatus] = useState<"untested" | "requesting" | "active" | "denied">("untested");
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Speaker Test State
  const [testingSpeaker, setTestingSpeaker] = useState(false);

  // Start Mic Audio VU Meter
  const startMicTest = useCallback(async () => {
    try {
      setMicStatus("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      micStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const poll = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        if (normalized > 5) {
          setMicStatus("active");
        }

        animFrameRef.current = requestAnimationFrame(poll);
      };

      poll();
      setMicTesting(true);
      setMicStatus("active");
    } catch (err) {
      console.error("Mic test error:", err);
      setMicStatus("denied");
      setMicTesting(false);
      toast.error("Microphone access denied. Please grant microphone access in browser settings.");
    }
  }, []);

  // Stop Mic Audio VU Meter
  const stopMicTest = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setMicTesting(false);
    setAudioLevel(0);
  }, []);

  // Speaker Sound Test
  const testSpeaker = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Speech synthesis is not supported in this browser.");
      return;
    }

    if (testingSpeaker) {
      window.speechSynthesis.cancel();
      setTestingSpeaker(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      "Audio output check successful. Welcome to your MockMate AI technical interview. If you can hear this clearly, your speaker is configured properly."
    );

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Samantha") ||
          v.name.includes("Aria") ||
          v.name.includes("Jenny") ||
          v.name.includes("Google US English") ||
          v.name.includes("Zira") ||
          v.name.includes("Sarah"))
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setTestingSpeaker(true);
    utterance.onend = () => setTestingSpeaker(false);
    utterance.onerror = () => setTestingSpeaker(false);

    window.speechSynthesis.speak(utterance);
  }, [testingSpeaker]);

  // Clean up media and synthesis on unmount
  useEffect(() => {
    return () => {
      stopMicTest();
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopMicTest]);

  const questionCount = interview.questions?.length ?? 5;
  const speechSupported =
    mounted &&
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  return (
    <div className="relative mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 sm:py-10 md:py-14">
      {/* Ambient backdrop glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-linear-to-b from-primary/10 via-primary/5 to-transparent blur-3xl"
      />

      {/* Top Header Bar */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-6 sm:mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold tracking-wide text-primary"
            >
              <BrainCircuit className="h-3.5 w-3.5 mr-1" />
              Green Room & Tech Readiness
            </Badge>
            <Badge
              variant="outline"
              className="border-border/80 bg-background/60 font-mono text-[11px] text-muted-foreground"
            >
              #{interview._id.slice(-6).toUpperCase()}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {interview.jobPosition} Technical Session
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted-foreground">
            Verify your camera, microphone levels, and speaker audio output before entering the live 2-way interview room.
          </p>
        </div>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <Link href="/dashboard">← Back to Dashboard</Link>
        </Button>
      </motion.div>

      {/* Main Grid: Left Brief & Agenda / Right Hardware Green Room */}
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Column (7 Cols): Session Brief, Interviewer Preview, Structured Agenda */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
          className="space-y-5 lg:col-span-7"
        >
          {/* Card 1: Job Brief Details */}
          <Card className="border border-border/80 bg-card/70 shadow-sm backdrop-blur-md">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-background/60 p-3.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5 text-primary" /> Experience
                  </p>
                  <p className="mt-1 text-sm sm:text-base font-bold text-foreground">
                    {interview.jobExperience} {interview.jobExperience === "1" ? "Year" : "Years"}
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-background/60 p-3.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Format
                  </p>
                  <p className="mt-1 text-sm sm:text-base font-bold text-foreground">
                    {questionCount} Questions
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1 rounded-xl border border-border/70 bg-background/60 p-3.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <Activity className="h-3.5 w-3.5 text-primary" /> Est. Time
                  </p>
                  <p className="mt-1 text-sm sm:text-base font-bold text-foreground">
                    ~15–20 Mins
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  Target Tech Stack & Role Context
                </p>
                <p className="mt-1.5 rounded-xl border border-border/70 bg-background/50 p-3.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {interview.jobDesc}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: AI Lead Interviewer Persona */}
          <Card className="border border-primary/20 bg-linear-to-br from-primary/5 via-card/70 to-card/90 shadow-sm">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-inner">
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                  <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">Sarah</h3>
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-500 font-semibold">
                      Ready to Interview
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Lead AI Technical Evaluator · Executive Panel</p>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-foreground/90">
                    &ldquo;Welcome! I will guide you question-by-question through architecture, engineering depth, and problem solving. Speak naturally as you would in an authentic technical interview.&rdquo;
                  </p>
                </div>
              </div>

              {/* 5-Stage Agenda */}
              <div className="border-t border-border/60 pt-3">
                <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" /> Session Agenda Roadmap
                </p>
                <div className="space-y-1.5">
                  {STAGES.slice(0, questionCount).map((stage, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-3 py-1.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-foreground">{stage.title}</span>
                      </div>
                      <span className="hidden sm:inline text-[11px] text-muted-foreground">
                        {stage.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Pro-Tips & Privacy */}
          <Card className="border border-border/70 bg-card/60 shadow-sm">
            <CardContent className="p-5 sm:p-6 space-y-3">
              <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-foreground uppercase">
                <Info className="h-3.5 w-3.5 text-primary" /> Candidate Best Practices
              </p>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>
                    <strong>STAR Framework:</strong> Structure answers with Situation, Task, Action, and Result for maximum scoring impact.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>
                    <strong>100% Client-Side Privacy:</strong> Camera and microphone streams remain strictly in your browser. Video is never uploaded.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span>
                    <strong>Pacing:</strong> Aim for ~1.5 to 2 minutes per answer. You can review and edit transcription in the live drawer.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column (5 Cols): Live Hardware Green Room (Camera, Mic VU, Speaker) */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.16, ease: "easeOut" }}
          className="space-y-4 lg:col-span-5 lg:sticky lg:top-6"
        >
          {/* Tile 1: Live Webcam Preview Stage */}
          <Card className="overflow-hidden border border-border/80 bg-slate-950 shadow-xl">
            <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
              {webcamEnabled ? (
                <Webcam
                  mirrored={true}
                  audio={false}
                  className="h-full w-full object-cover"
                  onUserMedia={(stream) => {
                    videoStreamRef.current = stream;
                    setWebcamActive(true);
                    setWebcamError(null);
                  }}
                  onUserMediaError={(err) => {
                    setWebcamActive(false);
                    setWebcamError(parseCameraError(err));
                  }}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <VideoOff className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Camera Paused</p>
                    <p className="text-xs text-slate-400">Voice-only mode is fully supported.</p>
                  </div>
                </div>
              )}

              {/* Status Badge in Video Corner */}
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[11px] text-white backdrop-blur-md">
                <span
                  className={`h-2 w-2 rounded-full ${
                    webcamActive && webcamEnabled
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-slate-500"
                  }`}
                />
                <span className="font-semibold">
                  {webcamActive && webcamEnabled ? "Live Camera" : "Offline"}
                </span>
              </div>

              {/* Camera Toggle Button in Video Corner */}
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => {
                  if (webcamEnabled) {
                    if (videoStreamRef.current) {
                      videoStreamRef.current.getTracks().forEach((t) => t.stop());
                      videoStreamRef.current = null;
                    }
                    setWebcamEnabled(false);
                    setWebcamActive(false);
                  } else {
                    setWebcamError(null);
                    setWebcamEnabled(true);
                  }
                }}
                className="absolute right-3 top-3 h-8 rounded-full border border-white/15 bg-black/60 px-3 text-xs font-semibold text-white backdrop-blur-md hover:bg-black/80"
              >
                {webcamEnabled ? (
                  <>
                    <VideoOff className="mr-1.5 h-3.5 w-3.5" /> Turn Off
                  </>
                ) : (
                  <>
                    <Video className="mr-1.5 h-3.5 w-3.5" /> Enable
                  </>
                )}
              </Button>
            </div>

            {webcamError && (
              <div className="border-t border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{webcamError}</span>
              </div>
            )}
          </Card>

          {/* Tile 2: Live Microphone Audio VU Meter */}
          <Card className="border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    micTesting
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {micTesting ? <Mic className="h-4 w-4 animate-pulse" /> : <MicOff className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Microphone Input Level</p>
                  <p className="text-[11px] text-muted-foreground">
                    {micTesting
                      ? audioLevel > 5
                        ? "Audio input detected clearly"
                        : "Speak to test levels..."
                      : "Click Test to verify your mic"}
                  </p>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`text-[10px] font-semibold ${
                  micStatus === "active"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                    : micStatus === "denied"
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
                      : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {micStatus === "active"
                  ? "Mic Ready"
                  : micStatus === "denied"
                    ? "Blocked"
                    : "Untested"}
              </Badge>
            </div>

            {/* Visual VU Meter Equalizer (12 bars) */}
            <div className="rounded-xl border border-border/70 bg-background/80 p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 flex-1 h-6">
                {Array.from({ length: 16 }).map((_, idx) => {
                  const threshold = ((idx + 1) / 16) * 80;
                  const active = micTesting && audioLevel >= threshold;
                  const isHigh = idx >= 13;
                  const isMid = idx >= 8;
                  return (
                    <span
                      key={idx}
                      className={`w-full rounded-full transition-all duration-75 ${
                        active
                          ? isHigh
                            ? "bg-amber-400 h-5"
                            : isMid
                              ? "bg-emerald-400 h-4"
                              : "bg-primary h-3"
                          : "bg-muted h-1.5"
                      }`}
                    />
                  );
                })}
              </div>

              <span className="text-[10px] font-mono font-bold text-muted-foreground w-8 text-right">
                {audioLevel}%
              </span>
            </div>

            <Button
              variant={micTesting ? "secondary" : "outline"}
              size="sm"
              onClick={micTesting ? stopMicTest : startMicTest}
              className="w-full h-9 text-xs font-semibold"
            >
              {micTesting ? (
                <>
                  <MicOff className="mr-1.5 h-3.5 w-3.5" /> Stop Mic Test
                </>
              ) : (
                <>
                  <Mic className="mr-1.5 h-3.5 w-3.5 text-primary" /> Test Microphone Level
                </>
              )}
            </Button>
          </Card>

          {/* Tile 3: Speaker / Sound Output Test */}
          <Card className="border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    testingSpeaker
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-500"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  <Headphones className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Speaker / Audio Output</p>
                  <p className="text-[11px] text-muted-foreground">Hear AI interviewer speech check</p>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`text-[10px] font-semibold ${
                  testingSpeaker
                    ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 animate-pulse"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {testingSpeaker ? "Playing..." : "Ready"}
              </Badge>
            </div>

            <Button
              variant={testingSpeaker ? "destructive" : "outline"}
              size="sm"
              onClick={testSpeaker}
              className="w-full h-9 text-xs font-semibold"
            >
              {testingSpeaker ? (
                <>
                  <VolumeX className="mr-1.5 h-3.5 w-3.5" /> Stop Audio Test
                </>
              ) : (
                <>
                  <Volume2 className="mr-1.5 h-3.5 w-3.5 text-cyan-500" /> Play Speaker Test Sample
                </>
              )}
            </Button>
          </Card>

          {/* Hardware Checklist Pill Summary */}
          <div className="rounded-xl border border-border/70 bg-background/50 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Video className="h-3.5 w-3.5 text-primary" /> Camera
              </span>
              <span className="font-semibold text-foreground">
                {webcamActive ? "Connected & Live" : "Voice-Only Mode"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Mic className="h-3.5 w-3.5 text-primary" /> Microphone
              </span>
              <span className="font-semibold text-foreground">
                {micStatus === "active"
                  ? "Active & Tested"
                  : micStatus === "denied"
                    ? "Permission Required"
                    : "Ready for Call"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Speech Engine
              </span>
              <span className="font-semibold text-foreground">
                {speechSupported ? "Web Speech Active" : "Text Mode Ready"}
              </span>
            </div>
          </div>

          {/* Primary Action Button: Enter Room */}
          <Button
            asChild
            className="h-12 sm:h-14 w-full bg-linear-to-r from-primary to-indigo-600 text-sm sm:text-base font-bold shadow-xl shadow-primary/25 transition-transform hover:scale-[1.01] active:scale-[0.99] text-white"
          >
            <Link href={`/interview/${interview._id}/start`}>
              <span>Enter Live Interview Room</span>
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            You can still mute or switch camera on/off anytime inside the room.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
