"use client"

import * as React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/navigation'
import { useContent } from '@/config/use-content'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'
import { REVEAL_EASE } from '@/lib/landing-motion'
import { TRANSPORT_PHOTOS } from './transport-photos'

/**
 * 서비스 상세 — 아코디언 + 연동 사진 (3단계)
 *
 * ── 왜 벤토 그리드를 걷어냈나 ───────────────────────────────────────────
 * 5개 모드를 3+3 / 2+2+2 벤토로 늘어놓고 있었다. 크기로 위계를 준다는 뜻은
 * 맞았지만, 히어로 바로 아래 What We Do 도 사진 카드 그리드라 두 섹션이 같은
 * 형태로 읽혔다 — 스크롤하다 보면 같은 것을 두 번 보는 느낌이 든다.
 *
 * 형태를 아예 바꾼다. 위쪽은 사진 카드 티저, 여기는 한 번에 하나씩 펼쳐 읽는
 * 목록이다. 덕분에 두 가지가 같이 해결된다.
 *   · 형태가 달라져 섹션 경계가 분명해진다
 *   · 벤토 칸에는 다 못 넣던 상세(항공사 파트너 · SEA-AIR 8단계 · 국경 노선 ·
 *     철도 3개 루트 · 특송 리드타임)를 줄이지 않고 전부 담을 수 있다
 * 벤토에서는 행 높이가 가장 긴 카드에 맞춰 늘어나 SEA 하나 때문에 옆 칸이 텅
 * 비었는데, 펼친 항목만 보이므로 그 문제도 함께 없어진다.
 *
 * ── 항상 하나는 펼쳐져 있다 ─────────────────────────────────────────────
 * Accordion 에 collapsible 을 주지 않았다. 오른쪽 사진이 "지금 선택된 모드"를
 * 그리는 자리라, 전부 접히면 사진이 무엇을 가리키는지 알 수 없는 상태가 된다.
 * 그래서 열린 항목을 다시 눌러도 닫히지 않는다 — 다른 항목으로 옮길 뿐이다.
 *
 * ── 앵커 ────────────────────────────────────────────────────────────────
 * 섹션 id(#features)와 모드별 id(#air · #sea …)를 그대로 유지한다. 네비 메가
 * 메뉴와 푸터가 /landing#features 로 들어오고, hero-transport-bento 의 각 칸이
 * #air 같은 모드 앵커로 들어온다 (지금 페이지 구성에서는 잠들어 있지만
 * hero-section 을 되살리면 다시 쓰인다).
 * 접힌 항목으로 앵커 이동하면 제목만 보여 헛걸음이 되므로, 해시가 모드 코드와
 * 맞으면 그 항목을 펼쳐 준다 (useHashSelection).
 */

/** 사진 교차 페이드 길이 (초) */
const PHOTO_FADE = 0.45

/**
 * 펼침이 끝나기를 기다리다 포기하는 상한 (ms).
 *
 * 아래 settleThenScroll 은 "높이가 더 이상 안 변한다"를 보고 스크롤하는데,
 * 무슨 일이 있어도 여기서는 끊고 한 번은 스크롤한다. 애니메이션이 0.2초라
 * 정상 경로는 250ms 안에 끝난다.
 */
const SCROLL_SETTLE_TIMEOUT = 1000

/**
 * 대상 항목이 다 펼쳐진 뒤에 스크롤한다.
 *
 * 고정 지연(예: 200ms 뒤)으로는 안 된다. 펼침 애니메이션은 0.2초지만 그 시작이
 * 언제인지가 프레임 사정에 따라 흔들린다 — 부드러운 스크롤·framer-motion·이미지
 * 디코딩이 같은 프레임을 쓰는 구간이라, 개발 서버에서는 커밋이 1.8초까지
 * 밀리는 것도 실측됐다. 아직 접혀 있는 문서 좌표로 스크롤하면 오차가 오히려
 * 커진다 (-56px → -140px).
 *
 * 그래서 시간이 아니라 높이를 본다. 호출 시점은 이미 React 가 커밋을 끝낸
 * 뒤(아래 useHashSelection 의 두 번째 effect)라, 여기서 남은 것은 CSS
 * 애니메이션뿐이다. 높이가 두 프레임 연속 같아지면 그때 한 번 스크롤한다.
 */
