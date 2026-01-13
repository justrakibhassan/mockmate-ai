"use client";

import React from "react";
import { AddInterviewDialog } from "../components/add-interview-dialog";
import { InterviewList } from "../components/interview-list";
import { motion } from "framer-motion";

export const DashboardView = () => {
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
