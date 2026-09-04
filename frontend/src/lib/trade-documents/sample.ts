import type { TradeDocumentInput } from "./types"

/**
 * "샘플로 채우기" 용 합성 데이터.
 *
 * ############################################################################
 * # 이 데이터는 데모용이며 실제 거래·기업이 아닙니다.                          #
 * # 회사명에 [DEMO] 를 붙여 화면과 PDF 양쪽에서 눈에 띄게 합니다              #
 * # (backend/src/scripts/seed-shipments.js 의 DEMO_MARKER 관례와 같습니다).   #
 * ############################################################################
 *
 * 방문자가 아무것도 타이핑하지 않고 결과 PDF 를 먼저 볼 수 있게 하는 용도다.
 * 품명에 한글을 한 줄 섞어 둔다 — 한글 폰트 임베딩이 깨졌는지 샘플만 눌러도
 * 바로 드러난다.
 */
export const buildSampleInput = (): TradeDocumentInput => {
  const today = new Date()
  const iso = today.toISOString().slice(0, 10)
  const serial = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`

  return {
    invoiceNo: `DEMO-INV-${serial}`,
    invoiceDate: iso,
    referenceNo: `DEMO-${serial}-SEA`,

    shipper: {
      companyName: "[DEMO] JSL Logistics Co., Ltd.",
      address: "12F, 234 Teheran-ro, Gangnam-gu, Seoul 06221, Republic of Korea",
      contact: "Tel +82-2-000-0000 / demo@example.com",
      taxId: "000-00-00000",
    },
    consignee: {
      companyName: "[DEMO] Rhein Handel GmbH",
      address: "Hafenstrasse 18, 20457 Hamburg, Germany",
      contact: "Tel +49-40-000-0000 / demo-buyer@example.com",
      taxId: "DE000000000",
    },

    countryOfOrigin: "Republic of Korea",
    countryOfDestination: "Germany",
    portOfLoading: "Busan, KR",
    portOfDischarge: "Hamburg, DE",
    shipMode: "SEA",
    incoterm: "FOB",
    incotermPlace: "Busan",
    paymentTerm: "T/T",
    currency: "USD",
    marksAndNumbers: "[DEMO] JSL / HAMBURG / C/NO. 1-24 / MADE IN KOREA",

    items: [
      {
        id: "item-1",
        hsCode: "8517.62",
        // 한글 품명 — PDF 폰트 임베딩 확인용
        description: "무선 네트워크 라우터 (Wireless Network Router)",
        origin: "KR",
        quantity: "120",
        unit: "PCS",
        unitPrice: "84.50",
        packages: "10",
        netWeightKg: "216",
        grossWeightKg: "248",
        lengthCm: "60",
        widthCm: "40",
        heightCm: "35",
      },
      {
        id: "item-2",
        hsCode: "8544.42",
        description: "LAN Patch Cable, Cat6A, 3m",
        origin: "KR",
        quantity: "800",
        unit: "PCS",
        unitPrice: "3.20",
        packages: "8",
        netWeightKg: "104",
        grossWeightKg: "121",
        lengthCm: "50",
        widthCm: "40",
        heightCm: "30",
      },
      {
        id: "item-3",
        hsCode: "3926.90",
        description: "케이블 정리용 플라스틱 트레이 (Cable Tray, PP)",
        origin: "KR",
        quantity: "300",
        unit: "SET",
        unitPrice: "6.75",
        packages: "6",
        netWeightKg: "90",
        grossWeightKg: "102",
        lengthCm: "80",
        widthCm: "45",
        heightCm: "28",
      },
    ],
  }
}
