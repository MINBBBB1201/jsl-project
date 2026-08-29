"use client"

import { useSyncExternalStore } from "react"

/**
 * 브랜드 토큰을 그래픽 라이브러리가 먹을 수 있는 숫자 색으로 바꾼다.
 *
 * ── 왜 이런 게 필요한가 ────────────────────────────────────────────────
 * globals.css 의 브랜드 토큰은 전부 oklch() 다. CSS 로 쓸 때는 아무 문제가
 * 없지만, 캔버스/WebGL 라이브러리에 넘길 때는 숫자가 필요하다. 그리고 그
 * 라이브러리들은 oklch 를 못 읽는다:
 *
 *   - COBE 는 [r, g, b] 0~1 튜플만 받는다.
 *   - three.js 의 Color.setStyle 은 rgb() · hsl() · #hex · 색이름만 파싱한다
 *     (three r185 Color.js 확인). oklch 를 주면 조용히 검정이 된다.
 *
 * getComputedStyle 로 읽으면 "oklch(0.676 0.175 51.3)" 라는 문자열이 그대로
 * 나오므로 직접 쪼갤 수도 없다. 그래서 1×1 캔버스에 그 색으로 한 픽셀을 찍고
 * 되읽는다 — 브라우저의 색 변환을 그대로 빌려 쓰는 것이고, 우리가 oklch→sRGB
 * 변환식을 들고 있을 이유가 없어진다.
 *
 * ── 이 파일이 생긴 경위 ────────────────────────────────────────────────
 * 원래 coverage-globe-canvas.tsx 안에만 있던 로직이다. 컨테이너 적재 뷰어를
 * 만들면서 three.js 쪽에서 똑같은 문제가 그대로 재현돼, 두 번째 복사본을
 * 만드는 대신 여기로 뺐다.
 *
 * ⚠️ 다만 "훅 하나로 통일"까지는 하지 않았다. 지구본은 색을 이펙트 안에서
 *    명령형으로 읽어 globe.update() 에 넘기고(다시 그리는 계기가 크기 변경과
 *    테마 변경뿐이라 그 구조에 이유가 있다), 3D 씬은 리액트 상태로 들고 있어야
 *    한다. 소비 방식이 다른 둘에 같은 훅을 억지로 끼우면 지구본 쪽 렌더 타이밍
 *    주석이 통째로 무의미해진다. 그래서 까다로운 원시 함수(cssColorToRgb ·
 *    supportsWebGL)만 공유하고, 리액트 훅은 그 위에 따로 얹었다.
 */

/** 0~1 범위의 [r, g, b] — COBE 가 쓰는 형식 */
export type RgbTuple = [number, number, number]

/**
 * 토큰을 못 읽었을 때 쓸 값. globals.css 의 브랜드 토큰을 sRGB 로 옮긴 것이다.
 *   --brand-navy         oklch(0.28 0.089 254.6)    → #012853
 *   --brand-orange       oklch(0.676 0.175 51.3)    → #e87002
 *   --brand-orange-deep  oklch(0.603 0.204 35.3)    → #d94f16
 *   --brand-slate        oklch(0.7088 0.0444 254.9) → #8fa3bd
 */
export const FALLBACK_NAVY: RgbTuple = [0.005, 0.157, 0.326]
export const FALLBACK_ORANGE: RgbTuple = [0.91, 0.441, 0.008]
export const FALLBACK_ORANGE_DEEP: RgbTuple = [0.851, 0.31, 0.086]
export const FALLBACK_SLATE: RgbTuple = [0.56, 0.639, 0.741]

/**
 * WebGL 을 쓸 수 있는지 미리 본다.
 *
 * ⚠️ 라이브러리가 실패를 알려 준다고 믿으면 안 된다. COBE 의 createGlobe 는
 *    컨텍스트를 못 얻어도 예외를 던지지 않아서(v2.0.1 확인) try/catch 만으로는
 *    빈 캔버스가 그대로 남는다. three.js 의 WebGLRenderer 는 반대로 던지지만
 *    (r185 WebGLRenderer.js:405), react-three-fiber 가 내부에서 렌더러를 만들기
 *    때문에 그 예외는 호출부의 try/catch 가 아니라 에러 경계로만 잡힌다.
 *    어느 쪽이든 "만들기 전에 직접 확인"이 가장 확실하다.
 */
export function supportsWebGL(): boolean {
  try {
    const probe = document.createElement("canvas")
    return Boolean(probe.getContext("webgl2") ?? probe.getContext("webgl"))
  } catch {
    return false
  }
}

