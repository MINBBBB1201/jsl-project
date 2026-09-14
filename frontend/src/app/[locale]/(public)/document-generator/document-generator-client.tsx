"use client"

import { useCallback, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Download, FileText, Sparkles, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SelectField, TextField } from "@/components/document-generator/field"
import { LineItems } from "@/components/document-generator/line-items"
import { PartyFields } from "@/components/document-generator/party-fields"
import {
  CURRENCIES,
  INCOTERMS,
  PAYMENT_TERMS,
  SHIP_MODES,
  buildSampleInput,
  computeTotals,
  createEmptyInput,
  createEmptyItem,
  formatMoney,
  formatNumber,
  hasBlockingErrors,
  validateInput,
  type Currency,
  type Incoterm,
  type PaymentTerm,
  type ShipMode,
  type TradeDocumentInput,
  type TradeDocumentType,
  type TradeLineItem,
  type TradeParty,
} from "@/lib/trade-documents"

/**
 * 무역서류 생성기 (공개 preview).
 *
 * 입력값 → 상업송장 / 포장명세서 PDF. 백엔드를 거치지 않고 브라우저 안에서
 * 만들어 바로 내려받는다 — 입력한 거래 내용이 서버로 나가지 않는 것이 이 화면의
 * 전제라, PDF 생성도 클라이언트에 둔다.
 *
 * ⚠️ PublicPageShell 로 감싸지 말 것. (public)/layout.tsx 가 이미 감싸고 있어서
 *    한 번 더 쓰면 헤더와 푸터가 두 벌씩 렌더된다.
 *    (container-planner-client.tsx 에 같은 주석이 있다)
 *
 * ⚠️ 컨테이너 폭이 다른 공개 도구(max-w-3xl)보다 넓다. 품목 한 줄이 상업 정보
 *    6개 + 포장 정보 6개를 받아야 해서, 3xl 에서는 한 줄에 두 칸씩만 들어가
 *    품목 하나가 세로로 12줄이 된다. 5xl 에서 4칸씩 들어간다.
 */

/** 문서 종류별 파일명 접두사 */
const FILE_PREFIX: Record<TradeDocumentType, string> = {
  invoice: "CommercialInvoice",
  packing: "PackingList",
}

/** 파일명에 쓸 수 없는 문자를 걷어낸다 (송장번호에 슬래시가 들어오는 일이 흔하다) */
const safeFileName = (value: string) =>
  value.trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document"

