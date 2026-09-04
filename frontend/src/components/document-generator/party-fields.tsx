"use client"

import { useTranslations } from "next-intl"

import type { TradeParty } from "@/lib/trade-documents"
import { TextField } from "./field"

/**
 * 수출자 / 수입자 블록.
 *
 * 두 당사자는 필드가 완전히 같아서 한 컴포넌트로 두고 제목만 갈아 끼운다.
 * PDF 에서도 좌우 2단으로 같은 모양으로 나간다.
 */
export function PartyFields({
  idPrefix,
  title,
  party,
  errors,
  onChange,
}: {
  idPrefix: string
  title: string
  party: TradeParty
  errors: { companyName?: string; address?: string }
  onChange: (patch: Partial<TradeParty>) => void
}) {
  const t = useTranslations("documentGenerator")

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">{title}</legend>

      <TextField
        id={`${idPrefix}-company`}
        label={t("fieldCompanyName")}
        value={party.companyName}
        onChange={(value) => onChange({ companyName: value })}
        error={errors.companyName}
      />
      <TextField
        id={`${idPrefix}-address`}
        label={t("fieldAddress")}
        value={party.address}
        onChange={(value) => onChange({ address: value })}
        error={errors.address}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          id={`${idPrefix}-contact`}
          label={t("fieldContact")}
          value={party.contact}
          onChange={(value) => onChange({ contact: value })}
          optional={t("optional")}
        />
        <TextField
          id={`${idPrefix}-taxid`}
          label={t("fieldTaxId")}
          value={party.taxId}
          onChange={(value) => onChange({ taxId: value })}
          optional={t("optional")}
        />
      </div>
    </fieldset>
  )
}
