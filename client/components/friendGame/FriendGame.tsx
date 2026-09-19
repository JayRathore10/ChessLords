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
import { JoinRoom } from "./JoinRoom";

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
      <JoinRoom
        joinRoomCodeInput={joinRoomCodeInput}
        setJoinRoomCodeInput={setJoinRoomCodeInput}
        isJoiningRoom={isJoiningRoom}
        joinRoomError={joinRoomError}
        handleJoinFriendRoom={handleJoinFriendRoom}
      />
    </div>
  );
}

export default FriendGame;
