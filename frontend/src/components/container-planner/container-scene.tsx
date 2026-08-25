"use client"

import { useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { Edges, OrbitControls } from "@react-three/drei"

import { useBrandColors } from "@/lib/brand-colors"
import type { ContainerSpec, PlacedBox } from "@/lib/container-planner"

/**
 * 컨테이너 적재 3D 뷰어 (react-three-fiber)
 *
 * 1단계 planLoad() 가 낸 LoadPlan 을 그대로 그린다. 계산은 하지 않는다 —
 * 박스가 떠 있거나 겹쳐 보인다면 그건 이 파일이 아니라 패커를 봐야 한다는 뜻이다.
 *
 * ⚠️ 이 파일은 container-viewer.tsx 가 next/dynamic 으로만 불러온다.
 *    직접 import 하면 three.js 가 초기 번들에 통째로 실린다.
 *
 * ══ 좌표계 매핑 — 축을 헷갈리면 컨테이너가 옆으로 누워 그려진다 ══════════
 *
 * LoadPlan 은 Z-up 이고 three.js 는 Y-up 이라 그대로 넘기면 안 된다.
 *
 *   LoadPlan (lib/container-planner/types.ts)   three.js
 *   ─────────────────────────────────────────   ────────────────────────
 *   x = 길이 (0 = 안쪽 끝 벽 → 도어 쪽)          x = 길이   (그대로)
 *   y = 폭   (0 = 왼쪽 벽)                       z = 폭     (부호 반전)
 *   z = 높이 (0 = 바닥, 위로)                    y = 높이   (위로, 동일)
 *
 *   즉  three(x, y, z) = plan(x, z, -y)
 *
 * ⚠️ 폭에 붙은 마이너스를 빼면 안 된다. plan(x,y,z) → three(x,z,y) 로 두 축을
 *    그냥 맞바꾸면 행렬식이 -1 이라 좌우가 뒤집힌 거울상이 된다. 축이 다 맞아
 *    보여서 눈으로는 잘 안 잡히는데, 3단계에서 "도어에서 봤을 때 왼쪽"을
 *    말하기 시작하면 좌우가 반대로 나온다. -y 로 두면 행렬식이 +1 인 회전이라
 *    LoadPlan 의 좌우가 그대로 보존된다.
 *
 * 여기에 더해 컨테이너 중심이 원점에 오도록 각 축에서 내치수의 절반을 뺀다.
 * OrbitControls 가 원점을 중심으로 도므로, 이렇게 해야 컨테이너 한가운데를
 * 축으로 회전한다.
 *
 * ══ 단위 ═══════════════════════════════════════════════════════════════
 * LoadPlan 은 cm 다. 40FT 면 1203cm 라 그대로 쓰면 씬 스케일이 너무 커진다.
 * 100 으로 나눠 m 단위로 그린다 (40HC = 12.03 × 2.70 × 2.35).
 */

/** cm → three.js 씬 단위(m) */
const CM_TO_SCENE = 0.01

/**
 * 화물 타입별 색을 이 순서로 돌려 쓴다.
 *
 * 오렌지 두 톤을 붙여 두지 않았다 — 인접한 화물끼리 색이 비슷하면 경계가
 * 안 보인다. 네이비 → 오렌지 → 슬레이트 → 오렌지딥 순으로 명도가 번갈아 간다.
 */
const PALETTE_ORDER = ["navy", "orange", "slate", "orangeDeep"] as const

/** 박스 하나가 씬에서 차지할 위치와 크기 (단위: m) */
interface BoxTransform {
  key: string
  /** 박스 중심 [x, y, z] — three.js 기준 */
  position: [number, number, number]
  /** 축별 크기 [dx, dy, dz] — three.js 기준 */
  size: [number, number, number]
  color: string
  /** 이 박스 위에 그릴 모서리 선 색 */
  edgeColor: string
}

/**
 * 박스 색 위에서 잘 보이는 모서리 선 색을 고른다.
 *
 * ⚠️ 모서리 색을 하나로 고정하면 반드시 어딘가에서 사라진다. 브랜드 네이비는
 *    아주 어두워서 네이비 박스에 네이비 선을 그으면 아무것도 안 보이고, 그러면
 *    파렛트 30개가 통째로 검은 덩어리 하나로 뭉쳐 보인다(실제로 그렇게 나왔다).
 *    박스 밝기를 보고 밝은 선/어두운 선을 갈라 준다.
 */
const EDGE_ON_DARK = "#ffffff"
const EDGE_ON_LIGHT = "#0c1a2e"

function edgeColorFor(hex: string): string {
  const value = hex.replace("#", "")
  if (value.length !== 6) return EDGE_ON_LIGHT

  const channel = (at: number) => parseInt(value.slice(at, at + 2), 16) / 255
  // sRGB 상대 휘도 근사 — 정확한 감마 보정까지 갈 필요는 없다, 밝고 어두움만 가른다
  const luminance =
    0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)

  return luminance < 0.5 ? EDGE_ON_DARK : EDGE_ON_LIGHT
}

