"use client"

import * as React from "react"

import { Link } from "@/i18n/navigation"

/**
 * 같은 페이지 앵커와 라우트 이동을 함께 받는 링크
 *
 * 랜딩의 링크 목록은 두 종류가 섞여 있다 — "#contact" 처럼 같은 페이지 안에서
 * 스크롤만 하는 앵커와, "/tracking" · "/landing#faq" 처럼 다른 라우트로 가는
 * 주소다. 둘의 올바른 마크업이 다른데 한 배열에 섞여 오므로 여기서 가른다.
 *
 * ── 왜 순수 <a> 로 두면 안 되는가 ───────────────────────────────────────
 * 이 사이트는 로케일 프리픽스 라우팅이다 (ko 는 프리픽스 없음, 나머지는
 * /en · /zh · /vi). next-intl 의 Link 는 현재 로케일을 붙여 주지만 <a> 는
 * 적힌 주소로 그대로 간다. 그래서 /vi/landing 을 보던 사람이 푸터의 약관을
 * 누르면 /vi/terms 가 아니라 /terms — 한국어 약관이 나왔다 (실측: 푸터 내부
 * 링크 10개 전부 프리픽스 없이 렌더됐고, 클릭하면 한국어 페이지가 떴다).
 *
 * ⚠️ 이 문제는 lint 로 다 잡히지 않는다. @next/next/no-html-link-for-pages 는
 *    href 가 문자열 리터럴일 때만 잡아서, href={link.href} 처럼 변수로 넘기는
 *    자리는 조용히 지나간다. 실제로 걸린 것은 열 곳 중 한 곳뿐이었다.
 *
 * ── 앵커는 왜 <a> 로 남기나 ─────────────────────────────────────────────
 * "#contact" 는 라우트가 아니라 현재 문서 안의 위치다. Link 로 감싸면 라우터가
 * 개입할 이유가 없는 이동에 끼어들고, 브라우저 기본 앵커 동작(그리고 그 위에
 * 얹은 smoothScrollTo)이 어긋난다.
 */
export function SiteLink({
  href,
  children,
  ...props
}: { href: string } & Omit<React.ComponentProps<"a">, "href">) {
  if (href.startsWith("#")) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}
