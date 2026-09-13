import React from 'react'
import { Zap , Tv  , Users } from 'lucide-react';

type ActiveTab = "quick" | "friend" | "pass";

type LobbyTabsProps = {
  activeTab: ActiveTab;
  setActiveTab: React.Dispatch<React.SetStateAction<ActiveTab>>;
};


const LobbyTabs = ({activeTab , setActiveTab} : LobbyTabsProps) => {
  return (
     <div className="grid grid-cols-3 gap-2 p-1.5 bg-surface-card border border-surface-border rounded-2xl">
          <button
            onClick={() => setActiveTab("quick")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "quick"
                ? "bg-primary text-surface-main shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Match</span>
            <span className="sm:hidden">Online</span>
          </button>

          <button
            onClick={() => setActiveTab("friend")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "friend"
                ? "bg-primary text-surface-main shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Play with a Friend</span>
            <span className="sm:hidden">Friend</span>
          </button>

          <button
            onClick={() => setActiveTab("pass")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "pass"
                ? "bg-primary text-surface-main shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Tv className="w-4 h-4" />
            <span className="hidden sm:inline">Pass & Play</span>
            <span className="sm:hidden">Local</span>
          </button>
        </div>
  )
}

export default LobbyTabs;
