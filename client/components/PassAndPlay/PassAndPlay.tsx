import React from "react";
import { Tv } from "lucide-react";

import PlayerNamesForm from "./PlayerNamesForm";

interface PassAndPlayProps {
  p1Name: string;
  setP1Name: React.Dispatch<React.SetStateAction<string>>;

  p2Name: string;
  setP2Name: React.Dispatch<React.SetStateAction<string>>;

  passPlayMinutes: number;
  setPassPlayMinutes: React.Dispatch<React.SetStateAction<number>>;

  handleStartPassAndPlay: () => void;

  isStartingPassPlay: boolean;
}

const PassAndPlay = ({
  p1Name,
  setP1Name,
  p2Name,
  setP2Name,
  passPlayMinutes,
  setPassPlayMinutes,
  handleStartPassAndPlay,
  isStartingPassPlay,
}: PassAndPlayProps) => {
  return (
    <div className="max-w-2xl mx-auto bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-[var(--primary-muted)] border border-[var(--primary-border)] text-[var(--primary)] mx-auto flex items-center justify-center">
          <Tv className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-extrabold text-white">Pass & Play Mode</h2>

        <p className="text-xs text-gray-400">
          Play locally with a friend on the same screen or tablet with move
          tracking.
        </p>
      </div>

      <div className="space-y-4 pt-2">
        <PlayerNamesForm
          p1Name={p1Name}
          setP1Name={setP1Name}
          p2Name={p2Name}
          setP2Name={setP2Name}
        />

        {/* Timer options */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-gray-300 uppercase">
            Time Control per Player
          </label>

          <div className="grid grid-cols-4 gap-2.5">
            {[
              { label: "5m", mins: 5 },
              { label: "10m", mins: 10 },
              { label: "15m", mins: 15 },
              { label: "30m", mins: 30 },
            ].map((t) => (
              <button
                key={t.mins}
                onClick={() => setPassPlayMinutes(t.mins)}
                className={`py-2.5 rounded-xl border text-xs font-bold transition ${
                  passPlayMinutes === t.mins
                    ? "bg-[var(--primary)] text-[var(--surface-main)] border-[var(--primary)]"
                    : "bg-[var(--surface-main)] border-[var(--surface-border)] text-gray-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartPassAndPlay}
          disabled={isStartingPassPlay}
          className="w-full mt-4 py-4 rounded-xl font-extrabold bg-primary-gradient text-[var(--surface-main)] hover:opacity-95 shadow-xl glow-primary transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Tv className="w-5 h-5" />

          <span>
            {isStartingPassPlay ? "Setting up board..." : "Start Local Game"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default PassAndPlay;
