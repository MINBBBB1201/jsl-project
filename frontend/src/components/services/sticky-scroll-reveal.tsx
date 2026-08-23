"use client"

import * as React from "react"
import Image, { type StaticImageData } from "next/image"
import { motion, useMotionValueEvent, useScroll } from "framer-motion"

import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

/**
 * 스티키 스크롤 리빌
 *
 * 왼쪽 단계 목록이 스크롤되는 동안 오른쪽 패널이 화면에 고정된 채, 지금 읽고
 * 있는 단계의 사진과 다이어그램으로 바뀐다. Aceternity UI 의 같은 이름 패턴을
 * 보고 만들었지만 코드를 옮겨오지는 않았다 — 활성 단계 판정 방식과 반응형·
 * 접근성 처리를 이 프로젝트 규칙에 맞춰 다시 짰다.
 *
 * ── 활성 단계를 어떻게 고르나 ───────────────────────────────────────────
 * 스크롤 진행률(0~1)을 단계 수로 등분하는 방법을 먼저 썼다가 버렸다. 단계마다
 * 글 길이가 달라서(SEA 는 한 줄, AIR 는 불릿 다섯 줄) 등분하면 짧은 단계는
 * 순식간에 지나가고 긴 단계는 한참 남는다. 지금은 각 단계 엘리먼트의 실제
 * 화면 위치를 읽어, 활성선(뷰포트 45% 지점)을 마지막으로 지난 단계를 고른다.
 * 높이가 제각각이어도 눈이 보고 있는 것과 일치한다.
 *
 * useScroll 로 스크롤을 구독하는 이유는 리스너를 직접 붙이면 rAF 스로틀과
 * 정리(cleanup)를 또 짜야 해서다. 값 자체는 쓰지 않고 "스크롤이 움직였다"는
 * 신호로만 쓴다 — 위치는 그때그때 getBoundingClientRect 로 다시 읽는다.
 *
 * ── 모바일 ─────────────────────────────────────────────────────────────
 * sticky 는 데스크톱 전용이다. lg 미만에서는 오른쪽 패널을 감추고 각 단계가
 * 자기 사진을 위에 이고 세로로 쌓인다. 두 벌의 <Image> 가 DOM 에 있지만 숨는
 * 쪽은 display:none 이라 교차 관찰이 일어나지 않아 lazy 이미지가 요청되지
 * 않는다 — 폭에 맞는 쪽만 실제로 내려받는다.
 *
 * ── 동작 줄이기 ─────────────────────────────────────────────────────────
 * 활성 단계는 그대로 바뀌되 전환 시간만 0 이 된다. 정보를 감추지 않고
 * 움직임만 없앤다.
 */

export interface StickyStep {
  /** 단계 제목 */
  title: string
  /** SEA 프로세스처럼 시각이 있는 단계 (예: "D+1 19:30") */
  time?: string
  /** 한두 문장 설명 */
  body?: string
  /** 불릿 목록 */
  items?: string[]
  /** 목록 아래 작은 단서 (예: 로고를 쓰지 않는다는 표기) */
  note?: string
  /** 이 단계에서 오른쪽 패널에 띄울 사진 */
  photo: StaticImageData
}

interface StickyScrollRevealProps {
  steps: StickyStep[]
  /** 오른쪽 패널 사진의 대체텍스트. 장식이면 빈 문자열 */
  photoAlt?: string
  className?: string
}

/** 활성선 — 뷰포트 위에서 이 비율 지점을 지난 마지막 단계가 활성이다 */
const ACTIVE_LINE = 0.45

