"use client"

import { useEffect, useRef } from "react"
import createGlobe, { type Arc, type COBEOptions, type Marker } from "cobe"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

/**
 * 서비스 커버리지 지구본 (COBE 캔버스)
 *
 * COBE(https://github.com/shuding/cobe, MIT, 의존성 없음)를 그대로 쓰고 색과
 * 데이터만 우리 것으로 바꿨다. 점으로 찍힌 세계지도 위에 실제 거점 다섯 곳을
 * 마커로, 실제 운영 노선 일곱 개를 아크로 얹는다.
 *
 * ⚠️ 이 파일은 coverage-globe.tsx 가 next/dynamic 으로만 불러온다. 직접
 *    import 하면 초기 번들에 WebGL 코드가 실려 들어간다.
 *
 * ⚠️ createGlobe 는 WebGL 컨텍스트를 못 얻으면 던진다. 여기서 잡지 않고
 *    onFailure 로 올려 보내면 호출부가 기존 NetworkBeams 도식으로 되돌린다.
 */

/**
 * 거점 좌표 [위도, 경도] — use-content.ts 의 OFFICE_FACTS 와 같은 순서다.
 * 도시가 바뀌면 저쪽 목록과 함께 고칠 것.
 */
const SEOUL: [number, number] = [37.5665, 126.978]
const SHANGHAI: [number, number] = [31.2304, 121.4737]
const WEIHAI: [number, number] = [37.5128, 122.1201]
const GUANGZHOU: [number, number] = [23.1291, 113.2644]
const HANOI: [number, number] = [21.0278, 105.8342]

/**
 * ⚠️ 유럽·미국 노선의 도착 도시는 아직 정해지지 않았다. 항공화물 허브인
 *    프랑크푸르트와 로스앤젤레스를 대표 좌표로 임시로 쓴다. 실제 취항 도시가
 *    확정되면 이 두 상수만 바꾸면 된다.
 *
 *    이 둘에는 마커를 찍지 않는다 — 확정되지 않은 지점을 다섯 거점과 같은
 *    점으로 표시하면 "여기에도 사무소가 있다"고 말하는 셈이 된다. 선만 뻗는다.
 */
const FRANKFURT: [number, number] = [50.0379, 8.5622]
const LOS_ANGELES: [number, number] = [33.9416, -118.4085]

/** 본사는 지사보다 한 단계 크게 — 다섯 점이 같으면 어디가 중심인지 말하지 못한다 */
const HQ_MARKER_SIZE = 0.1
const BRANCH_MARKER_SIZE = 0.065

const MARKERS: Marker[] = [
  { location: SEOUL, size: HQ_MARKER_SIZE },
  { location: SHANGHAI, size: BRANCH_MARKER_SIZE },
  { location: WEIHAI, size: BRANCH_MARKER_SIZE },
  { location: GUANGZHOU, size: BRANCH_MARKER_SIZE },
  { location: HANOI, size: BRANCH_MARKER_SIZE },
]

/**
 * 실제 운영 노선 일곱 개 (landing-content.ts 의 서비스 설명 기준).
 *
 *   광주 → 위해    항공 (화남 → 산동)
 *   위해 → 서울    항공/페리 (산동 → 인천)
 *   광주 → 상해    해상-항공 (광동 → 상해 CFS 통합)
 *   상해 → 서울    해상-항공 (상해 CFS → 인천 환적)
 *   광주 → 하노이  육상 국경통과
 *   서울 → 유럽    항공 / 해상-항공
 *   서울 → 미국    항공 / 해상-항공
 */
const ROUTES: { from: [number, number]; to: [number, number] }[] = [
  { from: GUANGZHOU, to: WEIHAI },
  { from: WEIHAI, to: SEOUL },
  { from: GUANGZHOU, to: SHANGHAI },
  { from: SHANGHAI, to: SEOUL },
  { from: GUANGZHOU, to: HANOI },
  { from: SEOUL, to: FRANKFURT },
  { from: SEOUL, to: LOS_ANGELES },
]

/** 지구 표면에 붙지 않고 대기권 위를 날아가는 느낌 */
const ARC_HEIGHT = 0.35
const ARC_WIDTH = 0.5