export function DocumentGeneratorClient() {
  const t = useTranslations("documentGenerator")

  const [input, setInput] = useState<TradeDocumentInput>(createEmptyInput)
  const [nextItemId, setNextItemId] = useState(2)
  const [busy, setBusy] = useState<TradeDocumentType | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  /** 제출을 시도하기 전에는 에러를 띄우지 않는다 — 빈 폼이 빨갛게 시작하지 않도록 */
  const [showErrors, setShowErrors] = useState(false)

  const errors = useMemo(() => validateInput(input), [input])
  const blocked = hasBlockingErrors(errors)
  const totals = useMemo(() => computeTotals(input), [input])

  const patch = useCallback(
    (next: Partial<TradeDocumentInput>) => setInput((prev) => ({ ...prev, ...next })),
    []
  )

  const patchParty = useCallback(
    (which: "shipper" | "consignee", next: Partial<TradeParty>) =>
      setInput((prev) => ({ ...prev, [which]: { ...prev[which], ...next } })),
    []
  )

  const changeItem = useCallback((id: string, next: Partial<TradeLineItem>) => {
    setInput((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...next } : item)),
    }))
  }, [])

  const removeItem = useCallback((id: string) => {
    setInput((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }))
  }, [])

  const addItem = useCallback(() => {
    setInput((prev) => ({ ...prev, items: [...prev.items, createEmptyItem(`item-${nextItemId}`)] }))
    setNextItemId((n) => n + 1)
  }, [nextItemId])

  const fillSample = useCallback(() => {
    setInput(buildSampleInput())
    setNextItemId(4)
    setShowErrors(false)
    setGenerateError(null)
  }, [])

  const clearAll = useCallback(() => {
    setInput(createEmptyInput())
    setNextItemId(2)
    setShowErrors(false)
    setGenerateError(null)
  }, [])

  /**
   * PDF 생성.
   *
   * @react-pdf/renderer 와 문서 컴포넌트를 여기서 동적으로 불러온다. 정적으로
   * import 하면 PDF 엔진과 한글 폰트 처리 코드가 페이지 첫 번들에 실려, 서류를
   * 만들지 않고 둘러보기만 하는 방문자까지 그 비용을 치른다.
   */
  const download = useCallback(
    async (type: TradeDocumentType) => {
      setShowErrors(true)
      setGenerateError(null)
      if (blocked) return

      setBusy(type)
      try {
        const [{ pdf }, { TradeDocument }] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/components/document-generator/pdf/trade-document"),
        ])

        const blob = await pdf(
          <TradeDocument type={type} input={input} generatedAt={new Date()} />
        ).toBlob()

        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = `${FILE_PREFIX[type]}_${safeFileName(input.invoiceNo)}.pdf`
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        // 즉시 해제하면 일부 브라우저에서 다운로드가 시작되기 전에 URL 이 죽는다
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
      } catch (error) {
        console.error("PDF 생성 실패", error)
        setGenerateError(t("errorsGenerateFailed"))
      } finally {
        setBusy(null)
      }
    },
    [blocked, input, t]
  )

  /** 검증 메시지 키("errors.required") → 번역 */
  const message = (key: string | undefined) => {
    if (!showErrors || !key) return undefined
    switch (key) {
      case "errors.required":
        return t("errorsRequired")
      case "errors.positive":
        return t("errorsPositive")
      case "errors.nonNegative":
        return t("errorsNonNegative")
      case "errors.itemsEmpty":
        return t("itemsEmpty")
      default:
        return undefined
    }
  }

  const itemErrors = useMemo(() => {
    if (!showErrors) return { items: {} as typeof errors.items }
    return {
      ...errors,
      items: Object.fromEntries(
        Object.entries(errors.items).map(([id, fields]) => [
          id,
          Object.fromEntries(
            Object.entries(fields).map(([field, key]) => [field, message(key)])
          ),
        ])
      ),
    }
    // message 는 t 에만 의존한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors, showErrors, t])

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="text-muted-foreground mt-3 max-w-3xl text-sm">{t("subtitle")}</p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={fillSample} className="cursor-pointer">
          <Sparkles className="size-4" />
          {t("fillSample")}
        </Button>
        <Button type="button" variant="ghost" onClick={clearAll} className="cursor-pointer">
          <Trash2 className="size-4" />
          {t("clearAll")}
        </Button>
      </div>

      <div className="mt-8 space-y-6">
        {/* 문서 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="text-muted-foreground size-4" />
              {t("sectionDocInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <TextField
              id="invoice-no"
              label={t("fieldInvoiceNo")}
              value={input.invoiceNo}
              onChange={(value) => patch({ invoiceNo: value })}
              error={message(errors.invoiceNo)}
              placeholder="INV-20260902-001"
            />
            <TextField
              id="invoice-date"
              label={t("fieldInvoiceDate")}
              type="date"
              value={input.invoiceDate}
              onChange={(value) => patch({ invoiceDate: value })}
              error={message(errors.invoiceDate)}
            />
            <TextField
              id="reference-no"
              label={t("fieldReferenceNo")}
              value={input.referenceNo}
              onChange={(value) => patch({ referenceNo: value })}
              optional={t("optional")}
              hint={t("hintReferenceNo")}
            />
          </CardContent>
        </Card>

        {/* 당사자 */}
        <Card>
          <CardContent className="grid gap-8 pt-6 lg:grid-cols-2">
            <PartyFields
              idPrefix="shipper"
              title={t("sectionShipper")}
              party={input.shipper}
              errors={{
                companyName: message(errors.shipperCompanyName),
                address: message(errors.shipperAddress),
              }}
              onChange={(next) => patchParty("shipper", next)}
            />
            <PartyFields
              idPrefix="consignee"
              title={t("sectionConsignee")}
              party={input.consignee}
              errors={{
                companyName: message(errors.consigneeCompanyName),
                address: message(errors.consigneeAddress),
              }}
              onChange={(next) => patchParty("consignee", next)}
            />
          </CardContent>
        </Card>

        {/* 배송조건 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("sectionConditions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TextField
                id="origin-country"
                label={t("fieldCountryOfOrigin")}
                value={input.countryOfOrigin}
                onChange={(value) => patch({ countryOfOrigin: value })}
                error={message(errors.countryOfOrigin)}
              />
              <TextField
                id="destination-country"
                label={t("fieldCountryOfDestination")}
                value={input.countryOfDestination}
                onChange={(value) => patch({ countryOfDestination: value })}
                error={message(errors.countryOfDestination)}
              />
              <TextField
                id="port-loading"
                label={t("fieldPortOfLoading")}
                value={input.portOfLoading}
                onChange={(value) => patch({ portOfLoading: value })}
                optional={t("optional")}
              />
              <TextField
                id="port-discharge"
                label={t("fieldPortOfDischarge")}
                value={input.portOfDischarge}
                onChange={(value) => patch({ portOfDischarge: value })}
                optional={t("optional")}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <SelectField
                id="ship-mode"
                label={t("fieldShipMode")}
                value={input.shipMode}
                options={SHIP_MODES}
                onChange={(value: ShipMode) => patch({ shipMode: value })}
              />
              <SelectField
                id="incoterm"
                label={t("fieldIncoterm")}
                value={input.incoterm}
                options={INCOTERMS}
                onChange={(value: Incoterm) => patch({ incoterm: value })}
              />
              <TextField
                id="incoterm-place"
                label={t("fieldIncotermPlace")}
                value={input.incotermPlace}
                onChange={(value) => patch({ incotermPlace: value })}
                optional={t("optional")}
                placeholder="Busan"
              />
              <SelectField
                id="payment-term"
                label={t("fieldPaymentTerm")}
                value={input.paymentTerm}
                options={PAYMENT_TERMS}
                onChange={(value: PaymentTerm) => patch({ paymentTerm: value })}
              />
              <SelectField
                id="currency"
                label={t("fieldCurrency")}
                value={input.currency}
                options={CURRENCIES}
                onChange={(value: Currency) => patch({ currency: value })}
              />
            </div>
            <TextField
              id="marks"
              label={t("fieldMarks")}
              value={input.marksAndNumbers}
              onChange={(value) => patch({ marksAndNumbers: value })}
              optional={t("optional")}
              hint={t("hintMarks")}
            />
          </CardContent>
        </Card>

        {/* 품목 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("sectionItems")}</CardTitle>
            <CardDescription>{t("groupCommercial")} · {t("groupPacking")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LineItems
              items={input.items}
              currency={input.currency}
              errors={itemErrors as typeof errors}
              onChangeItem={changeItem}
              onRemoveItem={removeItem}
              onAddItem={addItem}
            />
          </CardContent>
        </Card>

        {/* 합계 + 다운로드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("totalsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <dt className="text-muted-foreground text-xs">{t("totalQuantity")}</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {formatNumber(totals.totalQuantity)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t("totalPackages")}</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {totals.totalPackages > 0 ? formatNumber(totals.totalPackages) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t("totalNetWeight")}</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {totals.hasNetWeight ? `${formatNumber(totals.totalNetWeightKg)} kg` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t("totalVolume")}</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {totals.hasVolume ? `${totals.totalVolumeCbm.toFixed(3)} CBM` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t("totalAmount")}</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {formatMoney(totals.total, input.currency)} {input.currency}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => download("invoice")}
                disabled={busy !== null}
                className="cursor-pointer"
              >
                <Download className="size-4" />
                {busy === "invoice" ? t("generating") : t("downloadInvoice")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => download("packing")}
                disabled={busy !== null}
                className="cursor-pointer"
              >
                <Download className="size-4" />
                {busy === "packing" ? t("generating") : t("downloadPacking")}
              </Button>
            </div>

            {showErrors && blocked && (
              <p className="text-destructive text-sm">{t("fixErrors")}</p>
            )}
            {generateError && <p className="text-destructive text-sm">{generateError}</p>}
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground mt-8 max-w-3xl text-xs">{t("disclaimer")}</p>
    </div>
  )
}
