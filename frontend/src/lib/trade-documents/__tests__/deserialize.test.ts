import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { fromApiInput } from "../deserialize"
import type { TradeDocumentApiInput } from "../api-types"
import { EMPTY_PARTY } from "../types"

const baseApi = (): TradeDocumentApiInput => ({
  invoiceDate: "2026-09-14",
  referenceNo: "JSL-TEST-1",
  shipper: { ...EMPTY_PARTY },
  consignee: { ...EMPTY_PARTY },
  countryOfOrigin: "KR",
  countryOfDestination: "DE",
  portOfLoading: "",
  portOfDischarge: "",
  shipMode: "SEA",
  incoterm: "FOB",
  incotermPlace: "",
  paymentTerm: "T/T",
  currency: "USD",
  marksAndNumbers: "",
  items: [],
})

describe("fromApiInput — API(Number|null) → 폼(String)", () => {
  it("null 은 빈 칸으로, 숫자는 String 으로 바뀐다", () => {
    const api = baseApi()
    api.items = [
      {
        hsCode: "",
        description: "Widgets",
        origin: "",
        quantity: 5,
        unit: "PCS",
        unitPrice: 12.5,
        packages: null,
        netWeightKg: null,
        grossWeightKg: 10,
        lengthCm: null,
        widthCm: null,
        heightCm: null,
      },
    ]

    const form = fromApiInput(api)
    const [item] = form.items

    assert.equal(item.quantity, "5")
    assert.equal(item.unitPrice, "12.5")
    assert.equal(item.packages, "")
    assert.equal(item.netWeightKg, "")
    assert.equal(item.grossWeightKg, "10")
  })

  it("품목마다 client 전용 id 가 새로 붙는다", () => {
    const api = baseApi()
    api.items = [
      { hsCode: "", description: "A", origin: "", quantity: 1, unit: "PCS", unitPrice: null, packages: null, netWeightKg: null, grossWeightKg: null, lengthCm: null, widthCm: null, heightCm: null },
      { hsCode: "", description: "B", origin: "", quantity: 1, unit: "PCS", unitPrice: null, packages: null, netWeightKg: null, grossWeightKg: null, lengthCm: null, widthCm: null, heightCm: null },
    ]

    const form = fromApiInput(api)
    assert.deepEqual(form.items.map((i) => i.id), ["item-1", "item-2"])
  })

  it("품목이 0개면 빈 품목 하나를 채워 넣는다 (폼이 빈 화면으로 시작하지 않게)", () => {
    const form = fromApiInput(baseApi())
    assert.equal(form.items.length, 1)
    assert.equal(form.items[0].quantity, "1") // createEmptyItem 기본값
  })

  it("invoiceNo 는 응답의 documentNo 를 따라온다", () => {
    const api = baseApi()
    api.invoiceNo = "CI-2026-0001"
    assert.equal(fromApiInput(api).invoiceNo, "CI-2026-0001")
  })

  it("invoiceNo 가 없으면(draft, 미발행) 빈 문자열이다", () => {
    assert.equal(fromApiInput(baseApi()).invoiceNo, "")
  })
})
