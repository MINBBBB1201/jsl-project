"use client"

import { useEffect, useRef } from "react"
import { useContent } from "@/config/use-content"
import { ARCS, PLACES, loadLand, project, type Geometry, type LandPoint } from "./approved-globe-core"

// Gap between stacked labels, and how far right of the city cluster the label column sits (share of the globe size).
const LABEL_GAP = 46
const COLUMN_OFFSET = 0.09

/**
 * 히어로 지구본 자리에 들어가는 승인된 거친 입자 지구본과 다섯 거점.
 *
 * .journey-orbit 안에서 기존 점 지구본(JourneyGlobe)과 고정 도시 태그를 대신한다.
 * 어두운 구체·테두리 빛·궤도선과 스크롤에 따른 이동(journey-hero-motion 의 orbit
 * 트윈)은 바깥 요소가 그대로 맡는다. 라벨은 승인된 네트워크 장면과 같이 도시 점에서
 * 지시선으로 이은 "도시 / 역할" 두 줄이고, 본사만 주황이다. 어두운 바탕이라 색만 뒤집었다.
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
      // 제목·메뉴 글자 줄. 라벨 열이 이 줄들의 오른쪽 끝을 넘어서 시작해야 글자와 붙지 않는다.
      const hero = wrap.closest(".journey-hero")
      const lines: DOMRect[] = []
      hero?.querySelectorAll(".journey-hero-copy h1, .journey-hero-copy p, .journey-hero-navigation a").forEach((el) => {
        // 글자 노드만 잰다. 요소째 재면 블록 span 의 줄 전체 폭이 잡힌다.
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        const range = document.createRange()
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          range.selectNodeContents(node)
          lines.push(...range.getClientRects())
        }
      })
      const box = wrap.getBoundingClientRect()
      const scale = box.width / size
      const sorted = [...dots].sort((a, b) => a.p.y - b.p.y)
      const bandTop = box.top + (sorted[0]?.p.y ?? 0) * scale - LABEL_GAP
      const bandBottom = box.top + ((sorted[sorted.length - 1]?.p.y ?? 0) + LABEL_GAP * sorted.length) * scale
      const textRight = Math.max(-Infinity, ...lines.filter((l) => l.bottom > bandTop && l.top < bandBottom).map((l) => l.right))
      const columnX = Math.max(Math.max(...dots.map((d) => d.p.x)) + size * COLUMN_OFFSET, (textRight + 24 - box.left) / scale)
      let lastY = -Infinity
      leaders.setAttribute("viewBox", `0 0 ${size} ${size}`)
      leaders.replaceChildren()
      for (const { i, hq, p } of sorted) {
        const label = labelRefs.current[i]
        if (!label) continue
        const y = Math.max(p.y, lastY + LABEL_GAP)
        lastY = y
        label.style.left = `${(columnX / size) * 100}%`
        label.style.top = `${(y / size) * 100}%`
        const line = document.createElementNS("http://www.w3.org/2000/svg", "path")
        line.setAttribute("d", `M ${p.x} ${p.y} L ${columnX - 8} ${y}`)
        line.setAttribute("class", hq ? "is-hq" : "")
        line.dataset.index = String(i)
        leaders.append(line)
      }

      // 그래도 글자 뒤에 깔리거나 화면 오른쪽 띠(진행 표시)를 넘는 라벨이 하나라도 있으면, 일부만 남겨
      // 어색해지지 않도록 라벨과 지시선을 모두 숨긴다. 점과 항로는 남고, 거점 정보는 네트워크 섹션에 있다.
      const limit = window.innerWidth - 96
      const placed = labelRefs.current.filter((label): label is HTMLSpanElement => !!label)
      placed.forEach((label) => { label.style.visibility = "" })
      const blocked = placed.some((label) => {
        const t = label.getBoundingClientRect()
        return t.right > limit || lines.some((l) => t.left < l.right && l.left < t.right && t.top < l.bottom && l.top < t.bottom)
      })
      placed.forEach((label) => { label.style.visibility = blocked ? "hidden" : "" })
      leaders.style.visibility = blocked ? "hidden" : ""
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
