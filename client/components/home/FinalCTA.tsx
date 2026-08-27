import Link from "next/link";

import {
  Crown,
  Shield,
  Swords,
} from "lucide-react";

type FinalCTAProps = {
  user: unknown;
};

export default function FinalCTA({ user }: FinalCTAProps) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--primary-border)] bg-[var(--surface-card)] p-10 sm:p-14 text-center shadow-2xl">
        {/* Decorative glow */}
        <div className="absolute inset-0 bg-[var(--primary-muted)] opacity-30 pointer-events-none" />

        <div className="relative">
          {/* Crown Icon */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-gradient shadow-lg mb-6">
            <Crown className="w-7 h-7 text-[var(--surface-main)]" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to claim your throne?
          </h2>

          {/* Description */}
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            Join thousands of players competing in real-time. Track
            your rating, build your stats, and rise to the top.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/game"
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-extrabold text-base bg-primary-gradient text-[var(--surface-main)] hover:opacity-95 shadow-xl glow-primary transition-all active:scale-[0.98]"
            >
              <Swords className="w-5 h-5" />

              Start Playing
            </Link>

            {!user && (
              <Link
                href="/register"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm text-gray-300 border border-[var(--surface-border)] hover:bg-white/5 transition-all"
              >
                <Shield className="w-4 h-4 text-[var(--primary)]" />

                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}