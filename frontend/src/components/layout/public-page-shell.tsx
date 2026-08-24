"use client"

import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'

import { LogoWordmark } from '@/components/logo'
import { LandingFooter } from '@/app/landing/components/footer'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/language-switcher'

/**
 * 공개 페이지(로그인 불필요) 공용 셸.
 *
 * 랜딩 네비게이션은 #about 같은 페이지 내 앵커라 다른 라우트에서는 동작하지
 * 않는다. 그래서 로고 + 돌아가기만 있는 슬림 헤더를 쓰고 푸터는 랜딩과 공유한다.
 * /privacy, /terms, /tracking, /consulting 이 함께 사용한다.
 */
export function PublicPageShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('common')

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        {/* 바 높이와 로고 크기는 랜딩 헤더(navbar.tsx)와 같은 값을 쓴다.
            두 헤더를 오가며 로고가 커졌다 작아졌다 하면 안 된다 —
            높이를 정한 사정은 저쪽 주석에 있다. */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4 sm:h-20">
          {/* 워드마크에 회사명이 들어있어 옆에 텍스트를 따로 두지 않는다 */}
          <Link href="/landing" className="flex shrink-0 items-center cursor-pointer">
            <LogoWordmark className="h-11 sm:h-12" priority />
          </Link>

          <div className="flex shrink-0 items-center gap-1">
            <LanguageSwitcher />
            <Link
              href="/landing"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="max-sm:sr-only">{t('backHome')}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <LandingFooter />
    </div>
  )
}
