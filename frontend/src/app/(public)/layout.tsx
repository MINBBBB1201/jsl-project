import { PublicPageShell } from '@/components/layout/public-page-shell'

/** 공개 페이지(화물추적, 컨설팅 등) — 로그인 불필요 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PublicPageShell>{children}</PublicPageShell>
}
