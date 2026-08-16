/**
 * 화물 파손 판정 (v1 — 비전 LLM zero-shot)
 *
 * ── 접근 ───────────────────────────────────────────────────────────────
 * 실제 파손 사진 라벨링 데이터가 없어 자체 분류 모델을 학습시킬 수 없다.
 * 대신 비전 지원 LLM 에 사진과 판정 기준을 함께 보내 zero-shot 으로 판정한다.
 * 학습 데이터 0건으로도 지금 바로 동작하고, 커스텀 CV 모델의 학습·운영 비용이
 * 들지 않아 소규모 물류사에 현실적인 방식이다.
 *
 * 향후 실제 파손 사진 라벨링 데이터를 확보하면 자체 분류 모델로 정확도를
 * 개선할 수 있다. 그때 이 v1 이 성능 비교 기준선이 된다.
 *
 * ⚠️ 이 판정은 "1차 스크리닝 보조" 용도다. 오탐/미탐이 발생할 수 있으므로
 *    최종 파손 여부는 반드시 사람이 확인해야 한다.
 *
 * ── 모델 선택 ──────────────────────────────────────────────────────────
 * qwen/qwen3.6-27b (Groq). Llama 4 Scout/Maverick 은 Groq 가 2026년에
 * 서비스를 종료했다. qwen3.6 은 모델 목록에 vision 표기가 없지만 실제로
 * 이미지를 읽는 것을 확인했다.
 *
 * 주의점 두 가지:
 *   1) thinking 모델이라 <think>...</think> 블록에 토큰을 쓴다.
 *      max_tokens 를 넉넉히 주고, 파싱 전에 이 블록을 걷어내야 한다.
 *   2) TPM 8,000 제한. 사진 1장에 약 2,000토큰이라 분당 3~4장이 한계다.
 *      호출 전 리사이즈로 토큰을 줄이고, 순차 큐로 동시 호출을 막는다.
 */

const OpenAI = require('openai');
const sharp = require('sharp');
const { groqApiKey, groqBaseUrl, groqVisionModel } = require('../config/config');
const logger = require('./logger');

/** 리사이즈 목표 — 토큰 사용량을 줄이는 1차 수단 */
const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 70;

/**
 * thinking 블록까지 감안한 출력 상한.
 *
 * 실측: 판단이 쉬운 사진은 completion 650~1,150 토큰이면 끝나지만,
 * 애매한 사진은 thinking 이 길어져 2,000 에서 잘렸다(finish_reason=length).
 * 잘리면 JSON 이 안 나오므로 여유를 두고, 그래도 잘리면 더 늘려 재시도한다.
 */
const MAX_TOKENS = 3000;
const MAX_TOKENS_RETRY = 4500;

const DAMAGE_TYPES = ['찌그러짐', '파손', '젖음', '포장손상', '해당없음'];
const SEVERITIES = ['정상', '경미', '심각'];

/**
 * openai SDK 는 429 를 내부적으로 재시도한다(기본 maxRetries=2).
 * 그래서 TPM 을 넘겨도 에러 대신 응답이 한참 늦게 오는 형태가 된다.
 * 실측: 5장을 연달아 올리면 마지막 건이 약 3분까지 걸렸다.
 *
 * 무한정 기다리게 두면 사용자는 원인을 알 수 없으므로 상한을 둔다.
 * 여기서 걸리면 429 가 그대로 올라와 "잠시 후 다시 시도" 안내로 이어진다.
 */
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_RETRIES = 1;

let client = null;
const getClient = () => {
  if (!client) {
    client = new OpenAI({
      apiKey: groqApiKey,
      baseURL: groqBaseUrl,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: MAX_RETRIES,
    });
  }
  return client;
};

const SYSTEM_PROMPT = [
  '당신은 물류회사의 화물 검수 담당자입니다.',
  '첨부된 화물/포장 사진을 보고 파손 여부를 판정합니다.',
  '',
  '다음 항목을 순서대로 확인하세요:',
  '1. 모서리와 모퉁이가 눌리거나 찌그러졌는가',
  '2. 면에 깊은 주름, 접힘, 눌린 자국이 있는가',
  '3. 찢어짐, 구멍, 내용물 노출이 있는가',
  '4. 젖음, 얼룩, 변색이 있는가',
  '5. 테이프 뜯김, 봉인 훼손, 포장 벌어짐이 있는가',
  '',
  '반드시 아래 JSON 형식으로만 답하세요. 코드블록이나 설명을 덧붙이지 마세요.',
  '{',
  '  "isDamaged": boolean,',
  '  "damageType": "찌그러짐" | "파손" | "젖음" | "포장손상" | "해당없음",',
  '  "severity": "정상" | "경미" | "심각",',
  '  "description": "한국어로 2문장 이내 설명",',
  '  "confidence": 0.0~1.0',
  '}',
  '',
  '규칙:',
  '- 화물이나 포장이 찍힌 사진이 아니거나 판단이 불가능하면 isDamaged 를 false,',
  '  damageType 을 "해당없음", severity 를 "정상" 으로 하고 description 에 이유를 적으세요.',
  '- 손상이 없으면 damageType 은 "해당없음", severity 는 "정상" 입니다.',
  '- 확신이 낮으면 confidence 를 낮게 주세요. 추측으로 단정하지 마세요.',
  '- description 에는 사진에서 실제로 보이는 근거만 적으세요.',
  '',
  '추론은 짧게 하고 바로 JSON 을 출력하세요. 길게 고민하지 마세요.',
].join('\n');

/**
 * 업로드 이미지를 리사이즈/압축한다.
 * 원본을 그대로 보내면 토큰을 크게 낭비하고 TPM 제한에 바로 걸린다.
 *
 * @param {Buffer} buffer 원본 이미지
 * @returns {Promise<{buffer: Buffer, width: number, height: number, bytes: number}>}
 */
