import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { RiskLevel } from "@/lib/transport-modes"
import type { ShipmentStatus } from "../use-shipment-list"

/**
 * 화물 상태·리스크 등급 배지.
 *
 * 목록(shipment-table.tsx)과 상세 Drawer 가 같은 화물을 서로 다른 색으로 그리면
 * 같은 상태인지 알아보기 어려우므로 한 군데서 정의한다.
 */

/** 화면에 그대로 나가는 상태 라벨. 백엔드 enum 6종을 모두 덮는다. */
export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "접수",
  in_transit: "운송중",
  out_for_delivery: "배송출발",
  delivered: "배송완료",
  exception: "예외",
  delayed: "지연",
}

/**
 * 상태별 배지 색.
 *
 * Badge 의 variant 는 4종뿐이라 6개 상태를 구분하지 못한다. 그래서 리스크 등급이
 * 쓰는 방식(lib/transport-modes.ts 의 RISK_LEVEL_STYLE)과 같이 색 클래스를 직접 준다.
 * 라이트/다크 양쪽 값을 함께 적어야 다크에서 글자가 배경에 묻히지 않는다.
 */
const STATUS_STYLE: Record<ShipmentStatus, string> = {
  pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_transit: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  out_for_delivery:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  delivered:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  exception: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  delayed: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
}

/** 등급 배지는 지연 리스크 화물 위젯과 같은 variant 를 쓴다 (delay-risk-table.tsx) */
const LEVEL_VARIANT: Record<RiskLevel, "destructive" | "secondary" | "outline"> = {
  지연: "destructive",
  지연위험: "secondary",
  정상: "outline",
}

export function ShipmentStatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const known = status as ShipmentStatus
  const style = STATUS_STYLE[known]

  return (
    <Badge
      variant="outline"
      className={cn(style && "border-transparent", style, className)}
    >
      {SHIPMENT_STATUS_LABELS[known] ?? status}
    </Badge>
  )
}

/**
 * 리스크 등급 배지.
 *
 * ⚠️ level 이 null 이면 "정상" 이 아니라 "—" 다. 배송 완료 건은 리스크 산정
 *    대상이 아니라 null 로 오는데(delay-risk.js SKIP_REASONS.DELIVERED),
 *    정상으로 메우면 완료된 화물이 운송 중인 것처럼 읽힌다.
 */
export function RiskLevelBadge({ level }: { level: RiskLevel | null }) {
  if (!level) return <span className="text-muted-foreground">—</span>
  return <Badge variant={LEVEL_VARIANT[level]}>{level}</Badge>
}
