import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { LogoWordmark } from "@/components/logo"
import { company } from "@/config/landing-content"

/**
 * 인증 화면(로그인·계정 발급·비밀번호 재설정) 공용 틀.
 *
 * 랜딩 히어로와 같은 장치로 짠다 (색·모양은 app/portal-theme.css):
 * - 헤더: PublicPageShell 과 같은 높이·로고 크기(h-18/sm:h-20, 워드마크 h-11/12).
 *   그 셸을 직접 쓰지 않는 이유는 인증 화면이 [locale] 밖이라 next-intl
 *   컨텍스트가 없고, 랜딩 푸터가 번역 문구에 기대기 때문이다.
 * - 왼쪽 패널: 히어로와 같은 나이트 면, 주황 작은 라벨, 굵고 자간을 좁힌 제목,
 *   아래쪽의 주황 지평선(portal-horizon). 랜딩에서 넘어온 사람이 같은 사이트라고
 *   알아보는 가장 큰 단서가 이 지평선이다.
 * - 폼 쪽: 카드 없이 종이색 바탕 위에 바로 둔다. 제출 버튼은 히어로의 주황 알약.
 *
 * 서버 컴포넌트다. 안쪽 폼만 클라이언트 컴포넌트로 둔다.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear()

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <header className="border-b">
        <div className="flex h-18 w-full items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-12">
          <Link href="/landing" className="flex shrink-0 items-center">
            <LogoWordmark className="h-11 sm:h-12" priority />
          </Link>
          <nav className="flex items-center gap-6 text-sm">
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

      <main className="grid w-full flex-1 lg:grid-cols-[5fr_6fr]">
        {/*
          이 면은 라이트·다크 어느 모드에서도 어둡다(랜딩 히어로가 그렇다).
          지평선은 넓은 화면에서만 그린다 — 모바일에서는 패널이 폼 위의 짧은 띠라
          호가 들어갈 높이가 없다. 다크 모드에서는 페이지 바탕도 나이트라 패널을
          한 단계 밝은 색(#1e1712)으로 올린다. 같은 색이면 패널 경계가 사라져
          지평선이 허공에서 잘린 것처럼 보인다.
        */}
        <aside className="bg-brand-navy-deep relative flex flex-col overflow-hidden px-4 py-8 text-[#f3efe7] sm:px-6 lg:px-12 lg:pt-16 lg:pb-40 dark:bg-[#1e1712]">
          <p className="portal-eyebrow !text-[#ff7a33]">Operations portal</p>
          <p className="mt-4 text-[clamp(30px,3.6vw,56px)] leading-[1.08] font-bold tracking-[-0.06em] [word-break:keep-all] lg:mt-5">
            JSL 업무 포털
          </p>
          <p className="mt-4 max-w-md text-[13px] leading-relaxed [word-break:keep-all] text-[#d1c5b8] lg:mt-6 lg:text-sm">
            화물 운영 현황, 무역서류, 파손 판정, 공지 관리를 사내 계정으로 처리합니다.
          </p>
          <ul className="mt-6 hidden flex-wrap gap-x-8 gap-y-2 text-sm lg:flex">
            <li>
              <Link
                href="/tracking"
                className="underline decoration-[#8e7c6c] underline-offset-[5px] transition-colors hover:decoration-current"
              >
                로그인 없이 화물 조회
              </Link>
            </li>
            <li>
              <Link
                href="/notices"
                className="underline decoration-[#8e7c6c] underline-offset-[5px] transition-colors hover:decoration-current"
              >
                공지사항
              </Link>
            </li>
          </ul>
          <div className="portal-horizon max-lg:hidden" aria-hidden="true" />
        </aside>

        <section className="flex justify-center px-4 py-10 sm:px-6 lg:items-center lg:px-12 lg:py-14">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </main>

      {/* 선을 두지 않는다. 지평선 아래가 페이지 바탕으로 이어져야 한다 */}
      <footer>
        <div className="text-muted-foreground flex w-full flex-col gap-2 px-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-12">
          <span>
            &copy; {year} {company.legalName}
          </span>
          <span className="flex gap-5">
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

/**
 * 폼 위 제목 묶음. 경로 표기는 왼쪽 패널에 이미 있으므로 여기서는 제목만 둔다
 * (같은 화면에 모노 라벨을 두 번 쓰지 않는다).
 */
export function AuthHeading({
  title,
  description,
}: {
  title: string
  description?: React.ReactNode
}) {
  return (
    <div className="mb-8">
      <h1 className="portal-title">{title}</h1>
      {description ? (
        <p className="text-muted-foreground mt-2 text-sm text-pretty">{description}</p>
      ) : null}
    </div>
  )
}
