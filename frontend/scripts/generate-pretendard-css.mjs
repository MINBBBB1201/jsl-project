#!/usr/bin/env node
/**
 * src/app/pretendard.css 와 public/fonts/pretendard/*.woff2 를 다시 만든다.
 *
 *   node scripts/generate-pretendard-css.mjs
 *   node scripts/generate-pretendard-css.mjs --version 1.3.9 --weights 400,600,700
 *
 * ── 이 스크립트가 있는 이유 ────────────────────────────────────────────
 * pretendard.css 는 276개의 @font-face 로 이뤄진 156KB 짜리 생성물이라 손으로
 * 고칠 수 없다. 굵기를 하나 더 싣거나 Pretendard 버전을 올릴 때 이 스크립트를
 * 다시 돌리면 된다. 하는 일은 셋뿐이다.
 *   1. npm 레지스트리에서 pretendard 패키지를 받아 푼다
 *   2. 원하는 굵기의 동적 서브셋 woff2 를 public/fonts/pretendard/ 로 복사
 *   3. 공식 pretendard-dynamic-subset.css 에서 그 굵기만 추려 src 경로를
 *      자체 호스팅 경로로 바꿔 src/app/pretendard.css 로 쓴다
 *
 * ⚠️ unicode-range 는 공식 CSS 값을 한 글자도 바꾸지 않고 그대로 옮긴다.
 *    이 값이 곧 서브셋 분할 기준이라, 틀리면 해당 구간의 글자가 폰트를 못 찾아
 *    폴백으로 떨어진다. 직접 손보지 말 것.
 *
 * ⚠️ .woff 폴백 src 는 버린다 (woff2 만 남긴다). 대상 브라우저가 전부 woff2 를
 *    지원하고, 남기면 저장소 파일 수와 용량만 두 배가 된다.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback
}

const VERSION = arg('version', '1.3.9')
const WEIGHTS = arg('weights', '400,600,700').split(',').map((w) => w.trim())

/** Pretendard 파일명은 굵기 숫자가 아니라 이름을 쓴다 */
const WEIGHT_NAMES = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
}

const unknown = WEIGHTS.filter((w) => !WEIGHT_NAMES[w])
if (unknown.length) {
  console.error(`알 수 없는 굵기: ${unknown.join(', ')} (가능: ${Object.keys(WEIGHT_NAMES).join(', ')})`)
  process.exit(1)
}

