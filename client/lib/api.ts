import axios from "axios";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") || "http://localhost:5000";
const API_URL = `${backendURL}/api/v1`;

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

// 1. Create the Axios Instance
export const api = axios.create({
  baseURL: backendURL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 2. Setup Axios Interceptors for Token Injection and Silent Refresh
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/api/v1/auth/login" &&
      originalRequest.url !== "/api/v1/auth/refresh-token"
    ) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Request a new access token using the HTTP-Only refresh cookie
        const { data } = await axios.post(
          `${backendURL}/api/v1/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.accessToken;
        localStorage.setItem("token", newAccessToken);
        api.defaults.headers.common["Authorization"] = "Bearer " + newAccessToken;
        originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

interface FetchOptions extends RequestInit {
  data?: any;
}

// 3. Rewrite apiFetch to use Axios under the hood
export async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { data, headers = {}, method = "GET" } = options;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const response = await api({
      url,
      method,
      data,
      headers: headers as Record<string, string>,
    });

    return response.data as T;
  } catch (error: any) {
    if (error.response) {
      throw new ApiError(
        error.response.data?.message || `Request failed with status ${error.response.status}`,
        error.response.status,
        error.response.data
      );
    }
    throw new ApiError(
      error.message || "Network error. Please check your connection.",
      0
    );
  }
}

export async function checkUsername(
  username: string
): Promise<{ available: boolean; message: string }> {
  try {
    const res = await apiFetch<{
      success: boolean;
      available: boolean;
      message: string;
    }>(`/auth/check-username/${encodeURIComponent(username)}`);

    return {
      available: !!res.available,
      message: res.message || "",
    };
  } catch (error: any) {
    return {
      available: false,
      message: error.message || "Failed to check username",
    };
  }
}