"use client";

import React from "react";

export type ProfileTab = "overview" | "edit" | "security";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  setActiveTab: React.Dispatch<React.SetStateAction<ProfileTab>>;
}

export default function ProfileTabs({
  activeTab,
  setActiveTab,
}: ProfileTabsProps) {
  return (
    <div className="flex items-center gap-2 border-b border-[#232732] pb-1">
      <button
        onClick={() => setActiveTab("overview")}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
          activeTab === "overview"
            ? "bg-white/10 text-white shadow-sm"
            : "text-gray-400 hover:text-white"
        }`}
      >
        Overview & Stats
      </button>

      <button
        onClick={() => setActiveTab("edit")}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
          activeTab === "edit"
            ? "bg-white/10 text-white shadow-sm"
            : "text-gray-400 hover:text-white"
        }`}
      >
        Edit Profile
      </button>

      <button
        onClick={() => setActiveTab("security")}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
          activeTab === "security"
            ? "bg-white/10 text-white shadow-sm"
            : "text-gray-400 hover:text-white"
        }`}
      >
        Security
      </button>
    </div>
  );
}