"use client"

import * as React from "react"
import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

/**
 * 스크롤 진입 시 0 에서 실제값까지 올라가는 수치
 *
 * ── 왜 문자열을 받아 파싱하는가 ─────────────────────────────────────────
 * 통계값은 번역 파일에서 온다. 같은 수치라도 언어마다 숫자가 놓이는 자리가
 * 다르다 — "180억원"(ko) · "180亿韩元"(zh) 는 숫자가 앞이지만 "KRW 18B"(en)
 * 은 가운데, "18 tỷ KRW"(vi) 는 앞이고 단위가 뒤에 두 덩어리다. 그래서 숫자를
 * 따로 관리하지 않고 완성된 문자열에서 첫 숫자 덩어리만 찾아 그 자리만
 * 굴린다. 앞뒤 글자는 그대로 두므로 단위 표기(억원 · % · 톤)가 보존된다.
 *
 * ── 동작 줄이기 ─────────────────────────────────────────────────────────
 * 최종값을 즉시 표시한다. 카운트업을 건너뛸 뿐 수치를 감추지 않는다.
 * 판정을 훅의 반환값이 아니라 matchMedia 로 직접 하는 이유는 아래 레이아웃
 * 이펙트 주석에 적었다 (lib/landing-motion.ts 의 같은 함정).
 */

/** 스펙값 — 약 1.2초 */
const COUNT_DURATION = 1.2

/**
 * 감속 이징.
 *
 * 리빌에 쓰는 REVEAL_EASE 는 ease-in-out 이라 시작이 느리다. 숫자는 곧바로
 * 튀어나와 끝에서 잦아드는 편이 "세어 올라간다"는 느낌에 맞아 따로 둔다.
 */
const COUNT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** 40% 가 보이면 시작하고, 한 번만 재생한다 */
const COUNT_VIEWPORT = { once: true, amount: 0.4 } as const

/** 첫 숫자 덩어리 — 천단위 쉼표와 소수점을 포함한다 */
const NUMBER_PATTERN = /\d[\d,]*(?:\.\d+)?/

interface ParsedValue {
  /** 숫자 앞 글자 (en 의 "KRW ") */
  prefix: string
  /** 숫자 뒤 글자 (ko 의 "억원", "개사+") */
  suffix: string
  target: number
  decimals: number
  grouped: boolean
}

function parseValue(value: string): ParsedValue | null {
  const match = NUMBER_PATTERN.exec(value)
  if (!match) return null

  const literal = match[0]
  const target = Number(literal.replace(/,/g, ""))
  if (!Number.isFinite(target)) return null

  const dot = literal.indexOf(".")

  return {
    prefix: value.slice(0, match.index),
    suffix: value.slice(match.index + literal.length),
    target,
    decimals: dot === -1 ? 0 : literal.length - dot - 1,
    grouped: literal.includes(","),
  }
}

/** 원본 표기를 따라간다 — 쉼표가 없던 값에 쉼표를 새로 만들지 않는다 */
function formatCount(current: number, parsed: ParsedValue) {
  const fixed = current.toFixed(parsed.decimals)
  if (!parsed.grouped) return fixed

  return Number(fixed).toLocaleString("en-US", {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
  })
}

/** 하이드레이션 직후 첫 페인트 전에 값을 내리기 위해 레이아웃 이펙트가 필요하다 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

interface CountUpProps {
  /** 번역 파일에서 온 완성된 표기. 예: "180억원", "KRW 18B", "30개사+" */
  value: string
  className?: string
}

export function CountUp({ value, className }: CountUpProps) {
  const reduced = usePrefersReducedMotion()
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, COUNT_VIEWPORT)

  const parsed = React.useMemo(() => parseValue(value), [value])

  /*
    최종값에서 출발한다. 0 에서 시작하면 서버 HTML 에 "0억원" 이 박혀서,
    JS 가 늦거나 꺼진 환경·크롤러에는 그 값이 그대로 남는다.
  */
  const count = useMotionValue(parsed?.target ?? 0)
  const text = useTransform(count, (current) =>
    parsed ? formatCount(current, parsed) : value
  )

  /*
    하이드레이션이 끝나면 페인트 전에 0 으로 내린다. useEffect 로 하면 이미
    최종값이 한 번 그려진 뒤라 스크롤해 들어오는 순간 180 → 0 → 180 으로
    되튀는 게 보인다.

    ⚠️ 여기서 usePrefersReducedMotion 의 반환값을 쓰면 안 된다.
       useSyncExternalStore 는 하이드레이션 첫 렌더에서 서버 스냅샷(false)을
       돌려주므로, 이 이펙트가 도는 시점의 reduced 는 아직 false 다. 동작
       줄이기를 켠 사용자도 숫자가 0 으로 떨어진다 (lib/landing-motion.ts 에
       적힌 것과 같은 함정). 미디어쿼리를 직접 읽어야 한다.
  */
  useIsomorphicLayoutEffect(() => {
    if (!parsed) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    count.set(0)
    // 마운트 시 1회. parsed·count 는 value 가 그대로면 바뀌지 않는다.
    // (exhaustive-deps 는 이 커스텀 훅 이름을 이펙트로 보지 않아 경고하지 않는다)
  }, [])

  React.useEffect(() => {
    if (!parsed || reduced || !inView) return

    const controls = animate(count, parsed.target, {
      duration: COUNT_DURATION,
      ease: COUNT_EASE,
    })

    return () => controls.stop()
  }, [count, inView, parsed, reduced])

  if (!parsed) {
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    )
  }

  return (
    /*
      aria-label 로 완성된 표기를 통째로 준다. 굴러가는 동안 스크린리더가
      중간값을 계속 읽어 주는 것을 막고, 읽히는 값은 항상 최종값이다.
    */
    <span ref={ref} className={className} aria-label={value}>
      <span aria-hidden="true">
        {parsed.prefix}
        {/*
          숫자 자리만 Poppins 다 (lib/fonts.ts). prefix·suffix 는 로케일 언어가
          섞이는 자리라 그대로 둔다 — "180|억원" 은 어차피 한글이 Poppins 범위
          밖이라 상관없지만, 베트남어 "18| tỷ KRW" 는 't' 와 'ỷ' 가 서로 다른
          폰트로 그려져 한 단어가 갈라진다. 이미 prefix/숫자/suffix 로 쪼개 두었
          으므로 경계를 여기서 지키면 된다.
        */}
        <motion.span className="font-poppins">{text}</motion.span>
        {parsed.suffix}
      </span>
    </span>
  )
}
