import type { Dispatch, SetStateAction } from "react";
import type { TimeControlOption } from "@/lib/timeControls"; // adjust path

import { CreateRoom } from "./CreateRoom";
import { JoinRoom } from "./JoinRoom";

interface FriendGameProps {
  setFriendColor: Dispatch<SetStateAction<"random" | "white" | "black">>;
  friendColor: "random" | "white" | "black";

  setSelectedTc: Dispatch<SetStateAction<TimeControlOption>>;
  selectedTc: TimeControlOption;
  
  createdRoomGameId: string | null;
  createdRoomCode: string | null;
  
  copyToClipboard: (text: string, type: "code" | "link") => void;

  handleCreateFriendRoom: () => void;
  handleJoinFriendRoom: (e: React.FormEvent) => Promise<void>;

  isCustomTc: boolean;
  setIsCustomTc: Dispatch<SetStateAction<boolean>>;

  isCreatingRoom: boolean;
  setIsCreatingRoom: React.Dispatch<React.SetStateAction<boolean>>;

  joinRoomCodeInput: string;
  setJoinRoomCodeInput: React.Dispatch<React.SetStateAction<string>>;

  isJoiningRoom: boolean;
  setIsJoiningRoom: React.Dispatch<React.SetStateAction<boolean>>;

  joinRoomError: string;
  setJoinRoomError: React.Dispatch<React.SetStateAction<string>>;

  copiedLink: boolean;
  setCopiedLink: React.Dispatch<React.SetStateAction<boolean>>;

  copiedCode: boolean;
  setCopiedCode: React.Dispatch<React.SetStateAction<boolean>>;
}

function FriendGame({
  setFriendColor,
  friendColor,

  setSelectedTc,
  selectedTc,

  createdRoomGameId,
  createdRoomCode,

  copyToClipboard,

  handleCreateFriendRoom,
  handleJoinFriendRoom,

  isCustomTc,
  setIsCustomTc,

  isCreatingRoom,

  joinRoomCodeInput,
  setJoinRoomCodeInput,

  isJoiningRoom,

  joinRoomError,

  copiedLink,
  copiedCode,
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
