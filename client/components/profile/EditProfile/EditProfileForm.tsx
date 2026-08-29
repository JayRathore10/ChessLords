"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, Edit3, Save } from "lucide-react";

interface EditProfileFormProps {
  name: string;
  profilePic?: string;
  setName: (name: string) => void;
  setProfilePic: (file: File | null) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function EditProfileForm({
  name,
  profilePic,
  setName,
  setProfilePic,
  isSubmitting,
  onSubmit,
}: EditProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profilePic || null
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewUrl(profilePic || null);
  }, [profilePic]);

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please select a JPG, PNG, or WEBP image.");
      return;
    }

    // Validate file size (5 MB)
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Profile picture must be smaller than 5 MB.");
      return;
    }

    // Send the actual File to ProfilePage
    setProfilePic(file);

    // Create preview
    const objectUrl = URL.createObjectURL(file);

    setPreviewUrl(objectUrl);

    // Clean up the previous preview URL
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  };

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
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary-gradient text-[#0f1115] font-extrabold text-2xl flex items-center justify-center border-2 border-white/10">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {name ? name[0].toUpperCase() : "U"}
                  </span>
                )}
              </div>

              {/* Camera Button */}
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

            {/* Upload Button */}
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

          {/* Hidden File Input */}
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
            className="w-full px-4 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm disabled:opacity-50"
          />
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#babcbd] hover:bg-[#cfd1d2] text-[#0f1115] font-bold rounded-xl shadow transition active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />

            <span>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

