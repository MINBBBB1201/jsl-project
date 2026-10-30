import type { ReactNode } from "react"
import { SiteLink } from "@/components/site-link"
// 쓰는 쪽이 따로 불러오지 않아도 머리줄 배치가 깨지지 않게 여기서 불러온다.
import "./journey-kit.css"

/**
 * Shared pieces of the landing's visual language, taken from the transport sequence:
 * a monospace route header with a counter, a two-tone headline and the single orange
 * square arrow. Sections compose these instead of badges, cards and pill buttons.
 */

/**
 * "JSL / GLOBAL NETWORK ······ 05 / 11". The counter marks stops on the journey only;
 * supporting sections (certifications, partners) pass no index and keep just the route.
 */
export function SceneHeader({ path, index, total }: { path: string; index?: number; total?: number }) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return <div className="jk-scene-header" aria-hidden="true">
    <span className="jk-mono">JSL / {path}</span>
    {index && total ? <span className="jk-mono jk-counter">{pad(index)} / {pad(total)}</span> : null}
  </div>
}

/** First line in the foreground colour, second line toned down, like the sequence titles. */
export function TwoToneHeading({ lead, tail, as: Tag = "h2", className = "" }: { lead: ReactNode; tail?: ReactNode; as?: "h2" | "h3"; className?: string }) {
  return <Tag className={`jk-heading ${className}`}><span>{lead}</span>{tail ? <span className="jk-heading-tail">{tail}</span> : null}</Tag>
}

export function MonoLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`jk-mono ${className}`}>{children}</span>
}

/** The only accent: a label followed by an orange square arrow. */
export function OrangeArrowLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return <SiteLink href={href} className={`jk-arrow-link ${className}`}><span>{children}</span><span className="jk-arrow" aria-hidden="true">↗</span></SiteLink>
}

/** Secondary action: plain underlined text, no button chrome. */
export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return <SiteLink href={href} className="jk-text-link">{children}</SiteLink>
}
