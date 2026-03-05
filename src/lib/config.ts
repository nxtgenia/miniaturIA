// Centralized configuration for the API
// In production, we prefer relative paths if no VITE_API_URL is provided
// We also ignore anything containing 'render.com' as it is deprecated
const metaEnv = (import.meta as any).env;
const rawUrl = metaEnv.VITE_API_URL || '';
export const API_URL = (rawUrl && !rawUrl.includes('render.com')) ? (rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl) : '';
