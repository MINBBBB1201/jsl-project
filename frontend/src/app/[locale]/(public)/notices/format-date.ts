/**
 * 공지사항 카드 날짜 표기. tracking/format-date.ts 와 같은 시그니처
 * ((값, 로케일) → 문자열) — 로케일별 Intl.DateTimeFormat 을 모듈 수준에서
 * 재사용한다.
 */

import type { Locale } from "@/i18n/routing"

export const DATE_FALLBACK = "—"

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
