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
 * ── 왜 흰 카드에 담는가 ─────────────────────────────────────────────────
 * 여섯 개 로고의 사정이 제각각이다. DHL·Deutsche Post·Royal Mail 은 노랑/빨강
 * 배경 상자를 품고 있어 어디에 올려도 읽히지만, 대한항공(네이비)·중국동방항공
 * (네이비+빨강)·dpd(짙은 회색 글자)는 흰 배경을 전제로 그려진 로고라 다크모드
 * 배경에 그대로 올리면 글자가 묻힌다.
 *
 * 로고를 다크용으로 반전시키거나 흰색으로 덧칠하는 방법도 있지만 그건 상표를
 * 변형하는 것이라 쓸 수 없다. 그래서 모든 로고를 같은 규격의 흰 카드에 담는다 —
 * 원본을 한 픽셀도 건드리지 않으면서 라이트/다크 양쪽에서 같은 대비를 얻고,
 * 카드 규격이 통일돼 로고 벽이 정돈돼 보인다.
 *
 * 로고 파일의 출처와 크기 산정 근거는 config/use-content.ts 의 PARTNER_LOGOS
 * 주석에 정리돼 있다.
 *
 * ⚠️ 로고 노출은 실제 제휴 관계가 확인된 뒤라야 한다 (상표권은 각 사에 있다).
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
    <section className="border-b bg-muted/30 py-10 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {partners.title}
          </h2>
          <p className="text-sm text-muted-foreground">{partners.description}</p>
        </div>
      </div>

      {/*
        마퀴는 컨테이너 밖으로 나가 화면 폭을 꽉 채운다.
        양끝 페이드로 잘린 항목이 딱딱하게 끊기지 않게 한다.
      */}
      <div className="marquee-track relative mt-6 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-24"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-24"
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
              {entries.map((entry) => (
                <li
                  key={`${copy}-${entry.name}`}
                  className="mx-2 flex flex-col justify-center gap-2 px-4"
                >
                  <span className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                    {entry.label}
                  </span>
                  <div className="flex h-16 w-48 items-center justify-center rounded-md border bg-white px-4">
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
                        높이만 지정하고 폭은 auto 로 둔다.

                        width/height 를 CSS 로 둘 다 박으면 내가 계산한 종횡비가
                        원본과 소수점 단위로 어긋나는 만큼 로고가 미세하게
                        찌그러진다. 높이만 주면 폭은 브라우저가 원본 종횡비에서
                        끌어내므로 왜곡이 수학적으로 0 이다.
                        (props 의 width 는 레이아웃 예약용 근삿값이다.)

                        예전에 h-auto w-auto max-w-full 로 뒀더니 width/height 가
                        무시되고 원본 크기로 그려지다 카드 폭에 잘렸다 — dpd 가
                        의도한 26px 대신 60px 로 나와 카드를 넘쳤다.
                      */
                      style={{ height: entry.logo.height, width: 'auto' }}
                      className="max-w-full object-contain"
                    />
                  </div>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="container mx-auto mt-6 px-4 sm:px-6 lg:px-8">
        <p className="text-xs text-muted-foreground">{partners.note}</p>
      </div>
    </section>
  )
}
