import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { CONTAINER_SPECS } from "../containers"
import { planLoad } from "../plan-load"
import type { CargoBoxInput, LoadPlan } from "../types"
import { assertNothingLost, assertPhysicallyValid, unplacedCount } from "./assertions"

/**
 * 실무 시나리오 3종 — 정상 / 중량초과 / 공간부족.
 *
 * UI 가 아직 없으니 이 테스트의 콘솔 출력이 곧 검수 리포트다.
 * 숫자가 말이 되는지 눈으로 볼 수 있게 요약을 찍는다.
 */

function report(title: string, plan: LoadPlan): void {
  const cog = plan.centerOfGravity
  const lines = [
    ``,
    `── ${title} ─ ${plan.container.label}`,
    `   적재      ${plan.placed.length}개`,
    `   적재율    ${plan.volumeUtilizationPercent}%  (${plan.usedVolumeM3} / ${plan.containerVolumeM3} ㎥)`,
    `   중량      ${plan.totalWeightKg} / ${plan.maxPayloadKg} kg  (${plan.weightUtilizationPercent}%)`,
    `   의뢰중량  ${plan.requestedWeightKg} kg  → 한 대로 중량초과=${plan.overweight}`,
    `   무게중심  길이 ${cog.offsetPercent[0]}% · 폭 ${cog.offsetPercent[1]}% · 높이 ${cog.offsetPercent[2]}%` +
      `  → 기준 ±${cog.tolerancePercent}% ${cog.withinTolerance ? "합격" : "불합격"}`,
  ]
  if (plan.unplaced.length > 0) {
    lines.push(`   미적재`)
    for (const u of plan.unplaced) {
      lines.push(`     - ${u.box.name} ${u.quantity}개 (${u.reason})`)
    }
  } else {
    lines.push(`   미적재    없음`)
  }
  console.log(lines.join("\n"))
}

describe("시나리오 1 — 정상: 여러 규격이 섞인 일반 혼재 화물", () => {
  // 40FT HC 에 파렛트 화물 + 소형 카톤 + 파손위험 화물을 섞어, 컨테이너가
  // 실제로 차는 물량으로 싣는다.
  const cargo: CargoBoxInput[] = [
    {
      id: "PLT-A",
      name: "표준 파렛트 화물",
      lengthCm: 120,
      widthCm: 100,
      heightCm: 110,
      weightKg: 420,
      quantity: 30,
    },
    {
      id: "CTN-B",
      name: "소형 카톤",
      lengthCm: 60,
      widthCm: 40,
      heightCm: 40,
      weightKg: 25,
      quantity: 150,
    },
    {
      id: "CRT-C",
      name: "정밀장비 목상자(적재불가)",
      lengthCm: 150,
      widthCm: 110,
      heightCm: 90,
      weightKg: 400,
      quantity: 6,
      stackable: false,
    },
  ]

  const plan = planLoad(CONTAINER_SPECS["40FT_HC"], cargo)

  it("결과를 출력한다", () => {
    report("시나리오 1 정상", plan)
  })

  it("물리적으로 성립하는 배치다", () => {
    assertPhysicallyValid(plan)
  })

  it("화물 수량이 증발하거나 복제되지 않는다", () => {
    assertNothingLost(plan, cargo)
  })

  it("중량 상한 안이고 초과 플래그가 서지 않는다", () => {
    assert.ok(plan.totalWeightKg <= plan.maxPayloadKg)
    assert.equal(plan.overweight, false, "의뢰 물량 전체가 상한 안이다")
  })

  it("혼재 화물 적재율이 실무 수준으로 나온다 (70% 이상)", () => {
    // 규격이 제각각인 혼재 화물은 아무리 잘 채워도 빈틈이 생긴다.
    // 상용 도구들도 이런 조합에서 70% 안팎이 나온다.
    assert.ok(
      plan.volumeUtilizationPercent >= 70,
      `적재율 ${plan.volumeUtilizationPercent}% — 너무 낮다`
    )
    assert.ok(plan.volumeUtilizationPercent <= 100, "적재율이 100%를 넘을 수는 없다")
  })

  it("대부분 실린다 (95% 이상)", () => {
    const total = cargo.reduce((s, c) => s + c.quantity, 0)
    assert.ok(
      plan.placed.length / total >= 0.95,
      `${plan.placed.length}/${total} 만 실렸다`
    )
  })

  it("무게중심이 길이·폭 방향 허용치 안에 든다", () => {
    assert.ok(
      Math.abs(plan.centerOfGravity.offsetPercent[0]) <= 10,
      `길이 방향 편심 ${plan.centerOfGravity.offsetPercent[0]}%`
    )
    assert.equal(plan.centerOfGravity.withinTolerance, true)
  })
})