/**
 * LoadPlan 의 박스 목록을 three.js 좌표로 옮긴다.
 *
 * LoadPlan 의 positionCm 은 박스의 "최소 모서리"인데 three.js 의 BoxGeometry 는
 * 중심 기준이라, 크기의 절반을 더해 중심으로 바꿔야 한다. 이걸 빠뜨리면 박스가
 * 전부 자기 크기의 절반만큼 원점 쪽으로 파고든 것처럼 보인다.
 */
function toSceneBoxes(
  container: ContainerSpec,
  placed: readonly PlacedBox[],
  colorByBoxId: ReadonlyMap<string, string>
): BoxTransform[] {
  const halfLength = (container.innerLengthCm * CM_TO_SCENE) / 2
  const halfWidth = (container.innerWidthCm * CM_TO_SCENE) / 2
  const halfHeight = (container.innerHeightCm * CM_TO_SCENE) / 2

  return placed.map((box) => {
    const [px, py, pz] = box.positionCm
    const [sx, sy, sz] = box.sizeCm
    const color = colorByBoxId.get(box.boxId) ?? EDGE_ON_LIGHT

    // 최소 모서리 → 중심 (아직 LoadPlan 좌표계, cm)
    const centerX = px + sx / 2
    const centerY = py + sy / 2
    const centerZ = pz + sz / 2

    return {
      key: box.instanceId,
      position: [
        centerX * CM_TO_SCENE - halfLength,
        centerZ * CM_TO_SCENE - halfHeight,
        // 폭은 부호를 뒤집는다 — 위 좌표계 주석 참고
        -(centerY * CM_TO_SCENE - halfWidth),
      ],
      size: [sx * CM_TO_SCENE, sz * CM_TO_SCENE, sy * CM_TO_SCENE],
      color,
      edgeColor: edgeColorFor(color),
    }
  })
}

