"use client"

import * as React from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Package,
  RotateCcw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  TRANSPORT_MODE_LABELS,
  modeLabel,
  type RiskLevel,
  type TransportMode,
} from "@/lib/transport-modes"
import {
  RiskLevelBadge,
  SHIPMENT_STATUS_LABELS,
  ShipmentStatusBadge,
} from "./shipment-badges"
import { ShipmentDetailDrawer } from "./shipment-detail-drawer"
import {
  SHIPMENT_STATUSES,
  useShipmentList,
  type ShipmentListItem,
  type ShipmentListParams,
  type ShipmentStatus,
  type SortableField,
} from "../use-shipment-list"

/**
 * 화물 목록.
 *
 * 이 자리에는 shadcn 어드민 데모의 연방계약 제안서 테이블이 그대로 들어 있었다
 * (Outline / Past Performance / Key Personnel / Focus Documents 탭, 가짜 인명이
 * 박힌 리뷰어 드롭다운, 행 드래그 순서변경). 물류와 대응되는 게 없어 들어내고
 * 실제 배송 목록으로 새로 만든다.
 *
 * 조회 전용이다. 상태 변경은 권한이 필요한 별도 작업이라(PATCH /:trackingNumber/status,
 * admin·operations 만) 목록에서 인라인으로 열지 않는다.
 */

const SORT_LABELS: Record<SortableField, string> = {
  shippedAt: "집하일",
  estimatedDelivery: "도착예정",
}

const PAGE_SIZES = [10, 20, 50]

/** 전체 선택을 뜻하는 값. Radix Select 는 빈 문자열을 value 로 못 쓴다. */
const ALL = "all"

/**
 * 목록은 최대 3개월치를 훑으므로 연도까지 적는다. 지연 리스크 위젯은 진행 중인
 * 화물만 8건 보여줘서 월·일로 충분하지만, 여기서는 작년 건과 섞이면 구분이 안 된다.
 */
const formatDate = (value: string | null | undefined) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  })
}

const INITIAL_PARAMS: ShipmentListParams = {
  status: "",
  transportMode: "",
  riskLevel: "",
  // 서버 기본값은 createdAt 이지만 그 컬럼은 화면에 없다. 정렬 표시가 어느
  // 헤더에도 안 붙고 되돌아갈 수도 없어서, 보이는 컬럼으로 기본값을 맞춘다.
  sortBy: "shippedAt",
  sortOrder: "desc",
  page: 1,
  limit: 20,
}

/** 헤더 클릭으로 정렬을 토글하는 버튼 */
function SortHeader({
  field,
  params,
  onSort,
  className,
}: {
  field: SortableField
  params: ShipmentListParams
  onSort: (field: SortableField) => void
  className?: string
}) {
  const active = params.sortBy === field
  // 정렬이 걸리지 않은 컬럼에 한쪽 방향 화살표를 흐리게 띄우면 "이미 내림차순"
  // 으로 읽힌다. 비활성일 때는 양방향 아이콘으로 "누르면 정렬된다" 만 알린다.
  const Icon = !active ? ArrowUpDown : params.sortOrder === "asc" ? ArrowUp : ArrowDown

  return (
    // 정렬 상태를 보조기술에도 알린다 — 아이콘만으로는 읽히지 않는다.
    // aria-sort 는 열 헤더(th)의 속성이라 버튼이 아니라 여기에 붙인다.
    <TableHead
      className={className}
      aria-sort={active ? (params.sortOrder === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="text-foreground -mx-1 flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 whitespace-nowrap hover:underline"
      >
        {SORT_LABELS[field]}
        <Icon
          className={cn("size-3.5", active ? "opacity-100" : "opacity-40")}
          aria-hidden
        />
      </button>
    </TableHead>
  )
}

function Row({
  shipment,
  onSelect,
}: {
  shipment: ShipmentListItem
  onSelect: (trackingNumber: string) => void
}) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        {/* 운송장번호를 누르면 상세 Drawer 가 열린다 */}
        <button
          type="button"
          onClick={() => onSelect(shipment.trackingNumber)}
          className="font-mono text-xs hover:underline focus-visible:ring-ring cursor-pointer rounded focus-visible:ring-2 focus-visible:outline-none"
        >
          {shipment.trackingNumber}
        </button>
      </TableCell>
      <TableCell>
        <ShipmentStatusBadge status={shipment.status} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {modeLabel(shipment.transportMode)}
      </TableCell>
      <TableCell className="text-muted-foreground max-w-56 truncate">
        {shipment.destination?.address ?? "—"}
      </TableCell>
      <TableCell className="tabular-nums whitespace-nowrap">
        {formatDate(shipment.shippedAt)}
      </TableCell>
      <TableCell className="tabular-nums whitespace-nowrap">
        {formatDate(shipment.estimatedDelivery)}
      </TableCell>
      <TableCell className="text-right">
        <RiskLevelBadge level={shipment.delayRisk?.level ?? null} />
      </TableCell>
    </TableRow>
  )
}

