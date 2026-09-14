/**
 * `/api/trade-documents` 클라이언트.
 *
 * `lib/auth.ts` 의 `authHeaders`/`ApiError` 를 그대로 쓴다 — 대시보드의 다른
 * 인증 호출(예: use-async-resource.ts)과 같은 에러 처리·토큰 만료 감지를 갖는다.
 *
 * `lib/auth.ts` 의 `apiFetch` 를 쓰지 않고 이 파일만의 `request` 를 따로 둔 이유:
 * `apiFetch` 는 응답 봉투에서 `data` 만 꺼내 돌려주는데, 목록 응답의 `total` 과
 * 단건/발행 응답의 `versions`(개정 체인 요약)는 `data` 밖에 있다. 그래서
 * `use-async-resource.ts` 의 대시보드 훅들처럼 봉투 전체를 돌려받는 방식을 쓴다.
 */

import { API_BASE_URL } from "@/lib/api"
import { ApiError, authHeaders } from "@/lib/auth"
import type {
  ApiTradeDocumentType,
  TradeDocumentApiInput,
  TradeDocumentRecord,
  TradeDocumentStatus,
  TradeDocumentVersionSummary,
} from "./api-types"

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

export interface TradeDocumentListFilter {
  type?: ApiTradeDocumentType
  status?: TradeDocumentStatus
  shipmentId?: string
  /** 내가 만든 것만 */
  mine?: boolean
  /** 개정 체인당 최신 버전만이 아니라 전체 버전을 받는다 */
  allVersions?: boolean
}

export interface TradeDocumentListResult {
  total: number
  documents: TradeDocumentRecord[]
}

export async function listTradeDocuments(
  filter: TradeDocumentListFilter = {}
): Promise<TradeDocumentListResult> {
  const params = new URLSearchParams()
  if (filter.type) params.set("type", filter.type)
  if (filter.status) params.set("status", filter.status)
  if (filter.shipmentId) params.set("shipmentId", filter.shipmentId)
  if (filter.mine) params.set("mine", "1")
  if (filter.allVersions) params.set("allVersions", "1")

  const qs = params.toString()
  const json = await request<ApiEnvelope & { total: number; data: TradeDocumentRecord[] }>(
    `/api/trade-documents${qs ? `?${qs}` : ""}`
  )
  return { total: json.total, documents: json.data }
}

export interface TradeDocumentDetailResult {
  document: TradeDocumentRecord
  versions: TradeDocumentVersionSummary[]
}

export async function getTradeDocument(id: string): Promise<TradeDocumentDetailResult> {
  const json = await request<
    ApiEnvelope & { data: TradeDocumentRecord; versions: TradeDocumentVersionSummary[] }
  >(`/api/trade-documents/${encodeURIComponent(id)}`)
  return { document: json.data, versions: json.versions }
}

export async function createTradeDocument(params: {
  type: ApiTradeDocumentType
  shipmentId?: string | null
  input: TradeDocumentApiInput
}): Promise<TradeDocumentRecord> {
  const json = await request<ApiEnvelope & { data: TradeDocumentRecord }>(
    "/api/trade-documents",
    { method: "POST", body: JSON.stringify(params) }
  )
  return json.data
}

export async function updateTradeDocument(
  id: string,
  params: { input?: TradeDocumentApiInput; shipmentId?: string | null }
): Promise<TradeDocumentRecord> {
  const json = await request<ApiEnvelope & { data: TradeDocumentRecord }>(
    `/api/trade-documents/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(params) }
  )
  return json.data
}

/** draft → issued. 번호가 부여되고 이후 편집이 막힌다. */
export async function issueTradeDocument(id: string): Promise<TradeDocumentDetailResult> {
  const json = await request<
    ApiEnvelope & { data: TradeDocumentRecord; versions: TradeDocumentVersionSummary[] }
  >(`/api/trade-documents/${encodeURIComponent(id)}/issue`, { method: "POST" })
  return { document: json.data, versions: json.versions }
}

/** issued → 그 입력을 복사한 새 draft(다음 버전) */
export async function reviseTradeDocument(id: string): Promise<TradeDocumentRecord> {
  const json = await request<ApiEnvelope & { data: TradeDocumentRecord }>(
    `/api/trade-documents/${encodeURIComponent(id)}/revise`,
    { method: "POST" }
  )
  return json.data
}

/** draft 만 지울 수 있다 (백엔드가 상태·권한을 확인한다) */
export async function deleteTradeDocument(id: string): Promise<void> {
  await request<ApiEnvelope>(`/api/trade-documents/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}
