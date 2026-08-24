"use client"

import * as React from "react"
import { motion, useMotionTemplate, useMotionValue } from "framer-motion"

import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

/**
 * 커서를 따라오는 테두리 글로우
 *
 * Aceternity UI 의 Glowing Effect 와 같은 인상을 목표로 했지만 코드를 옮겨오지는
 * 않았다. 마우스 좌표를 framer-motion 의 MotionValue 에 담고, useMotionTemplate
 * 으로 radial-gradient 의 중심 좌표에 그대로 흘려 넣는다.
 *
 * ── 왜 useState 가 아니라 MotionValue 인가 ──────────────────────────────
 * pointermove 는 초당 60~120번 들어온다. 좌표를 state 에 담으면 그때마다 이
 * 컴포넌트와 자식 전체가 리렌더된다 (카드 세 장이면 화면 전체가 계속 다시
 * 그려진다). MotionValue 는 React 렌더를 거치지 않고 DOM 스타일만 직접 갱신해서
 * 리렌더가 0 이다.
 *
 * ── 테두리만 빛나게 하는 방법 ───────────────────────────────────────────
 * 그라디언트를 카드 전체에 깔면 배경이 물든다. 오버레이에 padding: 1px 을 주고
 * 마스크 두 장을 xor 로 합성해 가운데를 뚫으면, 1px 테두리 띠만 남는다.
 * 배경을 건드리지 않으므로 카드 안 글자 대비가 그대로다.
 *
 * ── 동작 줄이기 ─────────────────────────────────────────────────────────
 * 커서 추적 자체가 움직임이라 끈다. 대신 호버 시 테두리가 균일하게 한 번
 * 밝아진다 — 상호작용 피드백은 남기고 따라다니는 움직임만 없앤다.
 */

interface GlowCardProps extends React.ComponentProps<"div"> {
  /**
   * 렌더할 태그.
   *
   * ⚠️ 목록 안에서는 반드시 "li" 로 줄 것. <ul> 의 자식으로 <div> 를 넣으면
   *    브라우저 파서가 DOM 을 재구성해 서버 HTML 과 어긋나고, 하이드레이션
   *    불일치로 이어진다.
   */
  as?: "div" | "li"
  /** 글로우 원의 반지름(px). 카드가 크면 키운다 */
  radius?: number
  /** 테두리 글로우 최대 불투명도 */
  intensity?: number
}

export function GlowCard({
  as = "div",
  className,
  children,
  radius = 160,
  intensity = 0.55,
  ...props
}: GlowCardProps) {
  const reduced = usePrefersReducedMotion()
  /*
    ⚠️ ElementType 으로 한 번 낮춰서 받는다. "div" | "li" 를 그대로 JSX 태그로
       쓰면 TS 가 두 태그의 props 를 교집합으로 계산해서, ref 와 이벤트 핸들러가
       HTMLDivElement 와 HTMLLIElement 를 동시에 만족해야 하는 불가능한 타입이
       된다 (HTMLDivElement 에 li 의 value·type 이 없다는 오류). 받는 props 는
       위 인터페이스가 이미 div 기준으로 좁혀 두었으므로 호출부는 안전하다.
  */
  const Tag = as as React.ElementType
  const ref = React.useRef<HTMLElement>(null)

  /*
    카드 밖에서 시작한다. 마우스를 올리기 전에는 어차피 opacity 0 이지만,
    0,0 으로 두면 호버 첫 프레임에 좌상단에서 커서 자리로 튀어 들어온다.
  */
  const px = useMotionValue(-radius)
  const py = useMotionValue(-radius)
  const [hovered, setHovered] = React.useState(false)

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (reduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    px.set(event.clientX - rect.left)
    py.set(event.clientY - rect.top)
  }

  /*
    색은 --brand-orange 토큰 하나만 쓰고, 세기는 오버레이의 opacity 로만 준다.
    그라디언트 안에 알파를 섞은 색을 따로 만들면 토큰이 두 벌이 된다.
  */
  const glow = useMotionTemplate`radial-gradient(${radius}px circle at ${px}px ${py}px, var(--brand-orange), transparent 70%)`

  return (
    <Tag
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn("relative", className)}
      {...props}
    >
      {/* 테두리 띠 — 가운데를 마스크로 뚫어 1px 만 남긴다 */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] p-px"
        style={{
          background: reduced ? "var(--brand-orange)" : glow,
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
        initial={false}
        animate={{ opacity: hovered ? intensity : 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.25 }}
      />

      {/*
        안쪽으로 아주 옅게 번지는 빛. 테두리만 있으면 선이 하나 더 그어진 것처럼
        보여서, 카드 안쪽에 깔리는 약한 발광을 함께 둔다 (opacity 는 테두리의 1/5).
      */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ background: reduced ? "transparent" : glow }}
        initial={false}
        animate={{ opacity: hovered ? intensity * 0.2 : 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.25 }}
      />

      {children}
    </Tag>
  )
}
