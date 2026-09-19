import type { Dispatch, SetStateAction } from "react";
import type { TimeControlOption } from "@/lib/timeControls"; // adjust path

interface FriendGameProps {
  setFriendColor: Dispatch<SetStateAction<"random" | "white" | "black">>;
  friendColor: "random" | "white" | "black";

  setSelectedTc: Dispatch<SetStateAction<TimeControlOption>>;
  selectedTc: TimeControlOption;

  isCreatingRoom: boolean;

  createdRoomGameId: string | null;
  createdRoomCode: string | null;

  copiedLink: boolean;
  copiedCode: boolean;

  copyToClipboard: (text: string, type: "code" | "link") => void;

  handleCreateFriendRoom: () => void;
  handleJoinFriendRoom: () => void;

  setIsCustomTc: Dispatch<SetStateAction<boolean>>;
}

import { CreateRoom } from "./CreateRoom";

function FriendGame({
  setFriendColor,
  friendColor,
  setSelectedTc,
  isCreatingRoom,
  selectedTc,
  createdRoomGameId,
  createdRoomCode,
  copiedLink,
  copyToClipboard,
  copiedCode,
  handleCreateFriendRoom,
  handleJoinFriendRoom,
  setIsCustomTc,
}: FriendGameProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Create Friend Room Box */}
      <CreateRoom
        setFriendColor={setFriendColor}
        friendColor={friendColor}
        setIsCustomTc={setIsCustomTc}
        setSelectedTc={setSelectedTc}
        createdRoomCode={createdRoomCode}
        createdRoomGameId={createdRoomGameId}
        isCustomTc={isCustomTc}
        selectedTc={selectedTc}
        copiedLink={copiedLink}
        copiedCode={copiedCode}
        isCreatingRoom={isCreatingRoom}
        handleCreateFriendRoom={handleCreateFriendRoom}
        copyToClipboard={copyToClipboard}
      />

      {/* Join Existing Room Box */}
      <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-[var(--primary)]" />
              Join a Friend&apos;s Game
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Have an invite code or link from your friend? Enter it below.
            </p>
          </div>

          <form onSubmit={handleJoinFriendRoom} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Enter 6-digit Room Code
              </label>
              <div className="relative mt-2">
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. AB4X9K"
                  value={joinRoomCodeInput}
                  onChange={(e) =>
                    setJoinRoomCodeInput(e.target.value.toUpperCase())
                  }
                  className="w-full px-4 py-3.5 bg-[var(--surface-main)] border border-[var(--surface-border)] rounded-xl text-lg font-mono tracking-widest text-white uppercase placeholder-gray-600 focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>

            {joinRoomError && (
              <p className="text-xs font-medium text-red-400">
                {joinRoomError}
              </p>
            )}

            <button
              type="submit"
              disabled={isJoiningRoom || !joinRoomCodeInput.trim()}
              className="w-full py-3.5 rounded-xl font-bold bg-[var(--primary)] text-[var(--surface-main)] hover:bg-[var(--primary-hover)] transition shadow disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isJoiningRoom ? "Connecting..." : "Join Game"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Helpful Tips Card */}
        <div className="p-4 rounded-xl bg-[var(--surface-main)]/60 border border-[var(--surface-border)] space-y-2 text-xs text-gray-400">
          <p className="font-semibold text-gray-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
            Pro-Tip:
          </p>
          <p>
            You can directly send your friend the complete link, and opening it
            will connect them into the game automatically!
          </p>
        </div>
      </div>
    </div>
  );
}

export default FriendGame;
