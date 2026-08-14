import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// 외부 소스(matchMedia) 구독은 useSyncExternalStore가 정석입니다.
// effect 안에서 setState 하던 기존 방식은 마운트 직후 리렌더를 한 번 더 유발하고
// react-hooks/set-state-in-effect 규칙에도 걸렸습니다.
function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

// SSR/최초 렌더에서는 window가 없으므로 기존 동작(!!undefined === false)과 동일하게 false
function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
