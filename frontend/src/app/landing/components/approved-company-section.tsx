"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { useLocale } from "next-intl"
import { SiteLink } from "@/components/site-link"
import { useContent } from "@/config/use-content"
import "./approved-company.css"

const conceptMediaCaptions: Record<string, string> = {
  ko: "AI로 제작한 물류 현장 콘셉트 이미지. 실제 JSL 시설 사진이 아닙니다.",
  en: "AI-generated logistics concept. Not a photograph of a JSL facility.",
  zh: "AI 生成的物流场景示意图，非 JSL 实际设施照片。",
  vi: "Hình ý tưởng logistics do AI tạo, không phải ảnh cơ sở thực tế của JSL.",
}

type CompanyMediaStyle = CSSProperties & {
  "--jsl-ac-media-position"?: string
  "--jsl-ac-media-position-mobile"?: string
}

type ApprovedCompanySectionProps = {
  /** Generated concept media; the default caption explicitly identifies it. */
  mediaSrc?: string
  /** 폭별 후보(srcset). 큰 원본 하나만 내려보내지 않도록 모바일용 축소본을 함께 준다. */
  mediaSrcSet?: string
  mediaCaption?: string
  mediaPosition?: { desktop: string; mobile: string }
  /** Compatibility with the isolated reference preview. Not for public media. */
  previewMedia?: string
}

/**
 * 승인된 회사소개 장면 — 화면 대부분을 차지하는 현장 매체 위로 큰 제목이 가로지르는 구도.
 *
 * 원본: design-direction-20261024/connected-scroll/company-frame.html + trust-pilot/scene.css.
 * 브랜드 제목은 승인 초안 문구를 유지하고, 설명·가치·CTA는 about 번역 값을 쓴다. 매체는 mediaSrc 또는 previewMedia 가 있을 때만
 * 보여 주며, 없거나 불러오지 못해도 아래 상세 영역의 본문·가치·CTA 는 그대로 읽힌다.
 * 인증 정보는 바깥의 CertificationsBar 가 표시하므로 여기서 다시 그리지 않는다.
 */
export function ApprovedCompanySection({
  mediaSrc,
  mediaSrcSet,
  mediaCaption,
  mediaPosition,
  previewMedia,
}: ApprovedCompanySectionProps) {
  const { about } = useContent()
  const locale = useLocale()
  const source = mediaSrc ?? previewMedia
  const caption = mediaCaption ?? (mediaSrc ? (conceptMediaCaptions[locale] ?? conceptMediaCaptions.en) : undefined)
  const [failedMedia, setFailedMedia] = useState<string | null>(null)
  const showMedia = Boolean(source) && failedMedia !== source
  const mediaRef = useRef<HTMLImageElement>(null)
  const mediaStyle: CompanyMediaStyle | undefined = mediaPosition
    ? {
        "--jsl-ac-media-position": mediaPosition.desktop,
        "--jsl-ac-media-position-mobile": mediaPosition.mobile,
      }
    : undefined

  // 서버가 그린 img 가 hydrate 전에 실패하면 onError 가 오지 않는다. decode 로 한 번 더 확인한다.
  useEffect(() => {
    const img = mediaRef.current
    if (!img || !source) return
    let alive = true
    img.decode().catch(() => {
      if (alive) setFailedMedia(source)
    })
    return () => {
      alive = false
    }
  }, [source])

  return (
    <section id="about" className="jsl-ac" aria-labelledby="jsl-ac-title">
      <div className={showMedia ? "jsl-ac__scene jsl-ac__scene--media" : "jsl-ac__scene"}>
        {showMedia && (
          // 장면 높이는 CSS로 고정되어 있다. 로컬 매체는 cover 크롭을 유지한다.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={mediaRef}
            className="jsl-ac__media"
            src={source}
            srcSet={mediaSrc ? mediaSrcSet : undefined}
            sizes="100vw"
            style={mediaStyle}
            alt=""
            aria-hidden="true"
            decoding="async"
            onError={() => setFailedMedia(source ?? null)}
          />
        )}
        <div className="jsl-ac__shade" aria-hidden="true" />
        <p className="jsl-ac__label">
          JSL LOGISTICS <span aria-hidden="true">/</span> {about.badge}
        </p>
        <h2 id="jsl-ac-title" className="jsl-ac__title">
          <span lang="en">Every move.</span>{" "}
          <em lang="en">One JSL.</em>
        </h2>
        <div className="jsl-ac__wordmark" aria-hidden="true">
          JSL
        </div>
        <div className="jsl-ac__foot">
          <p className="jsl-ac__summary">{about.title}</p>
          <a href="#about-detail" className="jsl-ac__link">
            {about.valuesTitle} <span aria-hidden="true">↘</span>
          </a>
        </div>
      </div>

      {showMedia && caption && <p className="jsl-ac__media-caption">{caption}</p>}

      <div id="about-detail" className="jsl-ac__detail">
        <p className="jsl-ac__description">{about.description}</p>
        <h3 className="jsl-ac__values-title">{about.valuesTitle}</h3>
        <ul className="jsl-ac__values">
          {about.values.map((value) => (
            <li key={value.title} className="jsl-ac__value">
              <value.icon className="jsl-ac__icon" aria-hidden />
              <h4>{value.title}</h4>
              <p>{value.description}</p>
            </li>
          ))}
        </ul>
        <div className="jsl-ac__cta">
          <p>{about.ctaText}</p>
          <div className="jsl-ac__actions">
            <SiteLink className="jsl-ac__primary" href={about.primaryCta.href}>
              {about.primaryCta.label}
            </SiteLink>
            <SiteLink className="jsl-ac__secondary" href={about.secondaryCta.href}>
              {about.secondaryCta.label}
            </SiteLink>
          </div>
        </div>
      </div>
    </section>
  )
}
