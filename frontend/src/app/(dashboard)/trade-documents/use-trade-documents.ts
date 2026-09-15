"use client"

import { useCallback, useEffect, useState } from "react"

import {
  getTradeDocument,
  listTradeDocuments,
  type TradeDocumentDetailResult,
  type TradeDocumentListFilter,
  type TradeDocumentListResult,
} from "@/lib/trade-documents"

/**
 * 목록/단건 조회 훅.
 *
 * `dashboard/use-async-resource.ts` 와 같은 loading/error/reload 뼈대를 이
 * 라우트 안에서 따로 둔다 — `lib/trade-documents/api.ts` 가 이미 인증·에러
 * 처리를 다 하고 있어서(대시보드 훅의 `request` 와 같은 역할), 여기서는 그
 * 결과를 React 상태로 감싸기만 하면 된다. (damage-inspection 의
 * use-damage-inspection.ts 와 같은 라우트-로컬 훅 관례)
 */

interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

export function useTradeDocumentList(filter: TradeDocumentListFilter) {
  const [state, setState] = useState<AsyncState<TradeDocumentListResult>>({
    data: null,
    isLoading: true,
    error: null,
  })

  const filterKey = JSON.stringify(filter)

  const run = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const result = await listTradeDocuments(filter)
        if (signal?.aborted) return
        setState({ data: result, isLoading: false, error: null })
      } catch (error) {
        if (signal?.aborted) return
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "무역서류 목록을 불러오지 못했습니다.",
        })
      }
    },
    // filter 는 매 렌더 새 객체라 JSON 문자열로 동등성을 비교한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey]
  )

  useEffect(() => {
    const controller = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run(controller.signal)
    return () => controller.abort()
  }, [run])

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    run()
  }, [run])

  return { ...state, reload }
}

/** @param id null 이면 조회하지 않는다 */
export function useTradeDocument(id: string | null) {
  const [state, setState] = useState<AsyncState<TradeDocumentDetailResult>>({
    data: null,
    isLoading: true,
    error: null,
  })

  const run = useCallback(
    async (signal?: AbortSignal) => {
      if (!id) return
      try {
        const result = await getTradeDocument(id)
        if (signal?.aborted) return
        setState({ data: result, isLoading: false, error: null })
      } catch (error) {
        if (signal?.aborted) return
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "무역서류를 불러오지 못했습니다.",
        })
      }
    },
    [id]
  )

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run(controller.signal)
    return () => controller.abort()
  }, [id, run])

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    run()
  }, [run])

  return { ...state, reload }
}
