const mongoose = require('mongoose');
const { DAMAGE_TYPES, SEVERITIES } = require('../utils/damage-inspection');

/**
 * 화물 파손 판정 기록
 *
 * ⚠️ result 는 비전 LLM 의 zero-shot 판정이다. 1차 스크리닝 보조 자료이며
 *    최종 파손 여부는 사람이 확인해야 한다. (utils/damage-inspection.js 참고)
 */
const damageInspectionSchema = new mongoose.Schema({
  /**
   * 리사이즈/압축된 썸네일(JPEG) base64.
   * 원본은 저장하지 않는다. MongoDB 문서 상한(16MB)과 조회 성능 때문에
   * 압축본만 남긴다.
   */
  imageBase64: {
    type: String,
    required: true
  },
  imageMeta: {
    width: Number,
    height: Number,
    bytes: Number,
    originalWidth: Number,
    originalHeight: Number,
    originalBytes: Number
  },

  result: {
    isDamaged: { type: Boolean, required: true },
    damageType: { type: String, enum: DAMAGE_TYPES, required: true },
    severity: { type: String, enum: SEVERITIES, required: true },
    description: { type: String, default: '' },
    confidence: { type: Number, min: 0, max: 1, default: 0 }
  },

  /** 판정에 사용된 모델/토큰 등 (재현 및 비용 추적용) */
  inspectionMeta: {
    model: String,
    method: String,
    attempts: Number,
    finishReason: String,
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number
  },

  /** 특정 화물과 연결할 수 있게 (선택) */
  shipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment',
    index: true
  },

  /**
   * 사람이 최종 확인한 결과.
   * AI 판정을 그대로 확정으로 쓰지 않기 위한 필드다.
   * null 이면 아직 사람 검토 전.
   */
  reviewedByHuman: {
    type: Boolean,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const DamageInspection = mongoose.model('DamageInspection', damageInspectionSchema);

module.exports = DamageInspection;