/** 컨테이너 내부 공간을 나타내는 와이어프레임 상자 */
function ContainerShell({
  container,
  color,
}: {
  container: ContainerSpec
  color: string
}) {
  const size: [number, number, number] = [
    container.innerLengthCm * CM_TO_SCENE,
    container.innerHeightCm * CM_TO_SCENE,
    container.innerWidthCm * CM_TO_SCENE,
  ]

  return (
    <group>
      {/*
        면을 그리지 않고 모서리 12개만 그린다. wireframe 머티리얼을 쓰면
        삼각형 분할 대각선까지 나와서 상자가 아니라 그물처럼 보인다.

        머티리얼을 visible={false} 로 둔 메시에 <Edges> 만 얹는 방식이다.
        three 는 object.visible 로 하위 트리를 걸러 내고 material.visible 은
        그 메시 하나만 건너뛰므로, 자식인 Edges 는 그대로 그려진다.
        직접 EdgesGeometry 를 만들면 렌더마다 새 지오메트리가 생겨 GPU 메모리가
        새는데, 이렇게 두면 R3F 와 drei 가 생성·해제를 알아서 한다.
      */}
      <mesh>
        <boxGeometry args={size} />
        <meshBasicMaterial visible={false} />
        <Edges threshold={15} color={color} transparent opacity={0.55} />
      </mesh>

      {/*
        바닥면. 박스들이 허공이 아니라 무언가에 얹혀 있다고 읽히게 하는
        기준면이다. 아주 옅게 깔아 화물색을 방해하지 않는다.
      */}
      <mesh
        position={[0, -size[1] / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[size[0], size[2]]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/** 배치된 화물 박스들 */
function CargoBoxes({ boxes }: { boxes: BoxTransform[] }) {
  return (
    <group>
      {boxes.map((box) => (
        <mesh key={box.key} position={box.position} castShadow receiveShadow>
          <boxGeometry args={box.size} />
          <meshStandardMaterial color={box.color} roughness={0.62} metalness={0.05} />
          {/*
            같은 화물 타입이 여러 개 붙어 있으면 색이 같아서 한 덩어리로
            보인다. 모서리 선을 얹어야 몇 개가 어떻게 쌓였는지 읽힌다.
          */}
          <Edges threshold={15} color={box.edgeColor} transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  )
}

export function ContainerScene({
  container,
  placed,
  label,
}: {
  container: ContainerSpec
  /**
   * 그릴 박스들. 빈 배열이면 빈 컨테이너만 그린다 — 계산 전 초기 상태가
   * 이 경우다. LoadPlan 전체가 아니라 배치 목록만 받는 이유는, 이 컴포넌트가
   * 적재율·중량 같은 건 쓰지 않아서다. 좁게 받아 두면 계산 전/후 상태를
   * 같은 컴포넌트로 그릴 수 있다.
   */
  placed: readonly PlacedBox[]
  /** 3D 캔버스가 무엇을 보여주는지 — 보조기기용 설명 */
  label: string
}) {
  const brand = useBrandColors()

  /**
   * 화물 타입별 색 배정.
   *
   * boxId 가 처음 나온 순서대로 팔레트를 돌린다. 목록 전체를 한 번에 훑어
   * 표를 만들어 두는 방식이다.
   *
   * ⚠️ "물어볼 때마다 없으면 새로 배정하는" 함수를 memo 로 들고 있으면 안 된다.
   *    그 함수는 렌더가 끝난 뒤에도 자기 안의 Map 을 계속 고치게 되는데, 그러면
   *    누가 먼저 물어봤느냐에 따라 색이 달라진다. react-hooks/immutability 규칙이
   *    잡아 주는 것도 정확히 이 형태다. 표를 미리 다 만들어 두면 호출 순서와
   *    무관하게 같은 화물이 언제나 같은 색을 갖는다.
   */
  const colorByBoxId = useMemo(() => {
    const map = new Map<string, string>()
    for (const box of placed) {
      if (map.has(box.boxId)) continue
      map.set(box.boxId, brand[PALETTE_ORDER[map.size % PALETTE_ORDER.length]])
    }
    return map
  }, [brand, placed])

  const boxes = useMemo(
    () => toSceneBoxes(container, placed, colorByBoxId),
    [container, placed, colorByBoxId]
  )

  /**
   * 카메라 초기 위치 — 컨테이너 전체가 한눈에 들어오는 3/4 부감.
   *
   * 길이를 기준으로 잡는다. 40FT 는 20FT 의 두 배라 고정값을 쓰면 한쪽이
   * 반드시 화면을 벗어난다. 길이에 비례시켜 두면 어느 규격이든 같은 구도로 잡힌다.
   */
  const lengthM = container.innerLengthCm * CM_TO_SCENE
  const cameraPosition: [number, number, number] = [
    lengthM * 0.7,
    lengthM * 0.42,
    lengthM * 0.7,
  ]

  return (
    <Canvas
      camera={{ position: cameraPosition, fov: 40, near: 0.1, far: lengthM * 12 }}
      dpr={[1, 2]}
      shadows
      role="img"
      aria-label={label}
    >
      {/*
        조명. 면마다 밝기가 달라야 직육면체가 직육면체로 읽힌다 —
        ambient 만 쓰면 모든 면이 같은 색이라 납작한 실루엣이 된다.
      */}
      <ambientLight intensity={0.85} />
      <directionalLight position={[lengthM, lengthM * 1.2, lengthM * 0.6]} intensity={1.5} />
      <directionalLight position={[-lengthM * 0.6, lengthM * 0.4, -lengthM]} intensity={0.5} />

      <ContainerShell container={container} color={brand.slate} />
      <CargoBoxes boxes={boxes} />

      {/*
        자유 회전. 지구본과 달리 여기서는 각도를 고정할 이유가 없다 —
        적재 상태를 확인하려면 뒤쪽과 아래쪽도 봐야 한다.
        다만 팬(우클릭 드래그)은 끈다. 화물을 화면 밖으로 밀어내 놓고
        "뷰어가 깨졌다"고 오해하기 쉬운 조작이라, 회전과 확대만 남긴다.
      */}
      <OrbitControls
        enablePan={false}
        minDistance={lengthM * 0.35}
        maxDistance={lengthM * 3}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}
