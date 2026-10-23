"use client"

import { useContent } from "@/config/use-content"
import { SceneHeader, TwoToneHeading, MonoLabel } from "./journey-kit"

/**
 * Network as a sea chart: the five directly operated offices plotted from their real
 * coordinates on a plain longitude/latitude grid, with routes from Seoul. No coastline
 * is drawn, so nothing pretends to be a map it is not; the office list carries the facts.
 */
const COORDINATES: Record<string, [number, number]> = {
  Seoul: [126.98, 37.57], Weihai: [122.12, 37.51], Shanghai: [121.47, 31.23], Guangzhou: [113.26, 23.13], Hanoi: [105.85, 21.03],
}
const BOX = { west: 102, east: 131, south: 18, north: 41 }
const W = 1000, H = 760
const project = ([lon, lat]: [number, number]) => [((lon - BOX.west) / (BOX.east - BOX.west)) * W, ((BOX.north - lat) / (BOX.north - BOX.south)) * H] as const

// Weihai sits just west of Seoul on the same parallel; its label goes left so it clears the route.
const LABEL_LEFT = new Set(["Weihai"])

export function JourneyNetwork({ index, total }: { index: number; total: number }) {
  const { network, redesign } = useContent()
  // "4명" stays tight; a word unit such as "staff" needs a space.
  const people = (count: number) => `${count}${/^[A-Za-z]/.test(network.headcountUnit) ? " " : ""}${network.headcountUnit}`
  const hub = network.items.find(office => office.isHq)
  const hubPoint = hub ? project(COORDINATES[hub.cityEn] ?? [0, 0]) : null
  const meridians = [105, 110, 115, 120, 125, 130], parallels = [20, 25, 30, 35, 40]

  return <section id="network" className="jk-section jk-sea" aria-labelledby="jk-network-title">
    <SceneHeader path={network.badge.toUpperCase()} index={index} total={total} />
    <div className="jk-network-grid">
      <div className="jk-network-copy">
        <TwoToneHeading lead={<span id="jk-network-title">{network.title}</span>} />
        <p className="jk-lead">{network.description}</p>
        <dl className="jk-figures">
          {redesign.hero.stats.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}
        </dl>
      </div>
      <figure className="jk-chart" aria-label={network.title}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-hidden="true">
          {meridians.map(lon => { const [x] = project([lon, BOX.south]); return <g key={lon}><line x1={x} y1={0} x2={x} y2={H} className="jk-chart-grid" /><text x={x + 6} y={H - 10} className="jk-chart-tick">{lon}°E</text></g> })}
          {parallels.map(lat => { const [, y] = project([BOX.west, lat]); return <g key={lat}><line x1={0} y1={y} x2={W} y2={y} className="jk-chart-grid" /><text x={6} y={y - 6} className="jk-chart-tick">{lat}°N</text></g> })}
          {hubPoint && network.items.filter(office => !office.isHq).map(office => {
            const [x, y] = project(COORDINATES[office.cityEn] ?? [0, 0])
            return <line key={office.cityEn} x1={hubPoint[0]} y1={hubPoint[1]} x2={x} y2={y} className="jk-chart-route" />
          })}
          {network.items.map(office => {
            const [x, y] = project(COORDINATES[office.cityEn] ?? [0, 0])
            const left = LABEL_LEFT.has(office.cityEn), dx = left ? -14 : 14, anchor = left ? "end" : "start"
            return <g key={office.cityEn} transform={`translate(${x} ${y})`}>
              <rect x={-5} y={-5} width={10} height={10} className={office.isHq ? "jk-chart-hub" : "jk-chart-node"} />
              <text x={dx} y={4} textAnchor={anchor} className="jk-chart-label">{office.cityEn.toUpperCase()}</text>
              <text x={dx} y={22} textAnchor={anchor} className="jk-chart-tick">{people(office.headcount)}</text>
            </g>
          })}
        </svg>
      </figure>
    </div>
    <ol className="jk-rows">
      {network.items.map((office, i) => <li key={office.cityEn}>
        <MonoLabel>{String(i + 1).padStart(2, "0")}</MonoLabel>
        <div><h3>{office.city}</h3><MonoLabel className="jk-muted">{office.cityEn} · {office.role} · {people(office.headcount)}</MonoLabel></div>
        <p>{office.description}</p>
      </li>)}
    </ol>
    <MonoLabel className="jk-note">{network.totalLabel}</MonoLabel>
  </section>
}
