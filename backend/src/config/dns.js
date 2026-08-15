/**
 * DNS 리졸버 오버라이드 (프로젝트 범위 한정)
 *
 * ── 왜 필요한가 ────────────────────────────────────────────────────────
 * 일부 로컬 개발 PC에서 Node 가 시스템 DNS 를 127.0.0.1 로 잡는데, 그 주소에서
 * 아무것도 응답하지 않아 모든 DNS 조회가 ECONNREFUSED 로 실패한다.
 * (보안/필터링 프로그램이 로컬 DNS 프록시를 걸어두고 꺼진 경우 등)
 *
 * 그러면 mongodb+srv:// URI 의 SRV 조회가 막혀 서버가 아예 뜨지 못한다:
 *   MongoDB Atlas connection error: querySrv ECONNREFUSED _mongodb._tcp...
 *
 * Windows 리졸버 자체는 정상이라 브라우저 등 다른 프로그램은 멀쩡하다.
 * 시스템 DNS 설정을 바꾸면 그 로컬 DNS 프록시를 쓰는 다른 프로그램이
 * 오작동할 수 있으므로, 이 프로세스 안에서만 리졸버를 지정한다.
 *
 * ── 왜 환경변수로 열어두는가 ────────────────────────────────────────────
 * 무조건 8.8.8.8 로 고정하면 배포 환경까지 영향을 받는다:
 *   - Render 의 private service / 내부 호스트명은 공용 리졸버로 못 찾는다.
 *   - docker-compose 는 서비스명을 임베디드 DNS(127.0.0.11)로 해석하는데,
 *     이 파일의 docker-compose.yml 은 env_file 로 .env(NODE_ENV=development)를
 *     그대로 읽으므로 컨테이너 안에서도 오버라이드가 걸려버린다.
 *   - 외부 DNS(UDP 53) egress 가 막힌 환경에서는 되레 전체가 죽는다.
 *
 * 그래서 DNS_SERVERS 가 설정된 환경에서만 동작한다.
 * 미설정이면 아무것도 하지 않으므로 Render/Docker 는 영향을 받지 않는다.
 *
 * ── 사용법 ─────────────────────────────────────────────────────────────
 * 문제가 있는 로컬 PC 의 backend/.env 에만 추가:
 *   DNS_SERVERS=8.8.8.8,1.1.1.1
 *
 * ⚠️ 이 모듈은 mongoose 연결보다 먼저 실행되어야 한다.
 *    src/server.js 와 DB 에 붙는 스크립트의 최상단에서 require 한다.
 */

// DNS_SERVERS 를 읽으려면 dotenv 가 먼저 로드돼야 한다.
// config.js 에서도 호출하지만 dotenv 는 이미 설정된 값을 덮어쓰지 않는다.
require('dotenv').config();

const dns = require('dns');

const parseServers = (raw) =>
  (raw || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

const servers = parseServers(process.env.DNS_SERVERS);

if (servers.length > 0) {
  dns.setServers(servers);
  // logger 는 이 시점에 불러오면 순환 참조 위험이 있어 console 을 쓴다.
  console.log(`[dns] 리졸버를 ${servers.join(', ')} 로 지정 (DNS_SERVERS)`);
}

module.exports = { appliedServers: servers };
