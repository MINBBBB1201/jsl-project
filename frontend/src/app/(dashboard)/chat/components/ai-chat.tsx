"use client"

import { useEffect, useState } from "react"
import { Bot, Menu, RotateCcw, X } from "lucide-react"

import { API_BASE_URL } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CategorySidebar, CATEGORY_META } from "./category-sidebar"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { useAiChat, type CategoryCount } from "../use-ai-chat"

const SUGGESTIONS_BY_CATEGORY: Record<string, string[]> = {
  all: [
    "관세는 언제까지 납부해야 하나요?",
    "입고할 때 화물이 파손돼 있으면 어떤 절차를 밟아야 해요?",
    "화물 파손 배상 한도가 얼마인가요?",
  ],
  customs: [
    "수입신고에 필요한 서류가 뭔가요?",
    "원산지증명서는 어디서 발급받고 며칠 걸리나요?",
    "수출신고 후 며칠 안에 선적해야 하나요?",
  ],
  sop: [
    "재고 실사 주기와 오차 허용 범위를 알려줘",
    "파손 화물을 발견하면 어떻게 처리하나요?",
    "창고 안전 수칙 알려줘",
  ],
  faq: [
    "배송 조회는 어떻게 하나요?",
    "배송이 지연되면 언제 도착하나요?",
    "배송지 주소를 변경할 수 있나요?",
  ],
}

export function AiChat() {
  const { messages, isLoading, category, setCategory, sendMessage, reset } =
    useAiChat()
  const [counts, setCounts] = useState<CategoryCount[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // 카테고리별 문서 수 로드
  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE_URL}/api/chat/categories`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success) setCounts(json.data)
      })
      .catch(() => {
        // 문서 수는 부가 정보라 실패해도 채팅은 그대로 사용 가능
      })
    return () => {
      cancelled = true
    }
  }, [])

  const activeMeta = category ? CATEGORY_META[category] : null
  const suggestions = SUGGESTIONS_BY_CATEGORY[category ?? "all"]

  return (
    <div className="h-full min-h-[600px] max-h-[calc(100vh-160px)] flex rounded-lg border overflow-hidden bg-background">
      {/* 모바일 오버레이 */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 카테고리 사이드바 */}
      <div
        className={`
          w-72 border-r bg-background flex-shrink-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          lg:relative lg:block
          fixed inset-y-0 left-0 z-50
          transition-transform duration-300 ease-in-out
        `}
      >
        <div className="lg:hidden p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">카테고리</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(false)}
            className="cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <CategorySidebar
          selected={category}
          onSelect={(next) => {
            setCategory(next)
            setIsSidebarOpen(false)
          }}
          counts={counts}
        />
      </div>

      {/* 채팅 패널 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 헤더 */}
        <div className="flex items-center gap-2 h-16 px-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
            className="cursor-pointer lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate">업무 지원 챗봇</span>
              <Badge variant="outline" className="text-xs">
                {activeMeta ? activeMeta.label : "전체"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {activeMeta
                ? activeMeta.description
                : "사내 문서를 검색해 답변합니다"}
            </p>
          </div>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">새 대화</span>
            </Button>
          )}
        </div>

        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          suggestions={suggestions}
          onSuggestionClick={sendMessage}
        />

        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          placeholder={
            activeMeta
              ? `${activeMeta.label} 관련 질문을 입력하세요.`
              : "궁금한 업무 내용을 물어보세요."
          }
        />
      </div>
    </div>
  )
}