export function ShipmentTable() {
  const [params, setParams] = React.useState<ShipmentListParams>(INITIAL_PARAMS)
  /** 상세 Drawer 로 열어 둔 운송장번호. null 이면 닫힌 상태이고 조회도 하지 않는다. */
  const [selected, setSelected] = React.useState<string | null>(null)
  const { data, isLoading, error, reload } = useShipmentList(params)

  const pagination = data?.pagination
  const rows = data?.data ?? []

  /** 필터·정렬·페이지 크기가 바뀌면 1페이지로 되돌린다 (3페이지에서 필터를 걸면 빈 화면이 된다) */
  const update = (patch: Partial<ShipmentListParams>) =>
    setParams((prev) => ({ ...prev, ...patch, page: 1 }))

  const onSort = (field: SortableField) =>
    update(
      params.sortBy === field
        ? { sortOrder: params.sortOrder === "asc" ? "desc" : "asc" }
        : { sortBy: field, sortOrder: "desc" }
    )

  /**
   * 상태를 "배송완료" 로 좁히면 등급 필터를 잠근다.
   *
   * 서버는 status 를 명시하면 그 값을 우선하고 등급 조건은 집하일 범위만 남긴다
   * (getAllShipments 주석). 그래서 "배송완료 + 지연" 은 179건이 나오는데 전부
   * 등급이 "—" 인, 앞뒤가 안 맞는 목록이 된다. 완료 건은 애초에 리스크 산정
   * 대상이 아니므로 조합 자체를 막는다.
   */
  const riskFilterDisabled = params.status === "delivered"

  const hasFilter = Boolean(params.status || params.transportMode || params.riskLevel)

  const from = pagination && pagination.total > 0
    ? (pagination.page - 1) * pagination.limit + 1
    : 0
  const to = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
  const canPrev = !!pagination && pagination.page > 1
  const canNext = !!pagination && pagination.page < pagination.pages

  return (
    <>
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="text-muted-foreground size-4" />
          화물 목록
        </CardTitle>
        <CardDescription>
          {pagination
            ? `전체 ${pagination.total.toLocaleString("ko-KR")}건 · ${SORT_LABELS[params.sortBy]} ${params.sortOrder === "asc" ? "오름차순" : "내림차순"}`
            : "전체 화물 조회 · 필터와 정렬은 서버에서 처리합니다"}
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

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={params.status || ALL}
            onValueChange={(value) =>
              update({
                status: value === ALL ? "" : (value as ShipmentStatus),
                // 잠기는 필터는 값도 함께 비운다. 남겨 두면 잠긴 채로 조건이 살아 있다.
                ...(value === "delivered" ? { riskLevel: "" as const } : {}),
              })
            }
          >
            <SelectTrigger size="sm" className="w-36" aria-label="상태 필터">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>상태 전체</SelectItem>
              {SHIPMENT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {SHIPMENT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={params.transportMode || ALL}
            onValueChange={(value) =>
              update({ transportMode: value === ALL ? "" : (value as TransportMode) })
            }
          >
            <SelectTrigger size="sm" className="w-40" aria-label="운송모드 필터">
              <SelectValue placeholder="운송모드" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>운송모드 전체</SelectItem>
              {(Object.keys(TRANSPORT_MODE_LABELS) as TransportMode[]).map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {TRANSPORT_MODE_LABELS[mode]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={params.riskLevel || ALL}
            disabled={riskFilterDisabled}
            onValueChange={(value) =>
              update({ riskLevel: value === ALL ? "" : (value as RiskLevel) })
            }
          >
            <SelectTrigger size="sm" className="w-36" aria-label="리스크 등급 필터">
              <SelectValue placeholder="리스크 등급" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>등급 전체</SelectItem>
              <SelectItem value="정상">정상</SelectItem>
              <SelectItem value="지연위험">지연위험</SelectItem>
              <SelectItem value="지연">지연</SelectItem>
            </SelectContent>
          </Select>

          {riskFilterDisabled && (
            <span className="text-muted-foreground text-xs">
              배송완료 건은 지연 리스크 산정 대상이 아닙니다
            </span>
          )}

          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => update({ status: "", transportMode: "", riskLevel: "" })}
              className="cursor-pointer"
            >
              필터 초기화
            </Button>
          )}
        </div>

        {error ? (
          <div className="text-destructive py-8 text-center text-sm">{error}</div>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            표시할 화물이 없습니다.
            {hasFilter && <> 필터 조건을 바꿔 보세요.</>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>운송장</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>운송모드</TableHead>
                  <TableHead>도착지</TableHead>
                  <SortHeader field="shippedAt" params={params} onSort={onSort} />
                  <SortHeader field="estimatedDelivery" params={params} onSort={onSort} />
                  <TableHead className="text-right">등급</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((shipment) => (
                  <Row
                    key={shipment._id}
                    shipment={shipment}
                    onSelect={setSelected}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {!error && pagination && (
        <CardFooter className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="text-muted-foreground tabular-nums">
            {pagination.total > 0
              ? `${pagination.total.toLocaleString("ko-KR")}건 중 ${from.toLocaleString("ko-KR")}–${to.toLocaleString("ko-KR")}`
              : "0건"}
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={String(params.limit)}
              onValueChange={(value) => update({ limit: Number(value) })}
            >
              <SelectTrigger size="sm" className="w-28" aria-label="페이지당 건수">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}건씩
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-muted-foreground tabular-nums whitespace-nowrap">
              {pagination.pages > 0 ? `${pagination.page} / ${pagination.pages}` : "0 / 0"}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={!canPrev || isLoading}
              // page 만 바꾼다 — update() 는 1페이지로 되돌리므로 여기서는 쓰지 않는다
              onClick={() => setParams((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              <ChevronLeft className="size-4" />
              <span className="max-sm:sr-only">이전</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={!canNext || isLoading}
              onClick={() => setParams((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              <span className="max-sm:sr-only">다음</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardFooter>
      )}
      </Card>

      <ShipmentDetailDrawer
        trackingNumber={selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
