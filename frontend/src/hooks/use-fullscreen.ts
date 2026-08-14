"use client"

import { useSyncExternalStore } from "react"

// 외부 소스(fullscreenchange 이벤트) 구독은 useSyncExternalStore가 정석입니다.
// effect 안에서 초기값을 setState 하던 기존 방식은 마운트 직후 리렌더를 한 번 더 유발하고
// react-hooks/set-state-in-effect 규칙에도 걸렸습니다.
function subscribe(onStoreChange: () => void) {
  document.addEventListener("fullscreenchange", onStoreChange)
  return () => document.removeEventListener("fullscreenchange", onStoreChange)
}

function getSnapshot() {
  return !!document.fullscreenElement
}

// SSR에서는 document가 없으므로 기존 초기값과 동일하게 false
function getServerSnapshot() {
  return false
}

export function useFullscreen() {
  const isFullscreen = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  const enterFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error)
    }
  }

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error)
    }
  }

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  }
}
