"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, Plus } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useContent } from "@/config/use-content"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import english from "@/messages/en.json"
import "./emons-transport.css"

// Frame boundaries observed in the public Emons 46-second service film.
// Temporary reference footage: see docs/landing/TEMP-ASSETS.md.
const SEGMENTS = [
  { start: 0, end: 216, transition: 0 },
  { start: 258, end: 403, transition: 220 },
  { start: 470, end: 614, transition: 410 },
  { start: 662, end: 788, transition: 622 },
  { start: 827, end: 1091, transition: 795 },
]
const FRAME_SECONDS = 46 / 1103

export function EmonsTransport() {
  const { services: localizedServices } = useContent()
  // Reference comparison uses the existing JSL English copy in every locale.
  const services = { ...localizedServices, ...english.services, modeCta: { label: english.services.modeCta }, modes: localizedServices.modes.map(mode => ({ ...mode, ...english.services.modes[mode.code as keyof typeof english.services.modes] })) }
  const reduced = usePrefersReducedMotion()
  const root = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const select = useRef<(index: number) => void>(() => {})
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [mediaFailed, setMediaFailed] = useState(false)
  const modeCodes = services.modes.map(mode => mode.code.toLowerCase()).join(",")

  useEffect(() => {
    const element = root.current
    const film = video.current
    if (!element || !film) return
    let cancelled = false
    let cleanup = () => {}
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)
      const media = gsap.matchMedia()
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const panels = gsap.utils.toArray<HTMLElement>(".emons-panel", element)
        const stage = element.querySelector<HTMLElement>(".emons-stage")!
        let index = 0
        let transitioning = false
        let tween: ReturnType<typeof gsap.timeline> | undefined
        let exitTween: ReturnType<typeof gsap.to> | undefined
        let loopStart = SEGMENTS[0].start * FRAME_SECONDS
        let loopEnd = SEGMENTS[0].end * FRAME_SECONDS
        const play = () => { void film.play().catch(() => { /* Poster remains visible until playback is allowed. */ }) }
        const loop = () => {
          if (film.currentTime >= loopEnd - 0.1) { film.currentTime = loopStart; play() }
        }
        film.addEventListener("timeupdate", loop)
        const ready = () => { film.currentTime = loopStart; play() }
        film.addEventListener("loadedmetadata", ready)
        gsap.set(panels, { yPercent: 100, autoAlpha: 0 })
        gsap.set(panels[0], { yPercent: 0, autoAlpha: 1 })
        setActive(0)
        setExpanded(null)
        if (film.readyState >= 1) ready()

        const change = (next: number, immediate = false) => {
          next = Math.max(0, Math.min(4, next))
          if (next === index && !immediate) return
          const direction = next >= index ? 1 : -1
          const previous = index
          index = next
          setActive(next)
          setExpanded(null)
          const segment = SEGMENTS[next]
          loopStart = segment.start * FRAME_SECONDS
          loopEnd = segment.end * FRAME_SECONDS
          if (film.readyState >= 1) {
            film.currentTime = (direction > 0 && !immediate ? segment.transition : segment.start) * FRAME_SECONDS
            play()
          }
          tween?.kill()
          transitioning = !immediate
          gsap.set(panels, { autoAlpha: 0 })
          gsap.set(panels[previous], { autoAlpha: 1 })
          gsap.set(panels[next], { autoAlpha: 1 })
          tween = gsap.timeline({ onComplete: () => { transitioning = false } })
            .to(panels[previous], { yPercent: -100 * direction, duration: immediate ? 0 : 1, ease: "power1.inOut" }, 0)
            .fromTo(panels[next], { yPercent: 100 * direction }, { yPercent: 0, duration: immediate ? 0 : 1, ease: "power1.inOut" }, 0)
        }
        const observerRef: { current?: ReturnType<typeof ScrollTrigger.observe> } = {}
        const trigger = ScrollTrigger.create({
          id: "jsl-emons-transport",
          trigger: element,
          pin: stage,
          start: "top top",
          end: () => `+=${window.innerHeight * 5}`,
          invalidateOnRefresh: true,
          onUpdate: self => { change(Math.min(4, Math.floor(self.progress * 5))) },
          onToggle: self => { if (self.isActive) observerRef.current?.enable(); else { observerRef.current?.disable(); film.pause() } },
          onEnter: () => play(),
          onEnterBack: () => play(),
        })
        const seek = (next: number) => {
          if (transitioning) return
          if (next < 0 || next > 4) {
            observerRef.current?.disable()
            if (next < 0) window.scrollTo({ top: trigger.start - 2, behavior: "instant" })
            else {
              // Scroll through the overlapping Freezpak entrance instead of skipping it.
              transitioning = true
              const position = { y: window.scrollY }
              exitTween?.kill()
              exitTween = gsap.to(position, { y: trigger.end + 2, duration: 1, ease: "power2.inOut", onUpdate: () => window.scrollTo({ top: position.y, behavior: "instant" }), onComplete: () => { transitioning = false } })
            }
            return
          }
          window.scrollTo({ top: trigger.start + (next + 0.05) * (trigger.end - trigger.start) / 5, behavior: "instant" })
          ScrollTrigger.update()
        }
        const observer = ScrollTrigger.observe({
          target: window, type: "wheel,touch", preventDefault: true,
          wheelSpeed: -1, tolerance: 10,
          ignore: ".emons-detail",
          onUp: () => seek(index + 1),
          onDown: () => seek(index - 1),
        })
        observerRef.current = observer
        observer.disable()
        if (trigger.isActive) observer.enable()
        select.current = next => seek(next)
        const hash = () => {
          const next = modeCodes.split(",").indexOf(location.hash.slice(1))
          if (next >= 0) {
            transitioning = false
            seek(next)
            change(next, true)
          }
        }
        window.addEventListener("hashchange", hash)
        hash()
        trigger.refresh()
        return () => {
          select.current = () => {}
          window.removeEventListener("hashchange", hash)
          film.removeEventListener("timeupdate", loop)
          film.removeEventListener("loadedmetadata", ready)
          film.pause()
          observer.kill()
          trigger.kill()
          tween?.kill()
          exitTween?.kill()
        }
      }, element)
      cleanup = () => media.revert()
    })
    return () => { cancelled = true; cleanup() }
  }, [modeCodes])

  return <section id="features" className="emons-transport" ref={root} aria-label={services.title} lang="en">
    <div className="emons-stage" data-active-mode={active}>
      <video ref={video} className="emons-film" src="/images/landing/emons/services.mp4" poster="/images/landing/emons/poster.webp" preload="auto" muted playsInline aria-hidden="true" onError={() => setMediaFailed(true)} />
      {mediaFailed && <p className="emons-media-status" role="status">{services.badge}</p>}
      {services.modes.map((mode, index) => <div className="emons-panel" key={mode.code} aria-hidden={reduced ? undefined : active !== index}>
        <div className="emons-hotspot" style={{ left: ["28.5%", "40.5%", "56%", "48%", "67%"][index], top: ["37%", "29%", "38%", "35%", "34%"][index] }}>
          <button type="button" className="emons-plus" aria-label={mode.title} aria-expanded={expanded === index} aria-controls={`emons-detail-${mode.code}`} tabIndex={active === index ? 0 : -1} onClick={() => setExpanded(expanded === index ? null : index)}><Plus size={16} /></button>
          <div id={`emons-detail-${mode.code}`} className="emons-detail" hidden={expanded !== index}>
            <h3>{mode.title}</h3><p>{mode.summary}</p>
            <Link href={mode.href}>{services.modeCta.label}<ArrowRight size={18} /></Link>
          </div>
        </div>
        <div className="emons-copy" id={mode.code.toLowerCase()}>
          <h2>{services.title}</h2><p className="emons-description">{services.description}</p>
          <div className="emons-actions"><Link href={mode.href} tabIndex={reduced || active === index ? 0 : -1}>{mode.title}<ArrowRight size={14}/></Link><Link href="/landing#contact" tabIndex={reduced || active === index ? 0 : -1}>{english.nav.quoteCta}</Link></div>
        </div>
      </div>)}
      <nav className="emons-modes" aria-label={services.badge}>
        {services.modes.map((mode, index) => <button type="button" key={mode.code} aria-label={mode.title} aria-current={active === index ? "step" : undefined} className={active === index ? "is-active" : ""} onClick={() => select.current(index)}><span className="emons-number">0{index + 1}</span><span className="emons-icon"><mode.icon size={20}/></span><span className="emons-mode-label">{mode.title}</span></button>)}
      </nav>
    </div>
  </section>
}
