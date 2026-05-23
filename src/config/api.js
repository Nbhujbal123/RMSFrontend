// API base URL — reads from .env (VITE_API_URL) in production, falls back to localhost for dev
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Frontend origin — automatically correct in both dev (localhost:5173) and production (your hosted domain)
export const FRONTEND_URL = window.location.origin;
