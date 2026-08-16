"use client"

import * as React from "react"
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Clock,
  Mail,
  PackageCheck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useNotifications, type NotificationType } from "@/hooks/use-notifications"

/** 알림 종류별 아이콘/색 — 목록에서 종류를 문구 없이 구분할 수 있게 */
const TYPE_STYLE: Record<
  NotificationType,
  { icon: LucideIcon; className: string; label: string }
> = {
  contact: {
    icon: Mail,
    className: "text-sky-600 dark:text-sky-400",
    label: "문의",
  },
  "delay-risk": {
    icon: AlertTriangle,
    className: "text-amber-600 dark:text-amber-400",
    label: "지연 위험",
  },
  delivered: {
    icon: PackageCheck,
    className: "text-emerald-600 dark:text-emerald-400",
    label: "배송완료",
  },
  "stale-shipment": {
    icon: Clock,
    className: "text-red-600 dark:text-red-400",
    label: "방치 화물",
  },
}

const relativeTime = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return formatDistanceToNow(date, { addSuffix: true, locale: ko })
}

export function NotificationBell() {
  const { items, unreadCount, isLoading, error, reload, markAsRead, markAllAsRead } =
    useNotifications()

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        // 열 때마다 최신 상태로 맞춘다 (폴링 주기를 기다리지 않도록)
        if (open) reload()
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative cursor-pointer"
          aria-label={
            unreadCount > 0 ? `알림 ${unreadCount}건 안읽음` : "알림"
          }
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white tabular-nums"
              aria-hidden
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-90 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-medium">
            알림
            {unreadCount > 0 && (
              <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                안읽음 {unreadCount}건
              </span>
            )}
          </p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 cursor-pointer text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck className="size-3.5" aria-hidden />
              모두 읽음
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {isLoading ? (
            <p className="text-muted-foreground p-6 text-center text-sm">
              불러오는 중...
            </p>
          ) : error ? (
            <p className="text-destructive p-6 text-center text-sm">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground p-6 text-center text-sm">
              새 알림이 없습니다.
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((notification) => {
                const style = TYPE_STYLE[notification.type]
                const Icon = style?.icon ?? Bell

                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => !notification.read && markAsRead(notification.id)}
                      className={cn(
                        "flex w-full gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent",
                        !notification.read && "bg-accent/40 cursor-pointer",
                        notification.read && "cursor-default"
                      )}
                    >
                      <Icon
                        className={cn("mt-0.5 size-4 shrink-0", style?.className)}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm break-words">
                          {notification.message}
                        </span>
                        <span className="text-muted-foreground mt-0.5 block text-xs">
                          {style?.label} · {relativeTime(notification.createdAt)}
                        </span>
                      </span>
                      {!notification.read && (
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                          aria-label="안읽음"
                        />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
