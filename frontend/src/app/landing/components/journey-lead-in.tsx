import { SceneHeader, MonoLabel } from "./journey-kit"

/**
 * Lead-in to the pinned transport sequence, replacing the stock yard scene. It names only
 * the four legs the sequence actually shows, on a measured rule that the road scene picks up;
 * no new routes, times or volumes are introduced here.
 */
const LEGS = ["ROAD", "OPERATIONS", "OCEAN", "AIR"] as const

export function JourneyLeadIn({ index, total }: { index: number; total: number }) {
  return <section className="jk-section jk-paper jk-lead-in" aria-label="Transport sequence: road, operations, ocean and air">
    <SceneHeader path="ROAD · OCEAN · AIR" index={index} total={total} />
    <ol className="jk-legs">
      {LEGS.map((leg, i) => <li key={leg}><MonoLabel>{String(i + 1).padStart(2, "0")}</MonoLabel><span>{leg}</span></li>)}
    </ol>
    <div className="jk-rule-scale" aria-hidden="true" />
    <MonoLabel className="jk-muted jk-scroll-cue">SCROLL ↓</MonoLabel>
  </section>
}
