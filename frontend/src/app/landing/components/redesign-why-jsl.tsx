"use client"

import Image from "next/image"
import { motion } from "framer-motion"

import { TRANSPORT_PHOTOS } from "./transport-photos"
import { REVEAL_OFFSET_X, useRevealMotion } from "@/lib/landing-motion"

/**
 * Why JSL — 통계 스플릿 (랜딩 리디자인 1단계)
 *
 * ⚠️ 1단계는 구조와 애니메이션만. 색은 회색조, 카피는 [PLACEHOLDER: …] 다.
 *
 * ── 구조 ────────────────────────────────────────────────────────────────
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
 * 스펙대로 왼쪽 컬럼은 오른쪽에서(+x), 오른쪽 컬럼은 왼쪽에서(-x) 들어온다.
 * 두 컬럼이 가운데로 모이는 움직임이라, 바깥으로 벌어지는 것보다 한 덩어리로
 * 읽힌다.
 */
export function RedesignWhyJsl() {
  const { reveal, parent, up, x } = useRevealMotion()

  return (
    /*
      id="about" 을 유지한다. 네비게이션과 푸터의 "회사 소개" 링크가 이 앵커를
      가리키고 있어서, 앵커를 지우면 링크가 조용히 죽는다.
    */
    <section id="about" className="bg-neutral-900 py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
          {/* ── 왼쪽: 오른쪽에서 들어온다 ─────────────────────────────── */}
          <motion.div variants={x(REVEAL_OFFSET_X)} {...reveal}>
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">
              <span aria-hidden="true">◇</span>
              [PLACEHOLDER: EYEBROW 라벨]
            </p>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              [PLACEHOLDER: 섹션 제목]
            </h2>
            <p className="mt-4 max-w-md text-sm text-neutral-400">
              [PLACEHOLDER: 섹션 설명 한두 줄]
            </p>

            <ul className="mt-9 space-y-3">
              {[1, 2, 3].map((n) => (
                <li
                  key={n}
                  className="rounded-lg border border-white/15 px-5 py-4"
                >
                  <p className="text-sm font-semibold text-white">
                    [PLACEHOLDER: 신뢰 항목 {n}]
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    [PLACEHOLDER: 부제]
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
            {/* 뒤에 깔리는 큰 사진 */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src={TRANSPORT_PHOTOS.RAIL}
                alt=""
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover grayscale"
              />
            </div>

            {/*
              어긋나게 겹치는 작은 사진. 모바일에서는 화면 폭이 좁아 겹치면
              두 장 다 잘려 보이므로 겹침을 sm 이상에서만 준다.
            */}
            <div className="relative mt-4 ml-auto h-40 w-2/3 overflow-hidden rounded-xl ring-4 ring-neutral-900 sm:absolute sm:-bottom-2 sm:-left-6 sm:mt-0 sm:h-44 sm:w-1/2 lg:-left-4">
              <Image
                src={TRANSPORT_PHOTOS.SEA}
                alt=""
                fill
                sizes="(min-width: 640px) 25vw, 66vw"
                className="object-cover grayscale"
              />
            </div>

            {/* 모서리에 걸치는 통계 카드 */}
            <div className="mt-4 inline-block rounded-xl bg-white px-6 py-4 shadow-lg sm:absolute sm:-right-2 sm:-bottom-6 sm:mt-0 lg:-right-4">
              <p className="tabular-figures text-3xl font-bold text-neutral-900">
                [PLACEHOLDER: 수치]
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                [PLACEHOLDER: 통계 라벨]
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
          {[1, 2, 3].map((n) => (
            <motion.li
              key={n}
              variants={up}
              className="bg-neutral-900 px-6 py-6"
            >
              <p className="tabular-figures text-2xl font-semibold text-white">
                [PLACEHOLDER: 수치]
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                [PLACEHOLDER: 라벨 {n}]
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
