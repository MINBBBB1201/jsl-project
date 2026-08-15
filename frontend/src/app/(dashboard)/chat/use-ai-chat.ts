"use client"

import { useCallback, useState } from "react"
import { API_BASE_URL } from "@/lib/api"

export type KnowledgeCategory = "customs" | "sop" | "faq"

export interface ChatSource {
  id: string
  title: string
  category: KnowledgeCategory
  excerpt: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  /** assistant 메시지가 근거로 삼은 사내 문서 */
  sources?: ChatSource[]
  /** 검색 전략/건수 (디버깅 및 신뢰도 표시용) */
  retrieval?: { strategy: string; count: number }
  isError?: boolean
}

export interface CategoryCount {
  category: KnowledgeCategory
  count: number
}

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [category, setCategory] = useState<KnowledgeCategory | null>(null)

  const reset = useCallback(() => setMessages([]), [])

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || isLoading) return

      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      }

      // 직전 대화 맥락을 함께 보낸다 (서버에서 최근 6개만 사용)
      const history = messages
        .filter((m) => !m.isError)
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }))

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const res = await fetch(`${API_BASE_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, category, history }),
        })

        const json = await res.json().catch(() => null)

        if (!res.ok || !json?.success) {
          const detail =
            json?.errors?.[0]?.msg ??
            json?.error ??
            `요청이 실패했습니다. (HTTP ${res.status})`
          setMessages((prev) => [
            ...prev,
            {
              id: createId(),
              role: "assistant",
              content: detail,
              timestamp: new Date().toISOString(),
              isError: true,
            },
          ])
          return
        }

        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            content: json.data.answer,
            timestamp: new Date().toISOString(),
            sources: json.data.sources ?? [],
            retrieval: json.data.retrieval,
          },
        ])
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            content:
              error instanceof Error
                ? `서버에 연결할 수 없습니다. (${error.message})`
                : "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
            timestamp: new Date().toISOString(),
            isError: true,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [category, isLoading, messages]
  )

  return {
    messages,
    isLoading,
    category,
    setCategory,
    sendMessage,
    reset,
  }
}
