import Link from "next/link";
import { Check, Copy } from "lucide-react";

interface RoomCreatedProps {
  createdRoomCode: string;
  createdRoomGameId: string | null;
  copiedLink: boolean;
  copiedCode: boolean;
  copyToClipboard: (
    text: string,
    type: "code" | "link"
  ) => void;
}

export const RoomCreated = ({
  createdRoomCode,
  createdRoomGameId,
  copiedLink,
  copiedCode,
  copyToClipboard,
}: RoomCreatedProps) => {
  const gameUrl = `/game/${createdRoomGameId}?join=${createdRoomCode}`;

  const fullGameUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${gameUrl}`
      : gameUrl;

  return (
    <div className="p-5 bg-[var(--surface-main)] border border-[var(--primary-border)] rounded-2xl space-y-4 animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          Invite Created! Share with friend:
        </span>

        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
      </div>

      {/* Room Code */}
      <div className="p-3 bg-[var(--surface-card)] rounded-xl border border-[var(--surface-border)] flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-400 uppercase">
            Room Code
          </p>

          <p className="text-2xl font-mono font-black text-white tracking-widest">
            {createdRoomCode}
          </p>
        </div>

        <button
          onClick={() =>
            copyToClipboard(createdRoomCode, "code")
          }
          className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
        >
          {copiedCode ? (
            <Check className="w-5 h-5 text-green-400" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Shareable URL */}
      <div className="p-3 bg-[var(--surface-card)] rounded-xl border border-[var(--surface-border)] flex items-center justify-between gap-2">
        <p className="text-xs text-gray-300 truncate font-mono">
          {fullGameUrl}
        </p>

        <button
          onClick={() =>
            copyToClipboard(fullGameUrl, "link")
          }
          className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--surface-main)] font-semibold text-xs transition hover:bg-[var(--primary-hover)] shrink-0"
        >
          {copiedLink ? "Copied!" : "Copy Link"}
        </button>
      </div>

      {/* Enter Waiting Room */}
      <Link
        href={gameUrl}
        className="block w-full py-3 text-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition"
      >
        Enter Waiting Room →
      </Link>
    </div>
  );
};