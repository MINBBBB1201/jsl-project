"use client"

import { Component, useSyncExternalStore, type ReactNode } from "react"
import dynamic from "next/dynamic"
import { Box, TriangleAlert } from "lucide-react"

import { supportsWebGL } from "@/lib/brand-colors"
import type { ContainerSpec, LoadPlan } from "@/lib/container-planner"

/**
 * 컨테이너 적재 뷰어 — 마운트 게이트
 *
 * 실제 그림은 container-scene.tsx 가 그린다. 이 파일은 "언제 그릴지"와
 * "못 그리면 어떻게 할지"만 정한다.
 *
 *   1. next/dynamic(ssr:false)  — three.js 가 초기 번들에 실리지 않는다.
 *      서버에는 WebGL 도 캔버스도 없어서 어차피 그릴 수 없다.
 *   2. supportsWebGL() 사전 확인 — 아래 주석 참고.
 *   3. 에러 경계               — 사전 확인을 통과하고도 렌더러 생성이 실패하는
 *                                경우(드라이버 문제, 컨텍스트 수 초과)를 받는다.
 *
 * ⚠️ IntersectionObserver 지연 마운트는 일부러 넣지 않았다.
 *    지구본은 랜딩 한참 아래에 있는 배경 요소라, 첫 화면을 그리는 동안 보이지도
 *    않는 캔버스가 GPU 를 잡는 것을 막을 실익이 있었다. 여기는 반대로 이 뷰어가
 *    페이지의 주 콘텐츠이고 헤더 바로 아래 첫 화면에 들어온다. 관찰자를 달아 봐야
 *    마운트 직후 즉시 교차 판정이 나서, 얻는 것 없이 콜백 한 틱만큼 첫 그림이
 *    늦어지고 코드만 늘어난다.
 */

const ContainerScene = dynamic(
  () => import("./container-scene").then((mod) => mod.ContainerScene),
  { ssr: false }
)

/** 뷰어가 차지할 높이. 화물이 뭉개지지 않게 넉넉히 준다 */
const VIEWER_HEIGHT = "clamp(24rem, 56vh, 40rem)"

/**
 * WebGL 을 못 쓸 때 대신 보여줄 요약.
 *
 * 랜딩의 NetworkBeams 처럼 그래픽으로 대체하지 않는다. 적재 계획은 숫자만으로도
 * 의미가 있는 정보라, 3D 를 못 그린다고 해서 사용자가 알아야 할 것이 사라지지는
 * 않는다. 3단계에서 붙일 결과 패널의 축소판이라고 보면 된다.
 */
