import Link from "next/link";
import { Share2, Check, Copy } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

interface TimeControl {
  id: string;
  name: string;
  category: string;
  initialTime: number;
  increment: number;
  icon: string;
  colorClass: string;
}

interface CreateRoomProps {
  friendColor: "white" | "black" | "random";
  setFriendColor: Dispatch<SetStateAction<"white" | "black" | "random">>;

  isCustomTc: boolean;
  setIsCustomTc: Dispatch<SetStateAction<boolean>>;

  selectedTc: TimeControl;
  setSelectedTc: Dispatch<SetStateAction<TimeControl>>;

  createdRoomCode: string | null;
  createdRoomGameId: string;

  copiedLink: boolean;
  copiedCode: boolean;

  isCreatingRoom: boolean;

  handleCreateFriendRoom: () => void;

  copyToClipboard: (
    text: string,
    type: "code" | "link"
  ) => void;
}

export const CreateRoom = ({
  setFriendColor,
  friendColor,
  setIsCustomTc,
  setSelectedTc,
  createdRoomCode,
  createdRoomGameId,
  isCustomTc,
  selectedTc,
  copiedLink,
  copiedCode,
  isCreatingRoom,
  handleCreateFriendRoom,
  copyToClipboard,
}: CreateRoomProps) => {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-6 shadow-xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[var(--primary)]" />
          Create a Custom Challenge
        </h2>

        <p className="text-xs text-gray-400 mt-1">
          Set custom time controls, pick your piece color, and share the invite
          link.
        </p>
      </div>

      {/* Color Preference */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
          I Want to Play As
        </label>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setFriendColor("white")}
            className={`py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              friendColor === "white"
                ? "border-white bg-white/10 text-white shadow"
                : "border-[var(--surface-border)] bg-[var(--surface-main)] text-gray-400 hover:text-white"
            }`}
          >
            <span>⚪</span> White
          </button>

          <button
            onClick={() => setFriendColor("random")}
            className={`py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              friendColor === "random"
                ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)] shadow"
                : "border-[var(--surface-border)] bg-[var(--surface-main)] text-gray-400 hover:text-white"
            }`}
          >
            <span>🎲</span> Random
          </button>

          <button
            onClick={() => setFriendColor("black")}
            className={`py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              friendColor === "black"
                ? "border-gray-500 bg-gray-900 text-white shadow"
                : "border-[var(--surface-border)] bg-[var(--surface-main)] text-gray-400 hover:text-white"
            }`}
          >
            <span>⚫</span> Black
          </button>
        </div>
      </div>

      {/* Time Control Selection */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
          Time Control
        </label>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "1 min", time: 60, inc: 0 },
            { label: "3 min", time: 180, inc: 0 },
            { label: "3 | 2", time: 180, inc: 2 },
            { label: "5 min", time: 300, inc: 0 },
            { label: "10 min", time: 600, inc: 0 },
            { label: "15 | 10", time: 900, inc: 10 },
            { label: "30 min", time: 1800, inc: 0 },
            { label: "Unlimited", time: 3600, inc: 0 },
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedTc({
                  id: `custom-${preset.time}-${preset.inc}`,
                  name: preset.label,
                  category: "blitz",
                  initialTime: preset.time,
                  increment: preset.inc,
                  icon: "♟️",
                  colorClass: "",
                });

                setIsCustomTc(false);
              }}
              className={`py-2 px-1 text-xs font-semibold rounded-lg border transition ${
                !isCustomTc &&
                selectedTc.initialTime === preset.time &&
                selectedTc.increment === preset.inc
                  ? "bg-[var(--primary)] text-[var(--surface-main)] border-[var(--primary)] font-bold"
                  : "bg-[var(--surface-main)] border-[var(--surface-border)] text-gray-400 hover:text-white"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Button */}
      {!createdRoomCode ? (
        <button
          onClick={handleCreateFriendRoom}
          disabled={isCreatingRoom}
          className="w-full py-3.5 rounded-xl font-bold bg-primary-gradient text-[var(--surface-main)] hover:opacity-95 shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Share2 className="w-4 h-4" />

          <span>
            {isCreatingRoom
              ? "Generating Challenge..."
              : "Create Challenge Link"}
          </span>
        </button>
      ) : (
        <div className="p-5 bg-[var(--surface-main)] border border-[var(--primary-border)] rounded-2xl space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              Invite Created! Share with friend:
            </span>

            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          </div>

          {/* Room Code Badge */}
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

          {/* Shareable URL Copy */}
          <div className="p-3 bg-[var(--surface-card)] rounded-xl border border-[var(--surface-border)] flex items-center justify-between gap-2">
            <p className="text-xs text-gray-300 truncate font-mono">
              {typeof window !== "undefined"
                ? `${window.location.origin}/game/${createdRoomGameId}?join=${createdRoomCode}`
                : `/game/${createdRoomGameId}?join=${createdRoomCode}`}
            </p>

            <button
              onClick={() => {
                const url = `${window.location.origin}/game/${createdRoomGameId}?join=${createdRoomCode}`;

                copyToClipboard(url, "link");
              }}
              className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--surface-main)] font-semibold text-xs transition hover:bg-[var(--primary-hover)] shrink-0"
            >
              {copiedLink ? "Copied!" : "Copy Link"}
            </button>
          </div>

          {/* Direct Join Button */}
          <Link
            href={`/game/${createdRoomGameId}?join=${createdRoomCode}`}
            className="block w-full py-3 text-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition"
          >
            Enter Waiting Room →
          </Link>
        </div>
      )}
    </div>
  );
};
