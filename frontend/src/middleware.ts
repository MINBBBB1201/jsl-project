import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

/**
 * 공개 페이지에만 로케일 라우팅을 적용한다.
 * 대시보드·인증 화면은 내부용이라 번역 대상이 아니므로 그대로 통과시킨다.
 */
const LOCALIZED_SEGMENTS = ['landing', 'tracking', 'consulting', 'privacy', 'terms']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 기존 편의 리다이렉트 유지
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }
  if (pathname === '/register') {
    return NextResponse.redirect(new URL('/auth/sign-up', request.url))
  }

  // 첫 세그먼트가 로케일이면 그 다음 세그먼트로 판단한다
  const segments = pathname.split('/').filter(Boolean)
  const maybeLocale = segments[0] as (typeof routing.locales)[number]
  const isLocalePrefixed = routing.locales.includes(maybeLocale)
  const target = isLocalePrefixed ? segments[1] : segments[0]

  const shouldLocalize =
    pathname === '/' || (target !== undefined && LOCALIZED_SEGMENTS.includes(target))

  if (!shouldLocalize) {
    return NextResponse.next()
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // api, _next, 정적 파일을 제외한 모든 경로
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)',
  ],
}
