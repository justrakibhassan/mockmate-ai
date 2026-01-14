"use client";

import Link from "next/link";
import { Check, ArrowRight, Zap, Star, Shield } from "lucide-react";
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

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for testing the waters and basic practice.",
    features: [
      "5 AI Mock Interviews per month",
      "Standard AI feedback",
      "Basic performance stats",
      "Public community access",
    ],
    buttonText: "Start for Free",
    buttonHref: "/dashboard",
    popular: false,
    icon: <Star className="h-6 w-6 text-slate-400" />,
  },
  {
    name: "Pro",
    price: "$19",
    description: "Our most popular plan for serious job seekers.",
    features: [
      "Unlimited AI Mock Interviews",
      "Advanced Gemini-powered feedback",
      "Detailed progress analytics",
      "Personalized improvement plans",
      "Priority AI processing",
      "Export feedback reports",
    ],
    buttonText: "Get Pro Access",
    buttonHref: "/dashboard",
    popular: true,
    icon: <Zap className="h-6 w-6 text-primary" />,
  },
  {
    name: "Business",
    price: "$99",
    description: "Ideal for teams and university career centers.",
    features: [
      "Bulk student/employee seats",
      "Administrative dashboard",
      "Custom interview templates",
      "Dedicated account manager",
      "SSO & Security features",
      "API access",
    ],
    buttonText: "Contact Sales",
    buttonHref: "mailto:sales@mockmate.ai",
    popular: false,
    icon: <Shield className="h-6 w-6 text-indigo-500" />,
  },
];

export default function PricingPage() {
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
              Pricing Plans
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6">
              Invest in Your <br />
              <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                Career Success
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your preparation needs. No hidden fees,
              cancel anytime.
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
                    <span className="text-muted-foreground">/mo</span>
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
                  <Button
                    className={`w-full h-12 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 ${
                      plan.popular
                        ? "bg-primary shadow-primary/20 hover:scale-[1.02]"
                        : "variant-outline"
                    }`}
                    asChild
                    variant={plan.popular ? "default" : "outline"}
                  >
                    <Link href={plan.buttonHref}>
                      {plan.buttonText}
                      {plan.popular && <ArrowRight className="ml-2 h-5 w-5" />}
                    </Link>
                  </Button>
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
            Money-Back Guarantee
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Try MockMate AI risk-free. If you&apos;re not satisfied within the
            first 7 days, we&apos;ll refund your payment in full. No questions
            asked.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
