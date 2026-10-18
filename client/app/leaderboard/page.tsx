"use client";

import { useEffect, useState } from "react";

interface LeaderboardPlayer {
  _id: string;
  rank: number;
  username: string;
  name: string;
  profilePic: string;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
}

interface LeaderboardResponse {
  success: boolean;
  count: number;
  users: LeaderboardPlayer[];
}

export default function Leaderboard() {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "")}/api/v1/users/leaderboard`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard.");
      }

      const data: LeaderboardResponse = await response.json();

      if (!data.success || !Array.isArray(data.users)) {
        throw new Error("Invalid leaderboard response.");
      }

      setPlayers(data.users);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading the leaderboard.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setError("");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/leaderboard`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard.");
        }

        const data: LeaderboardResponse = await response.json();

        if (!data.success || !Array.isArray(data.users)) {
          throw new Error("Invalid leaderboard response.");
        }

        setPlayers(data.users);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the leaderboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary">Leaderboard</h1>
          <p className="mt-2 text-foreground/60">
            Top players ranked by rating
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-xl">
          {/* Table Header */}
          <div className="grid grid-cols-12 border-b border-surface-border px-6 py-4 text-sm font-medium text-foreground/50">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-2 text-center">Rating</div>
            <div className="col-span-2 text-center">Wins</div>
            <div className="col-span-2 text-center">Losses</div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="px-6 py-10 text-center text-foreground/60">
              Loading leaderboard...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="px-6 py-10 text-center">
              <p className="text-danger">{error}</p>

              <button
                type="button"
                onClick={fetchLeaderboard}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-white"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && players.length === 0 && (
            <div className="px-6 py-10 text-center text-foreground/60">
              No players found.
            </div>
          )}

          {/* Players */}
          {!loading &&
            !error &&
            players.map((player, index) => (
              <div
                key={player._id}
                className={`grid grid-cols-12 items-center px-6 py-5 transition hover:bg-surface-card-hover ${
                  index !== players.length - 1
                    ? "border-b border-surface-border"
                    : ""
                }`}
              >
                {/* Rank */}
                <div className="col-span-1">
                  <span
                    className={`font-bold ${
                      player.rank === 1
                        ? "text-game-bullet"
                        : player.rank === 2
                          ? "text-primary"
                          : player.rank === 3
                            ? "text-game-rapid"
                            : "text-foreground/50"
                    }`}
                  >
                    {player.rank}
                  </span>
                </div>

                {/* Player */}
                <div className="col-span-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-muted font-bold text-primary">
                    {player.profilePic &&
                    player.profilePic !== "default.jpg" ? (
                      <img
                        src={
                          player.profilePic.startsWith("http")
                            ? player.profilePic
                            : `${process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "")}/${player.profilePic.replace(/^\/+/, "")}`
                        }
                        alt={`${player.username}'s avatar`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      (player.name || player.username || "?")
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0">
                    <span className="block truncate font-medium text-foreground">
                      {player.name || player.username}
                    </span>
                    <span className="block truncate text-xs text-foreground/50">
                      @{player.username}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="col-span-2 text-center">
                  <span className="font-bold text-primary">
                    {player.rating}
                  </span>
                </div>

                {/* Wins */}
                <div className="col-span-2 text-center text-success">
                  {player.gamesWon}
                </div>

                {/* Losses */}
                <div className="col-span-2 text-center text-danger">
                  {player.gamesLost}
                </div>
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}
