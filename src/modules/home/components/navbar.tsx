"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Features", href: "#features" },
  { name: "How it Works", href: "#how-it-works" },
  { name: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <BrainCircuit className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              MockMate<span className="text-primary text-2xl"> AI</span>
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex md:items-center md:gap-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex md:items-center md:gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="font-semibold">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="font-bold shadow-md shadow-primary/20">
                  Get Started
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Button asChild variant="ghost" size="sm" className="font-semibold mr-2">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>

          {/* Mobile Nav */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 pt-10">
                <div className="flex items-center gap-2 mb-4">
                  <BrainCircuit className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">MockMate AI</span>
                </div>
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium text-muted-foreground hover:text-primary"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex flex-col gap-4 mt-4 border-t pt-6">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button variant="outline" className="w-full font-semibold">
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="w-full font-bold shadow-md shadow-primary/20">
                        Get Started
                      </Button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <Button asChild className="w-full mb-2">
                       <Link href="/dashboard">Dashboard</Link>
                    </Button>
                    <div className="flex justify-center">
                       <UserButton afterSignOutUrl="/" />
                    </div>
                  </SignedIn>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
