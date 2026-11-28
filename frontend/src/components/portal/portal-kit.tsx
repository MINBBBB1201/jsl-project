import * as React from "react"
import { ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * 업무 포털 공용 부품. 랜딩에서 실제로 보이는 장치를 내부 화면에 옮긴 것이다.
 * 모양은 app/portal-theme.css 의 portal-* 클래스가 정한다 (값의 출처도 거기 있다).
 *
 * 랜딩 컴포넌트를 직접 불러 쓰지 않는 이유: 랜딩 섹션은 next-intl 번역
 * 컨텍스트에 기대는데 (auth)·(dashboard) 는 [locale] 밖이라 그 컨텍스트가 없다.
 */

/**
 * 화면 머리말: 작은 대문자 라벨 + 제목 + 한 줄 설명.
 * 랜딩 섹션 머리말(.journey-eyebrow + h2 + 설명)과 같은 짜임이다.
 */
export function PortalPageHeader({
  eyebrow,
  title,
  tail,
  description,
  className,
}: {
  /** 영문 대문자 라벨. 예: "Operations" */
  eyebrow: string
  title: string
  /** 제목 뒤에 한 톤 낮춰 붙는 말 */
  tail?: string
  description?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn("px-4 lg:px-6", className)}>
      <p className="portal-eyebrow">{eyebrow}</p>
      <h1 className="portal-title mt-2">
        {title}
        {tail ? <span className="portal-title-tail">{tail}</span> : null}
      </h1>
      {description ? (
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm text-pretty">
          {description}
        </p>
      ) : null}
    </header>
  )
}

/**
 * 주요 동작 버튼: 랜딩의 주황 알약(.journey-pill)과 같은 모양.
 * 화면마다 하나만 둔다 — 주황이 여러 곳에 놓이면 어느 것이 주요 동작인지 흐려진다.
 */
export function PillButton({
  children,
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button className={cn("portal-pill w-full", className)} {...props}>
      {children}
      <ArrowUpRight className="size-4" aria-hidden />
    </button>
  )
}
