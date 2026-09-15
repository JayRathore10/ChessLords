interface TimeControlGridProps {
  customMinutes: number;
  setCustomMinutes: React.Dispatch<React.SetStateAction<number>>;

  customIncrement: number;
  setCustomIncrement: React.Dispatch<React.SetStateAction<number>>;
}

const TimeControlGrid = ({customMinutes , setCustomIncrement , setCustomMinutes , customIncrement} : TimeControlGridProps) => {
  return (
    <div className="p-4 rounded-xl bg-[var(--surface-main)] border border-[var(--game-custom-border)]/50 space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-300">
          Custom Time Control:{" "}
          <strong className="text-[var(--game-custom)]">
            {customMinutes} min + {customIncrement}s
          </strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-400 flex justify-between">
            <span>Initial Minutes</span>
            <span className="font-semibold text-white">{customMinutes}m</span>
          </label>
          <input
            type="range"
            min="1"
            max="60"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Number(e.target.value))}
            className="w-full mt-2 accent-[var(--game-custom)] cursor-pointer"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 flex justify-between">
            <span>Increment per Move</span>
            <span className="font-semibold text-white">{customIncrement}s</span>
          </label>
          <input
            type="range"
            min="0"
            max="30"
            value={customIncrement}
            onChange={(e) => setCustomIncrement(Number(e.target.value))}
            className="w-full mt-2 accent-[var(--game-custom)] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default TimeControlGrid;
