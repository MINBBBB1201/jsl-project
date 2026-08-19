import type { StaticImageData } from "next/image"

import containerYard from "@/assets/landing/container-yard.jpg"
import heroPortDusk from "@/assets/landing/hero-port-dusk.jpg"
import warehouseOps from "@/assets/landing/warehouse-ops.jpg"

/**
 * 랜딩 리디자인 섹션용 사진
 *
 * transport-photos.ts 가 5개 운송모드를 한 장씩 담는 것과 달리, 이쪽은 특정
 * 자리(히어로 배경 · Why JSL 겹침 사진)를 위해 고른 장면 사진이다. 모드별
 * 사진과 성격이 달라 파일을 나눴다.
 *
 * ── 라이선스 ────────────────────────────────────────────────────────────
 * 세 장 모두 Unsplash License(https://unsplash.com/license) 다.
 *   · 상업적 이용 가능
 *   · 저작자 표시 의무 없음 (아래 크레딧은 나중에 출처를 되짚기 위한 것)
 *   · 사진 자체를 재배포하거나 경쟁 서비스를 만드는 데는 쓸 수 없음
 *     — 웹사이트 배경으로 쓰는 지금 용도는 허용 범위 안이다.
 * 유료인 Unsplash+(plus.unsplash.com / premium_photo-*)는 한 장도 없다.
 * 받을 때 raw URL 에 premium_photo·plus.unsplash 가 섞이지 않았는지 확인했고,
 * 교체할 때도 이 구분을 유지할 것.
 *
 * ── 원본 출처 (2026-08-19 내려받음) ────────────────────────────────────
 * hero-port-dusk.jpg   Winston Chen (@winstonchen)
 *   "Industrial port with cranes and ships at dusk"
 *   https://unsplash.com/photos/industrial-port-with-cranes-and-ships-at-dusk-ZAk0UY8xYh0
 *
 * warehouse-ops.jpg    Adrian Sulyok (@sulyok_imaging)
 *   "workers walking through warehouse aisle"
 *   https://unsplash.com/photos/workers-walking-through-warehouse-aisle-c_4eaGRDSVU
 *
 * container-yard.jpg   taro ohtani (@taro_ohtani)
 *   "a crane is on top of a large stack of containers"
 *   https://unsplash.com/photos/a-crane-is-on-top-of-a-large-stack-of-containers-5T5zmIqs0AM
 *
 * ── 고른 기준 ───────────────────────────────────────────────────────────
 * JSL 실제 현장 사진이 없어 스톡으로 채우되, 연출 티가 나는 컷은 피했다.
 * 흰 헬멧을 쓴 모델이 태블릿을 들고 웃는 류의 사진은 어느 물류 회사 사이트에나
 * 있어서 오히려 가짜로 읽힌다. 실제 항만·창고를 그냥 찍은 컷으로 골랐다.
 * 히어로가 해질녘이라 어두운 스크림 위 흰 글자와 잘 맞고, 크레인 조명의 주황이
 * 브랜드 오렌지와 같은 계열이라 색이 따로 놀지 않는다.
 *
 * ── 파일 ────────────────────────────────────────────────────────────────
 * public/ 이 아니라 src/assets/ 에 두고 정적 import 로 가져온다. 그래야 Next 가
 * 빌드할 때 가로·세로를 읽어 CLS 를 막고, 파일명에 해시가 붙어 영구 캐시가 걸린다.
 * 실제 서비스 크기는 next/image 가 sizes 를 보고 다시 줄이므로 원본을 더 크게
 * 받아 둘 이유가 없다 (히어로 2000×1125 / 큰 사진 1400×1050 / 작은 사진 1000×750).
 */
export const LANDING_PHOTOS: Record<string, StaticImageData> = {
  heroPortDusk,
  warehouseOps,
  containerYard,
}