/* ── 항로 흐름 애니메이션 ────────────────────────────────────────────────
 *
 * 노선마다 경로 전체를 옅게 깔아 두고(배경선), 그 위를 짧고 진한 구간이
 * 오간다. 점 하나가 움직이는 것이 아니라 선 자체가 이동하는 것처럼 보여야 해서,
 * 매 프레임 대원거리 위의 두 지점을 구해 짧은 아크를 하나 더 얹는다.
 *
 * COBE 는 아크를 "출발·도착 위경도" 로만 받는다. 그래서 경로 중간 지점을
 * 우리가 계산해야 하는데, 위경도를 그대로 선형보간하면 경로가 지도상의 직선이
 * 되어 배경선(대원거리)에서 벗어난다. 단위벡터로 바꿔 보간한 뒤 다시 정규화하면
 * (nlerp) 구면 위를 따라간다.
 */

type Vec3 = readonly [number, number, number]

const DEG = Math.PI / 180

function toVec3([lat, lng]: [number, number]): Vec3 {
  const latRad = lat * DEG
  const lngRad = lng * DEG
  const cosLat = Math.cos(latRad)
  return [cosLat * Math.cos(lngRad), Math.sin(latRad), cosLat * Math.sin(lngRad)]
}

function toLatLng([x, y, z]: Vec3): [number, number] {
  return [Math.asin(y) / DEG, Math.atan2(z, x) / DEG]
}

/** 두 단위벡터 사이를 선형보간하고 다시 정규화한다 */
function nlerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const x = a[0] + (b[0] - a[0]) * t
  const y = a[1] + (b[1] - a[1]) * t
  const z = a[2] + (b[2] - a[2]) * t
  const length = Math.hypot(x, y, z) || 1
  return [x / length, y / length, z / length]
}

/**
 * 노선 끝점의 단위벡터는 변하지 않는다. 매 프레임 삼각함수를 다시 돌릴 이유가
 * 없어 모듈이 로드될 때 한 번만 구해 둔다 — 프레임마다 남는 계산은 nlerp 와
 * 되돌리는 asin/atan2 뿐이다.
 */
const ROUTE_VECTORS = ROUTES.map((route) => ({
  from: toVec3(route.from),
  to: toVec3(route.to),
}))

/** 하이라이트 구간의 절반 길이 (경로 전체를 1 로 봤을 때) */
const TRAIL = 0.1

/**
 * 노선마다 왕복 주기(초)와 시작 위상을 달리 준다.
 *
 * 일곱 개가 같은 박자로 움직이면 화물이 오가는 것이 아니라 장식 하나가
 * 깜빡이는 것으로 보인다. 주기를 서로 배수가 아닌 값으로 골라 겹치는 순간이
 * 자주 오지 않게 했다 (network-beams 의 펄스 지연과 같은 이유다).
 */
const FLOW = [
  { period: 5.2, phase: 0 },
  { period: 6.7, phase: 0.31 },
  { period: 4.3, phase: 0.62 },
  { period: 7.9, phase: 0.14 },
  { period: 5.8, phase: 0.83 },
  { period: 7.1, phase: 0.47 },
  { period: 6.1, phase: 0.68 },
]

/** 0 → 1 → 0 을 반복하는 삼각파. 화물이 오갔다가 돌아오는 왕복이다 */
function triangleWave(seconds: number, period: number, phase: number) {
  const cycle = (((seconds / period + phase) % 1) + 1) % 1
  return cycle < 0.5 ? cycle * 2 : 2 - cycle * 2
}

/**
 * 시작 각도 — 동아시아가 정면에 오게 맞춘 값이다.
 *
 * 실측으로 잡았다. phi=2 에서 거점 다섯이 중앙 왼쪽, phi=3 에서 중앙 오른쪽에
 * 걸리고, 그 사이 2.5 에서 정면에 온다. phi=4 부터는 오른쪽 가장자리로 밀려
 * 나가고 5 를 넘으면 지구 뒤편으로 사라진다.
 *
 * 동작 줄이기에서는 회전하지 않으므로 이 각도가 그대로 최종 화면이 된다 —
 * 값을 바꿀 때는 거점이 정면에 남는지 반드시 확인할 것.
 */
const INITIAL_PHI = 2.5
/** 북반구를 살짝 위로 기울여 다섯 거점이 적도선에 눌리지 않게 한다 */
const THETA = 0.3
/** 한 프레임당 회전량(라디안). 한 바퀴에 약 50초 — 눈에 거슬리지 않을 만큼 느리게 */
const PHI_STEP = 0.002

/**
 * 토큰을 못 읽었을 때 쓸 값. globals.css 의 브랜드 토큰을 sRGB 로 옮긴 것이다.
 *   --brand-navy   oklch(0.28 0.089 254.6)   → #012853
 *   --brand-orange oklch(0.676 0.175 51.3)   → #e87002
 *   --brand-slate  oklch(0.7088 0.0444 254.9) → #8fa3bd
 */
