"use client"

import { useEffect, useRef, useState } from "react"
import "./freezpak-lifecycle.css"

// JSL English copy; the original source's seven-stage timing and layout are preserved.
const COPY = [
  "Your shipment arrives at the port. JSL coordinates the route, unloading and customs requirements before the next stage of its journey.",
  "Road and multimodal connections carry your freight from the port to the warehouse, connecting China, Korea and Southeast Asia.",
  "Warehousing, inventory management and bonded facilities support your cargo while the next shipment is prepared for dispatch.",
  "Picking, packing and labelling prepare each shipment for its destination, with handling requirements kept together throughout the process.",
  "Air, ocean, road, rail and express services connect your shipment to the route that fits its lead time and budget.",
  "Door-to-door express services carry your shipment through the final stage, with shipment status connected to JSL's own API system.",
  "Real-time shipment status and logistics reports keep your team informed. One point of contact connects every stage of the journey.",
]
const TEXT_WINDOWS = [[0,2,24,26],[24,26,38,40],[38,40,50,52],[50,52,64,66],[64,66,78,80],[78,80,88,90],[88,90,100,102]]
const clamp = (value: number) => Math.max(0, Math.min(1, value))

export function FreezpakLifecycle() {
  const root = useRef<HTMLElement>(null)
  const mediaHost = useRef<HTMLDivElement>(null)
  const skip = useRef<() => void>(() => {})
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const element = root.current, host = mediaHost.current
    if (!element || !host) return
    let cancelled = false
    let cleanup = () => {}
    Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("lottie-web")]).then(([{ gsap }, { ScrollTrigger }, { default: lottie }]) => {
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)
      const queries = gsap.matchMedia()
      for (const mobile of [false, true]) queries.add(mobile ? "(max-width:767px) and (prefers-reduced-motion:no-preference)" : "(min-width:768px) and (prefers-reduced-motion:no-preference)", () => {
        let disposed = false
        const animation = lottie.loadAnimation({ container: host, renderer: "svg", loop: false, autoplay: false, path: `/images/landing/freezpak/${mobile ? "mobile" : "desktop"}.json`, rendererSettings: { preserveAspectRatio: "xMidYMid meet", progressiveLoad: false } })
        const title = element.querySelector<HTMLElement>(".freezpak-title")!
        const paragraphs = Array.from(element.querySelectorAll<HTMLElement>(".freezpak-description"))
        const skipControl = element.querySelector<HTMLElement>(".freezpak-skip")!
        const progressBar = element.querySelector<HTMLElement>(".freezpak-bar span")!
        const driver = { progress: 0 }
        let navigation: ReturnType<typeof gsap.to> | undefined
        const draw = () => {
          if (disposed || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
          const p = driver.progress
          const frame = clamp((p - 5) / 95) * (animation.totalFrames || 2400) * .999
          animation.goToAndStop(frame, true)
          element.dataset.frame = frame.toFixed(2)
          element.dataset.progress = p.toFixed(3)
          if (mobile) gsap.set(title, { y: `${20 * (1-clamp((p-2)/4))}vh`, opacity: 1-clamp((p-2)/4), scale: 1 })
          else gsap.set(title, { y: 0, scale: 1-.7*(1-Math.pow(1-clamp((p-5)/3),2)), opacity: 1 })
          paragraphs.forEach((paragraph, index) => {
            const [inStart,inEnd,outStart,outEnd] = TEXT_WINDOWS[index]
            const entering = clamp((p-inStart)/(inEnd-inStart)), leaving = clamp((p-outStart)/(outEnd-outStart))
            const opacity = Math.min(entering,1-leaving)
            gsap.set(paragraph, { y: 0, yPercent: p < inEnd ? 100*(1-entering) : -100*leaving, opacity })
            paragraph.setAttribute("aria-hidden", opacity < .5 ? "true" : "false")
          })
          gsap.set(skipControl, { opacity: clamp((p-10)/2), yPercent: mobile ? 0 : -100*(1-clamp((p-10)/2)) })
          skipControl.inert = p <= 10
          progressBar.style.width = `${p}%`
        }
        const ready = () => { if (!disposed) { element.dataset.ready = "true"; draw() } }
        const error = () => { if (!disposed) setFailed(true) }
        animation.addEventListener("DOMLoaded", ready)
        animation.addEventListener("data_failed", error)
        const timeline = gsap.to(driver, { progress: 100, duration: 1, ease: "none", onUpdate: draw, scrollTrigger: { id: "jsl-freezpak-lifecycle", trigger: element, start: "top top", end: () => `+=${window.innerHeight * 22.08}`, scrub: .25, invalidateOnRefresh: true, onRefresh: self => { element.dataset.scrollStart = String(self.start); element.dataset.scrollEnd = String(self.end) } } })
        skip.current = () => {
          navigation?.kill()
          const position = { y: window.scrollY }
          navigation = gsap.to(position, { y: element.getBoundingClientRect().top + window.scrollY + element.offsetHeight, duration: .8, ease: "power2.inOut", onUpdate: () => window.scrollTo({ top: position.y, behavior: "instant" }) })
        }
        draw()
        return () => { disposed = true; skip.current = () => {}; navigation?.kill(); timeline.scrollTrigger?.kill(); timeline.kill(); animation.destroy(); paragraphs.forEach(paragraph => paragraph.removeAttribute("aria-hidden")); delete element.dataset.ready }
      }, element)
      queries.add("(prefers-reduced-motion:reduce)", () => {
        element.querySelectorAll(".freezpak-description").forEach(paragraph => paragraph.removeAttribute("aria-hidden"))
      }, element)
      cleanup = () => queries.revert()
    }).catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true; cleanup() }
  }, [])

  return <section className="freezpak-lifecycle" id="cargo-journey" ref={root} aria-label="The journey of your shipment" lang="en">
    <div className="freezpak-stage">
      <div className="freezpak-media" aria-hidden="true"><div ref={mediaHost} className="freezpak-animation" /></div>
      <div className="freezpak-texts"><div className="freezpak-container">
        <h2 className="freezpak-title">Peace of mind.<br/>Delivered.</h2>
        <div className="freezpak-content">{COPY.map((text,index) => <p key={text} className="freezpak-description" data-step={index+1}>{text}</p>)}</div>
        <div className="freezpak-skip"><button type="button" onClick={() => skip.current()}>Skip introduction</button><div className="freezpak-bar" aria-hidden="true"><span/></div></div>
      </div></div>
      {failed && <p className="freezpak-fallback" role="status">The journey continues through port, warehouse, transport and delivery.</p>}
    </div>
  </section>
}
