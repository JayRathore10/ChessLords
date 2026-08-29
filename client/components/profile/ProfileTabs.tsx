"use client";

import React from "react";

type ProfileTab = "overview" | "edit" | "security";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  setActiveTab: React.Dispatch<React.SetStateAction<ProfileTab>>;
  setStatusMessage: React.Dispatch<
    React.SetStateAction<{
      type: "success" | "error";
      text: string;
    } | null>
  >;
}

export default function ProfileTabs({
  activeTab,
  setActiveTab,
  setStatusMessage,
}: ProfileTabsProps) {
  return (
    <div className="flex items-center gap-2 border-b border-[#232732] pb-1">
      <button
        onClick={() => {
          setActiveTab("overview");
          setStatusMessage(null);
        }}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === "overview"
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
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === "edit"
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
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === "security"
            ? "bg-white/10 text-white shadow-sm"
            : "text-gray-400 hover:text-white"
          }`}
      >
        Security
      </button>
    </div>
  );
}
