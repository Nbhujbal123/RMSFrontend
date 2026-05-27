// Always produce a clean URL ending in /api regardless of what is set in .env
const _raw = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "");          // strip any trailing slashes
export const API_BASE_URL = _raw.endsWith("/api") ? _raw : _raw + "/api";

// Socket.io connects to the server root (not /api)
export const SOCKET_URL = _raw.endsWith("/api") ? _raw.slice(0, -4) : _raw;

export const FRONTEND_URL = window.location.origin;
