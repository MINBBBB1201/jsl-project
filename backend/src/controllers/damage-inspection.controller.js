const mongoose = require('mongoose');
const DamageInspection = require('../models/damage-inspection.model');
const { inspectDamage, enqueue, getPendingCount } = require('../utils/damage-inspection');
const { groqApiKey } = require('../config/config');
const logger = require('../utils/logger');

/**
 * POST /api/damage-inspection
 * multipart/form-data — field: image (jpg/png, 5MB 이하)
 *
 * 업로드 → 리사이즈 → 비전 LLM 판정 → 저장 → 결과 반환
 */
exports.createInspection = async (req, res) => {
  try {
    if (!groqApiKey) {
      return res.status(503).json({
        success: false,
        error: 'GROQ_API_KEY가 설정되지 않았습니다. backend/.env 에 키를 추가해 주세요.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '이미지 파일이 필요합니다. (multipart/form-data, 필드명: image)'
      });
    }

    const { shipmentId } = req.body;
    if (shipmentId && !mongoose.Types.ObjectId.isValid(shipmentId)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 shipmentId 입니다.'
      });
    }

    // TPM 8,000 제한 때문에 동시 호출을 막고 한 건씩 처리한다
    const queuedAhead = getPendingCount();
    const { result, image, meta } = await enqueue(() => inspectDamage(req.file.buffer));

    const doc = await DamageInspection.create({
      imageBase64: image.buffer.toString('base64'),
      imageMeta: {
        width: image.width,
        height: image.height,
        bytes: image.bytes,
        originalWidth: image.originalWidth,
        originalHeight: image.originalHeight,
        originalBytes: image.originalBytes
      },
      result,
      inspectionMeta: {
        model: meta.model,
        method: meta.method,
        attempts: meta.attempts,
        finishReason: meta.finishReason,
        promptTokens: meta.usage?.prompt_tokens,
        completionTokens: meta.usage?.completion_tokens,
        totalTokens: meta.usage?.total_tokens
      },
      shipmentId: shipmentId || undefined
    });

    logger.info(
      `파손 판정 완료: ${result.isDamaged ? result.damageType + '/' + result.severity : '이상없음'} ` +
      `(confidence=${result.confidence}, tokens=${meta.usage?.total_tokens})`
    );

    res.status(201).json({
      success: true,
      data: {
        id: doc._id,
        result,
        imageMeta: doc.imageMeta,
        inspectionMeta: doc.inspectionMeta,
        createdAt: doc.createdAt,
        queuedAhead
      },
      // UI 가 과장된 문구를 쓰지 않도록 서버에서 함께 내려준다
      disclaimer:
        'AI 1차 스크리닝 결과입니다. 오탐/미탐이 있을 수 있으므로 최종 파손 여부는 담당자가 확인해야 합니다.'
    });
  } catch (error) {
    // ── Groq 레이트리밋 ──────────────────────────────────────────────
    if (error.status === 429) {
      logger.warn('파손 판정 레이트리밋(429)');
      return res.status(429).json({
        success: false,
        error: '요청이 몰려 잠시 처리할 수 없습니다. 1분 후 다시 시도해 주세요.',
        code: 'RATE_LIMITED',
        retryAfterSeconds: 60
      });
    }

    // ── 모델 응답 파싱 실패 ──────────────────────────────────────────
    if (error.code === 'PARSE_FAILED') {
      logger.error(`파손 판정 파싱 실패: ${error.message}`);
      return res.status(502).json({
        success: false,
        error: '판정 결과를 해석하지 못했습니다. 다른 사진으로 다시 시도해 주세요.',
        code: 'PARSE_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.rawSample : undefined
      });
    }

    // ── 이미지 자체가 깨진 경우 (sharp) ──────────────────────────────
    if (/unsupported image format|Input buffer/i.test(error.message || '')) {
      return res.status(400).json({
        success: false,
        error: '이미지를 읽을 수 없습니다. jpg 또는 png 파일인지 확인해 주세요.'
      });
    }

    if (error.status) {
      logger.error(`파손 판정 LLM 오류 (${error.status}):`, error);
      return res.status(502).json({
        success: false,
        error: `판정 API 호출에 실패했습니다. (${error.status})`,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    logger.error('파손 판정 실패:', error);
    res.status(500).json({
      success: false,
      error: '파손 판정에 실패했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/damage-inspection
 * 최근 판정 목록 (페이지네이션).
 * 목록에서는 imageBase64 를 제외하고, 썸네일이 필요하면 상세로 조회한다.
 */
exports.getInspections = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.isDamaged === 'true') query['result.isDamaged'] = true;
    if (req.query.isDamaged === 'false') query['result.isDamaged'] = false;
    if (req.query.severity) query['result.severity'] = req.query.severity;

    // includeImage=true 면 썸네일까지 함께 (목록 그리드에서 사용)
    const projection = req.query.includeImage === 'true' ? {} : { imageBase64: 0 };

    const [items, total] = await Promise.all([
      DamageInspection.find(query, projection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DamageInspection.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: items,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    logger.error('파손 판정 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '판정 이력 조회에 실패했습니다.'
    });
  }
};

/** GET /api/damage-inspection/:id — 썸네일 포함 상세 */
exports.getInspectionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: '유효하지 않은 id 입니다.' });
    }

    const doc = await DamageInspection.findById(id).lean();
    if (!doc) {
      return res.status(404).json({ success: false, error: '판정 기록을 찾을 수 없습니다.' });
    }

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    logger.error('파손 판정 조회 실패:', error);
    res.status(500).json({ success: false, error: '판정 기록 조회에 실패했습니다.' });
  }
};
