"use client"

import { useCallback, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"
import { authHeaders } from "@/lib/auth"

/**
 * 대시보드 조회 훅의 공통 뼈대.
 *
 * use-delay-summary.ts 에 있던 것을 그대로 옮겼다. 카드/차트 훅이 늘어나면서
 * 파일마다 같은 로딩·에러·재조회 처리를 다시 쓰게 되는데, 그러면 어떤 카드는
 * 재시도가 되고 어떤 카드는 안 되는 식으로 화면이 제각각이 된다.
 */

interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

// 대시보드 조회 API 는 로그인 필수라 토큰을 함께 보낸다
export const request = async <T,>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders() })
  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.success) {
    throw new Error(json?.error ?? `요청이 실패했습니다. (HTTP ${res.status})`)
  }
  return json as T
}

/**
 * 비동기 로딩 공통 훅.
 *
 * 초기 상태가 이미 isLoading: true 라, effect 안에서 동기적으로 setState 를
 * 부르지 않는다 (react-hooks/set-state-in-effect). 재조회할 때만 로딩 상태를
 * 다시 세운다.
 */
export function useAsyncResource<T>(
  fetcher: () => Promise<T>,
  fallbackMessage: string
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: true,
    error: null,
  })

  // fetcher 는 호출부에서 useCallback 으로 고정해야 매 렌더 재조회되지 않는다
  const run = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const result = await fetcher()
        if (signal?.aborted) return
        setState({ data: result, isLoading: false, error: null })
      } catch (error) {
        if (signal?.aborted) return
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : fallbackMessage,
        })
      }
    },
    [fetcher, fallbackMessage]
  )

  useEffect(() => {
    const controller = new AbortController()
    // run 은 async 라 첫 문장이 await 다. setState 는 fetch 가 끝난 뒤에만
    // 호출되므로 규칙이 경고하는 "동기 setState 로 인한 연쇄 렌더" 는 없다.
    // (린트가 함수 경계를 넘어 추적하면서 나는 오탐)
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
