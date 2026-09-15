import { Badge } from "@/components/ui/badge"
import type { ApiTradeDocumentType, TradeDocumentStatus } from "@/lib/trade-documents"

/** 화면에 그대로 나가는 종류 라벨. */
export const TYPE_LABELS: Record<ApiTradeDocumentType, string> = {
  commercial_invoice: "상업송장",
  packing_list: "포장명세서",
  proforma_invoice: "프로포마",
}

export const STATUS_LABELS: Record<TradeDocumentStatus, string> = {
  draft: "작성중",
  issued: "발행됨",
  superseded: "이전버전",
}

const STATUS_VARIANT: Record<TradeDocumentStatus, "outline" | "default" | "secondary"> = {
  draft: "outline",
  issued: "default",
  superseded: "secondary",
}

export function DocumentTypeBadge({ type }: { type: ApiTradeDocumentType }) {
  return <Badge variant="outline">{TYPE_LABELS[type] ?? type}</Badge>
}

export function DocumentStatusBadge({ status }: { status: TradeDocumentStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status] ?? status}</Badge>
}
