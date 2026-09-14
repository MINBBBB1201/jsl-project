const mongoose = require('mongoose');

const TradeDocument = require('../models/trade-document.model');
const Counter = require('../models/counter.model');
const Shipment = require('../models/shipment.model');
const logger = require('../utils/logger');
const { TYPE_PREFIX } = require('../config/trade-documents');

/* ── 입력 정규화 ─────────────────────────────────────────────────────
 *
 * 공개 생성기(Phase 1) 폼은 숫자를 String 으로 들고 있고("", "1." 같은 입력 중
 * 상태) 프론트가 저장 직전에 정리해 보내지만, 백엔드도 방어적으로 한 번 더 한다.
 * 빈 값은 0 이 아니라 null 이다 — 포장명세서 합계에서 "미입력"과 "0"은 다르다.
 */

const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));

const num = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const normalizeParty = (p = {}) => ({
  companyName: str(p.companyName),
  address: str(p.address),
  contact: str(p.contact),
  taxId: str(p.taxId),
});

const normalizeItem = (it = {}) => ({
  hsCode: str(it.hsCode),
  description: str(it.description),
  origin: str(it.origin),
  quantity: num(it.quantity) ?? 0,
  unit: it.unit || 'PCS',
  unitPrice: num(it.unitPrice),
  packages: num(it.packages),
  netWeightKg: num(it.netWeightKg),
  grossWeightKg: num(it.grossWeightKg),
  lengthCm: num(it.lengthCm),
  widthCm: num(it.widthCm),
  heightCm: num(it.heightCm),
});

const normalizeInput = (input = {}) => ({
  invoiceDate: str(input.invoiceDate),
  referenceNo: str(input.referenceNo),
  shipper: normalizeParty(input.shipper),
  consignee: normalizeParty(input.consignee),
  countryOfOrigin: str(input.countryOfOrigin),
  countryOfDestination: str(input.countryOfDestination),
  portOfLoading: str(input.portOfLoading),
  portOfDischarge: str(input.portOfDischarge),
  shipMode: input.shipMode || 'SEA',
  incoterm: input.incoterm || 'FOB',
  incotermPlace: str(input.incotermPlace),
  paymentTerm: input.paymentTerm || 'T/T',
  currency: input.currency || 'USD',
  marksAndNumbers: str(input.marksAndNumbers),
  items: Array.isArray(input.items) ? input.items.map(normalizeItem) : [],
});

/* ── 응답 헬퍼 ──────────────────────────────────────────────────────── */

const fail = (res, code, error) => res.status(code).json({ success: false, error });

const badId = (id) => !mongoose.Types.ObjectId.isValid(id);

/** 개정 체인 요약 (상세 응답에 붙인다) */
const chainSummary = async (revisionRootId) => {
  const docs = await TradeDocument.find({ revisionRootId })
    .select('version status documentNo issuedAt createdAt')
    .sort({ version: 1 })
    .lean();
  return docs.map((d) => ({
    id: d._id.toString(),
    version: d.version,
    status: d.status,
    documentNo: d.documentNo,
    issuedAt: d.issuedAt,
    createdAt: d.createdAt,
  }));
};

/* ── 핸들러 ─────────────────────────────────────────────────────────── */

/**
 * POST /api/trade-documents
 * draft 생성. body: { type, shipmentId?, input }
 */
exports.createTradeDocument = async (req, res) => {
  try {
    const { type, shipmentId } = req.body;

    if (shipmentId) {
      if (badId(shipmentId)) return fail(res, 400, '유효하지 않은 shipmentId 입니다.');
      const exists = await Shipment.exists({ _id: shipmentId });
      if (!exists) return fail(res, 404, '연결하려는 화물을 찾을 수 없습니다.');
    }

    const doc = await TradeDocument.create({
      type,
      shipmentId: shipmentId || null,
      input: normalizeInput(req.body.input),
      createdBy: req.user.id,
    });

    logger.info(`무역서류 draft 생성: ${type} (${doc._id}) by ${req.user.email}`);
    return res.status(201).json({ success: true, data: doc.toClientJSON() });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return fail(res, 400, `입력이 유효하지 않습니다: ${Object.values(error.errors).map((e) => e.message).join(', ')}`);
    }
    logger.error('무역서류 생성 실패:', error);
    return fail(res, 500, '무역서류를 만들지 못했습니다.');
  }
};

/**
 * GET /api/trade-documents
 * 필터: type, status, shipmentId, mine=1
 * 기본은 개정 체인당 최신 버전 1건만. allVersions=1 이면 전부.
 */
