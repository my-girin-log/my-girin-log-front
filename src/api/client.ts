const TOKEN_KEY = "my-girin-log.token";
const DEMO_GITHUB_ID_KEY = "my-girin-log.demoGithubId";
const DEMO_NICKNAME_KEY = "my-girin-log.demoNickname";

const PROD_API_BASE_URL = "https://my-grin-log-back.onrender.com/api/v1";

/**
 * BASE_URL 결정 순서:
 *  1) VITE_API_BASE_URL 명시 override
 *  2) 프로덕션 빌드 → Render 백엔드 절대 URL (zero-config)
 *  3) 개발 → `/api/v1` (Vite proxy 경유)
 */
const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.PROD ? PROD_API_BASE_URL : "/api/v1");

/**
 * 브라우저별 unique demo 유저 — 사용자 격리 보장.
 *  - 같은 브라우저(같은 localStorage)는 항상 같은 githubId → 새로고침해도 자기 데이터 유지.
 *  - 다른 브라우저/시크릿 창은 다른 githubId → 각자 자기 데이터.
 *  - 백엔드는 새 githubId 들어오면 신규 유저 생성 + 다이어리 7 + 회고 1 자동 시드.
 */
function getOrCreateDemoUser(): { githubId: string; nickname: string; avatarUrl: string } {
  try {
    let githubId = localStorage.getItem(DEMO_GITHUB_ID_KEY);
    let nickname = localStorage.getItem(DEMO_NICKNAME_KEY);
    if (!githubId) {
      const suffix =
        (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.().slice(0, 8) ??
        Math.random().toString(36).slice(2, 10);
      githubId = `demo-${suffix}`;
      nickname = `데모유저-${suffix}`;
      localStorage.setItem(DEMO_GITHUB_ID_KEY, githubId);
      localStorage.setItem(DEMO_NICKNAME_KEY, nickname);
    }
    return {
      githubId,
      nickname: nickname ?? githubId,
      avatarUrl: "https://avatars.githubusercontent.com/u/123456",
    };
  } catch {
    const fallback = `demo-anon-${Date.now()}`;
    return { githubId: fallback, nickname: fallback, avatarUrl: "" };
  }
}

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
  const demoUser = getOrCreateDemoUser();
  const response = await fetch(`${BASE_URL}/auth/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(demoUser),
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

const DEFAULT_TIMEOUT_MS = 60_000;

export async function apiRequest<T>(path: string, init: RequestInitJson = {}): Promise<T> {
  return apiRequestWithRetry<T>(path, init, true);
}

/**
 * 401 자동 복구:
 *  Render 가 sleep 풀리거나 재배포되면 in-memory TokenStore 가 초기화됨.
 *  → 브라우저 캐시의 토큰이 백엔드 입장에서 무효 → 401.
 *  → 토큰만 폐기하고 같은 demoGithubId 로 새 토큰 발급 + 1회 재시도.
 *  → 사용자는 무한 로딩 안 보고 자연 회복. 다음 날 다시 들어와도 동작.
 */
async function apiRequestWithRetry<T>(
  path: string,
  init: RequestInitJson,
  allowRetry: boolean,
): Promise<T> {
  const token = await ensureToken();
  const { body, headers, query, ...rest } = init;
  const url = buildUrl(path, query);
  const finalHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(headers ?? {}),
  };

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if ((error as { name?: string } | null)?.name === "AbortError") {
      throw new ApiError(`${path} timed out after ${DEFAULT_TIMEOUT_MS}ms`, 408, null);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (response.status === 401) {
    writeToken(null);
    if (allowRetry) {
      // 토큰 무효 → 새로 발급 + 1회 재시도. demoGithubId 는 보존되어 같은 유저로 재로그인.
      return apiRequestWithRetry<T>(path, init, false);
    }
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
