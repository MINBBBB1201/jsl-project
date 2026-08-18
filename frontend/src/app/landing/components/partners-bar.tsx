"use client"

import Image from 'next/image'

import { useContent } from '@/config/use-content'

/**
 * 제휴 항공사·특송 파트너 신뢰신호 바
 *
 * 무한 스크롤(마퀴)로 흘린다. 파트너가 늘어도 줄바꿈으로 높이가 튀지 않고,
 * 정지된 목록보다 "네트워크가 돌아가고 있다"는 인상을 준다.
 *
 * ── 구현 ────────────────────────────────────────────────────────────────
 * 같은 목록을 두 벌 이어 붙이고 -50% 만큼 밀면 이음매 없이 반복된다
 * (globals.css 의 marquee-scroll). JS 없이 CSS 만으로 돌아서 메인 스레드를
 * 쓰지 않고, 동작 줄이기 설정에서는 전역 규칙이 멈춘다.
 * 두 번째 벌은 스크린리더에 중복으로 읽히지 않도록 aria-hidden 이다.
 *
 * ── 왜 다크 배경인가 ────────────────────────────────────────────────────
 * 바로 위 통계 섹션과 같은 --brand-navy-deep 을 써서 둘이 하나의 다크 블록으로
 * 이어진다. "우리 규모 + 우리가 함께 일하는 회사들"은 결국 같은 이야기(신뢰)라
 * 한 덩어리로 두는 편이 낫고, 밝은 띠를 사이에 끼우면 그 이야기가 두 번
 * 끊긴다. 두 섹션 사이는 얇은 흰 선(white/10)으로만 나눈다.
 *
 * ── 왜 흰 상자를 없앴나 ─────────────────────────────────────────────────
 * 여섯 개를 모두 같은 크기의 흰 알약 상자에 담았더니, 로고마다 잉크 밀도가
 * 달라서(DHL·Deutsche Post 는 색이 꽉 찬 판, 대한항공은 얇은 워드마크) 같은
 * 상자 안에서 크기감이 들쭉날쭉해 보였다. 상자를 걷어내고 배경 위에 직접
 * 올리되, 어두워서 묻히는 셋(대한항공·동방항공·dpd)에만 로고 크기에 맞춘
 * 최소 흰 패치를 깐다. 어떤 로고가 패치를 받는지, 높이를 어떻게 정했는지는
 * config/use-content.ts 의 PARTNER_LOGOS 주석에 측정값과 함께 있다.
 *
 * 로고를 다크용으로 반전시키거나 흰색으로 덧칠하는 방법도 있지만 그건 상표를
 * 변형하는 것이라 쓸 수 없다. 패치는 로고를 건드리지 않고 바탕만 바꾼다.
 *
 * ⚠️ 로고 노출은 실제 제휴 관계가 확인된 뒤라야 한다 (상표권은 각 사에 있다).
 *
 * ⚠️ 이 섹션의 보조 글자에 --brand-slate 를 투명도 없이 쓴다. 처음엔 라벨과
 *    주석을 text-brand-slate/70 으로 흐리게 뒀는데, 다크 배경 위에서 대비가
 *    3.97:1 로 떨어져 WCAG AA(4.5:1)에 미달했다 (axe: color-contrast).
 *    불투명하면 6.77:1 로 통과한다. 더 흐리게 만들고 싶으면 투명도가 아니라
 *    대비를 계산한 별도 색 토큰을 만들 것.
 */