const PUBLIC_DIR = path.join(ROOT, 'public', 'fonts', 'pretendard')
const CSS_OUT = path.join(ROOT, 'src', 'app', 'pretendard.css')

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pretendard-'))
try {
  console.log(`pretendard@${VERSION} 내려받는 중…`)
  execFileSync('npm', ['pack', `pretendard@${VERSION}`], { cwd: tmp, stdio: 'inherit', shell: true })
  const tgz = fs.readdirSync(tmp).find((f) => f.endsWith('.tgz'))
  if (!tgz) throw new Error('npm pack 결과 tgz 를 찾지 못했다')

  const base = 'package/dist/web/static'
  execFileSync('tar', ['-xzf', tgz, `${base}/woff2-dynamic-subset`, `${base}/pretendard-dynamic-subset.css`], {
    cwd: tmp,
    stdio: 'inherit',
    shell: true,
  })

  const srcFonts = path.join(tmp, base, 'woff2-dynamic-subset')
  const srcCss = fs.readFileSync(path.join(tmp, base, 'pretendard-dynamic-subset.css'), 'utf8')

  // 이전 결과물을 지우고 새로 깐다 (굵기를 줄였을 때 남는 파일이 없도록)
  fs.rmSync(PUBLIC_DIR, { recursive: true, force: true })
  fs.mkdirSync(PUBLIC_DIR, { recursive: true })

  const wanted = new Set(WEIGHTS)
  const kept = []
  for (const raw of srcCss.split('@font-face').slice(1)) {
    const body = raw.slice(raw.indexOf('{') + 1, raw.indexOf('}'))
    const get = (prop) => body.match(new RegExp(`${prop}\\s*:\\s*([^;]+);`))?.[1].trim() ?? null
    const weight = get('font-weight')
    if (!wanted.has(weight)) continue

    const file = get('src').match(/url\(([^)]*\.woff2)\)/)?.[1].split('/').pop()
    if (!file) throw new Error(`src 에서 woff2 를 못 찾았다: ${get('src')}`)
    fs.copyFileSync(path.join(srcFonts, file), path.join(PUBLIC_DIR, file))
    kept.push({ weight, file, range: get('unicode-range') })
  }

  if (!kept.length) throw new Error('추려진 @font-face 가 하나도 없다 — 공식 CSS 형식이 바뀌었는지 확인할 것')

  const perWeight = kept.reduce((a, k) => ({ ...a, [k.weight]: (a[k.weight] ?? 0) + 1 }), {})
  const header = `/*
 * Pretendard — 동적 서브셋 (자체 호스팅)
 *
 * ⚠️ 이 파일은 생성물이다. 손으로 고치지 말 것.
 *    바꾸려면 scripts/generate-pretendard-css.mjs 를 다시 돌린다.
 *      node scripts/generate-pretendard-css.mjs --version ${VERSION} --weights ${WEIGHTS.join(',')}
 *
 *    unicode-range 는 공식 배포본 값 그대로다. 이 값이 곧 서브셋 분할 기준이라
 *    한 글자라도 틀리면 해당 구간의 글자가 폴백 폰트로 떨어진다.
 *
 * ── 왜 next/font 가 아니라 직접 쓰는가 ─────────────────────────────────
 * next/font/local 의 src 항목은 path/weight/style 만 받아 파일별 unicode-range
 * 를 표현할 수 없다. 그래서 정적 서브셋(한 굵기당 264KB, 3종 790KB)을 통째로
 * 받는 수밖에 없었다. 유니코드 구간별로 쪼개 두면 브라우저가 페이지에 실제로
 * 쓰인 글자가 속한 구간의 파일만 골라 받는다 (실측 약 200KB).
 *
 * ── 폰트 패밀리 이름에 대한 중요한 주의 ────────────────────────────────
 * font-family 가 해시 이름이 아니라 그냥 'Pretendard' 다. 여기서 @font-face 로
 * 그 이름을 우리가 직접 정의하기 때문에, globals.css 의 --font-sans 에서도
 * 문자열 'Pretendard' 를 그대로 쓰면 이 웹폰트가 잡힌다.
 *
 * ⚠️ 예전 주석에 "문자열 'Pretendard' 는 사용자 PC 에 설치된 폰트를 가리키니
 *    쓰지 말 것"이라고 적혀 있었는데, 그건 next/font 가 해시 패밀리명을 만들던
 *    시절 이야기다. 지금은 반대다 — 문자열로 써야 맞다. (설치된 동명 폰트가
 *    있어도 @font-face 선언이 우선한다)
 *
 * 원본: https://github.com/orioncactus/pretendard  v${VERSION}
 *       dist/web/static/pretendard-dynamic-subset.css
 *       SIL Open Font License 1.1
 *
 * 생성 규칙: 굵기 ${WEIGHTS.join('/')} · @font-face ${kept.length}개
 *           (${Object.entries(perWeight).map(([w, n]) => `${w}:${n}`).join(', ')})
 */

`

  const rules = kept
    .map(
      (k) => `@font-face {
  font-family: 'Pretendard';
  font-style: normal;
  font-display: swap;
  font-weight: ${k.weight};
  src: url('/fonts/pretendard/${k.file}') format('woff2');
  unicode-range: ${k.range};
}`
    )
    .join('\n')

  fs.writeFileSync(CSS_OUT, header + rules + '\n')

  const bytes = kept.reduce((s, k) => s + fs.statSync(path.join(PUBLIC_DIR, k.file)).size, 0)
  console.log(`\n${path.relative(ROOT, CSS_OUT)}  (@font-face ${kept.length}개, ${(fs.statSync(CSS_OUT).size / 1024).toFixed(1)}KB)`)
  console.log(`${path.relative(ROOT, PUBLIC_DIR)}  (woff2 ${kept.length}개, ${(bytes / 1024 / 1024).toFixed(2)}MB)`)
  console.log(`굵기별 조각 수: ${JSON.stringify(perWeight)}`)
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}
