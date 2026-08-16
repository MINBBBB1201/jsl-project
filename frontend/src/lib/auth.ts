import { API_BASE_URL } from "@/lib/api"

/**
 * 로그인 상태 관리 (클라이언트 측)
 *
 * 토큰 보관 위치로 쿠키를 쓴다. localStorage 를 쓰면 Next 미들웨어가 값을 볼 수
 * 없어 `/dashboard` 접근을 서버에서 막지 못하고, 항상 화면이 한 번 그려진 뒤
 * 자바스크립트로 튕겨내야 한다.
 *
 * ⚠️ 이 쿠키는 httpOnly 가 아니다(같은 토큰을 API 호출의 Authorization 헤더에도
 *    써야 하므로 자바스크립트가 읽을 수 있어야 한다). 즉 미들웨어의 검사는
 *    "로그인 화면으로 안내"하는 용도이고, 실제 접근 통제는 백엔드가 토큰을
 *    검증해 403 을 내리는 쪽이다. 프론트에서 쿠키를 위조해도 데이터는 못 본다.
 */

export const AUTH_COOKIE = "jsl_token"

export type Role = "admin" | "operations" | "sales"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
}

/** 역할 표시명 — 화면에 그대로 노출한다 */
export const ROLE_LABELS: Record<Role, string> = {
  admin: "관리자",
  operations: "운영",
  sales: "영업",
}

/** 백엔드 토큰 만료(기본 12h)와 맞춘다. 쿠키가 더 오래 남으면 이미 만료된 토큰으로 화면만 열린다. */
const COOKIE_MAX_AGE_SECONDS = 12 * 60 * 60

export function getToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${AUTH_COOKIE}=([^;]*)`)
  )
  return match ? decodeURIComponent(match[1]) : null
}

export function setToken(token: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`
}

export function clearToken() {
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}

/**
 * 토큰이 있으면 Authorization 헤더를 붙여 준다.
 * apiFetch 를 쓰기 어려운 곳(응답 형태가 다르거나 FormData 를 보내는 곳)에서 쓴다.
 */
export function authHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init)
  const token = getToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)
  return headers
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

/** 인증이 끊겼음을 뜻하는 백엔드 code 값 (auth.middleware.js 와 맞춤) */
const AUTH_FAILURE_CODES = [
  "AUTH_REQUIRED",
  "TOKEN_EXPIRED",
  "TOKEN_INVALID",
  "ACCOUNT_DISABLED",
]

/**
 * 백엔드 호출 공통 래퍼.
 *
 * 토큰이 있으면 Authorization 헤더를 붙이고, 토큰이 죽었다는 응답을 받으면
 * 쿠키를 지운다. (그래야 다음 라우팅에서 로그인 화면으로 안내된다.)
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers)

  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  const json = await res.json().catch(() => null)

  if (!res.ok || json?.success === false) {
    const code = json?.code as string | undefined
    if (code && AUTH_FAILURE_CODES.includes(code)) clearToken()

    throw new ApiError(
      json?.error ?? json?.errors?.[0]?.msg ?? `요청에 실패했습니다. (HTTP ${res.status})`,
      res.status,
      code
    )
  }

  return json?.data as T
}

interface LoginResponse {
  token: string
  expiresIn: string
  user: AuthUser
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  setToken(data.token)
  return data.user
}

export async function fetchMe(): Promise<AuthUser> {
  const data = await apiFetch<{ user: AuthUser }>("/api/auth/me")
  return data.user
}

export async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" })
  } catch {
    // JWT 는 서버에 상태가 없어 호출이 실패해도 토큰만 버리면 로그아웃은 성립한다
  } finally {
    clearToken()
  }
}
