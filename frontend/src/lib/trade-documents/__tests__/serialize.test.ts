import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { toApiInput } from "../serialize"
import { createEmptyInput, createEmptyItem } from "../types"

describe("toApiInput — 폼(String) → API(Number|null)", () => {
  it("빈 칸은 null 로, 숫자 문자열은 Number 로 바뀐다", () => {
    const input = createEmptyInput()
    input.items = [
      {
        ...createEmptyItem("item-1"),
        quantity: "5",
        unitPrice: "12.5",
        packages: "3",
        netWeightKg: "", // 미입력
        grossWeightKg: "10",
      },
    ]

    const api = toApiInput(input)
    const [item] = api.items

    assert.equal(item.quantity, 5)
    assert.equal(item.unitPrice, 12.5)
    assert.equal(item.packages, 3)
    assert.equal(item.netWeightKg, null)
    assert.equal(item.grossWeightKg, 10)
  })

  it("숫자로 못 바꾸는 값은 예외 없이 null 이 된다 (Number('1.') 은 1 이라 '1.' 은 케이스에서 뺐다)", () => {
    const input = createEmptyInput()
    input.items = [{ ...createEmptyItem("item-1"), unitPrice: "12kg", lengthCm: "abc" }]

    const api = toApiInput(input)
    assert.equal(api.items[0].unitPrice, null)
    assert.equal(api.items[0].lengthCm, null)
  })

  it("quantity 는 빈 칸이어도 null 이 아니라 0 이다 (서버 스키마가 Number 필수)", () => {
    const input = createEmptyInput()
    input.items = [{ ...createEmptyItem("item-1"), quantity: "" }]

    assert.equal(toApiInput(input).items[0].quantity, 0)
  })

  it("invoiceNo 는 요청 바디에 담지 않는다 — 서버가 documentNo 로 관리한다", () => {
    const input = createEmptyInput()
    input.invoiceNo = "INV-USER-TYPED-001"

    const api = toApiInput(input)
    assert.equal(api.invoiceNo, undefined)
  })

  it("당사자·조건 필드는 그대로 옮겨진다", () => {
    const input = createEmptyInput()
    input.shipper = { companyName: "ACME", address: "Seoul", contact: "010", taxId: "123" }
    input.currency = "EUR"
    input.incoterm = "CIF"

    const api = toApiInput(input)
    assert.deepEqual(api.shipper, input.shipper)
    assert.equal(api.currency, "EUR")
    assert.equal(api.incoterm, "CIF")
  })
})
