"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Bell, Check, X, Search, Play, Circle } from "lucide-react";
import { socket } from "@/lib/socket";
import { fetchFriendsData, sendFriendRequest, respondToFriendRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Friend {
  _id: string;
  username: string;
  profilePic?: string;
  rating: number;
  isOnline: boolean;
}

export default function FriendsSidebar() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "add">("friends");
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Friend[]>([]);
  
  const [searchUsername, setSearchUsername] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  // Load Data
  const loadData = async () => {
    try {
      const data = await fetchFriendsData();
      setFriends(data.friends || []);
      setRequests(data.friendRequests || []);
    } catch (err) {
      console.error("Failed to load friends", err);
    }
  };

  useEffect(() => {
    if (user) loadData();

    // Listen for live online/offline status changes
    const handleStatusChange = (data: { userId: string; isOnline: boolean }) => {
      setFriends((prev) => 
        prev.map((f) => f._id === data.userId ? { ...f, isOnline: data.isOnline } : f)
      );
    };

    socket.on("userStatusChanged", handleStatusChange);
    return () => {
      socket.off("userStatusChanged", handleStatusChange);
    };
  }, [user]);

  // Handlers
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      await sendFriendRequest(searchUsername.trim());
      setMessage({ text: "Friend request sent!", type: "success" });
      setSearchUsername("");
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to send request", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requesterId: string, action: "accept" | "reject") => {
    try {
      await respondToFriendRequest(requesterId, action);
      // Reload lists to reflect changes
      loadData();
    } catch (err) {
      console.error(`Failed to ${action} request`);
    }
  };

  const handleChallenge = (friendId: string) => {
    // We will wire up the actual game challenge logic later!
    socket.emit("challengeFriend", { 
      targetUserId: friendId, 
      timeControl: { initialTime: 600, increment: 0, name: "10 min" }, 
      format: "Rapid" 
    });
    alert("Challenge sent!");
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-sm bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl overflow-hidden flex flex-col h-[500px]">
      
      {/* Tabs */}
      <div className="flex border-b border-[var(--surface-border)] bg-[var(--surface-main)]">
        <button 
          onClick={() => setActiveTab("friends")}
          className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 ${activeTab === "friends" ? "text-[var(--primary)] border-b-2 border-[var(--primary)]" : "text-gray-500 hover:text-gray-300"}`}
        >
          <Users className="w-4 h-4" /> Friends
        </button>
        <button 
          onClick={() => setActiveTab("requests")}
          className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 relative ${activeTab === "requests" ? "text-[var(--primary)] border-b-2 border-[var(--primary)]" : "text-gray-500 hover:text-gray-300"}`}
        >
          <Bell className="w-4 h-4" /> Requests
          {requests.length > 0 && (
            <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab("add")}
          className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 ${activeTab === "add" ? "text-[var(--primary)] border-b-2 border-[var(--primary)]" : "text-gray-500 hover:text-gray-300"}`}
        >
          <UserPlus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[var(--surface-main)]/30">
        
        {/* FRIENDS TAB */}
        {activeTab === "friends" && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <p className="text-center text-sm text-gray-500 mt-10">You have no friends yet.</p>
            ) : (
              friends.sort((a, b) => (a.isOnline === b.isOnline) ? 0 : a.isOnline ? -1 : 1).map((friend) => (
                <div key={friend._id} className="flex items-center justify-between p-3 bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center font-bold text-white uppercase">
                        {friend.username[0]}
                      </div>
                      <Circle className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full fill-current ${friend.isOnline ? "text-emerald-500 border border-emerald-900" : "text-gray-500 border border-gray-800"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-none">{friend.username}</p>
                      <p className="text-xs text-gray-500 mt-1">Rating: {friend.rating}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleChallenge(friend._id)}
                    disabled={!friend.isOnline}
                    className="p-2 rounded-lg bg-[var(--primary-muted)] text-[var(--primary)] border border-[var(--primary-border)] hover:bg-[var(--primary)] hover:text-[var(--surface-main)] transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title={friend.isOnline ? "Challenge to a game" : "Offline"}
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* REQUESTS TAB */}
        {activeTab === "requests" && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-center text-sm text-gray-500 mt-10">No pending requests.</p>
            ) : (
              requests.map((req) => (
                <div key={req._id} className="flex flex-col gap-3 p-3 bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center font-bold text-white uppercase">
                      {req.username[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-none">{req.username}</p>
                      <p className="text-xs text-gray-500 mt-1">Rating: {req.rating}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleRespond(req._id, "reject")} className="flex-1 py-1.5 flex items-center justify-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition">
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button onClick={() => handleRespond(req._id, "accept")} className="flex-1 py-1.5 flex items-center justify-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition">
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ADD FRIEND TAB */}
        {activeTab === "add" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 text-center mt-2">Enter a username to send a friend request.</p>
            <form onSubmit={handleSendRequest} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--surface-main)] border border-[var(--surface-border)] text-sm text-white outline-none focus:border-[var(--primary-border)]"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || !searchUsername.trim()}
                className="w-full py-2.5 rounded-xl bg-primary-gradient text-[var(--surface-main)] font-bold text-sm disabled:opacity-50 transition"
              >
                {loading ? "Sending..." : "Send Request"}
              </button>
            </form>
            {message.text && (
              <p className={`text-xs text-center font-semibold ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                {message.text}
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
