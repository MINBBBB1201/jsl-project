/**
 * 승인된 거친 입자 지구본의 공용 계산.
 *
 * 원본: design-direction-20261024/network-globe-pilot/scene.js. 히어로 지구본
 * (approved-hero-globe.tsx)과 네트워크 섹션(approved-network-section.tsx)이 같은
 * 육지 입자·투영·거점 좌표를 쓰도록 한 곳에 둔다.
 */

/** 실제 지리 좌표와, 원본 시안의 라벨 칸(데스크톱은 높이 비율, 모바일은 px). */
export const PLACES: Record<string, { lon: number; lat: number; desktop: [number, number]; mobile: [number, number] }> = {
  Seoul: { lon: 126.978, lat: 37.5665, desktop: [0.89, 0.235], mobile: [0.72, 420] },
  Weihai: { lon: 122.1201, lat: 37.5128, desktop: [0.49, 0.215], mobile: [0.07, 421] },
  Shanghai: { lon: 121.4737, lat: 31.2304, desktop: [0.895, 0.48], mobile: [0.73, 558] },
  Guangzhou: { lon: 113.2644, lat: 23.1291, desktop: [0.805, 0.77], mobile: [0.53, 704] },
  Hanoi: { lon: 105.8342, lat: 21.0278, desktop: [0.52, 0.69], mobile: [0.065, 642] },
}
export const ARCS: [string, string][] = [
  ["Seoul", "Shanghai"],
  ["Guangzhou", "Hanoi"],
]
const LAND_URL = "/images/approved-network/land.geojson"
const RAD = Math.PI / 180

export interface LandPoint { lon: number; lat: number; seed: number; grain: number; alt: number }
export interface Geometry { w: number; h: number; cx: number; cy: number; r: number; mobile: boolean }
type Ring = number[][]
interface LandData {
  features: { geometry: { type: string; coordinates: Ring[] | Ring[][] } }[]
}

function noise(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123
  return x - Math.floor(x)
}

export function project(g: Geometry, lon: number, lat: number, alt = 1) {
  const a = (lon - 135) * RAD
  const b = lat * RAD
  const c = 22 * RAD
  const y = Math.cos(c) * Math.sin(b) - Math.sin(c) * Math.cos(b) * Math.cos(a)
  const z = Math.sin(c) * Math.sin(b) + Math.cos(c) * Math.cos(b) * Math.cos(a)
  return { x: g.cx + g.r * alt * Math.cos(b) * Math.sin(a), y: g.cy - g.r * alt * y, z }
}

/** 육지 윤곽을 1440×720 마스크로 그린 뒤, 원본과 같은 결정적 분포로 입자를 고른다. */
function makeLandPoints(data: LandData): LandPoint[] {
  const mask = document.createElement("canvas")
  mask.width = 1440
  mask.height = 720
  const m = mask.getContext("2d", { willReadFrequently: true })
  if (!m) throw new Error("Canvas 2D unavailable")
  m.fillStyle = "#fff"
  for (const feature of data.features) {
    const polygons = (feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates) as Ring[][]
    for (const polygon of polygons) {
      m.beginPath()
      for (const ring of polygon) {
        ring.forEach(([lon, lat], i) => {
          const x = (lon + 180) * 4
          const y = (90 - lat) * 4
          if (i) m.lineTo(x, y)
          else m.moveTo(x, y)
        })
        m.closePath()
      }
      m.fill("evenodd")
    }
  }
  const pixels = m.getImageData(0, 0, 1440, 720).data
  const out: LandPoint[] = []
  const count = 118000
  for (let i = 0; i < count; i++) {
    const seed = noise(i)
    const lat = Math.asin(1 - (2 * (i + 0.5)) / count) / RAD + (noise(i + 1.7) - 0.5) * 0.3
    const lon = ((i * 137.50776405 + seed * 0.85) % 360) - 180
    if (lat < -63 || lat > 84) continue
    const x = Math.floor((lon + 180) * 4)
    const y = Math.floor((90 - lat) * 4)
    if (x >= 0 && x < 1440 && y >= 0 && y < 720 && pixels[(y * 1440 + x) * 4 + 3] > 100) {
      out.push({ lon, lat, seed, grain: noise(i + 23.1), alt: 1 + (noise(i + 3.1) - 0.5) * 0.016 })
    }
  }
  return out
}

// 히어로와 네트워크 섹션이 같은 데이터를 두 번 받지 않는다. 실패하면 다음 호출에서 재시도한다.
let landCache: Promise<LandPoint[]> | null = null
export function loadLand(): Promise<LandPoint[]> {
  if (!landCache) {
    landCache = fetch(LAND_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Land data unavailable")
        return response.json() as Promise<LandData>
      })
      .then(makeLandPoints)
    landCache.catch(() => {
      landCache = null
    })
  }
  return landCache
}
