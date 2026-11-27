import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { LogoWordmark } from "@/components/logo"
import { company } from "@/config/landing-content"

/**
 * 인증 화면(로그인·계정 발급·비밀번호 재설정) 공용 틀.
 *
 * 예전에는 shadcn 예제 그대로 회색 바탕 가운데 둥근 카드 한 장이었다. 공개
 * 사이트와 이어져 보이도록 공개 페이지의 부품을 그대로 가져온다.
 *
 * - 헤더: PublicPageShell 과 같은 높이·로고 크기(h-18/sm:h-20, 워드마크 h-11/12).
 *   그 셸을 직접 쓰지 않는 이유는 인증 화면이 [locale] 밖이라 next-intl
 *   컨텍스트가 없고, 랜딩 푸터가 번역 문구에 기대기 때문이다.
 * - 왼쪽 패널: 랜딩 CtaBand 와 같은 바탕(--brand-navy-deep, 다크는 --secondary)과
 *   같은 오렌지 도트 무늬. 무늬 값(간격 22px, 불투명도 0.22, 마스크)도 같다.
 * - 폼 쪽: 카드 없이 바탕 위에 바로 둔다. 업무 포털 로그인(Maersk 등)이 대개
 *   그렇게 하고, 카드를 겹치면 템플릿처럼 보인다.
 *
 * 서버 컴포넌트다. 안쪽 폼만 클라이언트 컴포넌트로 둔다.
 */

const DOT_GAP = "22px"

export function AuthShell({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear()

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-18 items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
          <Link href="/landing" className="flex shrink-0 items-center">
            <LogoWordmark className="h-11 sm:h-12" priority />
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link
              href="/tracking"
              className="text-muted-foreground hover:text-foreground transition-colors max-sm:hidden"
            >
              화물 조회
            </Link>
            <Link
              href="/landing"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="size-4" aria-hidden />
              <span className="max-sm:sr-only">홈페이지</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="grid flex-1 lg:grid-cols-[5fr_6fr]">
        <aside className="bg-brand-navy-deep dark:bg-secondary relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, var(--brand-orange) 1.5px, transparent 1.5px)",
              backgroundSize: `${DOT_GAP} ${DOT_GAP}`,
              opacity: 0.22,
              maskImage: "linear-gradient(to top, black 0%, transparent 55%)",
              WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 55%)",
            }}
          />
          <div className="relative flex h-full flex-col px-4 py-8 sm:px-6 lg:px-12 lg:py-16">
            <p className="text-brand-slate flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
              <span className="bg-brand-orange inline-block h-px w-6" aria-hidden />
              Operations Portal
            </p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-white lg:mt-5 lg:text-4xl">
              JSL 업무 포털
            </p>
            <p className="text-brand-slate mt-2 max-w-md text-sm text-pretty lg:mt-4 lg:text-base">
              화물 운영 현황, 무역서류, 파손 판정, 공지 관리를 사내 계정으로 처리합니다.
            </p>

            {/* 넓은 화면에서만 아래쪽에 바로가기를 둔다. 모바일에서는 폼이 먼저 보여야 한다 */}
            <ul className="mt-auto hidden border-t border-white/10 pt-6 lg:grid lg:grid-cols-2 lg:gap-6">
              <li>
                <Link href="/tracking" className="group block">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                    화물 조회
                    <ArrowRight
                      className="size-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                  <span className="text-brand-slate mt-1 block text-xs">
                    B/L·컨테이너 번호로 로그인 없이 조회
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/notices" className="group block">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                    공지사항
                    <ArrowRight
                      className="size-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                  <span className="text-brand-slate mt-1 block text-xs">
                    운영 일정과 회사 안내
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </aside>

        <section className="flex justify-center px-4 py-10 sm:px-6 lg:items-center lg:px-12 lg:py-16">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground container mx-auto flex flex-col gap-2 px-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>
            &copy; {year} {company.legalName}
          </span>
          <span className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              개인정보처리방침
            </Link>
          </span>
        </div>
      </footer>
    </div>
  )
}

/** 폼 위 제목 묶음. 공개 페이지 h1(text-3xl font-bold tracking-tight)과 같은 크기를 쓴다 */
export function AuthHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: React.ReactNode
}) {
  return (
    <div className="mb-8">
      <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.18em] uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
      {description ? (
        <p className="text-muted-foreground mt-2 text-sm text-pretty">{description}</p>
      ) : null}
    </div>
  )
}
