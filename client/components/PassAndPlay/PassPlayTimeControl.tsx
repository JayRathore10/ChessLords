import React from "react";
import { Tv } from "lucide-react";

interface PassPlayTimeControlProps {
  passPlayMinutes: number;
  setPassPlayMinutes: React.Dispatch<React.SetStateAction<number>>;

  handleStartPassAndPlay: () => void;
  isStartingPassPlay: boolean;
}

const PassPlayTimeControl = ({
  passPlayMinutes,
  setPassPlayMinutes,
  handleStartPassAndPlay,
  isStartingPassPlay,
}: PassPlayTimeControlProps) => {
  return (
    <>
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
          {isStartingPassPlay
            ? "Setting up board..."
            : "Start Local Game"}
        </span>
      </button>
    </>
  );
};

export default PassPlayTimeControl;