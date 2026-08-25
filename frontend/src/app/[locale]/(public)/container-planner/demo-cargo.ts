import {
  CONTAINER_SPECS,
  planLoad,
  type CargoBoxInput,
  type LoadPlan,
} from "@/lib/container-planner"

/**
 * 뷰어 확인용 임시 화물 목록.
 *
 * ⚠️ 3단계에서 화물 입력 폼이 붙으면 이 파일은 통째로 사라진다. 지금은 폼도
 *    상태 관리도 없이 "뷰어가 눈으로 봤을 때 말이 되는가"만 확인하는 단계라
 *    1단계 유닛 테스트의 정상 시나리오를 그대로 옮겨 왔다.
 *
 *    __tests__ 에서 import 하지 않고 값을 복사한 이유: 테스트 파일은 프로덕션
 *    번들에 들어가면 안 되고, 테스트가 시나리오 수치를 바꾸면 화면이 조용히
 *    따라 바뀌는 것도 곤란하다. 두 곳이 갈라져도 지금은 문제가 되지 않는다 —
 *    어차피 곧 지울 파일이다.
 *
 * 기대값(1단계 테스트 기준): 40FT HC 에 181개 적재, 적재율 72.67%,
 * 무게중심 길이 -6.2% · 폭 -7.74% 로 ±10% 합격, 목상자 5개는 NO_SPACE.
 */
export const DEMO_CONTAINER = CONTAINER_SPECS["40FT_HC"]

export const DEMO_CARGO: CargoBoxInput[] = [
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

/**
 * 모듈 로드 시점에 한 번만 계산한다.
 *
 * planLoad 는 순수 함수라 같은 입력이면 항상 같은 결과가 나온다(1단계에서
 * 결정성을 테스트로 못박아 뒀다). 컴포넌트 안에서 부르면 마운트할 때마다
 * 181개를 다시 배치하게 되므로 여기서 끝내 둔다.
 */
export const DEMO_PLAN: LoadPlan = planLoad(DEMO_CONTAINER, DEMO_CARGO)
