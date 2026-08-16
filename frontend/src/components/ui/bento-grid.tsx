"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

/**
 * 벤토 그리드
 *
 * Aceternity UI 의 Bento Grid(https://ui.aceternity.com/components/bento-grid)를
 * 가져와 이 사이트에 맞게 고쳤다. 원본은 MIT 라이선스로 복사·붙여넣기 배포되며
 * 의존성은 이미 설치돼 있는 framer-motion 하나뿐이다.
 *
 * 원본에서 가져온 것
 *   - auto-rows 기반 비대칭 배치. 칸이 `col-span-*` / `row-span-*` 로 크기를
 *     달리 잡아도 행 높이가 흐트러지지 않는다.
 *   - `group/bento` 호버 idiom. 칸에 마우스를 올리면 그 칸 안쪽 요소들이 함께
 *     반응한다. 이름 있는 group 이라 바깥의 다른 group 과 섞이지 않는다.
 *
 * 고친 것
 *   - 원본 아이템은 흰 카드 안에 아이콘·제목·설명을 세로로 쌓는다. 여기서는
 *     칸 전체를 사진이 채우고 글자가 그 위에 얹혀야 해서, 아이템을 "테두리와
 *     넘침만 관리하는 빈 상자"로 줄이고 안을 호출부가 채우게 했다. 덕분에
 *     칸 전체를 <Link> 하나로 덮을 수 있다 — 보이는 제목이 곧 링크 텍스트라
 *     별도의 sr-only 라벨을 붙이지 않아도 된다.
 *   - 등장 애니메이션에서 페이드(opacity)를 뺐다. 원본처럼 opacity: 0 에서
 *     시작하면 framer-motion 이 그 값을 서버 HTML 의 인라인 스타일에도 찍는데,
 *     그러면 하이드레이션이 끝날 때까지 칸이 통째로 보이지 않는다. 히어로 사진이
 *     LCP 대상이라 측정값이 JS 실행 시점까지 밀리고, JS 가 실패하면 아예 빈
 *     화면이 남는다. y 이동만 쓰면 첫 페인트부터 사진이 보이고, 애니메이션은
 *     거기서 살짝 올라오는 것으로 끝난다.
 */

/** 큐빅 베지어 네 점. 빠르게 나갔다가 끝에서 길게 감속한다 */
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

export function BentoGrid({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      {children}
    </div>
  )
}

interface BentoGridItemProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof motion.div>,
    "initial" | "animate" | "transition"
  > {
  /**
   * 등장 순서. 0.05초씩 밀려 나타난다. 큰 칸을 0번으로 두는 것이 중요하다 —
   * 대개 그 칸의 사진이 LCP 대상이라, 순서를 뒤로 밀면 측정값이 그만큼 나빠진다.
   */
  index?: number
}

export function BentoGridItem({
  className,
  children,
  index = 0,
  ...props
}: BentoGridItemProps) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <motion.div
      // 동작 줄이기를 켠 사용자에게는 애니메이션 없이 최종 위치로 보낸다
      initial={reducedMotion ? false : { y: 24 }}
      animate={{ y: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 0.55, delay: index * 0.05, ease: EASE_OUT }
      }
      className={cn(
        "group/bento relative isolate overflow-hidden rounded-lg border bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
