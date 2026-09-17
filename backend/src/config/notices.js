/**
 * 공지사항(Notices) 상수.
 *
 * 공개 화면은 frontend/src/app/[locale]/(public)/notices/ 에 있다.
 * 관리 화면은 frontend/src/app/(dashboard)/announcements/ 에 있다 — URL 이
 * "/notices" 가 아니라 "/announcements" 인 이유는 middleware.ts 의
 * LOCALIZED_SEGMENTS 에 "notices" 가 등록돼 있어 "/notices" 요청을 항상
 * 공개 페이지로 먼저 보내기 때문(경로가 겹치면 관리 화면이 열리지 않는다).
 * 카테고리 값을 바꾸면 프론트의
 * frontend/src/app/(dashboard)/announcements/types.ts 의
 * NOTICE_CATEGORIES 도 같이 고칠 것 — 값이 중복 정의돼 있어 자동
 * 동기화되지 않는다.
 */

const NOTICE_CATEGORIES = ["general", "update", "maintenance", "event"];

module.exports = {
  NOTICE_CATEGORIES,
};
