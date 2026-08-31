/**
 * 3D 컨테이너 적재 계산기 — 계산 엔진.
 *
 * 순수 로직만 있다. React·three.js 는 들어오지 않는다(다음 단계).
 *
 *   import { planLoad, CONTAINER_SPECS } from "@/lib/container-planner"
 *
 *   const plan = planLoad(CONTAINER_SPECS["40FT_HC"], [
 *     { id: "A", name: "전자부품 박스", lengthCm: 120, widthCm: 80, heightCm: 100,
 *       weightKg: 300, quantity: 40 },
 *   ])
 */

export {
  CONTAINER_SPECS,
  CONTAINER_TYPE_IDS,
  containerVolumeM3,
  type ContainerSpec,
  type ContainerTypeId,
} from "./containers"

export {
  IDENTITY_ORIENTATION,
  UPRIGHT_ORIENTATIONS,
  type CargoBoxInput,
  type CenterOfGravity,
  type LoadPlan,
  type Orientation,
  type PlacedBox,
  type UnplacedCargo,
  type UnplacedReason,
} from "./types"

export {
  CENTER_OF_GRAVITY_TOLERANCE_PERCENT,
  computeCenterOfGravity,
} from "./center-of-gravity"

export { MIN_SUPPORT_RATIO } from "./packer"

export { planLoad } from "./plan-load"
