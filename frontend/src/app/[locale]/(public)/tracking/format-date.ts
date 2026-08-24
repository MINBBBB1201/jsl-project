/**
 * 추적 화면 날짜 표기
 *
 * 결과 카드(tracking-client)와 진행 타임라인(tracking-stepper)이 같은 두 날짜
 * (shippedAt / estimatedArrivalAt)를 다뤄서 포맷을 한 곳에 모았다.
 *
 * ⚠️ 로케일이 ko-KR 로 고정돼 있다. 추적 화면은 ko/en/zh/vi 네 언어로 나가므로
 *    한국어가 아닌 화면에서도 날짜만 "2026년 1월 5일" 로 보인다. 기존 동작을
 *    그대로 옮긴 것이고, 고치려면 useFormatter(next-intl) 로 바꿔야 한다.
 */

/** 날짜가 없거나 파싱되지 않을 때 쓰는 표기. 호출부가 "값 없음"을 구분하는 데도 쓴다. */
export const DATE_FALLBACK = "—"

export const formatDate = (value: string | null) => {
  if (!value) return DATE_FALLBACK
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return DATE_FALLBACK
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
