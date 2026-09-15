import { User } from "@/lib/auth-context";
import { Compass, Zap ,  Trophy } from "lucide-react";
import Link from "next/link";

import TimeControlGrid from "./TimeControlGrid";
import CustomTimeControl from "./CustomTimeControl";

export interface TimeControlOption {
  id: string;
  name: string;
  category: "bullet" | "blitz" | "rapid" | "classical";
  initialTime: number; // seconds
  increment: number; // seconds
  icon: string;
  colorClass: string;
  popular?: boolean;
};

interface QuickMatchProps {
  selectedTc: TimeControlOption;
  setSelectedTc: React.Dispatch<React.SetStateAction<TimeControlOption>>;

  gameType: "rated" | "casual";
  setGameType: React.Dispatch<React.SetStateAction<"rated" | "casual">>;

  isCustomTc: boolean;
  setIsCustomTc: React.Dispatch<React.SetStateAction<boolean>>;

  customMinutes: number;
  setCustomMinutes: React.Dispatch<React.SetStateAction<number>>;

  customIncrement: number;
  setCustomIncrement: React.Dispatch<React.SetStateAction<number>>;

  handleStartSearch: () => void;
  user: User | null;
}

const QuickMatch = ({
  setGameType,
  gameType,
  selectedTc,
  setSelectedTc,
  isCustomTc,
  setIsCustomTc,
  customMinutes,
  setCustomMinutes,
  customIncrement,
  setCustomIncrement,
  handleStartSearch,
  user,
}: QuickMatchProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left 2 Cols: Time Controls Grid */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-6 shadow-xl space-y-6">
          {/* Header & Rated Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-[var(--primary)]" />
                Choose Time Control
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Fast pairings with opponents near your rating
              </p>
            </div>

            {/* Rated / Casual Mode Selector */}
            <div className="flex items-center bg-[var(--surface-main)] border border-[var(--surface-border)] rounded-xl p-1 text-xs font-semibold">
              <button
                onClick={() => setGameType("rated")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  gameType === "rated"
                    ? "bg-[var(--primary)] text-[var(--surface-main)] shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Rated
              </button>
              <button
                onClick={() => setGameType("casual")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  gameType === "casual"
                    ? "bg-white/15 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Casual
              </button>
            </div>
          </div>

          {/* Preset Time Controls Grid */}
          <TimeControlGrid
            selectedTc={selectedTc}
            isCustomTc={isCustomTc}
            setSelectedTc={setSelectedTc}
            setIsCustomTc={setIsCustomTc}
          />

          {/* Custom Time Control Configurator Slider */}
          {isCustomTc && (
            <CustomTimeControl
              customMinutes={customMinutes}
              customIncrement={customIncrement}
              setCustomMinutes={setCustomMinutes}
              setCustomIncrement={setCustomIncrement}
            />
          )}

          {/* Quick Play CTA Button */}
          <button
            onClick={handleStartSearch}
            className="w-full py-4 rounded-xl font-extrabold text-base bg-primary-gradient text-[var(--surface-main)] hover:opacity-95 shadow-xl glow-primary transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Zap className="w-5 h-5 fill-current" />
            <span>
              Play{" "}
              {isCustomTc
                ? `${customMinutes}+${customIncrement}`
                : selectedTc.name}{" "}
              ({gameType.toUpperCase()})
            </span>
          </button>
        </div>
      </div>

      {/* Right 1 Col: User Stats & Game Modes Info */}
      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-gradient text-[var(--surface-main)] font-black text-xl flex items-center justify-center shadow-md">
              {user?.username ? user.username[0].toUpperCase() : "G"}
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {user ? user.username : "Guest Player"}
              </h3>
              <p className="text-xs text-gray-400">
                {user
                  ? `${user.name || "Member"}`
                  : "Sign in to save rating & stats"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-[var(--surface-main)] rounded-xl border border-[var(--surface-border)]">
              <p className="text-[11px] text-gray-400 uppercase font-medium">
                Rating
              </p>
              <p className="text-xl font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                <Trophy className="w-4 h-4 text-[var(--primary)]" />
                {user?.rating ?? 1200}
              </p>
            </div>
            <div className="p-3 bg-[var(--surface-main)] rounded-xl border border-[var(--surface-border)]">
              <p className="text-[11px] text-gray-400 uppercase font-medium">
                Won / Lost
              </p>
              <p className="text-base font-bold text-white mt-0.5">
                {user?.gamesWon ?? 0} / {user?.gamesLost ?? 0}
              </p>
            </div>
          </div>

          {!user && (
            <Link
              href="/register"
              className="block w-full py-2.5 text-center text-xs font-semibold text-[var(--surface-main)] bg-[var(--primary)] rounded-xl shadow hover:bg-[var(--primary-hover)] transition"
            >
              Create Account to Track Stats
            </Link>
          )}
        </div>

        {/* Game Speed Guide */}
        <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Game Modes Info
          </h4>
          <div className="space-y-2 text-xs text-gray-300">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-main)]/60">
              <span className="flex items-center gap-2 font-medium">
                <span className="text-amber-400">⚡ Bullet</span> &lt; 3 mins
              </span>
              <span className="text-gray-400">Ultra Fast</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-main)]/60">
              <span className="flex items-center gap-2 font-medium">
                <span className="text-yellow-400">🔥 Blitz</span> 3 - 5 mins
              </span>
              <span className="text-gray-400">Most Popular</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-main)]/60">
              <span className="flex items-center gap-2 font-medium">
                <span className="text-emerald-400">⏱️ Rapid</span> 10+ mins
              </span>
              <span className="text-gray-400">Strategic</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickMatch;
