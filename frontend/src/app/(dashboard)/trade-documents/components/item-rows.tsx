"use client"

import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { UNITS, type TradeLineItem, type Unit } from "@/lib/trade-documents"

type ItemFieldErrors = Partial<Record<"description" | "quantity" | "unitPrice", string>>

/**
 * 무역서류 품목 편집 — 표 형태.
 *
 * Phase 1 공개 생성기(components/document-generator/line-items.tsx)는 상업
 * 정보/포장 정보를 카드 두 단으로 나눠 보여주는 폭넓은 레이아웃인데, 그건
 * next-intl 라벨에 기대고 있어 로케일 라우팅 밖인 대시보드에서는 못 쓴다
 * (여기 재사용하면 useTranslations 가 provider 를 못 찾아 죽는다).
 * 지금은 기능만 되면 되는 단계라 표 하나로 12개 필드를 다 넣는다 —
 * 화면은 UI/UX 작업 때 다시 설계한다.
 */

export function ItemRows({
  items,
  readOnly,
  errors,
  onChangeItem,
  onRemoveItem,
  onAddItem,
}: {
  items: TradeLineItem[]
  readOnly: boolean
  /** 품목 id → 필드별 에러 메시지. showErrors 가 꺼져 있으면 호출 쪽에서 undefined 를 준다 */
  errors?: Record<string, ItemFieldErrors>
  onChangeItem: (id: string, patch: Partial<TradeLineItem>) => void
  onRemoveItem: (id: string) => void
  onAddItem: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-40">품명</TableHead>
              <TableHead className="min-w-24">HS코드</TableHead>
              <TableHead className="min-w-24">원산지</TableHead>
              <TableHead className="w-20">수량</TableHead>
              <TableHead className="w-24">단위</TableHead>
              <TableHead className="w-24">단가</TableHead>
              <TableHead className="w-20">포장수</TableHead>
              <TableHead className="w-24">순중량kg</TableHead>
              <TableHead className="w-24">총중량kg</TableHead>
              <TableHead className="w-16">L cm</TableHead>
              <TableHead className="w-16">W cm</TableHead>
              <TableHead className="w-16">H cm</TableHead>
              {!readOnly && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const itemErrors = errors?.[item.id]
              return (
              <TableRow key={item.id}>
                <TableCell>
                  <Input
                    className={cn("min-w-40", itemErrors?.description && "border-destructive")}
                    value={item.description}
                    disabled={readOnly}
                    aria-invalid={itemErrors?.description ? true : undefined}
                    title={itemErrors?.description}
                    onChange={(e) => onChangeItem(item.id, { description: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="min-w-24"
                    value={item.hsCode}
                    disabled={readOnly}
                    onChange={(e) => onChangeItem(item.id, { hsCode: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="min-w-24"
                    value={item.origin}
                    disabled={readOnly}
                    onChange={(e) => onChangeItem(item.id, { origin: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className={cn("w-20", itemErrors?.quantity && "border-destructive")}
                    inputMode="decimal"
                    value={item.quantity}
                    disabled={readOnly}
                    aria-invalid={itemErrors?.quantity ? true : undefined}
                    title={itemErrors?.quantity}
                    onChange={(e) => onChangeItem(item.id, { quantity: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={item.unit}
                    disabled={readOnly}
                    onValueChange={(value) => onChangeItem(item.id, { unit: value as Unit })}
                  >
                    <SelectTrigger className="w-24" aria-label="단위">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    className={cn("w-24", itemErrors?.unitPrice && "border-destructive")}
                    inputMode="decimal"
                    value={item.unitPrice}
                    disabled={readOnly}
                    aria-invalid={itemErrors?.unitPrice ? true : undefined}
                    title={itemErrors?.unitPrice}
                    onChange={(e) => onChangeItem(item.id, { unitPrice: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="w-20"
                    inputMode="decimal"
                    value={item.packages}
                    disabled={readOnly}
                    onChange={(e) => onChangeItem(item.id, { packages: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="w-24"
                    inputMode="decimal"
                    value={item.netWeightKg}
                    disabled={readOnly}
                    onChange={(e) => onChangeItem(item.id, { netWeightKg: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="w-24"
                    inputMode="decimal"
                    value={item.grossWeightKg}
                    disabled={readOnly}
                    onChange={(e) => onChangeItem(item.id, { grossWeightKg: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="w-16"
                    inputMode="decimal"
                    value={item.lengthCm}
                    disabled={readOnly}
                    onChange={(e) => onChangeItem(item.id, { lengthCm: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="w-16"
                    inputMode="decimal"
                    value={item.widthCm}
                    disabled={readOnly}
                    onChange={(e) => onChangeItem(item.id, { widthCm: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="w-16"
                    inputMode="decimal"
                    value={item.heightCm}
                    disabled={readOnly}
                    onChange={(e) => onChangeItem(item.id, { heightCm: e.target.value })}
                  />
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={items.length <= 1}
                      onClick={() => onRemoveItem(item.id)}
                      className="cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {!readOnly && (
        <Button type="button" variant="outline" size="sm" onClick={onAddItem} className="cursor-pointer">
          <Plus className="size-4" />
          품목 추가
        </Button>
      )}
    </div>
  )
}
