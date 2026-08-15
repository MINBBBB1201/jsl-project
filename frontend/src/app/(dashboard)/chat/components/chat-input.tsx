"use client"

import { useRef, useState } from "react"
import { Loader2, SendHorizonal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  placeholder?: string
}

export function ChatInput({ onSend, isLoading, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setValue("")
    textareaRef.current?.focus()
  }

  return (
    <div className="border-t p-3">
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            // Enter 전송, Shift+Enter 줄바꿈
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={placeholder ?? "궁금한 업무 내용을 물어보세요."}
          rows={1}
          className="min-h-11 max-h-40 resize-none"
          disabled={isLoading}
        />
        <Button
          type="button"
          onClick={submit}
          disabled={isLoading || value.trim().length === 0}
          className="h-11 cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
          <span className="sr-only">보내기</span>
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        답변은 사내 문서를 근거로 생성되며, 부정확할 수 있습니다. 중요한 사항은
        담당 부서에 확인하세요.
      </p>
    </div>
  )
}
