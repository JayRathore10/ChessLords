const GameModeInfo = () => {
  return (
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
  );
};

export default GameModeInfo;
