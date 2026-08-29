"use client";

import React, { useEffect, useState } from "react";

import Link from "next/link";

import { User as UserIcon } from "lucide-react";

import { useAuth } from "@/lib/auth-context";

import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import ProfileStatusMessage from "@/components/profile/ProfileStatusMessage";

import StatsGrid from "@/components/profile/Overview/StatsGrid";
import PerformanceBreakdown from "@/components/profile/Overview/PerformanceBreakdown";

import EditProfileForm from "@/components/profile/EditProfile/EditProfileForm";

import ChangePasswordForm from "@/components/profile/Security/ChangePasswordForm";

export default function ProfilePage() {
  const { user, isLoading, updateProfile, changePassword } = useAuth();

  const [activeTab, setActiveTab] = useState<
    "overview" | "edit" | "security"
  >("overview");

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState<{
    name: string;
    profilePic: File | null;
  }>({
    name: "",
    profilePic: null,
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

  // Load current user data into the edit form
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfileForm({
        name: user.name || "",
        profilePic: null,
      });
    }
  }, [user]);

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#0f1115]">
        <div className="w-8 h-8 border-3 border-[#babcbd] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Not logged in
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
          Please log in or create an account to view your player statistics
          and manage your profile.
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

  // Game statistics
  const gamesPlayed = user.gamesPlayed ?? 0;
  const gamesWon = user.gamesWon ?? 0;
  const gamesLost = user.gamesLost ?? 0;
  const gamesDrawn = user.gamesDrawn ?? 0;

  const winRate =
    gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      await updateProfile({
        name: profileForm.name.trim(),
        profilePic: profileForm.profilePic || undefined,
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

  // Change password
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

  // // Handle tab change
  // const handleTabChange = (
  //   tab: "overview" | "edit" | "security"
  // ) => {
  //   setActiveTab(tab);
  //   setStatusMessage(null);
  // };

  return (
    <main className="min-h-[calc(100vh-64px)] p-4 md:p-8 bg-linear-to-b from-[#0f1115] via-[#12151b] to-[#0a0c0f]">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Profile Header */}
        <ProfileHeader
          user={user}
          gamesPlayed={gamesPlayed}
          winRate={winRate}
        />

        {/* Navigation Tabs */}
        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Status Message */}
        <ProfileStatusMessage
          statusMessage={statusMessage}
        />

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <StatsGrid
              gamesPlayed={gamesPlayed}
              gamesWon={gamesWon}
              gamesLost={gamesLost}
              gamesDrawn={gamesDrawn}
              winRate={winRate}
            />

            <PerformanceBreakdown
              gamesPlayed={gamesPlayed}
              gamesWon={gamesWon}
              gamesLost={gamesLost}
              gamesDrawn={gamesDrawn}
            />
          </div>
        )}

        {/* Edit Profile */}
        {activeTab === "edit" && (
          <EditProfileForm
            name={profileForm.name}
            profilePic={user.profilePic}
            setName={(name) =>
              setProfileForm((prev) => ({
                ...prev,
                name,
              }))
            }
            setProfilePic={(file) =>
              setProfileForm((prev) => ({
                ...prev,
                profilePic: file,
              }))
            }
            isSubmitting={isSubmitting}
            onSubmit={handleUpdateProfile}
          />
        )}

        {/* Security */}
        {activeTab === "security" && (
          <ChangePasswordForm
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            isSubmitting={isSubmitting}
            onSubmit={handleChangePassword}
          />
        )}
      </div>
    </main>
  );
}

