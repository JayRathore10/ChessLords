"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "@/lib/api"; // <-- Import the new interceptor
import { socket, syncSocketAuth } from "@/lib/socket";

export interface User {
  _id: string;
  username: string;
  email: string;
  name: string;
  role: "user" | "admin";
  bio?: string;
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
  register: (username: string, name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; username?: string; bio?: string; profilePic?: File; }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken) setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("user");
        }
      }

      // Automatically uses the interceptor to refresh token if 401 occurs
      const res = await api.get(`/api/v1/auth/me`);

      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("userId", res.data.user._id);
      }
    } catch {
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
    try {
      const res = await api.post(`/api/v1/auth/login`, { email, password });

      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        if (res.data.accessToken) {
          setToken(res.data.accessToken);
          localStorage.setItem("token", res.data.accessToken);
        }
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("userId", res.data.user._id);

        if (socket.connected) socket.disconnect();
        syncSocketAuth();
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Login failed. Please try again.");
    }
  };

  const register = async (username: string, name: string, email: string, password: string) => {
    try {
      const res = await api.post(`/api/v1/auth/register`, { username, name, email, password });

      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        if (res.data.accessToken) {
          setToken(res.data.accessToken);
          localStorage.setItem("token", res.data.accessToken);
        }
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("userId", res.data.user._id);

        if (socket.connected) socket.disconnect();
        syncSocketAuth();
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  const logout = async () => {
    try {
      await api.post(`/api/v1/auth/logout`, {});
    } catch {
      // Ignore errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");

      if (socket.connected) socket.disconnect();
      syncSocketAuth();
    }
  };

  const updateProfile = async (data: { name?: string; username?: string; bio?: string; profilePic?: File; }) => {
    const formData = new FormData();
    if (data.name !== undefined) formData.append("name", data.name);
    if (data.username !== undefined) formData.append("username", data.username);
    if (data.bio !== undefined) formData.append("bio", data.bio);
    if (data.profilePic) formData.append("profilePic", data.profilePic);

    try {
      const res = await api.patch(`/api/v1/users/me`, formData);
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update profile");
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await api.post(`/api/v1/auth/change-password`, { currentPassword, newPassword });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to change password");
    }
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