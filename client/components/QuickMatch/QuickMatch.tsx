import { User } from "@/lib/auth-context";
import { Compass , Zap , Sliders , Trophy } from "lucide-react";
import Link from "next/link";

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

interface QuickMatchProps {
  selectedTc: TimeControlOption;
  setSelectedTc: React.Dispatch<React.SetStateAction<TimeControlOption>>;

  gameType: "rated" | "casual";
  setGameType: React.Dispatch<React.SetStateAction<"rated" | "casual">>;

  isCustomTc: boolean;
  setIsCustomTc: React.Dispatch<React.SetStateAction<boolean>>;

  customMinutes: number;
  setCustomMinutes: React.Dispatch<React.SetStateAction<number>>;

  customIncrement: number;
  setCustomIncrement: React.Dispatch<React.SetStateAction<number>>;

  handleStartSearch: () => void;
  user: User | null;
}

const QuickMatch = ({
  setGameType,
  gameType,
  selectedTc,
  setSelectedTc,i
  isCustomTc,
  setIsCustomTc,
  customMinutes,
  setCustomMinutes,
  customIncrement,
  setCustomIncrement,
  handleStartSearch, 
  user
}: QuickMatchProps) => {
  return(
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
  );
}

export default QuickMatch;
