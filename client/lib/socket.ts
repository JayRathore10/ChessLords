import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  auth: (cb) => {
    cb({ token: getAuthToken() });
  },
});

/** Refresh handshake auth before (re)connecting after login/logout. */
export function syncSocketAuth(): void {
  socket.auth = { token: getAuthToken() };
}

export function connectSocket(): void {
  syncSocketAuth();
  if (!socket.connected) {
    socket.connect();
  }
}
