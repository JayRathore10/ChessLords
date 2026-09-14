/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { socket } from "@/lib/socket";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import {
  Copy,
  Check,
  Sparkles,
  Search,
  ArrowRight,
  Share2,
  Tv,
} from "lucide-react";

import LobbyHeader from "@/components/lobby/LobbyHeader";
import LobbyTabs from "@/components/lobby/LobbyTabs";
import MatchmakingModal from "@/components/lobby/MatchmakingModal";
import QuickMatch from "@/components/QuickMatch/QuickMatch";

interface TimeControlOption {
  id: string;
  name: string;
  category: "bullet" | "blitz" | "rapid" | "classical";
  initialTime: number; // seconds
  increment: number; // seconds
  icon: string;
  colorClass: string;
  popular?: boolean;
}

const TIME_CONTROLS: TimeControlOption[] = [
  // Bullet
  {
    id: "bullet-1-0",
    name: "1 min",
    category: "bullet",
    initialTime: 60,
    increment: 0,
    icon: "⚡",
    colorClass:
      "border-[var(--game-bullet-border)] bg-[var(--game-bullet-bg)] text-[var(--game-bullet)]",
  },
  {
    id: "bullet-1-1",
    name: "1 | 1",
    category: "bullet",
    initialTime: 60,
    increment: 1,
    icon: "⚡",
    colorClass:
      "border-[var(--game-bullet-border)] bg-[var(--game-bullet-bg)] text-[var(--game-bullet)]",
  },
  {
    id: "bullet-2-1",
    name: "2 | 1",
    category: "bullet",
    initialTime: 120,
    increment: 1,
    icon: "⚡",
    colorClass:
      "border-[var(--game-bullet-border)] bg-[var(--game-bullet-bg)] text-[var(--game-bullet)]",
  },

  // Blitz
  {
    id: "blitz-3-0",
    name: "3 min",
    category: "blitz",
    initialTime: 180,
    increment: 0,
    icon: "🔥",
    colorClass:
      "border-[var(--game-blitz-border)] bg-[var(--game-blitz-bg)] text-[var(--game-blitz)]",
    popular: true,
  },
  {
    id: "blitz-3-2",
    name: "3 | 2",
    category: "blitz",
    initialTime: 180,
    increment: 2,
    icon: "🔥",
    colorClass:
      "border-[var(--game-blitz-border)] bg-[var(--game-blitz-bg)] text-[var(--game-blitz)]",
    popular: true,
  },
  {
    id: "blitz-5-0",
    name: "5 min",
    category: "blitz",
    initialTime: 300,
    increment: 0,
    icon: "🔥",
    colorClass:
      "border-[var(--game-blitz-border)] bg-[var(--game-blitz-bg)] text-[var(--game-blitz)]",
    popular: true,
  },
  {
    id: "blitz-5-3",
    name: "5 | 3",
    category: "blitz",
    initialTime: 300,
    increment: 3,
    icon: "🔥",
    colorClass:
      "border-[var(--game-blitz-border)] bg-[var(--game-blitz-bg)] text-[var(--game-blitz)]",
  },

  // Rapid
  {
    id: "rapid-10-0",
    name: "10 min",
    category: "rapid",
    initialTime: 600,
    increment: 0,
    icon: "⏱️",
    colorClass:
      "border-[var(--game-rapid-border)] bg-[var(--game-rapid-bg)] text-[var(--game-rapid)]",
    popular: true,
  },
  {
    id: "rapid-15-10",
    name: "15 | 10",
    category: "rapid",
    initialTime: 900,
    increment: 10,
    icon: "⏱️",
    colorClass:
      "border-[var(--game-rapid-border)] bg-[var(--game-rapid-bg)] text-[var(--game-rapid)]",
  },
  {
    id: "rapid-30-0",
    name: "30 min",
    category: "rapid",
    initialTime: 1800,
    increment: 0,
    icon: "⏱️",
    colorClass:
      "border-[var(--game-rapid-border)] bg-[var(--game-rapid-bg)] text-[var(--game-rapid)]",
  },
];