const prepareImage = async (buffer) => {
  const image = sharp(buffer, { failOn: 'error' });
  const metadata = await image.metadata();

  const resized = await image
    .rotate() // EXIF 방향 보정 (휴대폰 사진이 눕는 것 방지)
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  const outMeta = await sharp(resized).metadata();

  return {
    buffer: resized,
    width: outMeta.width,
    height: outMeta.height,
    bytes: resized.length,
    originalWidth: metadata.width,
    originalHeight: metadata.height,
    originalBytes: buffer.length,
  };
};

/**
 * thinking 블록을 걷어내고 JSON 을 뽑는다.
 * 모델이 코드블록으로 감싸거나 앞뒤에 말을 붙이는 경우까지 감안한다.
 */
const extractJson = (raw) => {
  if (!raw) return null;

  // 1) <think>...</think> 제거. 닫는 태그 없이 잘린 경우도 처리한다.
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '');
  if (/<think>/i.test(text)) {
    text = text.replace(/<think>[\s\S]*$/i, '');
  }

  // 2) ```json ... ``` 코드블록 벗기기
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1];

  // 3) 가장 바깥 중괄호 구간만 취한다
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
};

/** 모델이 형식을 어겨도 저장 가능한 형태로 정규화한다 */
const normalizeResult = (parsed) => {
  const damageType = DAMAGE_TYPES.includes(parsed.damageType)
    ? parsed.damageType
    : '해당없음';
  const severity = SEVERITIES.includes(parsed.severity) ? parsed.severity : '정상';

  let confidence = Number(parsed.confidence);
  if (!Number.isFinite(confidence)) confidence = 0;
  confidence = Math.min(1, Math.max(0, confidence));

  const isDamaged = Boolean(parsed.isDamaged);

  return {
    isDamaged,
    // 파손이 아니라고 했는데 유형이 붙어 있으면 앞뒤가 안 맞으므로 정리한다
    damageType: isDamaged ? damageType : '해당없음',
    severity: isDamaged ? (severity === '정상' ? '경미' : severity) : '정상',
    description: String(parsed.description ?? '').slice(0, 500),
    confidence,
  };
};

/**
 * Groq 비전 모델을 호출해 원본 응답 문자열을 받는다.
 */
const callVisionModel = async (jpegBuffer, maxTokens = MAX_TOKENS) => {
  const dataUri = `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`;

  const completion = await getClient().chat.completions.create({
    model: groqVisionModel,
    max_tokens: maxTokens,
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: SYSTEM_PROMPT },
          { type: 'image_url', image_url: { url: dataUri } },
        ],
      },
    ],
  });

  return {
    raw: completion.choices?.[0]?.message?.content ?? '',
    finishReason: completion.choices?.[0]?.finish_reason,
    usage: completion.usage,
    model: completion.model || groqVisionModel,
  };
};

/**
 * 이미지 한 장을 판정한다. JSON 파싱에 실패하면 1회 재시도한다.
 *
 * @param {Buffer} imageBuffer 원본 업로드 이미지
 * @returns {Promise<{result: object, image: object, meta: object}>}
 * @throws {Error} status 프로퍼티가 붙은 에러 (429 등 상위에서 구분용)
 */
const inspectDamage = async (imageBuffer) => {
  const image = await prepareImage(imageBuffer);

  let lastRaw = '';
  let lastFinish = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    // temperature 0 이라 같은 조건으로 재시도하면 같은 결과가 나온다.
    // 첫 시도가 길이 초과로 잘렸으면 상한을 올려서 다시 부른다.
    const budget = attempt === 1 || lastFinish !== 'length' ? MAX_TOKENS : MAX_TOKENS_RETRY;

    const { raw, finishReason, usage, model } = await callVisionModel(image.buffer, budget);
    lastRaw = raw;
    lastFinish = finishReason;

    const parsed = extractJson(raw);
    if (parsed) {
      return {
        result: normalizeResult(parsed),
        image,
        meta: {
          model,
          attempts: attempt,
          finishReason,
          usage,
          method: 'vision-llm-zero-shot-v1',
        },
      };
    }

    logger.warn(
      `파손 판정 JSON 파싱 실패 (attempt ${attempt}/2, finish=${finishReason}): ${raw.slice(0, 200)}`
    );
  }

  // thinking 에서 토큰이 소진돼 최종 답변이 안 나온 경우가 대표적이다
  const error = new Error(
    lastFinish === 'length'
      ? '모델이 답변을 끝내지 못했습니다. (thinking 토큰 초과)'
      : '모델 응답에서 판정 결과를 읽지 못했습니다.'
  );
  error.code = 'PARSE_FAILED';
  error.rawSample = lastRaw.slice(0, 300);
  throw error;
};

/**
 * 순차 처리 큐.
 *
 * TPM 8,000 제한이라 동시에 여러 장을 보내면 바로 429 가 난다.
 * 복잡한 큐 시스템 대신 프로미스 체인으로 한 번에 1건씩만 처리한다.
 */
let chain = Promise.resolve();
let pending = 0;

const enqueue = (task) => {
  pending += 1;
  const run = chain.then(task, task);
  // 앞 작업의 실패가 뒤 작업을 막지 않도록 체인은 항상 resolve 로 잇는다
  chain = run.then(
    () => undefined,
    () => undefined
  );
  return run.finally(() => {
    pending -= 1;
  });
};

const getPendingCount = () => pending;

module.exports = {
  inspectDamage,
  enqueue,
  getPendingCount,
  prepareImage,
  extractJson,
  normalizeResult,
  DAMAGE_TYPES,
  SEVERITIES,
  MAX_DIMENSION,
  JPEG_QUALITY,
};
