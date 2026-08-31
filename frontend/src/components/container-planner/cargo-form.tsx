"use client"

import { useId, useState } from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { CargoBoxInput } from "@/lib/container-planner"

/**
 * 화물 추가 폼.
 *
 * 검증을 통과한 값만 위로 올려 보낸다 — planLoad 는 잘못된 값을 만나면 예외를
 * 던지도록 1단계에서 만들어 뒀는데(assertValidInput), 그 예외를 화면에서 보는
 * 일이 없어야 한다. 여기서 막는 것이 그 목적이다.
 */

/** 폼이 들고 있는 날것의 입력값. 숫자도 문자열로 둔다 — 아래 주석 참고 */
interface CargoDraft {
  name: string
  lengthCm: string
  widthCm: string
  heightCm: string
  weightKg: string
  quantity: string
  nonStackable: boolean
  rotatable: boolean
}

const EMPTY_DRAFT: CargoDraft = {
  name: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  weightKg: "",
  quantity: "1",
  nonStackable: false,
  rotatable: true,
}

/** 어떤 필드에 에러가 났는지 */
type DraftErrors = Partial<Record<keyof CargoDraft, string>>

/**
 * 숫자 입력 파싱.
 *
 * ⚠️ 값을 number 로 들고 있지 않고 문자열로 두는 이유: 입력 도중의 ""(지웠을 때)나
 *    "1."(소수점 찍는 중) 같은 상태를 number 로는 표현할 수 없다. Number("") 는
 *    0 이라, 숫자로 들고 있으면 사용자가 칸을 비운 순간 0 이 들어가서 "0보다 커야
 *    한다"는 에러가 타이핑 중에 튀어나온다. 제출할 때 한 번만 숫자로 바꾼다.
 */
function parseNumber(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === "") return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

export function CargoForm({
  onAdd,
}: {
  onAdd: (box: Omit<CargoBoxInput, "id">) => void
}) {
  const t = useTranslations("containerPlanner")
  const fieldId = useId()

  const [draft, setDraft] = useState<CargoDraft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<DraftErrors>({})

  const set = <K extends keyof CargoDraft>(key: K, value: CargoDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
    // 고치는 중인 칸의 에러는 바로 걷어 준다. 고쳤는데도 빨간 글씨가 남아
    // 있으면 뭘 더 고쳐야 하나 헤매게 된다.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  const submit = () => {
    const next: DraftErrors = {}

    if (draft.name.trim() === "") next.name = t("errorNameRequired")

    const dims = ["lengthCm", "widthCm", "heightCm"] as const
    for (const key of dims) {
      const value = parseNumber(draft[key])
      if (value === null || value <= 0) next[key] = t("errorPositive")
    }

    const weight = parseNumber(draft.weightKg)
    if (weight === null || weight < 0) next.weightKg = t("errorWeight")

    const quantity = parseNumber(draft.quantity)
    if (quantity === null || !Number.isInteger(quantity) || quantity < 1) {
      next.quantity = t("errorQuantity")
    }

    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }

    onAdd({
      name: draft.name.trim(),
      lengthCm: parseNumber(draft.lengthCm) ?? 0,
      widthCm: parseNumber(draft.widthCm) ?? 0,
      heightCm: parseNumber(draft.heightCm) ?? 0,
      weightKg: weight ?? 0,
      quantity: quantity ?? 0,
      stackable: !draft.nonStackable,
      rotatable: draft.rotatable,
    })

    setDraft(EMPTY_DRAFT)
    setErrors({})
  }

  /** 라벨 + 입력 + 인라인 에러 한 벌 */
  const field = (
    key: keyof CargoDraft & ("name" | "lengthCm" | "widthCm" | "heightCm" | "weightKg" | "quantity"),
    label: string,
    extra?: { placeholder?: string; inputMode?: "decimal" | "numeric" }
  ) => {
    const id = `${fieldId}-${key}`
    const errorId = `${id}-error`
    const message = errors[key]

    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          value={draft[key] as string}
          onChange={(e) => set(key, e.target.value)}
          placeholder={extra?.placeholder}
          inputMode={extra?.inputMode}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? errorId : undefined}
          className={cn(message && "border-destructive")}
        />
        {message ? (
          <p id={errorId} className="text-xs text-destructive">
            {message}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="space-y-4"
      noValidate
    >
      {field("name", t("fieldName"), { placeholder: t("fieldNamePlaceholder") })}

      <div className="grid grid-cols-3 gap-3">
        {field("lengthCm", t("fieldLength"), { inputMode: "decimal" })}
        {field("widthCm", t("fieldWidth"), { inputMode: "decimal" })}
        {field("heightCm", t("fieldHeight"), { inputMode: "decimal" })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {field("weightKg", t("fieldWeight"), { inputMode: "decimal" })}
        {field("quantity", t("fieldQuantity"), { inputMode: "numeric" })}
      </div>

      <div className="space-y-3 rounded-md border bg-muted/30 p-3">
        <div className="flex items-start gap-2.5">
          <Checkbox
            id={`${fieldId}-nonStackable`}
            checked={draft.nonStackable}
            onCheckedChange={(v) => set("nonStackable", v === true)}
            className="mt-0.5"
          />
          <div className="space-y-0.5">
            <Label
              htmlFor={`${fieldId}-nonStackable`}
              className="font-normal leading-snug"
            >
              {t("fieldNonStackable")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("fieldNonStackableHint")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Checkbox
            id={`${fieldId}-rotatable`}
            checked={draft.rotatable}
            onCheckedChange={(v) => set("rotatable", v === true)}
            className="mt-0.5"
          />
          <div className="space-y-0.5">
            <Label
              htmlFor={`${fieldId}-rotatable`}
              className="font-normal leading-snug"
            >
              {t("fieldRotatable")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("fieldRotatableHint")}
            </p>
          </div>
        </div>
      </div>

      <Button type="submit" variant="secondary" className="w-full cursor-pointer">
        <Plus className="size-4" aria-hidden />
        {t("addCargo")}
      </Button>
    </form>
  )
}
