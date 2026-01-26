"use client";

import * as React from "react";
import { Coins, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserCredits } from "@/actions/user";
import { toast } from "sonner";

export function CreditDisplay() {
  const [credits, setCredits] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchCredits = React.useCallback(async () => {
    const balance = await getUserCredits();
    setCredits(balance);
  }, []);

  React.useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const onBuyCredits = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/checkout", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to initiate checkout.");
    } finally {
      setLoading(false);
    }
  };

  if (credits === null) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className="flex items-center gap-1.5 bg-primary/5 border-primary/20 py-1.5"
      >
        <Coins className="h-4 w-4 text-primary" />
        <span className="font-bold">{credits} Credits</span>
      </Badge>
      <Button
        onClick={onBuyCredits}
        disabled={loading}
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 rounded-full hover:bg-primary/10"
        title="Buy Credits"
      >
        <Plus className="h-4 w-4 text-primary" />
      </Button>
    </div>
  );
}
