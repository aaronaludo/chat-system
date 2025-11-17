const DEFAULT_API_URL = 'http://localhost:8000/v1';

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(/\/$/, '');

export { API_BASE_URL, DEFAULT_API_URL };
