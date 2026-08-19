"use client"

import Image from "next/image"
import { motion } from "framer-motion"

import { useContent } from "@/config/use-content"
import { LANDING_PHOTOS } from "./landing-photos"
import { REVEAL_OFFSET_X, useRevealMotion } from "@/lib/landing-motion"

/**
 * Why JSL — 통계 스플릿
 *
 * ── 구조 (1단계에서 확정, 손대지 않음) ──────────────────────────────────
 * 좌우 2컬럼. 왼쪽은 eyebrow + 제목 + 얇은 테두리 텍스트 카드 3장이고,
 * 오른쪽은 사진 두 장을 어긋나게 겹친 뒤 그 모서리에 통계 카드를 걸쳐 놓는다.
 * 겹침은 큰 사진 위에 작은 사진을 절대 배치해서 만든다 — 그리드로 나누면
 * 둘 사이 여백이 생겨 "겹쳤다"는 인상이 사라진다.
 *
 * 텍스트 카드는 트러스트 배지 섹션(certifications-bar.tsx)과 일부러 톤을
 * 다르게 잡았다. 그쪽은 아이콘이 선 흰 카드고, 여기는 아이콘 없이 테두리만
 * 있는 글자 카드다. 같은 페이지에서 같은 모양이 두 번 나오면 둘 다 흐려진다.
 *
 * ── 애니메이션 방향 ─────────────────────────────────────────────────────
 * 왼쪽 컬럼은 오른쪽에서(+x), 오른쪽 컬럼은 왼쪽에서(-x) 들어온다. 두 컬럼이
 * 가운데로 모이는 움직임이라, 바깥으로 벌어지는 것보다 한 덩어리로 읽힌다.
 *
 * ── 색 ──────────────────────────────────────────────────────────────────
 * 배경은 --brand-navy-deep (#0c1a2e). Stats·Partners 섹션과 같은 값이라
 * 페이지의 어두운 띠가 전부 한 톤으로 맞는다. 1단계의 neutral-900 은 걷어냈다.
 *
 * ⚠️ 이 띠는 라이트·다크 어느 모드에서도 항상 어둡다. 그래서 안쪽 요소에
 *    테마에 따라 뒤집히는 토큰(bg-card, text-foreground 등)을 쓰면 안 된다.
 *    튀어나온 통계 카드가 bg-white 로 고정인 이유가 그것이다 — bg-card 로 두면
 *    다크모드에서 카드가 배경에 녹아 "튀어나온" 인상이 사라진다.
 */
export function RedesignWhyJsl() {
  const { redesign } = useContent()
  const { whyJsl } = redesign
  const { reveal, parent, up, x } = useRevealMotion()

  return (
    /*
      id 는 why-jsl 이다. #about 은 AboutSection(회사 상세 소개)의 앵커라
      네비게이션이 그쪽을 가리킨다 — 두 섹션이 같은 id 를 갖게 하지 말 것.
    */
    <section id="why-jsl" className="bg-brand-navy-deep py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
          {/* ── 왼쪽: 오른쪽에서 들어온다 ─────────────────────────────── */}
          <motion.div variants={x(REVEAL_OFFSET_X)} {...reveal}>
            <p className="text-brand-slate flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
              <span className="text-brand-orange" aria-hidden="true">◇</span>
              {whyJsl.eyebrow}
            </p>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {whyJsl.title}
            </h2>
            <p className="text-brand-slate mt-4 max-w-md text-sm">
              {whyJsl.description}
            </p>

            <ul className="mt-9 space-y-3">
              {whyJsl.cards.map((card) => (
                <li
                  key={card.title}
                  className="rounded-lg border border-white/15 px-5 py-4"
                >
                  <p className="text-sm font-semibold text-white">{card.title}</p>
                  <p className="text-brand-slate tabular-figures mt-1 text-xs">
                    {card.subtitle}
                  </p>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* ── 오른쪽: 왼쪽에서 들어온다 ─────────────────────────────── */}
          <motion.div
            variants={x(-REVEAL_OFFSET_X)}
            {...reveal}
            /*
              통계 카드가 사진 밖으로 나가므로 자르지 않는다.
              pb/pl 은 튀어나온 카드가 아래 콘텐츠를 덮지 않도록 비워 둔 자리다.

              ⚠️ sm 미만에서는 겹침을 주지 않아 카드가 일반 흐름에 있다. 그때도
                 pb-16 을 걸면 아무것도 없는 64px 여백만 남는다 — 겹침이 시작되는
                 sm 부터만 준다.
            */
            className="relative sm:pb-16 lg:pb-12 lg:pl-10"
          >
            {/* 뒤에 깔리는 큰 사진 — 창고 운영 현장 */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src={LANDING_PHOTOS.warehouseOps}
                alt=""
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>

            {/*
              어긋나게 겹치는 작은 사진 — 컨테이너 야드.
              모바일에서는 화면 폭이 좁아 겹치면 두 장 다 잘려 보이므로
              겹침을 sm 이상에서만 준다. ring 은 섹션 배경색과 같은 값이라
              두 사진 사이에 여백이 있는 것처럼 보이게 한다.
            */}
            <div className="ring-brand-navy-deep relative mt-4 ml-auto h-40 w-2/3 overflow-hidden rounded-xl ring-4 sm:absolute sm:-bottom-2 sm:-left-6 sm:mt-0 sm:h-44 sm:w-1/2 lg:-left-4">
              <Image
                src={LANDING_PHOTOS.containerYard}
                alt=""
                fill
                sizes="(min-width: 640px) 25vw, 66vw"
                className="object-cover"
              />
            </div>

            {/* 모서리에 걸치는 통계 카드 — 고정 흰색 (위 주석 참고) */}
            <div className="mt-4 inline-block rounded-xl bg-white px-6 py-4 shadow-lg sm:absolute sm:-right-2 sm:-bottom-6 sm:mt-0 lg:-right-4">
              <p className="text-brand-navy-deep tabular-figures text-3xl font-bold">
                {whyJsl.highlight.value}
              </p>
              <p className="text-brand-navy-deep/70 mt-1 text-xs">
                {whyJsl.highlight.label}
              </p>
            </div>
          </motion.div>
        </div>

        {/*
          하단 보조 지표 3칸. 그리드 카드용 리빌(아래에서 위로 + 100ms 순번)을
          쓰는 유일한 자리라, 좌우 스플릿과 움직임이 겹치지 않게 별도 컨테이너다.
        */}
        <motion.ul
          variants={parent}
          {...reveal}
          className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-white/15 sm:grid-cols-3"
        >
          {whyJsl.stats.map((stat) => (
            <motion.li
              key={stat.label}
              variants={up}
              className="bg-brand-navy-deep px-6 py-6"
            >
              <p className="tabular-figures text-2xl font-semibold text-white">
                {stat.value}
              </p>
              <p className="text-brand-slate mt-1 text-xs">{stat.label}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
