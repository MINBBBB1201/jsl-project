"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { AlertCircle, Info, Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  DEBOUNCE_MS,
  RESULT_LIMIT,
  useHsCodes,
  type HsEntry,
} from "./use-hs-codes"

/**
 * HS 코드 조회 — 참고용 정보 화면
 *
 * ⚠️ HS 설명은 로케일과 무관하게 항상 영어 원문이다. 데이터셋(WCO/UN Comtrade)에
 *    영어 명칭만 있고, 6,900여 항목을 번역하는 것은 별개의 작업이다. 화면 UI
 *    텍스트만 4개 로케일로 번역한다. 이 사정은 상단 안내 박스에 그대로 적어 둔다.
 *
 * ⚠️ 이 화면은 참고 정보일 뿐 신고 코드를 확정해 주지 않는다. JSL 은 포워더·
 *    브로커 파트너 체제라 직접 통관 신고를 하지 않는다. 안내 문구를 지우거나
 *    "이 코드로 신고하세요" 류의 표현으로 바꾸지 말 것.
 */

/** 계층 들여쓰기 한 단계의 폭(px). RTL 을 위해 margin-inline 으로 준다 */
const INDENT_STEP = 20

function CodeBadge({ code, className }: { code: string; className?: string }) {
  return (
    <code
      className={cn(
        "rounded border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium tabular-nums",
        className
      )}
    >
      {code}
    </code>
  )
}

/**
 * 매칭된 부분을 표시한다.
 *
 * <mark> 기본 스타일(노란 배경 + 검은 글자)은 다크모드에서 읽을 수 없으므로
 * 색을 직접 준다. primary 는 라이트에서 네이비, 다크에서 밝은 톤이라
 * 옅은 농도로 깔면 두 테마 모두에서 배경 위에 은은하게 얹힌다.
 */
function Highlight({ text, query }: { text: string; query: string }) {
  const parts = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return [text]

    const out: string[] = []
    const haystack = text.toLowerCase()
    let from = 0
    let at = haystack.indexOf(needle, from)
    while (at !== -1) {
      out.push(text.slice(from, at), text.slice(at, at + needle.length))
      from = at + needle.length
      at = haystack.indexOf(needle, from)
    }
    out.push(text.slice(from))
    return out
  }, [text, query])

  // 홀수 인덱스가 매칭 구간이다 (앞/뒤 조각이 비어도 자리를 지킨다)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="rounded bg-primary/15 px-0.5 text-foreground dark:bg-primary/25"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

function LevelLabel({ level }: { level: number }) {
  const t = useTranslations("hsCode")
  const key =
    level === 2 ? "levelChapter" : level === 4 ? "levelHeading" : "levelSubheading"
  return (
    <span className="text-xs text-muted-foreground">{t(key)}</span>
  )
}

/** Section II › 09 Coffee, tea… › 0901 Coffee, whether or not… */
function Breadcrumb({
  entry,
  ancestors,
}: {
  entry: HsEntry
  ancestors: HsEntry[]
}) {
  const t = useTranslations("hsCode")

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
      {/* 섹션은 원본에 제목이 없고 로마숫자만 있다 */}
      <span>
        {t("sectionLabel")} {entry.section}
      </span>
      {ancestors.map((step) => (
        <span key={step.code} className="flex items-center gap-1.5">
          <span aria-hidden className="text-muted-foreground/50">
            ›
          </span>
          <span className="font-mono tabular-nums">{step.code}</span>
          <span className="line-clamp-1 max-w-[22ch] sm:max-w-[34ch]">
            {step.description}
          </span>
        </span>
      ))}
    </p>
  )
}

function ResultItem({
  entry,
  ancestors,
  query,
}: {
  entry: HsEntry
  ancestors: HsEntry[]
  query: string
}) {
  return (
    <li className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <CodeBadge code={entry.code} />
        <LevelLabel level={entry.level} />
      </div>
      {/* 설명은 영어 원문 — lang 을 붙여 스크린리더가 영어로 읽게 한다 */}
      <p className="mt-2 text-sm" lang="en">
        <Highlight text={entry.description} query={query} />
      </p>
      <Breadcrumb entry={entry} ancestors={ancestors} />
    </li>
  )
}

