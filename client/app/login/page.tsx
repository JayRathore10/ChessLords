'use client';

import React, { useState, useRef, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from
  "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function LoginPage() {
  
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const chessPieceRef = useRef<HTMLDivElement>(null);

  // Add subtle parallax effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!chessPieceRef.current) return;

      const rect = chessPieceRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateY = ((mouseX - centerX) / centerX) * 5;
      const rotateX = ((mouseY - centerY) / centerY) * 5;

      chessPieceRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${isHovered ? 'scale(1.05)' : 'scale(1)'}`;
    };

    const currentRef = chessPieceRef.current;
    currentRef?.addEventListener('mousemove', handleMouseMove);

    return () => {
      currentRef?.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHovered]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email.trim() || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${backendURL}/api/v1/auth/login` , 
        {
          email: formData.email.trim(),
          password: formData.password,
        },
        {
          withCredentials: true,
        }
      );
      router.push("/");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
          "Failed to log in. Please check your credentials."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-64px)] overflow-hidden flex items-center justify-center p-4 bg-linear-to-b from-[#0f1115] via-[#12151b] to-[#0a0c0f]">

      {/* Background glow */}
      <div className="absolute w-96 h-96 bg-[#babcbd]/10 rounded-full blur-3xl pointer-events-none -top-10 left-1/2 -translate-x-1/2" />

      {/* Chess Piece - Now peeking from left side */}
      <div
        ref={chessPieceRef}
        className="chess-piece-container"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/black-2.png"
          alt="Chess piece"
          className="chess-piece"
        />
      </div>

      <div className="right-chess-piece-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/black-hr-2.png"
          alt="Chess piece"
          className="right-chess-piece"
        />
      </div>

      {/* Login Content */}
      <div className="w-full max-w-md relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome Back,{" "}
            <span className="text-[#babcbd]">Lord</span>
          </h1>

          <p className="text-gray-400 text-sm mt-2">
            Enter your credentials to access your realm and climb the ladder.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#161920]/90 backdrop-blur-xl border border-[#232732] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">

          {/* Error */}
          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2"
              >
                Email Address
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-5 h-5" />
                </div>

                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  required
                  placeholder="lord@chess.com"
                  className="w-full pl-11 pr-4 py-3 bg-[#0f1115] border border-[#232732] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  Password
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-5 h-5" />
                </div>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-[#0f1115] border border-[#232732] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#babcbd] focus:ring-1 focus:ring-[#babcbd] transition text-sm"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-linear-to-r from-[#babcbd] to-[#cfd1d2] hover:from-[#cfd1d2] hover:to-[#e4e5e6] text-[#0f1115] font-bold rounded-xl shadow-lg shadow-black/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#0f1115] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enter the Arena</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#232732] text-center">
            <p className="text-sm text-gray-400">
              New to ChessLord?{" "}
              <a
                href="/register"
                className="text-[#babcbd] hover:text-white font-semibold transition"
              >
                Create an account
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Chess Piece Styles */}
      <style jsx>{`
        .chess-piece-container {
          position: absolute;
          left: -50px;
          bottom: 50px;
          width: 350px;
          height: 500px;
          z-index: 1;
          pointer-events: auto;
          transition: all 0.3s ease;
          transform: perspective(1000px) rotateX(0deg) rotateY(0deg);
          transform-style: preserve-3d;
        }

        .chess-piece {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transform: rotate(-15deg) translateY(20px);
          filter: 
            drop-shadow(0 25px 30px rgba(0, 0, 0, 0.5))
            drop-shadow(0 0 25px rgba(186, 188, 189, 0.12));
          transition: 
            transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275),
            filter 0.4s ease;
        }

        .chess-piece-container:hover .chess-piece {
          transform: rotate(-12deg) translateY(15px) translateX(10px);
          filter: 
            drop-shadow(0 30px 40px rgba(0, 0, 0, 0.6))
            drop-shadow(0 0 30px rgba(186, 188, 189, 0.18));
        }

        /* Right side chess piece styles */
        .right-chess-piece-container {
          position: absolute;
          right: -40px;
          top: 0px;
          width: 350px;
          height: 400px;
          z-index: 1;
          pointer-events: auto;
        }

        .right-chess-piece {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transform: rotate(15deg) translateY(20px);
          filter: 
            drop-shadow(0 25px 30px rgba(0, 0, 0, 0.5))
            drop-shadow(0 0 25px rgba(186, 188, 189, 0.12));
          transition: 
            transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275),
            filter 0.4s ease;
        }

        .right-chess-piece-container:hover .right-chess-piece {
          transform: rotate(12deg) translateY(15px) translateX(-10px);
          filter: 
            drop-shadow(0 30px 40px rgba(0, 0, 0, 0.6))
            drop-shadow(0 0 30px rgba(186, 188, 189, 0.18));
        }

        @media (max-width: 768px) {
          .chess-piece-container {
            left: -80px;
            width: 280px;
            height: 400px;
          }
          
          .chess-piece {
            transform: rotate(-12deg) translateY(15px);
          }
          
          .right-chess-piece-container {
            right: -80px;
            width: 280px;
            height: 400px;
          }
          
          .right-chess-piece {
            transform: rotate(12deg) translateY(15px);
          }
        }

        @media (max-width: 480px) {
          .chess-piece-container,
          .right-chess-piece-container {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}