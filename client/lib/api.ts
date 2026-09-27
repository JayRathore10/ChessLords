const API_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

interface FetchOptions extends RequestInit {
  data?: any;
}

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

export async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { data, headers = {}, ...customConfig } = options;

  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token");
  }

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string>),
  };

  const config: RequestInit = {
    ...customConfig,
    headers: reqHeaders,
    credentials: "include", // Ensure cookies are sent
  };

  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, config);
    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Handle unauthorized / expired token
      if (response.status === 401 && typeof window !== "undefined") {
        // Token is invalid/expired
        if (token && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/register")) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }

      throw new ApiError(
        responseData.message || `Request failed with status ${response.status}`,
        response.status,
        responseData
      );
    }

    return responseData as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
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
