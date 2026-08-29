import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { computeCenterOfGravity, CENTER_OF_GRAVITY_TOLERANCE_PERCENT } from "../center-of-gravity"
import { CONTAINER_SPECS } from "../containers"
import type { CargoBoxInput, PlacedBox } from "../types"

/**
 * 무게중심 검증 — 전부 손으로 풀 수 있는 예제로 짰다.
 *
 * 이 숫자가 틀리면 실무자가 "무게중심 정상"이라는 화면을 믿고 편심 적재한
 * 컨테이너를 내보내게 된다. 그래서 라이브러리 결과를 그대로 믿지 않고
 * 기대값을 주석에 수기 계산 과정까지 적어 두었다.
 */

/** 테스트용 박스 인스턴스를 만든다. 크기·위치·중량만 의미가 있다 */
function placedBox(
  id: string,
  positionCm: [number, number, number],
  sizeCm: [number, number, number],
  weightKg: number
): PlacedBox {
  const box: CargoBoxInput = {
    id,
    name: id,
    lengthCm: sizeCm[0],
    widthCm: sizeCm[1],
    heightCm: sizeCm[2],
    weightKg,
    quantity: 1,
  }
  return {
    instanceId: `${id}#1`,
    boxId: id,
    box,
    positionCm,
    sizeCm,
    orientation: "LWH",
    weightKg,
  }
}

/** 부동소수 비교 — cm 단위라 1/1000 cm 면 충분히 엄격하다 */
function assertClose(actual: number, expected: number, message: string): void {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `${message}: 기대 ${expected}, 실제 ${actual}`
  )
}

