"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Home, ArrowRight, Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Floating Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-primary/20 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-0 -right-[10%] h-[50%] w-[50%] rounded-full bg-secondary/20 blur-[120px]"
        />
      </div>

      <div className="relative text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Ghost className="h-32 w-32 text-primary opacity-20" />
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl font-black tracking-tighter text-foreground/10 select-none">
                404
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
            Page <span className="text-primary italic">Not Found</span>
          </h1>
          <p className="mx-auto mb-10 max-w-lg text-lg text-muted-foreground">
            Opps! It seems you&apos;ve taken a wrong turn in our Mock Interview
            Lab. This route doesn&apos;t exist yet.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button
            size="lg"
            className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20"
            asChild
          >
            <Link href="/">
              <Home className="mr-2 h-5 w-5" /> Back to Home
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="h-14 px-8 text-lg font-semibold hover:bg-primary/5"
            asChild
          >
            <Link href="/dashboard">
              Start Interview <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Brand Watermark */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-20 flex items-center gap-2 opacity-30 grayscale"
      >
        <BrainCircuit className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold tracking-tighter">MockMate AI</span>
      </motion.div>
    </div>
  );
}
