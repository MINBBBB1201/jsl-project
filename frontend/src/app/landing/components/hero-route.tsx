"use client"

import * as React from "react"
import { motion, useAnimationFrame, useMotionValue } from "framer-motion"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

/**
 * 히어로 장식 — 점선 항로와 그 위를 도는 마커
 *
 * ── 의도 ────────────────────────────────────────────────────────────────
 * 화물이 경로를 따라 움직인다는 것만 말하는 장식이다. 실제 /tracking 기능과
 * 주제가 이어지지만 데이터를 그리지는 않는다. 그래서 눈금도 지명도 없다.
 *
 * 헤드라인을 방해하지 않는 것이 이 요소의 첫 번째 제약이다. 카피는 왼쪽
 * max-w-3xl 안에서 끝나므로 오른쪽 여백에만 놓고, 선은 opacity 0.45 로
 * 낮춘다. 카피와 겹칠 여지가 있는 lg 미만에서는 아예 그리지 않는다.
 *
 * ── 왜 offset-path 가 아니라 getPointAtLength 인가 ──────────────────────
 * CSS offset-path 로 하면 경로가 CSS 문자열과 SVG d 속성 두 곳에 중복으로
 * 적힌다. 한쪽만 고치면 점선과 마커가 다른 길을 간다. 여기서는 실제로
 * 그려진 path 요소에서 좌표를 뽑으므로 경로가 한 곳(ROUTE_D)에만 있다.
 *
 * ── 동작 줄이기 ─────────────────────────────────────────────────────────
 * 마커를 출발점에 세운 정적 상태로 보여준다. 점선 경로는 그대로 그린다 —
 * 애니메이션만 멈추는 것이지 그림을 지우는 것이 아니다.
 *
 * 도착점이 아니라 출발점에 세우는 데는 이유가 있다. 서버 HTML 에는 아직
 * 사용자 설정을 알 방법이 없어서 마커가 한 자리에 찍혀 나오고, 하이드레이션
 * 뒤에 다른 자리로 옮기면 그 이동이 눈에 보인다 — 애니메이션을 껐는데 화면이
 * 한 번 움직이는 셈이다 (실측: 뷰박스 좌상단에서 도착점까지 378px 튀었다).
 * 정지 위치를 애니메이션 시작점과 같은 자리로 맞추면 서버 HTML · 동작 줄이기
 * 정지 상태 · 애니메이션 0프레임이 모두 한 자리라 어느 경우에도 튀지 않는다.
 */

/** 한 바퀴 도는 데 걸리는 시간 (스펙: 6~8초) */
const CYCLE_MS = 7000

const VIEW_WIDTH = 320
const VIEW_HEIGHT = 520

/**
 * 완만한 S 커브 하나. 왼쪽 아래에서 오른쪽 위로 올라간다.
 *
 * 좌표는 이 뷰박스(320×520) 기준이고, 실제 크기는 부모가 정한다.
 * preserveAspectRatio 를 끄지 않았으므로 비율은 유지된다.
 *
 * 양 끝점은 상수로 빼서 d 문자열을 조립한다. 마커의 초기 좌표와 출발·도착
 * 표시 원이 같은 값을 봐야 해서다 — 문자열에만 적어 두면 경로를 손볼 때
 * 마커만 옛 자리에 남는다.
 */
const ROUTE_START = { x: 38, y: 484 }
const ROUTE_END = { x: 288, y: 40 }
const ROUTE_D = `M ${ROUTE_START.x} ${ROUTE_START.y} C 92 396 196 372 188 268 S 236 108 ${ROUTE_END.x} ${ROUTE_END.y}`

export function HeroRoute() {
  const reduced = usePrefersReducedMotion()
  const pathRef = React.useRef<SVGPathElement>(null)

  /*
    출발점에서 시작한다. 0 으로 두면 서버 HTML 에서 마커가 뷰박스 좌상단 —
    경로에서 한참 떨어진 자리 — 에 찍힌 채로 그려진다.
  */
  const x = useMotionValue(ROUTE_START.x)
  const y = useMotionValue(ROUTE_START.y)

  /*
    훅은 조건부로 부를 수 없어서 루프 자체는 항상 걸어 두고 콜백에서 빠져
    나온다. 동작 줄이기가 켜져 있으면 좌표를 건드리지 않으므로 마커는 위에서
    정한 출발점에 그대로 멈춰 있다.

    ⚠️ reduced 대신 초기값으로 자리를 잡는 이유는 파일 머리말에 적었다.
       usePrefersReducedMotion 은 useSyncExternalStore 라 하이드레이션 첫
       렌더에서 서버 스냅샷(false)을 돌려준다. 이 값을 보고 이펙트에서 자리를
       옮기면 동작 줄이기를 켠 사용자에게 그 이동이 그대로 보인다
       (count-up.tsx · lib/landing-motion.ts 의 같은 함정).
  */
  useAnimationFrame((time) => {
    if (reduced) return

    const path = pathRef.current
    if (!path) return

    const progress = (time % CYCLE_MS) / CYCLE_MS
    const point = path.getPointAtLength(path.getTotalLength() * progress)
    x.set(point.x)
    y.set(point.y)
  })

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[34%] max-w-[420px] items-center justify-center lg:flex"
    >
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="text-brand-orange h-full w-full"
        fill="none"
      >
        {/* 점선 경로 — 둥근 캡이라 짧은 대시가 점으로 찍힌다 */}
        <path
          ref={pathRef}
          d={ROUTE_D}
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="1 13"
          opacity={0.45}
        />

        {/* 출발·도착 표시. 경로가 어디서 시작해 어디서 끝나는지만 알려준다 */}
        <circle cx={ROUTE_START.x} cy={ROUTE_START.y} r={4} fill="currentColor" opacity={0.5} />
        <circle cx={ROUTE_END.x} cy={ROUTE_END.y} r={4} fill="currentColor" opacity={0.5} />

        {/*
          마커 — 좌표는 transform 으로 준다 (cx/cy 는 애니메이션이 무겁다).

          transform 속성은 하이드레이션 전에만 쓰인다. framer-motion 은 모션값
          기반 x/y 를 마운트 때 DOM 에 직접 얹기 때문에 서버 HTML 에는 아무
          변환도 실리지 않는다 — 실측해 보면 서버가 내려준 g 는 그냥 <g> 였고,
          마커가 뷰박스 좌상단(0,0)에 찍힌 채로 그려지다가 하이드레이션 뒤에
          제자리로 튀었다. 같은 자리를 속성으로도 적어 두면 그 사이가 메워진다.
          (CSS transform 이 속성보다 세서, 마운트 뒤에는 style 쪽이 이긴다.)
        */}
        <motion.g
          transform={`translate(${ROUTE_START.x} ${ROUTE_START.y})`}
          style={{ x, y }}
        >
          <circle r={12} fill="currentColor" opacity={0.18} />
          <circle r={5} fill="currentColor" />
        </motion.g>
      </svg>
    </div>
  )
}
