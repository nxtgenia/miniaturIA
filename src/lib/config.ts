// Centralized configuration for the API
// In development, this will be empty (using Vite proxy)
// In production, this will be the URL of the deployed backend (e.g., Render)
export const API_URL = import.meta.env.VITE_API_URL || '';
