"use client"

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react"
import { useContent } from "@/config/use-content"
import "./approved-network.css"

/**
 * 승인된 네트워크 장면 — 거친 입자 지구본 + 거점 선택.
 *
 * 원본: design-direction-20261024/network-globe-pilot (scene.js·scene.css·polish.css).
 * 지구본 그리기와 라벨 배치는 원본 Canvas 2D 로직을 그대로 옮겼고, 문구는 전부
 * useContent().network 의 번역 값을 쓴다. 지구본이 실패해도 다섯 거점의 이름·역할·
 * 인원·설명은 아래 목록과 상세 영역에서 그대로 읽힌다.
 */

/** 실제 지리 좌표와, 원본 시안의 라벨 칸(데스크톱은 높이 비율, 모바일은 px). */
const PLACES: Record<string, { lon: number; lat: number; desktop: [number, number]; mobile: [number, number] }> = {
  Seoul: { lon: 126.978, lat: 37.5665, desktop: [0.89, 0.235], mobile: [0.72, 420] },
  Weihai: { lon: 122.1201, lat: 37.5128, desktop: [0.49, 0.215], mobile: [0.07, 421] },
  Shanghai: { lon: 121.4737, lat: 31.2304, desktop: [0.895, 0.48], mobile: [0.73, 558] },
  Guangzhou: { lon: 113.2644, lat: 23.1291, desktop: [0.805, 0.77], mobile: [0.53, 704] },
  Hanoi: { lon: 105.8342, lat: 21.0278, desktop: [0.52, 0.69], mobile: [0.065, 642] },
}
const ARCS: [string, string][] = [
  ["Seoul", "Shanghai"],
  ["Guangzhou", "Hanoi"],
]
const LAND_URL = "/images/approved-network/land.geojson"
const MOBILE_MAX = 700
/** 라벨은 칸 좌표에 세로 가운데를 맞춘다(translateY -50%). 모바일 라벨 높이의 절반 정도. */
const LABEL_HALF_HEIGHT = 30
const RAD = Math.PI / 180

interface LandPoint { lon: number; lat: number; seed: number; grain: number; alt: number }
interface Geometry { w: number; h: number; cx: number; cy: number; r: number; mobile: boolean }
type Ring = number[][]
interface LandData {
  features: { geometry: { type: string; coordinates: Ring[] | Ring[][] } }[]
}

function noise(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123
  return x - Math.floor(x)
}

