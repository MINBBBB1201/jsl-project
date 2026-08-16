"use client"

import Image from "next/image"
import { RotateCcw } from "lucide-react"

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
import { cn } from "@/lib/utils"
import { SEVERITY_STYLE } from "./inspection-result"
import type { Inspection } from "../use-damage-inspection"

const formatTime = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function HistoryItem({ item }: { item: Inspection }) {
  const style = SEVERITY_STYLE[item.result.severity]

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="relative aspect-video bg-muted">
        {item.imageBase64 ? (
          <Image
            src={`data:image/jpeg;base64,${item.imageBase64}`}
            alt={`판정 결과: ${item.result.severity}`}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            이미지 없음
          </div>
        )}
        <Badge className={cn("absolute right-2 top-2 border-0", style.badge)}>
          {item.result.severity}
        </Badge>
      </div>

      <div className="space-y-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            {item.result.isDamaged ? item.result.damageType : "손상 미발견"}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {Math.round(item.result.confidence * 100)}%
          </span>
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {item.result.description}
        </p>
        <p className="text-xs text-muted-foreground">{formatTime(item.createdAt)}</p>
      </div>
    </div>
  )
}

interface InspectionHistoryProps {
  items: Inspection[] | null
  isLoading: boolean
  error: string | null
  onReload: () => void
}

export function InspectionHistory({
  items,
  isLoading,
  error,
  onReload,
}: InspectionHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 판정 이력</CardTitle>
        <CardDescription>
          AI 1차 스크리닝 기록입니다. 담당자 확인 결과와 다를 수 있습니다.
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReload}
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
          <p className="py-8 text-center text-sm text-destructive">{error}</p>
        ) : isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        ) : !items || items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            아직 판정 기록이 없습니다.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <HistoryItem key={item._id ?? item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
