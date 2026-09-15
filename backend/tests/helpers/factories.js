/**
 * 테스트 픽스처.
 *
 * 실제 모델과 실제 토큰 발급 유틸을 쓴다 — 컨트롤러가 보는 것과 같은 문서·같은
 * 인증 흐름을 재현해야 PII 경계 검증이 의미가 있다.
 */
const User = require("../../src/models/user.model");
const { signToken } = require("../../src/utils/jwt");

let seq = 0;

/**
 * 직원 계정 하나를 만들고 Bearer 토큰을 함께 돌려준다.
 * requireAuth 가 payload.sub 로 User 를 다시 읽으므로 DB 에 실제로 저장한다.
 */
async function createUser(overrides = {}) {
  seq += 1;
  const user = await User.create({
    email: overrides.email || `staff${seq}@jsl-test.local`,
    password: overrides.password || "test-password-1234",
    name: overrides.name || `Staff ${seq}`,
    role: overrides.role || "sales",
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
  });
  return { user, token: signToken(user) };
}

const point = (lng, lat, address) => ({
  type: "Point",
  coordinates: [lng, lat],
  address,
});

/**
 * 화물 하나. customer(개인정보)와 items 를 항상 채운다 — 목록/상세 응답에서
 * 이 필드가 빠지는지/들어오는지가 검증 대상이다.
 */
async function createShipment(overrides = {}) {
  const mongoose = require("mongoose");
  const Shipment = mongoose.model("Shipment");
  seq += 1;

  return Shipment.create({
    trackingNumber:
      overrides.trackingNumber || `JSL-TEST-${String(seq).padStart(5, "0")}`,
    origin: point(126.97, 37.56, "Seoul, KR"),
    destination: point(139.69, 35.68, "Tokyo, JP"),
    currentLocation: point(128.0, 36.0, "In transit"),
    status: overrides.status || "in_transit",
    estimatedDelivery:
      overrides.estimatedDelivery || new Date(Date.now() + 5 * 864e5),
    transportMode: overrides.transportMode || "SEA",
    shippedAt: overrides.shippedAt || new Date(Date.now() - 2 * 864e5),
    customer: overrides.customer || {
      name: "Hong Gil-dong",
      email: "hong@customer-test.local",
      phone: "+82-10-0000-0000",
    },
    items: overrides.items || [
      { description: "Sample goods", quantity: 3, weight: 12 },
    ],
  });
}

module.exports = { createUser, createShipment };
