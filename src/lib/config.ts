// Centralized configuration for the API
// In production, we prefer relative paths if no VITE_API_URL is provided
const rawUrl = import.meta.env.VITE_API_URL || '';
export const API_URL = rawUrl ? (rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl) : '';
