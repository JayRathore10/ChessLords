import Link from "next/link";
import { User } from "@/lib/auth-context";
import { Trophy } from "lucide-react";

interface PlayerStatsCardrops{
  user: User | null;
}
const PlayerStatsCard = ({user}:PlayerStatsCardrops) => {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-gradient text-[var(--surface-main)] font-black text-xl flex items-center justify-center shadow-md">
          {user?.username ? user.username[0].toUpperCase() : "G"}
        </div>
        <div>
          <h3 className="font-bold text-white text-base">
            {user ? user.username : "Guest Player"}
          </h3>
          <p className="text-xs text-gray-400">
            {user
              ? `${user.name || "Member"}`
              : "Sign in to save rating & stats"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="p-3 bg-[var(--surface-main)] rounded-xl border border-[var(--surface-border)]">
          <p className="text-[11px] text-gray-400 uppercase font-medium">
            Rating
          </p>
          <p className="text-xl font-extrabold text-white flex items-center gap-1.5 mt-0.5">
            <Trophy className="w-4 h-4 text-[var(--primary)]" />
            {user?.rating ?? 1200}
          </p>
        </div>
        <div className="p-3 bg-[var(--surface-main)] rounded-xl border border-[var(--surface-border)]">
          <p className="text-[11px] text-gray-400 uppercase font-medium">
            Won / Lost
          </p>
          <p className="text-base font-bold text-white mt-0.5">
            {user?.gamesWon ?? 0} / {user?.gamesLost ?? 0}
          </p>
        </div>
      </div>

      {!user && (
        <Link
          href="/register"
          className="block w-full py-2.5 text-center text-xs font-semibold text-[var(--surface-main)] bg-[var(--primary)] rounded-xl shadow hover:bg-[var(--primary-hover)] transition"
        >
          Create Account to Track Stats
        </Link>
      )}
    </div>
  )
}

export default PlayerStatsCard;