describe("적재 밀도 — 이론 최대치에 닿는지", () => {
  // 무게중심 경고가 "항상 뜨는 장식"이 아니라는 것과, 배치가 공간을 실제로
  // 다 쓴다는 것을 각각 못 박아 둔다.

  it("컨테이너에 딱 떨어지는 치수면 100% 가까이 채운다", () => {
    // 40HC 1203.2 × 235.2 × 269.8 을 10 × 2 × 2 로 정확히 쪼갠 치수.
    const plan = planLoad(CONTAINER_SPECS["40FT_HC"], [
      {
        id: "FIT",
        name: "딱 맞는 화물",
        lengthCm: 120.32,
        widthCm: 117.6,
        heightCm: 134.9,
        weightKg: 50,
        quantity: 40,
      },
    ])

    assert.equal(plan.placed.length, 40, "40개가 빈틈없이 들어가야 한다")
    assert.ok(
      plan.volumeUtilizationPercent > 99.9,
      `적재율 ${plan.volumeUtilizationPercent}% — 딱 맞는 치수인데 못 채웠다`
    )
    assertPhysicallyValid(plan)
  })

  it("균일한 정육면체는 이론상 최대 개수만큼 들어간다", () => {
    // 100cm 정육면체를 40HC 에 넣을 때의 상한:
    //   floor(1203.2/100) × floor(235.2/100) × floor(269.8/100) = 12 × 2 × 2 = 48개
    const plan = planLoad(CONTAINER_SPECS["40FT_HC"], [
      {
        id: "CUBE",
        name: "정육면체",
        lengthCm: 100,
        widthCm: 100,
        heightCm: 100,
        weightKg: 10,
        quantity: 200,
      },
    ])

    assert.equal(plan.placed.length, 48, "이론 최대 48개를 채워야 한다")
    assertPhysicallyValid(plan)
  })
})

describe("무게중심 경고 — 실제로 뜰 때만 뜬다", () => {
  it("컨테이너가 절반만 차면 앞쪽으로 쏠려 경고가 뜬다", () => {
    // 40HC 에 물량이 적으면 안쪽 끝부터 채우는 특성상 앞이 무거워진다.
    // 이건 배치 버그가 아니라 실제로 편심 적재라서, 경고가 떠야 맞다.
    const plan = planLoad(CONTAINER_SPECS["40FT_HC"], [
      {
        id: "PLT-A",
        name: "표준 파렛트 화물",
        lengthCm: 120,
        widthCm: 100,
        heightCm: 110,
        weightKg: 420,
        quantity: 18,
      },
    ])

    assert.equal(plan.unplaced.length, 0, "물량 자체는 다 들어간다")
    assert.ok(
      plan.centerOfGravity.offsetPercent[0] < -10,
      `길이 방향으로 앞쪽에 쏠려야 한다 (실제 ${plan.centerOfGravity.offsetPercent[0]}%)`
    )
    assert.equal(plan.centerOfGravity.withinTolerance, false, "경고가 떠야 한다")
  })
})

describe("시나리오 2 — 중량초과: 부피는 남는데 무게가 먼저 찬다", () => {
  // 20FT 최대적재 28,180kg. 개당 1,200kg 짜리 30개 = 36,000kg 를 넣어 본다.
  // 부피로는 다 들어가지만 중량이 먼저 걸려야 한다.
  const cargo: CargoBoxInput[] = [
    {
      id: "STEEL",
      name: "강재 번들",
      lengthCm: 100,
      widthCm: 80,
      heightCm: 60,
      weightKg: 1200,
      quantity: 30,
    },
  ]

  const container = CONTAINER_SPECS["20FT_DRY"]
  const plan = planLoad(container, cargo)

  it("결과를 출력한다", () => {
    report("시나리오 2 중량초과", plan)
  })

  it("물리적으로 성립하는 배치다", () => {
    assertPhysicallyValid(plan)
  })

  it("화물 수량이 증발하거나 복제되지 않는다", () => {
    assertNothingLost(plan, cargo)
  })

  it("중량 상한을 넘겨서 싣지 않는다", () => {
    // 28,180 / 1,200 = 23.48 → 23개까지만 실을 수 있다 (23개 = 27,600kg,
    // 24개면 28,800kg 로 상한 초과).
    assert.equal(plan.placed.length, 23, "23개까지만 실려야 한다")
    assert.equal(plan.totalWeightKg, 27600)
    assert.ok(plan.totalWeightKg <= plan.maxPayloadKg, "실은 중량은 상한 안이어야 한다")
    // 의뢰 물량은 1,200 × 30 = 36,000kg 로 상한(28,180kg)을 넘는다.
    // overweight 는 "실은 중량"이 아니라 "의뢰 중량" 기준이라 여기서 true 여야 한다.
    assert.equal(plan.requestedWeightKg, 36000)
    assert.equal(plan.overweight, true, "한 대로는 중량초과라고 알려 줘야 한다")
  })

  it("나머지는 WEIGHT_LIMIT 사유로 미적재 처리된다", () => {
    assert.equal(unplacedCount(plan, "WEIGHT_LIMIT"), 7)
    assert.equal(unplacedCount(plan), 7, "다른 사유로 빠진 건 없어야 한다")
  })

  it("부피는 아직 남아 있다 — 무게가 먼저 찼다는 증거", () => {
    assert.ok(
      plan.volumeUtilizationPercent < plan.weightUtilizationPercent,
      `적재율 ${plan.volumeUtilizationPercent}% vs 중량 사용률 ${plan.weightUtilizationPercent}%`
    )
    assert.ok(plan.weightUtilizationPercent > 95, "중량은 거의 가득 차야 한다")
  })
})

