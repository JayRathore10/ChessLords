"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
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
    profilePic?: File;
  }) => Promise<void>;

  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;

  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state
  const refreshUser = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      // Restore token from localStorage
      if (storedToken) {
        setToken(storedToken);
      }

      // Restore user from localStorage
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("user");
        }
      }

      // Fetch fresh user data from backend
      const res = await axios.get(
        `${backendURL}/api/v1/auth/me`,
        {
          withCredentials: true,
          headers: storedToken
            ? {
              Authorization: `Bearer ${storedToken}`,
            }
            : undefined,
        }
      );

      if (res.data.success && res.data.user) {
        setUser(res.data.user);

        localStorage.setItem(
          "user",
          JSON.stringify(res.data.user)
        );

        localStorage.setItem(
          "userId",
          res.data.user._id
        );
      }
    } catch {
      // If there is no valid token, clear auth state
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

  // LOGIN
  const login = async (
    email: string,
    password: string
  ) => {
    try {
      const res = await axios.post(
        `${backendURL}/api/v1/auth/login`,
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

          localStorage.setItem(
            "token",
            res.data.token
          );
        }

        localStorage.setItem(
          "user",
          JSON.stringify(res.data.user)
        );

        localStorage.setItem(
          "userId",
          res.data.user._id
        );
      }

    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
          "Login failed. Please try again."
        );
      }

      throw new Error(
        "Something went wrong. Please try again."
      );
    }
  };
  
  // REGISTER
  const register = async (
    username: string,
    name: string,
    email: string,
    password: string
  ) => {
    const res = await axios.post(
      `${backendURL}/api/v1/auth/register`,
      {
        username,
        name,
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

        localStorage.setItem(
          "token",
          res.data.token
        );
      }

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      localStorage.setItem(
        "userId",
        res.data.user._id
      );
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await axios.post(
        `${backendURL}/api/v1/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );
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

  // UPDATE PROFILE
  const updateProfile = async (data: {
    name?: string;
    profilePic?: File;
  }) => {
    const formData = new FormData();

    if (data.name !== undefined) {
      formData.append("name", data.name);
    }

    if (data.profilePic) {
      formData.append("profilePic", data.profilePic);
    }

    const res = await axios.patch(
      `${backendURL}/api/v1/users/me`,
      formData,
      {
        withCredentials: true,
        headers: {
          ...(token
            ? {
              Authorization: `Bearer ${token}`,
            }
            : {}),
        },
      }
    );

    if (res.data.success && res.data.user) {
      setUser(res.data.user);

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );
    }
  };

  // CHANGE PASSWORD
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    await axios.post(
      `${backendURL}/api/v1/auth/change-password`,
      {
        currentPassword,
        newPassword,
      },
      {
        withCredentials: true,
        headers: token
          ? {
            Authorization: `Bearer ${token}`,
          }
          : undefined,
      }
    );
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
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}
