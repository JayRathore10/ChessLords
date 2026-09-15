import { Sliders } from "lucide-react";
import { TimeControlOption } from "./QuickMatch";

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

interface TimeControlGridProps{
  selectedTc: TimeControlOption;
  setSelectedTc: React.Dispatch<React.SetStateAction<TimeControlOption>>;
  
  isCustomTc: boolean;
  setIsCustomTc: React.Dispatch<React.SetStateAction<boolean>>;
};

const TimeControlGrid = ({selectedTc , isCustomTc , setSelectedTc , setIsCustomTc} : TimeControlGridProps) => {
  return (
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
  );
};

export default TimeControlGrid;
