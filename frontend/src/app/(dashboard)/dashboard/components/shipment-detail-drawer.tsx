"use client"

import * as React from "react"
import { Mail, Phone, RotateCcw, User, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { modeLabel } from "@/lib/transport-modes"
import { RiskLevelBadge, ShipmentStatusBadge } from "./shipment-badges"
import {
  useShipmentDetail,
  type ShipmentDetail,
  type ShipmentHistoryEntry,
} from "../use-shipment-detail"

/**
 * 화물 상세 Drawer.
 *
 * 조회 전용이다. 상태 변경·위치 수정·체크포인트 추가는 requireShipmentWrite
 * (admin·operations)가 걸린 별도 작업이라 여기서 열지 않는다.
 *
 * checkpoints 는 다루지 않는다 — 실제 데이터에서 항상 빈 배열이다.
 */

/** 날짜 + 시각. 이력은 같은 날 여러 건이 쌓이므로 분 단위까지 보여준다. */
const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-start gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
      {children}
    </h3>
  )
}

/**
 * 고객 정보 — Drawer 전용 섹션.
 *
 * ⚠️ 이 컴포넌트를 이 파일 밖으로 내보내지 않는다. 목록 응답에는 customer 가
 *    아예 없고(개인정보 최소제공), 고객 연락처가 노출되어도 되는 자리는
 *    "담당자가 그 한 건을 처리하려고 연 상세 화면" 뿐이다. 재사용 가능한
 *    형태로 만들어 두면 목록이나 카드에 섞여 들어가기 쉬워진다.
 */
function CustomerSection({ customer }: { customer: ShipmentDetail["customer"] }) {
  if (!customer) {
    return (
      <p className="text-muted-foreground text-sm">고객 정보가 없습니다.</p>
    )
  }

  return (
    <dl className="space-y-2">
      <Field label="이름">
        <span className="inline-flex items-center gap-1.5">
          <User className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
          {customer.name}
        </span>
      </Field>
      <Field label="이메일">
        <a
          href={`mailto:${customer.email}`}
          className="inline-flex items-center gap-1.5 hover:underline"
        >
          <Mail className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
          {customer.email}
        </a>
      </Field>
      <Field label="전화번호">
        {customer.phone ? (
          <a
            href={`tel:${customer.phone}`}
            className="inline-flex items-center gap-1.5 hover:underline"
          >
            <Phone className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
            {customer.phone}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </Field>
    </dl>
  )
}

/**
 * 상태 이력 타임라인.
 *
 * 서버가 이력을 시간순으로 보장하지 않으므로(배열에 push 되는 순서일 뿐이다)
 * 화면에서 timestamp 로 정렬한다. 최신이 위로 오게 해서 "지금 무슨 일이
 * 있었는지" 를 먼저 읽게 한다.
 */
function HistoryTimeline({ history }: { history: ShipmentHistoryEntry[] }) {
  const sorted = React.useMemo(
    () =>
      [...history].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [history]
  )

  if (sorted.length === 0) {
    return <p className="text-muted-foreground text-sm">기록된 이력이 없습니다.</p>
  }

  return (
    <ol className="space-y-0">
      {sorted.map((entry, index) => {
        const isLast = index === sorted.length - 1
        return (
          <li key={entry._id ?? `${entry.timestamp}-${index}`} className="flex gap-3">
            {/* 점과 세로선. 마지막 항목은 선을 그리지 않아야 아래로 흘러내리지 않는다 */}
            <div className="flex flex-col items-center">
              <span
                className={
                  index === 0
                    ? "bg-primary mt-1.5 size-2 shrink-0 rounded-full"
                    : "bg-muted-foreground/40 mt-1.5 size-2 shrink-0 rounded-full"
                }
                aria-hidden
              />
              {!isLast && <span className="bg-border w-px flex-1" aria-hidden />}
            </div>

            <div className={isLast ? "min-w-0 flex-1" : "min-w-0 flex-1 pb-4"}>
              <div className="flex flex-wrap items-center gap-2">
                <ShipmentStatusBadge status={entry.status} />
                <time
                  dateTime={entry.timestamp}
                  className="text-muted-foreground text-xs tabular-nums"
                >
                  {formatDateTime(entry.timestamp)}
                </time>
              </div>
              {entry.description && (
                <p className="mt-1 text-sm break-words">{entry.description}</p>
              )}
              {entry.location?.address && (
                <p className="text-muted-foreground mt-0.5 text-xs break-words">
                  {entry.location.address}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/**
 * 실제 내용. Drawer 가 열렸을 때만 마운트되므로 여기서 조회가 시작된다
 * (닫혀 있을 때 요청이 나가지 않는다).
 */
function DetailBody({ trackingNumber }: { trackingNumber: string }) {
  const { data, isLoading, error, reload } = useShipmentDetail(trackingNumber)

  if (error) {
    return (
      <div className="space-y-3 py-8 text-center">
        <p className="text-destructive text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={reload} className="cursor-pointer">
          <RotateCcw className="size-3.5" />
          재시도
        </Button>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionTitle>기본 정보</SectionTitle>
        <dl className="space-y-2">
          <Field label="상태">
            <div className="flex flex-wrap items-center gap-2">
              <ShipmentStatusBadge status={data.status} />
              <RiskLevelBadge level={data.delayRisk?.level ?? null} />
            </div>
          </Field>
          <Field label="운송모드">{modeLabel(data.transportMode)}</Field>
          <Field label="구간">
            {data.origin?.address ?? "—"}
            <span className="text-muted-foreground mx-1.5">→</span>
            {data.destination?.address ?? "—"}
          </Field>
          <Field label="현재 위치">{data.currentLocation?.address ?? "—"}</Field>
          <Field label="집하일">
            <span className="tabular-nums">{formatDate(data.shippedAt)}</span>
          </Field>
          <Field label="도착예정">
            <span className="tabular-nums">{formatDate(data.estimatedDelivery)}</span>
          </Field>
        </dl>
      </section>

      <Separator />

      <section className="space-y-3">
        <SectionTitle>고객 정보</SectionTitle>
        <CustomerSection customer={data.customer} />
      </section>

      <Separator />

      <section className="space-y-3">
        <SectionTitle>상태 이력</SectionTitle>
        <HistoryTimeline history={data.history ?? []} />
      </section>
    </div>
  )
}

export function ShipmentDetailDrawer({
  trackingNumber,
  onClose,
}: {
  trackingNumber: string | null
  onClose: () => void
}) {
  /**
   * 닫히는 애니메이션이 도는 동안에도 내용을 남겨 둔다. trackingNumber 가
   * null 이 되는 순간 본문을 지우면 패널이 빈 채로 미끄러져 나간다.
   * (렌더 중 상태 조정 — chart-area-interactive.tsx 와 같은 패턴)
   */
  const [shown, setShown] = React.useState<string | null>(trackingNumber)
  if (trackingNumber !== null && trackingNumber !== shown) setShown(trackingNumber)

  return (
    <Drawer
      open={trackingNumber !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      direction="right"
    >
      <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-lg">
        <DrawerHeader className="flex-row items-start justify-between gap-2 border-b">
          <div className="min-w-0">
            <DrawerTitle className="font-mono text-base break-all">
              {shown ?? ""}
            </DrawerTitle>
            <DrawerDescription>화물 상세 · 조회 전용</DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <X className="size-4" />
              <span className="sr-only">닫기</span>
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pt-4 pb-8">
          {shown && <DetailBody trackingNumber={shown} />}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
