"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Mail, Lock, Eye, EyeOff, Swords, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email.trim() || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email.trim(), formData.password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-gradient-to-b from-[#0f1115] via-[#12151b] to-[#0a0c0f]">
      {/* Background Decorative Glow */}
      <div className="absolute w-96 h-96 bg-[#babcbd]/10 rounded-full blur-3xl pointer-events-none -top-10 left-1/2 -translate-x-1/2" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-gradient p-0.5 shadow-lg shadow-black/40 mb-4">
            <div className="w-full h-full bg-[#12141a] rounded-[14px] flex items-center justify-center">
              <Swords className="w-7 h-7 text-[#babcbd]" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome Back, <span className="text-[#babcbd]">Lord</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Enter your credentials to access your realm and climb the ladder.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#161920]/90 backdrop-blur-xl border border-[#232732] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-5 h-5" />
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
                  className="w-full pl-11 pr-4 py-3 bg-[#0f1115] border border-[#232732] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-[#0f1115] border border-[#232732] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#babcbd] to-[#cfd1d2] hover:from-[#cfd1d2] hover:to-[#e4e5e6] text-[#0f1115] font-bold rounded-xl shadow-lg shadow-black/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#0f1115] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enter the Arena</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer separator */}
          <div className="mt-8 pt-6 border-t border-[#232732] text-center">
            <p className="text-sm text-gray-400">
              New to ChessLord?{" "}
              <Link
                href="/register"
                className="text-[#babcbd] hover:text-white font-semibold transition"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
