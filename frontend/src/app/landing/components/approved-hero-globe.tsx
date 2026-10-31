"use client"

import { useEffect, useRef } from "react"
import { useContent } from "@/config/use-content"
import { ARCS, PLACES, loadLand, project, type Geometry, type LandPoint } from "./approved-globe-core"

// Horizontal gap between the labels in the row.
const LABEL_GAP = 26

/**
 * 히어로 지구본 자리에 들어가는 승인된 거친 입자 지구본과 다섯 거점.
 *
 * .journey-orbit 안에서 기존 점 지구본(JourneyGlobe)과 고정 도시 태그를 대신한다.
 * 어두운 구체·테두리 빛·궤도선과 스크롤에 따른 이동(journey-hero-motion 의 orbit
 * 트윈)은 바깥 요소가 그대로 맡는다. 라벨은 승인된 네트워크 장면의 "도시 / 역할" 두 줄을
 * 도시 무리 위 한 줄로 세우고 점에서 지시선으로 잇는다. 본사만 주황이다.
 * 장식이므로 aria-hidden 이며, 거점 정보는 아래 네트워크 섹션에서 읽힌다.
 */
export function ApprovedHeroGlobe() {
  const { network } = useContent()
  const offices = network.items
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const leadersRef = useRef<SVGSVGElement>(null)
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const leaders = leadersRef.current
    if (!wrap || !canvas || !leaders) return
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
        ctx.fillStyle = `rgba(240,224,204,${alpha})`
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

      // 도시 점, 그리고 승인 장면처럼 바깥 라벨 열을 지리 순서(위→아래)로 세운다.
      const dots = offices.flatMap((office, i) => {
        const place = PLACES[office.cityEn]
        return place ? [{ i, hq: office.isHq, p: project(g, place.lon, place.lat) }] : []
      })
      for (const { hq, p } of dots) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, hq ? 5 : 3.2, 0, Math.PI * 2)
        ctx.fillStyle = hq ? "#ff6a2a" : "#f0e0cc"
        ctx.fill()
        if (hq) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 9.5, 0, Math.PI * 2)
          ctx.strokeStyle = "rgba(255,106,42,.45)"
          ctx.lineWidth = 0.8
          ctx.stroke()
        }
      }
      // 승인 시안(2안)처럼 도시 무리 위에 라벨을 서→동 한 줄로 세우고, 점에서 지시선을 올린다.
      const rowY = Math.min(...dots.map((d) => d.p.y)) - size * 0.14
      leaders.setAttribute("viewBox", `0 0 ${size} ${size}`)
      leaders.replaceChildren()
      const west = [...dots].sort((a, b) => a.p.x - b.p.x)
      const widths = west.map((d) => labelRefs.current[d.i]?.offsetWidth ?? 80)
      const total = widths.reduce((a, b) => a + b, 0) + LABEL_GAP * (west.length - 1)
      let x = west.reduce((a, d) => a + d.p.x, 0) / west.length - total / 2
      west.forEach((d, k) => {
        const label = labelRefs.current[d.i]
        if (!label) return
        label.style.left = `${(x / size) * 100}%`
        label.style.top = `${(rowY / size) * 100}%`
        const line = document.createElementNS("http://www.w3.org/2000/svg", "path")
        line.setAttribute("d", `M ${d.p.x} ${d.p.y} L ${x + 2} ${rowY + 18}`)
        line.setAttribute("class", d.hq ? "is-hq" : "")
        leaders.append(line)
        x += widths[k] + LABEL_GAP
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
        // 육지 데이터가 없어도 기존 구체·테두리·궤도선과 거점 점·라벨은 남긴다.
        if (alive) {
          wrap.dataset.status = "failed"
          schedule()
        }
      })
    const resize = new ResizeObserver(schedule)
    resize.observe(wrap)
    document.fonts?.ready.then(() => {
      if (alive) schedule()
    })
    return () => {
      alive = false
      resize.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [offices])

  return (
    <div ref={wrapRef} className="journey-approved-globe" data-status="idle">
      <canvas ref={canvasRef} className="journey-globe-canvas" />
      <svg ref={leadersRef} className="journey-approved-leaders" xmlns="http://www.w3.org/2000/svg" />
      {offices.map((office, i) => (
        <span
          key={office.cityEn}
          ref={(el) => {
            labelRefs.current[i] = el
          }}
          className={`journey-approved-label${office.isHq ? " is-hq" : ""}`}
        >
          <strong>{office.city}</strong>
          <small>{office.role}</small>
        </span>
      ))}
    </div>
  )
}
