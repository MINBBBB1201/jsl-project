const mongoose = require('mongoose');

/**
 * 원자적 시퀀스 카운터.
 *
 * 무역서류 번호(CI-2026-0042 …)를 issue 시점에 하나씩 발급하는 데 쓴다.
 * "기존 문서 수 + 1" 방식은 두 요청이 동시에 들어오면 같은 번호가 나온다.
 * findOneAndUpdate 의 $inc 는 단일 문서 원자 연산이라 그 경합이 없다.
 *
 * _id 예: "CI-2026", "PL-2026", "PI-2026" (종류·연도별로 따로 증가, 연초 리셋).
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 },
});

/**
 * key 의 다음 시퀀스를 원자적으로 얻는다. 없으면 만들어서 1 부터 시작.
 * @param {string} key
 * @returns {Promise<number>}
 */
counterSchema.statics.next = async function next(key) {
  const doc = await this.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
