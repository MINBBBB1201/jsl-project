import type { Metadata } from 'next'

import { LegalArticle } from '@/components/legal/legal-article'
import { privacyPolicy } from '@/config/legal-content'

export const metadata: Metadata = {
  title: `${privacyPolicy.title} - JSL Logistics`,
  description: privacyPolicy.description,
}

export default function PrivacyPage() {
  return <LegalArticle document={privacyPolicy} />
}
