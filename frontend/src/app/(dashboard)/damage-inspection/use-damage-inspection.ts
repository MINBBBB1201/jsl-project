"use client"

import { useCallback, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"

export type DamageType = "찌그러짐" | "파손" | "젖음" | "포장손상" | "해당없음"
export type Severity = "정상" | "경미" | "심각"

export interface InspectionResult {
  isDamaged: boolean
  damageType: DamageType
  severity: Severity
  description: string
  confidence: number
}

export interface ImageMeta {
  width: number
  height: number
  bytes: number
  originalWidth: number
  originalHeight: number
  originalBytes: number
}

export interface InspectionMeta {
  model: string
  method: string
  attempts: number
  finishReason: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface Inspection {
  _id?: string
  id?: string
  result: InspectionResult
  imageMeta: ImageMeta
  inspectionMeta?: InspectionMeta
  imageBase64?: string
  createdAt: string
  queuedAhead?: number
}

/** 업로드 전 클라이언트 검증 — 서버에서도 다시 검사한다 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const ACCEPTED_TYPES = ["image/jpeg", "image/png"]

export const validateFile = (file: File): string | null => {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "jpg 또는 png 이미지만 업로드할 수 있습니다."
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `이미지는 ${MAX_UPLOAD_BYTES / 1024 / 1024}MB 이하여야 합니다.`
  }
  return null
}

export function useDamageInspection() {
  const [result, setResult] = useState<Inspection | null>(null)
  const [isInspecting, setIsInspecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRateLimited, setIsRateLimited] = useState(false)

  const inspect = useCallback(async (file: File, shipmentId?: string) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setIsRateLimited(false)
      return null
    }

    setIsInspecting(true)
    setError(null)
    setIsRateLimited(false)
    setResult(null)

    try {
      const form = new FormData()
      form.append("image", file)
      if (shipmentId) form.append("shipmentId", shipmentId)

      const res = await fetch(`${API_BASE_URL}/api/damage-inspection`, {
        method: "POST",
        body: form,
      })
      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.success) {
        // 429 는 레이트리밋 — 사용자에게 재시도 안내를 명확히 보여준다
        if (res.status === 429) {
          setIsRateLimited(true)
          setError(
            json?.error ??
              "요청이 몰려 잠시 처리할 수 없습니다. 1분 후 다시 시도해 주세요."
          )
          return null
        }
        setError(json?.error ?? `판정에 실패했습니다. (HTTP ${res.status})`)
        return null
      }

      setResult(json.data)
      return json.data as Inspection
    } catch (err) {
      setError(
        err instanceof Error
          ? `서버에 연결할 수 없습니다. (${err.message})`
          : "서버에 연결할 수 없습니다."
      )
      return null
    } finally {
      setIsInspecting(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setIsRateLimited(false)
  }, [])

  return { result, isInspecting, error, isRateLimited, inspect, reset }
}

/** 최근 판정 이력 */
export function useInspectionHistory(limit = 8) {
  const [items, setItems] = useState<Inspection[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetcher = useCallback(async () => {
    const res = await fetch(
      `${API_BASE_URL}/api/damage-inspection?limit=${limit}&includeImage=true`
    )
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.success) {
      throw new Error(json?.error ?? `이력 조회에 실패했습니다. (HTTP ${res.status})`)
    }
    return json.data as Inspection[]
  }, [limit])

  const run = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const data = await fetcher()
        if (signal?.aborted) return
        setItems(data)
        setError(null)
      } catch (err) {
        if (signal?.aborted) return
        setError(err instanceof Error ? err.message : "이력 조회에 실패했습니다.")
      } finally {
        if (!signal?.aborted) setIsLoading(false)
      }
    },
    [fetcher]
  )

  useEffect(() => {
    const controller = new AbortController()
    // run 은 async 라 setState 가 await 이후에만 일어난다 (동기 setState 아님)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run(controller.signal)
    return () => controller.abort()
  }, [run])

  const reload = useCallback(() => {
    setIsLoading(true)
    run()
  }, [run])

  return { items, isLoading, error, reload }
}
