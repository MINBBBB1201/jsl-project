import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * JSL 브랜드 로고
 *
 * 원본 파일은 public/logo.png (네이비 배경 + 흰색 JSL 워드마크 + 오렌지 플래그).
 * 배경이 네이비 단색이라 밝은 화면 위에 그대로 올리면 사각 타일처럼 보인다.
 * 의도된 모양으로 보이도록 모서리를 둥글게 잘라 타일 형태로 표시한다.
 *
 * - Logo      : 정사각 마크 (logo-mark.png). 옆에 회사명 텍스트가 오는 자리에 쓴다.
 * - LogoFull  : 워드마크까지 포함된 전체 로고. 텍스트 없이 단독으로 놓는 자리에 쓴다.
 */

interface LogoProps {
  /** 한 변의 길이(px) */
  size?: number
  className?: string
  priority?: boolean
}

export function Logo({ size = 24, className, priority }: LogoProps) {
  return (
    <Image
      src="/logo-mark.png"
      alt="JSL Logistics"
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-md object-contain", className)}
      style={{ width: size, height: size }}
    />
  )
}

interface LogoFullProps {
  /** 높이(px). 너비는 원본 비율(519:330)에 맞춰 계산한다. */
  height?: number
  className?: string
  priority?: boolean
}

const LOGO_RATIO = 519 / 330

export function LogoFull({ height = 48, className, priority }: LogoFullProps) {
  const width = Math.round(height * LOGO_RATIO)

  return (
    <Image
      src="/logo.png"
      alt="JSL LOGISTICS CO., LTD"
      width={width}
      height={height}
      priority={priority}
      className={cn("rounded-md object-contain", className)}
      style={{ width, height }}
    />
  )
}

interface LogoWordmarkProps {
  className?: string
  priority?: boolean
}

/**
 * 배경이 투명한 가로 워드마크.
 *
 * logo-mark.png 는 파비콘용 정사각 마크라 네이비 배경이 그대로 박혀 있어서,
 * 흰 헤더 위에 올리면 사각 배지처럼 떠 보였다. 이 컴포넌트는 배경을 지운
 * 워드마크를 배경 박스 없이 그대로 얹는다.
 *
 * light/dark 두 파일은 서브타이틀 폭을 기준으로 맞춰 같은 캔버스(311x240)로
 * 정규화해 뒀다. 덕분에 테마를 바꿔도 로고 크기나 위치가 튀지 않는다.
 */
const WORDMARK_WIDTH = 311
const WORDMARK_HEIGHT = 240

export function LogoWordmark({ className, priority }: LogoWordmarkProps) {
  // 테마 분기를 JS 로 하면 첫 페인트에 로고가 깜빡이고 hydration 도 어긋난다.
  // 다크 모드가 .dark 클래스 기반이라 두 장을 CSS 로만 바꿔 끼운다.
  // 숨는 쪽은 display:none 이라 접근성 트리에서도 빠지므로, 어느 테마에서든
  // 링크가 이름을 잃지 않도록 alt 는 양쪽에 똑같이 둔다.
  const shared = "h-10 w-auto object-contain"

  return (
    <>
      <Image
        src="/logo-wordmark-light.png"
        alt="JSL LOGISTICS CO., LTD"
        width={WORDMARK_WIDTH}
        height={WORDMARK_HEIGHT}
        priority={priority}
        className={cn(shared, "dark:hidden", className)}
      />
      <Image
        src="/logo-wordmark-dark.png"
        alt="JSL LOGISTICS CO., LTD"
        width={WORDMARK_WIDTH}
        height={WORDMARK_HEIGHT}
        priority={priority}
        className={cn(shared, "hidden dark:block", className)}
      />
    </>
  )
}
