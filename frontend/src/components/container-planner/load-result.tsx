"use client"

import { useTranslations } from "next-intl"
import { CheckCircle2, PackageX, TriangleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { LoadPlan, UnplacedReason } from "@/lib/container-planner"

/**
 * 적재 결과 패널.
 *
 * ⚠️ 미배치 목록을 접거나 숨기지 말 것. 이 도구에서 가장 위험한 실패는
 *    "다 실린 줄 알았는데 안 실렸다"이다. 미배치가 하나라도 있으면 사유와 함께
 *    반드시 눈에 띄게 남는다.
 */

/** 사유별 번역 키. UnplacedReason 이 늘면 여기도 같이 늘려야 컴파일이 통과한다 */
const REASON_LABEL_KEY: Record<UnplacedReason, string> = {
  NO_SPACE: "reasonNO_SPACE",
  WEIGHT_LIMIT: "reasonWEIGHT_LIMIT",
  OVERSIZED: "reasonOVERSIZED",
}

const REASON_HINT_KEY: Record<UnplacedReason, string> = {
  NO_SPACE: "reasonHintNO_SPACE",
  WEIGHT_LIMIT: "reasonHintWEIGHT_LIMIT",
  OVERSIZED: "reasonHintOVERSIZED",
}

function Metric({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium tabular-nums">{children}</div>
    </div>
  )
}

export function LoadResult({ plan }: { plan: LoadPlan }) {
  const t = useTranslations("containerPlanner")

  const cog = plan.centerOfGravity
  const totalRequested =
    plan.placed.length + plan.unplaced.reduce((sum, u) => sum + u.quantity, 0)

  return (
    /*
      계산할 때마다 숫자가 통째로 바뀌는 영역이라 aria-live 를 건다.
      polite 로 둬서 읽던 것을 끊지 않고 다음 차례에 알린다.
    */
    <div className="space-y-5" aria-live="polite">
      {/* 적재율 */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {t("volumeUtilization")}
          </span>
          <span className="text-lg font-semibold tabular-nums">
            {plan.volumeUtilizationPercent}%
          </span>
        </div>
        <Progress value={Math.min(plan.volumeUtilizationPercent, 100)} />
        <p className="text-xs text-muted-foreground tabular-nums">
          {t("volumeDetail", {
            used: plan.usedVolumeM3,
            total: plan.containerVolumeM3,
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t pt-4">
        <Metric label={t("placedCount")}>
          {t("placedValue", { placed: plan.placed.length, total: totalRequested })}
        </Metric>

        <Metric label={t("totalWeight")}>
          <span className="flex flex-wrap items-center gap-1.5">
            <span>
              {t("weightValue", {
                total: plan.totalWeightKg,
                max: plan.maxPayloadKg,
              })}
            </span>
            {plan.overweight ? (
              <Badge variant="destructive">{t("overweightBadge")}</Badge>
            ) : null}
          </span>
          <p className="mt-1 text-xs font-normal text-muted-foreground">
            {t("weightRatio", { percent: plan.weightUtilizationPercent })}
          </p>
        </Metric>
      </div>

      {plan.overweight ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {t("overweightNote")}
        </p>
      ) : null}

      {/* 무게중심 */}
      <div className="border-t pt-4">
        <Metric label={t("centerOfGravity")}>
          <span className="flex flex-wrap items-center gap-1.5">
            <span>
              {t("cogValue", {
                length: cog.offsetPercent[0],
                width: cog.offsetPercent[1],
              })}
            </span>
            <Badge variant={cog.withinTolerance ? "secondary" : "destructive"}>
              {cog.withinTolerance ? t("cogOk") : t("cogWarn")}
            </Badge>
          </span>
          <p className="mt-1 text-xs font-normal text-muted-foreground">
            {t("cogTolerance", { tolerance: cog.tolerancePercent })}
          </p>
        </Metric>

        {cog.withinTolerance ? null : (
          <p className="mt-2 rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {t("cogWarnNote")}
          </p>
        )}
      </div>

      {/* 미배치 — 이 도구에서 가장 중요한 블록 */}
      <div className="border-t pt-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          {plan.unplaced.length > 0 ? (
            <PackageX className="size-3.5 text-destructive" aria-hidden />
          ) : (
            <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
          )}
          {t("unplacedTitle")}
        </p>

        {plan.unplaced.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("unplacedNone")}</p>
        ) : (
          <ul className="space-y-2">
            {plan.unplaced.map((item) => (
              <li
                key={`${item.boxId}:${item.reason}`}
                className="rounded-md border border-destructive/40 bg-destructive/5 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{item.box.name}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-medium tabular-nums">
                      {t("unplacedCount", { count: item.quantity })}
                    </span>
                    <Badge variant="destructive">
                      {t(REASON_LABEL_KEY[item.reason])}
                    </Badge>
                  </span>
                </div>
                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden />
                  {t(REASON_HINT_KEY[item.reason])}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
