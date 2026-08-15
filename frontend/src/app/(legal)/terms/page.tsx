import type { Metadata } from 'next'

import { LegalArticle } from '@/components/legal/legal-article'
import { termsOfService } from '@/config/legal-content'

export const metadata: Metadata = {
  title: `${termsOfService.title} - JSL Logistics`,
  description: termsOfService.description,
}

export default function TermsPage() {
  return <LegalArticle document={termsOfService} />
}
