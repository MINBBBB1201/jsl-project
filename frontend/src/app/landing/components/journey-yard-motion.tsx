"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useContent } from "@/config/use-content";
import "./journey-yard-motion.css";

const asset = (name: string) => `/images/journey/${name}`;

function Sprite({ name, eager = false }: { name: string; eager?: boolean }) {
  return <Image src={asset(name)} alt="" fill sizes="100vw" unoptimized loading={eager ? "eager" : "lazy"} />;
}

/** Scroll-bound container loading sequence for journey section 14. */
export function JourneyYardMotion() {
  const rootRef = useRef<HTMLElement>(null);
  const { redesign } = useContent();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) { root.dataset.frame = "load"; return; }
    let cancelled = false;
    let context: { revert: () => void } | undefined;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      context = gsap.context(() => {
        const loader = root.querySelector<HTMLElement>(".yard-motion-loader")!;
        const cargo = root.querySelector<HTMLElement>(".yard-motion-cargo")!;
        const door = root.querySelector<HTMLElement>(".yard-motion-cargo-door")!;
        const side = root.querySelector<HTMLElement>(".yard-motion-cargo-side")!;
        const truck = root.querySelector<HTMLElement>(".yard-motion-truck")!;
        const stack = root.querySelector<HTMLElement>(".yard-motion-stack")!;
        const copy = root.querySelector<HTMLElement>(".yard-motion-copy")!;
        const speed = root.querySelector<HTMLElement>(".yard-motion-hud strong")!;
        gsap.set(truck, { left: "34%", top: "70.625%", width: 760, height: 175, opacity: 0 });
        gsap.set(copy, { opacity: 0 });
        gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root, start: "top top", end: "+=360%", pin: true, scrub: 0.55, anticipatePin: 1, invalidateOnRefresh: true },
        })
          .to(loader, { left: "17%", bottom: "10%", duration: 0.2 }, 0.03)
          .to(cargo, { left: "27%", top: "39%", width: 650, height: 150, duration: 0.22 }, 0.03)
          .to(door, { opacity: 0, scaleX: 0.08, duration: 0.11 }, 0.08)
          .fromTo(side, { opacity: 0, scaleX: 0.08 }, { opacity: 1, scaleX: 1, duration: 0.10 }, 0.13)
          .to(stack, { opacity: 0.35, duration: 0.16 }, 0.14)
          .to(truck, { left: "34%", opacity: 1, duration: 0.28 }, 0.28)
          .to(loader, { left: "-7%", bottom: "7.5%", width: 330, height: 286, opacity: 0.72, duration: 0.28 }, 0.30)
          .to(cargo, { left: "34%", top: "70.625%", width: 780, height: 175, duration: 0.28 }, 0.30)
          .to(stack, { opacity: 0, duration: 0.14 }, 0.34)
          .to(truck, { opacity: 1, duration: 0.02 }, 0.58)
          .to(loader, { opacity: 0, duration: 0.12 }, 0.58)
          .to(truck, { left: "52%", duration: 0.22 }, 0.68)
          .to(cargo, { left: "52%", duration: 0.22 }, 0.68)
          .to(copy, { opacity: 1, duration: 0.16 }, 0.68)
          .to(speed, { textContent: "62", snap: { textContent: 1 }, duration: 0.22 }, 0.68);
      }, root);
      ScrollTrigger.refresh();
    });
    return () => { cancelled = true; context?.revert(); };
  }, []);

  return <section ref={rootRef} className="journey-yard-motion" data-scene data-frame="start" aria-label="JSL container loading storyboard">
    <div className="yard-motion-hud" aria-hidden="true"><strong>00</strong><span>KM/H</span></div>
    <div className="yard-motion-stage" aria-hidden="true">
      <div className="yard-motion-stack"><div><Sprite name="container-blue.avif" eager /></div><div><Sprite name="container-orange.avif" eager /></div></div>
      <div className="yard-motion-loader"><Sprite name="loader-crop.webp" eager /></div>
      <div className="yard-motion-cargo">
        <div className="yard-motion-cargo-door"><Sprite name="container-orange.avif" eager /></div>
        <div className="yard-motion-cargo-side"><Sprite name="container-jsl-side.webp" eager /></div>
      </div>
      <div className="yard-motion-truck"><Sprite name="truck.avif" eager /></div>
    </div>
    <div className="yard-motion-copy"><p className="journey-eyebrow">ONE OPERATION · EVERY ROUTE</p><h2>{redesign.whatWeDo.title}<br />{redesign.hero.headline2}</h2><p>{redesign.hero.subheadline}</p></div>
  </section>;
}



