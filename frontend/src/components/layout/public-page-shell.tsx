import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Logo } from '@/components/logo'
import { LandingFooter } from '@/app/landing/components/footer'
import { company } from '@/config/landing-content'

/**
 * 공개 페이지(로그인 불필요) 공용 셸.
 *
 * 랜딩 네비게이션은 #about 같은 페이지 내 앵커라 다른 라우트에서는 동작하지
 * 않는다. 그래서 로고 + 돌아가기만 있는 슬림 헤더를 쓰고 푸터는 랜딩과 공유한다.
 * /privacy, /terms, /tracking, /consulting 이 함께 사용한다.
 */
export function PublicPageShell({ children }: { children: React.ReactNode }) {
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
