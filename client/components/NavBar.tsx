"use client";

import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full h-16 px-6 flex items-center justify-between border-b border-gray-800 bg-[#0f1115]">
      
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="ChessLord Logo"
          width={42}
          height={42}
          priority
        />

        <span className="text-xl font-bold text-white">
          ChessLord
        </span>
      </Link>

      {/* Navigation */}
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-gray-300 hover:text-white transition"
        >
          Home
        </Link>

        <Link
          href="/play"
          className="text-gray-300 hover:text-white transition"
        >
          Play
        </Link>

        <Link
          href="/leaderboard"
          className="text-gray-300 hover:text-white transition"
        >
          Leaderboard
        </Link>

        <Link
          href="/profile"
          className="text-gray-300 hover:text-white transition"
        >
          Profile
        </Link>
      </div>

      {/* Login */}
      <Link
        href="/login"
        className="px-4 py-2 rounded-md bg-white text-black font-medium hover:bg-gray-200 transition"
      >
        Login
      </Link>
    </nav>
  );
}
