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
