import { Info } from 'lucide-react'

import { Separator } from '@/components/ui/separator'
import { Link } from '@/i18n/navigation'
import type { LegalDocument } from '@/config/legal-content'

interface LegalArticleProps {
  document: LegalDocument
  /** 다른 법적 문서로 가는 링크 */
  otherDocuments?: { slug: string; title: string }[]
}

export function LegalArticle({ document, otherDocuments = [] }: LegalArticleProps) {
  return (
    <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        {/* 제목 */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {document.title}
          </h1>
          <p className="mt-3 text-muted-foreground">{document.description}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {document.effectiveNote}
          </p>
        </header>

        {/*
          번역본 우선순위 고지.
          법적 문서는 표현 하나가 의무 범위를 바꿀 수 있어, 번역본에는
          한국어본이 우선한다는 점을 본문 앞에 명시한다.
        */}
        {document.precedenceNotice && (
          <div className="mb-10 flex gap-3 rounded-md border bg-muted/50 p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {document.precedenceNotice}
            </p>
          </div>
        )}

        <Separator className="mb-10" />

        {/* 머리말 */}
        {document.intro && (
          <p className="text-base leading-relaxed text-muted-foreground mb-12">
            {document.intro}
          </p>
        )}

        {/* 본문 */}
        <div className="space-y-10">
          {document.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                {section.heading}
              </h2>

              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-base leading-relaxed text-muted-foreground mb-3 last:mb-0"
                >
                  {paragraph}
                </p>
              ))}

              {section.bullets && (
                <ul className="mt-3 space-y-2">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-2 text-base leading-relaxed text-muted-foreground"
                    >
                      <span aria-hidden className="select-none">
                        ·
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {otherDocuments.length > 0 && (
          <>
            <Separator className="my-12" />
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {otherDocuments.map((doc) => (
                <Link
                  key={doc.slug}
                  href={doc.slug === 'privacy' ? '/privacy' : '/terms'}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {doc.title} →
                </Link>
              ))}
            </nav>
          </>
        )}
      </div>
    </article>
  )
}
