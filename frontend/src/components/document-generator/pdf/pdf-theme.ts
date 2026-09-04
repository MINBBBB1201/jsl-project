import { Font, StyleSheet } from "@react-pdf/renderer"

/**
 * PDF 공통 폰트 · 색 · 스타일.
 *
 * 서류는 통관·은행 제출용이라 화면 UI 처럼 꾸미지 않는다. 브랜드 색은
 * 레터헤드 강조선과 표 머리 배경에만 쓰고 나머지는 흑백 고대비로 둔다.
 */

/**
 * 브랜드 색 — globals.css 의 oklch 토큰을 sRGB 로 변환한 값이다.
 *
 * ⚠️ CSS 변수를 그대로 넘길 수 없다. @react-pdf 는 브라우저 CSS 엔진이 아니라
 *    자체 파서를 쓰고 oklch() 를 모른다(hex/rgb/색이름만 읽는다). var(--...) 도
 *    당연히 해석하지 못한다. 그래서 여기에 hex 로 못 박아 둔다.
 *    globals.css 의 --brand-navy-deep / --brand-orange-deep 이 바뀌면 같이 고쳐야 한다.
 */
export const PDF_COLORS = {
  /** --brand-navy-deep · oklch(0.2169 0.0442 257.7) */
  navy: "#0c1a2e",
  /** --brand-orange-deep · oklch(0.603 0.204 35.3) */
  orange: "#e0400e",
  text: "#111111",
  muted: "#555555",
  border: "#999999",
  hairline: "#cccccc",
  tableHead: "#eef1f5",
  zebra: "#f7f8fa",
} as const

/**
 * 한글 폰트 임베딩.
 *
 * ⚠️ 등록하지 않으면 한글이 깨진다. @react-pdf 의 기본 폰트(Helvetica)는
 *    표준 14 폰트라 한글 글리프가 아예 없어서, 품명에 한글을 쓰면 PDF 에
 *    "4 $¸Ìl |°0" 같은 쓰레기 문자가 박힌다(실측 확인).
 *
 * Pretendard 를 쓰는 이유:
 *   - 이 프로젝트가 화면 본문 폰트로 이미 쓰고 있어 서류와 사이트의 인상이 같다.
 *   - SIL OFL 이라 임베딩·재배포에 제약이 없다 (public/fonts/pretendard-pdf/LICENSE.txt).
 *
 * ⚠️ 화면용 public/fonts/pretendard 의 woff2 를 재사용할 수 없다. @react-pdf 는
 *    TTF/OTF 만 읽는다(woff2 미지원). 또 그쪽은 유니코드 구간별로 쪼갠 서브셋이라
 *    한 파일에 전체 한글이 들어 있지도 않다. 그래서 원본 TTF 를 따로 둔다.
 *
 * 파일이 5MB 가량이지만 페이지 로드에는 영향이 없다 — @react-pdf 가 PDF 를
 * 만드는 시점에 이 URL 을 받아오고, 출력 PDF 에는 실제 쓰인 글리프만
 * 서브셋으로 들어간다(실측: 한 줄짜리 문서에서 7KB).
 */
const FONT_FAMILY = "PretendardPdf"

let registered = false

export function registerPdfFonts() {
  if (registered) return
  Font.register({
    family: FONT_FAMILY,
    fonts: [
      { src: "/fonts/pretendard-pdf/Pretendard-Regular.ttf", fontWeight: 400 },
      { src: "/fonts/pretendard-pdf/Pretendard-Bold.ttf", fontWeight: 700 },
    ],
  })

  /**
   * 하이픈 분철을 끈다. 기본 분철기는 영어 기준이라 "COMMERCIAL" 같은 낱말이나
   * 한글 품명을 엉뚱한 자리에서 끊는다. 서류에서는 줄바꿈이 어긋나는 편이
   * 낱말이 쪼개지는 것보다 낫다.
   */
  Font.registerHyphenationCallback((word) => [word])

  registered = true
}

export const pdfFontFamily = FONT_FAMILY

