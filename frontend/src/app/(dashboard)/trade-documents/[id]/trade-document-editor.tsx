"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, FileText, History, Loader2, Save, Send, Trash2, Undo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TextField, SelectField } from "@/components/document-generator/field"
import type { PdfDocumentKind } from "@/components/document-generator/pdf/trade-document"
import {
  CURRENCIES,
  INCOTERMS,
  PAYMENT_TERMS,
  SHIP_MODES,
  createEmptyItem,
  deleteTradeDocument,
  formatMoney,
  formatNumber,
  fromApiInput,
  hasBlockingErrors,
  issueTradeDocument,
  reviseTradeDocument,
  toApiInput,
  updateTradeDocument,
  validateInput,
  computeTotals,
  type ApiTradeDocumentType,
  type Currency,
  type Incoterm,
  type PaymentTerm,
  type ShipMode,
  type TradeDocumentInput,
  type TradeParty,
} from "@/lib/trade-documents"
import { DocumentStatusBadge, DocumentTypeBadge, TYPE_LABELS } from "../components/badges"
import { ItemRows } from "../components/item-rows"
import { useTradeDocument } from "../use-trade-documents"

const PDF_KIND: Record<ApiTradeDocumentType, PdfDocumentKind> = {
  commercial_invoice: "invoice",
  packing_list: "packing",
  proforma_invoice: "proforma",
}

const FILE_PREFIX: Record<ApiTradeDocumentType, string> = {
  commercial_invoice: "CommercialInvoice",
  packing_list: "PackingList",
  proforma_invoice: "ProformaInvoice",
}

const safeFileName = (value: string) =>
  value.trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document"

function PartyEditor({
  title,
  idPrefix,
  party,
  readOnly,
  onChange,
}: {
  title: string
  idPrefix: string
  party: TradeParty
  readOnly: boolean
  onChange: (patch: Partial<TradeParty>) => void
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          id={`${idPrefix}-name`}
          label="회사명"
          value={party.companyName}
          onChange={(v) => onChange({ companyName: v })}
          disabled={readOnly}
        />
        <TextField
          id={`${idPrefix}-tax`}
          label="사업자·세금번호"
          value={party.taxId}
          onChange={(v) => onChange({ taxId: v })}
          optional="선택"
          disabled={readOnly}
        />
        <TextField
          id={`${idPrefix}-address`}
          label="주소"
          value={party.address}
          onChange={(v) => onChange({ address: v })}
          className="sm:col-span-2"
          disabled={readOnly}
        />
        <TextField
          id={`${idPrefix}-contact`}
          label="연락처"
          value={party.contact}
          onChange={(v) => onChange({ contact: v })}
          optional="선택"
          className="sm:col-span-2"
          disabled={readOnly}
        />
      </div>
    </div>
  )
}

