"use client";

import Link from "next/link";

import {
  BarChart3,
  ChevronRight,
  Crown,
  Swords,
} from "lucide-react";

type HeroSectionProps = {
  user: unknown;
  stats: {
    activeGames: number;
    totalGames: number;
    onlinePlayers: number;
  };
};

export default function HeroSection({
  user,
  stats,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--primary)]/5 blur-3xl pointer-events-none" />

      <div className="absolute -bottom-24 right-0 w-80 h-80 rounded-full bg-[var(--game-blitz)]/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        {/* Crown badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary-muted)] border border-[var(--primary-border)] text-xs font-semibold text-[var(--primary)] mb-8 shadow-sm">
          <Crown className="w-3.5 h-3.5" />

          <span>The Ultimate Chess Experience</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
          <span className="text-primary-gradient">
            Play Chess.
          </span>

          <br />

          <span className="text-white">
            Rule the Board.
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Challenge players worldwide, compete in rated matches, or
          play with friends. Real-time chess at your fingertips —
          for free.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/game"
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-extrabold text-base bg-primary-gradient text-[var(--surface-main)] hover:opacity-95 shadow-xl glow-primary transition-all active:scale-[0.98]"
          >
            <Swords className="w-5 h-5" />

            Play Now — It&apos;s Free
          </Link>

          {!user && (
            <Link
              href="/register"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base bg-white/5 border border-[var(--surface-border)] text-white hover:bg-white/10 transition-all"
            >
              Create Account

              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Live Stats Banner */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 mt-12 text-sm">
          {/* Online Players */}
          <div className="flex items-center gap-2 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />

            <span>
              <strong className="text-white">
                {stats.onlinePlayers}
              </strong>{" "}
              online
            </span>
          </div>

          <div className="w-px h-4 bg-[var(--surface-border)]" />

          {/* Active Games */}
          <div className="flex items-center gap-2 text-gray-400">
            <Swords className="w-4 h-4 text-[var(--primary)]" />

            <span>
              <strong className="text-white">
                {stats.activeGames}
              </strong>{" "}
              active games
            </span>
          </div>

          <div className="w-px h-4 bg-[var(--surface-border)]" />

          {/* Games Played */}
          <div className="flex items-center gap-2 text-gray-400">
            <BarChart3 className="w-4 h-4 text-[var(--primary)]" />

            <span>
              <strong className="text-white">
                {stats.totalGames}
              </strong>{" "}
              games played
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}