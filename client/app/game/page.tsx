/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { socket } from "@/lib/socket";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import {
  Zap,
  Swords,
  Users,
  Copy,
  Check,
  Sparkles,
  Search,
  ArrowRight,
  Sliders,
  Share2,
  Tv,
  Crown,
  Trophy,
  Compass,
} from "lucide-react";

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
    colorClass: "border-[var(--game-bullet-border)] bg-[var(--game-bullet-bg)] text-[var(--game-bullet)]",
  },
  {
    id: "bullet-1-1",
    name: "1 | 1",
    category: "bullet",
    initialTime: 60,
    increment: 1,
    icon: "⚡",
    colorClass: "border-[var(--game-bullet-border)] bg-[var(--game-bullet-bg)] text-[var(--game-bullet)]",
  },
  {
    id: "bullet-2-1",
    name: "2 | 1",
    category: "bullet",
    initialTime: 120,
    increment: 1,
    icon: "⚡",
    colorClass: "border-[var(--game-bullet-border)] bg-[var(--game-bullet-bg)] text-[var(--game-bullet)]",
  },

  // Blitz
  {
    id: "blitz-3-0",
    name: "3 min",
    category: "blitz",
    initialTime: 180,
    increment: 0,
    icon: "🔥",
    colorClass: "border-[var(--game-blitz-border)] bg-[var(--game-blitz-bg)] text-[var(--game-blitz)]",
    popular: true,
  },
  {
    id: "blitz-3-2",
    name: "3 | 2",
    category: "blitz",
    initialTime: 180,
    increment: 2,
    icon: "🔥",
    colorClass: "border-[var(--game-blitz-border)] bg-[var(--game-blitz-bg)] text-[var(--game-blitz)]",
    popular: true,
  },
  {
    id: "blitz-5-0",
    name: "5 min",
    category: "blitz",
    initialTime: 300,
    increment: 0,
    icon: "🔥",
    colorClass: "border-[var(--game-blitz-border)] bg-[var(--game-blitz-bg)] text-[var(--game-blitz)]",
    popular: true,
  },
  {
    id: "blitz-5-3",
    name: "5 | 3",
    category: "blitz",
    initialTime: 300,
    increment: 3,
    icon: "🔥",
    colorClass: "border-[var(--game-blitz-border)] bg-[var(--game-blitz-bg)] text-[var(--game-blitz)]",
  },

  // Rapid
  {
    id: "rapid-10-0",
    name: "10 min",
    category: "rapid",
    initialTime: 600,
    increment: 0,
    icon: "⏱️",
    colorClass: "border-[var(--game-rapid-border)] bg-[var(--game-rapid-bg)] text-[var(--game-rapid)]",
    popular: true,
  },
  {
    id: "rapid-15-10",
    name: "15 | 10",
    category: "rapid",
    initialTime: 900,
    increment: 10,
    icon: "⏱️",
    colorClass: "border-[var(--game-rapid-border)] bg-[var(--game-rapid-bg)] text-[var(--game-rapid)]",
  },
  {
    id: "rapid-30-0",
    name: "30 min",
    category: "rapid",
    initialTime: 1800,
    increment: 0,
    icon: "⏱️",
    colorClass: "border-[var(--game-rapid-border)] bg-[var(--game-rapid-bg)] text-[var(--game-rapid)]",
  },
];

