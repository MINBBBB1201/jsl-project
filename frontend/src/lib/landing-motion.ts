"use client"

import type { Variants } from "framer-motion"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

/**
 * 랜딩 리디자인 스크롤 리빌 프리셋
 *
 * 세 섹션(히어로 · What We Do · Why JSL)이 같은 타이밍으로 등장해야 해서
 * 값을 한 곳에 모았다. 섹션마다 숫자를 적어 두면 하나를 고칠 때 나머지가
 * 남아 리듬이 어긋난다.
 *
 * 이징 상수를 이름 붙여 두고 동작 줄이기를 컴포넌트에서 직접 확인하는 방식은
 * components/ui/bento-grid.tsx 를 따랐다 — 이 프로젝트에서 framer-motion 을
 * 쓰는 유일한 선례다.
 */

/** 스펙값 — LogiLand 데모에서 실측한 타이밍 */
export const REVEAL_DURATION = 0.8
export const REVEAL_STAGGER = 0.1
export const REVEAL_OFFSET_Y = 40
export const REVEAL_OFFSET_X = 60

/** 큐빅 베지어 네 점 */
export const REVEAL_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

/** 요소의 20% 가 보이면 시작하고, 한 번만 재생한다 */
export const REVEAL_VIEWPORT = { once: true, amount: 0.2 } as const

/**
 * 리빌에 필요한 것을 한 벌로 돌려준다.
 *
 * ── 동작 줄이기를 variants 안쪽에서 처리하는 이유 ───────────────────────
 * 처음에는 `initial` 만 false 로 바꿔 봤는데 애니메이션이 그대로 재생됐다.
 * usePrefersReducedMotion 은 useSyncExternalStore 라 하이드레이션 첫 렌더에서
 * 서버 스냅샷(false)을 돌려주고, 그 한 프레임 사이에 framer-motion 이 이미
 * 트윈을 시작해 버린다. 두 번째 렌더에서 true 가 와도 진행 중인 트윈은
 * 멈추지 않는다 (실측: opacity 0.06~0.57 로 재생 중이었다).
 *
 * 그래서 플래그를 variants 자체에 녹인다. 동작 줄이기가 켜지면 duration 과
 * stagger 가 0 이고 이동 거리도 0 이라, 트윈이 이미 시작됐더라도 다음 렌더에서
 * 즉시 최종 상태로 스냅한다. 뷰포트에 의존하지 않도록 whileInView 대신
 * animate 를 쓰는 것도 함께 필요하다 — whileInView 는 화면 밖 요소를 계속
 * hidden 에 붙들어 두므로, 스크롤하지 않으면 콘텐츠가 투명한 채로 남는다.
 *
 * 동작 줄이기는 애니메이션을 끄는 것이지 콘텐츠를 감추는 것이 아니다.
 */
export function useRevealMotion() {
  const reduced = usePrefersReducedMotion()

  const transition = reduced
    ? { duration: 0 }
    : { duration: REVEAL_DURATION, ease: REVEAL_EASE }

  /** 리빌 컨테이너에 그대로 펼쳐 넣는 props */
  const reveal = reduced
    ? ({ initial: false, animate: "visible" } as const)
    : ({
        initial: "hidden",
        whileInView: "visible",
        viewport: REVEAL_VIEWPORT,
      } as const)

  /** 자식들을 100ms 간격으로 순차 등장시키는 부모 (그리는 것은 없다) */
  const parent: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduced ? 0 : REVEAL_STAGGER },
    },
  }

  /** 아래에서 위로 슬라이드 + 페이드 — 그리드 카드용 */
  const up: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : REVEAL_OFFSET_Y },
    visible: { opacity: 1, y: 0, transition },
  }

  /**
   * 가로 슬라이드 + 페이드 — 좌우 스플릿 섹션용.
   *
   * `from` 은 시작 x 오프셋이다. 왼쪽 컬럼에 +값을 주면 오른쪽에서 들어오고,
   * 오른쪽 컬럼에 -값을 주면 왼쪽에서 들어온다 — 두 컬럼이 가운데로 모인다.
   */
  const x = (from: number): Variants => ({
    hidden: { opacity: 0, x: reduced ? 0 : from },
    visible: { opacity: 1, x: 0, transition },
  })

  return { reveal, parent, up, x }
}
