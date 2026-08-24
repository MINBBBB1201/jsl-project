#!/usr/bin/env node
/**
 * src/data/hs-codes.json 을 다시 만든다.
 *
 *   node scripts/build-hs-codes.mjs
 *   node scripts/build-hs-codes.mjs --source ./hs.csv
 *   node scripts/build-hs-codes.mjs --out src/data/hs-codes.json
 *
 * ── 이 스크립트가 있는 이유 ────────────────────────────────────────────
 * HS 코드 6,939 개는 손으로 적을 수 없고, 그렇다고 사용자 브라우저가 매번
 * GitHub 에서 850KB CSV 를 받아 파싱하게 둘 수도 없다. 그래서 여기서 한 번
 * 받아 JSON 으로 바꿔 저장소에 커밋해 두고, 화면은 그 정적 파일만 읽는다.
 * WCO 가 HS 판을 올릴 때(현재 HS2022) 다시 돌리면 된다.
 *
 * 출처: datasets/harmonized-system (WCO / UN Comtrade, 퍼블릭 도메인)
 *
 * ⚠️ description 에 콤마가 들어간 따옴표 문자열이 많다
 *    ("Horses, asses, mules and hinnies; live"). split(',') 로 자르면
 *    조용히 깨지므로 반드시 CSV 파서를 거친다.
 *
 * ⚠️ 원본 CSV 에는 hscode 가 "TOTAL" 인 합성 루트 행이 하나 있다
 *    (level 5, "Total of all HS2022 commodities"). 실제 품목이 아니라 전체
 *    합계를 나타내는 행이라 버리고, 이 행을 부모로 가리키던 챕터들의
 *    parentCode 는 null 로 바꾼다.
 *
 * ⚠️ 섹션(I~XXI)은 CSV 에 별도 행이 없고 각 행의 section 컬럼에 로마숫자로만
 *    들어 있다. 섹션 제목은 이 데이터셋에 없으므로 만들어 넣지 않는다 —
 *    화면에서도 "Section I" 까지만 표시한다.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "csv-parse/sync"

const SOURCE_URL =
  "https://raw.githubusercontent.com/datasets/harmonized-system/master/data/harmonized-system.csv"

/** 실제 품목이 아닌 합성 루트 행의 코드 */
const SYNTHETIC_ROOT = "TOTAL"

/** 원본이 쓰는 계층 단계. 2=chapter, 4=heading, 6=subheading */
const LEVELS = new Set([2, 4, 6])

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)))

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const source = arg("source", SOURCE_URL)
const outPath = path.resolve(root, arg("out", "src/data/hs-codes.json"))

async function readSource(from) {
  if (/^https?:\/\//.test(from)) {
    process.stdout.write(`내려받는 중: ${from}\n`)
    const res = await fetch(from)
    if (!res.ok) throw new Error(`CSV 를 받지 못했습니다 (HTTP ${res.status})`)
    return res.text()
  }
  process.stdout.write(`읽는 중: ${from}\n`)
  return fs.readFileSync(path.resolve(root, from), "utf8")
}

const csv = await readSource(source)

const rows = parse(csv, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
})

const entries = []
for (const row of rows) {
  if (row.hscode === SYNTHETIC_ROOT) continue

  const level = Number(row.level)
  if (!LEVELS.has(level)) {
    throw new Error(`모르는 level 입니다: ${row.level} (${row.hscode})`)
  }

  entries.push({
    code: row.hscode,
    description: row.description,
    // 챕터의 부모는 합성 루트라 끊어 준다
    parentCode: row.parent === SYNTHETIC_ROOT ? null : row.parent,
    level,
    section: row.section,
  })
}

/*
  깨진 계층을 안고 커밋하지 않도록 여기서 막는다. 화면 쪽 breadcrumb 은
  parentCode 를 따라 올라가므로, 부모가 없는 코드가 하나라도 섞이면 그 항목의
  경로가 조용히 비어 버린다.
*/
const byCode = new Map(entries.map((e) => [e.code, e]))
if (byCode.size !== entries.length) {
  throw new Error(`코드가 중복됩니다 (${entries.length - byCode.size}건)`)
}

const orphans = entries.filter((e) => e.parentCode && !byCode.has(e.parentCode))
if (orphans.length) {
  throw new Error(
    `부모를 찾을 수 없는 코드 ${orphans.length}건: ` +
      orphans.slice(0, 5).map((e) => `${e.code}→${e.parentCode}`).join(", ")
  )
}

// 코드 오름차순이면 화면에서 따로 정렬하지 않아도 계층 순서대로 나온다
entries.sort((a, b) => a.code.localeCompare(b.code))

const payload = {
  /* 출처와 판(版)을 데이터 옆에 남긴다 — 나중에 이 JSON 만 보고도 어디서 왔는지 알 수 있게 */
  source: SOURCE_URL,
  license: "Public Domain (WCO / UN Comtrade via datasets/harmonized-system)",
  generatedAt: new Date().toISOString().slice(0, 10),
  count: entries.length,
  entries,
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(payload), "utf8")

const counts = entries.reduce((acc, e) => {
  acc[e.level] = (acc[e.level] || 0) + 1
  return acc
}, {})

process.stdout.write(
  `\n${path.relative(root, outPath)} 를 썼습니다\n` +
    `  항목 ${entries.length}개 ` +
    `(chapter ${counts[2]} / heading ${counts[4]} / subheading ${counts[6]})\n` +
    `  ${(fs.statSync(outPath).size / 1024).toFixed(0)}KB\n`
)
