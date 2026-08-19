const mongoose = require('mongoose');

const KNOWLEDGE_CATEGORIES = ['customs', 'sop', 'faq'];

const knowledgeDocSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: KNOWLEDGE_CATEGORIES,
    index: true
  },
  /**
   * 플레이스홀더 샘플 문서 표시.
   *
   * true 인 문서는 RAG 검색에서 제외된다(knowledge-retrieval.js). 지어낸
   * 수치와 가짜 연락처("통관팀 내선 000-0000")가 실제 절차 문서 답변에
   * 섞여 들어가는 것을 막기 위해서다.
   *
   * 지우지 않고 남겨 두는 이유: 어느 카테고리에 실제 문서가 아직 없는지
   * 파악하는 참고용이다. 실제 문서로 교체할 때 이 플래그를 떼면 된다.
   */
  isSample: {
    type: Boolean,
    default: false,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// RAG 검색용 text index.
// title에 가중치를 더 줘서 제목이 맞는 문서가 상위로 오도록 한다.
// 주의: MongoDB는 컬렉션당 text index를 1개만 허용한다.
knowledgeDocSchema.index(
  { title: 'text', content: 'text' },
  {
    name: 'knowledge_text_idx',
    weights: { title: 10, content: 5 },
    default_language: 'none' // 한국어는 지원 언어가 아니므로 어간 추출/불용어 처리를 끈다
  }
);

const KnowledgeDoc = mongoose.model('KnowledgeDoc', knowledgeDocSchema);

module.exports = KnowledgeDoc;
module.exports.KNOWLEDGE_CATEGORIES = KNOWLEDGE_CATEGORIES;
