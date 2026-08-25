import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { CONTAINER_SPECS } from "../containers"
import { expandAndSort } from "../packer"
import { planLoad } from "../plan-load"
import type { CargoBoxInput, PlacedBox } from "../types"
import { assertNothingAboveNonStackable, assertPhysicallyValid } from "./assertions"

/**
 * 배치 제약 검증.
 *
 * binpackingjs 가 못 지켜 주던 두 가지 — 지지면(중력)과 적재 불가 —
 * 그리고 회전 금지가 실제로 걸리는지를 본다.
 */

const c20 = CONTAINER_SPECS["20FT_DRY"]

function box(overrides: Partial<CargoBoxInput> & { id: string }): CargoBoxInput {
  return {
    name: overrides.id,
    lengthCm: 100,
    widthCm: 100,
    heightCm: 100,
    weightKg: 10,
    quantity: 1,
    ...overrides,
  }
}

describe("배치 제약", () => {
  it("모든 박스가 컨테이너 안에 있고 서로 겹치지 않는다", () => {
    const plan = planLoad(c20, [
      box({ id: "A", lengthCm: 120, widthCm: 80, heightCm: 75, weightKg: 50, quantity: 30 }),
      box({ id: "B", lengthCm: 60, widthCm: 40, heightCm: 40, weightKg: 12, quantity: 40 }),
    ])

    assert.ok(plan.placed.length > 0, "하나는 실려야 한다")
    assertPhysicallyValid(plan)
  })

  it("공중부양이 없다 — binpackingjs 가 못 막던 바로 그 상황", () => {
    // 좁은 기둥 하나 + 넓은 판 하나. 지지면 검사가 없으면 판이 기둥 위에
    // 걸쳐 떠 버린다(격리 테스트에서 실제로 그렇게 나왔다).
    const plan = planLoad(c20, [
      box({ id: "pillar", lengthCm: 40, widthCm: 40, heightCm: 150, weightKg: 100, quantity: 1 }),
      box({ id: "plank", lengthCm: 200, widthCm: 200, heightCm: 10, weightKg: 80, quantity: 1 }),
    ])

    assertPhysicallyValid(plan)

    const plank = plan.placed.find((b) => b.boxId === "plank")
    assert.ok(plank, "판은 실려야 한다")
    // 기둥 위(z=150)에 얹히면 안 되고, 바닥에 놓여야 한다.
    assert.equal(plank.positionCm[2], 0, "판은 바닥에 놓여야 한다")
  })

  it("적재 불가 화물 위에는 아무것도 안 쌓는다", () => {
    const plan = planLoad(c20, [
      box({
        id: "fragile",
        lengthCm: 200,
        widthCm: 200,
        heightCm: 50,
        weightKg: 200,
        quantity: 1,
        stackable: false,
      }),
      box({ id: "normal", lengthCm: 100, widthCm: 100, heightCm: 50, weightKg: 40, quantity: 20 }),
    ])

    assertPhysicallyValid(plan)
    assertNothingAboveNonStackable(plan)

    const fragile = plan.placed.find((b) => b.boxId === "fragile")
    assert.ok(fragile, "파손위험 화물도 실려야 한다")
  })

  it("적재 불가 화물은 배치 순서에서 맨 뒤로 밀린다", () => {
    // 적재 불가 화물을 먼저 깔면 그 위 천장까지가 통째로 죽는다. 그래서 정렬에서
    // 뒤로 민다 — 부피가 훨씬 커도 뒤여야 한다.
    //
    // ⚠️ "그러니 항상 짐 맨 위에 올라간다"까지는 단언하지 않는다. 실제로 돌려 보면
    //    남은 자투리 폭에 눕혀 들어가면서 바닥에 놓이기도 하는데, 그건 공간을 더 잘
    //    쓴 것이지 규칙 위반이 아니다. 지켜야 하는 건 "위에 아무것도 없다" 쪽이고
    //    그건 assertNothingAboveNonStackable 이 본다.
    const huge = box({
      id: "huge",
      lengthCm: 200,
      widthCm: 200,
      heightCm: 200,
      weightKg: 500,
      quantity: 2,
      stackable: false,
    })
    const small = box({
      id: "small",
      lengthCm: 50,
      widthCm: 50,
      heightCm: 50,
      weightKg: 10,
      quantity: 3,
    })

    const order = expandAndSort([huge, small]).map((i) => i.box.id)
    assert.deepEqual(order, ["small", "small", "small", "huge", "huge"])
  })

  it("적재 불가 화물도 자투리 공간을 쓸 수 있다 (위만 안 막으면 된다)", () => {
    const plan = planLoad(c20, [
      box({ id: "base", lengthCm: 100, widthCm: 100, heightCm: 100, weightKg: 100, quantity: 12 }),
      box({
        id: "top",
        lengthCm: 100,
        widthCm: 100,
        heightCm: 30,
        weightKg: 30,
        quantity: 2,
        stackable: false,
      }),
    ])

    assertPhysicallyValid(plan)
    assert.equal(plan.unplaced.length, 0, "14개 전부 들어가야 한다")
  })

  it("회전 금지 화물은 입력한 자세 그대로만 놓인다", () => {
    const plan = planLoad(c20, [
      box({
        id: "fixed",
        lengthCm: 120,
        widthCm: 80,
        heightCm: 60,
        weightKg: 40,
        quantity: 15,
        rotatable: false,
      }),
    ])

    assert.ok(plan.placed.length > 0)
    for (const b of plan.placed) {
      assert.equal(b.orientation, "LWH", `${b.instanceId} 가 회전됐다`)
      assert.deepEqual([...b.sizeCm], [120, 80, 60])
    }
  })

  it("회전을 허용하면 세로로는 안 들어가는 화물도 눕혀서 싣는다", () => {
    // 20FT 내부 높이 239.3cm. 높이 300cm 는 세워서 못 넣지만,
    // 눕히면 길이 방향(589.8cm)으로 들어간다.
    const tall = box({
      id: "tall",
      lengthCm: 100,
      widthCm: 100,
      heightCm: 300,
      weightKg: 200,
      quantity: 1,
    })

    const rotatable = planLoad(c20, [tall])
    const locked = planLoad(c20, [{ ...tall, rotatable: false }])

    assert.equal(rotatable.placed.length, 1, "회전 허용이면 눕혀서 실려야 한다")
    assert.notEqual(rotatable.placed[0].orientation, "LWH", "실제로 돌아가야 한다")
    assert.equal(rotatable.placed[0].sizeCm[2], 100, "높이 방향이 100 으로 바뀌어야")

    assert.equal(locked.placed.length, 0, "회전 금지면 못 싣는다")
    assert.equal(locked.unplaced[0].reason, "OVERSIZED")
  })

  it("같은 입력이면 항상 같은 결과가 나온다 (결정적)", () => {
    const cargo: CargoBoxInput[] = [
      box({ id: "A", lengthCm: 110, widthCm: 90, heightCm: 70, weightKg: 55, quantity: 25 }),
      box({ id: "B", lengthCm: 50, widthCm: 50, heightCm: 50, weightKg: 15, quantity: 30 }),
    ]
    const first = planLoad(c20, cargo)
    const second = planLoad(c20, cargo)

    const key = (b: PlacedBox) => `${b.instanceId}@${b.positionCm.join(",")}/${b.orientation}`
    assert.deepEqual(first.placed.map(key), second.placed.map(key))
  })

  it("잘못된 입력은 조용히 넘어가지 않고 에러를 낸다", () => {
    assert.throws(() => planLoad(c20, [box({ id: "A", lengthCm: 0 })]), /치수/)
    assert.throws(() => planLoad(c20, [box({ id: "A", weightKg: -1 })]), /중량/)
    assert.throws(() => planLoad(c20, [box({ id: "A", quantity: 1.5 })]), /수량/)
    assert.throws(
      () => planLoad(c20, [box({ id: "dup" }), box({ id: "dup" })]),
      /중복/
    )
  })

  it("수량 0 인 화물은 결과에 아예 안 나온다", () => {
    const plan = planLoad(c20, [box({ id: "none", quantity: 0 })])
    assert.equal(plan.placed.length, 0)
    assert.equal(plan.unplaced.length, 0)
  })
})
