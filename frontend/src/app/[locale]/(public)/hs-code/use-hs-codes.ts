"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

/**
 * HS 코드 데이터 적재 + 검색
 *
 * 데이터는 scripts/build-hs-codes.mjs 가 만들어 저장소에 커밋해 둔
 * src/data/hs-codes.json 이다 (6,939 항목, 약 1.2MB). 브라우저가 외부에서
 * 받아오지 않는다.
 *
 * ⚠️ 정적 import 가 아니라 동적 import 를 쓴다. 1.2MB 를 페이지 첫 번들에
 *    실으면 검색을 한 번도 하지 않는 방문자까지 그 비용을 낸다. 동적 import 는
 *    Next 가 별도 청크로 잘라 주므로 이 페이지에 들어온 뒤에 따로 받는다.
 */

export interface HsEntry {
  code: string
  description: string
  /** 최상위(챕터)는 null. 원본 CSV 의 합성 루트 "TOTAL" 을 끊어 낸 자리다 */
  parentCode: string | null
  /** 2=chapter, 4=heading, 6=subheading */
  level: number
  /** 섹션 로마숫자(I~XXI). 이 데이터셋에 섹션 제목은 없다 */
  section: string
}

/** 이보다 많이 걸리면 잘라 보여주고 검색어를 좁히라고 안내한다 */
export const RESULT_LIMIT = 50

/** 입력이 멎고 이만큼 지나면 거른다. 6,939 항목을 매 타건마다 훑지 않기 위한 것 */
export const DEBOUNCE_MS = 200

/** 코드로 볼지 설명으로 볼지 가르는 기준 — 2~6 자리 숫자면 코드로 본다 */
const CODE_PATTERN = /^\d{2,6}$/

export interface SearchResult {
  /** 화면에 그릴 항목 (RESULT_LIMIT 까지) */
  matches: HsEntry[]
  /** 자르기 전 전체 건수 */
  total: number
  /** 입력값과 코드가 정확히 일치하는 항목 — 있으면 계층 탐색 뷰를 띄운다 */
  exact: HsEntry | null
}

const EMPTY: SearchResult = { matches: [], total: 0, exact: null }

export function useHsCodes() {
  const [entries, setEntries] = useState<HsEntry[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    // setState 는 then/catch 안에서만 일어난다 (동기 setState 아님)
    import("@/data/hs-codes.json")
      .then((mod) => {
        if (cancelled) return
        setEntries((mod.default as { entries: HsEntry[] }).entries)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const byCode = useMemo(() => {
    const map = new Map<string, HsEntry>()
    for (const entry of entries ?? []) map.set(entry.code, entry)
    return map
  }, [entries])

  /**
   * 조상 체인을 위에서 아래 순서로 돌려준다 (챕터 → 헤딩 → …).
   * 자기 자신은 넣지 않는다.
   */
  const ancestorsOf = useCallback(
    (entry: HsEntry) => {
      const chain: HsEntry[] = []
      let cursor = entry.parentCode ? byCode.get(entry.parentCode) : undefined
      // 데이터가 깨져 순환이 생기면 화면이 멈추므로 깊이를 막아 둔다 (실제 최대 2단계)
      while (cursor && chain.length < 8) {
        chain.unshift(cursor)
        cursor = cursor.parentCode ? byCode.get(cursor.parentCode) : undefined
      }
      return chain
    },
    [byCode]
  )

  const search = useCallback(
    (raw: string): SearchResult => {
      const query = raw.trim()
      if (!query || !entries) return EMPTY

      const isCode = CODE_PATTERN.test(query)
      const needle = query.toLowerCase()

      const found: HsEntry[] = []
      for (const entry of entries) {
        /*
          숫자만 넣었으면 코드 앞자리로만 본다. 설명까지 뒤지면 "09" 같은 입력에
          연도·수량이 들어간 문장이 잔뜩 걸려 정작 09 챕터가 묻힌다.
        */
        const hit = isCode
          ? entry.code.startsWith(query)
          : entry.description.toLowerCase().includes(needle)
        if (hit) found.push(entry)
      }

      return {
        matches: found.slice(0, RESULT_LIMIT),
        total: found.length,
        exact: isCode ? byCode.get(query) ?? null : null,
      }
    },
    [entries, byCode]
  )

  return {
    /** 아직 데이터를 받는 중 */
    isLoading: entries === null && !failed,
    failed,
    count: entries?.length ?? 0,
    search,
    ancestorsOf,
  }
}
