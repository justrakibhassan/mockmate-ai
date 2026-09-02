"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Check, ArrowRight, Zap, Star, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function PricingPage() {
  const [loadingPro, setLoadingPro] = useState(false);
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleProCheckout = async () => {
    if (!isSignedIn) {
      toast.info("Please sign in or create an account to upgrade to Pro.");
      router.push("/sign-in");
      return;
    }

    setLoadingPro(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to start checkout. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong initiating checkout.");
    } finally {
      setLoadingPro(false);
    }
  };

  const plans = [
    {
      name: "Free Starter",
      price: "$0",
      period: "forever",
      description: "Everything you need to test the waters and start practicing.",
      features: [
        "5 Free AI Mock Interview credits",
        "Instant technical question generation",
        "Detailed performance evaluation",
        "Voice speech recognition with text edit",
      ],
      buttonText: "Start for Free",
      buttonHref: "/dashboard",
      popular: false,
      isProAction: false,
      icon: <Star className="h-6 w-6 text-slate-400" />,
    },
    {
      name: "Pro Tier",
      price: "$19",
      period: "one-time",
      description: "Our most popular tier for serious job seekers.",
      features: [
        "25 AI Mock Interview Credits",
        "Permanent Pro Plan account badge",
        "Deep Gemini-powered performance evaluation",
        "Reference ideal answers with STAR method",
        "Session management & interview history",
        "Priority prompt generation",
      ],
      buttonText: "Upgrade to Pro",
      popular: true,
      isProAction: true,
      icon: <Zap className="h-6 w-6 text-primary" />,
    },
    {
      name: "Team & Campus",
      price: "$99",
      period: "custom",
      description: "Ideal for bootcamps, teams, and university career centers.",
      features: [
        "Bulk student/employee seats & credits",
        "Administrative performance dashboard",
        "Custom interview templates & roles",
        "Dedicated account manager",
        "SSO & Custom reporting",
      ],
      buttonText: "Contact Sales",
      buttonHref: "mailto:sales@mockmate.ai",
      popular: false,
      isProAction: false,
      icon: <Shield className="h-6 w-6 text-indigo-500" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-secondary/5 blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-4 border-primary/20 bg-primary/5 text-primary px-4 py-1"
            >
              Transparent Pricing
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6">
              Invest in Your <br />
              <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                Career Success
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Flexible credit packs and Pro status for your mock interview preparation. No hidden subscriptions.
            </p>
          </motion.div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
            >
              <Card
                className={`relative h-full flex flex-col border-primary/5 bg-background shadow-lg transition-all hover:shadow-2xl hover:shadow-primary/5 ${
                  plan.popular ? "ring-2 ring-primary scale-105" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1 font-bold">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pt-10 pb-6 text-center">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4 transition-transform hover:scale-110">
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black">{plan.price}</span>
                    <span className="text-muted-foreground text-sm font-medium">/{plan.period}</span>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="flex-1 pb-10">
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm"
                      >
                        <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pb-10 px-8">
                  {plan.isProAction ? (
                    <Button
                      className="w-full h-12 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 bg-primary shadow-primary/20 hover:scale-[1.02]"
                      onClick={handleProCheckout}
                      disabled={loadingPro}
                    >
                      {loadingPro ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Connecting to Stripe...
                        </>
                      ) : (
                        <>
                          {plan.buttonText}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-12 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 variant-outline"
                      asChild
                      variant="outline"
                    >
                      <Link href={plan.buttonHref || "/dashboard"}>
                        {plan.buttonText}
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-20 p-10 rounded-3xl bg-slate-50 dark:bg-slate-900 text-center space-y-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold italic underline decoration-primary">
            Satisfaction Guaranteed
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Practice realistic interviews with confidence. Each session costs 1 credit and includes full question generation and deep performance evaluation.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