const FALLBACK_NAVY: [number, number, number] = [0.005, 0.157, 0.326]
const FALLBACK_ORANGE: [number, number, number] = [0.91, 0.441, 0.008]
const FALLBACK_SLATE: [number, number, number] = [0.56, 0.639, 0.741]

/**
 * WebGL 을 쓸 수 있는지 미리 본다.
 *
 * ⚠️ createGlobe 는 WebGL 컨텍스트를 못 얻어도 예외를 던지지 않는다 (v2.0.1 에서
 *    확인). 그래서 try/catch 만 두면 아무것도 그려지지 않은 빈 캔버스가 그대로
 *    남고 폴백이 걸리지 않는다. 만들기 전에 직접 확인해야 한다.
 */
function supportsWebGL() {
  try {
    const probe = document.createElement("canvas")
    return Boolean(probe.getContext("webgl2") ?? probe.getContext("webgl"))
  } catch {
    return false
  }
}

/**
 * CSS 색 문자열을 COBE 가 쓰는 0~1 RGB 로 바꾼다.
 *
 * 브랜드 토큰이 oklch() 라 getComputedStyle 결과를 숫자로 쪼갤 수 없다. 1×1
 * 캔버스에 그 색으로 한 픽셀을 찍고 되읽으면 브라우저의 색 변환을 그대로
 * 빌려 쓸 수 있다 — 우리가 oklch 변환식을 들고 있을 이유가 없다.
 */
function cssColorToRgb(
  value: string,
  fallback: [number, number, number]
): [number, number, number] {
  const color = value.trim()
  if (!color) return fallback

  try {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return fallback

    // 파싱에 실패하면 fillStyle 이 그대로 남는다 — 센티넬로 구분한다
    ctx.fillStyle = "#000000"
    ctx.fillStyle = color
    if (ctx.fillStyle === "#000000") return fallback

    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return [r / 255, g / 255, b / 255]
  } catch {
    // 색 하나 때문에 지구본을 통째로 날리지 않는다
    return fallback
  }
}

/** 배경 경로선을 만들 때 채도를 죽이는 정도와 어둡게 하는 정도 */
const TRACK_DESATURATE = 0.55
const TRACK_DARKEN = 0.72

/**
 * 배경 경로선용으로 오렌지의 채도와 밝기를 낮춘다.
 *
 * 새 색을 하드코딩하지 않고 브랜드 오렌지에서 만들어 쓴다 — 토큰이 바뀌면
 * 배경선도 같이 따라오고, 하이라이트와 같은 계열이라는 것도 보장된다.
 */
function toTrackColor([r, g, b]: [number, number, number]): [number, number, number] {
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
  const flatten = (channel: number) =>
    (channel + (luma - channel) * TRACK_DESATURATE) * TRACK_DARKEN
  return [flatten(r), flatten(g), flatten(b)]
}

interface GlobeTheme {
  /*
    createGlobe / update 에 그대로 넘기는 것들.

    Partial 이 아니라 Pick 이어야 한다 — Partial 로 두면 펼쳐 넣었을 때
    COBEOptions 의 필수 항목(mapBrightness 등)이 optional 로 약해져서
    createGlobe 가 타입을 거부한다.
  */
  options: Pick<
    COBEOptions,
    "baseColor" | "markerColor" | "glowColor" | "dark" | "mapBrightness"
  >
  /** 경로 배경선 — 옅은 오렌지 */
  trackColor: [number, number, number]
  /** 이동 하이라이트 — 브랜드 오렌지 원색 */
  flowColor: [number, number, number]
}

function readTheme(): GlobeTheme {
  const styles = getComputedStyle(document.documentElement)
  const isDark = document.documentElement.classList.contains("dark")
  const orange = cssColorToRgb(
    styles.getPropertyValue("--brand-orange"),
    FALLBACK_ORANGE
  )

  return {
    options: {
      baseColor: cssColorToRgb(styles.getPropertyValue("--brand-navy"), FALLBACK_NAVY),
      markerColor: orange,
      glowColor: cssColorToRgb(styles.getPropertyValue("--brand-slate"), FALLBACK_SLATE),
      dark: isDark ? 1 : 0,
      /* 라이트 배경에서는 점 지도가 더 밝아야 네이비가 뭉개지지 않는다 */
      mapBrightness: isDark ? 4 : 6,
    },
    trackColor: toTrackColor(orange),
    flowColor: orange,
  }
}

/**
 * 그 순간의 아크 목록을 만든다 — 경로 배경선 일곱 개 + 이동 하이라이트 일곱 개.
 *
 * seconds 가 null 이면 하이라이트 없이 배경선만 돌려준다 (동작 줄이기).
 */
