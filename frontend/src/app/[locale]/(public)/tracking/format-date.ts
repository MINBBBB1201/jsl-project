/**
 * 추적 화면 날짜 표기
 *
 * 진행 타임라인(tracking-stepper)이 shippedAt / estimatedArrivalAt 두 날짜를
 * 같은 모양으로 찍어야 해서 포맷을 한 곳에 모았다.
 *
 * 로케일은 호출부가 넘긴다 — config/legal-content.ts 의 formatDate 와 같은
 * (값, 로케일) 시그니처다. 훅(useFormatter)이 아니라 순수 함수로 둔 것은
 * DATE_FALLBACK 판정을 함께 내보내야 하기 때문이다. 화면 쪽에서는 next-intl 의
 * useLocale() 로 현재 언어를 받아 넘긴다 (language-switcher 와 같은 방식).
 *
 * legal-content 쪽이 Intl 대신 언어별 문자열을 손으로 조립하는 것은 그 날짜가
 * 문장 안에 들어가기 때문이다("본 약관은 …부터 시행합니다"). 여기 날짜는 홀로
 * 서는 데이터라 각 언어의 표준 표기를 그대로 쓰는 Intl 이 맞다.
 */

import type { Locale } from "@/i18n/routing"

/** 날짜가 없거나 파싱되지 않을 때 쓰는 표기. 호출부가 "값 없음"을 구분하는 데도 쓴다. */
export const DATE_FALLBACK = "—"

/**
 * Intl.DateTimeFormat 은 만드는 쪽이 비싸고 쓰는 쪽은 싸다. 로케일이 넷뿐이라
 * 만든 것을 모듈 수준에서 들고 재사용한다.
 */
const formatters = new Map<Locale, Intl.DateTimeFormat>()

const formatterFor = (locale: Locale) => {
  const cached = formatters.get(locale)
  if (cached) return cached

  const created = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  formatters.set(locale, created)
  return created
}

export const formatDate = (value: string | null, locale: Locale) => {
  if (!value) return DATE_FALLBACK
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return DATE_FALLBACK
  return formatterFor(locale).format(date)
}
