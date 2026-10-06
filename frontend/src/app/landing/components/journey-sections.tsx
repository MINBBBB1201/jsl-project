"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUpRight, Globe2, ShieldCheck, Users } from "lucide-react";
import { useContent } from "@/config/use-content";
import { SiteLink } from "@/components/site-link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CountUp as NumericText } from "./count-up";

const Globe = dynamic(() => import("./journey-globe"), { ssr: false });
const asset = (name: string) => `/images/journey/${name}`;

/** Local, decorative assets; explicit sizes prevent jumps and lazy loading keeps the first view small. */
function SceneImage({ name, className = "", priority = false }: { name: string; className?: string; priority?: boolean }) {
  return <Image src={asset(name)} alt="" aria-hidden="true" fill sizes="(max-width: 700px) 100vw, 80vw" unoptimized priority={priority} className={className} />;
}

/** One passive scroll listener, no React state updates, no scroll hijacking. */
export function useJourneyMotion() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-scene]"));
    const progressOutput = root.querySelector<HTMLOutputElement>("[data-journey-progress]");
    let frame = 0;
    const paint = () => {
      frame = 0;
      const scrollRange = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const pageProgress = Math.max(0, Math.min(1, scrollY / scrollRange));
      root.style.setProperty("--page-progress", String(pageProgress));
      if (progressOutput) progressOutput.value = String(Math.round(pageProgress * 100)).padStart(2, "0");
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
        section.style.setProperty("--progress", String(reduced.matches ? 0.5 : p));
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); reveal.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    root.querySelectorAll(".journey-reveal").forEach((el) => reveal.observe(el));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);
    paint();
    return () => {
      cancelAnimationFrame(frame); reveal.disconnect();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); reduced.removeEventListener("change", schedule);
    };
  }, []);
  return ref;
}

export function JourneyProgressRail() {
  const stops = [["#hero", "01"], ["#what-we-do", "02"], ["#features", "03"], ["#network", "04"], ["#contact", "05"]] as const;
  return <aside className="journey-progress-rail" aria-label="Page sections"><output data-journey-progress aria-label="Scroll progress">00</output><div className="journey-progress-track" aria-hidden="true"><span /></div><nav>{stops.map(([href, label]) => <a key={href} href={href} aria-label={`Section ${label}`}>{label}</a>)}</nav><span aria-hidden="true">JSL / 5+1</span></aside>;
}

export function JourneyHero() {
  const { redesign, navigation } = useContent();
  const { hero } = redesign;
  const tracking = navigation.items.find((item) => item.href.includes("tracking"));
  return <section id="hero" className="journey-hero" data-scene>
    <div className="journey-utility"><span>JSL NETWORK: SEOUL · SHANGHAI · WEIHAI · GUANGZHOU · HANOI</span>{tracking && <SiteLink href={tracking.href}>{tracking.name} <ArrowUpRight size={12} /></SiteLink>}</div>
    <div className="journey-stars" aria-hidden="true" />
    <div className="journey-orbit" aria-hidden="true"><div className="journey-sphere" /><Globe /><div className="journey-rim" /><div className="journey-orbit-line" /><span className="journey-geo journey-geo-seoul"><i />SEOUL</span><span className="journey-geo journey-geo-shanghai"><i />SHANGHAI</span><span className="journey-geo journey-geo-hanoi"><i />HANOI</span></div>
    <div className="journey-hero-navigation"><nav aria-label={navigation.items[0].name}>{navigation.items.filter((item) => !item.megaMenu).map((item) => <SiteLink key={item.href} href={item.href}>{item.name}</SiteLink>)}</nav><LanguageSwitcher /></div>
    <div className="journey-hero-copy"><p className="journey-eyebrow">{hero.eyebrow}</p><h1><span>{hero.headline1}</span><span>{hero.headline2}</span></h1><p className="journey-hero-description">{hero.subheadline}</p><div className="journey-actions"><SiteLink href={hero.primaryCta.href} className="journey-pill">{hero.primaryCta.label}<ArrowUpRight size={15} /></SiteLink><SiteLink href={hero.secondaryCta.href} className="journey-pill journey-pill-outline">{hero.secondaryCta.label}</SiteLink></div></div>
    <a href="#what-we-do" className="journey-scroll" aria-label={hero.secondaryCta.label}><ArrowDown size={18} /><span>01 — 05</span></a>
    <div className="journey-hero-index" aria-hidden="true"><span>37.5665° N</span><span>126.9780° E</span></div><div className="journey-horizon" aria-hidden="true" />
  </section>;
}

export function JourneyIntro() {
  const { redesign, stats } = useContent();
  return <section id="what-we-do" className="journey-intro journey-pad" data-scene><div className="journey-intro-title journey-reveal"><div className="journey-intro-thumb"><SceneImage name="intro.jpg" /></div><p className="journey-eyebrow">{redesign.whatWeDo.eyebrow}</p><h2>{redesign.whatWeDo.title}<span>{redesign.hero.headline2}</span></h2></div><div className="journey-intro-right"><p className="journey-lead">{redesign.hero.subheadline}</p><div className="journey-intro-services">{redesign.whatWeDo.cards.map((card) => <div key={card.title}><h3>{card.title}</h3><p>{card.description}</p></div>)}</div><dl className="journey-figures">{stats.map((stat) => <div key={stat.label} className="journey-reveal"><dt>{stat.label}</dt><dd><NumericText value={stat.value} /></dd><p>{stat.description}</p></div>)}</dl></div></section>;
}

