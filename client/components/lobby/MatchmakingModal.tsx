"use client";

import React from "react";
import { Crown } from "lucide-react";

interface MatchmakingModalProps {
  isSearching: boolean;
  searchSeconds: number;
  gameType: "rated" | "casual";
  timeControlName: string;
  onCancel: () => void;
}

function MatchmakingModal({
  isSearching,
  searchSeconds,
  gameType,
  timeControlName,
  onCancel,
}: MatchmakingModalProps) {
  if (!isSearching) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-surface-border bg-surface-card p-8 text-center shadow-2xl">
        {/* Animated Radar Background */}
        <div className="relative mx-auto flex size-36 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-(--primary)/20 animate-radar-ping" />

          <div className="absolute inset-4 rounded-full border border-(--primary)/30 animate-pulse" />

          <div className="flex size-24 items-center justify-center rounded-full border border-primary-border bg-primary-gradient/10 text-3xl shadow-inner">
            <Crown className="size-10 animate-bounce text-primary" />
          </div>
        </div>

        {/* Searching Text & Timer */}
        <div className="mt-6 space-y-1.5">
          <h3 className="text-2xl font-extrabold text-white">
            Searching for Opponent...
          </h3>

          <p className="text-sm text-gray-400">
            Mode:{" "}
            <span className="font-semibold text-white">
              {timeControlName} ({gameType.toUpperCase()})
            </span>
          </p>

          <p className="pt-2 font-mono text-xl font-bold text-primary">
            {formatTimer(searchSeconds)}
          </p>
        </div>

        {/* Cancel Button */}
        <button     
          type="button"
          onClick={onCancel}
          className="mt-6 w-full cursor-pointer rounded-xl border border-white/10 bg-white/10 py-3.5 font-bold text-gray-300 transition hover:bg-red-500/20 hover:text-red-300 active:scale-95"
        >
          Cancel Matchmaking
        </button>
      </div>
    </div>
  );
}

export default MatchmakingModal;

