"use client"

import { useContent } from '@/config/use-content'

/**
 * 제휴 항공사·특송 파트너 신뢰신호 바
 *
 * ⚠️ 로고 이미지 대신 텍스트 워드마크만 쓴다 (상표 문제).
 *    자세한 이유는 landing-content.ts 의 partners 주석 참고.
 */
export function PartnersBar() {
  const { partners } = useContent()

  return (
    <section className="border-y bg-muted/40 py-10 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {partners.title}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {partners.description}
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-6 lg:flex-row lg:justify-center lg:gap-12">
          {partners.groups.map((group) => (
            <div
              key={group.label}
              className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
            >
              <span className="shrink-0 rounded-full border border-brand-cta/40 px-2.5 py-0.5 text-xs font-medium text-brand-cta">
                {group.label}
              </span>

              <ul className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {group.items.map((item) => (
                  <li
                    key={item.name}
                    className="rounded-md border bg-background px-3 py-2 text-center shadow-xs"
                  >
                    <span className="block text-sm font-semibold tracking-tight text-foreground">
                      {item.name}
                    </span>
                    {"nameEn" in item && item.nameEn && (
                      <span className="block text-[11px] text-muted-foreground">
                        {item.nameEn}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {partners.note}
        </p>
      </div>
    </section>
  )
}
