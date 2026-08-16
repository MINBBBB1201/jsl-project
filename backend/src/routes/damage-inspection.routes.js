const express = require('express');
const multer = require('multer');
const router = express.Router();
const damageInspectionController = require('../controllers/damage-inspection.controller');
const { SEVERITIES } = require('../utils/damage-inspection');
const { requireAuth } = require('../middleware/auth.middleware');

/**
 * 파손 판정은 전부 내부 업무 기능이다.
 * 판정 기록에는 화물 사진과 판정 사유가 담기므로 저장·조회 모두 로그인이 필요하다.
 * (업로드 자체가 비전 모델 호출이라 공개돼 있으면 비용도 그대로 노출된다.)
 */
router.use(requireAuth);

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ['image/jpeg', 'image/png'];

/**
 * 이미지는 메모리에 받는다. 디스크에 쓰지 않으므로 업로드된 파일이
 * 서버 파일시스템에 남지 않고, 리사이즈 후 DB 에 압축본만 저장된다.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
    fields: 5
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      const err = new Error('jpg 또는 png 이미지만 업로드할 수 있습니다.');
      err.code = 'INVALID_FILE_TYPE';
      return cb(err);
    }
    cb(null, true);
  }
});

/**
 * 매직 바이트 검사.
 *
 * mimetype 과 확장자는 클라이언트가 마음대로 보낼 수 있어 믿을 수 없다.
 * 파일 시작 바이트로 실제 JPEG/PNG 인지 한 번 더 확인한다.
 */
const verifyImageSignature = (req, res, next) => {
  if (!req.file) return next();

  const buf = req.file.buffer;
  const isPng =
    buf.length > 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a;
  const isJpeg =
    buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;

  if (!isPng && !isJpeg) {
    return res.status(400).json({
      success: false,
      error: '실제 jpg/png 이미지가 아닙니다. 파일을 확인해 주세요.'
    });
  }
  next();
};

/** multer 에러를 사용자 문구로 바꾼다 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: `이미지는 ${MAX_UPLOAD_BYTES / 1024 / 1024}MB 이하여야 합니다.`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: '이미지는 한 번에 한 장만 업로드할 수 있습니다.'
      });
    }
    return res.status(400).json({ success: false, error: `업로드 오류: ${err.message}` });
  }

  if (err && err.code === 'INVALID_FILE_TYPE') {
    return res.status(415).json({ success: false, error: err.message });
  }

  next(err);
};

// 판정 요청
router.post(
  '/',
  upload.single('image'),
  handleUploadError,
  verifyImageSignature,
  damageInspectionController.createInspection
);

// 최근 판정 목록
router.get('/', damageInspectionController.getInspections);

// 상세 (썸네일 포함)
router.get('/:id', damageInspectionController.getInspectionById);

module.exports = router;
module.exports.MAX_UPLOAD_BYTES = MAX_UPLOAD_BYTES;
module.exports.SEVERITIES = SEVERITIES;
