import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { LogoWordmark } from "@/components/logo"
import "@/app/portal-theme.css"

/**
 * 404 본문. 루트 레이아웃이 여럿이라 app/global-not-found.tsx(어느 라우트에도
 * 안 걸린 URL)와 [locale]/not-found.tsx(공개 페이지 안의 notFound())가 함께 쓴다.
 *
 * 예전에는 템플릿 그대로 영어 "Page not found"와 로그인해야 들어가는 대시보드로
 * 가는 버튼이었다. 방문자 대부분은 공개 사이트에서 오므로 홈페이지와 화물 조회로
 * 보낸다. global-not-found 에는 번역 컨텍스트가 없어 한국어와 영어를 함께 적는다.
 * 색은 사이트 주황 테마(.portal-surface)를 쓴다.
 */
export function NotFoundContent() {
  return (
    <div className="portal-surface bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-18 items-center px-4 sm:h-20 sm:px-6 lg:px-8">
          <Link href="/landing" className="flex items-center">
            <LogoWordmark className="h-11 sm:h-12" />
          </Link>
        </div>
      </header>
      <main className="container mx-auto flex flex-1 flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <p className="portal-eyebrow">Error 404</p>
        <h1 className="mt-3 text-[clamp(32px,4.4vw,64px)] leading-[1.08] font-bold tracking-[-0.055em] [word-break:keep-all]">
          페이지를 찾을 수 없습니다
          <span className="portal-title-tail block !ml-0 text-[0.55em] tracking-[-0.03em]">
            Page not found
          </span>
        </h1>
        <p className="text-muted-foreground mt-5 max-w-md text-sm leading-relaxed">
          주소가 바뀌었거나 삭제된 페이지입니다. 홈페이지에서 다시 찾아보시거나, 운송장번호로
          화물을 조회해 보세요.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Link href="/landing" className="portal-pill">
            홈페이지로 이동
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/tracking"
            className="text-sm underline decoration-[#8e7c6c] underline-offset-[5px] hover:decoration-current"
          >
            화물 조회
          </Link>
        </div>
      </main>
    </div>
  )
}