export const styles = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    color: PDF_COLORS.text,
    paddingTop: 28,
    paddingBottom: 40,
    paddingHorizontal: 32,
    lineHeight: 1.4,
  },

  // ── 레터헤드 ────────────────────────────────────────────────
  letterhead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.orange,
    paddingBottom: 8,
  },
  brandName: { fontSize: 14, fontWeight: 700, color: PDF_COLORS.navy },
  brandTag: { fontSize: 7, color: PDF_COLORS.muted, marginTop: 2 },
  docTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: PDF_COLORS.navy,
    textAlign: "right",
    letterSpacing: 0.6,
  },

  metaGrid: { flexDirection: "row", marginTop: 8, gap: 16 },
  metaCell: { flexDirection: "row", gap: 4 },
  metaLabel: { color: PDF_COLORS.muted, fontSize: 7 },
  metaValue: { fontWeight: 700, fontSize: 8 },

  // ── 당사자 2단 ──────────────────────────────────────────────
  partyRow: { flexDirection: "row", marginTop: 12, gap: 10 },
  partyBox: {
    flex: 1,
    borderWidth: 0.7,
    borderColor: PDF_COLORS.border,
  },
  partyHead: {
    backgroundColor: PDF_COLORS.navy,
    color: "#ffffff",
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.5,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  partyBody: { padding: 6, gap: 2 },
  partyName: { fontWeight: 700, fontSize: 9 },
  partyLine: { fontSize: 7.5, color: PDF_COLORS.text },
  partyMuted: { fontSize: 7, color: PDF_COLORS.muted },

  // ── 배송조건 스트립 ─────────────────────────────────────────
  conditions: {
    marginTop: 10,
    borderWidth: 0.7,
    borderColor: PDF_COLORS.border,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  conditionCell: {
    width: "25%",
    borderRightWidth: 0.5,
    borderRightColor: PDF_COLORS.hairline,
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.hairline,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  conditionLabel: {
    fontSize: 6.5,
    color: PDF_COLORS.muted,
    letterSpacing: 0.3,
  },
  conditionValue: { fontSize: 8, fontWeight: 700, marginTop: 1 },

  // ── 품목 표 ────────────────────────────────────────────────
  table: { marginTop: 12, borderWidth: 0.7, borderColor: PDF_COLORS.border },
  tableHead: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.tableHead,
    borderBottomWidth: 0.7,
    borderBottomColor: PDF_COLORS.border,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.4,
    borderBottomColor: PDF_COLORS.hairline,
  },
  tableRowZebra: { backgroundColor: PDF_COLORS.zebra },
  th: {
    fontSize: 6.8,
    fontWeight: 700,
    color: PDF_COLORS.navy,
    paddingVertical: 4,
    paddingHorizontal: 4,
    letterSpacing: 0.2,
  },
  td: { fontSize: 7.5, paddingVertical: 4, paddingHorizontal: 4 },
  right: { textAlign: "right" },
  center: { textAlign: "center" },

  // ── 하단 ───────────────────────────────────────────────────
  footRow: { flexDirection: "row", marginTop: 12, gap: 12 },
  certBox: { flex: 1.35 },
  certText: { fontSize: 7, color: PDF_COLORS.text, lineHeight: 1.5 },
  signBlock: { marginTop: 22 },
  signLine: {
    borderTopWidth: 0.7,
    borderTopColor: PDF_COLORS.text,
    marginTop: 18,
    paddingTop: 3,
  },
  signLabel: { fontSize: 6.5, color: PDF_COLORS.muted },

  totalsBox: {
    flex: 1,
    borderWidth: 0.7,
    borderColor: PDF_COLORS.border,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 0.4,
    borderBottomColor: PDF_COLORS.hairline,
  },
  totalsRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: PDF_COLORS.navy,
  },
  totalsLabel: { fontSize: 7.5, color: PDF_COLORS.muted },
  totalsValue: { fontSize: 8, fontWeight: 700 },
  totalsLabelStrong: { fontSize: 8, color: "#ffffff", fontWeight: 700 },
  totalsValueStrong: { fontSize: 9.5, color: "#ffffff", fontWeight: 700 },

  marks: {
    marginTop: 10,
    borderWidth: 0.7,
    borderColor: PDF_COLORS.border,
    padding: 6,
  },

  pageFooter: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: PDF_COLORS.hairline,
    paddingTop: 5,
    fontSize: 6.5,
    color: PDF_COLORS.muted,
  },
  disclaimer: { marginTop: 8, fontSize: 6.5, color: PDF_COLORS.muted },
})
