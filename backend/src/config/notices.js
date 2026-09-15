/**
 * 공지사항(Notices) 상수.
 *
 * 프론트(공개 사이트 푸터의 "공지사항" 링크가 가리킬 목록/상세 화면)는 아직 없다
 * — UI/UX 재설계 작업과 함께 나중에 만들어진다. 그 화면이 이 값을 그대로 써야
 * 하므로, 프론트 쪽에 생기면 trade-documents 의 선례처럼 이 목록을 그대로
 * 복제해 동기화할 것.
 */

const NOTICE_CATEGORIES = ["general", "update", "maintenance", "event"];

module.exports = {
  NOTICE_CATEGORIES,
};
