"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  User as UserIcon,
  Trophy,
  Swords,
  Lock,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Save,
  Flame,
  Award,
} from "lucide-react";

export default function ProfilePage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const { user, isLoading, updateProfile, changePassword } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "edit" | "security">(
    "overview"
  );

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: "",
    username: "",
  });

  // Security Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfileForm({
        name: user.name || "",
        username: user.username || "",
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#0f1115]">
        <div className="w-8 h-8 border-3 border-[#babcbd] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 bg-[#0f1115] text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#161920] border border-[#232732] flex items-center justify-center mb-4 text-[#babcbd]">
          <UserIcon className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Profile Access Restricted
        </h1>
        <p className="text-gray-400 max-w-sm mb-6 text-sm">
          Please log in or create an account to view your player statistics and manage your profile.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 bg-[#babcbd] hover:bg-[#cfd1d2] text-[#0f1115] font-semibold rounded-xl transition text-sm shadow"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 bg-[#161920] border border-[#232732] text-white font-medium rounded-xl hover:bg-[#1c202a] transition text-sm"
          >
            Sign Up
          </Link>
        </div>
      </main>
    );
  }

  const gamesPlayed = user.gamesPlayed ?? 0;
  const gamesWon = user.gamesWon ?? 0;
  const gamesLost = user.gamesLost ?? 0;
  const gamesDrawn = user.gamesDrawn ?? 0;
  const winRate =
    gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      await updateProfile({
        name: profileForm.name.trim(),
        username: profileForm.username.trim(),
      });
      setStatusMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to update profile",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatusMessage({
        type: "error",
        text: "New passwords do not match",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setStatusMessage({
        type: "error",
        text: "New password must be at least 6 characters long",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      setStatusMessage({
        type: "success",
        text: "Password updated successfully!",
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to change password",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] p-4 md:p-8 bg-linear-to-b from-[#0f1115] via-[#12151b] to-[#0a0c0f]">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Profile Banner Card */}
        <div className="relative bg-[#161920] border border-[#232732] rounded-2xl p-6 sm:p-8 overflow-hidden shadow-2xl">
          {/* Subtle platinum accent light */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#babcbd]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-primary-gradient text-[#0f1115] font-extrabold text-3xl flex items-center justify-center shadow-xl shadow-black/40 border-2 border-white/10 shrink-0">
              {user.name ? user.name[0].toUpperCase() : user.username[0].toUpperCase()}
            </div>

            {/* User Details */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {user.name || user.username}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#babcbd]/10 text-[#babcbd] border border-[#babcbd]/25">
                  @{user.username}
                </span>
                {user.role === "admin" && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/25">
                    Admin
                  </span>
                )}
              </div>

              <p className="text-gray-400 text-sm">{user.email}</p>

              {/* Badges / Rating quick stats */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <div className="flex items-center gap-1.5 text-[#babcbd] text-sm font-semibold">
                  <Trophy className="w-4 h-4 text-[#babcbd]" />
                  <span>Rating: {user.rating ?? 1200}</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-400 text-sm font-semibold">
                  <Swords className="w-4 h-4" />
                  <span>{gamesPlayed} Games Played</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
                  <Flame className="w-4 h-4" />
                  <span>{winRate}% Win Rate</span>
                </div>
              </div>
            </div>

            {/* Quick Action: Play Button */}
            <div className="shrink-0">
              <Link
                href="/game"
                className="px-5 py-2.5 bg-linear-to-r from-[#babcbd] to-[#cfd1d2] hover:from-[#cfd1d2] hover:to-[#e4e5e6] text-[#0f1115] font-bold rounded-xl shadow-lg shadow-black/40 flex items-center gap-2 transition active:scale-95 text-sm"
              >
                <Swords className="w-4 h-4" />
                <span>Play a Game</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#232732] pb-1">
          <button
            onClick={() => {
              setActiveTab("overview");
              setStatusMessage(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "overview"
                ? "bg-white/10 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Overview & Stats
          </button>
          <button
            onClick={() => {
              setActiveTab("edit");
              setStatusMessage(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "edit"
                ? "bg-white/10 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => {
              setActiveTab("security");
              setStatusMessage(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "security"
                ? "bg-white/10 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Security
          </button>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW & STATS */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Total Played */}
            <div className="bg-[#161920] border border-[#232732] rounded-xl p-5 space-y-1">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Total Matches
              </p>
              <p className="text-3xl font-extrabold text-white">{gamesPlayed}</p>
              <p className="text-xs text-gray-500">All recorded matches</p>
            </div>

            {/* Stat 2: Won */}
            <div className="bg-[#161920] border border-[#232732] rounded-xl p-5 space-y-1">
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                Victories
              </p>
              <p className="text-3xl font-extrabold text-emerald-400">{gamesWon}</p>
              <p className="text-xs text-gray-500">{winRate}% victory rate</p>
            </div>

            {/* Stat 3: Lost */}
            <div className="bg-[#161920] border border-[#232732] rounded-xl p-5 space-y-1">
              <p className="text-red-400 text-xs font-semibold uppercase tracking-wider">
                Defeats
              </p>
              <p className="text-3xl font-extrabold text-red-400">{gamesLost}</p>
              <p className="text-xs text-gray-500">
                {gamesPlayed > 0
                  ? Math.round((gamesLost / gamesPlayed) * 100)
                  : 0}
                % defeat rate
              </p>
            </div>

            {/* Stat 4: Drawn */}
            <div className="bg-[#161920] border border-[#232732] rounded-xl p-5 space-y-1">
              <p className="text-[#babcbd] text-xs font-semibold uppercase tracking-wider">
                Draws
              </p>
              <p className="text-3xl font-extrabold text-[#babcbd]">{gamesDrawn}</p>
              <p className="text-xs text-gray-500">
                {gamesPlayed > 0
                  ? Math.round((gamesDrawn / gamesPlayed) * 100)
                  : 0}
                % draw rate
              </p>
            </div>

            {/* Detailed Performance Bar */}
            <div className="sm:col-span-2 lg:col-span-4 bg-[#161920] border border-[#232732] rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#babcbd]" />
                <span>Performance Breakdown</span>
              </h3>

              {gamesPlayed > 0 ? (
                <div className="space-y-2">
                  <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${(gamesWon / gamesPlayed) * 100}%` }}
                      title={`Won: ${gamesWon}`}
                    />
                    <div
                      className="bg-[#babcbd] h-full transition-all"
                      style={{ width: `${(gamesDrawn / gamesPlayed) * 100}%` }}
                      title={`Drawn: ${gamesDrawn}`}
                    />
                    <div
                      className="bg-red-500 h-full transition-all"
                      style={{ width: `${(gamesLost / gamesPlayed) * 100}%` }}
                      title={`Lost: ${gamesLost}`}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-gray-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      Won ({gamesWon})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#babcbd] inline-block" />
                      Drawn ({gamesDrawn})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                      Lost ({gamesLost})
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No games played yet. Play your first match to start tracking your performance!
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EDIT PROFILE */}
        {activeTab === "edit" && (
          <div className="bg-[#161920] border border-[#232732] rounded-xl p-6 max-w-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#babcbd]" />
              <span>Edit Account Information</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-4 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#babcbd] hover:bg-[#cfd1d2] text-[#0f1115] font-bold rounded-xl shadow transition active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: SECURITY (CHANGE PASSWORD) */}
        {activeTab === "security" && (
          <div className="bg-[#161920] border border-[#232732] rounded-xl p-6 max-w-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#babcbd]" />
              <span>Update Password</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  required
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#babcbd] hover:bg-[#cfd1d2] text-[#0f1115] font-bold rounded-xl shadow transition active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmitting ? "Updating..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
