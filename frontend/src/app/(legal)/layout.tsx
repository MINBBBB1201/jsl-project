import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Logo } from '@/components/logo'
import { LandingFooter } from '@/app/landing/components/footer'
import { company } from '@/config/landing-content'

/**
 * 법적 고지 페이지 공용 레이아웃.
 *
 * 랜딩 네비게이션은 #about 같은 페이지 내 앵커라 다른 라우트에서는 동작하지
 * 않는다. 그래서 여기서는 로고 + 돌아가기 링크만 있는 슬림 헤더를 쓴다.
 */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link
            href="/landing"
            className="flex items-center space-x-2 cursor-pointer min-w-0"
          >
            <Logo size={32} />
            <span className="font-bold text-xl truncate">{company.name}</span>
          </Link>

          <Link
            href="/landing"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span className="max-sm:sr-only">홈으로 돌아가기</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <LandingFooter />
    </div>
  )
}
