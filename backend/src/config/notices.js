/**
 * 공지사항(Notices) 상수.
 *
 * 공개 화면은 frontend/src/app/[locale]/(public)/notices/ 에 있다.
 * 카테고리 값을 바꾸면 프론트의
 * frontend/src/app/(dashboard)/notices/types.ts 의 NOTICE_CATEGORIES 도
 * 같이 고칠 것 — 값이 중복 정의돼 있어 자동 동기화되지 않는다.
 */

const NOTICE_CATEGORIES = ["general", "update", "maintenance", "event"];

module.exports = {
  NOTICE_CATEGORIES,
};
