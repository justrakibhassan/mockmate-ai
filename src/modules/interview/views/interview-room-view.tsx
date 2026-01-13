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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface InterviewRoomViewProps {
  interview: {
    _id: string;
    jobPosition: string;
    jobDesc: string;
    jobExperience: string;
  };
}

export const InterviewRoomView = ({ interview }: InterviewRoomViewProps) => {
  const [webcamEnabled, setWebcamEnabled] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Interview <span className="text-primary italic">Preparation</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Review the job details and ensure your camera is set up correctly.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-primary/20 bg-primary/5 px-4 py-1 text-primary"
        >
          ID: {interview._id.slice(-6).toUpperCase()}
        </Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Panel: Job Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <Card className="border-none bg-background/50 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <BrainCircuit className="h-6 w-6 text-primary" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Position
                </h4>
                <p className="text-lg font-medium text-foreground">
                  {interview.jobPosition}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Experience
                  </h4>
                  <p className="font-medium">{interview.jobExperience} Years</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </h4>
                  <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none">
                    Active
                  </Badge>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Job Description
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground italic">
                  &quot;{interview.jobDesc}&quot;
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-primary/5 shadow-none ring-1 ring-primary/10">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Info className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-foreground">
                    Important Instructions
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      Ensure you are in a quiet, well-lit environment.
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      We do not record your video; AI analyzes it locally.
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Don&apos;t refresh the page during the interview.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Panel: Webcam Setup */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col gap-6"
        >
          <div className="relative aspect-video overflow-hidden rounded-3xl bg-slate-900 shadow-2xl ring-1 ring-white/10">
            {webcamEnabled ? (
              <Webcam
                onUserMedia={() => console.log("Webcam ready")}
                mirrored={true}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-slate-400">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/50">
                  <VideoOff className="h-10 w-10" />
                </div>
                <p className="text-sm font-medium">
                  Camera is currently disabled
                </p>
              </div>
            )}

            {/* Status Overlays */}
            <div className="absolute left-6 top-6 flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full animate-pulse ${
                  webcamEnabled ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                {webcamEnabled ? "Live Preview" : "Offline"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              variant={webcamEnabled ? "outline" : "default"}
              size="lg"
              className="h-14 font-bold transition-all"
              onClick={() => setWebcamEnabled(!webcamEnabled)}
            >
              {webcamEnabled ? (
                <>
                  {" "}
                  <VideoOff className="mr-2 h-5 w-5" /> Disable Camera{" "}
                </>
              ) : (
                <>
                  {" "}
                  <Video className="mr-2 h-5 w-5" /> Enable Camera{" "}
                </>
              )}
            </Button>

            <AnimatePresence>
              {webcamEnabled && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <Link href={`/interview/${interview._id}/start`}>
                    <Button className="h-16 w-full text-xl font-extrabold shadow-xl shadow-primary/20 bg-linear-to-r from-primary to-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all">
                      Start My Mock Interview{" "}
                      <ArrowRight className="ml-2 h-6 w-6" />
                    </Button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
