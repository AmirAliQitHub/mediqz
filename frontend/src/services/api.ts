const API_BASE = '/api';

let memoryStore: Record<string, string> = {};

export function getAuthToken(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('alqualite_coursebox_token') : null;
  } catch {
    return memoryStore['alqualite_coursebox_token'] || null;
  }
}

export function setAuthToken(token: string): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('alqualite_coursebox_token', token);
    }
  } catch {
    memoryStore['alqualite_coursebox_token'] = token;
  }
}

export function removeAuthToken(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('alqualite_coursebox_token');
    }
  } catch {
    delete memoryStore['alqualite_coursebox_token'];
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = 'خطا در ارتباط با سرور';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