describe("시나리오 3 — 공간부족: 아예 다 안 들어간다", () => {
  // 20FT 에 가벼운 대형 부피화물을 잔뜩. 무게는 여유롭지만 공간이 모자란다.
  const cargo: CargoBoxInput[] = [
    {
      id: "FOAM",
      name: "단열재 대형 번들",
      lengthCm: 200,
      widthCm: 110,
      heightCm: 110,
      weightKg: 45,
      quantity: 40,
    },
  ]

  const container = CONTAINER_SPECS["20FT_DRY"]
  const plan = planLoad(container, cargo)

  it("결과를 출력한다", () => {
    report("시나리오 3 공간부족", plan)
  })

  it("물리적으로 성립하는 배치다", () => {
    assertPhysicallyValid(plan)
  })

  it("화물 수량이 증발하거나 복제되지 않는다", () => {
    assertNothingLost(plan, cargo)
  })

  it("공간이 모자라 못 실은 물량이 NO_SPACE 로 잡힌다", () => {
    assert.ok(plan.placed.length > 0, "일부는 실려야 한다")
    assert.ok(plan.placed.length < 40, "40개가 다 들어가면 시나리오가 성립 안 한다")
    assert.equal(unplacedCount(plan, "NO_SPACE"), 40 - plan.placed.length)
    assert.equal(unplacedCount(plan, "WEIGHT_LIMIT"), 0, "중량 때문은 아니어야 한다")
  })

  it("중량은 한참 여유롭다 — 공간이 먼저 찼다는 증거", () => {
    assert.ok(
      plan.weightUtilizationPercent < 10,
      `중량 사용률 ${plan.weightUtilizationPercent}% — 이 시나리오는 가벼워야 한다`
    )
    assert.equal(plan.overweight, false, "의뢰 물량 전체가 상한 안이다")
  })
})

describe("시나리오 3-b — 컨테이너보다 큰 화물은 OVERSIZED 로 구분한다", () => {
  // 공간부족(NO_SPACE)과 애초에 안 들어감(OVERSIZED)은 실무 대응이 다르다.
  // 전자는 컨테이너를 하나 더 잡으면 되고, 후자는 컨테이너 타입 자체를 바꾸거나
  // 벌크/특수 장비로 가야 한다. 그래서 사유를 갈라 둔다.
  const cargo: CargoBoxInput[] = [
    {
      id: "HUGE",
      name: "초과길이 화물",
      lengthCm: 700,
      widthCm: 200,
      heightCm: 200,
      weightKg: 500,
      quantity: 2,
    },
    {
      id: "OK",
      name: "일반 카톤",
      lengthCm: 100,
      widthCm: 100,
      heightCm: 100,
      weightKg: 50,
      quantity: 5,
    },
  ]

  const plan = planLoad(CONTAINER_SPECS["20FT_DRY"], cargo)

  it("결과를 출력한다", () => {
    report("시나리오 3-b 규격초과", plan)
  })

  it("700cm 화물은 OVERSIZED, 나머지는 정상 적재", () => {
    // 20FT 내부 길이 589.8cm < 700cm 이므로 어떤 방향으로 돌려도 안 들어간다.
    const huge = plan.unplaced.find((u) => u.boxId === "HUGE")
    assert.ok(huge, "초과길이 화물이 미적재로 잡혀야 한다")
    assert.equal(huge.reason, "OVERSIZED")
    assert.equal(huge.quantity, 2)

    assert.equal(plan.placed.length, 5, "나머지 5개는 정상 적재")
    assertNothingLost(plan, cargo)
    assertPhysicallyValid(plan)
  })
})
