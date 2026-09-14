import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { buildInputFromShipment, type ShipmentPrefillSource } from "../from-shipment"

const baseShipment = (): ShipmentPrefillSource => ({
  trackingNumber: "JSL-1234-5678",
  transportMode: "SEA",
  origin: { address: "Busan, KR" },
  destination: { address: "Hamburg, DE" },
  customer: { name: "Rhein Handel GmbH" },
  items: [
    { description: "Widgets", quantity: 10, weight: 120, dimensions: { length: 40, width: 30, height: 20 } },
  ],
})

describe("buildInputFromShipment — 얇은 자동채움", () => {
  it("추적번호·거래처명·항구 주소·오늘 날짜를 채운다", () => {
    const input = buildInputFromShipment(baseShipment())

    assert.equal(input.referenceNo, "JSL-1234-5678")
    assert.equal(input.consignee.companyName, "Rhein Handel GmbH")
    assert.equal(input.portOfLoading, "Busan, KR")
    assert.equal(input.portOfDischarge, "Hamburg, DE")
    assert.equal(input.invoiceDate, new Date().toISOString().slice(0, 10))
  })

  it("shipper 는 절대 채우지 않는다 (전부 수동으로 확정)", () => {
    const input = buildInputFromShipment(baseShipment())
    assert.deepEqual(input.shipper, { companyName: "", address: "", contact: "", taxId: "" })
  })

  it("상업 정보(HS코드·단가·거래조건)는 채우지 않는다", () => {
    const input = buildInputFromShipment(baseShipment())
    assert.equal(input.items[0].hsCode, "")
    assert.equal(input.items[0].unitPrice, "")
    assert.equal(input.incoterm, "FOB") // 기본값 그대로, 화물에서 온 값 아님
  })

  it("품목의 설명·수량·중량·치수를 옮긴다 (중량은 net 자리에)", () => {
    const input = buildInputFromShipment(baseShipment())
    const [item] = input.items

    assert.equal(item.description, "Widgets")
    assert.equal(item.quantity, "10")
    assert.equal(item.netWeightKg, "120")
    assert.equal(item.grossWeightKg, "") // 화물 데이터엔 순/총 구분이 없어 비워 둔다
    assert.equal(item.lengthCm, "40")
    assert.equal(item.widthCm, "30")
    assert.equal(item.heightCm, "20")
  })

  it("운송모드는 7종 → 5종으로 뭉친다", () => {
    const cases: [string, string][] = [
      ["SEA", "SEA"],
      ["AIR", "AIR"],
      ["RAIL", "RAIL"],
      ["TRUCK_DOMESTIC", "TRUCK"],
      ["TRUCK_CROSSBORDER", "TRUCK"],
      ["SEA_AIR", "SEA"],
      ["EXPRESS", "COURIER"],
    ]
    for (const [transportMode, expected] of cases) {
      const input = buildInputFromShipment({ ...baseShipment(), transportMode })
      assert.equal(input.shipMode, expected, `${transportMode} → ${expected}`)
    }
  })

  it("모르는/없는 운송모드는 SEA 로 떨어진다", () => {
    const input = buildInputFromShipment({ ...baseShipment(), transportMode: null })
    assert.equal(input.shipMode, "SEA")
  })

  it("품목이 없는 화물은 빈 품목 하나로 시작한다", () => {
    const input = buildInputFromShipment({ ...baseShipment(), items: [] })
    assert.equal(input.items.length, 1)
    assert.equal(input.items[0].description, "")
  })

  it("고객명이 없어도 죽지 않고 빈 칸이 된다", () => {
    const input = buildInputFromShipment({ ...baseShipment(), customer: undefined })
    assert.equal(input.consignee.companyName, "")
  })
})
