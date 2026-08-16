"use client"

import * as React from "react"

import { apiFetch } from "@/lib/auth"

export type NotificationType =
  | "contact"
  | "delay-risk"
  | "delivered"
  | "stale-shipment"

export interface AppNotification {
  id: string
  type: NotificationType
  message: string
  trackingNumber: string | null
  read: boolean
  createdAt: string
}

interface NotificationsResponse {
  items: AppNotification[]
  unreadCount: number
}

/**
 * 알림을 주기적으로 가져온다.
 *
 * WebSocket 이 아니라 폴링을 쓴다. 알림 종류가 "몇 분 안에만 알면 되는" 것들
 * (문의 접수, 지연 위험, 배송 완료)이고, 지연 감지 자체가 6시간 주기 작업이라
 * 실시간 연결을 유지할 이유가 없다. 연결 관리 비용 없이 같은 효과를 낸다.
 */
const POLL_INTERVAL_MS = 60_000

export function useNotifications(limit = 15) {
  const [items, setItems] = React.useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    try {
      const data = await apiFetch<NotificationsResponse>(
        `/api/notifications?limit=${limit}`
      )
      setItems(data.items)
      setUnreadCount(data.unreadCount)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "알림을 불러오지 못했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  React.useEffect(() => {
    let active = true

    const tick = async () => {
      if (!active) return
      await load()
    }

    tick()
    const timer = setInterval(tick, POLL_INTERVAL_MS)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [load])

  const markAsRead = React.useCallback(async (id: string) => {
    // 응답을 기다리지 않고 화면을 먼저 바꾼다 — 클릭 반응이 즉시 보이도록.
    // 실패하면 다음 폴링에서 서버 값으로 되돌아온다.
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(prev - 1, 0))

    try {
      const data = await apiFetch<{ unreadCount: number }>(
        `/api/notifications/${id}/read`,
        { method: "PATCH" }
      )
      setUnreadCount(data.unreadCount)
    } catch {
      load()
    }
  }, [load])

  const markAllAsRead = React.useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)

    try {
      await apiFetch("/api/notifications/read-all", { method: "PATCH" })
    } catch {
      load()
    }
  }, [load])

  return { items, unreadCount, isLoading, error, reload: load, markAsRead, markAllAsRead }
}
