import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  ORIENTATION_AXES,
  ORIENTATION_ORDER,
  allowedOrientations,
  cmToMm,
  orientedSize,
} from "../geometry"
import { IDENTITY_ORIENTATION, UPRIGHT_ORIENTATIONS, type CargoBoxInput } from "../types"

const base: CargoBoxInput = {
  id: "X",
  name: "X",
  lengthCm: 120,
  widthCm: 80,
  heightCm: 60,
  weightKg: 10,
  quantity: 1,
}

describe("방향(orientation)", () => {
  it("시도 순서에 6방향이 빠짐없이 한 번씩 들어 있다", () => {
    // ORIENTATION_ORDER 를 세워둔 자세 + 눕힌 자세로 쪼개 만들었으므로,
    // 한쪽을 고치다 중복·누락이 생기면 여기서 잡힌다.
    assert.equal(ORIENTATION_ORDER.length, 6)
    assert.equal(new Set(ORIENTATION_ORDER).size, 6, "중복이 있다")
    assert.deepEqual(
      [...ORIENTATION_ORDER].sort(),
      Object.keys(ORIENTATION_AXES).sort(),
      "ORIENTATION_AXES 와 목록이 다르다"
    )
  })

  it("세워 둔 자세가 시도 순서 맨 앞에 온다", () => {
    assert.deepEqual(
      ORIENTATION_ORDER.slice(0, UPRIGHT_ORIENTATIONS.length),
      [...UPRIGHT_ORIENTATIONS]
    )
  })

  it("세워 둔 자세는 원본 높이가 z축에 그대로 남는다", () => {
    for (const o of UPRIGHT_ORIENTATIONS) {
      const size = orientedSize([120, 80, 60], o)
      assert.equal(size[2], 60, `${o} 가 높이를 z축에 두지 않았다`)
    }
  })

  it("6방향 모두 부피가 보존된다", () => {
    for (const o of ORIENTATION_ORDER) {
      const [dx, dy, dz] = orientedSize([120, 80, 60], o)
      assert.equal(dx * dy * dz, 120 * 80 * 60, `${o} 에서 부피가 바뀌었다`)
    }
  })

  it("기본 자세는 입력한 치수 그대로다", () => {
    assert.deepEqual(orientedSize([120, 80, 60], IDENTITY_ORIENTATION), [120, 80, 60])
  })

  it("rotatable 을 생략하면 6방향 전부 허용한다", () => {
    assert.equal(allowedOrientations(base).length, 6)
    assert.equal(allowedOrientations({ ...base, rotatable: true }).length, 6)
  })

  it("rotatable: false 면 기본 자세 하나만 허용한다", () => {
    assert.deepEqual(allowedOrientations({ ...base, rotatable: false }), [
      IDENTITY_ORIENTATION,
    ])
  })
})

describe("단위 변환", () => {
  it("cm 소수를 mm 정수로 반올림한다", () => {
    assert.equal(cmToMm(120), 1200)
    assert.equal(cmToMm(120.3), 1203)
    assert.equal(cmToMm(589.8), 5898)
    // mm 미만은 화물 실무에서 의미가 없으므로 반올림해 버린다.
    assert.equal(cmToMm(33.33), 333)
    assert.ok(Number.isInteger(cmToMm(2.352 * 100)), "항상 정수여야 한다")
  })
})