export function TradeDocumentEditor({ id }: { id: string }) {
  const router = useRouter()
  const { data, isLoading, error, reload } = useTradeDocument(id)

  const [input, setInput] = useState<TradeDocumentInput | null>(null)
  const [nextItemId, setNextItemId] = useState(2)
  const [showErrors, setShowErrors] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isIssuing, setIsIssuing] = useState(false)
  const [isRevising, setIsRevising] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const doc = data?.document ?? null

  // 서류가 (다시) 로드될 때만 폼을 채운다 — id 가 바뀌거나(다른 서류로 이동)
  // 서버 값이 바뀌었을 때(저장/발행/개정 뒤 reload)만이고, 타이핑 중에는 안 건드린다.
  // 서버 리소스(useTradeDocument)를 로컬 편집 상태로 동기화하는 것이라
  // "effect 안에서 setState" 경고가 뜨지만 정확히 그 용도다.
  useEffect(() => {
    if (doc) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput(fromApiInput(doc.input))
      setNextItemId(doc.input.items.length + 1)
      setShowErrors(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id, doc?.updatedAt])

  /**
   * validateInput 은 Phase 1(공개 생성기)의 규칙이라 invoiceNo(사용자가 직접
   * 타이핑하는 송장번호)를 필수로 본다. Phase 2 에서는 그 필드를 아예 편집하지
   * 못하게 했다 — 서버가 발행 시점에 documentNo 로 대신 부여한다. 그대로 쓰면
   * 모든 draft 가 "invoiceNo 없음"으로 영원히 막혀 발행이 불가능해진다. 그 항목만
   * 걷어내고 나머지 규칙(당사자·국가·품목)은 그대로 적용한다.
   */
  const errors = useMemo(() => {
    if (!input) return null
    const result = validateInput(input)
    delete result.invoiceNo
    return result
  }, [input])
  const blocked = errors ? hasBlockingErrors(errors) : true
  const totals = useMemo(() => (input ? computeTotals(input) : null), [input])

  const readOnly = doc?.status !== "draft"

  const patch = useCallback((next: Partial<TradeDocumentInput>) => {
    setInput((prev) => (prev ? { ...prev, ...next } : prev))
  }, [])

  const patchParty = useCallback((which: "shipper" | "consignee", next: Partial<TradeParty>) => {
    setInput((prev) => (prev ? { ...prev, [which]: { ...prev[which], ...next } } : prev))
  }, [])

  const changeItem = useCallback((itemId: string, next: Partial<TradeDocumentInput["items"][number]>) => {
    setInput((prev) =>
      prev
        ? { ...prev, items: prev.items.map((it) => (it.id === itemId ? { ...it, ...next } : it)) }
        : prev
    )
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setInput((prev) => (prev ? { ...prev, items: prev.items.filter((it) => it.id !== itemId) } : prev))
  }, [])

  const addItem = useCallback(() => {
    setInput((prev) => (prev ? { ...prev, items: [...prev.items, createEmptyItem(`item-${nextItemId}`)] } : prev))
    setNextItemId((n) => n + 1)
  }, [nextItemId])

  const handleSave = async () => {
    if (!input) return
    setIsSaving(true)
    setActionError(null)
    try {
      await updateTradeDocument(id, { input: toApiInput(input) })
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "저장하지 못했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleIssue = async () => {
    setShowErrors(true)
    if (blocked) return
    if (!window.confirm("발행하면 서류번호가 부여되고 더 이상 편집할 수 없습니다. 계속할까요?")) return

    setIsIssuing(true)
    setActionError(null)
    try {
      // 발행 전 마지막 입력을 먼저 저장 — 저장 안 된 수정사항이 있으면 발행 후엔 고칠 방법이 없다
      if (input) await updateTradeDocument(id, { input: toApiInput(input) })
      await issueTradeDocument(id)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "발행하지 못했습니다.")
    } finally {
      setIsIssuing(false)
    }
  }

  const handleRevise = async () => {
    if (!window.confirm("이 서류를 개정합니다. 지금 내용을 복사한 새 draft 가 만들어집니다.")) return
    setIsRevising(true)
    setActionError(null)
    try {
      const revision = await reviseTradeDocument(id)
      router.push(`/trade-documents/${revision.id}`)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "개정본을 만들지 못했습니다.")
      setIsRevising(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("이 draft 를 삭제합니다. 되돌릴 수 없습니다.")) return
    setIsDeleting(true)
    setActionError(null)
    try {
      await deleteTradeDocument(id)
      router.push("/trade-documents")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "삭제하지 못했습니다.")
      setIsDeleting(false)
    }
  }

  const handleDownload = async () => {
    if (!input || !doc) return
    setIsDownloading(true)
    setActionError(null)
    try {
      const [{ pdf }, { TradeDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/document-generator/pdf/trade-document"),
      ])
      const blob = await pdf(
        <TradeDocument type={PDF_KIND[doc.type]} input={input} generatedAt={new Date()} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `${FILE_PREFIX[doc.type]}_${safeFileName(doc.documentNo ?? id)}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "PDF 를 만들지 못했습니다.")
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 px-4 lg:px-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error || !doc || !input) {
    return (
      <div className="px-4 py-8 text-center lg:px-6">
        <p className="text-destructive text-sm">{error ?? "서류를 찾을 수 없습니다."}</p>
        <Button variant="outline" size="sm" className="mt-4 cursor-pointer" onClick={() => router.push("/trade-documents")}>
          목록으로
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="text-muted-foreground size-5" />
            <h1 className="text-2xl font-bold tracking-tight">
              {doc.documentNo ?? `${TYPE_LABELS[doc.type]} (미발행)`}
            </h1>
            <DocumentTypeBadge type={doc.type} />
            <DocumentStatusBadge status={doc.status} />
            <span className="text-muted-foreground text-xs">v{doc.version}</span>
          </div>
          {doc.shipmentId && (
            <p className="text-muted-foreground text-sm">연결된 화물: {doc.shipmentId}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {readOnly ? (
            <>
              <Button variant="outline" onClick={handleDownload} disabled={isDownloading} className="cursor-pointer">
                {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                PDF 다운로드
              </Button>
              {doc.status === "issued" && (
                <Button variant="outline" onClick={handleRevise} disabled={isRevising} className="cursor-pointer">
                  {isRevising ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
                  개정
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleDelete} disabled={isDeleting} className="cursor-pointer">
                {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                삭제
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={isSaving} className="cursor-pointer">
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                저장
              </Button>
              <Button onClick={handleIssue} disabled={isIssuing} className="cursor-pointer">
                {isIssuing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                발행
              </Button>
            </>
          )}
        </div>
      </div>

      {actionError && <p className="text-destructive text-sm">{actionError}</p>}
      {showErrors && blocked && (
        <p className="text-destructive text-sm">입력에 빠진 부분이 있습니다. 아래 표시된 항목을 확인해 주세요.</p>
      )}

      {data && data.versions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="text-muted-foreground size-4" />
              개정 이력
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.versions.map((v) => (
              <Button
                key={v.id}
                variant={v.id === doc.id ? "default" : "outline"}
                size="sm"
                className="cursor-pointer"
                onClick={() => router.push(`/trade-documents/${v.id}`)}
              >
                v{v.version} · {v.status === "issued" ? "발행" : v.status === "superseded" ? "이전버전" : "작성중"}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">문서 정보</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <TextField
              id="invoice-date"
              label="송장일자"
              type="date"
              value={input.invoiceDate}
              onChange={(v) => patch({ invoiceDate: v })}
              disabled={readOnly}
            />
            <TextField
              id="reference-no"
              label="참조/추적번호"
              value={input.referenceNo}
              onChange={(v) => patch({ referenceNo: v })}
              optional="선택"
              disabled={readOnly}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-8 pt-6 lg:grid-cols-2">
            <PartyEditor
              title="수출자 (Shipper)"
              idPrefix="shipper"
              party={input.shipper}
              readOnly={readOnly}
              onChange={(next) => patchParty("shipper", next)}
            />
            <PartyEditor
              title="수입자 (Consignee)"
              idPrefix="consignee"
              party={input.consignee}
              readOnly={readOnly}
              onChange={(next) => patchParty("consignee", next)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">배송조건</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TextField id="origin-country" label="원산지국" value={input.countryOfOrigin} onChange={(v) => patch({ countryOfOrigin: v })} disabled={readOnly} />
              <TextField id="dest-country" label="도착국" value={input.countryOfDestination} onChange={(v) => patch({ countryOfDestination: v })} disabled={readOnly} />
              <TextField id="port-loading" label="선적항" value={input.portOfLoading} onChange={(v) => patch({ portOfLoading: v })} optional="선택" disabled={readOnly} />
              <TextField id="port-discharge" label="양하항" value={input.portOfDischarge} onChange={(v) => patch({ portOfDischarge: v })} optional="선택" disabled={readOnly} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <SelectField id="ship-mode" label="운송모드" value={input.shipMode} options={SHIP_MODES} onChange={(v: ShipMode) => patch({ shipMode: v })} disabled={readOnly} />
              <SelectField id="incoterm" label="Incoterms" value={input.incoterm} options={INCOTERMS} onChange={(v: Incoterm) => patch({ incoterm: v })} disabled={readOnly} />
              <TextField id="incoterm-place" label="Incoterms 지명" value={input.incotermPlace} onChange={(v) => patch({ incotermPlace: v })} optional="선택" disabled={readOnly} />
              <SelectField id="payment-term" label="결제조건" value={input.paymentTerm} options={PAYMENT_TERMS} onChange={(v: PaymentTerm) => patch({ paymentTerm: v })} disabled={readOnly} />
              <SelectField id="currency" label="통화" value={input.currency} options={CURRENCIES} onChange={(v: Currency) => patch({ currency: v })} disabled={readOnly} />
            </div>
            <TextField id="marks" label="포장 겉면 표기" value={input.marksAndNumbers} onChange={(v) => patch({ marksAndNumbers: v })} optional="선택" disabled={readOnly} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">품목</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemRows items={input.items} readOnly={readOnly} onChangeItem={changeItem} onRemoveItem={removeItem} onAddItem={addItem} />
          </CardContent>
        </Card>

        {totals && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">합계</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <dt className="text-muted-foreground text-xs">총수량</dt>
                <dd className="text-lg font-semibold tabular-nums">{formatNumber(totals.totalQuantity)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">총포장수</dt>
                <dd className="text-lg font-semibold tabular-nums">{totals.totalPackages > 0 ? formatNumber(totals.totalPackages) : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">총순중량</dt>
                <dd className="text-lg font-semibold tabular-nums">{totals.hasNetWeight ? `${formatNumber(totals.totalNetWeightKg)} kg` : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">총부피</dt>
                <dd className="text-lg font-semibold tabular-nums">{totals.hasVolume ? `${totals.totalVolumeCbm.toFixed(3)} CBM` : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">총액</dt>
                <dd className="text-lg font-semibold tabular-nums">{formatMoney(totals.total, input.currency)} {input.currency}</dd>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