exports.listTradeDocuments = async (req, res) => {
  try {
    const query = {};
    if (req.query.type) query.type = req.query.type;
    if (req.query.status) query.status = req.query.status;
    if (req.query.shipmentId && !badId(req.query.shipmentId)) query.shipmentId = req.query.shipmentId;
    if (req.query.mine === '1' || req.query.mine === 'true') query.createdBy = req.user.id;

    const docs = await TradeDocument.find(query).sort({ updatedAt: -1 });

    let list = docs;
    if (req.query.allVersions !== '1' && req.query.allVersions !== 'true') {
      // 체인당 최신 version 만 남긴다
      const headByRoot = new Map();
      for (const d of docs) {
        const key = d.revisionRootId.toString();
        const cur = headByRoot.get(key);
        if (!cur || d.version > cur.version) headByRoot.set(key, d);
      }
      list = [...headByRoot.values()];
    }

    return res.status(200).json({
      success: true,
      total: list.length,
      data: list.map((d) => d.toClientJSON()),
    });
  } catch (error) {
    logger.error('무역서류 목록 조회 실패:', error);
    return fail(res, 500, '무역서류 목록을 불러오지 못했습니다.');
  }
};

/**
 * GET /api/trade-documents/:id
 * 단건 + 개정 체인 요약.
 */
exports.getTradeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    if (badId(id)) return fail(res, 400, '유효하지 않은 id 입니다.');

    const doc = await TradeDocument.findById(id);
    if (!doc) return fail(res, 404, '무역서류를 찾을 수 없습니다.');

    return res.status(200).json({
      success: true,
      data: doc.toClientJSON(),
      versions: await chainSummary(doc.revisionRootId),
    });
  } catch (error) {
    logger.error('무역서류 조회 실패:', error);
    return fail(res, 500, '무역서류를 불러오지 못했습니다.');
  }
};

/**
 * PATCH /api/trade-documents/:id
 * draft 만. body: { input?, shipmentId? }
 */
exports.updateTradeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    if (badId(id)) return fail(res, 400, '유효하지 않은 id 입니다.');

    const doc = await TradeDocument.findById(id);
    if (!doc) return fail(res, 404, '무역서류를 찾을 수 없습니다.');
    if (!doc.isEditable()) return fail(res, 409, `${doc.status} 상태의 서류는 편집할 수 없습니다. 개정본을 만드세요.`);

    if (req.body.input !== undefined) doc.input = normalizeInput(req.body.input);

    if (req.body.shipmentId !== undefined) {
      const sid = req.body.shipmentId;
      if (sid === null || sid === '') {
        doc.shipmentId = null;
      } else {
        if (badId(sid)) return fail(res, 400, '유효하지 않은 shipmentId 입니다.');
        if (!(await Shipment.exists({ _id: sid }))) return fail(res, 404, '연결하려는 화물을 찾을 수 없습니다.');
        doc.shipmentId = sid;
      }
    }

    await doc.save();
    return res.status(200).json({ success: true, data: doc.toClientJSON() });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return fail(res, 400, `입력이 유효하지 않습니다: ${Object.values(error.errors).map((e) => e.message).join(', ')}`);
    }
    logger.error('무역서류 수정 실패:', error);
    return fail(res, 500, '무역서류를 수정하지 못했습니다.');
  }
};

/**
 * POST /api/trade-documents/:id/issue
 * draft → issued. 번호를 부여하고 동결한다.
 * 개정본이면 직전 issued 버전을 superseded 로 넘긴다.
 *
 * ⚠️ 동시성: 같은 문서에 발행 요청이 거의 동시에 두 번 오면(더블클릭, 탭 두 개)
 *    `findById` → 검사 → `save()` 순서로는 둘 다 draft 를 보고 통과해, 나중에
 *    저장하는 쪽이 앞선 저장을 조용히 덮어쓸 수 있다(번호 하나가 말없이 버려짐).
 *    그래서 상태 전이 자체는 `findOneAndUpdate({_id, status:'draft'}, ...)` 로
 *    한 번에 원자적으로 "선점"한다 — 필터에 걸리는 문서가 없으면(이미 누가
 *    먼저 발행했으면) `null` 이 돌아오고 409 로 응답한다.
 *    Counter 는 원래도 원자적이라 번호 자체가 겹치진 않는다. 다만 진 쪽의
 *    Counter.next() 호출은 그대로 소비되어 시퀀스에 구멍이 남을 수 있다
 *    (예: 0001 발행 성공, 0002 는 못 쓰고 버려짐, 다음은 0003) — 실무 송장
 *    번호에서도 결번은 흔하고, 데이터 무결성(번호 중복·조용한 덮어쓰기)보다
 *    우선순위가 낮은 트레이드오프라 받아들인다.
 */
