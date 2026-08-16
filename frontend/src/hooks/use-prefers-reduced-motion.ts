"use client"

import * as React from "react"

/**
 * OS 의 "동작 줄이기" 설정을 읽는다.
 *
 * CSS 미디어쿼리로는 JS 가 만드는 애니메이션(GSAP 트윈 등)을 막을 수 없어서
 * 컴포넌트에서 직접 확인해야 한다. 설정을 켠 사용자에게는 애니메이션을 건너뛰고
 * 최종 상태를 바로 보여준다 — 콘텐츠를 감추는 것이 아니다.
 *
 * useState + useEffect 대신 useSyncExternalStore 를 쓴다. 미디어쿼리는 React
 * 바깥의 상태라, 이걸 state 로 복사해 두면 첫 렌더와 effect 사이에 한 프레임
 * 어긋나고(그 사이 애니메이션이 시작된다) 렌더가 한 번 더 돈다.
 * 서버에서는 알 수 없으므로 false 로 시작한다.
 */
const QUERY = "(prefers-reduced-motion: reduce)"

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

const getSnapshot = () => window.matchMedia(QUERY).matches

const getServerSnapshot = () => false

export function usePrefersReducedMotion() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