export function JourneyYard() {
  return <div className="journey-yard" data-scene aria-hidden="true"><div className="journey-yard-hud"><strong>00</strong><span>KM/H</span></div><div className="journey-yard-rule"><span>01</span><span>02</span><span>03</span><span>04</span></div><div className="journey-loader"><SceneImage name="loader.avif" /></div><div className="journey-loader-wire" /><div className="journey-container journey-container-blue"><SceneImage name="container-blue.avif" /></div><div className="journey-container journey-container-orange"><SceneImage name="container-orange.avif" /></div><div className="journey-container journey-container-white"><SceneImage name="container-white.avif" /></div><div className="journey-ground" /><div className="journey-truck-side"><SceneImage name="truck.avif" /></div></div>;
}

export function JourneyServiceStage() {
  const { redesign } = useContent();
  return <section className="journey-service-stage" data-scene><div className="journey-service-truck" aria-hidden="true"><SceneImage name="truck.avif" /></div><div className="journey-service-speed" aria-hidden="true"><strong>05</strong><span>MODES</span></div><div className="journey-service-stage-copy journey-reveal"><p className="journey-eyebrow">ONE OPERATION · EVERY ROUTE</p><h2><span>{redesign.whatWeDo.title}</span><span>{redesign.hero.headline2}</span></h2><p>{redesign.hero.subheadline}</p></div><div className="journey-service-ruler" aria-hidden="true"><span>000</span><span>250</span><span>500</span><span>750</span><span>1000</span></div></section>;
}

export function JourneyRoad() {
  const { redesign } = useContent(); const why = redesign.whyJsl; const icons = [ShieldCheck, Globe2, Users];
  return <section className="journey-road" data-scene><div className="journey-road-bend" aria-hidden="true" /><div className="journey-road-corridor" aria-hidden="true">SEOUL&nbsp;&nbsp; → &nbsp;&nbsp;SHANGHAI&nbsp;&nbsp; → &nbsp;&nbsp;HANOI</div><div className="journey-road-asphalt" aria-hidden="true"><div className="journey-road-route"><span>01</span><span>02</span><span>03</span><span>04</span></div><div className="journey-road-truck"><div className="journey-road-cab"><SceneImage name="truck-top.avif" /></div><div className="journey-road-load"><SceneImage name="container-top.avif" /></div></div></div><div className="journey-road-title"><p className="journey-eyebrow">{why.eyebrow}</p><h2>{why.title}</h2><p>{why.description}</p><div className="journey-road-highlight"><strong>{why.highlight.value}</strong><span>{why.highlight.label}</span></div></div><div className="journey-milestones">{why.cards.map((card, i) => { const Icon = icons[i]; return <article key={card.title} className="journey-reveal"><Icon size={27} strokeWidth={1} /><p className="journey-eyebrow">0{i + 1} / JSL</p><h3>{card.title}</h3><p>{card.subtitle}</p><strong>{why.stats[i].value}</strong><span>{why.stats[i].label}</span></article>; })}</div></section>;
}

export function JourneyOcean() {
  const { network, redesign } = useContent();
  return <section className="journey-ocean" data-scene><div className="journey-water" aria-hidden="true" /><div className="journey-depth-grid" aria-hidden="true" /><div className="journey-ship" aria-hidden="true"><div className="journey-ship-top"><SceneImage name="ship.avif" /></div><div className="journey-ship-bottom"><SceneImage name="ship-bottom.avif" /></div></div><div className="journey-ocean-ports" aria-hidden="true"><span>SEL</span><span>SHA</span><span>WEH</span><span>CAN</span><span>HAN</span></div><div className="journey-cloud journey-cloud-left" aria-hidden="true"><SceneImage name="cloud-left.avif" /></div><div className="journey-cloud journey-cloud-right" aria-hidden="true"><SceneImage name="cloud-right.avif" /></div><div className="journey-ocean-copy journey-reveal"><p className="journey-eyebrow">GLOBAL NETWORK</p><h2>{network.title}</h2><p>{network.description}</p><div className="journey-ocean-stats">{redesign.hero.stats.map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div><SiteLink href="#network" className="journey-pill">{network.badge}<ArrowDown size={15} /></SiteLink></div></section>;
}

export function JourneyPartners() {
  const { partners } = useContent();
  return <section className="journey-partners journey-pad"><div className="journey-section-heading"><p className="journey-eyebrow">OUR PARTNERS</p><h2>{partners.title}</h2><p>{partners.description}</p></div>{partners.groups.map((group) => <div key={group.label} className="journey-partner-group"><h3>{group.label}</h3><div className="journey-partner-grid">{group.items.map((item) => <div key={item.name}>{item.logo ? <Image src={item.logo.src} alt={item.name} width={160} height={65} className="journey-partner-logo" /> : <span>{item.name}</span>}</div>)}</div></div>)}</section>;
}

export function JourneyCta() {
  const { ctaBand } = useContent();
  return <section className="journey-cta" data-scene><p className="journey-eyebrow">JSL LOGISTICS</p><h2>{ctaBand.title}</h2><p className="journey-cta-description">{ctaBand.description}</p><SiteLink href={ctaBand.cta.href} className="journey-pill">{ctaBand.cta.label}<ArrowUpRight size={16} /></SiteLink></section>;
}

export function JourneyPlane() {
  return <div className="journey-plane" data-scene aria-hidden="true"><div><SceneImage name="plane.avif" /></div></div>;
}
