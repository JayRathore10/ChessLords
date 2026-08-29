"use client";
import { Award } from "lucide-react";

interface PerformanceBreakdownProps {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
}

export default function PerformanceBreakdown({
  gamesPlayed,
  gamesWon,
  gamesLost,
  gamesDrawn,
}: PerformanceBreakdownProps) {
  return (
    <div className="sm:col-span-2 lg:col-span-4 bg-[#161920] border border-[#232732] rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Award className="w-5 h-5 text-[#babcbd]" />
        <span>Performance Breakdown</span>
      </h3>

      {gamesPlayed > 0 ? (
        <div className="space-y-2">
          {/* Performance Bar */}
          <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{
                width: `${(gamesWon / gamesPlayed) * 100}%`,
              }}
              title={`Won: ${gamesWon}`}
            />

            <div
              className="bg-[#babcbd] h-full transition-all"
              style={{
                width: `${(gamesDrawn / gamesPlayed) * 100}%`,
              }}
              title={`Drawn: ${gamesDrawn}`}
            />

            <div
              className="bg-red-500 h-full transition-all"
              style={{
                width: `${(gamesLost / gamesPlayed) * 100}%`,
              }}
              title={`Lost: ${gamesLost}`}
            />
          </div>

          {/* Legend */}
          <div className="flex justify-between text-xs text-gray-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Won ({gamesWon})
            </span>

            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#babcbd] inline-block" />
              Drawn ({gamesDrawn})
            </span>

            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              Lost ({gamesLost})
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          No games played yet. Play your first match to start tracking your
          performance!
        </p>
      )}
    </div>
  );
}