function buildArcs(theme: GlobeTheme, seconds: number | null): Arc[] {
  const arcs: Arc[] = ROUTES.map((route) => ({
    from: route.from,
    to: route.to,
    color: theme.trackColor,
  }))

  if (seconds === null) return arcs

  for (let i = 0; i < ROUTE_VECTORS.length; i++) {
    const { from, to } = ROUTE_VECTORS[i]
    const { period, phase } = FLOW[i]
    const progress = triangleWave(seconds, period, phase)

    /*
      구간이 경로 밖으로 나가지 않게 자른다. 양 끝에서는 짧아지는데, 화물이
      출발지·도착지에 닿았다가 되돌아 나오는 것처럼 보여서 그대로 둔다.
    */
    const head = Math.min(1, progress + TRAIL)
    const tail = Math.max(0, progress - TRAIL)

    arcs.push({
      from: toLatLng(nlerp(from, to, tail)),
      to: toLatLng(nlerp(from, to, head)),
      color: theme.flowColor,
    })
  }

  return arcs
}

export function CoverageGlobeCanvas({
  label,
  onFailure,
}: {
  /** 지구본이 무엇을 보여주는지 — 보조기기용 설명 */
  label: string
  /** WebGL 을 못 쓰는 환경에서 호출부가 폴백하도록 알린다 */
  onFailure: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!supportsWebGL()) {
      onFailure()
      return
    }

    let phi = INITIAL_PHI
    let frame = 0
    let globe: ReturnType<typeof createGlobe> | null = null
    let theme = readTheme()

    const pixelSize = () => Math.max(canvas.offsetWidth, 1) * 2
    const startedAt = performance.now()

    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        width: pixelSize(),
        height: pixelSize(),
        phi: INITIAL_PHI,
        theta: THETA,
        diffuse: 1.2,
        mapSamples: 16000,
        markers: MARKERS,
        arcHeight: ARC_HEIGHT,
        arcWidth: ARC_WIDTH,
        arcs: buildArcs(theme, reduced ? null : 0),
        ...theme.options,
      })
    } catch {
      // WebGL 컨텍스트를 못 얻는 환경 — 도식으로 되돌린다
      onFailure()
      return
    }

    /*
      회전 루프.

      ⚠️ cobe v2 에는 v0.6 의 onRender 콜백이 없다 (타입에도 런타임에도 없다).
         v2 는 update() 를 부를 때 한 장씩 그리는 방식이라, 프레임을 돌리는 쪽이
         우리가 된다. 예전 예제 코드를 그대로 옮겨 오면 조용히 멈춘 지구본이 된다.

      회전과 항로 흐름을 같은 루프에서 함께 갱신한다 — 흐름 때문에 렌더 루프를
      따로 만들 이유가 없다. 프레임마다 아크 배열(배경 7 + 하이라이트 7)을 새로
      만들지만, 끝점 단위벡터는 미리 구해 뒀으므로 남는 계산은 nlerp 와 되돌리는
      asin/atan2 뿐이다.

      동작 줄이기에서는 루프를 아예 시작하지 않는다. createGlobe 가 만들 때 흐름
      없는 배경선만으로 한 번 그려 두므로, 지구본·거점·항로는 그대로 보이고
      회전과 흐름만 멈춘다 — 내용을 감추는 것이 아니다.
    */
    if (!reduced) {
      const tick = (now: number) => {
        phi += PHI_STEP
        globe?.update({
          phi,
          arcs: buildArcs(theme, (now - startedAt) / 1000),
        })
        frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }

    const resizeObserver = new ResizeObserver(() => {
      const size = pixelSize()
      globe?.update({ width: size, height: size })
    })
    resizeObserver.observe(canvas)

    /*
      테마를 바꾸면 <html> 의 클래스가 갈린다. 브랜드 오렌지는 다크에서 값이
      달라지므로 다시 읽어 넘긴다 — 안 하면 토글 후에도 라이트 색이 남는다.
    */
    const themeObserver = new MutationObserver(() => {
      theme = readTheme()
      /*
        아크 색도 같이 넘긴다. 회전 루프가 도는 중이면 다음 프레임에 어차피
        새 색으로 다시 그리지만, 동작 줄이기에서는 루프가 없어서 여기서
        넘기지 않으면 경로선만 옛 색으로 남는다.
      */
      globe?.update({
        ...theme.options,
        arcs: buildArcs(theme, reduced ? null : (performance.now() - startedAt) / 1000),
      })
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      themeObserver.disconnect()
      globe?.destroy()
    }
  }, [reduced, onFailure])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className="aspect-square w-full"
    />
  )
}
