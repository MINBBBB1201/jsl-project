import { NotFoundContent } from '@/components/not-found-content'

/** 공개 페이지 안에서 notFound() 를 부른 경우 (예: 없는 /services/[mode]) */
export default function LocaleNotFound() {
  return <NotFoundContent />
}
