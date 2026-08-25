"use client"

import { useEffect, useRef } from "react"
import createGlobe, { type Arc, type COBEOptions, type Marker } from "cobe"

/**
 * 서비스 커버리지 지구본 (COBE 캔버스)
 *
 * COBE(https://github.com/shuding/cobe, MIT, 의존성 없음)를 그대로 쓰고 색과
 * 데이터만 우리 것으로 바꿨다. 점으로 찍힌 세계지도 위에 실제 거점 다섯 곳을
 * 마커로, 운영 노선 일곱 개를 아크로 얹는다.
 *
 * ⚠️ 움직이는 것이 하나도 없는 정지 화면이다. 자동 회전과 항로 흐름
 *    애니메이션을 차례로 넣어 봤지만 둘 다 걷어냈다 — 보여줄 것이 아시아 한
 *    구석에 몰려 있어서, 무엇이 움직이든 거점 무리가 통째로 화면을 기어다니는
 *    것처럼 보였다. 지도는 서 있을 때 읽힌다.
 *
 *    그래서 계속 도는 렌더 루프가 없다. COBE 는 update() 를 부를 때만 한 장
 *    그리므로, 처음 채워 넣은 뒤에는 크기나 테마가 바뀔 때만 다시 그린다.
 *    움직임이 없으니 prefers-reduced-motion 분기도 둘 이유가 없다.
 *
 * ⚠️ 이 파일은 coverage-globe.tsx 가 next/dynamic 으로만 불러온다. 직접
 *    import 하면 초기 번들에 WebGL 코드가 실려 들어간다.
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
 *
 * 아시아 역내 단거리 다섯 개를 한동안 뺐던 적이 있다. arcHeight 가 전역이라
 * 짧은 구간도 장거리와 같은 높이로 부풀어서 마커가 몰린 자리 옆에 반원이
 * 솟고, 그게 거미 다리처럼 보였기 때문이다. 다시 넣었다 — 다리처럼 보이게
 * 만든 것은 아크 모양 자체가 아니라 그 위에서 움직이던 흐름 하이라이트와
 * 자동 회전이었고, 둘 다 없앤 지금은 정지한 곡선으로 읽힌다.
 */