export function StickyScrollReveal({
  steps,
  photoAlt = "",
  className,
}: StickyScrollRevealProps) {
  const reduced = usePrefersReducedMotion()
  const [active, setActive] = React.useState(0)
  const stepRefs = React.useRef<(HTMLLIElement | null)[]>([])
  const { scrollY } = useScroll()

  const pick = React.useCallback(() => {
    const line = window.innerHeight * ACTIVE_LINE
    let next = 0

    stepRefs.current.forEach((el, index) => {
      if (!el) return
      if (el.getBoundingClientRect().top <= line) next = index
    })

    setActive((prev) => (prev === next ? prev : next))
  }, [])

  useMotionValueEvent(scrollY, "change", pick)

  /*
    마운트 때 한 번 맞춘다. 앵커로 페이지 중간에 들어오거나 브라우저가 스크롤
    위치를 복원한 경우에는 스크롤 이벤트가 한 번도 오지 않아 1단계로 남는다.

    ⚠️ 이펙트 본문에서 곧바로 부르지 않고 rAF 로 한 프레임 미룬다. 두 가지
       이유가 겹친다.
         · 이펙트 본문에서 동기로 setState 하면 렌더가 연쇄로 한 번 더 돈다
           (eslint react-hooks/set-state-in-effect 가 잡는다).
         · 브라우저의 스크롤 위치 복원은 첫 페인트 뒤에 일어난다. 이펙트 시점에
           위치를 읽으면 복원 전 좌표라 엉뚱한 단계가 잡힌다.
  */
  React.useEffect(() => {
    const frame = requestAnimationFrame(pick)
    return () => cancelAnimationFrame(frame)
  }, [pick])

  /*
    ⚠️ reduced 를 여기서 읽는 것은 안전하다. usePrefersReducedMotion 은
       useSyncExternalStore 라 하이드레이션 첫 렌더에서 서버 스냅샷(false)을
       주지만, 이 값이 쓰이는 시점은 사용자가 스크롤한 뒤라 이미 실제 값이다.
       (레이아웃 이펙트에서 곧바로 읽으면 안 되는 경우는 count-up.tsx 참고)
  */
  const transition = reduced ? { duration: 0 } : { duration: 0.35, ease: "easeOut" as const }

  /*
    모든 단계에 시각이 붙어 있으면 공정 타임라인이다 (SEA 의 8단계). 이때는
    단계 하나가 제목 + 시각 두 줄뿐이라, 설명과 불릿이 붙는 단계(AIR 등)와 같은
    간격을 주면 글자 사이가 텅 빈다. 타임라인은 한 화면에 네댓 단계가 함께
    보이도록 좁히고, 내용이 있는 목록은 넓게 둔다.
  */
  const isTimeline = steps.every((step) => Boolean(step.time))

  return (
    <div className={cn("grid gap-10 lg:grid-cols-2 lg:gap-16", className)}>
      {/* ── 왼쪽: 단계 목록 ─────────────────────────────────────────── */}
      <ol className={cn("space-y-16", isTimeline ? "lg:space-y-24" : "lg:space-y-40")}>
        {steps.map((step, index) => {
          const isActive = index === active

          return (
            <li
              key={step.title}
              ref={(el) => {
                stepRefs.current[index] = el
              }}
              /*
                lg 미만에서는 각 단계가 자기 사진을 이고 간다. 오른쪽 패널이
                숨는 자리라 사진이 아예 없으면 글만 남는다.
              */
              className="scroll-mt-28"
            >
              {/*
                ⚠️ 모바일 사진 판에는 번호만 넣는다 (compact). 데스크톱에서는 판이
                   오른쪽 고정 패널에 있어 왼쪽 글과 떨어져 있지만, 여기서는 사진
                   바로 아래에 같은 제목·시각이 붙어 두 번 읽힌다.

                앞 단계와 사진이 같으면 아예 건너뛴다. 사진이 여덟 장뿐이라
                TRUCK 1~3단계처럼 같은 컷이 이어지는데, 데스크톱에서는 한 자리에
                고정돼 있어 티가 나지 않지만 세로로 쌓이면 같은 사진이 연달아
                나와 실수처럼 보인다.
              */}
              {index === 0 || steps[index - 1].photo !== step.photo ? (
                <div className="bg-brand-navy-deep relative mb-6 aspect-[4/3] overflow-hidden rounded-xl lg:hidden">
                  <Image
                    src={step.photo}
                    alt={photoAlt}
                    fill
                    sizes="100vw"
                    className="object-cover opacity-70"
                  />
                  <StepPlate index={index} total={steps.length} title={step.title} compact />
                </div>
              ) : null}

              {/*
                활성 단계만 전경색, 나머지는 톤다운. 색만으로 구분하지 않도록
                왼쪽에 굵기가 바뀌는 세로선을 함께 둔다.
              */}
              <motion.div
                initial={false}
                animate={{ opacity: isActive ? 1 : 0.45 }}
                transition={transition}
                /*
                  max-lg:opacity-100! 로 모바일에서는 흐려지지 않게 한다.

                  활성 단계만 밝히는 것은 오른쪽 고정 패널이 어느 단계를 비추는지
                  알려주기 위한 장치다. 패널이 없는 폭에서는 읽고 있는 글 말고
                  나머지를 흐리게 만들 뿐이라 득이 없다. framer-motion 이 opacity 를
                  인라인 스타일로 쓰므로, 미디어쿼리로 되돌리려면 important 가 필요하다.
                */
                className={cn(
                  "border-s-2 ps-5 transition-colors max-lg:opacity-100!",
                  isActive ? "border-brand-orange" : "border-border"
                )}
              >
                <p className="font-poppins text-muted-foreground text-[11px] font-medium tracking-[0.18em]">
                  {String(index + 1).padStart(2, "0")}
                  {step.time ? <span className="ms-3">{step.time}</span> : null}
                </p>
                <h3 className="text-foreground mt-2 text-xl font-semibold sm:text-2xl">
                  {step.title}
                </h3>
                {step.body ? (
                  <p className="text-muted-foreground mt-3 text-sm sm:text-base">
                    {step.body}
                  </p>
                ) : null}
                {step.items && step.items.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {step.items.map((item) => (
                      <li
                        key={item}
                        className="text-muted-foreground flex items-start gap-2.5 text-sm"
                      >
                        <span
                          className="bg-brand-orange mt-2 size-1 shrink-0 rounded-full"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {step.note ? (
                  <p className="text-muted-foreground/70 mt-4 text-xs">{step.note}</p>
                ) : null}
              </motion.div>
            </li>
          )
        })}
      </ol>

      {/* ── 오른쪽: 고정 패널 (데스크톱 전용) ──────────────────────── */}
      <div className="max-lg:hidden">
        <div className="bg-brand-navy-deep sticky top-28 aspect-[4/3] overflow-hidden rounded-xl">
          {/*
            사진 다섯 장을 겹쳐 두고 opacity 만 바꾼다. AnimatePresence 로 그때
            그때 갈아 끼우면 아직 받지 않은 사진에서 첫 프레임이 비어 깜빡인다
            (features-section 에서 같은 이유로 같은 방식을 쓴다).
          */}
          {steps.map((step, index) => (
            <motion.div
              key={`${step.title}-${index}`}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: index === active ? 0.7 : 0 }}
              transition={transition}
              aria-hidden="true"
            >
              <Image
                src={step.photo}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 0px"
                className="object-cover"
              />
            </motion.div>
          ))}

          {/*
            패널은 통째로 보조기기에서 감춘다. 여기 있는 글자(단계 번호·제목·
            시각)는 왼쪽 목록에 이미 다 있고, 스크롤 위치를 눈으로 좇는 장치라
            읽어 주면 같은 말이 두 번 나온다.
          */}
          <StepPlate
            index={active}
            total={steps.length}
            title={steps[active]?.title ?? ""}
            time={steps[active]?.time}
            transition={transition}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * 사진 위에 얹는 단계 표시 — 번호 / 제목 / 시각 / 진행 레일.
 *
 * 사진이 8장뿐이라 SEA 8단계에는 단계마다 다른 사진을 줄 수 없다. 사진이
 * 반복되는 구간에서도 "지금 몇 번째를 보고 있는지"가 늘 보이도록, 바뀌는 정보를
 * 사진이 아니라 이 판이 맡는다.
 */
function StepPlate({
  index,
  total,
  title,
  time,
  transition,
  compact = false,
}: {
  index: number
  total: number
  title: string
  time?: string
  transition?: { duration: number }
  /** 번호만 표시한다 — 바로 아래에 같은 제목이 오는 모바일 레이아웃용 */
  compact?: boolean
}) {
  return (
    <div
      className="from-brand-navy-deep/95 via-brand-navy-deep/40 absolute inset-0 flex flex-col justify-end bg-gradient-to-t to-transparent p-6 sm:p-8"
      aria-hidden="true"
    >
      <motion.div
        key={index}
        initial={transition?.duration === 0 ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
      >
        <p className="font-poppins text-brand-slate text-xs font-medium tracking-[0.18em]">
          {String(index + 1).padStart(2, "0")}
          <span className="text-brand-slate/50"> / {String(total).padStart(2, "0")}</span>
        </p>
        {compact ? null : (
          <>
            <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">{title}</p>
            {time ? (
              <p className="font-poppins text-brand-orange mt-1 text-sm font-medium">{time}</p>
            ) : null}
          </>
        )}
      </motion.div>

      {/* 진행 레일 — 지나온 단계는 채우고 남은 단계는 비운다 */}
      <div className="mt-6 flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-0.5 flex-1 rounded-full transition-colors",
              i <= index ? "bg-brand-orange" : "bg-white/20"
            )}
          />
        ))}
      </div>
    </div>
  )
}
