"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AtSign,
  Camera,
  CheckCircle2,
  Edit3,
  Loader2,
  Save,
  XCircle,
} from "lucide-react";
import { checkUsername } from "@/lib/api";

interface EditProfileFormProps {
  name: string;
  username: string;
  bio: string;
  currentUsername: string;
  profilePic?: string;
  setName: (name: string) => void;
  setUsername: (username: string) => void;
  setBio: (bio: string) => void;
  setProfilePic: (file: File | null) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function EditProfileForm({
  name,
  username,
  bio,
  currentUsername,
  profilePic,
  setName,
  setUsername,
  setBio,
  setProfilePic,
  isSubmitting,
  onSubmit,
}: EditProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCheckRef = useRef<string>("");

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profilePic || null
  );
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "unavailable" | "invalid"
  >("idle");
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewUrl(profilePic || null);
  }, [profilePic]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const isOwnUsername = (value: string) =>
    value.trim().toLowerCase() === currentUsername.trim().toLowerCase();

  const checkAvailability = useCallback(
    async (uname: string) => {
      const trimmed = uname.trim();
      if (!trimmed) {
        setUsernameStatus("idle");
        setUsernameMessage(null);
        return;
      }

      if (isOwnUsername(trimmed)) {
        setUsernameStatus("available");
        setUsernameMessage("This is your current username");
        return;
      }

      if (trimmed.length < 3) {
        setUsernameStatus("invalid");
        setUsernameMessage("Username must be at least 3 characters");
        return;
      }

      if (trimmed.length > 20) {
        setUsernameStatus("invalid");
        setUsernameMessage("Username must not exceed 20 characters");
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        setUsernameStatus("invalid");
        setUsernameMessage("Letters, numbers, and underscores only");
        return;
      }

      setUsernameStatus("checking");
      setUsernameMessage("Checking availability...");
      latestCheckRef.current = trimmed;

      try {
        const res = await checkUsername(trimmed);
        if (latestCheckRef.current === trimmed) {
          if (res.available) {
            setUsernameStatus("available");
            setUsernameMessage("Username is available");
          } else {
            setUsernameStatus("unavailable");
            setUsernameMessage(res.message || "Username is already taken");
          }
        }
      } catch {
        if (latestCheckRef.current === trimmed) {
          setUsernameStatus("idle");
          setUsernameMessage(null);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUsername]
  );

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);

    const trimmed = newUsername.trim();
    if (!trimmed) {
      setUsernameStatus("idle");
      setUsernameMessage(null);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      return;
    }

    if (isOwnUsername(trimmed)) {
      setUsernameStatus("available");
      setUsernameMessage("This is your current username");
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      return;
    }

    if (trimmed.length < 3) {
      setUsernameStatus("invalid");
      setUsernameMessage("Username must be at least 3 characters");
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      return;
    }

    if (trimmed.length > 20) {
      setUsernameStatus("invalid");
      setUsernameMessage("Username must not exceed 20 characters");
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameStatus("invalid");
      setUsernameMessage("Letters, numbers, and underscores only");
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      return;
    }

    setUsernameStatus("checking");
    setUsernameMessage("Checking availability...");

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      checkAvailability(trimmed);
    }, 400);
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      alert("Please select a JPG, PNG, or WEBP image.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Profile picture must be smaller than 5 MB.");
      return;
    }

    setProfilePic(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const usernameBlocked =
    username.trim().length > 0 &&
    !isOwnUsername(username) &&
    (usernameStatus === "checking" ||
      usernameStatus === "unavailable" ||
      usernameStatus === "invalid");

  return (
    <div className="bg-[#161920] border border-[#232732] rounded-xl p-6 max-w-xl">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Edit3 className="w-5 h-5 text-[#babcbd]" />
        <span>Edit Account Information</span>
      </h3>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Profile Picture
          </label>

          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary-gradient text-[#0f1115] font-extrabold text-2xl flex items-center justify-center border-2 border-white/10">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{name ? name[0].toUpperCase() : "U"}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#babcbd] text-[#0f1115] flex items-center justify-center border-2 border-[#161920] hover:bg-[#cfd1d2] transition disabled:opacity-50"
                aria-label="Change profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#0f1115] border border-[#232732] text-white text-sm font-medium rounded-xl hover:bg-[#1c202a] transition disabled:opacity-50"
              >
                Choose Image
              </button>

              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG or WEBP · Max 5 MB
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleProfilePictureChange}
            disabled={isSubmitting}
            className="hidden"
          />
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Display Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
            maxLength={30}
            className="w-full px-4 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm disabled:opacity-50"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <AtSign className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              required
              disabled={isSubmitting}
              autoComplete="username"
              maxLength={20}
              className={`w-full pl-10 pr-10 py-2.5 bg-[#0f1115] border rounded-xl text-white focus:outline-none focus:ring-1 transition text-sm disabled:opacity-50 ${
                usernameStatus === "available"
                  ? "border-emerald-500/60 focus:border-emerald-400 focus:ring-emerald-400"
                  : usernameStatus === "unavailable" || usernameStatus === "invalid"
                    ? "border-red-500/60 focus:border-red-400 focus:ring-red-400"
                    : "border-[#232732] focus:border-[#babcbd] focus:ring-[#babcbd]"
              }`}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {usernameStatus === "checking" && (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              )}
              {usernameStatus === "available" && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              {(usernameStatus === "unavailable" ||
                usernameStatus === "invalid") && (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>
          {usernameMessage && (
            <p
              className={`mt-1.5 text-xs ${
                usernameStatus === "available"
                  ? "text-emerald-400"
                  : usernameStatus === "checking"
                    ? "text-gray-400"
                    : "text-red-400"
              }`}
            >
              {usernameMessage}
            </p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={isSubmitting}
            maxLength={160}
            rows={3}
            placeholder="Tell other players a bit about yourself..."
            className="w-full px-4 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm disabled:opacity-50 resize-none"
          />
          <p className="mt-1.5 text-xs text-gray-500 text-right">
            {bio.length}/160
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || usernameBlocked}
            className="px-6 py-2.5 bg-[#babcbd] hover:bg-[#cfd1d2] text-[#0f1115] font-bold rounded-xl shadow transition active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />

            <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
