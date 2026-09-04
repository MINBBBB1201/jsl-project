import { Document, Page, Text, View } from "@react-pdf/renderer"

import {
  computeTotals,
  formatMoney,
  formatNumber,
  lineAmount,
  lineVolumeCbm,
  parseAmount,
  type TradeDocumentInput,
  type TradeDocumentType,
  type TradeLineItem,
  type TradeParty,
} from "@/lib/trade-documents"
import { PDF_COLORS, registerPdfFonts, styles } from "./pdf-theme"

/**
 * 상업송장 / 포장명세서 PDF.
 *
 * 두 문서는 골격(레터헤드 · 당사자 2단 · 조건 스트립 · 품목표 · 하단 합계)이
 * 같고 다음만 다르다. 그래서 한 컴포넌트에서 그 네 군데만 갈라 쓴다.
 *
 *   상업송장                     포장명세서
 *   ─────────────────────────    ─────────────────────────
 *   Incoterms/결제조건/통화 표시   해당 필드 없음 (금액 정보를 빼는 것이 목적)
 *   품목표: 단가·금액             포장표: 박스수·중량·치수
 *   합계: 소계·총액               합계: 총포장수·순/총중량·CBM
 *   —                            Marks & Numbers 블록
 *
 * ⚠️ 서류 안의 라벨(Invoice No., Shipper/Exporter …)은 번역하지 않는다.
 *    국제 무역 서류의 표준 영문 표기라, 사이트 로케일이 한국어라고 해서
 *    "송하인" 으로 바꾸면 상대국 세관·은행이 읽는 서류로서 오히려 낯설어진다.
 *    사이트의 4개 언어는 이 도구의 UI(폼 라벨·버튼)에만 적용한다.
 */

/**
 * 인증문구.
 *
 * 포장명세서에 "this invoice is true and correct" 를 그대로 쓰면 서류 이름과
 * 본문이 어긋난다 — 통관 서류에서는 그 자체로 흠이 잡히는 부분이라 문서
 * 종류별로 문장을 나눈다.
 */
const CERTIFICATION: Record<TradeDocumentType, string> = {
  invoice:
    "I/We hereby certify that this invoice is true and correct and the contents of this shipment are as stated above.",
  packing:
    "I/We hereby certify that the particulars stated in this packing list are true and correct and the contents of this shipment are as stated above.",
}

/** 값이 비면 서류에 빈칸 대신 표시할 문자 */
const dash = (value: string | undefined | null) => {
  const trimmed = (value ?? "").trim()
  return trimmed === "" ? "-" : trimmed
}

function PartyBox({ title, party }: { title: string; party: TradeParty }) {
  return (
    <View style={styles.partyBox}>
      <Text style={styles.partyHead}>{title}</Text>
      <View style={styles.partyBody}>
        <Text style={styles.partyName}>{dash(party.companyName)}</Text>
        <Text style={styles.partyLine}>{dash(party.address)}</Text>
        <Text style={styles.partyLine}>{dash(party.contact)}</Text>
        {party.taxId.trim() !== "" && (
          <Text style={styles.partyMuted}>Tax ID: {party.taxId.trim()}</Text>
        )}
      </View>
    </View>
  )
}

function ConditionCell({
  label,
  value,
  width,
}: {
  label: string
  value: string
  width?: string
}) {
  return (
    <View style={[styles.conditionCell, width ? { width } : {}]}>
      <Text style={styles.conditionLabel}>{label}</Text>
      <Text style={styles.conditionValue}>{value}</Text>
    </View>
  )
}

/* ── 품목표 ─────────────────────────────────────────────────── */

/** 상업송장 표: # / HS / 품명 / 원산지 / 수량 / 단위 / 단가 / 금액 */
const INVOICE_COLS = ["4%", "11%", "35%", "9%", "9%", "7%", "12%", "13%"] as const

