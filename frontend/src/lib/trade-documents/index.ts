export * from "./types"
export * from "./totals"
export { buildSampleInput } from "./sample"
export { validateInput, hasBlockingErrors, type ValidationErrors } from "./validate"

// Phase 2 — 저장·불러오기 (백엔드 /api/trade-documents 연동)
export * from "./api-types"
export * from "./api"
export { toApiInput } from "./serialize"
export { fromApiInput } from "./deserialize"
export {
  buildInputFromShipment,
  type ShipmentPrefillItem,
  type ShipmentPrefillSource,
} from "./from-shipment"
