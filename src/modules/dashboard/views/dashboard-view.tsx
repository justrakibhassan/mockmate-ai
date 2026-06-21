"use client";

import React from "react";
import { AddInterviewDialog } from "../components/add-interview-dialog";
import { InterviewList } from "../components/interview-list";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface DashboardViewProps {
  plan?: string;
  credits?: number;
}

export const DashboardView = ({ plan = "Free", credits = 0 }: DashboardViewProps) => {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            User <span className="text-primary italic">Dashboard</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create a new mock interview or continue your journey.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="group flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 shadow-sm transition-all hover:bg-primary/10"
            >
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
                {plan} Plan <span className="mx-1 opacity-20">|</span> {credits} Credits
                Left
              </span>
            </motion.div>
          </div>
        </div>
        <AddInterviewDialog />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="mb-6 text-xl font-semibold text-foreground flex items-center gap-2">
          Recent Interview Sessions
        </h2>
        <InterviewList />
      </motion.div>
    </div>
  );
};