function LoadPlanSummary({ plan }: { plan: LoadPlan }) {
  const cog = plan.centerOfGravity
  const rows: { label: string; value: string }[] = [
    { label: "컨테이너", value: plan.container.label },
    { label: "적재 수량", value: `${plan.placed.length}개` },
    {
      label: "적재율(부피)",
      value: `${plan.volumeUtilizationPercent}%  (${plan.usedVolumeM3} / ${plan.containerVolumeM3} ㎥)`,
    },
    {
      label: "적재 중량",
      value: `${plan.totalWeightKg.toLocaleString()} / ${plan.maxPayloadKg.toLocaleString()} kg  (${plan.weightUtilizationPercent}%)`,
    },
    {
      label: "무게중심",
      value:
        `길이 ${cog.offsetPercent[0]}% · 폭 ${cog.offsetPercent[1]}%` +
        `  → 기준 ±${cog.tolerancePercent}% ${cog.withinTolerance ? "합격" : "불합격"}`,
    },
  ]

  return (
    <div className="rounded-lg border bg-muted/30 p-6">
      <div className="flex items-start gap-3">
        <TriangleAlert
          className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <div>
          <p className="font-medium">3D 미리보기를 표시할 수 없습니다</p>
          <p className="mt-1 text-sm text-muted-foreground">
            이 브라우저에서 WebGL 을 쓸 수 없습니다. 적재 계산 결과는 아래에서
            그대로 확인할 수 있습니다.
          </p>
        </div>
      </div>

      <dl className="mt-6 divide-y border-t text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-4"
          >
            <dt className="shrink-0 text-muted-foreground sm:w-32">{row.label}</dt>
            <dd className="font-medium tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>

      {plan.unplaced.length > 0 ? (
        <div className="mt-4 border-t pt-4">
          <p className="text-sm font-medium">미적재</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {plan.unplaced.map((item) => (
              <li key={`${item.boxId}:${item.reason}`}>
                {item.box.name} {item.quantity}개
                <span className="ml-1 font-mono text-xs">({item.reason})</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

/**
 * 렌더러 생성 실패를 잡는 경계.
 *
 * ⚠️ try/catch 로는 못 잡는다. three 의 WebGLRenderer 는 컨텍스트를 못 얻으면
 *    예외를 던지지만(r185 WebGLRenderer.js:405), 그 생성은 react-three-fiber 가
 *    자기 리컨사일러 안에서 하므로 <Canvas> 를 감싼 try/catch 바깥으로 나오지
 *    않는다. 리액트 렌더 트리에서 올라오는 예외라 에러 경계로만 받을 수 있다.
 */
class WebGLErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/**
 * WebGL 지원 여부 — 세션 동안 바뀌지 않는 값이라 한 번만 확인하고 캐시한다.
 *
 * 확인 자체가 캔버스를 만들어 컨텍스트를 얻어 보는 일이라 렌더마다 하면 낭비다.
 */
let webglSupportCache: boolean | null = null

function getWebglSnapshot(): boolean {
  webglSupportCache ??= supportsWebGL()
  return webglSupportCache
}

/**
 * 서버에서는 판정할 수 없다. null 을 돌려 "아직 모름"으로 두고, 하이드레이션이
 * 끝난 뒤 클라이언트 스냅샷이 진짜 값으로 바꿔 준다.
 */
function getWebglServerSnapshot(): boolean | null {
  return null
}

/** 바뀔 일이 없는 값이라 구독할 것이 없다 */
function subscribeToNothing(): () => void {
  return () => {}
}

export function ContainerViewer({
  container,
  plan,
  label,
}: {
  container: ContainerSpec
  plan: LoadPlan
  label: string
}) {
  /**
   * null = 아직 확인 전(서버/하이드레이션). 확인은 렌더 중에 document 를 만지는
   * 일이라 그냥 하면 하이드레이션이 어긋나고, 이펙트에서 setState 하면 계단식
   * 렌더가 된다. useSyncExternalStore 가 두 문제를 한 번에 해결해 준다 —
   * 서버 스냅샷으로 첫 렌더를 맞추고, 하이드레이션 뒤 실제 값으로 넘어간다.
   */
  const webglOk = useSyncExternalStore(
    subscribeToNothing,
    getWebglSnapshot,
    getWebglServerSnapshot
  )

  const fallback = <LoadPlanSummary plan={plan} />

  if (webglOk === false) return fallback

  return (
    <WebGLErrorBoundary fallback={fallback}>
      <div
        className="w-full overflow-hidden rounded-lg border bg-muted/20"
        style={{ height: VIEWER_HEIGHT }}
      >
        {webglOk ? (
          <ContainerScene container={container} plan={plan} label={label} />
        ) : (
          /* 확인이 끝나기 전 한 프레임 — 자리만 잡아 둔다 */
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Box className="h-6 w-6 animate-pulse" aria-hidden />
            <span className="sr-only">3D 미리보기를 준비하고 있습니다</span>
          </div>
        )}
      </div>

      {/*
        조작 안내는 캔버스가 실제로 그려질 때만 보여야 한다. 폴백 화면에서
        "드래그로 회전"이라고 적혀 있으면 돌리지도 않는 그림을 돌려 보라는 말이 된다.
      */}
      {webglOk ? (
        <p className="mt-3 text-xs text-muted-foreground">
          드래그로 회전 · 스크롤로 확대·축소
        </p>
      ) : null}
    </WebGLErrorBoundary>
  )
}
