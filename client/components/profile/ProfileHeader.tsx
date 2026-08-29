"use client";

import React from "react";
import Link from "next/link";
import { Trophy, Swords, Flame } from "lucide-react";
import type { User } from "@/lib/auth-context";

interface ProfileHeaderProps {
  user: User;
  gamesPlayed: number;
  winRate: number;
}

export default function ProfileHeader({
  user,
  gamesPlayed,
  winRate,
}: ProfileHeaderProps) {
  return (
    <div className="relative bg-[#161920] border border-[#232732] rounded-2xl p-6 sm:p-8 overflow-hidden shadow-2xl">
      {/* Subtle platinum accent light */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#babcbd]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-2xl bg-primary-gradient text-[#0f1115] font-extrabold text-3xl flex items-center justify-center shadow-xl shadow-black/40 border-2 border-white/10 shrink-0">
          {user.name
            ? user.name[0].toUpperCase()
            : user.username[0].toUpperCase()}
        </div>

        {/* User Details */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {user.name || user.username}
            </h1>

            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#babcbd]/10 text-[#babcbd] border border-[#babcbd]/25">
              @{user.username}
            </span>

            {user.role === "admin" && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/25">
                Admin
              </span>
            )}
          </div>

          <p className="text-gray-400 text-sm">{user.email}</p>

          {/* Badges / Rating quick stats */}
          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4">
            <div className="flex items-center gap-1.5 text-[#babcbd] text-sm font-semibold">
              <Trophy className="w-4 h-4 text-[#babcbd]" />
              <span>Rating: {user.rating ?? 1200}</span>
            </div>

            <div className="flex items-center gap-1.5 text-blue-400 text-sm font-semibold">
              <Swords className="w-4 h-4" />
              <span>{gamesPlayed} Games Played</span>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
              <Flame className="w-4 h-4" />
              <span>{winRate}% Win Rate</span>
            </div>
          </div>
        </div>

        {/* Quick Action: Play Button */}
        <div className="shrink-0">
          <Link
            href="/game"
            className="px-5 py-2.5 bg-linear-to-r from-[#babcbd] to-[#cfd1d2] hover:from-[#cfd1d2] hover:to-[#e4e5e6] text-[#0f1115] font-bold rounded-xl shadow-lg shadow-black/40 flex items-center gap-2 transition active:scale-95 text-sm"
          >
            <Swords className="w-4 h-4" />
            <span>Play a Game</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

