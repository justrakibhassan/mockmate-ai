"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { motion, useSpring, useTransform } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, Star, ArrowRight, CheckCircle2 } from "lucide-react";

const AnimatedNumber = ({ value }: { value: number }) => {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
};

export const HomeView = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-background pt-16 pb-24 md:pt-32 md:pb-40">
          {/* Background Gradient Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
              x: [-10, 10, -10],
              y: [-10, 10, -10],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-0 -left-20 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [10, -10, 10],
              y: [10, -10, 10],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-0 -right-20 h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[120px]"
          />

          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <Badge
                    variant="outline"
                    className="mb-6 border-primary/20 bg-primary/5 px-4 py-1 text-primary backdrop-blur-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Star className="h-3 w-3 fill-primary" />
                      New: Mock Interview v2.0 is live!
                    </span>
                  </Badge>
                </motion.div>

                <motion.h1
                  className="mb-8 text-5xl font-extrabold tracking-tight sm:text-7xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  Master Your{" "}
                  <span className="text-primary italic">Interview</span> <br />
                  with{" "}
                  <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                    AI Intelligence
                  </span>
                </motion.h1>

                <motion.p
                  className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  MockMate AI is your personal AI interview coach. Practice
                  anytime, get instant feedback, and sharpen your professional
                  communication to land your dream job.
                </motion.p>

                <motion.div
                  className="flex flex-col items-center justify-center gap-4 sm:flex-row"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    asChild
                  >
                    <Link href="/dashboard">
                      Start Free Practice{" "}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-lg font-semibold transition-all hover:bg-primary/5 hover:scale-105 active:scale-95"
                    asChild
                  >
                    <Link href="#how-it-works">See How it Works</Link>
                  </Button>
                </motion.div>
              </motion.div>

              {/* Bottom Stats Section - Forced Gap */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
                className="mt-20 inline-flex flex-wrap justify-center gap-4 rounded-3xl border border-primary/10 bg-primary/5 p-2 backdrop-blur-md sm:gap-8 sm:p-4"
              >
                {[
                  {
                    label: "Interviews Ace",
                    value: 10000,
                    suffix: "+",
                    icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
                    bg: "bg-primary/10",
                  },
                  {
                    label: "Success Rate",
                    value: 98,
                    suffix: "%",
                    icon: <Star className="h-4 w-4 text-secondary" />,
                    bg: "bg-secondary/10",
                  },
                  {
                    label: "Industries",
                    value: 50,
                    suffix: "+",
                    icon: <BrainCircuit className="h-4 w-4 text-primary" />,
                    bg: "bg-primary/10",
                  },
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + idx * 0.1, duration: 0.5 }}
                    className="flex items-center gap-4 rounded-2xl bg-background/50 px-6 py-4 shadow-sm transition-all hover:bg-background hover:shadow-md border border-primary/5"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}
                    >
                      {stat.icon}
                    </div>
                    <div className="flex flex-col items-start -translate-y-px text-left">
                      <div className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                        <AnimatedNumber value={stat.value} />
                        {stat.suffix}
                      </div>
                      <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground/80">
                        {stat.label}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="relative bg-slate-50/50 py-24 dark:bg-slate-900/50 overflow-hidden"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="mb-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
                Built for Professional Success
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to prepare, practice, and perform.
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "Real-time AI Feedback",
                  desc: "Instant feedback on your answers, body language, and tone from our advanced AI engine.",
                  icon: <BrainCircuit className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Industry Specific",
                  desc: "Over 1,000+ templates for Tech, Finance, Healthcare, and Marketing roles.",
                  icon: <CheckCircle2 className="h-10 w-10 text-secondary" />,
                },
                {
                  title: "Progress Tracking",
                  desc: "Detailed analytics on your improvement over time with personalized growth plans.",
                  icon: <Star className="h-10 w-10 text-primary" />,
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="group border-primary/5 bg-background shadow-sm transition-all hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 overflow-hidden">
                    <CardContent className="p-8 relative">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                        <ArrowRight className="h-24 w-24 text-primary" />
                      </div>
                      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 transition-colors group-hover:bg-primary/10 dark:bg-slate-800">
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          {feature.icon}
                        </motion.div>
                      </div>
                      <h3 className="mb-3 text-xl font-bold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">
              MockMate AI
            </span>
          </div>
          <p className="text-sm">
            © 2026 MockMate AI. All rights reserved. Master Your Interview with
            AI.
          </p>
        </div>
      </footer>
    </div>
  );
};
