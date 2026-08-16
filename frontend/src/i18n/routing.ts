import { defineRouting } from "next-intl/routing"

/**
 * 다국어 라우팅 설정
 *
 * URL 프리픽스 방식(/en/landing, /zh/tracking)을 쓴다. SEO 상 각 언어가
 * 별도 URL 을 갖는 편이 유리하고, next-intl 이 기본으로 지원한다.
 *
 * 기본 언어는 한국어다. localePrefix 를 'as-needed' 로 두면 한국어는
 * 프리픽스 없이 /landing 으로 접근되고 기존 링크가 그대로 살아있다.
 *
 * 대시보드(/dashboard)와 인증(/sign-in 등)은 내부용이라 번역 대상이 아니며,
 * middleware matcher 에서 제외한다.
 */
export const routing = defineRouting({
  locales: ["ko", "en", "zh", "vi"],
  defaultLocale: "ko",
  localePrefix: "as-needed",
  // 브라우저 Accept-Language 로 자동 리다이렉트하지 않는다.
  // 한국어 사이트에 해외에서 접속했을 때 의도치 않게 언어가 바뀌는 것을 막는다.
  localeDetection: false,
})

export type Locale = (typeof routing.locales)[number]

/** 언어 스위처에 표시할 이름 (각 언어는 그 언어 표기로) */
export const LOCALE_LABELS: Record<Locale, { label: string; short: string }> = {
  ko: { label: "한국어", short: "KO" },
  en: { label: "English", short: "EN" },
  zh: { label: "中文", short: "ZH" },
  vi: { label: "Tiếng Việt", short: "VI" },
}
