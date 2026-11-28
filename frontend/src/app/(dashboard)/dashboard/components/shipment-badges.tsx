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
 * 상태별 배지 모양.
 *
 * 예전에는 상태마다 색이 달랐다(파랑·남색·초록·빨강·노랑). 목록의 대부분이
 * "운송중"이라 표 전체가 파란 알약 줄이 되고, 정작 봐야 할 예외·지연이 묻혔다.
 * 포털 테마(app/portal-theme.css)에 맞춰 정상 흐름은 테두리 없는 글자로 두고
 * (랜딩의 배지 처리와 같다), 조치가 필요한 상태만 주황 배지로 띄운다.
 * 상태는 색이 아니라 글자로 읽힌다.
 */
const PLAIN = "border-transparent px-0"

const STATUS_STYLE: Record<ShipmentStatus, string> = {
  pending: `${PLAIN} text-muted-foreground`,
  in_transit: `${PLAIN} text-foreground`,
  out_for_delivery: `${PLAIN} text-foreground`,
  delivered: `${PLAIN} text-muted-foreground`,
  exception: "border-transparent bg-brand-orange text-[#17100b]",
  delayed: "border-brand-orange-deep text-brand-orange-deep",
}

/**
 * 등급 배지. 지연만 주황으로 채우고, 지연위험은 주황 선, 정상은 회색 글자다.
 * 지연 리스크 화물 위젯(delay-risk-table.tsx)도 이 배지를 쓴다.
 */
const LEVEL_STYLE: Record<RiskLevel, string> = {
  지연: "border-transparent bg-brand-orange text-[#17100b]",
  지연위험: "border-brand-orange-deep text-brand-orange-deep",
  정상: `${PLAIN} text-muted-foreground`,
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
    <Badge variant="outline" className={cn("font-normal", style, className)}>
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
  return (
    <Badge variant="outline" className={cn("font-normal", LEVEL_STYLE[level])}>
      {level}
    </Badge>
  )
}
