"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import {
  Zap,
  Trophy,
  Users,
  Swords,
  Globe,
  Shield,
  Crown,
  ChevronRight,
  BarChart3,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    activeGames: 0,
    totalGames: 0,
    onlinePlayers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch<{
          success: boolean;
          stats: { activeGames: number; totalGames: number; onlinePlayers: number };
        }>("/games/lobby/stats");
        if (res.success && res.stats) {
          setStats(res.stats);
        }
      } catch {
        // Fallback gracefully
      }
    };
    fetchStats();
  }, []);

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast Matchmaking",
      description:
        "Get paired with an opponent near your rating in seconds. Bullet, Blitz, Rapid — you choose the pace.",
      color: "var(--game-bullet)",
      bg: "var(--game-bullet-bg)",
      border: "var(--game-bullet-border)",
    },
    {
      icon: Users,
      title: "Play with Friends",
      description:
        "Create private rooms with a shareable invite code and challenge your friends directly.",
      color: "var(--primary)",
      bg: "var(--primary-muted)",
      border: "var(--primary-border)",
    },
    {
      icon: Trophy,
      title: "Rating & Leaderboards",
      description:
        "Climb the global leaderboard with every win. Track your progress across all time controls.",
      color: "var(--game-blitz)",
      bg: "var(--game-blitz-bg)",
      border: "var(--game-blitz-border)",
    },
    {
      icon: Globe,
      title: "Play Anywhere",
      description:
        "Local pass-and-play mode lets you enjoy chess on the same device with a friend.",
      color: "var(--game-rapid)",
      bg: "var(--game-rapid-bg)",
      border: "var(--game-rapid-border)",
    },
  ];

  const gameModes = [
    {
      icon: "⚡",
      name: "Bullet",
      time: "< 3 min",
      desc: "Ultra-fast. Every second counts.",
      href: "/game?tab=quick",
      color: "var(--game-bullet)",
      bg: "var(--game-bullet-bg)",
      border: "var(--game-bullet-border)",
    },
    {
      icon: "🔥",
      name: "Blitz",
      time: "3 – 5 min",
      desc: "The most popular time control.",
      href: "/game?tab=quick",
      color: "var(--game-blitz)",
      bg: "var(--game-blitz-bg)",
      border: "var(--game-blitz-border)",
    },
    {
      icon: "⏱️",
      name: "Rapid",
      time: "10 – 30 min",
      desc: "Think deeper, play stronger.",
      href: "/game?tab=quick",
      color: "var(--game-rapid)",
      bg: "var(--game-rapid-bg)",
      border: "var(--game-rapid-border)",
    },
    {
      icon: "🤝",
      name: "With Friends",
      time: "Custom",
      desc: "Invite codes & private rooms.",
      href: "/game?tab=friend",
      color: "var(--primary)",
      bg: "var(--primary-muted)",
      border: "var(--primary-border)",
    },
  ];

  return (
    <main className="flex-1 bg-[var(--surface-main)] text-[var(--foreground)]">
      {/* ============================
          HERO SECTION
      ============================ */}
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
            <span className="text-primary-gradient">Play Chess.</span>
            <br />
            <span className="text-white">Rule the Board.</span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Challenge players worldwide, compete in rated matches, or play with
            friends. Real-time chess at your fingertips — for free.
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
            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
              <span>
                <strong className="text-white">{stats.onlinePlayers}</strong> online
              </span>
            </div>
            <div className="w-px h-4 bg-[var(--surface-border)]" />
            <div className="flex items-center gap-2 text-gray-400">
              <Swords className="w-4 h-4 text-[var(--primary)]" />
              <span>
                <strong className="text-white">{stats.activeGames}</strong> active games
              </span>
            </div>
            <div className="w-px h-4 bg-[var(--surface-border)]" />
            <div className="flex items-center gap-2 text-gray-400">
              <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
              <span>
                <strong className="text-white">{stats.totalGames}</strong> games played
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================
          CHESS BOARD PREVIEW + PLAY MODES
      ============================ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gameModes.map((mode) => (
            <Link
              key={mode.name}
              href={mode.href}
              className="group relative flex flex-col p-5 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-xl"
              style={{
                background: mode.bg,
                borderColor: mode.border,
              }}
            >
              <span className="text-3xl mb-3">{mode.icon}</span>
              <div className="flex items-baseline gap-2 mb-1">
                <h3
                  className="text-lg font-extrabold"
                  style={{ color: mode.color }}
                >
                  {mode.name}
                </h3>
                <span className="text-xs text-gray-400 font-medium">{mode.time}</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed flex-1">
                {mode.desc}
              </p>
              <div
                className="mt-4 flex items-center gap-1 text-xs font-semibold opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ color: mode.color }}
              >
                Play Now <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================
          FEATURES GRID
      ============================ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[var(--surface-border)]">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Everything you need to{" "}
            <span className="text-primary-gradient">dominate</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            ChessLord is built for speed, fairness, and fun — whether
            you&apos;re a casual player or a competitive one.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-4 p-6 rounded-2xl border bg-[var(--surface-card)] transition-all hover:border-[var(--primary-border)]"
              style={{ borderColor: "var(--surface-border)" }}
            >
              <div
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border"
                style={{
                  background: f.bg,
                  borderColor: f.border,
                  color: f.color,
                }}
              >
                <f.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base mb-1">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================
          FINAL CTA STRIP
      ============================ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--primary-border)] bg-[var(--surface-card)] p-10 sm:p-14 text-center shadow-2xl">
          {/* Decorative glow */}
          <div className="absolute inset-0 bg-[var(--primary-muted)] opacity-30 pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-gradient shadow-lg mb-6">
              <Crown className="w-7 h-7 text-[var(--surface-main)]" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to claim your throne?
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-8">
              Join thousands of players competing in real-time. Track your
              rating, build your stats, and rise to the top.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/game"
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-extrabold text-base bg-primary-gradient text-[var(--surface-main)] hover:opacity-95 shadow-xl glow-primary transition-all active:scale-[0.98]"
              >
                <Swords className="w-5 h-5" />
                Start Playing
              </Link>
              {!user && (
                <Link
                  href="/register"
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm text-gray-300 border border-[var(--surface-border)] hover:bg-white/5 transition-all"
                >
                  <Shield className="w-4 h-4 text-[var(--primary)]" />
                  Create Free Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--surface-border)] py-8 text-center text-xs text-gray-600">
        <p>
          © 2026{" "}
          <span className="text-gray-400 font-semibold">ChessLord</span>. Play
          sharp. Play free.
        </p>
      </footer>
    </main>
  );
}
