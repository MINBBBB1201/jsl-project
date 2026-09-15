"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { API_BASE_URL } from "@/lib/api"
import { authHeaders } from "@/lib/auth"
import {
  buildInputFromShipment,
  createEmptyInput,
  createTradeDocument,
  toApiInput,
  type ApiTradeDocumentType,
} from "@/lib/trade-documents"
import type { ShipmentDetail } from "../../dashboard/use-shipment-detail"
import { TYPE_LABELS } from "./badges"

const TYPE_OPTIONS: ApiTradeDocumentType[] = [
  "commercial_invoice",
  "packing_list",
  "proforma_invoice",
]

/** 화물 상세를 하나 조회한다. 없으면 null (탭·번호 오타를 구분해 안내하려고 에러를 던지지 않는다) */
async function findShipment(trackingNumber: string): Promise<ShipmentDetail | null> {
  const res = await fetch(
    `${API_BASE_URL}/api/shipments/${encodeURIComponent(trackingNumber)}`,
    { headers: authHeaders() }
  )
  if (res.status === 404) return null
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new Error(json?.error ?? `화물 조회에 실패했습니다. (HTTP ${res.status})`)
  }
  return json.data as ShipmentDetail
}

/**
 * "새 서류" 버튼 + 다이얼로그.
 *
 * 종류를 고르고(선택) 추적번호를 넣으면 화물 데이터로 얇은 초안(품목 스켈레톤·
 * 운송모드 대략·오늘 날짜 — lib/trade-documents/from-shipment.ts 참고)을 채워
 * draft 를 만들고 편집 화면으로 이동한다. 추적번호를 안 넣으면 빈 입력으로 시작.
 */
export function NewDocumentDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<ApiTradeDocumentType>("commercial_invoice")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setType("commercial_invoice")
    setTrackingNumber("")
    setError(null)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      let shipment: ShipmentDetail | null = null
      const tn = trackingNumber.trim()
      if (tn) {
        shipment = await findShipment(tn)
        if (!shipment) {
          setError(`추적번호 "${tn}" 인 화물을 찾을 수 없습니다.`)
          return
        }
      }

      const input = shipment ? buildInputFromShipment(shipment) : createEmptyInput()
      const created = await createTradeDocument({
        type,
        shipmentId: shipment?._id ?? null,
        input: toApiInput(input),
      })

      setOpen(false)
      reset()
      router.push(`/trade-documents/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "서류를 만들지 못했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="size-4" />
          새 서류
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 무역서류</DialogTitle>
          <DialogDescription>
            화물 추적번호를 넣으면 품목·운송모드 등 물류 정보를 미리 채워 줍니다.
            단가·HS코드 같은 상업 정보는 다음 화면에서 직접 입력합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="new-doc-type">서류 종류</Label>
            <Select value={type} onValueChange={(value) => setType(value as ApiTradeDocumentType)}>
              <SelectTrigger id="new-doc-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {TYPE_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-doc-tracking">화물 추적번호 (선택)</Label>
            <Input
              id="new-doc-tracking"
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder="JSL-XXXX-XXXX"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="cursor-pointer">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            만들기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
