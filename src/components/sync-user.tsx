"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { syncUser } from "@/actions/user";

export function SyncUser() {
  const { isLoaded, isSignedIn, user } = useUser();
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    // Guard against React Strict Mode double-invocations and redundant DB writes
    const sessionKey = `mm_synced_${user.id}`;
    if (
      syncedRef.current === user.id ||
      (typeof window !== "undefined" && sessionStorage.getItem(sessionKey))
    ) {
      return;
    }

    syncedRef.current = user.id;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(sessionKey, "1");
    }

    syncUser().catch((error) => {
      console.error("User profile sync failed:", error);
    });
  }, [isLoaded, isSignedIn, user]);

  return null;
}
