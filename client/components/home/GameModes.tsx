import Link from "next/link";

import { ChevronRight } from "lucide-react";

const gameModes = [
  {
    icon: "⚡",
    name: "Bullet",
    time: "< 3 min",
    desc: "Ultra-fast. Every second counts.",
    href: "/game?tab=quick",
    color: "var(--game-bullet)",
    bg: "var(--game-bullet-bg)",
    border: "var(--game-bullet-border)",
  },
  {
    icon: "🔥",
    name: "Blitz",
    time: "3 – 5 min",
    desc: "The most popular time control.",
    href: "/game?tab=quick",
    color: "var(--game-blitz)",
    bg: "var(--game-blitz-bg)",
    border: "var(--game-blitz-border)",
  },
  {
    icon: "⏱️",
    name: "Rapid",
    time: "10 – 30 min",
    desc: "Think deeper, play stronger.",
    href: "/game?tab=quick",
    color: "var(--game-rapid)",
    bg: "var(--game-rapid-bg)",
    border: "var(--game-rapid-border)",
  },
  {
    icon: "🤝",
    name: "With Friends",
    time: "Custom",
    desc: "Invite codes & private rooms.",
    href: "/game?tab=friend",
    color: "var(--primary)",
    bg: "var(--primary-muted)",
    border: "var(--primary-border)",
  },
];

export default function GameModes() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {gameModes.map((mode) => (
          <Link
            key={mode.name}
            href={mode.href}
            className="group relative flex flex-col p-5 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-xl"
            style={{
              background: mode.bg,
              borderColor: mode.border,
            }}
          >
            {/* Icon */}
            <span className="text-3xl mb-3">
              {mode.icon}
            </span>

            {/* Name + Time */}
            <div className="flex items-baseline gap-2 mb-1">
              <h3
                className="text-lg font-extrabold"
                style={{ color: mode.color }}
              >
                {mode.name}
              </h3>

              <span className="text-xs text-gray-400 font-medium">
                {mode.time}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-400 leading-relaxed flex-1">
              {mode.desc}
            </p>

            {/* Play Now */}
            <div
              className="mt-4 flex items-center gap-1 text-xs font-semibold opacity-80 group-hover:opacity-100 transition-opacity"
              style={{ color: mode.color }}
            >
              Play Now

              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}