const backendBaseUrl =
  import.meta.env.VITE_BACKEND_BASE_URL?.trim() ||
  'http://localhost:5001';

export const BACKEND_BASE_URL = backendBaseUrl.replace(/\/$/, '');
