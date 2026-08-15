import Link from 'next/link'

import { Separator } from '@/components/ui/separator'
import type { LegalDocument } from '@/config/legal-content'
import { legalDocuments } from '@/config/legal-content'

interface LegalArticleProps {
  document: LegalDocument
}

export function LegalArticle({ document }: LegalArticleProps) {
  const others = legalDocuments.filter((doc) => doc.slug !== document.slug)

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

        <Separator className="my-12" />

        {/* 다른 문서로 이동 */}
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {others.map((doc) => (
            <Link
              key={doc.slug}
              href={`/${doc.slug}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {doc.title} →
            </Link>
          ))}
        </nav>
      </div>
    </article>
  )
}
