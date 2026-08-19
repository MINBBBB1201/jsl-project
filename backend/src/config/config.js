require('dotenv').config();

if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI environment variable is required');
}

/**
 * JWT 서명 키.
 *
 * 기본값을 두지 않는다. 개발용 기본 키를 넣어 두면 그대로 배포됐을 때
 * 누구나 관리자 토큰을 위조할 수 있다. 없으면 서버가 아예 뜨지 않게 한다.
 * 생성: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
 */
if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is required (인증 토큰 서명 키). ' +
    'env.example 의 안내를 참고해 .env 에 설정하세요.'
  );
}

/**
 * CORS 허용 origin.
 *
 * ALLOWED_ORIGINS 에 콤마로 구분해 넣으면 아래 기본값을 대체한다.
 *   ALLOWED_ORIGINS=http://localhost:3000,https://jsl-project.vercel.app
 * 도메인이 바뀌면 코드 수정 없이 Render 환경변수만 고치면 된다.
 */
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',                                                  // 로컬 개발
  'https://jsl-project.vercel.app',                                         // 프로덕션
  'https://jsl-logistics-frontend-git-main-minbbbb1201s-projects.vercel.app', // git main 브랜치
];

/**
 * Vercel preview 배포는 커밋마다 URL이 새로 생겨서 목록으로 관리할 수 없다.
 * 프로젝트 이름으로 시작하는 vercel.app 서브도메인만 정규식으로 허용한다.
 */
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/jsl-logistics-frontend-.*\.vercel\.app$/,
];

const parseOrigins = (raw) =>
  (raw || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const configuredOrigins = parseOrigins(process.env.ALLOWED_ORIGINS);

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS,
  allowedOriginPatterns: ALLOWED_ORIGIN_PATTERNS,
  jwtSecret: process.env.JWT_SECRET,
  // 내부 업무 포털이라 근무일 하루 정도면 충분하다.
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  // Groq — OpenAI 호환 엔드포인트라 openai SDK에 baseURL만 바꿔 쓴다.
  //
  // 주의: Groq(api.groq.com, gsk_ 키)와 Grok/xAI(api.x.ai, xai- 키)는
  //       이름만 비슷한 다른 서비스다. 아래 baseURL과 키 종류를 맞춰야 한다.
  //       xAI로 바꾸려면 GROQ_BASE_URL=https://api.x.ai/v1 + xai- 키 + GROQ_MODEL=grok-3-mini
  //
  // 키가 없어도 서버는 뜨고, /api/chat 만 503으로 응답한다.
  groqApiKey: process.env.GROQ_API_KEY,
  groqBaseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  // llama-3.3-70b-versatile 은 Groq 가 서비스를 내려 404 가 난다 (챗봇이 통째로
  // 죽는 원인이었다). 계정에서 실제로 호출되는 모델로 바꿨다.
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  // 화물 파손 판정용 비전 모델.
  // Llama 4 Scout/Maverick 은 Groq 가 2026년에 서비스를 종료해 쓸 수 없다.
  // qwen3.6-27b 는 모델 목록에 vision 표기가 없지만 실제로 이미지를 읽는다(검증 완료).
  groqVisionModel: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b',
};
