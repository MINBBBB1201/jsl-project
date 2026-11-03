"use client";

import { useEffect, useRef } from "react";
import { JourneyHero } from "./journey-sections";
import "./journey-hero-motion.css";

/** A long scroll track keeps the hero fixed while its exit plays against scroll progress. */
export function JourneyHeroMotion() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let context: { revert: () => void } | undefined;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      context = gsap.context(() => {
        const hero = root.querySelector<HTMLElement>(".journey-hero");
        const orbit = root.querySelector<HTMLElement>(".journey-orbit");
        const copy = root.querySelector<HTMLElement>(".journey-hero-copy");
        const navigation = root.querySelector<HTMLElement>(".journey-hero-navigation");
        const stars = root.querySelector<HTMLElement>(".journey-stars");
        const horizon = root.querySelector<HTMLElement>(".journey-horizon");
        if (!hero || !orbit || !copy || !navigation || !stars || !horizon) return;

        gsap.set(horizon, { yPercent: 170 });
        const wash = { y: 110 };
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.45, invalidateOnRefresh: true },
        });
        timeline
          .to(orbit, { xPercent: 17, yPercent: -11, scale: 1.18, duration: 0.65 }, 0)
          .to(stars, { opacity: 0.12, duration: 0.6 }, 0)
          .to(copy, { yPercent: -16, clipPath: "inset(100% 0 0 0)", opacity: 0, duration: 0.34 }, 0.18)
          .to(navigation, { yPercent: -60, opacity: 0, duration: 0.25 }, 0.16)
          .to(horizon, { yPercent: 0, duration: 0.56 }, 0.36)
          // CSS 변수 문자열을 GSAP 가 직접 트윈하면 시작값이 refresh 뒤 사라지거나 되감을 때
          // 0% 로 남아 위로 올려도 주황 막이 덮여 있었다. 숫자를 트윈하고 변수는 직접 쓴다.
          .to(wash, { y: 0, duration: 0.54, onUpdate: () => hero.style.setProperty("--hero-wash-y", `${wash.y}%`) }, 0.46);
      }, root);
      ScrollTrigger.refresh();
    });

    return () => { cancelled = true; context?.revert(); };
  }, []);

  return <div ref={ref} className="journey-hero-motion"><JourneyHero /></div>;
}
