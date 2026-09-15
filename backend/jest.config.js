/**
 * Jest 설정.
 *
 * 지금까지 백엔드 테스트는 순수 함수(utils/*.test.js)만 있었고 설정 파일이
 * 없어도 기본값으로 돌았다. 컨트롤러/라우트 레벨 테스트(HTTP + Mongo)를
 * 붙이면서 다음 두 가지가 필요해져 설정을 명시한다.
 *
 *  1. setupFiles — config/config.js 가 require 시점에 MONGO_URI / JWT_SECRET
 *     이 없으면 throw 한다. 테스트용 더미 값을 어떤 모듈보다 먼저 넣어야 한다.
 *  2. testTimeout — mongodb-memory-server 가 첫 실행에서 mongod 바이너리를
 *     내려받고 띄우는 데 기본 5초로는 부족하다.
 */
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setup-env.js"],
  // utils 의 순수 함수 테스트와 tests/ 의 통합 테스트를 모두 잡는다 (기본값과 동일).
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  // 헬퍼는 테스트 파일이 아니다.
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/tests/helpers/"],
  testTimeout: 30000,
};
