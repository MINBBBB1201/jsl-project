"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

/**
 * 인라인 편집용 draft 상태.
 *
 * 다른 사내 프로젝트 DAEMUN(apps/admin/src/components/inline-edit.tsx)의
 * 개념을 참고해 shadcn 스타일로 새로 짰다 — 원본은 순수 Tailwind 컴포넌트라
 * 그대로 옮기지 않았다.
 *
 * - blur / Enter → 값이 바뀌었으면 onCommit(draft).
 * - Esc → draft 를 서버 값으로 되돌리고, 이어지는 blur 에서는 커밋하지 않는다.
 * - onCommit 이 실패(reject)하면 draft 를 서버 값으로 되돌린다 — 거부된 값이
 *   저장된 것처럼 화면에 남지 않도록.
 * - 편집 중이 아닐 때만 서버 값 변경을 draft 에 반영한다.
 */
function useDraft(value: string, onCommit: (next: string) => void | Promise<unknown>) {
  const [draft, setDraft] = useState(value)
  const draftRef = useRef(value)
  const valueRef = useRef(value)
  const dirtyRef = useRef(false)
  const escapingRef = useRef(false)

  useEffect(() => {
    valueRef.current = value
    if (!dirtyRef.current) {
      draftRef.current = value
      setDraft(value)
    }
  }, [value])

  const set = (next: string) => {
    dirtyRef.current = true
    draftRef.current = next
    setDraft(next)
  }

  const revert = () => {
    dirtyRef.current = false
    draftRef.current = valueRef.current
    setDraft(valueRef.current)
  }

  const escape = () => {
    escapingRef.current = true
    revert()
  }

  const commit = () => {
    if (escapingRef.current) {
      escapingRef.current = false
      return
    }
    dirtyRef.current = false
    const next = draftRef.current.trim()
    if (next === valueRef.current.trim()) {
      revert()
      return
    }
    Promise.resolve(onCommit(next)).catch(() => {
      // 저장 실패: 사용자가 그 사이 다시 편집하지 않았다면 서버 값으로 복구
      if (!dirtyRef.current) revert()
    })
  }

  return { draft, set, escape, commit }
}

interface InlineTextProps {
  value: string
  placeholder?: string
  /** 프로미스를 돌려주면 실패 시 입력값이 서버 값으로 되돌아간다. */
  onCommit: (next: string) => void | Promise<unknown>
  /** 저장 중 표시. 입력을 막지는 않는다 — Tab 으로 다음 필드에 갈 때 포커스가 안 끊기도록. */
  pending?: boolean
  ariaLabel: string
  className?: string
}

/**
 * 한 줄 인라인 편집. 평소엔 일반 텍스트처럼 보이다가, 클릭(포커스)하면 그
 * 자리에서 바로 편집된다. 값이 바뀐 채로 blur / Enter → onCommit. Esc → 되돌림.
 */
export function InlineText({
  value,
  placeholder,
  onCommit,
  pending,
  ariaLabel,
  className,
}: InlineTextProps) {
  const d = useDraft(value, onCommit)
  return (
    <input
      type="text"
      aria-label={ariaLabel}
      aria-busy={pending || undefined}
      value={d.draft}
      placeholder={placeholder}
      onChange={(event) => d.set(event.target.value)}
      onBlur={d.commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur()
        if (event.key === "Escape") {
          d.escape()
          event.currentTarget.blur()
        }
      }}
      className={cn(
        "border-input w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none transition-[color,box-shadow]",
        "hover:border-input",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        pending && "opacity-50",
        className
      )}
    />
  )
}