function project(g: Geometry, lon: number, lat: number, alt = 1) {
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

// 다시 마운트돼도 같은 데이터를 다시 받지 않는다. 실패하면 다음 마운트에서 재시도한다.
let landCache: Promise<LandPoint[]> | null = null
function loadLand(): Promise<LandPoint[]> {
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

export function ApprovedNetworkSection() {
  const { network } = useContent()
  const offices = network.items
  const count = offices.length
  const [active, setActive] = useState(0)
  const [status, setStatus] = useState<"idle" | "ready" | "failed">("idle")

  const sceneRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const leadersRef = useRef<SVGSVGElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const labelRefs = useRef<(HTMLButtonElement | null)[]>([])
  const pointsRef = useRef<LandPoint[]>([])
  const geometryRef = useRef<Geometry | null>(null)
  const activeRef = useRef(0)

  const draw = useCallback(() => {
    const g = geometryRef.current
    const scene = sceneRef.current
    const canvas = canvasRef.current
    const leaders = leadersRef.current
    const intro = introRef.current
    if (!g || !scene || !canvas || !leaders || !intro) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const { w, h, mobile } = g
    ctx.clearRect(0, 0, w, h)

    const base = scene.getBoundingClientRect()
    const introBox = intro.getBoundingClientRect()
    const introArea = {
      right: introBox.right - base.left,
      top: introBox.top - base.top,
      bottom: introBox.bottom - base.top,
    }
    const labelAreas = labelRefs.current.flatMap((el) => {
      if (!el) return []
      const box = el.getBoundingClientRect()
      return [{ x: box.x - base.x + box.width * 0.5, y: box.y - base.y + box.height * 0.5, rx: box.width * 0.7 + 8, ry: box.height * 0.7 }]
    })

    for (const item of pointsRef.current) {
      const p = project(g, item.lon, item.lat, item.alt)
      if (p.z < -0.035 || p.x < -3 || p.x > w + 3 || p.y < -3 || p.y > h + 3) continue
      let alpha = p.z < 0 ? 0.05 : (0.2 + p.z * 0.6) * (0.6 + item.seed * 0.4)
      let clearance = 1
      for (const area of labelAreas) {
        const distance = Math.hypot((p.x - area.x) / area.rx, (p.y - area.y) / area.ry)
        if (distance < 1.45) clearance = Math.min(clearance, 0.08 + 0.92 * Math.min(1, Math.max(0, (distance - 0.6) / 0.85)))
      }
      if (w <= 1100 && p.x < introArea.right + 65 && p.y > introArea.top - 35 && p.y < introArea.bottom + 35) {
        const edgeX = Math.max(0, Math.min(1, (p.x - introArea.right + 20) / 85))
        const edgeY = Math.max(0, Math.min(1, Math.max(introArea.top - p.y, p.y - introArea.bottom) / 35))
        clearance *= Math.max(0.04, edgeX, edgeY)
      }
      alpha *= clearance
      const size = (mobile ? 0.18 : 0.25) + item.grain * (mobile ? 0.57 : 0.74) + Math.max(0, p.z) * 0.2
      ctx.fillStyle = `rgba(26,52,66,${alpha})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    for (const [fromKey, toKey] of ARCS) {
      const from = PLACES[fromKey]
      const to = PLACES[toKey]
      ctx.beginPath()
      for (let i = 0; i <= 32; i++) {
        const t = i / 32
        const p = project(g, from.lon + (to.lon - from.lon) * t, from.lat + (to.lat - from.lat) * t, 1 + Math.sin(t * Math.PI) * 0.035)
        if (i) ctx.lineTo(p.x, p.y)
        else ctx.moveTo(p.x, p.y)
      }
      ctx.strokeStyle = "rgba(203,94,35,.65)"
      ctx.lineWidth = 1.2
      ctx.stroke()
    }

    leaders.replaceChildren()
    const current = activeRef.current
    offices.forEach((office, i) => {
      const place = PLACES[office.cityEn]
      const el = labelRefs.current[i]
      if (!place || !el) return
      const p = project(g, place.lon, place.lat)
      const box = el.getBoundingClientRect()
      const x = box.x - base.x
      const y = box.y - base.y + box.height / 2
      const right = x + box.width
      const endX = p.x < x ? x : p.x > right ? right : Math.min(right - 8, Math.max(x + 8, p.x))
      const line = document.createElementNS("http://www.w3.org/2000/svg", "path")
      line.setAttribute("d", `M ${p.x} ${p.y} L ${endX} ${y}`)
      line.setAttribute("fill", "none")
      line.setAttribute("stroke", i === current ? "#c75a20" : "#879c9f")
      line.setAttribute("stroke-width", i === current ? "1.2" : ".8")
      leaders.append(line)
      ctx.beginPath()
      ctx.arc(p.x, p.y, i === current ? 6 : 3.5, 0, Math.PI * 2)
      ctx.fillStyle = i === current ? "#e76b25" : "#183d50"
      ctx.fill()
      if (i === current) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 10.5, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(215,112,57,.35)"
        ctx.lineWidth = 0.8
        ctx.stroke()
      }
    })
  }, [offices])

  const layout = useCallback(() => {
    const scene = sceneRef.current
    const canvas = canvasRef.current
    const leaders = leadersRef.current
    if (!scene || !canvas || !leaders) return
    const w = scene.clientWidth
    const h = scene.clientHeight
    const mobile = w <= MOBILE_MAX
    // 모바일 라벨 칸은 원본 시안의 고정 px 이다. 번역 제목·설명이 길어 본문이 그 칸까지
    // 내려오면, 지구본·라벨·상세·장면 높이를 같은 양만큼 함께 내린다(구도는 그대로).
    let shift = 0
    if (mobile) {
      const top = scene.getBoundingClientRect().top
      const text = introRef.current?.querySelectorAll(".jsl-an__eyebrow, .jsl-an__title, .jsl-an__copy") ?? []
      const textBottom = Math.max(0, ...[...text].map((el) => el.getBoundingClientRect().bottom - top))
      const firstLabelTop = Math.min(...Object.values(PLACES).map((p) => p.mobile[1])) - LABEL_HALF_HEIGHT
      shift = Math.max(0, Math.ceil(textBottom + 16 - firstLabelTop))
    }
    scene.style.setProperty("--jsl-an-shift", `${shift}px`)
    geometryRef.current = mobile
      ? { w, h, cx: w * 0.91, cy: 548 + shift, r: w * 0.81, mobile }
      : { w, h, cx: w * 0.85, cy: h * 0.53, r: Math.min(h * 0.69, w * 0.49), mobile }
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0)
    leaders.setAttribute("viewBox", `0 0 ${w} ${h}`)
    offices.forEach((office, i) => {
      const el = labelRefs.current[i]
      const place = PLACES[office.cityEn]
      if (!el || !place) return
      const [sx, sy] = mobile ? place.mobile : place.desktop
      el.style.left = `${Math.min(sx * w, w - el.offsetWidth - (mobile ? 24 : w * 0.045))}px`
      el.style.top = `${mobile ? sy + shift : sy * h}px`
    })
    draw()
  }, [offices, draw])

  // 화면 가까이 왔을 때만 육지 데이터를 읽는다. 실패하면 지구본만 숨기고 내용은 남긴다.
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    let alive = true
    const start = () => {
      loadLand()
        .then((points) => {
          if (!alive) return
          pointsRef.current = points
          setStatus("ready")
        })
        .catch(() => {
          if (alive) setStatus("failed")
        })
    }
    if (typeof IntersectionObserver === "undefined") {
      start()
      return () => {
        alive = false
      }
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          start()
        }
      },
      { rootMargin: "600px 0px" },
    )
    observer.observe(scene)
    return () => {
      alive = false
      observer.disconnect()
    }
  }, [])

  // 크기·글꼴·언어가 바뀌면 다시 배치한다. 한 프레임에 한 번만 그린다.
  useEffect(() => {
    if (status !== "ready") return
    const scene = sceneRef.current
    if (!scene) return
    let frame = 0
    let alive = true
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(layout)
    }
    schedule()
    const resize = new ResizeObserver(schedule)
    resize.observe(scene)
    document.fonts?.ready.then(() => {
      if (alive) schedule()
    })
    return () => {
      alive = false
      resize.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [status, layout])

  useEffect(() => {
    activeRef.current = active
    if (status === "ready" && geometryRef.current) draw()
  }, [active, status, draw])

  const select = (index: number, focus = false) => {
    const next = (index + count) % count
    setActive(next)
    if (focus) labelRefs.current[next]?.focus()
  }
  const onLabelKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault()
      select(active + 1, true)
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault()
      select(active - 1, true)
    }
  }

  // 단위가 라틴 문자로 시작하면(staff, người) 숫자와 띄운다. JourneyNetwork 와 같은 규칙이다.
  const people = (n: number) =>
    `${n}${/^[A-Za-z]/.test(network.headcountUnit) ? " " : ""}${network.headcountUnit}`
  const current = offices[active] ?? offices[0]
  const upcoming = offices[(active + 1) % count]
  const pad = (n: number) => String(n).padStart(2, "0")
  if (!current) return null

  return (
    <section id="network" className="jsl-an" aria-labelledby="jsl-an-title">
      <div ref={sceneRef} className="jsl-an__scene" data-status={status}>
        <div className="jsl-an__globe" aria-hidden="true">
          <canvas ref={canvasRef} className="jsl-an__canvas" />
          <svg ref={leadersRef} className="jsl-an__leaders" xmlns="http://www.w3.org/2000/svg" />
        </div>

        <div ref={introRef} className="jsl-an__intro">
          <p className="jsl-an__eyebrow">{network.badge}</p>
          <h2 id="jsl-an-title" className="jsl-an__title">{network.title}</h2>
          <p className="jsl-an__copy">{network.description}</p>
          <div className="jsl-an__detail" aria-live="polite" aria-atomic="true">
            <p className="jsl-an__detail-role">
              {current.city} / {current.role} · {people(current.headcount)}
            </p>
            <p className="jsl-an__detail-copy">{current.description}</p>
          </div>
        </div>

        <div className="jsl-an__labels" role="group" aria-label={network.badge} onKeyDown={onLabelKey}>
          {offices.map((office, i) => (
            <button
              key={office.cityEn}
              ref={(el) => {
                labelRefs.current[i] = el
              }}
              type="button"
              className="jsl-an__label"
              aria-pressed={i === active}
              onClick={() => select(i)}
            >
              <strong>{office.city}</strong>
              <small>{office.role}</small>
            </button>
          ))}
        </div>

        <div className="jsl-an__footer">
          <p className="jsl-an__total">{network.totalLabel}</p>
          <div className="jsl-an__pager">
            <span aria-hidden="true">
              {pad(active + 1)} / {pad(count)}
            </span>
            {upcoming && (
              <button
                type="button"
                className="jsl-an__next"
                aria-label={`${upcoming.city} · ${upcoming.role}`}
                onClick={() => select(active + 1)}
              >
                →
              </button>
            )}
          </div>
        </div>
      </div>

      <ul className="jsl-an__locations" aria-label={network.totalLabel}>
        {offices.map((office) => (
          <li key={office.cityEn} className="jsl-an__row">
            <div>
              <h3>{office.city}</h3>
              <small>
                {office.role} · {people(office.headcount)}
              </small>
            </div>
            <p>{office.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
