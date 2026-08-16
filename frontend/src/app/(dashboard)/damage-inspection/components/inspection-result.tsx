"use client"

import { AlertTriangle, CheckCircle2, Clock, Info, ShieldAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { Inspection, Severity } from "../use-damage-inspection"

/** severity 별 표시 스타일 — 정상=초록, 경미=노랑, 심각=빨강 */
export const SEVERITY_STYLE: Record<
  Severity,
  { badge: string; card: string; icon: typeof CheckCircle2; label: string }
> = {
  정상: {
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    card: "border-emerald-300 dark:border-emerald-900",
    icon: CheckCircle2,
    label: "이상 없음",
  },
  경미: {
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
    card: "border-amber-300 dark:border-amber-900",
    icon: AlertTriangle,
    label: "경미한 손상",
  },
  심각: {
    badge: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    card: "border-red-400 dark:border-red-900",
    icon: ShieldAlert,
    label: "심각한 손상",
  },
}

export function InspectionResultCard({ inspection }: { inspection: Inspection }) {
  const { result, imageMeta, inspectionMeta } = inspection
  const style = SEVERITY_STYLE[result.severity]
  const Icon = style.icon
  const confidencePct = Math.round(result.confidence * 100)

  return (
    <Card className={cn("border-2", style.card)}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <Icon className="size-5" aria-hidden />
          <span>{result.isDamaged ? "손상 의심" : "손상 미발견"}</span>
          <Badge className={cn("border-0", style.badge)}>{style.label}</Badge>
          {result.isDamaged && (
            <Badge variant="outline">{result.damageType}</Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm leading-relaxed">{result.description}</p>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">모델 확신도</span>
            <span className="font-medium tabular-nums">{confidencePct}%</span>
          </div>
          <Progress value={confidencePct} />
          <p className="text-xs text-muted-foreground">
            확신도는 모델이 스스로 매긴 값이며 정확도를 보장하지 않습니다.
          </p>
        </div>

        {/* 사람이 최종 확인해야 한다는 점을 결과 바로 옆에 둔다 */}
        <div className="flex gap-2 rounded-md border bg-muted/50 p-3">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">
              이 결과는 AI의 1차 스크리닝입니다.
            </span>{" "}
            오탐(정상을 손상으로)과 미탐(손상을 정상으로)이 모두 발생할 수 있으므로,
            최종 파손 여부와 배상 판단은 반드시 담당자가 실물로 확인해 주세요.
          </p>
        </div>

        {inspectionMeta && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
            <div>
              <dt className="inline">모델 </dt>
              <dd className="inline font-mono">{inspectionMeta.model}</dd>
            </div>
            <div>
              <dt className="inline">토큰 </dt>
              <dd className="inline tabular-nums">{inspectionMeta.totalTokens}</dd>
            </div>
            <div>
              <dt className="inline">이미지 </dt>
              <dd className="inline tabular-nums">
                {imageMeta.width}×{imageMeta.height}
              </dd>
            </div>
            <div>
              <dt className="inline">압축 </dt>
              <dd className="inline tabular-nums">
                {(imageMeta.originalBytes / 1024).toFixed(0)}→
                {(imageMeta.bytes / 1024).toFixed(0)}KB
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  )
}

/** 429 등으로 대기해야 할 때 */
export function RateLimitNotice({ message }: { message: string }) {
  return (
    <Card className="border-2 border-amber-300 dark:border-amber-900">
      <CardContent className="flex gap-3 p-5">
        <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
        <div className="space-y-1">
          <p className="font-medium">잠시 후 다시 시도해 주세요</p>
          <p className="text-sm text-muted-foreground">{message}</p>
          <p className="text-xs text-muted-foreground">
            판정 API의 분당 처리량 한도(TPM 8,000) 때문에 연속 업로드 시 대기가
            필요합니다. 사진 1장당 약 3,000토큰을 사용합니다.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
