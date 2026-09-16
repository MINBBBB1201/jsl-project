"use client"

import { useCallback, useEffect, useState } from "react"

import {
  createNotice as createNoticeApi,
  deleteNotice as deleteNoticeApi,
  listNotices,
  updateNotice as updateNoticeApi,
  type NoticeInput,
  type NoticeListResult,
} from "./api"
import type { Notice } from "./types"

/**
 * 공지사항 목록 + 생성/수정/삭제.
 *
 * trade-documents 의 use-trade-documents.ts 와 같은 loading/error/reload
 * 뼈대를 쓴다. 다만 여기는 행 안에서 발행/고정 토글을 낙관적으로 업데이트해야
 * 해서(체크박스를 누르는 순간 화면이 바로 바뀌어야 자연스럽다) 목록을 훅
 * 안의 상태로 들고 있다가 update() 가 그 자리에서 바로 고치고, 실패하면
 * 서버 상태로 다시 맞춘다(reload).
 */

interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

/** @param all true 면 draft 포함 전체(/api/notices/all, 관리자 전용). false 면 published 만. */
export function useNotices(all: boolean) {
  const [state, setState] = useState<AsyncState<NoticeListResult>>({
    data: null,
    isLoading: true,
    error: null,
  })

  const run = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const result = await listNotices(all)
        if (signal?.aborted) return
        setState({ data: result, isLoading: false, error: null })
      } catch (error) {
        if (signal?.aborted) return
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "공지사항 목록을 불러오지 못했습니다.",
        })
      }
    },
    [all]
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

  const create = useCallback(
    async (input: NoticeInput) => {
      const created = await createNoticeApi(input)
      await run()
      return created
    },
    [run]
  )

  /**
   * 낙관적 업데이트: PATCH 응답을 기다리지 않고 화면부터 고친다.
   * 실패하면 목록을 다시 불러와 서버 상태로 되돌리고 에러를 그대로 던진다 —
   * 호출한 쪽(행 컴포넌트)이 실패를 알아채 안내할 수 있도록.
   */
  const update = useCallback(
    async (id: string, patch: Partial<NoticeInput>) => {
      setState((prev) =>
        prev.data
          ? {
              ...prev,
              data: {
                ...prev.data,
                notices: prev.data.notices.map((n) =>
                  n.id === id ? ({ ...n, ...patch } as Notice) : n
                ),
              },
            }
          : prev
      )

      try {
        const updated = await updateNoticeApi(id, patch)
        setState((prev) =>
          prev.data
            ? {
                ...prev,
                data: {
                  ...prev.data,
                  notices: prev.data.notices.map((n) => (n.id === id ? updated : n)),
                },
              }
            : prev
        )
        return updated
      } catch (error) {
        await run()
        throw error
      }
    },
    [run]
  )

  const remove = useCallback(
    async (id: string) => {
      setState((prev) =>
        prev.data
          ? { ...prev, data: { ...prev.data, notices: prev.data.notices.filter((n) => n.id !== id) } }
          : prev
      )
      try {
        await deleteNoticeApi(id)
      } catch (error) {
        await run()
        throw error
      }
    },
    [run]
  )

  return { ...state, reload, create, update, remove }
}
