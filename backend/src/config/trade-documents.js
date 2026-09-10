/**
 * 무역서류(상업송장 · 포장명세서 · 프로포마) 상수.
 *
 * ⚠️ 이 목록들은 프론트엔드 `frontend/src/lib/trade-documents/types.ts` 의
 *    INCOTERMS / PAYMENT_TERMS / CURRENCIES / UNITS / SHIP_MODES 와 같은 값이어야
 *    한다. 서류에 그대로 찍히는 코드라 한쪽만 바뀌면 저장은 되는데 PDF 가
 *    이상해지거나(백엔드가 넓게 받음) 저장이 막힌다(백엔드가 좁게 받음).
 *    프론트가 원본이고 여기가 사본이다 — 프론트를 고치면 여기도 고칠 것.
 *    (config/pdf-theme 이 브랜드색을 hex 로 복제해 둔 것과 같은 선례)
 */

/** 서류 종류. Phase 1 은 invoice/packing 둘뿐이었지만 Phase 2 는 프로포마까지 다룬다. */
const TRADE_DOCUMENT_TYPES = ['commercial_invoice', 'packing_list', 'proforma_invoice'];

/** 서류번호 접두사. documentNo = `${prefix}-${YYYY}-${seq}` (issue 시점에 부여) */
const TYPE_PREFIX = {
  commercial_invoice: 'CI',
  packing_list: 'PL',
  proforma_invoice: 'PI',
};

const DOCUMENT_STATUSES = ['draft', 'issued', 'superseded'];

const INCOTERMS = ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'];
const PAYMENT_TERMS = ['T/T', 'L/C', 'D/P', 'D/A', 'Open Account', 'Cash in Advance'];
const CURRENCIES = ['USD', 'EUR', 'KRW', 'CNY', 'JPY', 'VND'];
const UNITS = ['PCS', 'SET', 'BOX', 'CTN', 'PLT', 'KG', 'M', 'M2', 'M3'];
const SHIP_MODES = ['SEA', 'AIR', 'RAIL', 'TRUCK', 'COURIER'];

module.exports = {
  TRADE_DOCUMENT_TYPES,
  TYPE_PREFIX,
  DOCUMENT_STATUSES,
  INCOTERMS,
  PAYMENT_TERMS,
  CURRENCIES,
  UNITS,
  SHIP_MODES,
};
