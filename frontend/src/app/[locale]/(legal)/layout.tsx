import { PublicPageShell } from '@/components/layout/public-page-shell'

/** 법적 고지 페이지 — 공개 페이지 공용 셸을 그대로 쓴다 */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PublicPageShell>{children}</PublicPageShell>
}
