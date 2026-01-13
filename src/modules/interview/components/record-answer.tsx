"use client";

import React, { useState, useEffect } from "react";
import useSpeechToText from "react-hook-speech-to-text";
import { Mic, Square, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saveUserAnswer } from "@/actions/interview";

interface RecordAnswerProps {
  interviewId: string;
  activeQuestion: string;
}

export const RecordAnswer = ({
  interviewId,
  activeQuestion,
}: RecordAnswerProps) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  useEffect(() => {
    results.forEach((result) => {
      if (typeof result !== "string" && "transcript" in result) {
        setUserAnswer((prev) => prev + result.transcript);
      }
    });
  }, [results]);

  const onSaveAnswer = async () => {
    if (userAnswer.length < 10) {
      toast.warning("Answer is too short. Please speak more.");
      return;
    }

    setSaving(true);
    try {
      const resp = await saveUserAnswer({
        interviewId,
        question: activeQuestion,
        answer: userAnswer,
      });

      if (resp.success) {
        setUserAnswer("");
        setResults([]);
        toast.success("Answer saved successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save answer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary relative">
        {isRecording && (
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        )}
        <Button
          size="icon"
          variant="ghost"
          className={`h-16 w-16 rounded-full transition-all ${
            isRecording
              ? "bg-primary text-white scale-110"
              : "bg-background hover:bg-primary/5 shadow-lg"
          }`}
          onClick={isRecording ? stopSpeechToText : startSpeechToText}
        >
          {isRecording ? (
            <Square className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
      </div>

      <div className="w-full space-y-4">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border text-sm min-h-[100px] max-h-[200px] overflow-auto italic text-muted-foreground">
          {userAnswer ||
            interimResult ||
            "Click the microphone and start speaking your answer..."}
        </div>

        <Button
          className="w-full h-12 font-bold shadow-md shadow-primary/10"
          disabled={saving || isRecording || userAnswer.length < 10}
          onClick={onSaveAnswer}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-5 w-5" />
          )}
          {saving ? "Saving..." : "Save Answer"}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive">
          Speech Recognition error: {error}
        </p>
      )}
    </div>
  );
};
