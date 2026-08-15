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
