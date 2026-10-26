"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "@/i18n/navigation"
import { useContent } from "@/config/use-content"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { IndustrialJourney } from "./industrial-journey"
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

/** Move keyboard focus without scrolling, making a plain section focusable for the moment. */
function focusQuietly(target: Element | null) {
  if (!(target instanceof HTMLElement)) return
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1")
  target.focus({ preventScroll: true })
}

/** Slot 03: the reviewed road → cargo → sea → cloud → air sequence, driven by page scroll. */
export function MultimodalJourney() {
  const { services } = useContent()
  const reduced = usePrefersReducedMotion()
  const root = useRef<HTMLElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const exit = useRef<() => void>(() => {})
  const action = useRef<HTMLAnchorElement>(null)
  const skip = useRef<HTMLButtonElement>(null)
  const [copy, setCopy] = useState<HTMLElement | null>(null)
  const [header, setHeader] = useState<HTMLElement | null>(null)
  const [selected, setSelected] = useState(-1)
  const [servicePhase, setServicePhase] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    const element = root.current
    const container = host.current
    if (!element || !container || reduced) return
    let cancelled = false
    let navigationVersion = 0
    let pendingSkip = false
    let skippedY = 0
    const teardown: (() => void)[] = []
    // Until GSAP is ready, or if it never loads, skipping still lands on the next section.
    const jumpPast = () => {
      pendingSkip = true
      navigationVersion++
      element.nextElementSibling?.scrollIntoView({ behavior: "instant" })
      skippedY = window.scrollY
      focusQuietly(element.nextElementSibling)
    }
    // Pin setup and refresh must not move content that an early skip already reached.
    const preserveSkippedView = () => {
      const next = element.nextElementSibling
      if (!pendingSkip || window.scrollY < skippedY - 1 || !next) {
        pendingSkip = false
        return
      }
      const top = next.getBoundingClientRect().top
      return () => {
        if (!pendingSkip || !next.isConnected) return
        window.scrollBy({ top: next.getBoundingClientRect().top - top, behavior: "instant" })
        skippedY = window.scrollY
      }
    }
    exit.current = jumpPast

    // The engine, Three.js and GSAP load only as the section approaches, never for the first view.
    const start = async () => {
      const { css, markup, runJslMultimodal } = await import("../multimodal/jsl-multimodal.mjs")
      if (cancelled) return
      // React never renders into this container, so it cannot replace the DOM the engine binds to.
      if (!container.querySelector("#jsl-marine-native")) container.innerHTML = `<style>${css}</style>${markup}`
      setLoadFailed(false)
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
      teardown.push(() => {
        observer.disconnect()
        // Strict Mode remounts the same node; release the GPU only once the guest has left the page.
        setTimeout(() => {
          if (guest.isConnected) return
          guest.marineRuntime?.dispose()
          guest.marineRuntime?.renderer.forceContextLoss()
        }, 0)
      })

      void import("three").then(THREE => {
        if (cancelled) return
        Object.assign(window, { JslMarineThree: THREE })
        window.dispatchEvent(new Event("jsl-marine-ready"))
      }).catch(() => {}) // without Three.js the engine keeps its static fallback
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)
      const restoreAfterPin = preserveSkippedView()
      const context = gsap.context(() => {
        const stage = element.querySelector<HTMLElement>(".multimodal-stage")!
        const driver = { progress: 0 }
        const draw = () => {
          const focusedAction = action.current && document.activeElement === action.current ? action.current : null
          range.value = (driver.progress * 100).toFixed(2)
          guest.ucRender?.()
          const inServicePhase = driver.progress < SERVICE_PHASE_END
          // The engine can make the link inert before React removes it. Capture focus before rendering.
          if (focusedAction && (!inServicePhase || !focusedAction.isConnected || focusedAction.closest("[inert]"))) skip.current?.focus({ preventScroll: true })
          setServicePhase(inServicePhase)
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
        const move = (y: number, done?: () => void) => {
          scrollTween?.kill()
          const position = { y: window.scrollY }
          scrollTween = gsap.to(position, { y, duration: 0.8, ease: "power2.inOut", onUpdate: () => window.scrollTo({ top: position.y, behavior: "instant" }), onComplete: done })
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
        exit.current = () => {
          pendingSkip = false
          navigationVersion++
          move(trigger.end + window.innerHeight, () => focusQuietly(element.nextElementSibling))
        }
        return () => { scrollTween?.kill(); guest.removeEventListener("click", follow); exit.current = jumpPast }
      }, element)
      restoreAfterPin?.()
      teardown.push(() => context.revert())
      // Refresh restores the scroll position it measured, so callers scroll only after it.
      await document.fonts.ready
      if (!cancelled) {
        const restoreAfterRefresh = preserveSkippedView()
        ScrollTrigger.refresh()
        restoreAfterRefresh?.()
      }
    }

    // A failed chunk leaves the section on its fallback skip instead of breaking the page.
    let loading: Promise<void> | null = null
    const ensure = () => (loading ??= start().catch(() => {
      if (!cancelled && !container.querySelector("#jsl-marine-native")) setLoadFailed(true)
    }))
    const near = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return
      near.disconnect()
      void ensure()
    }, { rootMargin: "150% 0px" })
    near.observe(element)

    // Loading mid-scroll inserts the pin spacer and cuts a smooth anchor scroll short, so anchors
    // to this section load first and scroll once the layout has settled.
    const anchors = new Set(["#features", "#cargo-journey"])
    const goHere = () => {
      pendingSkip = false
      const version = ++navigationVersion
      void ensure().then(() => {
        if (cancelled || version !== navigationVersion) return
        window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY, behavior: "smooth" })
        // Keyboard and screen-reader position follow the scroll instead of staying on the link.
        focusQuietly(element)
      })
    }
    const onAnchorClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]")
      if (!link || link.origin !== window.location.origin || link.pathname !== window.location.pathname || !anchors.has(link.hash)) return
      event.preventDefault()
      history.pushState(null, "", link.hash)
      goHere()
    }
    document.addEventListener("click", onAnchorClick)
    if (anchors.has(window.location.hash)) goHere()
    return () => {
      cancelled = true
      near.disconnect()
      document.removeEventListener("click", onAnchorClick)
      for (const run of teardown.splice(0)) run()
    }
  }, [reduced])

  // The reduced-motion journey already lists every mode with its service link.
  if (reduced) return <IndustrialJourney />

  const service = services.modes.find(item => item.code === GUEST_MODES[selected])
  return <section id="features" className="multimodal-journey" ref={root} lang="en" aria-label="JSL transport services and shipment journey">
    <div id="cargo-journey" className="multimodal-cargo-anchor" aria-hidden="true" />
    <div className="multimodal-stage">
      <div className="multimodal-guest" ref={host} />
      {loadFailed && <div className="multimodal-load-fallback" role="status">
        <p>Unable to load the transport journey.</p>
        <button type="button" onClick={() => exit.current()}>Skip journey <span aria-hidden="true">↓</span></button>
      </div>}
      {copy && servicePhase && createPortal(
        <Link ref={action} href={service?.href ?? "#contact"} className="multimodal-action"><span>{service ? "VIEW SERVICE" : "EXPLORE SERVICES"}</span><span aria-hidden="true">↗</span></Link>,
        copy,
      )}
      {/* The guest header keeps the logo and counter clear of the scene and its bottom navigation. */}
      {header && createPortal(
        <button ref={skip} className="multimodal-skip" type="button" onClick={() => exit.current()}>Skip journey <span aria-hidden="true">↓</span></button>,
        header,
      )}
    </div>
  </section>
}
