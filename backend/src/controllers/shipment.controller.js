/**
 * 화물 컨트롤러 진입점.
 *
 * 핸들러를 기능별 파일(controllers/shipment/)로 나눴다. 라우터와 다른 모듈은
 * 예전처럼 이 파일 하나만 require 하면 되도록 같은 이름으로 다시 내보낸다.
 *
 *   crud.controller.js        생성 / 목록 / 상태·위치 변경
 *   tracking.controller.js    상세·공개 조회 / ETA / 이력 / 주변 / 경로 거리
 *   analytics.controller.js   지연 요약 / 대시보드 KPI / 추이
 *   checkpoint.controller.js  체크포인트 추가·수정·삭제
 *   shared.js                 PII 제거, 리스크 재계산 등 공용 헬퍼
 *
 * PII 정책(PII_EXCLUDED_FIELDS)은 shared.js 에 있다.
 */
module.exports = {
  ...require("./shipment/crud.controller"),
  ...require("./shipment/tracking.controller"),
  ...require("./shipment/analytics.controller"),
  ...require("./shipment/checkpoint.controller"),
};
