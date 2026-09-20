import React from "react";
import { Tv } from "lucide-react";

import PlayerNamesForm from "./PlayerNamesForm";
import PassPlayTimeControl from "./PassPlayTimeControl";

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
        <PassPlayTimeControl
          passPlayMinutes={passPlayMinutes}
          setPassPlayMinutes={setPassPlayMinutes}
          handleStartPassAndPlay={handleStartPassAndPlay}
          isStartingPassPlay={isStartingPassPlay}
        />
      </div>
    </div>
  );
};

export default PassAndPlay;
