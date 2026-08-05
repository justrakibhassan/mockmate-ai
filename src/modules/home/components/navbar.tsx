"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, BrainCircuit, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

import { usePathname } from "next/navigation";
import { getUserPlan } from "@/actions/user";
import { CreditDisplay } from "./credit-display";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Features", href: "#features" },
  { name: "How it Works", href: "/how-it-works" },
  { name: "Pricing", href: "/pricing" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  // Hide Navbar only on the active interview start page
  const isStartPage = pathname?.split("/").filter(Boolean).pop() === "start";

  if (isStartPage) {
    return null;
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/40"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link href="/" className="flex items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <BrainCircuit className="h-6 w-6 text-primary-foreground" />
              <motion.div
                className="absolute inset-0 rounded-xl bg-primary"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              MockMate<span className="text-primary text-2xl"> AI</span>
            </span>
          </Link>
        </motion.div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex md:items-center md:gap-1">
          {navItems.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <Link
                href={item.href}
                className="group relative px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {item.name}
                <motion.span
                  className="absolute bottom-1 left-4 right-4 h-0.5 bg-primary origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <motion.div
            className="hidden md:flex md:items-center md:gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ThemeToggle />
            <SignedOut>
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-semibold hover:bg-primary/5"
                >
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button
                  size="sm"
                  className="relative overflow-hidden font-bold shadow-md shadow-primary/20 group"
                >
                  <span className="relative z-10">Get Started</span>
                  <motion.div
                    className="absolute inset-0 bg-primary-foreground/10"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="font-semibold mr-2 hover:bg-primary/5"
              >
                <Link href="/dashboard">Start Interview</Link>
              </Button>
              <CreditDisplay />
              <PlanBadge />
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </motion.div>

          {/* Mobile Nav */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] border-l border-primary/10 bg-background/95 backdrop-blur-xl p-0"
            >
              <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Navigate through MockMate AI&apos;s features and account
                settings.
              </SheetDescription>
              <div className="flex flex-col h-full bg-background/50">
                <div className="flex items-center gap-2 p-6 border-b border-primary/5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <BrainCircuit className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-bold">MockMate AI</span>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4">
                  <nav className="flex flex-col gap-2">
                    {navItems.map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <SheetClose asChild>
                          <Link
                            href={item.href}
                            className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary active:scale-95"
                          >
                            {item.name}
                            <ChevronRight className="h-4 w-4 opacity-50" />
                          </Link>
                        </SheetClose>
                      </motion.div>
                    ))}
                  </nav>
                </div>

                <div className="p-6 border-t border-primary/5 space-y-4">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button
                        variant="outline"
                        className="w-full justify-center h-11 rounded-xl font-semibold"
                      >
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="w-full justify-center h-11 rounded-xl font-bold shadow-lg shadow-primary/20">
                        Get Started
                      </Button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <Button
                      asChild
                      className="w-full justify-center h-11 rounded-xl mb-2"
                    >
                      <Link href="/dashboard">Start Interview</Link>
                    </Button>
                    <div className="flex flex-col items-center gap-4 py-2">
                      <CreditDisplay />
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  </SignedIn>
                  <div className="flex items-center justify-between rounded-xl border border-primary/5 px-4 py-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Theme
                    </span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}

function PlanBadge() {
  const [plan, setPlan] = React.useState<string | null>(null);

  React.useEffect(() => {
    getUserPlan().then(setPlan);
  }, []);

  if (!plan) return null;

  return (
    <Badge
      variant="secondary"
      className="bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1 scale-95 uppercase tracking-tighter"
    >
      {plan} Plan
    </Badge>
  );
}
