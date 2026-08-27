"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";

import HeroSection from "@/components/home/HeroSection";
import GameModes from "@/components/home/GameModes";
import FeaturesSection from "@/components/home/FeaturesSection";
import FinalCTA from "@/components/home/FinalCTA";
import HomeFooter from "@/components/home/HomeFooter";

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
          stats: {
            activeGames: number;
            totalGames: number;
            onlinePlayers: number;
          };
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

  return (
    <main className="flex-1 bg-[var(--surface-main)] text-[var(--foreground)]">
      <HeroSection user={user} stats={stats} />

      <GameModes />

      <FeaturesSection />

      <FinalCTA user={user} />

      <HomeFooter />
    </main>
  );
}