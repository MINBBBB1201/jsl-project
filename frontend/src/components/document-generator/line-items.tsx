"use client"

import { useTranslations } from "next-intl"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  UNITS,
  formatMoney,
  lineAmount,
  type TradeLineItem,
  type Unit,
  type ValidationErrors,
} from "@/lib/trade-documents"
import { SelectField, TextField } from "./field"

/**
 * 품목 반복 입력.
 *
 * 한 줄이 상업 정보(단가·금액)와 포장 정보(중량·치수)를 함께 들고 있다 —
 * 두 서류가 같은 선적 건을 다른 관점에서 적은 것이라 입력을 한 번만 받는다.
 * 필드가 11개라 화면에서는 두 묶음으로 나눠 어느 서류에 쓰이는지 밝힌다.
 *
 * ⚠️ 숫자도 문자열로 들고 있다 (lib/trade-documents/types.ts 주석 참고).
 *    여기서 Number 로 바꾸면 칸을 비우는 순간 0 이 들어가 타이핑 도중에
 *    "0 보다 커야 합니다" 가 튀어나온다.
 */

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
      {children}
    </p>
  )
}

function ItemCard({
  item,
  index,
  currency,
  errors,
  canRemove,
  onChange,
  onRemove,
}: {
  item: TradeLineItem
  index: number
  currency: string
  errors: ValidationErrors["items"][string] | undefined
  canRemove: boolean
  onChange: (patch: Partial<TradeLineItem>) => void
  onRemove: () => void
}) {
  const t = useTranslations("documentGenerator")
  const id = (field: string) => `item-${item.id}-${field}`

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{t("itemLabel", { index: index + 1 })}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={!canRemove}
          className="cursor-pointer"
        >
          <Trash2 className="size-3.5" />
          <span className="max-sm:sr-only">{t("removeItem")}</span>
        </Button>
      </div>

      <div className="space-y-3">
        <GroupLabel>{t("groupCommercial")}</GroupLabel>
        <TextField
          id={id("description")}
          label={t("fieldDescription")}
          value={item.description}
          onChange={(value) => onChange({ description: value })}
          error={errors?.description}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TextField
            id={id("hs")}
            label={t("fieldHsCode")}
            value={item.hsCode}
            onChange={(value) => onChange({ hsCode: value })}
            optional={t("optional")}
            placeholder="8517.62"
          />
          <TextField
            id={id("origin")}
            label={t("fieldOrigin")}
            value={item.origin}
            onChange={(value) => onChange({ origin: value })}
            optional={t("optional")}
            placeholder="KR"
          />
          <TextField
            id={id("qty")}
            label={t("fieldQuantity")}
            value={item.quantity}
            onChange={(value) => onChange({ quantity: value })}
            error={errors?.quantity}
            inputMode="decimal"
          />
          <SelectField
            id={id("unit")}
            label={t("fieldUnit")}
            value={item.unit}
            options={UNITS}
            onChange={(value: Unit) => onChange({ unit: value })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            id={id("price")}
            label={`${t("fieldUnitPrice")} (${currency})`}
            value={item.unitPrice}
            onChange={(value) => onChange({ unitPrice: value })}
            error={errors?.unitPrice}
            inputMode="decimal"
          />
          {/* 금액은 입력이 아니라 계산 결과라 읽기 전용 표시로 둔다 */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium">{t("fieldAmount")}</p>
            <div className="bg-muted/40 flex h-9 items-center rounded-md border px-3 text-sm tabular-nums">
              {formatMoney(lineAmount(item), currency)} {currency}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t pt-3">
        <GroupLabel>{t("groupPacking")}</GroupLabel>
        <div className="grid gap-3 sm:grid-cols-3">
          <TextField
            id={id("packages")}
            label={t("fieldPackages")}
            value={item.packages}
            onChange={(value) => onChange({ packages: value })}
            inputMode="numeric"
            optional={t("optional")}
          />
          <TextField
            id={id("net")}
            label={t("fieldNetWeight")}
            value={item.netWeightKg}
            onChange={(value) => onChange({ netWeightKg: value })}
            inputMode="decimal"
            optional={t("optional")}
          />
          <TextField
            id={id("gross")}
            label={t("fieldGrossWeight")}
            value={item.grossWeightKg}
            onChange={(value) => onChange({ grossWeightKg: value })}
            inputMode="decimal"
            optional={t("optional")}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <TextField
            id={id("length")}
            label={t("fieldLength")}
            value={item.lengthCm}
            onChange={(value) => onChange({ lengthCm: value })}
            inputMode="decimal"
            optional={t("optional")}
          />
          <TextField
            id={id("width")}
            label={t("fieldWidth")}
            value={item.widthCm}
            onChange={(value) => onChange({ widthCm: value })}
            inputMode="decimal"
            optional={t("optional")}
          />
          <TextField
            id={id("height")}
            label={t("fieldHeight")}
            value={item.heightCm}
            onChange={(value) => onChange({ heightCm: value })}
            inputMode="decimal"
            optional={t("optional")}
          />
        </div>
      </div>
    </div>
  )
}

export function LineItems({
  items,
  currency,
  errors,
  onChangeItem,
  onRemoveItem,
  onAddItem,
}: {
  items: TradeLineItem[]
  currency: string
  errors: ValidationErrors
  onChangeItem: (id: string, patch: Partial<TradeLineItem>) => void
  onRemoveItem: (id: string) => void
  onAddItem: () => void
}) {
  const t = useTranslations("documentGenerator")

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-destructive text-sm">{t("itemsEmpty")}</p>
      ) : (
        items.map((item, index) => (
          <ItemCard
            key={item.id}
            item={item}
            index={index}
            currency={currency}
            errors={errors.items[item.id]}
            // 마지막 한 줄은 지우지 못하게 한다 — 품목 없는 송장은 서류가 아니다
            canRemove={items.length > 1}
            onChange={(patch) => onChangeItem(item.id, patch)}
            onRemove={() => onRemoveItem(item.id)}
          />
        ))
      )}

      <Button type="button" variant="outline" onClick={onAddItem} className="cursor-pointer">
        <Plus className="size-4" />
        {t("addItem")}
      </Button>
    </div>
  )
}
