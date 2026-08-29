"use client";

import React, { useRef, useState } from "react";
import { Edit3, Save, Camera } from "lucide-react";

interface EditProfileFormProps {
  name: string;
  setName: (name: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function EditProfileForm({
  name,
  setName,
  isSubmitting,
  onSubmit,
}: EditProfileFormProps) {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Create a temporary preview URL
    const imageUrl = URL.createObjectURL(file);

    setProfilePicture(imageUrl);
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
            {/* Profile Picture Preview */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary-gradient text-[#0f1115] font-extrabold text-2xl flex items-center justify-center border-2 border-white/10">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  name
                    ? name[0].toUpperCase()
                    : "U"
                )}
              </div>

              {/* Camera Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#babcbd] text-[#0f1115] flex items-center justify-center border-2 border-[#161920] hover:bg-[#cfd1d2] transition"
                aria-label="Change profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[#0f1115] border border-[#232732] text-white text-sm font-medium rounded-xl hover:bg-[#1c202a] transition"
              >
                Choose Image
              </button>

              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG or WEBP. Recommended square image.
              </p>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleProfilePictureChange}
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
            className="w-full px-4 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
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