export default function GameLobbyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"quick" | "friend" | "pass">(
    "quick",
  );

  // Selected time control for quick match
  const [selectedTc, setSelectedTc] = useState<TimeControlOption>(
    TIME_CONTROLS[3],
  ); // Blitz 3m default
  const [gameType, setGameType] = useState<"rated" | "casual">("rated");

  // Custom Time Control state
  const [isCustomTc, setIsCustomTc] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(10);
  const [customIncrement, setCustomIncrement] = useState(0);

  // Matchmaking Queue State
  const [isSearching, setIsSearching] = useState(false);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // "Play with a Friend" state
  const [friendColor, setFriendColor] = useState<"random" | "white" | "black">(
    "random",
  );
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [createdRoomGameId, setCreatedRoomGameId] = useState<string | null>(
    null,
  );
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [joinRoomCodeInput, setJoinRoomCodeInput] = useState("");
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [joinRoomError, setJoinRoomError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // "Pass and Play" state
  const [p1Name, setP1Name] = useState("Player 1 (White)");
  const [p2Name, setP2Name] = useState("Player 2 (Black)");
  const [passPlayMinutes, setPassPlayMinutes] = useState(10);
  const [passPlayIncrement, setPassPlayIncrement] = useState(0);
  const [isStartingPassPlay, setIsStartingPassPlay] = useState(false);

  // Lobby stats
  const [lobbyStats, setLobbyStats] = useState<{
    activeGames: number;
    totalGames: number;
    onlinePlayers: number;
  }>({
    activeGames: 0,
    totalGames: 0,
    onlinePlayers: 1,
  });

  // Check URL query parameters for direct tab or join code
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "friend" || tabParam === "pass" || tabParam === "quick") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tabParam);
    }
    const joinCode = searchParams.get("join");
    if (joinCode) {
      setActiveTab("friend");
      setJoinRoomCodeInput(joinCode.toUpperCase());
    }
  }, [searchParams]);

  // Fetch Lobby stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch<{
          success: boolean;
          stats: {
            activeGames: number;
            totalGames: number;
            onlinePlayers: number;
          };
        }>("/games/lobby/stats");
        if (res.success && res.stats) {
          setLobbyStats(res.stats);
        }
      } catch {
        // Fallback gracefully
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  // Socket setup for matchmaking & room events
  useEffect(() => {
    socket.connect();

    const handleMatchFound = (data: {
      gameId: string;
      color: "white" | "black";
      opponent?: { name: string; rating: number };
      timeControl?: any;
    }) => {
      console.log("[Lobby] Match found! Routing to:", data.gameId);
      setIsSearching(false);
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
      router.push(`/game/${data.gameId}`);
    };

    const handleQueueJoined = () => {
      console.log("[Lobby] Joined matchmaking queue");
    };

    const handleQueueLeft = () => {
      console.log("[Lobby] Left matchmaking queue");
      setIsSearching(false);
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    };

    const handleQueueError = (data: { message: string }) => {
      alert(data.message || "Matchmaking error");
      setIsSearching(false);
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    };

    socket.on("matchFound", handleMatchFound);
    socket.on("queueJoined", handleQueueJoined);
    socket.on("queueLeft", handleQueueLeft);
    socket.on("queueError", handleQueueError);

    return () => {
      socket.off("matchFound", handleMatchFound);
      socket.off("queueJoined", handleQueueJoined);
      socket.off("queueLeft", handleQueueLeft);
      socket.off("queueError", handleQueueError);
    };
  }, [router]);

  // Handle Search timer
  useEffect(() => {
    if (isSearching) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchSeconds(0);
      searchTimerRef.current = setInterval(() => {
        setSearchSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
      setSearchSeconds(0);
    }
    return () => {
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    };
  }, [isSearching]);

  // Start Online Matchmaking
  const handleStartSearch = () => {
    const initialTime = isCustomTc
      ? customMinutes * 60
      : selectedTc.initialTime;
    const increment = isCustomTc ? customIncrement : selectedTc.increment;
    const name = isCustomTc
      ? `${customMinutes}+${customIncrement}`
      : selectedTc.name;

    const storedUserId =
      user?._id || localStorage.getItem("userId") || socket.id;
    const storedUsername = user?.username || user?.name || "Player";
    const rating = user?.rating ?? 1200;

    socket.emit("joinQueue", {
      userId: storedUserId,
      username: storedUsername,
      rating,
      gameType,
      timeControl: {
        initialTime,
        increment,
        name,
      },
    });

    setIsSearching(true);
  };

  // Cancel Online Matchmaking
  const handleCancelSearch = () => {
    socket.emit("leaveQueue");
    setIsSearching(false);
  };

  // Create "Play with a Friend" Room
  const handleCreateFriendRoom = async () => {
    try {
      setIsCreatingRoom(true);
      const initialTime = isCustomTc
        ? customMinutes * 60
        : selectedTc.initialTime;
      const increment = isCustomTc ? customIncrement : selectedTc.increment;
      const tcName = isCustomTc
        ? `Custom (${customMinutes}+${customIncrement})`
        : selectedTc.name;

      const res = await apiFetch<{
        success: boolean;
        game: any;
        inviteCode: string;
      }>("/games/create", {
        method: "POST",
        data: {
          creatorId: user?._id,
          creatorName: user?.username || "Player 1",
          creatorRating: user?.rating ?? 1200,
          gameType,
          initialTime,
          increment,
          timeControlName: tcName,
          preferredColor: friendColor,
          isPrivate: true,
        },
      });

      if (res.success && res.game) {
        setCreatedRoomCode(res.inviteCode || res.game.inviteCode);
        setCreatedRoomGameId(res.game._id);
      }
    } catch (err: any) {
      alert(err.message || "Failed to create custom game room");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Join Game with Room Code
  const handleJoinFriendRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomCodeInput.trim()) return;

    try {
      setIsJoiningRoom(true);
      setJoinRoomError("");

      const code = joinRoomCodeInput.trim().toUpperCase();

      // Retrieve game details by invite code or direct ID
      const res = await apiFetch<{
        success: boolean;
        game: any;
      }>(`/games/invite/${code}`);

      if (res.success && res.game) {
        router.push(`/game/${res.game._id}?join=${code}`);
      } else {
        setJoinRoomError("Game room not found or expired");
      }
    } catch (err: any) {
      setJoinRoomError(err.message || "Invalid room code");
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // Start Pass and Play Game
  const handleStartPassAndPlay = async () => {
    try {
      setIsStartingPassPlay(true);
      const initialTime = passPlayMinutes * 60;

      const res = await apiFetch<{
        success: boolean;
        game: any;
      }>("/games/create", {
        method: "POST",
        data: {
          isPassAndPlay: true,
          whitePlayerName: p1Name || "Player 1 (White)",
          blackPlayerName: p2Name || "Player 2 (Black)",
          initialTime,
          increment: passPlayIncrement,
          timeControlName: `${passPlayMinutes}+${passPlayIncrement}`,
        },
      });

      if (res.success && res.game) {
        router.push(`/game/${res.game._id}`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to start Pass & Play session");
    } finally {
      setIsStartingPassPlay(false);
    }
  };

  const copyToClipboard = (text: string, type: "link" | "code") => {
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--surface-main)] text-[var(--foreground)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Lobby Top Header */}
        <LobbyHeader lobbyStats={lobbyStats} />

        {/* Mode Navigation Tabs */}
        <LobbyTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* TAB 1: QUICK MATCH / MATCHMAKING */}
        {activeTab === "quick" && (
          <QuickMatch
            setGameType={setGameType}
            gameType={gameType}
            selectedTc={selectedTc}
            setSelectedTc={setSelectedTc}
            isCustomTc={isCustomTc}
            setIsCustomTc={setIsCustomTc}
            customMinutes={customMinutes}
            setCustomMinutes={setCustomMinutes}
            customIncrement={customIncrement}
            setCustomIncrement={setCustomIncrement}
            handleStartSearch={handleStartSearch}
            user={user}
          />
        )}
        {/* TAB 2: PLAY WITH A FRIEND (CUSTOM INVITES & ROOM CODES) */}
        {activeTab === "friend" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Friend Room Box */}
            <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-[var(--primary)]" />
                  Create a Custom Challenge
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Set custom time controls, pick your piece color, and share the
                  invite link.
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
                      onClick={() => copyToClipboard(createdRoomCode, "code")}
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

            {/* Join Existing Room Box */}
            <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-[var(--primary)]" />
                    Join a Friend&apos;s Game
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Have an invite code or link from your friend? Enter it
                    below.
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
                  You can directly send your friend the complete link, and
                  opening it will connect them into the game automatically!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PASS AND PLAY (LOCAL HOTSEAT MODE) */}
        {activeTab === "pass" && (
          <div className="max-w-2xl mx-auto bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary-muted)] border border-[var(--primary-border)] text-[var(--primary)] mx-auto flex items-center justify-center">
                <Tv className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                Pass & Play Mode
              </h2>
              <p className="text-xs text-gray-400">
                Play locally with a friend on the same screen or tablet with
                move tracking.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 uppercase">
                    Player 1 (White)
                  </label>
                  <input
                    type="text"
                    value={p1Name}
                    onChange={(e) => setP1Name(e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 bg-[var(--surface-main)] border border-[var(--surface-border)] rounded-xl text-sm text-white focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 uppercase">
                    Player 2 (Black)
                  </label>
                  <input
                    type="text"
                    value={p2Name}
                    onChange={(e) => setP2Name(e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 bg-[var(--surface-main)] border border-[var(--surface-border)] rounded-xl text-sm text-white focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Timer options */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-gray-300 uppercase">
                  Time Control per Player
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { label: "5m", mins: 5 },
                    { label: "10m", mins: 10 },
                    { label: "15m", mins: 15 },
                    { label: "30m", mins: 30 },
                  ].map((t, i) => (
                    <button
                      key={i}
                      onClick={() => setPassPlayMinutes(t.mins)}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition ${
                        passPlayMinutes === t.mins
                          ? "bg-[var(--primary)] text-[var(--surface-main)] border-[var(--primary)]"
                          : "bg-[var(--surface-main)] border-[var(--surface-border)] text-gray-400 hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartPassAndPlay}
                disabled={isStartingPassPlay}
                className="w-full mt-4 py-4 rounded-xl font-extrabold bg-primary-gradient text-[var(--surface-main)] hover:opacity-95 shadow-xl glow-primary transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Tv className="w-5 h-5" />
                <span>
                  {isStartingPassPlay
                    ? "Setting up board..."
                    : "Start Local Game"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MATCHMAKING RADAR SEARCH MODAL / OVERLAY */}
      <MatchmakingModal
        isSearching={isSearching}
        searchSeconds={searchSeconds}
        gameType={gameType}
        timeControlName={
          isCustomTc ? `${customMinutes}+${customIncrement}` : selectedTc.name
        }
        onCancel={handleCancelSearch}
      />
    </main>
  );
}
