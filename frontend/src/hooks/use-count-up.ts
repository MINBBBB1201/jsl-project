"use client"

import * as React from "react"
import gsap from "gsap"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

/**
 * 숫자가 0에서 실제 값까지 올라가는 애니메이션.
 *
 * 화면에 들어왔을 때 한 번만 실행한다 (IntersectionObserver). 스크롤할 때마다
 * 다시 세는 건 수치를 장식으로 만드는 짓이라, 처음 볼 때만 움직인다.
 *
 * React state 가 아니라 DOM textContent 를 직접 쓴다. 60fps 로 도는 동안
 * 매 프레임 리렌더를 걸면 프레임을 흘리기 때문이다.
 */
export function useCountUp(
  target: number | null,
  options: { durationSeconds?: number; format?: (value: number) => string } = {}
) {
  const { durationSeconds = 1.1, format = (value: number) => String(value) } = options
  const ref = React.useRef<HTMLSpanElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const hasAnimated = React.useRef(false)

  React.useEffect(() => {
    const element = ref.current
    if (!element || target === null) return

    // 값이 다시 들어오면(재조회) 처음부터 다시 셀 수 있게 초기화한다
    hasAnimated.current = false

    if (prefersReducedMotion) {
      element.textContent = format(target)
      return
    }

    const counter = { value: 0 }
    let tween: gsap.core.Tween | null = null

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry.isIntersecting || hasAnimated.current) return

        hasAnimated.current = true
        tween = gsap.to(counter, {
          value: target,
          duration: durationSeconds,
          // 빠르게 시작해 부드럽게 멈춘다 — 계기판이 값을 잡는 느낌
          ease: "power2.out",
          onUpdate: () => {
            element.textContent = format(Math.round(counter.value))
          },
        })
      },
      { threshold: 0.4 }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
      tween?.kill()
    }
  }, [target, durationSeconds, format, prefersReducedMotion])

  return ref
}
