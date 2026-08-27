import {
  Globe,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast Matchmaking",
    description:
      "Get paired with an opponent near your rating in seconds. Bullet, Blitz, Rapid — you choose the pace.",
    color: "var(--game-bullet)",
    bg: "var(--game-bullet-bg)",
    border: "var(--game-bullet-border)",
  },
  {
    icon: Users,
    title: "Play with Friends",
    description:
      "Create private rooms with a shareable invite code and challenge your friends directly.",
    color: "var(--primary)",
    bg: "var(--primary-muted)",
    border: "var(--primary-border)",
  },
  {
    icon: Trophy,
    title: "Rating & Leaderboards",
    description:
      "Climb the global leaderboard with every win. Track your progress across all time controls.",
    color: "var(--game-blitz)",
    bg: "var(--game-blitz-bg)",
    border: "var(--game-blitz-border)",
  },
  {
    icon: Globe,
    title: "Play Anywhere",
    description:
      "Local pass-and-play mode lets you enjoy chess on the same device with a friend.",
    color: "var(--game-rapid)",
    bg: "var(--game-rapid-bg)",
    border: "var(--game-rapid-border)",
  },
];

export default function FeaturesSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[var(--surface-border)]">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          Everything you need to{" "}
          <span className="text-primary-gradient">
            dominate
          </span>
        </h2>

        <p className="text-gray-400 max-w-xl mx-auto">
          ChessLord is built for speed, fairness, and fun — whether
          you&apos;re a casual player or a competitive one.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <div
              key={feature.title}
              className="flex items-start gap-4 p-6 rounded-2xl border bg-[var(--surface-card)] transition-all hover:border-[var(--primary-border)]"
              style={{
                borderColor: "var(--surface-border)",
              }}
            >
              {/* Icon */}
              <div
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border"
                style={{
                  background: feature.bg,
                  borderColor: feature.border,
                  color: feature.color,
                }}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div>
                <h3 className="font-bold text-white text-base mb-1">
                  {feature.title}
                </h3>

                <p className="text-sm text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}