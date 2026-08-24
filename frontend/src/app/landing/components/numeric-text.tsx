import * as React from "react"

/**
 * 숫자만 Poppins 로 그리는 인라인 텍스트
 *
 * 통계 문구는 번역 파일에서 완성된 문자열로 온다 — "180억원" · "KRW 18B" ·
 * "18 tỷ KRW" · "6 chuyến/tuần" 처럼 언어마다 숫자가 놓이는 자리와 단위 표기가
 * 전부 다르다. 여기서 숫자 덩어리만 찾아 감싸고 나머지는 그대로 둔다.
 *
 * ── 왜 문자열 통째로 font-poppins 를 주면 안 되는가 ─────────────────────
 * Poppins 는 latin 서브셋만 싣는다. 한글·한자는 범위 밖이라 알아서 Pretendard 로
 * 넘어가지만, 베트남어는 다르다. Poppins 에 vietnamese 서브셋이 없고 latin-ext 도
 * U+1E9F 까지라 'ế'(U+1EBF) · 'ầ' · 'ỷ' 같은 글자만 폴백으로 떨어진다. 결과로
 * "6 chuyến/tuần" 의 chuy|ế|n 처럼 한 단어 안에서 서체가 갈린다.
 * 그래서 1bfe75d 에서는 이 자리들을 아예 건드리지 않고 남겨 뒀다.
 *
 * ── 숫자 판정은 count-up 과 같은 정규식을 쓴다 ──────────────────────────
 * 카운트업이 접두사/숫자/접미사를 가르는 기준과 여기서 감싸는 기준이 다르면,
 * 같은 화면의 "180억원"(카운트업)과 "18 tỷ KRW"(정적)에서 Poppins 가 붙는 범위가
 * 달라진다. NUMBER_PATTERN 을 이 파일에 두고 count-up.tsx 가 가져다 쓴다.
 *
 * ⚠️ 카운트업과 달리 첫 덩어리가 아니라 모든 덩어리를 감싼다. "5+1"(운송 모드
 *    5개 + 컨설팅)처럼 한 값에 숫자가 둘인 표기가 있는데, 첫 덩어리만 감싸면
 *    5 는 Poppins 고 1 은 아니어서 같은 토큰 안에서 서체가 갈린다 — 위에서
 *    베트남어 때문에 피하려던 것과 같은 현상이다.
 *
 * ⚠️ 숫자에 붙는 기호(+ · / · 쉼표 뒤 공백)는 감싸지 않는다. "20+" 는 20 만
 *    Poppins 다. StatsSection 의 "30개사+" 가 이미 같은 방식으로 나가고 있어
 *    맞춰 뒀다 — 여기서 규칙을 바꾸면 두 섹션의 숫자가 서로 달라 보인다.
 */

/** 숫자 덩어리 — 천단위 쉼표와 소수점을 포함한다 */
export const NUMBER_PATTERN = /\d[\d,]*(?:\.\d+)?/

interface Segment {
  text: string
  numeric: boolean
}

/** 문자열을 숫자 덩어리와 그 사이 글자로 쪼갠다 */
function splitNumericRuns(value: string): Segment[] {
  /*
    호출할 때마다 새로 만든다. 모듈 수준에 g 플래그 정규식을 두고 돌려쓰면
    lastIndex 가 남아 다음 호출이 문자열 중간부터 훑는 고전적인 함정이 있다.
  */
  const pattern = new RegExp(NUMBER_PATTERN.source, "g")
  const segments: Segment[] = []
  let cursor = 0

  let match: RegExpExecArray | null
  while ((match = pattern.exec(value)) !== null) {
    if (match.index > cursor) {
      segments.push({ text: value.slice(cursor, match.index), numeric: false })
    }
    segments.push({ text: match[0], numeric: true })
    cursor = match.index + match[0].length
  }

  if (cursor < value.length) {
    segments.push({ text: value.slice(cursor), numeric: false })
  }

  return segments
}

/**
 * 숫자 부분만 Poppins 로 감싼 텍스트를 그린다.
 *
 * 감싸는 요소를 따로 만들지 않고 조각만 돌려주므로, 쓰는 쪽의 <dd>·<p> 에
 * 붙어 있는 크기·굵기·tabular-figures 가 그대로 상속된다.
 */
export function NumericText({ value }: { value: string }) {
  return (
    <>
      {splitNumericRuns(value).map((segment, index) =>
        segment.numeric ? (
          <span key={index} className="font-poppins">
            {segment.text}
          </span>
        ) : (
          <React.Fragment key={index}>{segment.text}</React.Fragment>
        )
      )}
    </>
  )
}
