"use client"

import { useState } from "react"
import { Loader2, Pencil } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Notice } from "../types"

/**
 * 본문 수정 다이얼로그.
 *
 * 제목은 목록에서 바로 인라인 편집하지만(inline-edit.tsx), 본문은 길어서
 * 한 줄에 넣기 어렵다 — 다이얼로그로 열어서 고치게 한다.
 */
export function EditBodyDialog({
  notice,
  onSave,
}: {
  notice: Notice
  onSave: (id: string, body: string) => Promise<unknown>
}) {
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState(notice.body)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!body.trim()) {
      setError("본문을 입력해 주세요.")
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      await onSave(notice.id, body.trim())
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "본문을 저장하지 못했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setBody(notice.body)
          setError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-7 cursor-pointer"
          aria-label="본문 수정"
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>본문 수정</DialogTitle>
          <DialogDescription>{notice.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="edit-notice-body">본문</Label>
          <Textarea
            id="edit-notice-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={8}
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
            className="cursor-pointer"
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="cursor-pointer">
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
