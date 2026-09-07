"use client";

import "regenerator-runtime/runtime";
import React, { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Mic, Square, Loader2, Save, CheckCircle2, AlertCircle, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { saveUserAnswer } from "@/actions/interview";

interface RecordAnswerProps {
  interviewId: string;
  activeQuestion: string;
  onSaved?: (question: string) => void;
}

export const RecordAnswer = ({
  interviewId,
  activeQuestion,
  onSaved,
}: RecordAnswerProps) => {
  const [saving, setSaving] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [manualEdit, setManualEdit] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Reset transcript and input state when active question changes
  useEffect(() => {
    SpeechRecognition.stopListening();
    resetTranscript();
    setAnswerText("");
    setIsSaved(false);
    setManualEdit(false);
  }, [activeQuestion, resetTranscript]);

  // Clean up listening on unmount
  useEffect(() => {
    return () => {
      SpeechRecognition.stopListening();
    };
  }, []);

  // Update answerText from speech transcript when recording
  useEffect(() => {
    if (transcript && !manualEdit) {
      setAnswerText(transcript);
    }
  }, [transcript, manualEdit]);

  const onSaveAnswer = async () => {
    const trimmed = answerText.trim();
    if (trimmed.length < 10) {
      toast.warning("Answer is too short. Please provide at least 10 characters.");
      return;
    }

    setSaving(true);
    try {
      const resp = await saveUserAnswer({
        interviewId,
        question: activeQuestion,
        answer: trimmed,
      });

      if (resp.success) {
        setIsSaved(true);
        onSaved?.(activeQuestion);
        toast.success("Answer saved successfully!");
      } else {
        toast.error(resp.error || "Failed to save answer");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save answer");
    } finally {
      setSaving(false);
    }
  };

  const isVoiceSupported = browserSupportsSpeechRecognition;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Microphone Record Button (if voice supported) */}
      {isVoiceSupported ? (
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-20 w-20 items-center justify-center">
            {listening && (
              <>
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
                <span className="absolute inset-2 animate-ping rounded-full bg-primary/10 [animation-delay:150ms]" />
              </>
            )}
            <Button
              size="icon"
              variant="ghost"
              aria-label={listening ? "Stop recording" : "Start recording"}
              className={`h-16 w-16 rounded-full border transition-all duration-300 ${
                listening
                  ? "border-primary/40 bg-primary text-white shadow-lg shadow-primary/30"
                  : "border-border/70 bg-background hover:bg-primary/5 hover:text-primary shadow-sm"
              }`}
              onClick={
                listening
                  ? () => SpeechRecognition.stopListening()
                  : () => {
                      setManualEdit(false);
                      SpeechRecognition.startListening({ continuous: true });
                    }
              }
            >
              {listening ? (
                <Square className="h-6 w-6" />
              ) : (
                <Mic className="h-7 w-7" />
              )}
            </Button>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {listening ? "Listening — speak clearly" : "Tap to answer by voice"}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Voice input not supported in this browser. Type your answer below.
        </div>
      )}

      {/* Answer Input Area (Supports Speech + Manual Edit) */}
      <div className="w-full space-y-3 text-left">
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <PenLine className="h-3.5 w-3.5 text-primary" />
            {listening ? "Transcribing speech live..." : "Your Answer"}
          </span>
          <span className="tabular-nums">{answerText.length} chars</span>
        </div>

        <Textarea
          value={answerText}
          onChange={(e) => {
            setManualEdit(true);
            setAnswerText(e.target.value);
            setIsSaved(false);
          }}
          placeholder={
            isVoiceSupported
              ? "Click the microphone above and speak, or type your answer directly here..."
              : "Type your answer here..."
          }
          className="min-h-[130px] rounded-xl border-border/70 bg-background/60 p-4 text-sm leading-relaxed"
        />

        {isSaved && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Answer saved. You can proceed to the next question or revise and
            save again.
          </div>
        )}

        <Button
          className="h-11 w-full font-semibold shadow-md shadow-primary/10 transition-transform hover:scale-[1.005]"
          disabled={saving || listening || answerText.trim().length < 10}
          onClick={onSaveAnswer}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isSaved ? (
            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving
            ? "Saving Answer..."
            : isSaved
              ? "Update Saved Answer"
              : "Save Answer"}
        </Button>

        {listening && (
          <p className="animate-pulse text-center text-xs text-muted-foreground">
            Recording in progress. Click the square icon to stop before saving.
          </p>
        )}
      </div>
    </div>
  );
};
