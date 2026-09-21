"use client";

import "regenerator-runtime/runtime";
import React, { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import {
  Loader2,
  Save,
  CheckCircle2,
  PenLine,
  Subtitles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { saveUserAnswer } from "@/actions/interview";

export interface RecordAnswerProps {
  interviewId: string;
  activeQuestion: string;
  onSaved?: (question: string) => void;
  // Optional external synchronization props from Google Meet layout
  externalListening?: boolean;
  onListeningChange?: (listening: boolean) => void;
  onTranscriptChange?: (text: string) => void;
  initialText?: string;
  isSavedExternal?: boolean;
}

const emptySubscribe = () => () => {};
function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export const RecordAnswer = ({
  interviewId,
  activeQuestion,
  onSaved,
  onListeningChange,
  onTranscriptChange,
  isSavedExternal = false,
}: RecordAnswerProps) => {
  const [saving, setSaving] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [isSaved, setIsSaved] = useState(isSavedExternal);
  const [manualEdit, setManualEdit] = useState(false);
  const mounted = useMounted();

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
    setIsSaved(isSavedExternal);
    setManualEdit(false);
    onListeningChange?.(false);
    onTranscriptChange?.("");
  }, [activeQuestion, resetTranscript, isSavedExternal, onListeningChange, onTranscriptChange]);

  // Sync listening state to parent if callback provided
  useEffect(() => {
    onListeningChange?.(listening);
  }, [listening, onListeningChange]);

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
      onTranscriptChange?.(transcript);
    }
  }, [transcript, manualEdit, onTranscriptChange]);

  const onSaveAnswer = async () => {
    const trimmed = answerText.trim();
    if (trimmed.length < 10) {
      toast.warning("Answer is too short. Please provide at least 10 characters.");
      return;
    }

    if (listening) {
      SpeechRecognition.stopListening();
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

  const isVoiceSupported = mounted && browserSupportsSpeechRecognition;
  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

  return (
    <div className="w-full space-y-3 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-md sm:p-5">
      {/* Header bar of transcript card */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Subtitles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-wide text-foreground uppercase">
              Live Transcript & Candidate Response
            </p>
            <p className="text-[11px] text-muted-foreground">
              {listening
                ? "Microphone is live — your speech is transcribed in real time"
                : manualEdit
                  ? "Manual editing mode active"
                  : "Speech recognition paused"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-border/60 bg-background/50 font-mono text-[11px] text-muted-foreground"
          >
            {wordCount} {wordCount === 1 ? "word" : "words"} · {answerText.length} chars
          </Badge>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setManualEdit(!manualEdit)}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <PenLine className="h-3.5 w-3.5" />
            {manualEdit ? "Caption View" : "Edit Text"}
          </Button>
        </div>
      </div>

      {/* Transcription / Input Area */}
      {manualEdit ? (
        <div className="space-y-2">
          <Textarea
            value={answerText}
            onChange={(e) => {
              setAnswerText(e.target.value);
              onTranscriptChange?.(e.target.value);
              setIsSaved(false);
            }}
            placeholder="Type or edit your response here (Situation, Task, Action, Result)..."
            className="min-h-[110px] resize-y rounded-xl border-border/70 bg-background/80 p-3.5 text-sm leading-relaxed focus-visible:ring-primary"
          />
          <p className="text-[11px] text-muted-foreground">
            Tip: You can refine technical terms, metrics, or acronyms before saving.
          </p>
        </div>
      ) : (
        <div className="relative min-h-[95px] rounded-xl border border-border/50 bg-background/40 p-4 transition-colors">
          {listening && (
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Transcribing audio live...
              <div className="flex items-center gap-0.5 ml-1">
                <span className="h-3 w-1 animate-pulse rounded-full bg-emerald-500 [animation-delay:0ms]" />
                <span className="h-4 w-1 animate-pulse rounded-full bg-emerald-500 [animation-delay:150ms]" />
                <span className="h-2 w-1 animate-pulse rounded-full bg-emerald-500 [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {answerText ? (
            <p className="text-sm leading-relaxed text-foreground select-text">
              &ldquo;{answerText}&rdquo;
              {listening && (
                <span className="inline-block h-4 w-1.5 animate-pulse bg-primary ml-1 align-middle" />
              )}
            </p>
          ) : (
            <div className="flex min-h-[70px] flex-col items-center justify-center text-center">
              <p className="text-xs text-muted-foreground">
                {isVoiceSupported
                  ? "Click 'Start Answering' below or tap the microphone to begin your response."
                  : "Voice dictation is unsupported in this browser. Please use the Edit Text mode above."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Status & Save Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          {isSaved ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Response saved for this question
            </div>
          ) : answerText.trim().length >= 10 ? (
            <p className="text-xs text-amber-500/90">
              Unsaved changes. Click &quot;Save Answer&quot; or &quot;Next Question&quot; to persist.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Provide at least 10 characters to save your response.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {answerText && !isSaved && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAnswerText("");
                resetTranscript();
                setIsSaved(false);
              }}
              className="h-8 text-xs text-muted-foreground"
            >
              <RefreshCw className="mr-1 h-3 w-3" /> Clear
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            disabled={saving || answerText.trim().length < 10}
            onClick={onSaveAnswer}
            className={`h-8 font-semibold text-xs transition-all ${
              isSaved
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                : "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
            }`}
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : isSaved ? (
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            {saving ? "Saving..." : isSaved ? "Answer Saved" : "Save Answer"}
          </Button>
        </div>
      </div>
    </div>
  );
};
