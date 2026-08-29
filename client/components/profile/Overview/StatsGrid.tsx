"use client";

interface StatsGridProps {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  winRate: number;
}

export default function StatsGrid({
  gamesPlayed,
  gamesWon,
  gamesLost,
  gamesDrawn,
  winRate,
}: StatsGridProps) {
  const defeatRate =
    gamesPlayed > 0 ? Math.round((gamesLost / gamesPlayed) * 100) : 0;

  const drawRate =
    gamesPlayed > 0 ? Math.round((gamesDrawn / gamesPlayed) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Matches */}
      <div className="bg-[#161920] border border-[#232732] rounded-xl p-5 space-y-1">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
          Total Matches
        </p>

        <p className="text-3xl font-extrabold text-white">
          {gamesPlayed}
        </p>

        <p className="text-xs text-gray-500">
          All recorded matches
        </p>
      </div>

      {/* Victories */}
      <div className="bg-[#161920] border border-[#232732] rounded-xl p-5 space-y-1">
        <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          Victories
        </p>

        <p className="text-3xl font-extrabold text-emerald-400">
          {gamesWon}
        </p>

        <p className="text-xs text-gray-500">
          {winRate}% victory rate
        </p>
      </div>

      {/* Defeats */}
      <div className="bg-[#161920] border border-[#232732] rounded-xl p-5 space-y-1">
        <p className="text-red-400 text-xs font-semibold uppercase tracking-wider">
          Defeats
        </p>

        <p className="text-3xl font-extrabold text-red-400">
          {gamesLost}
        </p>

        <p className="text-xs text-gray-500">
          {defeatRate}% defeat rate
        </p>
      </div>

      {/* Draws */}
      <div className="bg-[#161920] border border-[#232732] rounded-xl p-5 space-y-1">
        <p className="text-[#babcbd] text-xs font-semibold uppercase tracking-wider">
          Draws
        </p>

        <p className="text-3xl font-extrabold text-[#babcbd]">
          {gamesDrawn}
        </p>

        <p className="text-xs text-gray-500">
          {drawRate}% draw rate
        </p>
      </div>
    </div>
  );
}