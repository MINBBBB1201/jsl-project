"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "@/i18n/navigation"
import { useContent } from "@/config/use-content"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { IndustrialJourney } from "./industrial-journey"
import { css, markup, runJslMultimodal } from "../multimodal/jsl-multimodal.mjs"
import "./multimodal-journey.css"

type Guest = HTMLElement & {
  ucRender?: () => void
  marineRuntime?: { dispose(): void; renderer: { forceContextLoss(): void } }
}

// Mode order of the guest's service buttons (`data-mode`).
const GUEST_MODES = ["AIR", "SEA", "TRUCK", "RAIL", "EXPRESS"]
// The guest's road, operations and process frames finish at 31% of its range.
const SERVICE_PHASE_END = 0.31
// Review copy inside the generated markup; the landing exposes English labels.
const LABELS: [string, string, string][] = [
  [".uc-screen", "aria-label", "JSL transport journey: road, ocean and air"],
  [".uc-service-nav", "aria-label", "Transport modes"],
  [".uc-process-nav", "aria-label", "Cargo process"],
  [".mm-mode-nav", "aria-label", "Journey scenes"],
  [".uc-truck", "alt", ""],
  [".uc-field-photo", "alt", ""],
]
const started = new WeakSet<Element>()

/** Slot 03: the reviewed road → cargo → sea → cloud → air sequence, driven by page scroll. */
export function MultimodalJourney() {
  const { services } = useContent()
  const reduced = usePrefersReducedMotion()
  const root = useRef<HTMLElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const exit = useRef<() => void>(() => {})
  const [copy, setCopy] = useState<HTMLElement | null>(null)
  const [header, setHeader] = useState<HTMLElement | null>(null)
  const [selected, setSelected] = useState(-1)
  const [servicePhase, setServicePhase] = useState(true)

  useEffect(() => {
    const element = root.current
    const container = host.current
    if (!element || !container || reduced) return
    // React never renders into this container, so it cannot replace the DOM the engine binds to.
    if (!container.firstElementChild) container.innerHTML = markup
    const guest = container.querySelector<Guest>("#jsl-marine-native")!
    const range = guest.querySelector<HTMLInputElement>("input[type=range]")!
    const modes = guest.querySelector<HTMLElement>(".uc-service-nav")!
    if (!started.has(guest)) {
      started.add(guest)
      for (const [selector, name, value] of LABELS) guest.querySelector(selector)?.setAttribute(name, value)
      runJslMultimodal()
    }
    setCopy(guest.querySelector<HTMLElement>(".uc-main-copy"))
    setHeader(guest.querySelector<HTMLElement>(".uc-header"))
    const readMode = () => setSelected(Number(modes.querySelector<HTMLElement>("[aria-pressed=true]")?.dataset.mode ?? -1))
    const observer = new MutationObserver(readMode)
    observer.observe(modes, { subtree: true, attributes: true, attributeFilter: ["aria-pressed"] })
    readMode()

    let cancelled = false
    let cleanup = () => {}
    void import("three").then(THREE => {
      if (cancelled) return
      Object.assign(window, { JslMarineThree: THREE })
      window.dispatchEvent(new Event("jsl-marine-ready"))
    })
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)
      const context = gsap.context(() => {
        const stage = element.querySelector<HTMLElement>(".multimodal-stage")!
        const driver = { progress: 0 }
        const draw = () => {
          range.value = (driver.progress * 100).toFixed(2)
          guest.ucRender?.()
          setServicePhase(driver.progress < SERVICE_PHASE_END)
        }
        draw()
        const tween = gsap.to(driver, {
          progress: 1, ease: "none", onUpdate: draw,
          scrollTrigger: {
            id: "jsl-multimodal", trigger: element, pin: stage,
            start: "top top", end: () => `+=${window.innerHeight * 14}`,
            scrub: 0.35, invalidateOnRefresh: true, onRefresh: draw,
          },
        })
        const trigger = tween.scrollTrigger!
        let scrollTween: ReturnType<typeof gsap.to> | undefined
        const move = (y: number) => {
          scrollTween?.kill()
          const position = { y: window.scrollY }
          scrollTween = gsap.to(position, { y, duration: 0.8, ease: "power2.inOut", onUpdate: () => window.scrollTo({ top: position.y, behavior: "instant" }) })
        }
        // Guest buttons jump the range themselves. Return to the scrolled frame and let
        // the page scroll there, so scroll position and scene stay one value.
        const follow = (event: MouseEvent) => {
          if (!(event.target as Element).closest("button")) return
          const target = Number(range.value) / 100
          if (Math.abs(target - driver.progress) < 0.0005) return
          draw()
          move(trigger.start + target * (trigger.end - trigger.start))
        }
        guest.addEventListener("click", follow)
        exit.current = () => move(trigger.end + window.innerHeight)
        return () => { scrollTween?.kill(); guest.removeEventListener("click", follow); exit.current = () => {} }
      }, element)
      cleanup = () => context.revert()
      void document.fonts.ready.then(() => { if (!cancelled) ScrollTrigger.refresh() })
    })
    return () => {
      cancelled = true
      cleanup()
      observer.disconnect()
      // Strict Mode remounts the same node; release the GPU only once the guest has left the page.
      setTimeout(() => {
        if (guest.isConnected) return
        guest.marineRuntime?.dispose()
        guest.marineRuntime?.renderer.forceContextLoss()
      }, 0)
    }
  }, [reduced])

  // The reduced-motion journey already lists every mode with its service link.
  if (reduced) return <IndustrialJourney />

  const service = services.modes.find(item => item.code === GUEST_MODES[selected])
  return <section id="features" className="multimodal-journey" ref={root} lang="en" aria-label="JSL transport services and shipment journey">
    <div id="cargo-journey" className="multimodal-cargo-anchor" aria-hidden="true" />
    <div className="multimodal-stage">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="multimodal-guest" ref={host} />
      {copy && servicePhase && createPortal(
        <Link href={service?.href ?? "#contact"} className="multimodal-action"><span>{service ? "VIEW SERVICE" : "EXPLORE SERVICES"}</span><span aria-hidden="true">↗</span></Link>,
        copy,
      )}
      {/* The guest header keeps the logo and counter clear of the scene and its bottom navigation. */}
      {header && createPortal(
        <button className="multimodal-skip" type="button" onClick={() => exit.current()}>Skip journey <span aria-hidden="true">↓</span></button>,
        header,
      )}
    </div>
  </section>
}