function settleThenScroll(id: string, cancelled: () => boolean) {
  const started = performance.now()
  let lastHeight = -1
  let steadyFrames = 0

  const step = () => {
    if (cancelled()) return

    const el = document.getElementById(id)
    if (!el) return

    const height = el.getBoundingClientRect().height
    steadyFrames = Math.abs(height - lastHeight) < 0.5 ? steadyFrames + 1 : 0
    lastHeight = height

    if (steadyFrames >= 2 || performance.now() - started > SCROLL_SETTLE_TIMEOUT) {
      // scroll-margin-top(scroll-mt-28)을 scrollIntoView 가 그대로 존중하므로
      // sticky 헤더 아래 여백은 여기서 다시 계산하지 않는다.
      // behavior 를 지정하지 않는 것은 의도다 — html 의 scroll-behavior: smooth
      // 를 따라가고, 동작 줄이기를 켠 사용자에게는 같은 CSS 가 auto 로 되돌린다.
      el.scrollIntoView({ block: "start" })
      return
    }

    requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

/**
 * 해시(#air · #sea …)로 들어온 모드를 펼치고, 펼친 뒤 그 항목으로 다시
 * 스크롤한다.
 *
 * 첫 진입뿐 아니라 hashchange 도 듣는다. 같은 페이지 안의 앵커 링크는 문서를
 * 다시 읽지 않아서, 마운트 시점 한 번만 보면 두 번째 클릭부터 반응이 없다.
 *
 * ── 왜 스크롤을 한 번 더 하나 ───────────────────────────────────────────
 * 브라우저는 앵커를 만나면 "지금 문서"에서 대상 위치를 재고 거기로 스크롤한다.
 * 그런데 우리가 그 직후에 항목을 펼치면 문서가 움직인다 — 접힌 #sea 로 들어올
 * 때 위쪽에 열려 있던 AIR 이 접히면서 그 높이만큼 대상이 위로 딸려 올라가고,
 * 스크롤은 이미 원래 좌표에 멈춰 있다. 실측하면 콜드 진입은 56px, 열린 항목이
 * 있는 상태에서 hashchange 로 들어오면 212px 어긋나 대상 제목이 sticky 헤더
 * 뒤로(또는 아예 화면 위로) 숨었다.
 *
 * 그래서 effect 를 둘로 나눴다.
 *   1. 해시를 듣고 항목을 고른다 (구독은 마운트 때 한 번)
 *   2. 고른 항목이 실제로 화면에 반영된 뒤(= active 가 그 값으로 커밋된 뒤)
 *      펼침이 끝나기를 기다렸다가 다시 스크롤한다
 * 2번을 [active] 에 걸어 두는 것이 핵심이다. "해시를 읽은 시점"부터 시간을
 * 재면 React 가 언제 커밋할지를 같이 맞춰야 하는데, 그건 프레임 사정에 따라
 * 흔들린다. 커밋 이후로 미루면 남는 변수는 CSS 애니메이션 하나뿐이다.
 */
function useHashSelection(
  codes: string[],
  active: string,
  select: (code: string) => void
) {
  // 해시로 들어왔지만 아직 화면에 반영되지 않은 대상. 반영되는 순간 소비한다.
  const pending = React.useRef<string | null>(null)

  React.useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1).toUpperCase()
      if (!codes.includes(hash)) return

      pending.current = hash
      select(hash)
    }

    sync()
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
    // 구독은 한 번이면 된다. codes 는 로케일이 바뀌어도 같은 5개 코드고,
    // select 는 setState 라 안정적이다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (pending.current !== active) return
    pending.current = null

    // 언마운트되거나 그 사이에 다른 앵커로 옮겨 가면 스크롤하지 않는다.
    let live = true
    settleThenScroll(active.toLowerCase(), () => !live)
    return () => {
      live = false
    }
  }, [active])
}

