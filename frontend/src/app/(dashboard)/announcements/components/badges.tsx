import { Badge } from "@/components/ui/badge"
import type { NoticeCategory } from "../types"

/** 화면에 그대로 나가는 카테고리 라벨. */
export const CATEGORY_LABELS: Record<NoticeCategory, string> = {
  general: "일반",
  update: "업데이트",
  maintenance: "점검",
  event: "이벤트",
}

const CATEGORY_VARIANT: Record<NoticeCategory, "outline" | "default" | "secondary"> = {
  general: "outline",
  update: "default",
  maintenance: "secondary",
  event: "secondary",
}

export function CategoryBadge({ category }: { category: NoticeCategory }) {
  return <Badge variant={CATEGORY_VARIANT[category]}>{CATEGORY_LABELS[category] ?? category}</Badge>
}

export function PublishedBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <Badge variant={isPublished ? "default" : "outline"}>
      {isPublished ? "발행됨" : "작성중"}
    </Badge>
  )
}
