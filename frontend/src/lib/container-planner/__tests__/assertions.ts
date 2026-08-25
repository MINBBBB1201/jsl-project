import assert from "node:assert/strict"

import { MIN_SUPPORT_RATIO } from "../packer"
import type { CargoBoxInput, LoadPlan } from "../types"

/**
 * 여러 테스트 파일이 함께 쓰는 검증 헬퍼.
 *
 * ⚠️ 파일명을 *.test.ts 로 두면 안 된다. node --test 는 테스트 파일마다 별도
 *    프로세스를 띄우는데, 테스트 파일이 다른 테스트 파일을 import 하면 거기
 *    describe 들이 양쪽 프로세스에서 각각 등록돼 같은 테스트가 두 번 돈다.
 *    그래서 공용 헬퍼는 테스트가 아닌 모듈로 뺀다.
 */

/** 컨테이너 벽을 뚫고 나간 박스가 없는지 */
function assertInsideContainer(plan: LoadPlan): void {
  const inner = [
    plan.container.innerLengthCm,
    plan.container.innerWidthCm,
    plan.container.innerHeightCm,
  ]
  for (const b of plan.placed) {
    for (let axis = 0; axis < 3; axis++) {
      assert.ok(b.positionCm[axis] >= 0, `${b.instanceId} 축${axis} 가 음수 좌표`)
      assert.ok(
        b.positionCm[axis] + b.sizeCm[axis] <= inner[axis] + 1e-9,
        `${b.instanceId} 가 축${axis} 로 컨테이너를 뚫고 나갔다`
      )
    }
  }
}

/** 어떤 박스도 서로 파고들지 않았는지 */
function assertNoOverlap(plan: LoadPlan): void {
  const p = plan.placed
  for (let i = 0; i < p.length; i++) {
    for (let j = i + 1; j < p.length; j++) {
      const a = p[i]
      const b = p[j]
      const collides = [0, 1, 2].every(
        (axis) =>
          a.positionCm[axis] < b.positionCm[axis] + b.sizeCm[axis] &&
          b.positionCm[axis] < a.positionCm[axis] + a.sizeCm[axis]
      )
      assert.ok(!collides, `${a.instanceId} 와 ${b.instanceId} 가 겹친다`)
    }
  }
}

/** 공중부양한 박스가 없는지 — 바닥이거나, 밑면의 MIN_SUPPORT_RATIO 이상이 받쳐져야 한다 */
function assertNoFloating(plan: LoadPlan): void {
  for (const b of plan.placed) {
    if (b.positionCm[2] === 0) continue

    const baseArea = b.sizeCm[0] * b.sizeCm[1]
    let supported = 0

    for (const other of plan.placed) {
      if (other === b) continue
      const otherTop = other.positionCm[2] + other.sizeCm[2]
      if (Math.abs(otherTop - b.positionCm[2]) > 1e-9) continue

      const ox = Math.max(
        0,
        Math.min(b.positionCm[0] + b.sizeCm[0], other.positionCm[0] + other.sizeCm[0]) -
          Math.max(b.positionCm[0], other.positionCm[0])
      )
      const oy = Math.max(
        0,
        Math.min(b.positionCm[1] + b.sizeCm[1], other.positionCm[1] + other.sizeCm[1]) -
          Math.max(b.positionCm[1], other.positionCm[1])
      )
      supported += ox * oy
    }

    const ratio = supported / baseArea
    assert.ok(
      ratio >= MIN_SUPPORT_RATIO - 1e-9,
      `${b.instanceId} 가 z=${b.positionCm[2]} 에서 지지율 ${(ratio * 100).toFixed(1)}% 로 떠 있다`
    )
  }
}

/** 적재 불가 화물 위에 아무것도 없는지 */
export function assertNothingAboveNonStackable(plan: LoadPlan): void {
  const blockers = plan.placed.filter((b) => b.box.stackable === false)
  for (const blocker of blockers) {
    const top = blocker.positionCm[2] + blocker.sizeCm[2]
    for (const other of plan.placed) {
      if (other === blocker) continue
      const overlapX =
        blocker.positionCm[0] < other.positionCm[0] + other.sizeCm[0] &&
        other.positionCm[0] < blocker.positionCm[0] + blocker.sizeCm[0]
      const overlapY =
        blocker.positionCm[1] < other.positionCm[1] + other.sizeCm[1] &&
        other.positionCm[1] < blocker.positionCm[1] + blocker.sizeCm[1]
      if (overlapX && overlapY) {
        assert.ok(
          other.positionCm[2] < top - 1e-9,
          `${other.instanceId} 가 적재 불가 화물 ${blocker.instanceId} 위에 올라갔다`
        )
      }
    }
  }
}

/** 모든 적재 계획이 항상 만족해야 하는 물리 조건 */
export function assertPhysicallyValid(plan: LoadPlan): void {
  assertInsideContainer(plan)
  assertNoOverlap(plan)
  assertNoFloating(plan)
  assertNothingAboveNonStackable(plan)
}

/** 입력 수량 합계 = 적재 + 미적재 여야 한다 (화물이 증발하거나 복제되면 안 된다) */
export function assertNothingLost(
  plan: LoadPlan,
  cargo: readonly CargoBoxInput[]
): void {
  const expected = cargo.reduce((sum, c) => sum + c.quantity, 0)
  const actual = plan.placed.length + unplacedCount(plan)
  assert.equal(actual, expected, `수량이 안 맞는다: 입력 ${expected}, 결과 ${actual}`)
}

/** 미적재 개수를 사유별로 합산 */
export function unplacedCount(plan: LoadPlan, reason?: string): number {
  return plan.unplaced
    .filter((u) => reason === undefined || u.reason === reason)
    .reduce((sum, u) => sum + u.quantity, 0)
}
