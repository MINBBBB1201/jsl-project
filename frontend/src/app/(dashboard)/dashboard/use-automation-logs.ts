"use client"

import * as React from "react"

import { apiFetch } from "@/lib/auth"

export interface AutomationLogItem {
  id: string
  jobName: string
  ranAt: string
  status: "success" | "error"
  durationMs: number | null
  trigger: "schedule" | "manual"
  summary: Record<string, unknown>
  error: string | null
}

export interface AutomationSchedule {
  name: string
  expression: string
  timezone: string
}

interface AutomationLogsResponse {
  items: AutomationLogItem[]
  schedules: AutomationSchedule[]
}

/** 자동화 실행 이력 (대시보드 위젯용) */
export function useAutomationLogs(limit = 6) {
  const [data, setData] = React.useState<AutomationLogsResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    try {
      const result = await apiFetch<AutomationLogsResponse>(
        `/api/automation/logs?limit=${limit}`
      )
      setData(result)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "실행 이력을 불러오지 못했습니다."
      )
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  React.useEffect(() => {
    // load 는 async 라 setState 가 await 이후에만 일어난다. 린트가 함수 경계를
    // 넘어 추적하면서 나는 오탐이다 (use-delay-summary.ts 에도 같은 주석이 있다).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return { data, isLoading, error, reload: load }
}
