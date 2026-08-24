"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  User as UserIcon,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [hoveredPiece, setHoveredPiece] = useState<"left" | "right" | null>(null);

  const leftPieceRef = useRef<HTMLDivElement>(null);
  const rightPieceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const addParallax = (
      element: HTMLDivElement | null,
      piece: "left" | "right"
    ) => {
      if (!element) return;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = element.getBoundingClientRect();

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateY = ((mouseX - centerX) / centerX) * 5;
        const rotateX = ((mouseY - centerY) / centerY) * 5;

        const scale = hoveredPiece === piece ? 1.05 : 1;

        element.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale(${scale})
      `;
      };

      element.addEventListener("mousemove", handleMouseMove);

      return () => {
        element.removeEventListener("mousemove", handleMouseMove);
      };
    };

    const removeLeft = addParallax(leftPieceRef.current, "left");
    const removeRight = addParallax(rightPieceRef.current, "right");

    return () => {
      removeLeft?.();
      removeRight?.();
    };
  }, [hoveredPiece]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return { score: 0, label: "Empty", color: "bg-gray-700" };

    let score = 0;
    if (p.length >= 8) score += 1;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 1;
    if (/\d/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;

    if (score <= 1) return { score: 25, label: "Weak", color: "bg-red-500" };
    if (score <= 3) return { score: 65, label: "Medium", color: "bg-[#babcbd]" };
    return { score: 100, label: "Strong", color: "bg-emerald-500" };
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { name, username, email, password, confirmPassword } = formData;

    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError("Username must be between 3 and 20 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await register(username.trim(), name.trim(), email.trim(), password);
      router.push("/");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 py-8 bg-linear-to-b from-[#0f1115] via-[#12151b] to-[#0a0c0f]">
      {/* Background Decorative Glow */}
      <div className="absolute w-96 h-96 bg-[#babcbd]/10 rounded-full blur-3xl pointer-events-none -top-10 left-1/2 -translate-x-1/2" />

      {/* Left Chess Piece */}
      <div
        ref={leftPieceRef}
        className="register-left-piece"
        onMouseEnter={() => setHoveredPiece("left")}
        onMouseLeave={() => setHoveredPiece(null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/white-rk.png"
          alt="Chess piece"
          className="register-left-image"
        />
      </div>

      {/* Right Chess Piece */}
      <div
        ref={rightPieceRef}
        className="register-right-piece"
        onMouseEnter={() => setHoveredPiece("right")}
        onMouseLeave={() => setHoveredPiece(null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/white-queen.png"
          alt="Chess piece"
          className="register-right-image"
        />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Claim Your <span className="text-[#babcbd]">Crown</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Create an account to track ratings, play rated matches, and earn achievements.
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-[#161920]/90 backdrop-blur-xl border border-[#232732] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name & Username in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
                >
                  Display Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    placeholder="Magnus Carlsen"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
                  />
                </div>
              </div>

              {/* Username Field */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
                >
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <AtSign className="w-4 h-4" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, username: e.target.value }))
                    }
                    required
                    placeholder="grandmaster99"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  placeholder="lord@chess.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  placeholder="Minimum 8 characters"
                  className="w-full pl-10 pr-11 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Password strength bar */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Strength:</span>
                    <span
                      className={`font-semibold ${passwordStrength.label === "Strong"
                        ? "text-emerald-400"
                        : passwordStrength.label === "Medium"
                          ? "text-[#babcbd]"
                          : "text-red-400"
                        }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-linear-to-r from-[#babcbd] to-[#cfd1d2] hover:from-[#cfd1d2] hover:to-[#e4e5e6] text-[#0f1115] font-bold rounded-xl shadow-lg shadow-black/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-[#0f1115] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer separator */}
          <div className="mt-6 pt-5 border-t border-[#232732] text-center">
            <p className="text-sm text-gray-400">
              Already have a crown?{" "}
              <Link
                href="/login"
                className="text-[#babcbd] hover:text-white font-semibold transition"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .register-left-piece,
.register-right-piece {
  position: absolute;
  z-index: 1;
  pointer-events: auto;

  transform-style: preserve-3d;

  transition:
    transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* LEFT */

.register-left-piece {
  left: -50px;
  bottom: 50px;
  width: 350px;
  height: 400px;

  transform: perspective(1000px) rotateX(0deg) rotateY(0deg);
}

.register-left-image {
  width: 100%;
  height: 100%;
  object-fit: contain;

  transform: rotate(-15deg) translateY(20px);

  filter:
    drop-shadow(0 25px 30px rgba(0, 0, 0, 0.5))
    drop-shadow(0 0 25px rgba(186, 188, 189, 0.12));

  transition:
    transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    filter 0.4s ease;
}

.register-left-piece:hover .register-left-image {
  transform: rotate(-12deg) translateY(15px) translateX(10px);

  filter:
    drop-shadow(0 30px 40px rgba(0, 0, 0, 0.6))
    drop-shadow(0 0 30px rgba(186, 188, 189, 0.18));
}


/* RIGHT */

.register-right-piece {
  right: -40px;
  top: 30px;
  width: 350px;
  height: 400px;

  transform: perspective(1000px) rotateX(0deg) rotateY(0deg);
}

.register-right-image {
  width: 100%;
  height: 100%;
  object-fit: contain;

  transform: rotate(15deg) translateY(20px);

  filter:
    drop-shadow(0 25px 30px rgba(0, 0, 0, 0.5))
    drop-shadow(0 0 25px rgba(186, 188, 189, 0.12));

  transition:
    transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    filter 0.4s ease;
}

.register-right-piece:hover .register-right-image {
  transform: rotate(12deg) translateY(15px) translateX(-10px);

  filter:
    drop-shadow(0 30px 40px rgba(0, 0, 0, 0.6))
    drop-shadow(0 0 30px rgba(186, 188, 189, 0.18));
}
      `}</style>

    </main>
  );
}
