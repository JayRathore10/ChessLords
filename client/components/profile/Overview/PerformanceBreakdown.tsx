"use client";

import React, { useState } from "react";
import {
  Award,
  Zap,
  Flame,
  Clock,
  Shield,
  History,
  TrendingUp,
  Circle,
  Swords,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { UserFullStatistics } from "@/types/stats";

interface PerformanceBreakdownProps {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  breakdown?: UserFullStatistics["historicalBreakdown"];
}

export default function PerformanceBreakdown({
  gamesPlayed,
  gamesWon,
  gamesLost,
  gamesDrawn,
  breakdown,
}: PerformanceBreakdownProps) {
  const [showAllMatches, setShowAllMatches] = useState(false);

  const winRate =
    gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const lossRate =
    gamesPlayed > 0 ? Math.round((gamesLost / gamesPlayed) * 100) : 0;
  const drawRate =
    gamesPlayed > 0 ? Math.round((gamesDrawn / gamesPlayed) * 100) : 0;

  // Format styling configurations
  const formatConfig = {
    Bullet: {
      color: "var(--game-bullet)",
      bg: "var(--game-bullet-bg)",
      border: "var(--game-bullet-border)",
      icon: Zap,
      desc: "< 3 mins",
    },
    Blitz: {
      color: "var(--game-blitz)",
      bg: "var(--game-blitz-bg)",
      border: "var(--game-blitz-border)",
      icon: Flame,
      desc: "3–5 mins",
    },
    Rapid: {
      color: "var(--game-rapid)",
      bg: "var(--game-rapid-bg)",
      border: "var(--game-rapid-border)",
      icon: Clock,
      desc: "10–30 mins",
    },
    Classical: {
      color: "var(--game-classical)",
      bg: "var(--game-classical-bg)",
      border: "var(--game-classical-border)",
      icon: Shield,
      desc: "> 30 mins",
    },
  };

  const byFormat = breakdown?.byFormat || [];
  const byColor = breakdown?.byColor;
  const streaks = breakdown?.streaks;
  const recentMatches = breakdown?.recentMatches || [];

  const displayedMatches = showAllMatches
    ? recentMatches
    : recentMatches.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 1. Overall Performance Overview Bar */}
      <div
        className="rounded-2xl border p-5 md:p-6 space-y-4 shadow-lg"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--surface-border)",
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[var(--primary)]" />
            <span>Overall Win / Loss Ratio</span>
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--surface-main)] border border-[var(--surface-border)] text-gray-300">
            {winRate}% Win Rate
          </span>
        </div>

        {gamesPlayed > 0 ? (
          <div className="space-y-3">
            {/* Visual Multi-Segment Bar */}
            <div className="w-full h-3.5 bg-gray-900 rounded-full overflow-hidden flex shadow-inner">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(gamesWon / gamesPlayed) * 100}%` }}
                title={`Won: ${gamesWon} (${winRate}%)`}
              />
              <div
                className="bg-[var(--primary)] h-full transition-all duration-500"
                style={{ width: `${(gamesDrawn / gamesPlayed) * 100}%` }}
                title={`Drawn: ${gamesDrawn} (${drawRate}%)`}
              />
              <div
                className="bg-red-500 h-full transition-all duration-500"
                style={{ width: `${(gamesLost / gamesPlayed) * 100}%` }}
                title={`Lost: ${gamesLost} (${lossRate}%)`}
              />
            </div>

            {/* Legend with Counts and Percentages */}
            <div className="grid grid-cols-3 text-center gap-2 pt-1 text-xs">
              <div className="p-2 rounded-xl bg-[var(--surface-main)] border border-[var(--surface-border)]">
                <span className="flex items-center justify-center gap-1.5 text-emerald-400 font-semibold mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Won
                </span>
                <span className="text-white font-bold">{gamesWon}</span>
                <span className="text-gray-500 text-[10px] ml-1">({winRate}%)</span>
              </div>

              <div className="p-2 rounded-xl bg-[var(--surface-main)] border border-[var(--surface-border)]">
                <span className="flex items-center justify-center gap-1.5 text-[var(--primary)] font-semibold mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--primary)] inline-block" />
                  Drawn
                </span>
                <span className="text-white font-bold">{gamesDrawn}</span>
                <span className="text-gray-500 text-[10px] ml-1">({drawRate}%)</span>
              </div>

              <div className="p-2 rounded-xl bg-[var(--surface-main)] border border-[var(--surface-border)]">
                <span className="flex items-center justify-center gap-1.5 text-red-400 font-semibold mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  Lost
                </span>
                <span className="text-white font-bold">{gamesLost}</span>
                <span className="text-gray-500 text-[10px] ml-1">({lossRate}%)</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No games played yet. Play your first match to start tracking your performance!
          </p>
        )}
      </div>

      {/* 2. Format Breakdown (Bullet, Blitz, Rapid, Classical) */}
      <div
        className="rounded-2xl border p-5 md:p-6 space-y-4 shadow-lg"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--surface-border)",
        }}
      >
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--primary)]" />
            <span>Format Breakdown</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Performance across chess time control disciplines
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(["Bullet", "Blitz", "Rapid", "Classical"] as const).map((fmt) => {
            const cfg = formatConfig[fmt];
            const data = byFormat.find((f) => f.format === fmt) || {
              format: fmt,
              gamesPlayed: 0,
              won: 0,
              lost: 0,
              drawn: 0,
              winRate: 0,
            };
            const Icon = cfg.icon;

            return (
              <div
                key={fmt}
                className="p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-transform hover:-translate-y-0.5"
                style={{
                  backgroundColor: "var(--surface-main)",
                  borderColor: "var(--surface-border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: cfg.bg,
                        color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">
                        {fmt}
                      </span>
                      <span className="text-[10px] text-gray-500 block">
                        {cfg.desc}
                      </span>
                    </div>
                  </div>

                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: cfg.bg,
                      color: cfg.color,
                      border: `1px solid ${cfg.border}`,
                    }}
                  >
                    {data.winRate}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${data.winRate}%`,
                        backgroundColor: cfg.color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-gray-400">
                    <span>{data.gamesPlayed} {data.gamesPlayed === 1 ? "game" : "games"}</span>
                    <span>
                      {data.won}W / {data.lost}L / {data.drawn}D
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Color Performance & Streaks Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Color Breakdown: White vs Black */}
        <div
          className="rounded-2xl border p-5 space-y-4 shadow-lg"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--surface-border)",
          }}
        >
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Swords className="w-4 h-4 text-[var(--primary)]" />
            <span>White vs. Black Pieces</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* White side */}
            <div
              className="p-3.5 rounded-xl border space-y-2"
              style={{
                backgroundColor: "var(--surface-main)",
                borderColor: "var(--surface-border)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <span className="w-3 h-3 rounded-full bg-white border border-gray-400 inline-block shadow" />
                  White
                </span>
                <span className="text-xs font-extrabold text-white">
                  {byColor?.white.winRate ?? 0}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="bg-white h-full transition-all"
                  style={{ width: `${byColor?.white.winRate ?? 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 pt-0.5">
                <span>{byColor?.white.gamesPlayed ?? 0} games</span>
                <span>
                  {byColor?.white.won ?? 0}W - {byColor?.white.lost ?? 0}L - {byColor?.white.drawn ?? 0}D
                </span>
              </div>
            </div>

            {/* Black side */}
            <div
              className="p-3.5 rounded-xl border space-y-2"
              style={{
                backgroundColor: "var(--surface-main)",
                borderColor: "var(--surface-border)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
                  <span className="w-3 h-3 rounded-full bg-gray-900 border border-gray-600 inline-block shadow" />
                  Black
                </span>
                <span className="text-xs font-extrabold text-white">
                  {byColor?.black.winRate ?? 0}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="bg-gray-400 h-full transition-all"
                  style={{ width: `${byColor?.black.winRate ?? 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 pt-0.5">
                <span>{byColor?.black.gamesPlayed ?? 0} games</span>
                <span>
                  {byColor?.black.won ?? 0}W - {byColor?.black.lost ?? 0}L - {byColor?.black.drawn ?? 0}D
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Streaks & Form */}
        <div
          className="rounded-2xl border p-5 space-y-4 shadow-lg"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--surface-border)",
          }}
        >
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
            <span>Form & Streaks</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Current streak */}
            <div
              className="p-3.5 rounded-xl border space-y-1"
              style={{
                backgroundColor: "var(--surface-main)",
                borderColor: "var(--surface-border)",
              }}
            >
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                Current Streak
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-white">
                  {streaks?.currentStreak?.count || 0}
                </span>
                <span
                  className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${
                    streaks?.currentStreak?.type === "win"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : streaks?.currentStreak?.type === "loss"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {streaks?.currentStreak?.type === "none"
                    ? "-"
                    : `${streaks?.currentStreak?.type || ""} streak`}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 block">
                Consecutive matches
              </span>
            </div>

            {/* Best win streak */}
            <div
              className="p-3.5 rounded-xl border space-y-1"
              style={{
                backgroundColor: "var(--surface-main)",
                borderColor: "var(--surface-border)",
              }}
            >
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                Best Win Streak
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-white">
                  {streaks?.bestWinStreak || 0}
                </span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-[10px] text-gray-500 block">
                Career high wins
              </span>
            </div>
          </div>

          {/* Recent Form (last 10 games) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Recent Form (Last 10)</span>
              <span className="text-emerald-400 font-bold">
                {streaks?.winRateLast10 ?? 0}% Win Rate
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {streaks?.recentForm && streaks.recentForm.length > 0 ? (
                streaks.recentForm.map((outcome, idx) => (
                  <span
                    key={`form-${idx}`}
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shadow-sm ${
                      outcome === "win"
                        ? "bg-emerald-500 text-white"
                        : outcome === "loss"
                        ? "bg-red-500 text-white"
                        : "bg-gray-600 text-white"
                    }`}
                    title={`Game ${idx + 1}: ${outcome.toUpperCase()}`}
                  >
                    {outcome === "win" ? "W" : outcome === "loss" ? "L" : "D"}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">No recent matches</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Matches History List */}
      <div
        className="rounded-2xl border p-5 md:p-6 space-y-4 shadow-lg"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--surface-border)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-lg font-bold text-white">Recent Match History</h3>
          </div>

          <span className="text-xs text-gray-400">
            {recentMatches.length} recorded
          </span>
        </div>

        {recentMatches.length > 0 ? (
          <div className="space-y-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--surface-border)] text-gray-400">
                    <th className="pb-2.5 font-semibold">Date</th>
                    <th className="pb-2.5 font-semibold">Format</th>
                    <th className="pb-2.5 font-semibold">Side</th>
                    <th className="pb-2.5 font-semibold">Opponent</th>
                    <th className="pb-2.5 font-semibold">Result</th>
                    <th className="pb-2.5 font-semibold text-right">Rating Δ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-border)]">
                  {displayedMatches.map((m) => {
                    const outcomeColor =
                      m.result === "win"
                        ? "text-[var(--success)]"
                        : m.result === "loss"
                        ? "text-[var(--danger)]"
                        : "text-[var(--primary)]";

                    const outcomeBadge =
                      m.result === "win"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : m.result === "loss"
                        ? "bg-red-500/15 text-red-400 border border-red-500/30"
                        : "bg-gray-500/15 text-gray-300 border border-gray-500/30";

                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-[var(--surface-card-hover)] transition-colors"
                      >
                        {/* Date */}
                        <td className="py-3 text-gray-400 whitespace-nowrap">
                          {m.formattedDate}
                        </td>

                        {/* Format */}
                        <td className="py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-[var(--surface-main)] border border-[var(--surface-border)] text-gray-300">
                            {m.format}
                            <span className="text-[10px] text-gray-500 ml-1">
                              ({m.timeControlName})
                            </span>
                          </span>
                        </td>

                        {/* Side / Color */}
                        <td className="py-3 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-gray-300 font-medium">
                            <span
                              className={`w-2.5 h-2.5 rounded-full inline-block border ${
                                m.userColor === "white"
                                  ? "bg-white border-gray-400"
                                  : "bg-gray-900 border-gray-600"
                              }`}
                            />
                            {m.userColor === "white" ? "White" : "Black"}
                          </span>
                        </td>

                        {/* Opponent */}
                        <td className="py-3 whitespace-nowrap">
                          <span className="font-semibold text-white">
                            {m.opponentName}
                          </span>
                          <span className="text-gray-500 text-[10px] ml-1.5">
                            ({m.opponentRating})
                          </span>
                        </td>

                        {/* Result */}
                        <td className="py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${outcomeBadge}`}
                          >
                            {m.result}
                          </span>
                        </td>

                        {/* Rating Change */}
                        <td className="py-3 whitespace-nowrap text-right font-bold">
                          {m.ratingChange !== 0 ? (
                            <span
                              className={
                                m.ratingChange > 0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }
                            >
                              {m.ratingChange > 0
                                ? `+${m.ratingChange}`
                                : m.ratingChange}
                            </span>
                          ) : (
                            <span className="text-gray-500">0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Toggle Show All */}
            {recentMatches.length > 6 && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllMatches((prev) => !prev)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-[var(--surface-main)] hover:bg-[var(--surface-card-hover)] border border-[var(--surface-border)] transition-all inline-flex items-center gap-1.5"
                >
                  {showAllMatches ? (
                    <>
                      <span>Show Less</span>
                      <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                    </>
                  ) : (
                    <>
                      <span>Show All {recentMatches.length} Matches</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 text-xs">
            No match history yet. Games you play will be detailed here.
          </div>
        )}
      </div>
    </div>
  );
}