"use client"

import { useEffect, useRef } from "react"
import { format } from "date-fns"
import { AlertCircle, Bot, FileText, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { CATEGORY_META } from "./category-sidebar"
import type { ChatMessage } from "../use-ai-chat"

interface ChatMessagesProps {
  messages: ChatMessage[]
  isLoading: boolean
  suggestions: string[]
  onSuggestionClick: (question: string) => void
}

export function ChatMessages({
  messages,
  isLoading,
  suggestions,
  onSuggestionClick,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">사내 업무 챗봇</h3>
          <p className="text-sm text-muted-foreground mb-6">
            통관 규정, 창고 SOP, 고객 FAQ 문서를 찾아 답변합니다.
            <br />
            아래 질문으로 시작해 보세요.
          </p>
          <div className="space-y-2">
            {suggestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onSuggestionClick(q)}
                className="w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="space-y-6 py-4">
        {messages.map((message) => {
          const isUser = message.role === "user"

          return (
            <div
              key={message.id}
              className={cn("flex gap-3", isUser && "flex-row-reverse")}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  isUser
                    ? "bg-muted"
                    : message.isError
                      ? "bg-destructive/10"
                      : "bg-primary/10"
                )}
              >
                {isUser ? (
                  <User className="h-4 w-4" />
                ) : message.isError ? (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <Bot className="h-4 w-4 text-primary" />
                )}
              </div>

              <div
                className={cn(
                  "flex-1 max-w-[80%] space-y-2",
                  isUser && "flex flex-col items-end"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : message.isError
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted"
                  )}
                >
                  {message.content}
                </div>

                {/* 근거 문서 */}
                {!isUser && message.sources && message.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      근거 문서
                    </span>
                    {message.sources.map((source) => (
                      <HoverCard key={source.id} openDelay={100}>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs hover:bg-muted transition-colors cursor-pointer"
                          >
                            <FileText className="h-3 w-3" />
                            <span className="max-w-50 truncate">
                              {source.title}
                            </span>
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80" align="start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {CATEGORY_META[source.category]?.label ??
                                  source.category}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{source.title}</p>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">
                              {source.excerpt}…
                            </p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </div>
                )}

                {/* 관련 문서를 못 찾은 경우 */}
                {!isUser &&
                  !message.isError &&
                  message.retrieval?.count === 0 && (
                    <p className="text-xs text-muted-foreground">
                      관련 사내 문서를 찾지 못했습니다.
                    </p>
                  )}

                <span className="text-xs text-muted-foreground">
                  {format(new Date(message.timestamp), "HH:mm")}
                </span>
              </div>
            </div>
          )
        })}

        {/* 응답 대기 중 */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