export function FeaturesSection() {
  const { services } = useContent()
  const { modes, valueAdded, modeCta } = services
  const reduced = usePrefersReducedMotion()

  const codes = React.useMemo(() => modes.map((mode) => mode.code), [modes])
  const [active, setActive] = React.useState(codes[0])

  useHashSelection(codes, active, setActive)

  /*
    사진 페이드는 클릭 이후에만 돈다 — initial={false} 라 하이드레이션 직후에는
    애니메이션 자체가 없다. 그래서 landing-motion.ts 에 적어 둔 함정(첫 렌더의
    서버 스냅샷이 false 여서 트윈이 먼저 시작되는 문제)에 걸리지 않는다.
    사용자가 항목을 누를 무렵이면 reduced 는 이미 실제 값이다.
  */
  const fade = reduced
    ? { duration: 0 }
    : { duration: PHOTO_FADE, ease: REVEAL_EASE }

  const activeMode = modes.find((mode) => mode.code === active)

  return (
    <section id="features" className="border-b bg-background py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {/* 섹션 머리말 — 가운데 정렬 대신 좌측 정렬. 그리드 축과 맞아 읽는 눈이 덜 움직인다 */}
        <div className="mb-16 max-w-2xl">
          <Badge variant="outline" className="mb-4">{services.badge}</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {services.title}
          </h2>
          <p className="text-lg text-muted-foreground">
            {services.description}
          </p>
        </div>

        {/*
          왼쪽 목록 / 오른쪽 사진.

          모바일에서는 사진을 목록 위로 올린다 (max-lg:order-first). 사진이 이
          섹션의 시각적 기준점이고 목록은 펼쳐지며 길어지는 쪽이라, 아래에 두면
          항목을 누를 때마다 사진이 화면 밖으로 밀려난다.

          데스크톱에서는 사진을 sticky 로 붙인다. SEA 처럼 상세가 긴 항목을
          펼치면 목록이 사진보다 훨씬 길어져서, 아래쪽을 읽는 동안 사진이 위로
          사라진다.
        */}
        <div className="mb-24 grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <Accordion
            type="single"
            value={active}
            onValueChange={(value) => {
              // collapsible 이 아니라 빈 문자열은 오지 않지만, 선택이 풀려
              // 사진이 가리킬 대상을 잃는 일이 없도록 한 번 더 막는다.
              if (value) setActive(value)
            }}
            className="border-t"
          >
            {modes.map((mode) => (
              <AccordionItem
                key={mode.code}
                value={mode.code}
                /*
                  히어로 벤토그리드의 각 칸이 이 앵커(#air, #sea …)로 들어온다.
                  scroll-mt 는 sticky 헤더에 항목 윗줄이 가려지지 않도록 준 여백이다.
                  헤더가 80px 이 되면서 96px(scroll-mt-24) 로는 여유가 16px 밖에
                  남지 않아 112px 로 올렸다 — 남는 여백은 그대로 32px 이다.
                */
                id={mode.code.toLowerCase()}
                className="scroll-mt-28 border-b last:border-b-0"
              >
                <AccordionTrigger className="cursor-pointer items-center gap-4 py-5 hover:no-underline">
                  <span className="flex items-center gap-4">
                    {/*
                      선택된 항목만 아이콘에 브랜드 오렌지를 준다. 다섯 개가 모두
                      물들면 어느 것이 열려 있는지 색으로는 알 수 없다.
                    */}
                    <mode.icon
                      className={cn(
                        "size-5 shrink-0 transition-colors",
                        mode.code === active
                          ? "text-brand-orange"
                          : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <span className="flex flex-col text-start">
                      <span className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
                        {mode.code}
                      </span>
                      <span className="mt-1 text-lg font-semibold text-foreground">
                        {mode.title}
                      </span>
                    </span>
                  </span>
                </AccordionTrigger>

                {/*
                  펼친 항목은 두 문장 요약과 상세 페이지 링크만 보여준다.

                  예전에는 여기에 불릿으로 상세를 전부 늘어놓았다. 다섯 모드의
                  내용이 서로 달라 어떤 항목은 여덟 줄이었고(SEA), 펼치면 오른쪽
                  사진보다 목록이 훨씬 길어져 읽는 자리가 흔들렸다. 상세는
                  /services/{code} 로 옮겼고 여기는 고르는 자리로만 남긴다.
                */}
                <AccordionContent className="pb-8 ps-9">
                  <p className="text-sm text-muted-foreground">{mode.summary}</p>

                  <Link
                    href={mode.href}
                    className="group text-primary mt-5 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                  >
                    {/*
                      링크 다섯 개가 전부 같은 문구라 목록만 훑는 스크린리더에는
                      구분이 안 된다. 눈에 보이는 문구는 그대로 두고 모드 이름을
                      덧붙여 읽히게 한다.
                    */}
                    <span aria-hidden="true">{modeCta.label}</span>
                    <span className="sr-only">
                      {mode.title} — {modeCta.label}
                    </span>
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/*
            선택된 모드의 사진.

            다섯 장을 전부 깔아 두고 opacity 만 바꾼다. AnimatePresence 로 그때그때
            갈아 끼우면 아직 받지 않은 사진에서 첫 프레임이 비어 깜빡인다 —
            컨테이너가 화면에 들어온 시점에 다섯 장이 함께 지연 로딩되므로 전환이
            항상 매끄럽다. 대신 사진 다섯 장을 미리 받는 값을 치른다 (sizes 로
            화면 폭 절반까지 줄인 뒤라 원본을 통째로 받는 것은 아니다).

            사진은 장식이라 alt 는 비운다. 무엇을 보고 있는지는 아래 라벨이 말한다.
          */}
          <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-xl max-lg:order-first lg:sticky lg:top-28">
            {modes.map((mode) => {
              const isActive = mode.code === active

              return (
                <motion.div
                  key={mode.code}
                  className="absolute inset-0"
                  initial={false}
                  animate={{ opacity: isActive ? 1 : 0 }}
                  transition={fade}
                  aria-hidden={!isActive}
                >
                  <Image
                    src={TRANSPORT_PHOTOS[mode.code]}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </motion.div>
              )
            })}

            {/*
              사진 위 좌하단에 선택된 모드 이름. 사진만으로는 철도와 육상이 한눈에
              구분되지 않아서, 무엇을 보고 있는지 글자로 한 번 더 말한다. 스크림은
              What We Do 카드와 같은 색(--brand-navy-deep)을 쓴다.

              아코디언 제목에 이미 있는 말이라 보조기기에는 감춘다.
            */}
            <div
              className="from-brand-navy-deep/80 pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t to-transparent"
              aria-hidden="true"
            />
            <p
              className="pointer-events-none absolute bottom-5 start-5 text-sm font-semibold text-white"
              aria-hidden="true"
            >
              {activeMode?.title}
            </p>
          </div>
        </div>

        {/*
          부가 서비스

          오른쪽에 "창고 재고 관리 화면"이라는 설명을 달고 템플릿 스크린샷을 띄우고
          있었는데, 실제로는 Sarah Johnson·sarah.johnson@example.com 같은 가짜 사용자
          목록에 Enterprise/Professional 요금제와 Paypal·UPI 결제 수단이 담긴 화면이라
          창고 재고와 아무 관계가 없었습니다. 실제 화면 이미지가 준비되면 그때
          2단 배치로 되돌리세요.
        */}
        {/* 머리말과 같은 축(좌측 정렬)에 맞춘다 — 가운데 정렬이 섞이면 그리드가 흐트러진다 */}
        <div className="max-w-3xl space-y-6">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {valueAdded.title}
            </h3>
            <p className="text-muted-foreground text-base text-pretty">
              {valueAdded.description}
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {valueAdded.items.map((feature, index) => (
              <li key={index} className="group hover:bg-accent/5 flex items-start gap-3 p-2 rounded-lg transition-colors">
                <div className="mt-0.5 flex shrink-0 items-center justify-center">
                  <feature.icon className="size-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-foreground font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button size="lg" className="cursor-pointer" asChild>
              <a href={valueAdded.primaryCta.href} className='flex items-center'>
                {valueAdded.primaryCta.label}
                <ArrowRight className="ms-2 size-4" aria-hidden="true" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="cursor-pointer" asChild>
              <a href={valueAdded.secondaryCta.href}>
                {valueAdded.secondaryCta.label}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
