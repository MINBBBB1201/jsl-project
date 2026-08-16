"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
import { cn } from "@/lib/utils"
import { TRANSPORT_PHOTOS } from "./transport-photos"

/**
 * 히어로 — 5개 운송모드 벤토그리드
 *
 * 다섯 개를 같은 크기로 늘어놓으면 "무엇이 주력인가"라는 정보가 사라진다.
 * 물동량이 가장 큰 항공(월 200톤)을 2×2 칸에 두고 나머지 넷을 1×1 로 감싸,
 * 칸의 크기 자체가 위계를 말하게 했다. 아래 서비스 섹션의 벤토(3+3 / 2+2+2)와
 * 같은 원칙이라 페이지를 내려가며 규칙이 반복된다.
 *
 * 사진은 장식이 아니라 식별자로 쓴다. 다섯 모드는 글자보다 사진으로 훨씬 빨리
 * 구분되고, 각 칸은 그 모드의 상세 설명(#air, #sea …)으로 가는 입구다.
 *
 * 사진 출처·라이선스는 transport-photos.ts 주석에 정리해 두었다.
 */

interface BentoMode {
  code: string
  title: string
  summary: string
  alt: string
  href: string
  icon: LucideIcon
}

/**
 * 칸 배치.
 *
 * AIR 은 어느 폭에서도 세로 2행을 차지한다. 모바일 1열에서도 크기 차이가
 * 남아 있어야 "주력"이라는 정보가 유지되기 때문이다.
 */
const SPAN: Record<string, string> = {
  AIR: "row-span-2 sm:col-span-2 lg:col-span-2",
}

/**
 * next/image 의 sizes.
 *
 * 이걸 빼면 브라우저가 화면 폭 전체를 가정해 큰 파일을 받는다. 작은 칸은
 * lg 이상에서 컨테이너의 1/4 남짓이라, 알려 주면 내려받는 양이 크게 줄어든다.
 */
const SIZES = {
  large: "(min-width: 1024px) 640px, (min-width: 640px) 100vw, 100vw",
  small: "(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw",
}

function ModeTile({
  mode,
  index,
  isPrimary,
}: {
  mode: BentoMode
  index: number
  isPrimary: boolean
}) {
  // 사진을 못 불러오면 칸을 비우는 대신 브랜드 색 배경 + 모드 아이콘으로 대체한다.
  // 글자는 어차피 사진 위가 아니라 오버레이 위에 있으므로 그대로 읽힌다.
  const [imageFailed, setImageFailed] = React.useState(false)
  const photo = TRANSPORT_PHOTOS[mode.code]

  return (
    <BentoGridItem
      index={index}
      className={cn("min-h-44", SPAN[mode.code])}
    >
      <Link
        href={mode.href}
        className="focus-visible:ring-brand-cta absolute inset-0 flex flex-col justify-end p-5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none sm:p-6"
      >
        {/* 배경 사진 */}
        {photo && !imageFailed ? (
          <Image
            src={photo}
            alt={mode.alt}
            fill
            sizes={isPrimary ? SIZES.large : SIZES.small}
            /*
              큰 칸은 대개 이 페이지의 LCP 대상이라 preload 한다. 작은 칸까지
              priority 를 주면 preload 가 서로 대역폭을 나눠 가져 오히려 늦어진다.
              나머지는 기본값(lazy) — 첫 화면 안에 있으면 브라우저가 곧바로 받는다.
            */
            priority={isPrimary}
            placeholder="blur"
            onError={() => setImageFailed(true)}
            className="-z-10 object-cover transition-transform duration-500 ease-out group-hover/bento:scale-[1.04]"
          />
        ) : (
          <div
            className="from-brand-navy to-brand-blue absolute inset-0 -z-10 bg-gradient-to-br"
            aria-hidden="true"
          />
        )}

        {/*
          가독성 오버레이. 사진의 밝기를 예측할 수 없으므로 아래쪽을 충분히
          어둡게 깔아 흰 글자의 대비를 확보한다. 테마와 무관하게 항상 어둡다 —
          사진 위 글자는 라이트 모드에서도 흰색이어야 읽힌다.

          중간 정지점을 45% 로 끌어내린 것은 번역 때문이다. 베트남어처럼 모드
          이름이 길어 제목이 두 줄이 되면 글자가 칸 위쪽까지 올라오는데,
          기본 50% 지점이면 그 줄이 밝은 사진 위에 얹혀 대비가 떨어진다.
        */}
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/55 via-45% to-black/10 transition-opacity duration-500 group-hover/bento:opacity-90"
          aria-hidden="true"
        />

        {/* 모드 아이콘 — 사진이 어두울 때 모드를 알아보는 두 번째 단서 */}
        <mode.icon
          className="absolute top-5 right-5 size-5 text-white/70 transition-colors duration-300 group-hover/bento:text-white sm:top-6 sm:right-6"
          aria-hidden="true"
        />

        <div className="transition-transform duration-300 ease-out group-hover/bento:translate-x-1">
          <p className="text-[11px] font-medium tracking-[0.18em] text-white/75">
            {mode.code}
          </p>
          {/*
            제목이지만 h 태그를 쓰지 않는다. 히어로에는 h1 하나뿐이라 여기에
            h3 를 두면 단계를 건너뛰고(h1 → h3), h2 로 올리면 아래 서비스 섹션에
            이미 있는 같은 이름의 제목과 목차가 두 겹이 된다. 각 칸은 통째로
            링크라 스크린리더는 이 글자를 링크 이름으로 그대로 읽는다.
          */}
          <p
            className={cn(
              "mt-1.5 flex items-center gap-1.5 font-semibold text-white",
              isPrimary ? "text-2xl sm:text-3xl" : "text-lg"
            )}
          >
            {mode.title}
            <ArrowUpRight
              className="size-4 shrink-0 opacity-0 transition-opacity duration-300 group-hover/bento:opacity-100"
              aria-hidden="true"
            />
          </p>
          {isPrimary && (
            <p className="mt-2 max-w-md text-sm text-white/80">{mode.summary}</p>
          )}
        </div>
      </Link>
    </BentoGridItem>
  )
}

export function HeroTransportBento({ modes }: { modes: BentoMode[] }) {
  return (
    <BentoGrid className="auto-rows-[11rem] lg:grid-cols-4 xl:auto-rows-[12rem]">
      {modes.map((mode, index) => (
        <ModeTile
          key={mode.code}
          mode={mode}
          index={index}
          isPrimary={mode.code === "AIR"}
        />
      ))}
    </BentoGrid>
  )
}
