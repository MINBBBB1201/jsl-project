"use client"

import type { ReactNode } from "react"
import { INDUSTRIAL_STAGES } from "./industrial-motion"

export type IndustrialService = { code: string; title: string; summary: string; href: string }
export type IndustrialLink = (href: string, children: ReactNode, className?: string) => ReactNode
const MODE_NAMES = ["AIR", "OCEAN", "ROAD", "RAIL", "EXPRESS"]

type Props = {
  services: IndustrialService[]
  title: string
  description: string
  mode: number
  stage: number
  onMode: (index: number) => void
  onStage: (index: number) => void
  onSkip: () => void
  renderLink: IndustrialLink
}

export function IndustrialScenes({ services, title, description, mode, stage, onMode, onStage, onSkip, renderLink }: Props) {
  const selected = mode >= 0 ? services[mode] : undefined
  const step = INDUSTRIAL_STAGES[stage]
  return <>
    <div className="industrial-port industrial-background" aria-hidden="true" />
    <div className="industrial-warehouse industrial-background" aria-hidden="true" />
    <div className="industrial-shade" aria-hidden="true" />
    <div className="industrial-vehicle" aria-hidden="true">
      {/* A single cutout keeps the painted container, trailer and tires together. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/landing/industrial/truck.webp" width={1774} height={887} alt="" decoding="async" />
    </div>
    <div className="industrial-transport-ui">
      <div className="industrial-transport-copy">
        <p className="industrial-eyebrow">JSL / TRANSPORT SERVICES</p>
        <h2 id="industrial-service-title" key={`title-${mode}`}>{selected?.title ?? title}</h2>
        <p className="industrial-service-description" key={`summary-${mode}`}>{selected?.summary ?? description}</p>
        {renderLink(selected?.href ?? "#contact", <><span>{selected ? "VIEW SERVICE" : "EXPLORE SERVICES"}</span><span aria-hidden="true">↗</span></>, "industrial-action")}
      </div>
      <nav className="industrial-modes" aria-label="Transport modes">
        {services.map((service, index) => <button key={service.code} type="button" onClick={() => onMode(index)} aria-pressed={(mode < 0 ? 1 : mode) === index}>
          <span className="industrial-mode-number">0{index + 1}</span><span>{MODE_NAMES[index]}</span>
        </button>)}
      </nav>
    </div>
    <div className="industrial-journey-ui" inert>
      <div className="industrial-journey-heading">
        <p className="industrial-eyebrow">JSL / THE SHIPMENT JOURNEY</p>
        <h2>Connected at<br />every step.</h2>
      </div>
      <p className="industrial-step-copy" key={step.label}>{step.copy}</p>
      <div className="industrial-step-nav">
        <div className="industrial-step-label"><span>0{stage + 1} / 07</span><strong>{step.label}</strong></div>
        <div className="industrial-step-line"><span /></div>
        <nav aria-label="Shipment journey stages">
          {INDUSTRIAL_STAGES.map((item, index) => <button key={item.label} type="button" onClick={() => onStage(index)} aria-label={`Stage ${index + 1}: ${item.label}`} aria-pressed={stage === index}>0{index + 1}</button>)}
        </nav>
      </div>
    </div>
    <button className="industrial-skip" type="button" onClick={onSkip}>Skip journey <span aria-hidden="true">↓</span></button>
    <div className="industrial-static-content">
      <h2>{title}</h2><p>{description}</p>
      {services.map(service => <div key={service.code}><h3>{service.title}</h3><p>{service.summary}</p>{renderLink(service.href, "View service ↗")}</div>)}
      <h2>Connected at every step.</h2>
      {INDUSTRIAL_STAGES.map((item, index) => <div key={item.label}><h3>0{index + 1} / {item.label}</h3><p>{item.copy}</p></div>)}
    </div>
  </>
}
