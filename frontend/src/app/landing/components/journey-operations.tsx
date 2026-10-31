"use client"

import { useContent } from "@/config/use-content"
import { CountUp } from "./count-up"
import { HeroOpsPanel } from "./hero-ops-panel"
import { usePublicSummary } from "./use-public-summary"
import { SceneHeader, TwoToneHeading, MonoLabel } from "./journey-kit"

/**
 * Operations on the sea ground, like the ocean leg: the monthly volume per mode as a manifest
 * and the live public summary underneath. Company figures already open the page in the intro,
 * so they are not repeated here. The live panel keeps its own loading/demo labelling and is
 * dropped when the API fails.
 */
export function JourneyOperations({ index, total }: { index: number; total: number }) {
  const { monthlyVolumes, volumesHeading } = useContent()
  const { data, isLoading, isError } = usePublicSummary()
  return <section id="operations" className="jk-section jk-sea" aria-labelledby="jk-ops-title">
    <SceneHeader path="OPERATIONS" index={index} total={total} />
    <div className="jk-split">
      <div className="jk-section-intro">
        <TwoToneHeading lead={<span id="jk-ops-title">{volumesHeading.title}</span>} />
        <p className="jk-lead">{volumesHeading.description}</p>
      </div>
      <ol className="jk-manifest">
        {monthlyVolumes.map(volume => <li key={volume.mode}>
          <MonoLabel className="jk-muted">{volume.mode}</MonoLabel>
          <strong className="tabular-figures"><CountUp value={volume.value} /></strong>
          <MonoLabel className="jk-muted">{volume.unit}</MonoLabel>
        </li>)}
      </ol>
    </div>
    {!isError && <div className="jk-live"><HeroOpsPanel data={data} isLoading={isLoading} /></div>}
  </section>
}
