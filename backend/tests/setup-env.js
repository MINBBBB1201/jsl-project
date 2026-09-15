/**
 * 테스트 환경변수 주입.
 *
 * jest.config.js 의 setupFiles 에 등록돼, 테스트 파일이 어떤 소스 모듈을
 * require 하기 전에 먼저 실행된다.
 *
 * config/config.js 는 MONGO_URI / JWT_SECRET 가 없으면 즉시 throw 한다.
 * 여기서 넣는 MONGO_URI 는 자리만 채우는 더미다 — 실제 연결은 helpers/db.js
 * 가 mongodb-memory-server 로 띄운 인스턴스에 직접 붙는다(config 의 값을 쓰지 않음).
 */
process.env.NODE_ENV = "test";
process.env.MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jsl-test-placeholder";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-only-secret-not-used-in-any-real-environment";
process.env.JWT_EXPIRES_IN = "1h";

// 스케줄러가 테스트 중에 뜨지 않도록 (server.js 를 require 하지 않으면 상관없지만 방어적으로).
process.env.ENABLE_AUTOMATION = "false";

/**
 * winston 출력을 끈다.
 *
 * 앱이 내는 정상 로그(예: 권한 부족 403 경고)가 테스트 리포트를 어지럽히고,
 * logs/*.log 파일에도 테스트 흔적이 쌓인다. logger 는 싱글턴이라 여기서 한 번
 * 조용히 만들면 이후 모든 require 가 같은 인스턴스를 받는다.
 * (env 를 위에서 먼저 세팅했으므로 config → logger require 가 안전하다)
 */
require("../src/utils/logger").transports.forEach((t) => {
  t.silent = true;
});