const ARCS: Arc[] = [
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

/**
 * 보는 각도 — 동아시아가 정면에 오게 맞춘 고정값이다.
 *
 * 실측으로 잡았다. phi=2 에서 거점 다섯이 중앙 왼쪽, phi=3 에서 중앙 오른쪽에
 * 걸리고, 그 사이 2.5 에서 정면에 온다. phi=4 부터는 오른쪽 가장자리로 밀려
 * 나가고 5 를 넘으면 지구 뒤편으로 사라진다.
 *
 * 값을 바꿀 때는 거점 다섯 개와 항로 일곱 개가 정면에 남는지 반드시 확인할 것.
 */
const VIEW_PHI = 2.5
/** 북반구를 살짝 위로 기울여 다섯 거점이 적도선에 눌리지 않게 한다 */
const THETA = 0.3

/**
 * 마운트 뒤 같은 그림을 다시 그릴 시점들(ms).
 *
 * ⚠️ 이걸 지우면 대륙 점무늬가 통째로 사라진다.
 *
 *    COBE 는 점 지도를 base64 PNG 로 들고 있다가 new Image() 의 onload 에서
 *    텍스처에 올린다 (v2.0.1 소스 확인). 그런데 올린 뒤 다시 그리지 않고,
 *    COBE 안에는 렌더 루프도 없다. 즉 이미지가 디코드되기 전에 그린 그림은
 *    1×1 자리표시자 텍스처 그대로 — 민짜 구체 — 로 굳는다. 실측하면
 *    createGlobe 만 하거나 update 를 한 번 더 부른 상태까지는 점이 없고,
 *    두 번째 update 부터 점무늬가 나타난다.
 *
 *    회전하던 시절에는 매 프레임 다시 그렸으니 드러나지 않았다. 루프를
 *    걷어내자 초기 draw 가 한두 번으로 줄면서 빈 구체가 남았다.
 *
 *    데이터 URI 라 보통 몇 ms 면 디코드되지만 메인 스레드가 막히면 늦어진다.
 *    그래서 고정된 짧은 창 대신 간격을 벌려 가며 몇 번 더 그린다 — 여덟 번이
 *    8초에 걸쳐 흩어져 있어 비용은 없다시피 하고, 늦게 디코드돼도 그 뒤의
 *    한 번이 받아 준다. phi 도 내용도 그대로라 같은 그림을 덧그리는 것이고
 *    눈에는 아무 움직임이 없다.
 */
const REDRAW_SCHEDULE = [0, 60, 180, 400, 900, 2000, 4000, 8000]

/**
 * 토큰을 못 읽었을 때 쓸 값. globals.css 의 브랜드 토큰을 sRGB 로 옮긴 것이다.
 *   --brand-navy   oklch(0.28 0.089 254.6)    → #012853
 *   --brand-orange oklch(0.676 0.175 51.3)    → #e87002
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

/*
  createGlobe 와 update 에 그대로 넘기는 색 묶음.

  Partial 이 아니라 Pick 이어야 한다 — Partial 로 두면 펼쳐 넣었을 때
  COBEOptions 의 필수 항목(mapBrightness 등)이 optional 로 약해져서 createGlobe
  가 타입을 거부한다.
*/
type GlobeTheme = Pick<
  COBEOptions,
  "baseColor" | "markerColor" | "arcColor" | "glowColor" | "dark" | "mapBrightness"
>

function readTheme(): GlobeTheme {
  const styles = getComputedStyle(document.documentElement)
  const isDark = document.documentElement.classList.contains("dark")
  const orange = cssColorToRgb(
    styles.getPropertyValue("--brand-orange"),
    FALLBACK_ORANGE
  )

  return {
    baseColor: cssColorToRgb(styles.getPropertyValue("--brand-navy"), FALLBACK_NAVY),
    // 거점과 항로가 같은 오렌지다 — 둘이 한 덩어리의 네트워크로 읽혀야 한다
    markerColor: orange,
    arcColor: orange,
    glowColor: cssColorToRgb(styles.getPropertyValue("--brand-slate"), FALLBACK_SLATE),
    dark: isDark ? 1 : 0,
    /* 라이트 배경에서는 점 지도가 더 밝아야 네이비가 뭉개지지 않는다 */
    mapBrightness: isDark ? 4 : 6,
  }
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!supportsWebGL()) {
      onFailure()
      return
    }

    let globe: ReturnType<typeof createGlobe> | null = null
    const pixelSize = () => Math.max(canvas.offsetWidth, 1) * 2

    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        width: pixelSize(),
        height: pixelSize(),
        phi: VIEW_PHI,
        theta: THETA,
        diffuse: 1.2,
        mapSamples: 16000,
        markers: MARKERS,
        arcs: ARCS,
        arcHeight: ARC_HEIGHT,
        arcWidth: ARC_WIDTH,
        ...readTheme(),
      })
    } catch {
      // WebGL 컨텍스트를 못 얻는 환경 — 도식으로 되돌린다
      onFailure()
      return
    }

    /* 점 지도 텍스처가 올라온 뒤 한 번은 그리도록 (REDRAW_SCHEDULE 주석 참고) */
    const redraws = REDRAW_SCHEDULE.map((delay) =>
      window.setTimeout(() => globe?.update({ phi: VIEW_PHI }), delay)
    )

    const resizeObserver = new ResizeObserver(() => {
      const size = pixelSize()
      globe?.update({ width: size, height: size })
    })
    resizeObserver.observe(canvas)

    /*
      테마를 바꾸면 <html> 의 클래스가 갈린다. 브랜드 오렌지는 다크에서 값이
      달라지므로 다시 읽어 넘긴다 — 다시 그리는 계기가 이것과 크기 변경뿐이라
      여기서 빠뜨리면 토글 후에도 라이트 색이 그대로 남는다.
    */
    const themeObserver = new MutationObserver(() => {
      globe?.update(readTheme())
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => {
      redraws.forEach(clearTimeout)
      resizeObserver.disconnect()
      themeObserver.disconnect()
      globe?.destroy()
    }
  }, [onFailure])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className="aspect-square w-full"
    />
  )
}
