"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { socket } from "@/lib/socket";
import { Swords, UserPlus, Info, AlertCircle, X, Check } from "lucide-react";

export default function GlobalNotifications() {
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;

    // 1. Friend Requests
    const handleFriendRequest = (data: { senderName: string }) => {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[var(--surface-card)] shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-[var(--surface-border)]`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <UserPlus className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">New Friend Request</p>
                <p className="mt-1 text-sm text-gray-400">{data.senderName} sent you a friend request.</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-[var(--surface-border)]">
            <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-white hover:bg-[var(--surface-main)] transition">
              Close
            </button>
          </div>
        </div>
      ), { duration: 5000 });
    };

    // 2. Game Challenges
    const handleIncomingChallenge = (data: { challengerId: string; challengerName: string; format: string; timeControl: any }) => {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[var(--surface-card)] shadow-2xl rounded-2xl pointer-events-auto flex flex-col ring-1 ring-[var(--primary-border)] border border-[var(--primary-border)] overflow-hidden`}>
          <div className="p-4 flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <Swords className="h-6 w-6 text-[var(--primary)]" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-bold text-white">Match Challenge!</p>
              <p className="mt-1 text-sm text-gray-300">
                <span className="font-semibold text-[var(--primary)]">{data.challengerName}</span> challenged you to a {data.format} game ({data.timeControl?.name}).
              </p>
            </div>
          </div>
          <div className="flex border-t border-[var(--surface-border)] bg-[var(--surface-main)]/50">
            <button 
              onClick={() => {
                socket.emit("respondChallenge", { challengerId: data.challengerId, accept: false });
                toast.dismiss(t.id);
              }} 
              className="flex-1 p-3 flex items-center justify-center gap-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition border-r border-[var(--surface-border)]"
            >
              <X className="w-4 h-4" /> Decline
            </button>
            <button 
              onClick={() => {
                socket.emit("respondChallenge", { challengerId: data.challengerId, accept: true });
                toast.dismiss(t.id);
                // Optionally route them to a loading screen or wait for the gameId to be sent back
              }} 
              className="flex-1 p-3 flex items-center justify-center gap-2 text-sm font-bold text-emerald-400 hover:bg-emerald-500/10 transition"
            >
              <Check className="w-4 h-4" /> Accept
            </button>
          </div>
        </div>
      ), { duration: 10000 }); // Challenges stay on screen longer
    };

    // 3. Challenge Responses (When YOU send a challenge and they reply)
    const handleChallengeResponse = (data: { responderName: string; accept: boolean; gameId?: string }) => {
      if (data.accept && data.gameId) {
        toast.success(`${data.responderName} accepted! Joining game...`);
        router.push(`/game/${data.gameId}`);
      } else {
        toast.error(`${data.responderName} declined your challenge.`);
      }
    };

    // 4. Errors & System Notifications
    const handleSocialError = (data: { message: string }) => {
      toast.error(data.message, {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        style: { background: 'var(--surface-card)', color: '#fff', border: '1px solid var(--surface-border)' }
      });
    };

    const handleSystemNotification = (data: { message: string }) => {
      toast(data.message, {
        icon: <Info className="w-5 h-5 text-blue-400" />,
        style: { background: 'var(--surface-card)', color: '#fff', border: '1px solid var(--surface-border)' }
      });
    };

    // Attach Listeners
    socket.on("friendRequestReceived", handleFriendRequest);
    socket.on("incomingChallenge", handleIncomingChallenge);
    socket.on("challengeResponse", handleChallengeResponse);
    socket.on("socialError", handleSocialError);
    socket.on("systemNotification", handleSystemNotification);

    return () => {
      socket.off("friendRequestReceived", handleFriendRequest);
      socket.off("incomingChallenge", handleIncomingChallenge);
      socket.off("challengeResponse", handleChallengeResponse);
      socket.off("socialError", handleSocialError);
      socket.off("systemNotification", handleSystemNotification);
    };
  }, [router]);

  // Render the Toaster provider which actually paints the toasts to the DOM
  return (
    <Toaster 
      position="bottom-right" 
      toastOptions={{
        className: 'text-sm font-medium',
        style: {
          background: 'var(--surface-card)',
          color: '#fff',
          border: '1px solid var(--surface-border)',
        },
      }} 
    />
  );
}
