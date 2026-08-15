"use client"

import { FileText, Package, HelpCircle, Layers } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { CategoryCount, KnowledgeCategory } from "../use-ai-chat"

export const CATEGORY_META: Record<
  KnowledgeCategory,
  { label: string; description: string; icon: typeof FileText }
> = {
  customs: {
    label: "통관",
    description: "수입·수출 통관 절차, 서류, 기한",
    icon: FileText,
  },
  sop: {
    label: "SOP",
    description: "입출고 표준 작업 절차, 안전 수칙",
    icon: Package,
  },
  faq: {
    label: "FAQ",
    description: "배송 조회, 클레임, 고객 안내",
    icon: HelpCircle,
  },
}

interface CategorySidebarProps {
  selected: KnowledgeCategory | null
  onSelect: (category: KnowledgeCategory | null) => void
  counts: CategoryCount[]
}

export function CategorySidebar({
  selected,
  onSelect,
  counts,
}: CategorySidebarProps) {
  const countFor = (category: KnowledgeCategory) =>
    counts.find((c) => c.category === category)?.count ?? 0

  const totalCount = counts.reduce((sum, c) => sum + c.count, 0)

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <div className="px-2 py-2">
          <h2 className="text-sm font-semibold">지식 카테고리</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            카테고리를 고르면 해당 분야 문서에서만 답을 찾습니다.
          </p>
        </div>

        {/* 전체 */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer",
            selected === null
              ? "bg-primary/10 text-foreground"
              : "hover:bg-muted"
          )}
        >
          <Layers className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">전체</span>
              <Badge variant="secondary" className="text-xs">
                {totalCount}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              모든 사내 문서에서 검색
            </p>
          </div>
        </button>

        {(Object.keys(CATEGORY_META) as KnowledgeCategory[]).map((key) => {
          const meta = CATEGORY_META[key]
          const Icon = meta.icon
          const isActive = selected === key

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                "w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer",
                isActive ? "bg-primary/10 text-foreground" : "hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{meta.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {countFor(key)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {meta.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
