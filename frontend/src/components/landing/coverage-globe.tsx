"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

import { NetworkBeams, type NetworkNode } from "@/components/landing/network-beams"

/**
 * 서비스 커버리지 지구본 — 마운트 게이트
 *
 * 실제 그림은 coverage-globe-canvas.tsx 가 그린다. 이 파일은 "언제 그릴지"와
 * "못 그리면 어떻게 할지"만 정한다.
 *
 *   1. next/dynamic(ssr:false)  — WebGL 코드가 초기 번들에 실리지 않는다.
 *      서버에서는 그릴 수 없기도 하다 (캔버스가 없다).
 *   2. IntersectionObserver     — 섹션이 화면에 들어와야 캔버스를 만든다.
 *      랜딩 한참 아래에 있는 섹션이라, 안 그러면 첫 화면을 그리는 동안
 *      보이지도 않는 지구본이 GPU 를 잡는다.
 *   3. try/catch → NetworkBeams — WebGL 을 못 쓰면 기존 연결선 도식으로 되돌린다.
 *      도식은 지우지 않고 남겨 뒀다. 정보가 사라지지 않는 것이 중요하다.
 */

const CoverageGlobeCanvas = dynamic(
  () => import("./coverage-globe-canvas").then((mod) => mod.CoverageGlobeCanvas),
  { ssr: false }
)

/** 뷰포트에 이만큼 못 미쳐도 미리 준비한다 — 스크롤이 닿았을 때 이미 그려져 있게 */
const PRELOAD_MARGIN = "200px"

/** 지구본이 차지할 폭. 정사각이라 그대로 높이가 된다 */
const GLOBE_MAX_WIDTH = "32rem"

export function CoverageGlobe({
  hub,
  spokes,
  headcountUnit,
  label,
}: {
  hub: NetworkNode
  spokes: NetworkNode[]
  headcountUnit: string
  label: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [failed, setFailed] = useState(false)

  // 캔버스가 매번 새 함수를 받아 effect 를 다시 돌리지 않도록 고정한다
  const handleFailure = useCallback(() => setFailed(true), [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setVisible(true)
        // 한 번 켜지면 다시 끄지 않는다 — 스크롤할 때마다 지구본을 다시 만들 이유가 없다
        observer.disconnect()
      },
      { rootMargin: PRELOAD_MARGIN }
    )

    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  if (failed) {
    return (
      <NetworkBeams
        hub={hub}
        spokes={spokes}
        headcountUnit={headcountUnit}
        label={label}
      />
    )
  }

  return (
    <div ref={hostRef} className="flex justify-center">
      {/*
        자리를 미리 잡아 둔다. 캔버스가 뒤늦게 들어오면서 아래 카드 그리드를
        밀어내지 않도록 폭·비율을 여기서 고정한다.
      */}
      <div
        className="aspect-square w-full"
        style={{ maxWidth: GLOBE_MAX_WIDTH }}
      >
        {visible ? (
          <CoverageGlobeCanvas label={label} onFailure={handleFailure} />
        ) : null}
      </div>
    </div>
  )
}