export default function GameLobbyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"quick" | "friend" | "pass">("quick");

  // Selected time control for quick match
  const [selectedTc, setSelectedTc] = useState<TimeControlOption>(TIME_CONTROLS[3]); // Blitz 3m default
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
  const [friendColor, setFriendColor] = useState<"random" | "white" | "black">("random");
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [createdRoomGameId, setCreatedRoomGameId] = useState<string | null>(null);
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
    const initialTime = isCustomTc ? customMinutes * 60 : selectedTc.initialTime;
    const increment = isCustomTc ? customIncrement : selectedTc.increment;
    const name = isCustomTc
      ? `${customMinutes}+${customIncrement}`
      : selectedTc.name;

    const storedUserId = user?._id || localStorage.getItem("userId") || socket.id;
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
      const initialTime = isCustomTc ? customMinutes * 60 : selectedTc.initialTime;
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

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen bg-[var(--surface-main)] text-[var(--foreground)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Lobby Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--surface-border)]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary-gradient flex items-center justify-center text-[var(--surface-main)] shadow-lg shadow-black/40">
                <Crown className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-primary-gradient">
                Play Chess
              </h1>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Select your mode, challenge players worldwide, or play with friends.
            </p>
          </div>

          {/* Live Quick Stats Bar */}
          <div className="flex items-center gap-4 bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl px-5 py-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--success)] animate-pulse" />
              <div className="text-left">
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Online</p>
                <p className="text-sm font-bold text-white">{lobbyStats.onlinePlayers}</p>
              </div>
            </div>
            <div className="w-px h-6 bg-[var(--surface-border)]" />
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-[var(--primary)]" />
              <div className="text-left">
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Active Games</p>
                <p className="text-sm font-bold text-white">{lobbyStats.activeGames}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl">
          <button
            onClick={() => setActiveTab("quick")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "quick"
                ? "bg-[var(--primary)] text-[var(--surface-main)] shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Match</span>
            <span className="sm:hidden">Online</span>
          </button>

          <button
            onClick={() => setActiveTab("friend")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "friend"
                ? "bg-[var(--primary)] text-[var(--surface-main)] shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Play with a Friend</span>
            <span className="sm:hidden">Friend</span>
          </button>

          <button
            onClick={() => setActiveTab("pass")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "pass"
                ? "bg-[var(--primary)] text-[var(--surface-main)] shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Tv className="w-4 h-4" />
            <span className="hidden sm:inline">Pass & Play</span>
            <span className="sm:hidden">Local</span>
          </button>
        </div>

        {/* TAB 1: QUICK MATCH / MATCHMAKING */}
        {activeTab === "quick" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Time Controls Grid */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-6 shadow-xl space-y-6">
                
                {/* Header & Rated Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Compass className="w-5 h-5 text-[var(--primary)]" />
                      Choose Time Control
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Fast pairings with opponents near your rating
                    </p>
                  </div>

                  {/* Rated / Casual Mode Selector */}
                  <div className="flex items-center bg-[var(--surface-main)] border border-[var(--surface-border)] rounded-xl p-1 text-xs font-semibold">
                    <button
                      onClick={() => setGameType("rated")}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        gameType === "rated"
                          ? "bg-[var(--primary)] text-[var(--surface-main)] shadow"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Rated
                    </button>
                    <button
                      onClick={() => setGameType("casual")}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        gameType === "casual"
                          ? "bg-white/15 text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Casual
                    </button>
                  </div>
                </div>

                {/* Preset Time Controls Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {TIME_CONTROLS.map((tc) => {
                    const isSelected = !isCustomTc && selectedTc.id === tc.id;
                    return (
                      <button
                        key={tc.id}
                        onClick={() => {
                          setSelectedTc(tc);
                          setIsCustomTc(false);
                        }}
                        className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center group cursor-pointer ${
                          isSelected
                            ? `${tc.colorClass} border-2 ring-2 ring-[var(--primary-glow)] scale-[1.02] shadow-lg`
                            : "bg-[var(--surface-main)]/60 border-[var(--surface-border)] text-gray-300 hover:border-gray-600 hover:bg-[var(--surface-main)]"
                        }`}
                      >
                        {tc.popular && (
                          <span className="absolute -top-2.5 right-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--primary)] text-[var(--surface-main)] shadow">
                            POPULAR
                          </span>
                        )}
                        <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                          {tc.icon}
                        </span>
                        <span className="font-bold text-base text-white">{tc.name}</span>
                        <span className="text-[11px] capitalize tracking-wide text-gray-400">
                          {tc.category}
                        </span>
                      </button>
                    );
                  })}

                  {/* Custom Option Button */}
                  <button
                    onClick={() => setIsCustomTc(true)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center cursor-pointer ${
                      isCustomTc
                        ? "border-[var(--game-custom-border)] bg-[var(--game-custom-bg)] text-[var(--game-custom)] border-2 ring-2 ring-[var(--game-custom)]/20 scale-[1.02]"
                        : "bg-[var(--surface-main)]/60 border-[var(--surface-border)] text-gray-400 hover:text-white hover:border-gray-600"
                    }`}
                  >
                    <Sliders className="w-6 h-6 mb-1" />
                    <span className="font-bold text-base text-white">Custom</span>
                    <span className="text-[11px] text-gray-400">Your rules</span>
                  </button>
                </div>

                {/* Custom Time Control Configurator Slider */}
                {isCustomTc && (
                  <div className="p-4 rounded-xl bg-[var(--surface-main)] border border-[var(--game-custom-border)]/50 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-300">
                        Custom Time Control:{" "}
                        <strong className="text-[var(--game-custom)]">
                          {customMinutes} min + {customIncrement}s
                        </strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 flex justify-between">
                          <span>Initial Minutes</span>
                          <span className="font-semibold text-white">{customMinutes}m</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="60"
                          value={customMinutes}
                          onChange={(e) => setCustomMinutes(Number(e.target.value))}
                          className="w-full mt-2 accent-[var(--game-custom)] cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 flex justify-between">
                          <span>Increment per Move</span>
                          <span className="font-semibold text-white">{customIncrement}s</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          value={customIncrement}
                          onChange={(e) => setCustomIncrement(Number(e.target.value))}
                          className="w-full mt-2 accent-[var(--game-custom)] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Play CTA Button */}
                <button
                  onClick={handleStartSearch}
                  className="w-full py-4 rounded-xl font-extrabold text-base bg-primary-gradient text-[var(--surface-main)] hover:opacity-95 shadow-xl glow-primary transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  <span>Play {isCustomTc ? `${customMinutes}+${customIncrement}` : selectedTc.name} ({gameType.toUpperCase()})</span>
                </button>
              </div>
            </div>

            {/* Right 1 Col: User Stats & Game Modes Info */}
            <div className="space-y-6">
              {/* Profile Card */}
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
                      {user ? `${user.name || "Member"}` : "Sign in to save rating & stats"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-[var(--surface-main)] rounded-xl border border-[var(--surface-border)]">
                    <p className="text-[11px] text-gray-400 uppercase font-medium">Rating</p>
                    <p className="text-xl font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                      <Trophy className="w-4 h-4 text-[var(--primary)]" />
                      {user?.rating ?? 1200}
                    </p>
                  </div>
                  <div className="p-3 bg-[var(--surface-main)] rounded-xl border border-[var(--surface-border)]">
                    <p className="text-[11px] text-gray-400 uppercase font-medium">Won / Lost</p>
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

              {/* Game Speed Guide */}
              <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Game Modes Info
                </h4>
                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-main)]/60">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="text-amber-400">⚡ Bullet</span> &lt; 3 mins
                    </span>
                    <span className="text-gray-400">Ultra Fast</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-main)]/60">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="text-yellow-400">🔥 Blitz</span> 3 - 5 mins
                    </span>
                    <span className="text-gray-400">Most Popular</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-main)]/60">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="text-emerald-400">⏱️ Rapid</span> 10+ mins
                    </span>
                    <span className="text-gray-400">Strategic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                  Set custom time controls, pick your piece color, and share the invite link.
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
                        !isCustomTc && selectedTc.initialTime === preset.time && selectedTc.increment === preset.inc
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
                  <span>{isCreatingRoom ? "Generating Challenge..." : "Create Challenge Link"}</span>
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
                      <p className="text-[10px] text-gray-400 uppercase">Room Code</p>
                      <p className="text-2xl font-mono font-black text-white tracking-widest">
                        {createdRoomCode}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(createdRoomCode, "code")}
                      className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                    >
                      {copiedCode ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
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
                        onChange={(e) => setJoinRoomCodeInput(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3.5 bg-[var(--surface-main)] border border-[var(--surface-border)] rounded-xl text-lg font-mono tracking-widest text-white uppercase placeholder-gray-600 focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>

                  {joinRoomError && (
                    <p className="text-xs font-medium text-red-400">{joinRoomError}</p>
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
                  You can directly send your friend the complete link, and opening it will connect them into the game automatically!
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
              <h2 className="text-2xl font-extrabold text-white">Pass & Play Mode</h2>
              <p className="text-xs text-gray-400">
                Play locally with a friend on the same screen or tablet with move tracking.
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
                <span>{isStartingPassPlay ? "Setting up board..." : "Start Local Game"}</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* MATCHMAKING RADAR SEARCH MODAL / OVERLAY */}
      {isSearching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
            
            {/* Animated Radar Background */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[var(--primary)]/20 animate-radar-ping" />
              <div className="absolute inset-4 rounded-full border border-[var(--primary)]/30 animate-pulse" />
              <div className="w-24 h-24 rounded-full bg-primary-gradient/10 border border-[var(--primary-border)] flex items-center justify-center text-3xl shadow-inner">
                <Crown className="w-10 h-10 text-[var(--primary)] animate-bounce" />
              </div>
            </div>

            {/* Searching text & timer */}
            <div className="space-y-1.5">
              <h3 className="text-2xl font-extrabold text-white">
                Searching for Opponent...
              </h3>
              <p className="text-sm text-gray-400">
                Mode:{" "}
                <span className="font-semibold text-white">
                  {isCustomTc ? `${customMinutes}+${customIncrement}` : selectedTc.name} ({gameType.toUpperCase()})
                </span>
              </p>
              <p className="text-xl font-mono font-bold text-[var(--primary)] pt-2">
                {formatTimer(searchSeconds)}
              </p>
            </div>

            {/* Cancel Button */}
            <button
              onClick={handleCancelSearch}
              className="w-full py-3.5 rounded-xl font-bold bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-gray-300 border border-white/10 transition active:scale-95 cursor-pointer"
            >
              Cancel Matchmaking
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
