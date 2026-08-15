const OpenAI = require('openai');
const KnowledgeDoc = require('../models/knowledge.model');
const { retrieveDocs } = require('../utils/knowledge-retrieval');
const { groqApiKey, groqBaseUrl, groqModel } = require('../config/config');
const logger = require('../utils/logger');

const MAX_CONTEXT_CHARS = 4000; // 문서당 컨텍스트 상한

// Groq는 OpenAI 호환 엔드포인트라 openai SDK에 baseURL만 바꿔서 쓴다.
let client = null;
const getClient = () => {
  if (!client) {
    client = new OpenAI({ apiKey: groqApiKey, baseURL: groqBaseUrl });
  }
  return client;
};

const buildSystemPrompt = (docs) => {
  const context = docs
    .map((d, i) => `[문서 ${i + 1}] 제목: ${d.title}\n분류: ${d.category}\n내용:\n${d.content.slice(0, MAX_CONTEXT_CHARS)}`)
    .join('\n\n---\n\n');

  return [
    '당신은 JSL Logistics의 사내 업무 지원 챗봇입니다.',
    '아래 <사내문서> 안의 내용만 근거로 삼아 한국어로 답변하세요.',
    '',
    '규칙:',
    '- 문서에 없는 내용은 지어내지 말고, "사내 문서에서 관련 내용을 찾지 못했습니다"라고 답하세요.',
    '- 답변에 사용한 문서의 제목을 마지막에 "참고: [문서 제목]" 형태로 밝히세요.',
    '- 수치(기한, 금액 등)는 문서에 적힌 값을 그대로 인용하세요.',
    '- 문서는 샘플/플레이스홀더 데이터일 수 있으므로, 법적 효력이 있는 최종 판단은 담당 부서 확인이 필요하다고 안내하세요.',
    '',
    '<사내문서>',
    context || '(관련 문서 없음)',
    '</사내문서>'
  ].join('\n');
};

// POST /api/chat
exports.chat = async (req, res) => {
  try {
    const { message, category, history } = req.body;

    if (!groqApiKey) {
      return res.status(503).json({
        success: false,
        error: 'GROQ_API_KEY가 설정되지 않았습니다. backend/.env 에 키를 추가해 주세요.'
      });
    }

    // (a) MongoDB $text 검색으로 관련 문서 검색
    const { docs, strategy } = await retrieveDocs(message, category);
    logger.info(`Chat retrieval: "${message.slice(0, 50)}" → ${docs.length} docs (${strategy})`);

    // (b) 검색 결과를 컨텍스트로 넣어 LLM 호출
    const messages = [
      { role: 'system', content: buildSystemPrompt(docs) },
      // 직전 대화 몇 턴을 함께 전달 (선택)
      ...(Array.isArray(history) ? history.slice(-6).map(h => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: String(h.content).slice(0, 2000)
      })) : []),
      { role: 'user', content: message }
    ];

    const completion = await getClient().chat.completions.create({
      model: groqModel,
      messages,
      temperature: 0.2,
      max_tokens: 1000
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() || '';

    // (c) 응답 반환 — 어떤 문서를 근거로 삼았는지도 함께 내려준다
    res.status(200).json({
      success: true,
      data: {
        answer,
        model: completion.model || groqModel,
        retrieval: {
          strategy,
          count: docs.length
        },
        sources: docs.map(d => ({
          id: d._id,
          title: d.title,
          category: d.category,
          excerpt: d.content.slice(0, 200)
        }))
      }
    });
  } catch (error) {
    logger.error('Chat error:', error);

    // OpenAI SDK 오류는 status를 그대로 전달해 원인 파악을 쉽게 한다
    if (error.status) {
      return res.status(error.status === 401 || error.status === 400 ? 502 : error.status).json({
        success: false,
        error: `LLM API 호출 실패 (${error.status})`,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    res.status(500).json({
      success: false,
      error: '챗봇 응답 생성에 실패했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/chat/categories — 좌측 카테고리 목록 + 문서 수
exports.getCategories = async (req, res) => {
  try {
    const counts = await KnowledgeDoc.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: counts.map(c => ({ category: c._id, count: c.count }))
    });
  } catch (error) {
    logger.error('Error fetching knowledge categories:', error);
    res.status(500).json({ success: false, error: '카테고리 조회에 실패했습니다.' });
  }
};
