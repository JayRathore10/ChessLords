export interface TimeControlOption {
  id: string;
  name: string;
  category: "bullet" | "blitz" | "rapid" | "classical";
  initialTime: number; // seconds
  increment: number; // seconds
  icon: string;
  colorClass: string;
  popular?: boolean;
}


export const TIME_CONTROLS: TimeControlOption[] = [
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