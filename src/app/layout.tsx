import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://mockmate-ai-self.vercel.app"
  ),
  title: "MockMate AI | Master Technical Interviews with AI",
  description:
    "Production-hardened AI mock interview coach. Master technical communication with real-time speech evaluation and multi-dimensional rubric scoring.",
  openGraph: {
    title: "MockMate AI | Production-Hardened AI Mock Interview Platform",
    description:
      "Master technical communication with real-time speech evaluation and multi-dimensional rubric scoring.",
    url: "https://mockmate-ai-self.vercel.app",
    siteName: "MockMate AI",
    images: [
      {
        url: "/mockmate-ai.webp",
        width: 1200,
        height: 630,
        alt: "MockMate AI Platform Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MockMate AI | Master Technical Interviews",
    description:
      "Production-hardened AI mock interview coach with real-time rubric feedback.",
    images: ["/mockmate-ai.webp"],
  },
};

import { Navbar } from "@/modules/home/components/navbar";
import { SyncUser } from "@/components/sync-user";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider>
            <SyncUser />
            <Navbar />
            {children}
            <Toaster />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
