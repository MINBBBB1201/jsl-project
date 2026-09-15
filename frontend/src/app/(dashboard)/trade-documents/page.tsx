"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  API_TRADE_DOCUMENT_TYPES,
  TRADE_DOCUMENT_STATUSES,
  type ApiTradeDocumentType,
  type TradeDocumentListFilter,
  type TradeDocumentRecord,
  type TradeDocumentStatus,
} from "@/lib/trade-documents"
import { DocumentStatusBadge, DocumentTypeBadge, TYPE_LABELS, STATUS_LABELS } from "./components/badges"
import { NewDocumentDialog } from "./components/new-document-dialog"
import { useTradeDocumentList } from "./use-trade-documents"

/** 전체 선택을 뜻하는 값. Radix Select 는 빈 문자열을 value 로 못 쓴다. */
const ALL = "all"

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" })
}

function Row({ doc, onOpen }: { doc: TradeDocumentRecord; onOpen: (id: string) => void }) {
  return (
    <TableRow>
      <TableCell>
        <button
          type="button"
          onClick={() => onOpen(doc.id)}
          className="font-mono text-xs hover:underline focus-visible:ring-ring cursor-pointer rounded focus-visible:ring-2 focus-visible:outline-none"
        >
          {doc.documentNo ?? "(미발행)"}
        </button>
      </TableCell>
      <TableCell>
        <DocumentTypeBadge type={doc.type} />
      </TableCell>
      <TableCell>
        <DocumentStatusBadge status={doc.status} />
      </TableCell>
      <TableCell className="text-muted-foreground max-w-48 truncate">
        {doc.input.consignee.companyName || "—"}
      </TableCell>
      <TableCell className="tabular-nums whitespace-nowrap">v{doc.version}</TableCell>
      <TableCell className="tabular-nums whitespace-nowrap">{formatDate(doc.updatedAt)}</TableCell>
    </TableRow>
  )
}

export default function TradeDocumentsPage() {
  const router = useRouter()
  const [type, setType] = useState<ApiTradeDocumentType | "">("")
  const [status, setStatus] = useState<TradeDocumentStatus | "">("")

  const filter: TradeDocumentListFilter = {
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
  }
  const { data, isLoading, error, reload } = useTradeDocumentList(filter)
  const rows = data?.documents ?? []
  const hasFilter = Boolean(type || status)

  const openDoc = (id: string) => router.push(`/trade-documents/${id}`)

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">무역서류</h1>
        <p className="text-muted-foreground">
          상업송장·포장명세서·프로포마를 화물과 연결해 저장·발행·개정합니다.
          단가·HS코드 같은 상업 정보는 화물 데이터에 없어 직접 입력해야 합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="text-muted-foreground size-4" />
            서류 목록
          </CardTitle>
          <CardDescription>
            {data ? `전체 ${data.total.toLocaleString("ko-KR")}건 · 개정 체인당 최신 버전만 표시` : "불러오는 중…"}
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={reload} disabled={isLoading} className="cursor-pointer">
              <RotateCcw className="size-3.5" />
              <span className="max-sm:sr-only">새로고침</span>
            </Button>
            <NewDocumentDialog />
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={type || ALL} onValueChange={(value) => setType(value === ALL ? "" : (value as ApiTradeDocumentType))}>
              <SelectTrigger size="sm" className="w-40" aria-label="종류 필터">
                <SelectValue placeholder="종류" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>종류 전체</SelectItem>
                {API_TRADE_DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status || ALL} onValueChange={(value) => setStatus(value === ALL ? "" : (value as TradeDocumentStatus))}>
              <SelectTrigger size="sm" className="w-36" aria-label="상태 필터">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>상태 전체</SelectItem>
                {TRADE_DOCUMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={() => { setType(""); setStatus("") }} className="cursor-pointer">
                필터 초기화
              </Button>
            )}
          </div>

          {error ? (
            <div className="text-destructive py-8 text-center text-sm">{error}</div>
          ) : isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              서류가 없습니다.{hasFilter && " 필터 조건을 바꿔 보세요."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>서류번호</TableHead>
                    <TableHead>종류</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>수입자</TableHead>
                    <TableHead>버전</TableHead>
                    <TableHead>수정일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((doc) => (
                    <Row key={doc.id} doc={doc} onOpen={openDoc} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
