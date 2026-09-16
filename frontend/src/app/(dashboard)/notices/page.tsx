"use client"

import { useState } from "react"
import Link from "next/link"
import { ExternalLink, Megaphone, Pin, PinOff, RotateCcw, Trash2 } from "lucide-react"

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
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CategoryBadge, PublishedBadge } from "./components/badges"
import { NewNoticeDialog } from "./components/new-notice-dialog"
import { useNotices } from "./use-notices"
import type { Notice } from "./types"

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" })
}

function Row({
  notice,
  onTogglePublished,
  onTogglePinned,
  onDelete,
}: {
  notice: Notice
  onTogglePublished: (id: string, next: boolean) => void
  onTogglePinned: (id: string, next: boolean) => void
  onDelete: (id: string) => void
}) {
  return (
    <TableRow>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 cursor-pointer"
          onClick={() => onTogglePinned(notice.id, !notice.isPinned)}
          aria-label={notice.isPinned ? "고정 해제" : "목록 상단에 고정"}
          aria-pressed={notice.isPinned}
        >
          {notice.isPinned ? (
            <Pin className="fill-current size-4" />
          ) : (
            <PinOff className="text-muted-foreground size-4" />
          )}
        </Button>
      </TableCell>
      <TableCell className="max-w-72 truncate font-medium">{notice.title}</TableCell>
      <TableCell>
        <CategoryBadge category={notice.category} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={notice.isPublished}
            onCheckedChange={(checked) => onTogglePublished(notice.id, checked)}
            aria-label={notice.isPublished ? "발행 취소" : "발행"}
          />
          <PublishedBadge isPublished={notice.isPublished} />
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">
        {formatDate(notice.createdAt)}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive size-7 cursor-pointer"
          onClick={() => onDelete(notice.id)}
          aria-label="삭제"
        >
          <Trash2 className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export default function NoticesPage() {
  // 관리 화면 기본은 /api/notices/all(draft 포함). 켜면 published 만 본다.
  const [publishedOnly, setPublishedOnly] = useState(false)
  const { data, isLoading, error, reload, create, update, remove } = useNotices(!publishedOnly)
  const notices = data?.notices ?? []

  const handleTogglePublished = (id: string, next: boolean) => {
    update(id, { isPublished: next }).catch(() => {})
  }
  const handleTogglePinned = (id: string, next: boolean) => {
    update(id, { isPinned: next }).catch(() => {})
  }
  const handleDelete = (id: string) => {
    if (!window.confirm("이 공지사항을 삭제합니다. 되돌릴 수 없습니다.")) return
    remove(id).catch(() => {})
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">공지사항</h1>
        <p className="text-muted-foreground">
          사내 공지사항을 작성·발행합니다. 발행한 공지만 공개 페이지에 노출됩니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="text-muted-foreground size-4" />
            공지 목록
          </CardTitle>
          <CardDescription>
            {data ? `전체 ${data.total.toLocaleString("ko-KR")}건` : "불러오는 중…"}
          </CardDescription>
          <CardAction className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={publishedOnly} onCheckedChange={setPublishedOnly} />
              발행된 것만
            </label>
            <Button variant="outline" size="sm" asChild className="cursor-pointer">
              <Link href="/notices" target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" />
                공개 페이지에서 보기
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={reload} disabled={isLoading} className="cursor-pointer">
              <RotateCcw className="size-3.5" />
              <span className="max-sm:sr-only">새로고침</span>
            </Button>
            <NewNoticeDialog onCreate={create} />
          </CardAction>
        </CardHeader>

        <CardContent>
          {error ? (
            <div className="text-destructive py-8 text-center text-sm">{error}</div>
          ) : isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : notices.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              등록된 공지사항이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>제목</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>발행</TableHead>
                    <TableHead>작성일</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.map((notice) => (
                    <Row
                      key={notice.id}
                      notice={notice}
                      onTogglePublished={handleTogglePublished}
                      onTogglePinned={handleTogglePinned}
                      onDelete={handleDelete}
                    />
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
