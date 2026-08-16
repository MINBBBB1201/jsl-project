"use client"

import * as React from "react"
import { AlertCircle, Bot, CircleCheck, CircleX, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  useAutomationLogs,
  type AutomationLogItem,
} from "../use-automation-logs"

/**
 * 자동화 실행 이력 위젯.
 *
 * 자동화는 눈에 보이지 않는 곳에서 도는 코드라, 조용히 멈춰도 아무도 모른다.
 * 마지막 실행 시각과 결과를 대시보드에 띄워서 "지금 살아 있는지"를 바로
 * 확인할 수 있게 한다.
 */

const JOB_LABELS: Record<string, string> = {
  "daily-ops-digest": "일일 운영 다이제스트",
  "stale-shipment-check": "방치 화물 감지",
}

/** cron 식을 사람이 읽는 문장으로 (등록된 두 작업만 다룬다) */
const CRON_LABELS: Record<string, string> = {
  "0 9 * * *": "매일 09:00",
  "0 */6 * * *": "6시간마다",
}

const relativeTime = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return formatDistanceToNow(date, { addSuffix: true, locale: ko })
}

/** 작업별로 다른 요약 구조에서 화면에 보여줄 한 줄을 만든다 */
const summaryLine = (log: AutomationLogItem): string => {
  const s = log.summary as Record<string, never>

  if (log.jobName === "daily-ops-digest") {
    const shipments = (s.shipments ?? {}) as Record<string, number>
    return [
      `배송중 ${shipments.scanned ?? 0}건`,
      `지연 ${shipments.delayed ?? 0}`,
      `지연위험 ${shipments.atRisk ?? 0}`,
      `신규 문의 ${s.newContacts24h ?? 0}`,
    ].join(" · ")
  }

  if (log.jobName === "stale-shipment-check") {
    return `운송중 ${s.inTransitScanned ?? 0}건 중 방치 ${s.staleFound ?? 0}건`
  }

  return log.error ?? "—"
}

export function AutomationLogCard() {
  const { data, isLoading, error, reload } = useAutomationLogs()

  const items = data?.items ?? []
  const schedules = data?.schedules ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="size-4 text-muted-foreground" aria-hidden />
          운영 자동화
        </CardTitle>
        <CardDescription>
          웹 요청과 무관하게 스스로 실행되는 작업의 최근 기록입니다.
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            onClick={reload}
            className="cursor-pointer"
            aria-label="새로고침"
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 등록된 스케줄 */}
        {schedules.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {schedules.map((schedule) => (
              <Badge key={schedule.name} variant="outline" className="font-normal">
                {JOB_LABELS[schedule.name] ?? schedule.name} ·{" "}
                {CRON_LABELS[schedule.expression] ?? schedule.expression} (
                {schedule.timezone === "Asia/Seoul" ? "KST" : schedule.timezone})
              </Badge>
            ))}
          </div>
        )}

        {error ? (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            아직 실행 기록이 없습니다. 다음 예정 시각에 자동 실행되며,{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              npm run job:daily-digest
            </code>{" "}
            로 즉시 실행해 볼 수도 있습니다.
          </p>
        ) : (
          <ul className="divide-y">
            {items.map((log) => (
              <li key={log.id} className="flex items-start gap-3 py-2.5 first:pt-0">
                {log.status === "success" ? (
                  <CircleCheck
                    className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                ) : (
                  <CircleX
                    className="mt-0.5 size-4 shrink-0 text-destructive"
                    aria-hidden
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium">
                      {JOB_LABELS[log.jobName] ?? log.jobName}
                    </span>
                    {log.trigger === "manual" && (
                      <Badge variant="secondary" className="text-[10px]">
                        수동
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(log.ranAt)}
                      {log.durationMs !== null && ` · ${log.durationMs}ms`}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 text-xs",
                      log.status === "error"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    {summaryLine(log)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
