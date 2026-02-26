// Centralized configuration for the API
// In development, this will be empty (using Vite proxy)
// In production, this will be the URL of the deployed backend (e.g., Render)
const rawUrl = import.meta.env.VITE_API_URL || '';
export const API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
