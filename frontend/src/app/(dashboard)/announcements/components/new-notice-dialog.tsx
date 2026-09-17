"use client"

import { useState } from "react"
import { Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { NOTICE_CATEGORIES, type Notice, type NoticeCategory } from "../types"
import { CATEGORY_LABELS } from "./badges"

/**
 * "새 공지사항" 버튼 + 다이얼로그.
 * new-document-dialog.tsx 와 같은 구조 — 항상 draft(isPublished:false)로
 * 만들고, 발행은 목록의 Switch 로 따로 한다(trade-documents 의 초안→발행
 * 흐름과 같은 이유: 만들면서 바로 게시되면 내용을 다듬을 틈이 없다).
 */
export function NewNoticeDialog({
  onCreate,
}: {
  onCreate: (input: {
    title: string
    body: string
    category: NoticeCategory
    isPinned: boolean
  }) => Promise<Notice>
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [category, setCategory] = useState<NoticeCategory>("general")
  const [isPinned, setIsPinned] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setTitle("")
    setBody("")
    setCategory("general")
    setIsPinned(false)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setError("제목과 본문을 입력해 주세요.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await onCreate({ title: title.trim(), body: body.trim(), category, isPinned })
      setOpen(false)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "공지사항을 만들지 못했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="size-4" />
          새 공지사항
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 공지사항</DialogTitle>
          <DialogDescription>
            작성중(초안)으로 만들어집니다. 목록에서 발행 스위치를 켜야 공개 페이지에 노출됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="new-notice-title">제목</Label>
            <Input
              id="new-notice-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 정기 점검 안내"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-notice-category">카테고리</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as NoticeCategory)}>
              <SelectTrigger id="new-notice-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTICE_CATEGORIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {CATEGORY_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-notice-body">본문</Label>
            <Textarea
              id="new-notice-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={6}
              placeholder="공지 내용을 입력하세요."
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="new-notice-pinned">목록 상단 고정</Label>
              <p className="text-muted-foreground text-xs">중요 공지를 목록 맨 위에 고정합니다.</p>
            </div>
            <Switch id="new-notice-pinned" checked={isPinned} onCheckedChange={setIsPinned} />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="cursor-pointer">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            만들기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
