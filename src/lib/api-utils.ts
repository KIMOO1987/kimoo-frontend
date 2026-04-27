export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kimoo-frontend.vercel.app';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  return fetch(url, options);
}
