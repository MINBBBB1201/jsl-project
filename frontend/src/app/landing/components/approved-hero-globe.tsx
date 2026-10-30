"use client"

import { useEffect, useRef } from "react"
import { useContent } from "@/config/use-content"
import { ARCS, PLACES, loadLand, project, type Geometry, type LandPoint } from "./approved-globe-core"

/** 태그를 점의 어느 쪽에 둘지. 가까운 서울·웨이하이와 광저우·하노이가 겹치지 않게 나눈다. */
const TAG_SIDE: Record<string, "left" | "right"> = {
  Seoul: "right",
  Weihai: "left",
  Shanghai: "right",
  Guangzhou: "right",
  Hanoi: "left",
}

/**
 * 히어로 지구본 자리에 들어가는 승인된 거친 입자 지구본과 다섯 거점.
 *
 * .journey-orbit 안에서 기존 점 지구본(JourneyGlobe)과 고정 도시 태그를 대신한다.
 * 어두운 구체·테두리 빛·궤도선과 스크롤에 따른 이동(journey-hero-motion 의 orbit
 * 트윈)은 바깥 요소가 그대로 맡는다. 어두운 바탕이라 입자는 밝게 그린다.
 * 장식이므로 aria-hidden 이며, 거점 정보는 아래 네트워크 섹션에서 읽힌다.
 */
export function ApprovedHeroGlobe() {
  const { network } = useContent()
  const offices = network.items
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tagRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    let alive = true
    let frame = 0
    let points: LandPoint[] = []

    const draw = () => {
      const size = wrap.clientWidth
      const ctx = canvas.getContext("2d")
      if (!size || !ctx) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(size * dpr)
      canvas.height = Math.round(size * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)
      // .journey-sphere 가 inset 5% 라 반지름은 크기의 45% 다.
      const g: Geometry = { w: size, h: size, cx: size / 2, cy: size / 2, r: size * 0.45, mobile: size < 600 }

      for (const item of points) {
        const p = project(g, item.lon, item.lat, item.alt)
        if (p.z < 0) continue
        const alpha = (0.16 + p.z * 0.6) * (0.55 + item.seed * 0.45)
        const radius = (g.mobile ? 0.3 : 0.32) + item.grain * (g.mobile ? 0.6 : 0.8) + p.z * 0.2
        ctx.fillStyle = `rgba(196,214,255,${alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
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
        ctx.strokeStyle = "rgba(255,112,48,.8)"
        ctx.lineWidth = 1.2
        ctx.stroke()
      }

      offices.forEach((office, i) => {
        const place = PLACES[office.cityEn]
        const tag = tagRefs.current[i]
        if (!place) return
        const p = project(g, place.lon, place.lat)
        ctx.beginPath()
        ctx.arc(p.x, p.y, office.isHq ? 4.5 : 3.2, 0, Math.PI * 2)
        ctx.fillStyle = "#ff6a2a"
        ctx.fill()
        if (tag) {
          tag.style.left = `${(p.x / size) * 100}%`
          tag.style.top = `${(p.y / size) * 100}%`
        }
      })
    }

    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(draw)
    }
    loadLand()
      .then((loaded) => {
        if (!alive) return
        points = loaded
        wrap.dataset.status = "ready"
        schedule()
      })
      .catch(() => {
        // 육지 데이터가 없어도 기존 구체·테두리·궤도선과 거점 점은 남긴다.
        if (alive) {
          wrap.dataset.status = "failed"
          schedule()
        }
      })
    const resize = new ResizeObserver(schedule)
    resize.observe(wrap)
    return () => {
      alive = false
      resize.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [offices])

  return (
    <div ref={wrapRef} className="journey-approved-globe" data-status="idle">
      <canvas ref={canvasRef} className="journey-globe-canvas" />
      {offices.map((office, i) => (
        <span
          key={office.cityEn}
          ref={(el) => {
            tagRefs.current[i] = el
          }}
          className={`journey-geo journey-approved-geo journey-approved-geo--${TAG_SIDE[office.cityEn] ?? "right"}`}
        >
          <i />
          {office.cityEn.toUpperCase()}
        </span>
      ))}
    </div>
  )
}
