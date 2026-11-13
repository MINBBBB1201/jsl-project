"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { API_BASE_URL } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/api-error"

/**
 * 공개 공지사항 카드 리스트용 데이터.
 *
 * GET /api/notices 는 로그인이 필요 없고 published 만 내려준다(draft 는
 * 서버가 아예 제외한다). 정렬(고정 우선 → 최신순)도 서버가 이미 하므로
 * 여기서는 받은 순서 그대로 쓴다 — backend/src/controllers/notice.controller.js
 * 의 PUBLIC_SORT 참고.
 */
export interface PublicNotice {
  id: string
  title: string
  body: string
  category: "general" | "update" | "maintenance" | "event"
  isPinned: boolean
  publishedAt: string | null
}

export function usePublicNotices() {
  const [notices, setNotices] = useState<PublicNotice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const t = useTranslations("notices")
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notices?limit=100`)
      const json = await res.json().catch(() => null)
      if (signal?.aborted) return

      if (!res.ok || !json?.success) {
        setError(getApiErrorMessage(json, t("errorLoad")))
        setIsLoading(false)
        return
      }

      setNotices(json.data as PublicNotice[])
      setIsLoading(false)
    } catch (err) {
      if (signal?.aborted) return
      // 브라우저 예외 문구(Failed to fetch 등) 대신 번역된 안내를 보여 준다.
      console.error(err)
      setError(t("errorLoad"))
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    const controller = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  return { notices, isLoading, error }
}
