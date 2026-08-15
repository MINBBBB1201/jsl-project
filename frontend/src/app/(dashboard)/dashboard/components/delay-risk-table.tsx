"use client"

import { AlertTriangle, RotateCcw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TRANSPORT_MODE_LABELS,
  useRiskShipments,
  type RiskLevel,
  type RiskShipment,
} from "../use-delay-summary"

const LEVEL_VARIANT: Record<RiskLevel, "destructive" | "secondary" | "outline"> = {
  지연: "destructive",
  지연위험: "secondary",
  정상: "outline",
}

const formatDate = (value: string | null) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })
}

const formatRatio = (score: number | null) =>
  score === null ? "—" : `${Math.round(score * 100)}%`

function Row({ shipment }: { shipment: RiskShipment }) {
  const { delayRisk: risk } = shipment
  const level = risk.level ?? "정상"

  return (
    <TableRow>
      <TableCell className="font-medium whitespace-nowrap">
        {shipment.trackingNumber}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {TRANSPORT_MODE_LABELS[shipment.transportMode] ?? shipment.transportMode}
      </TableCell>
      <TableCell className="text-muted-foreground max-w-56 truncate">
        {shipment.destination?.address ?? "—"}
      </TableCell>
      <TableCell className="whitespace-nowrap tabular-nums">
        {formatDate(shipment.shippedAt)}
      </TableCell>
      <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
        {risk.elapsedDays ?? "—"} / {risk.standardDays ?? "—"}일
      </TableCell>
      <TableCell className="text-right tabular-nums font-medium">
        {formatRatio(risk.score)}
      </TableCell>
      <TableCell className="text-right">
        <Badge variant={LEVEL_VARIANT[level]}>{level}</Badge>
      </TableCell>
    </TableRow>
  )
}

/**
 * 지연위험 / 지연 화물 목록 위젯.
 * 경과율(경과일 ÷ 운송모드 표준 소요일)이 높은 순으로 보여준다.
 */
export function DelayRiskTable() {
  const { data, isLoading, error, reload } = useRiskShipments(8)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-muted-foreground" />
          지연 리스크 화물
        </CardTitle>
        <CardDescription>
          경과율이 높은 순 · 경과일 ÷ 운송모드 표준 소요일 기준 (규칙기반 v1)
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            onClick={reload}
            disabled={isLoading}
            className="cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span className="max-sm:sr-only">새로고침</span>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="py-8 text-center text-sm text-destructive">{error}</div>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            지연 위험 화물이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>운송장</TableHead>
                  <TableHead>운송모드</TableHead>
                  <TableHead>도착지</TableHead>
                  <TableHead>집하일</TableHead>
                  <TableHead>경과 / 표준</TableHead>
                  <TableHead className="text-right">경과율</TableHead>
                  <TableHead className="text-right">등급</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((shipment) => (
                  <Row key={shipment._id} shipment={shipment} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
