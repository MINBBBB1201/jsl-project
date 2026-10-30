"use client"

import { useState } from "react"
import { SiteLink } from "@/components/site-link"
import { useContent } from "@/config/use-content"
import "./approved-company.css"

/**
 * 승인된 회사소개 장면 — 화면 대부분을 차지하는 현장 매체 위로 큰 제목이 가로지르는 구도.
 *
 * 원본: design-direction-20261024/connected-scroll/company-frame.html + trust-pilot/scene.css.
 * 문구는 전부 useContent().about 의 번역 값을 쓴다. 매체는 previewMedia 가 있을 때만
 * 보여 주며, 없거나 불러오지 못해도 아래 상세 영역의 본문·가치·CTA 는 그대로 읽힌다.
 * 인증 정보는 바깥의 CertificationsBar 가 표시하므로 여기서 다시 그리지 않는다.
 */
export function ApprovedCompanySection({ previewMedia }: { previewMedia?: string }) {
  const { about } = useContent()
  const [failedMedia, setFailedMedia] = useState<string | null>(null)
  const showMedia = Boolean(previewMedia) && failedMedia !== previewMedia

  return (
    <section id="about" className="jsl-ac" aria-labelledby="jsl-ac-title">
      <div className={showMedia ? "jsl-ac__scene jsl-ac__scene--media" : "jsl-ac__scene"}>
        {showMedia && (
          // 외부 참고 매체는 URL prop 으로만 받는다. 크기를 알 수 없어 next/image 대신 img 를 쓴다.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="jsl-ac__media"
            src={previewMedia}
            alt=""
            aria-hidden="true"
            decoding="async"
            onError={() => setFailedMedia(previewMedia ?? null)}
          />
        )}
        <div className="jsl-ac__shade" aria-hidden="true" />
        <p className="jsl-ac__label">
          JSL LOGISTICS <span aria-hidden="true">/</span> {about.badge}
        </p>
        <h2 id="jsl-ac-title" className="jsl-ac__title">
          {about.title}
        </h2>
        <div className="jsl-ac__wordmark" aria-hidden="true">
          JSL
        </div>
        <div className="jsl-ac__foot">
          <a href="#about-detail" className="jsl-ac__link">
            {about.valuesTitle} <span aria-hidden="true">↘</span>
          </a>
        </div>
      </div>

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
