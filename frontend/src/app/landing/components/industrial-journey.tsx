"use client"

import { useEffect, useRef, useState } from "react"
import { Link } from "@/i18n/navigation"
import { useContent } from "@/config/use-content"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import english from "@/messages/en.json"
import { IndustrialScenes, type IndustrialLink } from "./industrial-scenes"
import { industrialFrame, modeProgress, stageProgress } from "./industrial-motion"
import "./industrial-journey.css"

const renderLink: IndustrialLink = (href, children, className) => <Link href={href} className={className}>{children}</Link>

export function IndustrialJourney() {
  const { services } = useContent()
  const reduced = usePrefersReducedMotion()
  const root = useRef<HTMLElement>(null)
  const navigation = useRef<(progress: number) => void>(() => {})
  const exit = useRef<() => void>(() => {})
  const [mode, setMode] = useState(-1)
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const element = root.current
    if (!element || reduced) return
    let cancelled = false
    let cleanup = () => {}
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)
      const context = gsap.context(() => {
        const stageElement = element.querySelector<HTMLElement>(".industrial-stage")!
        const truck = element.querySelector<HTMLElement>(".industrial-vehicle")!
        const port = element.querySelector<HTMLElement>(".industrial-port")!
        const warehouse = element.querySelector<HTMLElement>(".industrial-warehouse")!
        const transportUi = element.querySelector<HTMLElement>(".industrial-transport-ui")!
        const journeyUi = element.querySelector<HTMLElement>(".industrial-journey-ui")!
        const heading = element.querySelector<HTMLElement>(".industrial-journey-heading")!
        const line = element.querySelector<HTMLElement>(".industrial-step-line span")!
        const driver = { progress: 0 }
        // State survives a reduced-motion toggle even when its driver resets.
        let lastMode = -2, lastStage = -1
        const draw = () => {
          const frame = industrialFrame(driver.progress, window.innerWidth < 768)
          element.dataset.progress = frame.p.toFixed(4)
          element.dataset.stage = String(frame.stage)
          gsap.set(truck, { left: `${frame.truckX}%`, width: `${frame.truckWidth}%`, bottom: `${frame.truckBottom}%`, filter: `brightness(${frame.night})` })
          gsap.set(port, { scale: frame.portScale, xPercent: frame.portX })
          gsap.set(warehouse, { scale: frame.warehouseScale, clipPath: `inset(0 ${100 * (1 - frame.warehouse)}% 0 0)` })
          gsap.set(transportUi, { autoAlpha: frame.transportOpacity, y: -20 * (1 - frame.transportOpacity) })
          gsap.set(journeyUi, { autoAlpha: frame.journeyOpacity })
          gsap.set(heading, { y: 24 * (1 - frame.journeyOpacity) })
          gsap.set(line, { scaleX: (frame.stage + 1) / 7 })
          transportUi.inert = frame.transportOpacity < 0.5
          journeyUi.inert = frame.journeyOpacity < 0.5
          if (frame.mode !== lastMode) { lastMode = frame.mode; setMode(frame.mode) }
          if (frame.stage !== lastStage) { lastStage = frame.stage; setStage(frame.stage) }
        }
        draw()
        const tween = gsap.to(driver, {
          progress: 1, ease: "none", onUpdate: draw,
          scrollTrigger: {
            id: "jsl-industrial-pair", trigger: element, pin: stageElement,
            start: "top top", end: () => `+=${window.innerHeight * 10}`,
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
        navigation.current = progress => move(trigger.start + progress * (trigger.end - trigger.start))
        exit.current = () => move(trigger.end + window.innerHeight)
        return () => { scrollTween?.kill(); navigation.current = () => {}; exit.current = () => {} }
      }, element)
      cleanup = () => context.revert()
      // Image decode and fonts do not change the fixed-height stage, but preceding
      // preserved scenes can settle later. Refresh only after those assets settle.
      void document.fonts.ready.then(() => { if (!cancelled) ScrollTrigger.refresh() })
    })
    return () => { cancelled = true; cleanup() }
  }, [reduced])

  const modes = services.modes.map(item => ({ ...item, ...english.services.modes[item.code as keyof typeof english.services.modes] }))
  return <section id="features" className={`industrial-journey${reduced ? " is-reduced" : ""}`} ref={root} lang="en" aria-label="JSL transport services and shipment journey">
    <div id="cargo-journey" className="industrial-cargo-anchor" aria-hidden="true" />
    <div className="industrial-stage">
      <IndustrialScenes services={modes} title={english.services.title} description={english.services.description} mode={mode} stage={stage}
        onMode={index => navigation.current(modeProgress(index))} onStage={index => navigation.current(stageProgress(index))}
        onSkip={() => exit.current()} renderLink={renderLink} />
    </div>
  </section>
}
