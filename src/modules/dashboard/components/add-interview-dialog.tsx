"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Loader2, Sparkles } from "lucide-react";
import { createInterview } from "@/actions/interview";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const AddInterviewDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    jobPosition: "",
    jobDesc: "",
    jobExperience: "",
  });

  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createInterview(formData);
      if (result.success && result.interview) {
        setOpen(false);
        toast.success("Interview created successfully!");
        router.push(`/interview/${result.interview._id}`);
      } else {
        toast.error(result.error || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-12 px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Interview
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" />
            Tell us about the Job
          </DialogTitle>
          <DialogDescription>
            Add details about the job position you are interviewing for. Gemini
            AI will generate specific questions for you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Job Role / Position
            </label>
            <Input
              placeholder="Ex. Full Stack Developer"
              required
              value={formData.jobPosition}
              onChange={(e) =>
                setFormData({ ...formData, jobPosition: e.target.value })
              }
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Job Description / Tech Stack
            </label>
            <Textarea
              placeholder="Ex. React, Next.js, Node.js, MongoDB etc."
              required
              value={formData.jobDesc}
              onChange={(e) =>
                setFormData({ ...formData, jobDesc: e.target.value })
              }
              className="min-h-[100px] resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Years of Experience
            </label>
            <Input
              placeholder="Ex. 2"
              type="number"
              max="50"
              required
              value={formData.jobExperience}
              onChange={(e) =>
                setFormData({ ...formData, jobExperience: e.target.value })
              }
              className="h-11"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[140px] font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Generating...
                </>
              ) : (
                "Start Interview"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
