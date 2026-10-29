import { useLocale } from 'next-intl'
import type { ComponentProps } from 'react'
// Harness only: Next routing/hydration is a separate release check.
export function Link({ href, ...props }: ComponentProps<'a'>) {
  const locale = useLocale()
  return <a href={`${locale === 'ko' ? '' : '/' + locale}${href}`} {...props} />
}