/**
 * CSS 색 문자열(oklch 포함)을 0~1 RGB 로 바꾼다.
 *
 * 파일 상단 주석의 1×1 캔버스 트릭이 여기 들어 있다.
 */
export function cssColorToRgb(value: string, fallback: RgbTuple): RgbTuple {
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
    // 색 하나 때문에 그림을 통째로 날리지 않는다
    return fallback
  }
}

/** 0~1 RGB → "#rrggbb". three.js 의 Color 와 R3F 의 color prop 이 바로 먹는다 */
export function rgbToHex([r, g, b]: RgbTuple): string {
  const channel = (v: number) =>
    Math.round(Math.min(Math.max(v, 0), 1) * 255)
      .toString(16)
      .padStart(2, "0")
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

/** 문서에서 브랜드 토큰 하나를 읽어 0~1 RGB 로 */
export function readBrandRgb(token: string, fallback: RgbTuple): RgbTuple {
  if (typeof document === "undefined") return fallback
  const styles = getComputedStyle(document.documentElement)
  return cssColorToRgb(styles.getPropertyValue(token), fallback)
}

/** 화물 박스에 돌려 쓰는 브랜드 4색 (hex 문자열) */
export interface BrandPalette {
  navy: string
  orange: string
  orangeDeep: string
  slate: string
}

const FALLBACK_PALETTE: BrandPalette = {
  navy: rgbToHex(FALLBACK_NAVY),
  orange: rgbToHex(FALLBACK_ORANGE),
  orangeDeep: rgbToHex(FALLBACK_ORANGE_DEEP),
  slate: rgbToHex(FALLBACK_SLATE),
}

function readPalette(): BrandPalette {
  if (typeof document === "undefined") return FALLBACK_PALETTE
  return {
    navy: rgbToHex(readBrandRgb("--brand-navy", FALLBACK_NAVY)),
    orange: rgbToHex(readBrandRgb("--brand-orange", FALLBACK_ORANGE)),
    orangeDeep: rgbToHex(readBrandRgb("--brand-orange-deep", FALLBACK_ORANGE_DEEP)),
    slate: rgbToHex(readBrandRgb("--brand-slate", FALLBACK_SLATE)),
  }
}

/**
 * 읽어 둔 팔레트 캐시.
 *
 * useSyncExternalStore 의 getSnapshot 은 렌더마다 불리고, 바뀐 게 없으면 반드시
 * "같은 참조"를 돌려줘야 한다 — 매번 새 객체를 만들면 React 가 계속 바뀐 것으로
 * 보고 무한 렌더에 빠진다. 그래서 값을 캐시해 두고, 테마가 바뀔 때만 null 로
 * 비워 다음 호출에서 다시 읽게 한다. 덤으로 1×1 캔버스 프로빙을 렌더마다
 * 네 번씩 돌리지 않아도 된다.
 */
let paletteCache: BrandPalette | null = null

function getPaletteSnapshot(): BrandPalette {
  paletteCache ??= readPalette()
  return paletteCache
}

/** SSR·하이드레이션 시점의 값. document 가 없으니 폴백이 유일한 답이다 */
function getPaletteServerSnapshot(): BrandPalette {
  return FALLBACK_PALETTE
}

function subscribeToTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(() => {
    paletteCache = null
    onChange()
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  })
  return () => observer.disconnect()
}

/**
 * 브랜드 4색을 hex 로 돌려주고, 테마가 바뀌면 다시 읽는다.
 *
 * 다크 모드에서 --brand-orange 계열의 값이 실제로 달라지므로(globals.css 의
 * .dark 블록) 토글을 감지하지 않으면 다크로 넘어간 뒤에도 라이트 색이 남는다.
 *
 * ⚠️ useState + useEffect 로 "마운트되면 읽어서 setState" 하지 않는다. 그건
 *    렌더 → 이펙트 → 다시 렌더로 이어지는 계단식 렌더이고, react-hooks 의
 *    set-state-in-effect 규칙이 정확히 그걸 막는다. 여기서 필요한 건 결국
 *    "문서(외부 시스템)의 현재 색을 구독"하는 것이라, 그 용도로 만들어진
 *    useSyncExternalStore 를 쓴다.
 */
export function useBrandColors(): BrandPalette {
  return useSyncExternalStore(
    subscribeToTheme,
    getPaletteSnapshot,
    getPaletteServerSnapshot
  )
}