function InvoiceTable({
  items,
  currency,
}: {
  items: TradeLineItem[]
  currency: string
}) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHead} fixed>
        <Text style={[styles.th, { width: INVOICE_COLS[0] }, styles.center]}>#</Text>
        <Text style={[styles.th, { width: INVOICE_COLS[1] }]}>HS CODE</Text>
        <Text style={[styles.th, { width: INVOICE_COLS[2] }]}>DESCRIPTION OF GOODS</Text>
        <Text style={[styles.th, { width: INVOICE_COLS[3] }, styles.center]}>ORIGIN</Text>
        <Text style={[styles.th, { width: INVOICE_COLS[4] }, styles.right]}>QTY</Text>
        <Text style={[styles.th, { width: INVOICE_COLS[5] }, styles.center]}>UNIT</Text>
        <Text style={[styles.th, { width: INVOICE_COLS[6] }, styles.right]}>
          UNIT PRICE
        </Text>
        <Text style={[styles.th, { width: INVOICE_COLS[7] }, styles.right]}>
          AMOUNT ({currency})
        </Text>
      </View>

      {items.map((item, index) => (
        <View
          key={item.id}
          style={[styles.tableRow, index % 2 === 1 ? styles.tableRowZebra : {}]}
          wrap={false}
        >
          <Text style={[styles.td, { width: INVOICE_COLS[0] }, styles.center]}>
            {index + 1}
          </Text>
          <Text style={[styles.td, { width: INVOICE_COLS[1] }]}>{dash(item.hsCode)}</Text>
          <Text style={[styles.td, { width: INVOICE_COLS[2] }]}>
            {dash(item.description)}
          </Text>
          <Text style={[styles.td, { width: INVOICE_COLS[3] }, styles.center]}>
            {dash(item.origin)}
          </Text>
          <Text style={[styles.td, { width: INVOICE_COLS[4] }, styles.right]}>
            {formatNumber(parseAmount(item.quantity) ?? 0)}
          </Text>
          <Text style={[styles.td, { width: INVOICE_COLS[5] }, styles.center]}>
            {item.unit}
          </Text>
          <Text style={[styles.td, { width: INVOICE_COLS[6] }, styles.right]}>
            {formatMoney(parseAmount(item.unitPrice) ?? 0, currency)}
          </Text>
          <Text style={[styles.td, { width: INVOICE_COLS[7] }, styles.right]}>
            {formatMoney(lineAmount(item), currency)}
          </Text>
        </View>
      ))}
    </View>
  )
}

/** 포장명세서 표: 박스번호 / 내용물 / 박스당 수량 / 순중량 / 총중량 / 치수 */
const PACKING_COLS = ["10%", "34%", "13%", "13%", "13%", "17%"] as const

