const mongoose = require("mongoose");

const Notice = require("../models/notice.model");
const logger = require("../utils/logger");

const fail = (res, code, error) =>
  res.status(code).json({ success: false, error });

const badId = (id) => !mongoose.Types.ObjectId.isValid(id);

const PUBLIC_SORT = { isPinned: -1, publishedAt: -1 };

/**
 * GET /api/notices
 * 공개. published 만, 카테고리 필터 + 페이지네이션.
 */
exports.listPublicNotices = async (req, res) => {
  try {
    const query = { isPublished: true };
    if (req.query.category) query.category = req.query.category;

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const [notices, total] = await Promise.all([
      Notice.find(query)
        .sort(PUBLIC_SORT)
        .skip((page - 1) * limit)
        .limit(limit),
      Notice.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      data: notices.map((n) => n.toClientJSON()),
    });
  } catch (error) {
    logger.error("공지사항 목록 조회 실패:", error);
    return fail(res, 500, "공지사항 목록을 불러오지 못했습니다.");
  }
};

/**
 * GET /api/notices/all
 * 관리자 전용. draft 포함 전체(관리 화면용). 페이지네이션만, 필터 없음.
 */
exports.listAllNotices = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const [notices, total] = await Promise.all([
      Notice.find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notice.countDocuments({}),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      data: notices.map((n) => n.toClientJSON()),
    });
  } catch (error) {
    logger.error("공지사항 전체 목록 조회 실패:", error);
    return fail(res, 500, "공지사항 목록을 불러오지 못했습니다.");
  }
};

/**
 * GET /api/notices/:id
 * 공개. published 아니면(또는 없으면) 404 — draft 존재 여부를 외부에 드러내지 않는다.
 */
exports.getPublicNotice = async (req, res) => {
  try {
    const { id } = req.params;
    if (badId(id)) return fail(res, 404, "공지사항을 찾을 수 없습니다.");

    const notice = await Notice.findOne({ _id: id, isPublished: true });
    if (!notice) return fail(res, 404, "공지사항을 찾을 수 없습니다.");

    return res.status(200).json({ success: true, data: notice.toClientJSON() });
  } catch (error) {
    logger.error("공지사항 조회 실패:", error);
    return fail(res, 500, "공지사항을 불러오지 못했습니다.");
  }
};

/**
 * POST /api/notices
 * 관리자 전용. 기본은 draft(isPublished:false).
 */
exports.createNotice = async (req, res) => {
  try {
    const { title, body, category, isPinned, isPublished } = req.body;

    const notice = await Notice.create({
      title,
      body,
      category,
      isPinned: Boolean(isPinned),
      isPublished: Boolean(isPublished),
      createdBy: req.user.id,
    });

    logger.info(`공지사항 생성: ${notice._id} by ${req.user.email}`);
    return res.status(201).json({ success: true, data: notice.toClientJSON() });
  } catch (error) {
    if (error.name === "ValidationError") {
      return fail(
        res,
        400,
        `입력이 유효하지 않습니다: ${Object.values(error.errors)
          .map((e) => e.message)
          .join(", ")}`,
      );
    }
    logger.error("공지사항 생성 실패:", error);
    return fail(res, 500, "공지사항을 만들지 못했습니다.");
  }
};

/**
 * PATCH /api/notices/:id
 * 관리자 전용. title/body/category/isPinned/isPublished 중 보낸 것만 바꾼다.
 * isPublished 를 true 로 바꾸면 모델의 pre-save 훅이 publishedAt 을 채운다.
 */
exports.updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    if (badId(id)) return fail(res, 404, "공지사항을 찾을 수 없습니다.");

    const notice = await Notice.findById(id);
    if (!notice) return fail(res, 404, "공지사항을 찾을 수 없습니다.");

    const { title, body, category, isPinned, isPublished } = req.body;
    if (title !== undefined) notice.title = title;
    if (body !== undefined) notice.body = body;
    if (category !== undefined) notice.category = category;
    if (isPinned !== undefined) notice.isPinned = Boolean(isPinned);
    if (isPublished !== undefined) notice.isPublished = Boolean(isPublished);

    await notice.save();
    return res.status(200).json({ success: true, data: notice.toClientJSON() });
  } catch (error) {
    if (error.name === "ValidationError") {
      return fail(
        res,
        400,
        `입력이 유효하지 않습니다: ${Object.values(error.errors)
          .map((e) => e.message)
          .join(", ")}`,
      );
    }
    logger.error("공지사항 수정 실패:", error);
    return fail(res, 500, "공지사항을 수정하지 못했습니다.");
  }
};

/**
 * DELETE /api/notices/:id
 * 관리자 전용.
 */
exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    if (badId(id)) return fail(res, 404, "공지사항을 찾을 수 없습니다.");

    const deleted = await Notice.findByIdAndDelete(id);
    if (!deleted) return fail(res, 404, "공지사항을 찾을 수 없습니다.");

    return res.status(200).json({ success: true, message: "삭제되었습니다." });
  } catch (error) {
    logger.error("공지사항 삭제 실패:", error);
    return fail(res, 500, "공지사항을 삭제하지 못했습니다.");
  }
};
