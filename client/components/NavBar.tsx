"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Trophy,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Swords,
  Shield,
} from "lucide-react";

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on path change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Play", href: "/game" },
    { name: "Leaderboard", href: "/leaderboard" },
  ];

  return (
    <nav className="w-full h-16 px-4 md:px-8 flex items-center justify-between border-b border-[#232732] bg-[#0f1115]/95 backdrop-blur-md sticky top-0 z-50">
      {/* Brand / Logo */}
      <div className="flex items-center gap-8">
        <Link
          href="/"
          className="flex items-center gap-3 group transition-transform active:scale-95"
        >
          <div className="relative w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-primary-gradient shadow-md shadow-black/40">
            <Image
              src="/logo.png"
              alt="ChessLord Logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>

          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[#babcbd] to-gray-400 bg-clip-text text-transparent">
            Chess<span className="text-[#babcbd]">Lord</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right Section: Auth States & User Menu */}
      <div className="hidden md:flex items-center gap-3">
        {isLoading ? (
          <div className="w-24 h-9 bg-gray-800/50 animate-pulse rounded-lg" />
        ) : user ? (
          <div className="flex items-center gap-3">
            {/* Rating Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#babcbd]/10 border border-[#babcbd]/25 rounded-full text-[#babcbd] text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5 text-[#babcbd]" />
              <span>{user.rating ?? 1200}</span>
            </div>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#161920] hover:bg-[#1c202a] border border-[#232732] transition-all active:scale-95"
              >
                <div className="w-7 h-7 rounded-full bg-primary-gradient text-[#0f1115] font-bold flex items-center justify-center text-xs shadow-inner">
                  {user.name ? user.name[0].toUpperCase() : user.username[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-200 max-w-[120px] truncate">
                  {user.username}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#161920] border border-[#232732] rounded-xl shadow-2xl py-1.5 text-sm z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2.5 border-b border-[#232732]">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="font-semibold text-white truncate">{user.name || user.username}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>

                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <UserIcon className="w-4 h-4 text-[#babcbd]" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href="/game"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <Swords className="w-4 h-4 text-[#babcbd]" />
                    <span>Play Online</span>
                  </Link>

                  {user.role === "admin" && (
                    <div className="flex items-center gap-2.5 px-4 py-2.5 text-[#babcbd] text-xs font-semibold">
                      <Shield className="w-4 h-4" />
                      <span>Admin Account</span>
                    </div>
                  )}

                  <div className="border-t border-[#232732] my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="px-4 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-4 py-1.5 text-sm font-semibold bg-[#babcbd] hover:bg-[#cfd1d2] text-[#0f1115] rounded-lg shadow transition active:scale-95"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen((prev) => !prev)}
        className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-[#12141a] border-b border-[#232732] px-6 py-5 flex flex-col gap-4 shadow-2xl z-50 animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-base font-medium py-2 ${
                pathname === link.href ? "text-[#babcbd] font-semibold" : "text-gray-300"
              }`}
            >
              {link.name}
            </Link>
          ))}

          <div className="border-t border-[#232732] pt-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary-gradient text-[#0f1115] font-bold flex items-center justify-center text-xs">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user.username}</p>
                      <p className="text-xs text-gray-400">Rating: {user.rating ?? 1200}</p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="text-xs font-semibold text-[#babcbd] px-3 py-1.5 rounded-md bg-[#babcbd]/10 border border-[#babcbd]/20"
                  >
                    Profile
                  </Link>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full mt-2 py-2 text-center text-sm font-semibold text-red-400 bg-red-500/10 rounded-lg border border-red-500/20"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/login"
                  className="w-full py-2.5 text-center text-sm font-medium text-white bg-white/10 rounded-lg"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="w-full py-2.5 text-center text-sm font-semibold text-[#0f1115] bg-[#babcbd] hover:bg-[#cfd1d2] rounded-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
