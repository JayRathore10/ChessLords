import React from "react";

interface PlayerNamesFormProps {
  p1Name: string;
  setP1Name: React.Dispatch<React.SetStateAction<string>>;

  p2Name: string;
  setP2Name: React.Dispatch<React.SetStateAction<string>>;
}

const PlayerNamesForm = ({
  p1Name,
  setP1Name,
  p2Name,
  setP2Name,
}: PlayerNamesFormProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="text-xs font-semibold text-gray-300 uppercase">
          Player 1 (White)
        </label>

        <input
          type="text"
          value={p1Name}
          onChange={(e) => setP1Name(e.target.value)}
          className="w-full mt-1.5 px-4 py-2.5 bg-[var(--surface-main)] border border-[var(--surface-border)] rounded-xl text-sm text-white focus:outline-none focus:border-[var(--primary)]"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-300 uppercase">
          Player 2 (Black)
        </label>

        <input
          type="text"
          value={p2Name}
          onChange={(e) => setP2Name(e.target.value)}
          className="w-full mt-1.5 px-4 py-2.5 bg-[var(--surface-main)] border border-[var(--surface-border)] rounded-xl text-sm text-white focus:outline-none focus:border-[var(--primary)]"
        />
      </div>
    </div>
  );
};

export default PlayerNamesForm;