require('dotenv').config();

if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI environment variable is required');
}

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  nodeEnv: process.env.NODE_ENV || 'development',
  // Groq — OpenAI 호환 엔드포인트라 openai SDK에 baseURL만 바꿔 쓴다.
  //
  // 주의: Groq(api.groq.com, gsk_ 키)와 Grok/xAI(api.x.ai, xai- 키)는
  //       이름만 비슷한 다른 서비스다. 아래 baseURL과 키 종류를 맞춰야 한다.
  //       xAI로 바꾸려면 GROQ_BASE_URL=https://api.x.ai/v1 + xai- 키 + GROQ_MODEL=grok-3-mini
  //
  // 키가 없어도 서버는 뜨고, /api/chat 만 503으로 응답한다.
  groqApiKey: process.env.GROQ_API_KEY,
  groqBaseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
};
