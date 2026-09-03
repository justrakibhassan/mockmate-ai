"use client";

import "regenerator-runtime/runtime";
import React, { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Mic, Square, Loader2, Save, CheckCircle2, AlertCircle, Edit3 } from "lucide-react";
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
    <div className="flex flex-col items-center gap-6">
      {/* Microphone Record Button (if voice supported) */}
      {isVoiceSupported ? (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary relative">
          {listening && (
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          )}
          <Button
            size="icon"
            variant="ghost"
            className={`h-16 w-16 rounded-full transition-all ${
              listening
                ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30"
                : "bg-background hover:bg-primary/5 shadow-md"
            }`}
            onClick={
              listening
                ? () => SpeechRecognition.stopListening()
                : () => {
                    setManualEdit(false);
                    SpeechRecognition.startListening({ continuous: true });
                  }
            }
            aria-label={listening ? "Stop recording" : "Start recording"}
          >
            {listening ? (
              <Square className="h-7 w-7" />
            ) : (
              <Mic className="h-7 w-7" />
            )}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
          <AlertCircle className="h-4 w-4" />
          Voice input not supported in this browser. You can type your answer below.
        </div>
      )}

      {/* Answer Input Area (Supports Speech + Manual Edit) */}
      <div className="w-full space-y-4 text-left">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1 font-medium">
            <Edit3 className="h-3.5 w-3.5 text-primary" />
            {listening ? "Transcribing speech live..." : "Your Answer"}
          </span>
          <span>{answerText.length} characters</span>
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
          className="min-h-[120px] max-h-[220px] rounded-xl bg-slate-50 dark:bg-slate-900 border text-sm leading-relaxed p-4"
        />

        {isSaved && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Answer saved. You can proceed to the next question or revise and save again.
          </div>
        )}

        <Button
          className="w-full h-12 font-bold shadow-md shadow-primary/10 transition-all hover:scale-[1.01]"
          disabled={saving || listening || answerText.trim().length < 10}
          onClick={onSaveAnswer}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isSaved ? (
            <CheckCircle2 className="mr-2 h-5 w-5 text-emerald-400" />
          ) : (
            <Save className="mr-2 h-5 w-5" />
          )}
          {saving ? "Saving Answer..." : isSaved ? "Update Saved Answer" : "Save Answer"}
        </Button>

        {listening && (
          <p className="text-center text-xs text-muted-foreground animate-pulse">
            Recording in progress. Click the square icon to stop before saving.
          </p>
        )}
      </div>
    </div>
  );
};
