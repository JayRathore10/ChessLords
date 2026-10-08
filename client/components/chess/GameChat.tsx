"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { socket } from "@/lib/socket";

type MessageType = "quick" | "emoji" | "custom";

interface ChatMessage {
  _id: string;
  gameId: string;
  senderId?: string;
  senderColor: "white" | "black";
  senderName: string;
  message: string;
  messageType: MessageType;
  createdAt: string | Date;
}

interface GameChatProps {
  gameId: string;
  playerColor: "white" | "black" | null;
  enabled: boolean;
  canSend: boolean;
}

const QUICK_MESSAGES = [
  "Good luck!",
  "Well played!",
  "Good game!",
  "Thank you!",
  "Nice move!",
  "Oops, my mistake!",
  "Sorry!",
  "Let's play again!",
];

const EMOJIS = ["👍", "😂", "👏", "😮", "😢", "🤔", "❤️", "🔥", "😎", "🙌"];

export default function GameChat({
  gameId,
  playerColor,
  enabled,
  canSend,
}: GameChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"quick" | "emoji">("quick");
  const [chatError, setChatError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const optimisticIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || !playerColor) return;

    const handleChatHistory = (history: ChatMessage[]) => {
      setMessages((previous) => {
        const combined = new Map<string, ChatMessage>();

        previous.forEach((item) => combined.set(item._id, item));
        history.forEach((item) => combined.set(item._id, item));

        return Array.from(combined.values()).sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        );
      });
    };

    const handleNewMessage = (newMessage: ChatMessage) => {
      if (newMessage.gameId !== gameId) return;

      setMessages((previous) => {
        if (previous.some((item) => item._id === newMessage._id)) {
          return previous;
        }

        return [...previous, newMessage];
      });
    };

    const handleChatError = (data: { message: string }) => {
      setChatError(data.message);
    };

    socket.on("chatHistory", handleChatHistory);
    socket.on("newMessage", handleNewMessage);
    socket.on("chatError", handleChatError);

    // The game component enables chat after receiving gameState.
    // At this point, the server has already joined the socket to the game.
    socket.emit("getChatHistory", { gameId });
    const historyRetry = window.setTimeout(() => {
      socket.emit("getChatHistory", { gameId });
    }, 500);

    return () => {
      window.clearTimeout(historyRetry);
      socket.off("chatHistory", handleChatHistory);
      socket.off("newMessage", handleNewMessage);
      socket.off("chatError", handleChatError);
    };
  }, [gameId, playerColor, enabled]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string, messageType: MessageType) => {
    const trimmed = text.trim();

    if (!trimmed || !canSend) return;

    const optimisticMessage: ChatMessage = {
      _id: `local-${optimisticIdRef.current++}`,
      gameId,
      senderColor: playerColor,
      senderName: "You",
      message: trimmed,
      messageType,
      createdAt: new Date(),
    };

    setMessages((previous) => [...previous, optimisticMessage]);

    socket.emit("sendMessage", {
      gameId,
      message: trimmed,
      messageType,
    });

    setChatError("");
    if (messageType === "custom") {
      setInput("");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(input, "custom");
  };

  const formatMessageTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!enabled) return null;

  return (
    <section className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl overflow-hidden flex flex-col min-h-[360px] max-h-[520px] lg:min-h-0 lg:flex-1">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--surface-border)]">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Game Chat
          </h3>
        </div>

        <span className="text-[10px] text-gray-500">
          {canSend ? "Live" : "Read only"}
        </span>
      </div>

      {/* Messages */}
      <div className="min-h-[150px] flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <MessageCircle className="w-7 h-7 text-gray-600 mb-2" />
            <p className="text-xs text-gray-500">
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          messages.map((item) => {
            const isMine = item.senderColor === playerColor;

            return (
              <div
                key={item._id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 shadow-sm ${
                    isMine
                      ? "bg-[var(--primary-muted)] border border-[var(--primary-border)]"
                      : "bg-[var(--surface-main)] border border-[var(--surface-border)]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold text-gray-400 truncate">
                      {isMine ? "You" : item.senderName}
                    </span>
                    <span className="text-[9px] text-gray-600">
                      {formatMessageTime(item.createdAt)}
                    </span>
                  </div>

                  <p
                    className={`text-sm break-words whitespace-pre-wrap ${
                      item.messageType === "emoji" ? "text-2xl" : "text-gray-200"
                    }`}
                  >
                    {item.message}
                  </p>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick chat */}
      <div className="border-t border-[var(--surface-border)] p-3 space-y-3 bg-[var(--surface-card)]">
        {canSend && (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("quick")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "quick"
                    ? "bg-[var(--primary-muted)] text-[var(--primary)] border border-[var(--primary-border)]"
                    : "bg-[var(--surface-main)] text-gray-400 border border-[var(--surface-border)]"
                }`}
              >
                Quick Messages
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("emoji")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "emoji"
                    ? "bg-[var(--primary-muted)] text-[var(--primary)] border border-[var(--primary-border)]"
                    : "bg-[var(--surface-main)] text-gray-400 border border-[var(--surface-border)]"
                }`}
              >
                Emojis
              </button>
            </div>

            {activeTab === "quick" ? (
              <div className="grid grid-cols-2 gap-2">
                {QUICK_MESSAGES.map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => sendMessage(phrase, "quick")}
                    className="px-2 py-2 rounded-lg text-[11px] text-gray-300 bg-[var(--surface-main)] border border-[var(--surface-border)] hover:border-[var(--primary-border)] hover:text-white transition text-center"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => sendMessage(emoji, "emoji")}
                    className="rounded-lg py-2 text-xl bg-[var(--surface-main)] border border-[var(--surface-border)] hover:border-[var(--primary-border)] transition"
                    aria-label={`Send ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Custom message input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={canSend ? "Type a message..." : "Chat is read only"}
            maxLength={500}
            disabled={!canSend}
            className="min-w-0 flex-1 px-3 py-2.5 rounded-xl text-sm text-white bg-[var(--surface-main)] border border-[var(--surface-border)] outline-none focus:border-[var(--primary-border)] placeholder:text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!canSend || !input.trim()}
            aria-label="Send message"
            className="p-2.5 rounded-xl bg-primary-gradient text-[var(--surface-main)] disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {chatError && (
          <p className="text-[11px] text-red-400" role="alert">
            {chatError}
          </p>
        )}
      </div>
    </section>
  );
}
