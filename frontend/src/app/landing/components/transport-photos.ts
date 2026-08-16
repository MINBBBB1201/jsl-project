import type { StaticImageData } from "next/image"

import airPhoto from "@/assets/transport/air.jpg"
import expressPhoto from "@/assets/transport/express.jpg"
import railPhoto from "@/assets/transport/rail.jpg"
import seaPhoto from "@/assets/transport/sea.jpg"
import truckPhoto from "@/assets/transport/truck.jpg"

/**
 * 히어로 벤토그리드에 쓰는 5개 운송모드 사진
 *
 * ── 라이선스 ────────────────────────────────────────────────────────────
 * 다섯 장 모두 Unsplash License(https://unsplash.com/license) 다.
 *   · 상업적 이용 가능
 *   · 저작자 표시 의무 없음 (아래 크레딧은 나중에 출처를 되짚을 수 있게 남긴 것)
 *   · 사진을 그대로 재배포하거나 경쟁 서비스를 만드는 용도로는 쓸 수 없음
 *     — 웹사이트 배경으로 쓰는 지금 용도는 허용 범위 안이다.
 * 유료인 Unsplash+(plus.unsplash.com / premium_photo-*)는 한 장도 섞이지 않았다.
 * 라이선스가 다르므로 나중에 사진을 교체할 때도 이 구분을 유지할 것.
 *
 * ── 원본 출처 ───────────────────────────────────────────────────────────
 * AIR      Kent Lâm (@kentlam)
 *          https://unsplash.com/photos/a-person-standing-next-to-an-airplane-e3pdZ99J2Uo
 * SEA      Venti Views (@ventiviews)
 *          https://unsplash.com/photos/aerial-view-of-blue-and-white-boat-on-body-of-water-during-daytime-FPKnAO-CF6M
 * TRUCK    ftodne (@ftodne)
 *          https://unsplash.com/photos/front-view-of-a-silver-semi-truck-on-a-road-uQ6wwzskIDQ
 * RAIL     Anirudh (@underroot)
 *          https://unsplash.com/photos/yellow-and-black-train-on-rail-tracks-during-daytime-PJUbLL5g9BY
 * EXPRESS  Nurulloh A.A (@nurullokh)
 *          https://unsplash.com/photos/a-man-riding-a-scooter-with-a-box-on-the-back-of-it-4_Ha_neGOEY
 *
 * ── 파일 ────────────────────────────────────────────────────────────────
 * public/ 이 아니라 src/assets/ 에 두고 정적 import 로 가져온다. 그래야 Next 가
 * 빌드할 때 가로·세로를 읽어 CLS 를 막고, blur 플레이스홀더(placeholder="blur")를
 * 자동으로 만들어 주며, 파일명에 해시가 붙어 영구 캐시가 걸린다.
 *
 * 원본은 Unsplash CDN 에서 큰 칸 1600×1200 / 작은 칸 1200×900, q=74 로 받았다.
 * 실제 서비스 크기는 next/image 가 sizes 를 보고 다시 줄이므로 이보다 더 큰
 * 파일을 받아 둘 이유가 없다.
 */
export const TRANSPORT_PHOTOS: Record<string, StaticImageData> = {
  AIR: airPhoto,
  SEA: seaPhoto,
  TRUCK: truckPhoto,
  RAIL: railPhoto,
  EXPRESS: expressPhoto,
}