function PackingTable({ items }: { items: TradeLineItem[] }) {
  /**
   * 박스 번호는 누적 범위로 적는다 — 실무 서류의 "C/NO. 1-10" 표기와 같다.
   * 렌더 중에 카운터를 굴리지 않고 미리 한 번에 계산한다(누적값을 map 안에서
   * 갱신하면 리렌더 때 이어붙어 번호가 어긋난다).
   */
  const ranges = items.reduce<{ label: string; packages: number }[]>((acc, item) => {
    const packages = Math.max(Math.round(parseAmount(item.packages) ?? 0), 0)
    const before = acc.reduce((sum, r) => sum + r.packages, 0)
    const from = before + 1
    const to = before + packages
    const label = packages <= 0 ? "-" : packages === 1 ? `${from}` : `${from}-${to}`
    acc.push({ label, packages })
    return acc
  }, [])

  return (
    <View style={styles.table}>
      <View style={styles.tableHead} fixed>
        <Text style={[styles.th, { width: PACKING_COLS[0] }, styles.center]}>C/NO.</Text>
        <Text style={[styles.th, { width: PACKING_COLS[1] }]}>CONTENTS</Text>
        <Text style={[styles.th, { width: PACKING_COLS[2] }, styles.right]}>
          QTY / CTN
        </Text>
        <Text style={[styles.th, { width: PACKING_COLS[3] }, styles.right]}>
          N.W. (KG)
        </Text>
        <Text style={[styles.th, { width: PACKING_COLS[4] }, styles.right]}>
          G.W. (KG)
        </Text>
        <Text style={[styles.th, { width: PACKING_COLS[5] }, styles.center]}>
          MEAS. (CM)
        </Text>
      </View>

      {items.map((item, index) => {
        const { label: range, packages } = ranges[index]
        const quantity = parseAmount(item.quantity) ?? 0
        // 박스당 수량 — 포장수가 없으면 나눌 수 없다
        const perCarton = packages > 0 ? quantity / packages : null

        const l = parseAmount(item.lengthCm)
        const w = parseAmount(item.widthCm)
        const h = parseAmount(item.heightCm)
        const meas = l && w && h ? `${formatNumber(l)}×${formatNumber(w)}×${formatNumber(h)}` : "-"

        const net = parseAmount(item.netWeightKg)
        const gross = parseAmount(item.grossWeightKg)

        return (
          <View
            key={item.id}
            style={[styles.tableRow, index % 2 === 1 ? styles.tableRowZebra : {}]}
            wrap={false}
          >
            <Text style={[styles.td, { width: PACKING_COLS[0] }, styles.center]}>
              {range}
            </Text>
            <Text style={[styles.td, { width: PACKING_COLS[1] }]}>
              {dash(item.description)}
            </Text>
            <Text style={[styles.td, { width: PACKING_COLS[2] }, styles.right]}>
              {perCarton === null ? "-" : `${formatNumber(perCarton)} ${item.unit}`}
            </Text>
            <Text style={[styles.td, { width: PACKING_COLS[3] }, styles.right]}>
              {net === null ? "-" : formatNumber(net)}
            </Text>
            <Text style={[styles.td, { width: PACKING_COLS[4] }, styles.right]}>
              {gross === null ? "-" : formatNumber(gross)}
            </Text>
            <Text style={[styles.td, { width: PACKING_COLS[5] }, styles.center]}>
              {meas}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

/* ── 합계 박스 ──────────────────────────────────────────────── */

function TotalsRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.totalsRow}>
      <Text style={styles.totalsLabel}>{label}</Text>
      <Text style={styles.totalsValue}>{value}</Text>
    </View>
  )
}

function TotalsBox({
  type,
  input,
}: {
  type: TradeDocumentType
  input: TradeDocumentInput
}) {
  const t = computeTotals(input)
  const cbm = input.items.reduce((sum, item) => sum + lineVolumeCbm(item), 0)

  if (type === "invoice") {
    return (
      <View style={styles.totalsBox}>
        <TotalsRow
          label="TOTAL QUANTITY"
          value={formatNumber(t.totalQuantity)}
        />
        <TotalsRow
          label="TOTAL NET WEIGHT"
          value={t.hasNetWeight ? `${formatNumber(t.totalNetWeightKg)} KG` : "-"}
        />
        <TotalsRow
          label="TOTAL PACKAGES"
          value={t.totalPackages > 0 ? `${formatNumber(t.totalPackages)} CTN` : "-"}
        />
        <TotalsRow
          label="SUBTOTAL"
          value={`${formatMoney(t.subtotal, input.currency)} ${input.currency}`}
        />
        <View style={styles.totalsRowLast}>
          <Text style={styles.totalsLabelStrong}>TOTAL AMOUNT</Text>
          <Text style={styles.totalsValueStrong}>
            {formatMoney(t.total, input.currency)} {input.currency}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.totalsBox}>
      <TotalsRow
        label="TOTAL PACKAGES"
        value={t.totalPackages > 0 ? `${formatNumber(t.totalPackages)} CTN` : "-"}
      />
      <TotalsRow
        label="TOTAL NET WEIGHT"
        value={t.hasNetWeight ? `${formatNumber(t.totalNetWeightKg)} KG` : "-"}
      />
      <TotalsRow
        label="TOTAL GROSS WEIGHT"
        value={t.hasGrossWeight ? `${formatNumber(t.totalGrossWeightKg)} KG` : "-"}
      />
      <View style={styles.totalsRowLast}>
        <Text style={styles.totalsLabelStrong}>TOTAL MEASUREMENT</Text>
        <Text style={styles.totalsValueStrong}>
          {t.hasVolume ? `${cbm.toFixed(3)} CBM` : "-"}
        </Text>
      </View>
    </View>
  )
}

/* ── 문서 ───────────────────────────────────────────────────── */

export function TradeDocument({
  type,
  input,
  generatedAt,
}: {
  type: TradeDocumentType
  input: TradeDocumentInput
  /** 생성 일시. 호출부에서 넘겨 렌더마다 값이 흔들리지 않게 한다. */
  generatedAt: Date
}) {
  registerPdfFonts()

  const isInvoice = type === "invoice"
  const title = isInvoice ? "COMMERCIAL INVOICE" : "PACKING LIST"
  const stamp = generatedAt.toISOString().replace("T", " ").slice(0, 19)
  const docId = `${isInvoice ? "CI" : "PL"}-${dash(input.invoiceNo)}`

  return (
    <Document
      title={`${title} ${input.invoiceNo}`.trim()}
      author="JSL Logistics"
      subject={title}
      creator="JSL Logistics Document Generator"
    >
      <Page size="A4" style={styles.page}>
        {/* 레터헤드 */}
        <View style={styles.letterhead} fixed>
          <View>
            <Text style={styles.brandName}>JSL LOGISTICS</Text>
            <Text style={styles.brandTag}>International Freight Forwarding</Text>
          </View>
          <Text style={styles.docTitle}>{title}</Text>
        </View>

        {/*
          메타데이터.
          fixed 로 둔다 — render({ pageNumber }) 로 넣는 페이지 번호는 고정
          요소에서만 실제 값으로 치환된다(그냥 두면 빈칸으로 나간다). 덤으로
          여러 장짜리 서류에서 송장번호가 매 장에 반복돼 실무 관례와도 맞는다.
        */}
        <View style={styles.metaGrid} fixed>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Invoice No.</Text>
            <Text style={styles.metaValue}>{dash(input.invoiceNo)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{dash(input.invoiceDate)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Reference No.</Text>
            <Text style={styles.metaValue}>{dash(input.referenceNo)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Page</Text>
            <Text
              style={styles.metaValue}
              render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            />
          </View>
        </View>

        {/* 당사자 2단 */}
        <View style={styles.partyRow}>
          <PartyBox title="SHIPPER / EXPORTER" party={input.shipper} />
          <PartyBox title="CONSIGNEE / BUYER" party={input.consignee} />
        </View>

        {/* 배송조건 스트립 — 금액 관련 항목은 상업송장에만 */}
        <View style={styles.conditions}>
          <ConditionCell label="COUNTRY OF ORIGIN" value={dash(input.countryOfOrigin)} />
          <ConditionCell
            label="COUNTRY OF DESTINATION"
            value={dash(input.countryOfDestination)}
          />
          <ConditionCell label="PORT OF LOADING" value={dash(input.portOfLoading)} />
          <ConditionCell label="PORT OF DISCHARGE" value={dash(input.portOfDischarge)} />
          <ConditionCell label="MODE OF TRANSPORT" value={input.shipMode} />
          {isInvoice ? (
            <>
              <ConditionCell
                label="INCOTERMS 2020"
                value={`${input.incoterm}${input.incotermPlace.trim() ? ` ${input.incotermPlace.trim()}` : ""}`}
              />
              <ConditionCell label="TERMS OF PAYMENT" value={input.paymentTerm} />
              <ConditionCell label="CURRENCY" value={input.currency} />
            </>
          ) : (
            <ConditionCell label="TOTAL PACKAGES" value={`${computeTotals(input).totalPackages} CTN`} />
          )}
        </View>

        {/* 포장 겉면 표기 — 포장명세서에만 */}
        {!isInvoice && input.marksAndNumbers.trim() !== "" && (
          <View style={styles.marks}>
            <Text style={styles.conditionLabel}>MARKS &amp; NUMBERS</Text>
            <Text style={{ fontSize: 8, marginTop: 2 }}>
              {input.marksAndNumbers.trim()}
            </Text>
          </View>
        )}

        {/* 품목 / 포장 표 */}
        {isInvoice ? (
          <InvoiceTable items={input.items} currency={input.currency} />
        ) : (
          <PackingTable items={input.items} />
        )}

        {/* 하단: 인증문구 + 서명 / 합계 */}
        <View style={styles.footRow} wrap={false}>
          <View style={styles.certBox}>
            <Text style={styles.certText}>{CERTIFICATION[type]}</Text>
            <View style={styles.signBlock}>
              <View style={styles.signLine}>
                <Text style={styles.signLabel}>AUTHORIZED SIGNATURE</Text>
              </View>
              <View style={[styles.signLine, { marginTop: 14 }]}>
                <Text style={styles.signLabel}>NAME / TITLE</Text>
              </View>
              <View style={[styles.signLine, { marginTop: 14 }]}>
                <Text style={styles.signLabel}>DATE</Text>
              </View>
            </View>
          </View>

          <TotalsBox type={type} input={input} />
        </View>

        <Text style={styles.disclaimer}>
          This document was generated from user-supplied data and is not linked to any
          shipment record.
        </Text>

        {/* 푸터 */}
        <View style={styles.pageFooter} fixed>
          <Text>Generated {stamp} UTC · JSL Logistics Document Generator</Text>
          <Text style={{ color: PDF_COLORS.muted }}>{docId}</Text>
        </View>
      </Page>
    </Document>
  )
}
