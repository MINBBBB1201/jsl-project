/**
 * 공지사항 타입/상수.
 *
 * ⚠️ NOTICE_CATEGORIES 는 backend/src/config/notices.js 의 값과 같아야 한다
 * (trade-documents 의 선례 — 프론트가 사본, 백엔드가 원본). 백엔드 쪽이
 * 바뀌면 여기도 맞춰 고칠 것.
 */
export const NOTICE_CATEGORIES = [
  "general",
  "update",
  "maintenance",
  "event",
] as const

export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number]

/** notice.model.js 의 toClientJSON() 과 같은 모양 */
export interface Notice {
  id: string
  title: string
  body: string
  category: NoticeCategory
  isPinned: boolean
  isPublished: boolean
  publishedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}
