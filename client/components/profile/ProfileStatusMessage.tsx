"use client";

import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ProfileStatusMessageProps {
  statusMessage: {
    type: "success" | "error";
    text: string;
  } | null;
}

export default function ProfileStatusMessage({
  statusMessage,
}: ProfileStatusMessageProps) {
  if (!statusMessage) {
    return null;
  }

  return (
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
  );
}