"use client";

import React from "react";
import { Lock } from "lucide-react";

interface ChangePasswordFormProps {
  passwordForm: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  setPasswordForm: React.Dispatch<
    React.SetStateAction<{
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }>
  >;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ChangePasswordForm({
  passwordForm,
  setPasswordForm,
  isSubmitting,
  onSubmit,
}: ChangePasswordFormProps) {
  return (
    <div className="bg-[#161920] border border-[#232732] rounded-xl p-6 max-w-xl">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Lock className="w-5 h-5 text-[#babcbd]" />
        <span>Update Password</span>
      </h3>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Current Password
          </label>

          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                currentPassword: e.target.value,
              }))
            }
            required
            placeholder="••••••••"
            className="w-full px-4 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
          />
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            New Password
          </label>

          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
            required
            placeholder="Minimum 6 characters"
            className="w-full px-4 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
          />
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Confirm New Password
          </label>

          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            required
            placeholder="Re-enter new password"
            className="w-full px-4 py-2.5 bg-[#0f1115] border border-[#232732] rounded-xl text-white focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#babcbd] hover:bg-[#cfd1d2] text-[#0f1115] font-bold rounded-xl shadow transition active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            <Lock className="w-4 h-4" />

            <span>
              {isSubmitting ? "Updating..." : "Update Password"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}