exports.issueTradeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    if (badId(id)) return fail(res, 400, '유효하지 않은 id 입니다.');

    const doc = await TradeDocument.findById(id).select('type status revisionRootId _id');
    if (!doc) return fail(res, 404, '무역서류를 찾을 수 없습니다.');
    if (doc.status !== 'draft') return fail(res, 409, '이미 발행된 서류입니다.');

    const isRevision = doc.revisionRootId.toString() !== doc._id.toString();

    let documentNo;
    if (isRevision) {
      // 번호는 root 것을 물려받는다 (CI-2026-0042 Rev.1 처럼 같은 번호를 쓴다)
      const root = await TradeDocument.findById(doc.revisionRootId).select('documentNo');
      documentNo = root ? root.documentNo : null;
    } else {
      const year = new Date().getFullYear();
      const key = `${TYPE_PREFIX[doc.type]}-${year}`;
      const seq = await Counter.next(key);
      documentNo = `${key}-${String(seq).padStart(4, '0')}`;
    }

    // 상태 전이를 원자적으로 선점한다. 이미 발행됐다면(동시 요청) 여기서 걸린다.
    const issued = await TradeDocument.findOneAndUpdate(
      { _id: id, status: 'draft' },
      { $set: { documentNo, status: 'issued', issuedBy: req.user.id, issuedAt: new Date() } },
      { new: true }
    );
    if (!issued) {
      return fail(res, 409, '이미 다른 요청이 이 서류를 발행했습니다. 새로고침 후 확인해 주세요.');
    }

    if (isRevision) {
      // 체인에서 아직 살아있는 이전 issued 버전을 superseded 로. 방금 이 문서
      // 자신도 status:'issued' 라 _id 를 제외해야 스스로를 덮어쓰지 않는다.
      await TradeDocument.updateMany(
        { revisionRootId: issued.revisionRootId, status: 'issued', _id: { $ne: issued._id } },
        { $set: { status: 'superseded', supersededById: issued._id } }
      );
    }

    logger.info(`무역서류 발행: ${issued.documentNo} (v${issued.version}) by ${req.user.email}`);
    return res.status(200).json({
      success: true,
      data: issued.toClientJSON(),
      versions: await chainSummary(issued.revisionRootId),
    });
  } catch (error) {
    logger.error('무역서류 발행 실패:', error);
    return fail(res, 500, '무역서류를 발행하지 못했습니다.');
  }
};

/**
 * POST /api/trade-documents/:id/revise
 * issued → input 을 복사한 새 draft(version+1). 같은 체인에 draft 가 이미 있으면 거부.
 *
 * ⚠️ 동시성: 위의 exists() 체크도 TOCTOU 경합에서 완벽히 막지는 못한다(두
 *    요청이 거의 동시에 exists() 를 통과할 수 있다). 최종 방어선은 모델의
 *    `{revisionRootId, version}` unique 인덱스다 — 둘 다 같은 version 으로
 *    create() 하면 하나는 E11000 으로 실패하고, 그 경우 아래서 409 로 바꿔 준다.
 */
exports.reviseTradeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    if (badId(id)) return fail(res, 400, '유효하지 않은 id 입니다.');

    const doc = await TradeDocument.findById(id);
    if (!doc) return fail(res, 404, '무역서류를 찾을 수 없습니다.');
    if (doc.status !== 'issued') return fail(res, 409, '발행된 서류만 개정할 수 있습니다.');

    const openDraft = await TradeDocument.exists({ revisionRootId: doc.revisionRootId, status: 'draft' });
    if (openDraft) return fail(res, 409, '이 서류에는 아직 발행되지 않은 개정 draft 가 있습니다.');

    const revision = await TradeDocument.create({
      type: doc.type,
      shipmentId: doc.shipmentId,
      // documentNo 는 두지 않는다 — 발행 시 root 번호를 물려받는다
      status: 'draft',
      revisionRootId: doc.revisionRootId,
      version: doc.version + 1,
      previousVersionId: doc._id,
      input: doc.input.toObject(),
      createdBy: req.user.id,
    });

    logger.info(`무역서류 개정 draft: ${doc.documentNo} v${revision.version} by ${req.user.email}`);
    return res.status(201).json({ success: true, data: revision.toClientJSON() });
  } catch (error) {
    if (error.code === 11000) {
      return fail(res, 409, '이미 다른 요청이 개정 draft 를 만들었습니다. 새로고침 후 확인해 주세요.');
    }
    logger.error('무역서류 개정 실패:', error);
    return fail(res, 500, '개정본을 만들지 못했습니다.');
  }
};

/**
 * DELETE /api/trade-documents/:id
 * draft 만. 작성자 또는 admin.
 */
exports.deleteTradeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    if (badId(id)) return fail(res, 400, '유효하지 않은 id 입니다.');

    const doc = await TradeDocument.findById(id);
    if (!doc) return fail(res, 404, '무역서류를 찾을 수 없습니다.');
    if (doc.status !== 'draft') return fail(res, 409, '발행된 서류는 삭제할 수 없습니다.');
    if (doc.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return fail(res, 403, '본인이 만든 draft 만 삭제할 수 있습니다.');
    }

    await doc.deleteOne();
    return res.status(200).json({ success: true, message: '삭제되었습니다.' });
  } catch (error) {
    logger.error('무역서류 삭제 실패:', error);
    return fail(res, 500, '무역서류를 삭제하지 못했습니다.');
  }
};
