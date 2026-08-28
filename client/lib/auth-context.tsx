"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { apiFetch, ApiError } from "./api";

import axios from "axios";

export interface User {
  _id: string;
  username: string;
  email: string;
  name: string;
  role: "user" | "admin";
  rating?: number;
  profilePic?: string;
  gamesPlayed?: number;
  gamesWon?: number;
  gamesLost?: number;
  gamesDrawn?: number;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    username?: string;
    profilePic?: string;
  }) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from localStorage and /api/v1/auth/me
  const refreshUser = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken) {
        setToken(storedToken);
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // invalid stored user JSON
        }
      }

      // Fetch fresh user data from server
      const res = await apiFetch<{ success: boolean; user: User }>("/auth/me");
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("userId", res.user._id);
      }
    } catch {
      // If fetching fails (e.g. not logged in), clear user state if no valid session
      if (!localStorage.getItem("token")) {
        setUser(null);
        setToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser();
  }, [refreshUser]);


  const login = async (email: string, password: string) => {
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/login`,
    {
      email,
      password,
    },
    {
      withCredentials: true,
    }
  );

  if (res.data.success && res.data.user) {
    setUser(res.data.user);

    if (res.data.token) {
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
    }

    localStorage.setItem("user", JSON.stringify(res.data.user));
    localStorage.setItem("userId", res.data.user._id);
  }
};

  const register = async (
    username: string,
    name: string,
    email: string,
    password: string
  ) => {
    const res = await apiFetch<{
      success: boolean;
      token?: string;
      user: User;
      message?: string;
    }>("/auth/register", {
      method: "POST",
      data: { username, name, email, password },
    });

    if (res.success && res.user) {
      setUser(res.user);
      if (res.token) {
        setToken(res.token);
        localStorage.setItem("token", res.token);
      }
      localStorage.setItem("user", JSON.stringify(res.user));
      localStorage.setItem("userId", res.user._id);
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout request errors
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
    }
  };

  const updateProfile = async (data: {
    name?: string;
    username?: string;
    profilePic?: string;
  }) => {
    const res = await apiFetch<{
      success: boolean;
      user: User;
      message?: string;
    }>("/users/me", {
      method: "PATCH",
      data,
    });

    if (res.success && res.user) {
      setUser((prev) => ({ ...(prev || {}), ...res.user }));
      localStorage.setItem("user", JSON.stringify({ ...(user || {}), ...res.user }));
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    await apiFetch("/auth/change-password", {
      method: "POST",
      data: { currentPassword, newPassword },
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