export function PartnersBar() {
  const { partners } = useContent()

  // 그룹 라벨과 항목을 한 줄로 펴서 하나의 띠로 만든다
  const entries = partners.groups.flatMap((group) =>
    group.items.map((item) => ({
      label: group.label,
      name: item.name,
      logo: item.logo,
    }))
  )

  return (
    <section className="bg-brand-navy-deep border-t border-white/10 pt-10 pb-12 sm:pt-12 sm:pb-14">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="text-brand-slate text-[11px] font-medium tracking-[0.14em] uppercase">
            {partners.title}
          </h2>
          <p className="text-brand-slate text-sm">{partners.description}</p>
        </div>
      </div>

      {/*
        마퀴는 컨테이너 밖으로 나가 화면 폭을 꽉 채운다.
        양끝 페이드로 잘린 항목이 딱딱하게 끊기지 않게 한다.
        ⚠️ 페이드 색은 섹션 배경(--brand-navy-deep)이어야 한다. --background 를
           쓰면 라이트 모드에서 흰색으로 페이드해 다크 배경 위에 흰 띠가 생긴다.
      */}
      <div className="marquee-track relative mt-8 overflow-hidden">
        <div
          className="from-brand-navy-deep pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r to-transparent sm:w-24"
          aria-hidden="true"
        />
        <div
          className="from-brand-navy-deep pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l to-transparent sm:w-24"
          aria-hidden="true"
        />

        <div
          className="animate-marquee flex w-max"
          style={{ ["--marquee-duration" as string]: "44s" }}
        >
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              className="flex shrink-0 items-stretch"
              aria-hidden={copy === 1 || undefined}
            >
              {entries.map((entry) => {
                const logo = (
                  <Image
                    src={entry.logo.src}
                    /*
                      두 번째 벌은 aria-hidden 이라 스크린리더가 로고 이름을
                      두 번 읽지 않는다. alt 는 회사명 그대로 — 로고 이미지의
                      대체 텍스트는 그 회사를 가리키는 이름이어야 한다.
                    */
                    alt={entry.name}
                    width={entry.logo.width}
                    height={entry.logo.height}
                    /*
                      unoptimized: SVG 는 Next 이미지 최적화 대상이 아니고
                      (dangerouslyAllowSVG 를 켜야 통과한다), 이미 벡터라
                      래스터 리사이즈로 얻을 것도 없다. 원본을 그대로 서빙한다.
                    */
                    unoptimized
                    /*
                      마퀴는 쉬지 않고 돌아서 지금 화면 밖에 있는 항목이 곧
                      들어온다. 기본값인 lazy 로 두면 흘러 들어오는 순간에야
                      받기 시작해 빈 칸이 지나간다. 여섯 개 합쳐 100KB 미만이라
                      처음부터 받는 편이 낫다.
                    */
                    loading="eager"
                    /*
                      높이만 지정하고 폭은 auto 로 둔다. 둘 다 CSS 로 박으면
                      내가 계산한 종횡비가 원본과 소수점 단위로 어긋나는 만큼
                      로고가 미세하게 찌그러진다. 높이만 주면 폭은 브라우저가
                      원본 종횡비에서 끌어내므로 왜곡이 수학적으로 0 이다.
                    */
                    style={{ height: entry.logo.height, width: 'auto' }}
                    className="max-w-none object-contain"
                  />
                )

                return (
                  <li
                    key={`${copy}-${entry.name}`}
                    className="mx-7 flex flex-col items-center justify-start gap-3"
                  >
                    <span className="text-brand-slate text-[10px] tracking-[0.12em] uppercase">
                      {entry.label}
                    </span>
                    {/*
                      로고 높이가 제각각이라(18~33px) 그대로 두면 라벨과의 간격이
                      들쑥날쑥해진다. 고정 높이 칸 안에서 가운데 정렬해 라벨 줄과
                      로고 줄이 각각 한 줄로 맞도록 한다. 칸에는 배경이 없어서
                      "상자"로 보이지는 않는다.
                    */}
                    <div className="flex h-11 items-center justify-center">
                      {entry.logo.patch ? (
                        /*
                          흰 패치. 로고를 감싸는 최소 크기 — inline-flex 라
                          로고 폭에 딱 붙고, 상하 6px·좌우 10px 여백만 준다.
                          모든 항목에 같은 크기 상자를 씌우던 예전과 달리
                          패치 크기가 로고마다 다르므로 "알약"으로 읽히지 않는다.

                          ⚠️ 반투명(bg-white/90 등)으로 옅게 만들지 말 것.
                             대한항공 로고는 글자 속 여백이 뚫린 게 아니라 흰색
                             (#fff)으로 칠해져 있다. 패치가 반투명이면 그 흰색만
                             순백으로 남고 주변 패치는 푸르스름해져, 로고 안에
                             색이 다른 얼룩이 생긴다.
                        */
                        <span className="inline-flex items-center justify-center rounded-[3px] bg-white px-2.5 py-1.5">
                          {logo}
                        </span>
                      ) : (
                        logo
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          ))}
        </div>
      </div>

      <div className="container mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        <p className="text-brand-slate text-xs">{partners.note}</p>
      </div>
    </section>
  )
}
