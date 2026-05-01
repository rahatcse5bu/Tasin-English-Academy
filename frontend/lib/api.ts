const BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export async function api<T = any>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };
  if (token) h.Authorization = `Bearer ${token}`;
  const url = path.startsWith('http') ? path : `${BASE}/api${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, { ...rest, headers: h, cache: 'no-store' });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data = await res.json();
      msg = data.message || msg;
    } catch {}
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  if (res.status === 204) return null as T;
  return res.json();
}

export const API_BASE = BASE;
