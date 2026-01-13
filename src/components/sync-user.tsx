"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { syncUser } from "@/actions/user";

export function SyncUser() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const performSync = async () => {
        try {
          await syncUser();
        } catch (error) {
          console.error("Sync failed:", error);
        }
      };

      performSync();
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
