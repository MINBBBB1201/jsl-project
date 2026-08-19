const KnowledgeDoc = require('../models/knowledge.model');

const TOP_K = 3;

// 약한 매치(한 토큰만 우연히 걸린 경우)를 컨텍스트에서 제외하기 위한 임계값.
// MongoDB textScore는 매치된 항의 가중치 합이라 질의 길이에 따라 커진다.
// 그래서 절대 하한 + 최고점 대비 상대 비율을 함께 쓴다.
const MIN_SCORE = 3.0;
const RELATIVE_SCORE_RATIO = 0.25;

/**
 * 한국어 조사/어미 목록.
 *
 * MongoDB text index는 한국어 형태소 분석을 지원하지 않아서
 * "통관은"과 "통관"을 다른 토큰으로 본다. 완전한 형태소 분석 대신
 * 흔한 조사/어미만 잘라낸 변형을 검색어에 함께 넣어 재현율을 올린다.
 * (제대로 하려면 형태소 분석기나 임베딩 기반 검색이 필요하다.)
 */
const KOREAN_SUFFIXES = [
  // 어미 (질문/서술형)
  '해야', '입니까', '인가요', '하나요', '되나요', '합니까', '습니다', '합니다',
  '됩니다', '알려줘', '해줘', '되면', '하면', '하는', '하고', '려면', '세요',
  '나요', '까요', '한다',
  // 조사
  '에서', '으로', '까지', '부터', '에게', '한테', '이나', '라도',
  '은', '는', '이', '가', '을', '를', '의', '에', '로', '와', '과',
  '도', '만', '된', '한', '들'
].sort((a, b) => b.length - a.length); // 긴 것부터 제거

const stripSuffix = (token) => {
  for (const suffix of KOREAN_SUFFIXES) {
    if (token.length > suffix.length + 1 && token.endsWith(suffix)) {
      return token.slice(0, -suffix.length);
    }
  }
  return token;
};

const tokenize = (query) =>
  query
    .split(/[\s,.?!·:;()[\]"'~]+/)
    .filter(Boolean);

/**
 * 원본 토큰 + 조사/어미를 제거한 변형을 모두 포함한 검색어를 만든다.
 * $text 는 공백으로 구분된 항들을 OR 로 검색한다.
 */
const expandQuery = (query) => {
  const terms = new Set();
  for (const token of tokenize(query)) {
    terms.add(token);
    const stripped = stripSuffix(token);
    if (stripped.length >= 2) terms.add(stripped);
  }
  return Array.from(terms).join(' ');
};

/**
 * MongoDB $text 검색으로 관련 문서 상위 TOP_K개를 찾는다.
 * $text 가 0건이면 토큰 regex 검색으로 폴백한다.
 *
 * @returns {{docs: Array, strategy: 'text-index'|'regex-fallback'|'none'}}
 */
const retrieveDocs = async (query, category) => {
  /*
    샘플 문서는 검색 대상에서 뺀다.

    지어낸 수치와 가짜 연락처("통관팀 내선 000-0000")를 담고 있어서, 실제 절차
    문서와 함께 컨텍스트에 들어가면 LLM 이 둘을 구분하지 못하고 한 답변 안에
    섞어 내놓는다. 문서는 지우지 않고 플래그로만 가린다 (knowledge.model.js).

    $ne: true 로 쓴다 — 플래그가 생기기 전에 들어간 문서에는 필드 자체가 없고,
    { isSample: false } 로 걸면 그런 문서가 통째로 검색에서 사라진다.
  */
  const baseFilter = { isSample: { $ne: true }, ...(category ? { category } : {}) };
  const projection = { score: { $meta: 'textScore' }, title: 1, content: 1, category: 1 };

  // 1차: $text 검색 (textScore 내림차순)
  const textResults = await KnowledgeDoc.find(
    { ...baseFilter, $text: { $search: expandQuery(query) } },
    projection
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(TOP_K)
    .lean();

  if (textResults.length > 0) {
    const topScore = textResults[0].score;
    // 절대 하한은 긴 질문에서 우연히 한 단어만 걸린 문서를 걸러내기 위한 것이다.
    // "파손" 같은 짧은 질의는 매치 자체가 의도적이므로 하한을 적용하지 않는다.
    const floor = tokenize(query).length >= 3 ? MIN_SCORE : 0;
    const relevant = textResults.filter(
      d => d.score >= floor && d.score >= topScore * RELATIVE_SCORE_RATIO
    );
    if (relevant.length > 0) {
      return { docs: relevant, strategy: 'text-index' };
    }
    // 매치는 있었지만 전부 임계값 미만 → 무관한 질문으로 간주
    return { docs: [], strategy: 'none' };
  }

  // 2차 폴백: 2글자 이상 토큰으로 regex OR 검색
  const tokens = tokenize(query)
    .map(stripSuffix)
    .filter(t => t.length >= 2)
    .slice(0, 8);

  if (tokens.length === 0) {
    return { docs: [], strategy: 'none' };
  }

  const pattern = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regexResults = await KnowledgeDoc.find(
    {
      ...baseFilter,
      $or: [
        { title: { $regex: pattern, $options: 'i' } },
        { content: { $regex: pattern, $options: 'i' } }
      ]
    },
    { title: 1, content: 1, category: 1 }
  )
    .limit(TOP_K)
    .lean();

  return {
    docs: regexResults,
    strategy: regexResults.length > 0 ? 'regex-fallback' : 'none'
  };
};

module.exports = { retrieveDocs, expandQuery, stripSuffix, TOP_K, MIN_SCORE };
