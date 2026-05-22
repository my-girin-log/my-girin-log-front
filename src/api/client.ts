const TOKEN_KEY = "my-girin-log.token";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api/v1";

const DEMO_USER = {
  githubId: "woowa_giraffe",
  nickname: "우테코기린",
  avatarUrl: "https://avatars.githubusercontent.com/u/123456",
};

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore localStorage errors
  }
}

async function ensureToken(): Promise<string> {
  const existing = readToken();
  if (existing) return existing;
  const response = await fetch(`${BASE_URL}/auth/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(DEMO_USER),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ApiError(`auth/demo failed: ${response.status}`, response.status, text);
  }
  const data = (await response.json()) as { token?: string };
  if (!data.token) throw new ApiError("auth/demo returned no token", 500, data);
  writeToken(data.token);
  return data.token;
}

export async function clearToken(): Promise<void> {
  writeToken(null);
}

export type RequestInitJson = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string | number | undefined | null>;
};

function buildUrl(path: string, query?: RequestInitJson["query"]): string {
  const url = `${BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

export async function apiRequest<T>(path: string, init: RequestInitJson = {}): Promise<T> {
  const token = await ensureToken();
  const { body, headers, query, ...rest } = init;
  const url = buildUrl(path, query);
  const finalHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(headers ?? {}),
  };
  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401) {
    writeToken(null);
    throw new ApiError("unauthorized", 401, null);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const parsed = text ? safeJson(text) : null;
  if (!response.ok) {
    throw new ApiError(`${path} failed: ${response.status}`, response.status, parsed ?? text);
  }
  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
