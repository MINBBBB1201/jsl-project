"use client"

import { useLocale } from 'next-intl'

import { useContent } from '@/config/use-content'
import { CountUp } from './count-up'
import './stats-section.css'

const companyHeading = {
  ko: '숫자로 보는 JSL',
  en: 'JSL, in numbers',
  zh: 'JSL 数据概览',
  vi: 'JSL qua những con số',
} as const

/** Monthly transport first; existing company figures remain the secondary reading. */
export function StatsSection() {
  const { stats, monthlyVolumes, volumesHeading } = useContent()
  const locale = useLocale() as keyof typeof companyHeading

  return (
    <section className="jsl-stats" aria-labelledby="jsl-stats-title">
      <div className="jsl-stats__inner">
        <div className="jsl-stats__transport">
          <header className="jsl-stats__intro">
            <h2 id="jsl-stats-title" className="jsl-stats__heading">
              {volumesHeading.title}
            </h2>
            <p className="jsl-stats__description">{volumesHeading.description}</p>
          </header>

          <dl className="jsl-stats__volumes">
            {monthlyVolumes.map((volume) => (
              <div className="jsl-stats__volume" key={volume.mode}>
                <dt className="jsl-stats__mode">{volume.mode}</dt>
                <dd className="jsl-stats__volume-value">
                  <CountUp value={volume.value} className="jsl-stats__count" />
                  <span className="jsl-stats__unit">{volume.unit}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <aside className="jsl-stats__company" aria-labelledby="jsl-stats-company-title">
          <h3 id="jsl-stats-company-title" className="jsl-stats__company-heading">
            {companyHeading[locale] ?? companyHeading.ko}
          </h3>
          <dl className="jsl-stats__company-figures">
            {stats.map((stat) => (
              <div className="jsl-stats__company-row" key={stat.label}>
                <dt className="jsl-stats__company-label">{stat.label}</dt>
                <dd className="jsl-stats__company-value">
                  <CountUp value={stat.value} />
                </dd>
                <dd className="jsl-stats__company-detail">{stat.description}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  )
}