/** 코드를 정확히 입력했을 때: 조상 체인을 들여쓰기로 펼친다 */
function HierarchyView({
  entry,
  ancestors,
}: {
  entry: HsEntry
  ancestors: HsEntry[]
}) {
  const t = useTranslations("hsCode")
  const steps = [...ancestors, entry]

  return (
    <section className="rounded-lg border p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">
        {t("hierarchyTitle")}
      </h2>

      <ol className="space-y-2">
        <li className="text-xs text-muted-foreground">
          {t("sectionLabel")} {entry.section}
        </li>
        {steps.map((step, index) => (
          <li
            key={step.code}
            style={{ marginInlineStart: (index + 1) * INDENT_STEP }}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
          >
            <CodeBadge
              code={step.code}
              className={cn(
                step.code === entry.code && "border-primary/40 bg-primary/10"
              )}
            />
            <span
              lang="en"
              className={cn(
                "text-sm",
                step.code === entry.code
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.description}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function HsCodeClient() {
  const t = useTranslations("hsCode")
  const { isLoading, failed, count, search, ancestorsOf } = useHsCodes()

  const [value, setValue] = useState("")
  const [query, setQuery] = useState("")

  /*
    입력이 멎은 뒤에만 거른다. 6,939 항목을 매 타건마다 훑으면 타이핑이 끊긴다.
    setState 는 타이머 콜백에서만 일어난다 (동기 setState 아님).
  */
  useEffect(() => {
    const id = setTimeout(() => setQuery(value.trim()), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [value])

  const result = useMemo(() => search(query), [search, query])
  const truncated = result.total > result.matches.length

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      </header>

      {/* 컴플라이언스 안내 — 항상 보인다 */}
      <div className="mb-8 flex gap-3 rounded-lg border bg-muted/40 p-4">
        <Info
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">{t("complianceNotice")}</p>
      </div>

      {/* 조회 폼 — 입력 중에도 걸러지지만, 버튼은 디바운스를 건너뛴다 */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setQuery(value.trim())
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("inputPlaceholder")}
          aria-label={t("inputLabel")}
          className="flex-1"
          disabled={isLoading || failed}
        />
        <Button type="submit" disabled={isLoading || failed} className="cursor-pointer">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          {t("search")}
        </Button>
      </form>

      <p className="mt-2 text-xs text-muted-foreground">
        {isLoading ? t("loading") : t("datasetNote", { count })}
      </p>

      {/* 결과 */}
      <div className="mt-8 space-y-6">
        {failed ? (
          <div className="flex gap-3 rounded-lg border border-destructive/50 p-4">
            <AlertCircle
              className="mt-0.5 size-5 shrink-0 text-destructive"
              aria-hidden
            />
            <div className="space-y-1">
              <p className="font-medium text-destructive">{t("loadFailedTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("loadFailedBody")}</p>
            </div>
          </div>
        ) : !query ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("emptyPrompt")}
          </p>
        ) : result.total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("noResults", { query })}
          </p>
        ) : (
          <>
            {/* 코드를 정확히 맞췄으면 계층부터 보여 준다 */}
            {result.exact && (
              <HierarchyView
                entry={result.exact}
                ancestors={ancestorsOf(result.exact)}
              />
            )}

            <div className="space-y-3">
              <p
                className="text-sm text-muted-foreground"
                aria-live="polite"
              >
                {truncated
                  ? t("tooManyResults", {
                      total: result.total,
                      shown: RESULT_LIMIT,
                    })
                  : t("resultCount", { total: result.total })}
              </p>

              <ul className="space-y-3">
                {result.matches.map((entry) => (
                  <ResultItem
                    key={entry.code}
                    entry={entry}
                    ancestors={ancestorsOf(entry)}
                    query={query}
                  />
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
