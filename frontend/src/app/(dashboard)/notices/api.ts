/**
 * `/api/notices` 클라이언트.
 *
 * trade-documents/api.ts 와 같은 이유로 `lib/auth.ts` 의 `apiFetch` 를 쓰지
 * 않고 이 파일만의 `request` 를 둔다 — `apiFetch` 는 응답 봉투에서 `data` 만
 * 꺼내는데, 목록 응답의 `total`/`page`/`limit` 은 `data` 밖에 있다.
 */

import { API_BASE_URL } from "@/lib/api"
import { ApiError, authHeaders } from "@/lib/auth"
import type { Notice, NoticeCategory } from "./types"

interface ApiEnvelope {
  success: boolean
  error?: string
  errors?: { msg?: string }[]
  code?: string
}

async function request<T extends ApiEnvelope>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = authHeaders(init.headers)
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  const json = (await res.json().catch(() => null)) as T | null

  if (!res.ok || json?.success === false) {
    throw new ApiError(
      json?.error ?? json?.errors?.[0]?.msg ?? `요청에 실패했습니다. (HTTP ${res.status})`,
      res.status,
      json?.code
    )
  }

  return json as T
}

export interface NoticeListResult {
  total: number
  page: number
  limit: number
  notices: Notice[]
}

/** @param all true 면 draft 포함 전체(/api/notices/all, 관리자 전용). false 면 published 만. */
export async function listNotices(all: boolean): Promise<NoticeListResult> {
  const json = await request<ApiEnvelope & { total: number; page: number; limit: number; data: Notice[] }>(
    all ? "/api/notices/all" : "/api/notices"
  )
  return { total: json.total, page: json.page, limit: json.limit, notices: json.data }
}

export interface NoticeInput {
  title: string
  body: string
  category?: NoticeCategory
  isPinned?: boolean
  isPublished?: boolean
}

export async function createNotice(input: NoticeInput): Promise<Notice> {
  const json = await request<ApiEnvelope & { data: Notice }>("/api/notices", {
    method: "POST",
    body: JSON.stringify(input),
  })
  return json.data
}

export async function updateNotice(id: string, patch: Partial<NoticeInput>): Promise<Notice> {
  const json = await request<ApiEnvelope & { data: Notice }>(
    `/api/notices/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(patch) }
  )
  return json.data
}

export async function deleteNotice(id: string): Promise<void> {
  await request<ApiEnvelope>(`/api/notices/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}
