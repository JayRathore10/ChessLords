import { User } from "@/lib/auth-context";
import { Compass, Zap ,  Trophy } from "lucide-react";
import Link from "next/link";

import TimeControlGrid from "./TimeControlGrid";
import CustomTimeControl from "./CustomTimeControl";
import GameModeInfo from "./GameModesInfo";

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
      <GameModeInfo
      user = {user}
      />
    </div>
  );
};

export default QuickMatch;