describe("computeCenterOfGravity", () => {
  const c20 = CONTAINER_SPECS["20FT_DRY"]
  // 20FT 내치수 589.8 × 235.2 × 239.3 → 기하중심 (294.9, 117.6, 119.65)

  it("박스 2개, 중량이 같으면 무게중심은 두 박스 중심의 정확한 중점이다", () => {
    // 박스 A: 위치 (0, 0, 0), 크기 100×100×100, 중량 1000kg
    //   → 중심 (50, 50, 50)
    // 박스 B: 위치 (400, 0, 0), 크기 100×100×100, 중량 1000kg
    //   → 중심 (450, 50, 50)
    //
    // 수기 계산:
    //   x = (1000×50 + 1000×450) / 2000 = 500000/2000 = 250
    //   y = (1000×50 + 1000×50)  / 2000 = 100000/2000 = 50
    //   z = 위와 동일 = 50
    const placed = [
      placedBox("A", [0, 0, 0], [100, 100, 100], 1000),
      placedBox("B", [400, 0, 0], [100, 100, 100], 1000),
    ]

    const cog = computeCenterOfGravity(c20, placed)

    assertClose(cog.positionCm[0], 250, "x 무게중심")
    assertClose(cog.positionCm[1], 50, "y 무게중심")
    assertClose(cog.positionCm[2], 50, "z 무게중심")

    // 치우침: 컨테이너 기하중심 (294.9, 117.6, 119.65) 대비
    //   x: 250 - 294.9   = -44.9
    //   y: 50  - 117.6   = -67.6
    //   z: 50  - 119.65  = -69.65
    assertClose(cog.offsetCm[0], -44.9, "x 치우침(cm)")
    assertClose(cog.offsetCm[1], -67.6, "y 치우침(cm)")
    assertClose(cog.offsetCm[2], -69.65, "z 치우침(cm)")

    // 비율: 치우침 / 해당 축 내치수 × 100
    //   x: -44.9 / 589.8 × 100 = -7.6127...%
    //   y: -67.6 / 235.2 × 100 = -28.7414...%
    assertClose(cog.offsetPercent[0], (-44.9 / 589.8) * 100, "x 치우침(%)")
    assertClose(cog.offsetPercent[1], (-67.6 / 235.2) * 100, "y 치우침(%)")

    // x 는 7.6% 로 10% 이내지만 y 가 28.7% 라 판정은 불합격이어야 한다.
    assert.equal(cog.withinTolerance, false, "y 편심이 커서 불합격이어야 한다")
  })

  it("중량이 다르면 무거운 쪽으로 끌려간다 (3:1 지렛대)", () => {
    // 박스 A: 중심 x=50,  중량 3000kg
    // 박스 B: 중심 x=450, 중량 1000kg
    //
    // 수기 계산:
    //   x = (3000×50 + 1000×450) / 4000
    //     = (150000 + 450000) / 4000
    //     = 600000 / 4000 = 150
    //
    // 지렛대로 검산: 두 중심 간 거리 400. 무게비 3:1 이므로 무게중심은
    // A 에서 400 × (1/4) = 100 만큼 떨어진 지점 → 50 + 100 = 150. 일치한다.
    const placed = [
      placedBox("A", [0, 0, 0], [100, 100, 100], 3000),
      placedBox("B", [400, 0, 0], [100, 100, 100], 1000),
    ]

    const cog = computeCenterOfGravity(c20, placed)
    assertClose(cog.positionCm[0], 150, "x 무게중심")
  })

  it("컨테이너 정중앙에 대칭으로 실으면 치우침 0, 판정 합격", () => {
    // 20FT 기하중심 (294.9, 117.6, 119.65).
    // 같은 중량 두 박스를 x 축으로 기하중심 기준 ±100 대칭이 되게 놓는다.
    //   A 중심 x = 194.9  → 위치 x = 194.9 - 50 = 144.9
    //   B 중심 x = 394.9  → 위치 x = 394.9 - 50 = 344.9
    //   평균 x = (194.9 + 394.9)/2 = 294.9 = 기하중심 ✓
    // y·z 도 기하중심에 맞춘다.
    //   y 중심 117.6 → 위치 y = 117.6 - 50 = 67.6
    //   z 중심 119.65 → 위치 z = 119.65 - 50 = 69.65
    const placed = [
      placedBox("A", [144.9, 67.6, 69.65], [100, 100, 100], 1000),
      placedBox("B", [344.9, 67.6, 69.65], [100, 100, 100], 1000),
    ]

    const cog = computeCenterOfGravity(c20, placed)

    assertClose(cog.offsetCm[0], 0, "x 치우침")
    assertClose(cog.offsetCm[1], 0, "y 치우침")
    assertClose(cog.offsetCm[2], 0, "z 치우침")
    assert.equal(cog.withinTolerance, true)
  })

  it("높이(z) 편심은 판정에 넣지 않는다 — 바닥에 깔면 당연히 아래로 쏠린다", () => {
    // 바닥에 낮게 깐 화물 하나. x·y 는 기하중심에 맞추고 z 만 크게 치우치게 한다.
    //   중심 x = 294.9 → 위치 294.9 - 50 = 244.9
    //   중심 y = 117.6 → 위치 117.6 - 50 = 67.6
    //   중심 z = 5     (바닥에 놓인 높이 10 짜리)
    //   z 치우침 = 5 - 119.65 = -114.65 → -114.65/239.3 = -47.9%
    const placed = [placedBox("A", [244.9, 67.6, 0], [100, 100, 10], 1000)]

    const cog = computeCenterOfGravity(c20, placed)

    assertClose(cog.offsetCm[2], -114.65, "z 치우침")
    assert.ok(Math.abs(cog.offsetPercent[2]) > CENTER_OF_GRAVITY_TOLERANCE_PERCENT)
    assert.equal(cog.withinTolerance, true, "z 는 판정 대상이 아니므로 합격")
  })

  it("허용치 경계 — 40FT 길이 1203.2cm 의 정확히 10% 지점은 합격", () => {
    const c40 = CONTAINER_SPECS["40FT_DRY"]
    // 40FT 기하중심 x = 601.6. 허용 한계는 601.6 ± 120.32.
    // 박스 중심을 정확히 601.6 + 120.32 = 721.92 에 두면 10.00% 로 경계값이다.
    //   크기 100 이므로 위치 x = 721.92 - 50 = 671.92
    // y·z 는 기하중심에 맞춰 x 만 보게 한다.
    const placed = [
      placedBox("A", [671.92, 235.2 / 2 - 50, 0], [100, 100, 100], 1000),
    ]

    const cog = computeCenterOfGravity(c40, placed)

    assertClose(cog.offsetCm[0], 120.32, "x 치우침(cm)")
    assertClose(cog.offsetPercent[0], 10, "x 치우침(%)")
    assert.equal(cog.withinTolerance, true, "경계값(정확히 10%)은 합격")
  })

  it("화물이 없으면 기하중심을 돌려주고 합격 처리한다", () => {
    const cog = computeCenterOfGravity(c20, [])

    assertClose(cog.positionCm[0], 589.8 / 2, "빈 컨테이너 x")
    assertClose(cog.positionCm[1], 235.2 / 2, "빈 컨테이너 y")
    assertClose(cog.positionCm[2], 239.3 / 2, "빈 컨테이너 z")
    assertClose(cog.offsetCm[0], 0, "빈 컨테이너 치우침")
    assert.equal(cog.withinTolerance, true)
  })

  it("중량 0인 화물만 있어도 0으로 나누지 않는다", () => {
    const placed = [placedBox("A", [0, 0, 0], [100, 100, 100], 0)]
    const cog = computeCenterOfGravity(c20, placed)

    assertClose(cog.positionCm[0], 589.8 / 2, "기하중심으로 폴백")
    assert.equal(Number.isNaN(cog.offsetPercent[0]), false, "NaN 이 새면 안 된다")
  })
})
