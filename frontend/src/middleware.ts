import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { routing } from '@/i18n/routing'
import { AUTH_COOKIE } from '@/lib/auth'

const intlMiddleware = createMiddleware(routing)

/**
 * 공개 페이지에만 로케일 라우팅을 적용한다.
 * 대시보드·인증 화면은 내부용이라 번역 대상이 아니므로 그대로 통과시킨다.
 */
const LOCALIZED_SEGMENTS = ['landing', 'tracking', 'consulting', 'privacy', 'terms']

/**
 * 로그인이 필요한 경로 ((dashboard) 라우트 그룹의 첫 세그먼트들).
 *
 * 여기서는 쿠키가 있는지만 본다. 토큰이 유효한지는 서버에서 확인할 수 없고
 * (검증 키는 백엔드에 있다) 확인할 필요도 없다 — 실제 접근 통제는 백엔드가
 * 토큰을 검증해 403 을 내리는 쪽이 담당한다. 이 검사는 로그인하지 않은 사용자가
 * 빈 대시보드를 보고 혼란스러워하지 않도록 로그인 화면으로 안내하는 용도다.
 * 죽은 토큰이 쿠키에 남아 있는 경우는 RequireAuth 가 걸러낸다.
 */
const PROTECTED_SEGMENTS = ['dashboard', 'chat', 'damage-inspection', 'settings']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  /**
   * 루트는 공개 랜딩으로 보낸다.
   *
   * 공개 페이지가 [locale] 아래로 옮겨지면서 '/' 에 대응하는 페이지가 없어져
   * 404 가 나던 자리다. (app/page.tsx 는 로케일 라우팅에 가려 실행되지 않는다.)
   * 마케팅 사이트가 먼저 보이는 편이 맞아서 대시보드가 아니라 /landing 으로 보낸다.
   */
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/landing', request.url))
  }

  // 기존 편의 리다이렉트 유지 (auth 페이지는 라우트 그룹이라 URL 에 /auth 가 없다)
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
  if (pathname === '/register') {
    return NextResponse.redirect(new URL('/sign-up', request.url))
  }

  // 첫 세그먼트가 로케일이면 그 다음 세그먼트로 판단한다
  const segments = pathname.split('/').filter(Boolean)
  const maybeLocale = segments[0] as (typeof routing.locales)[number]
  const isLocalePrefixed = routing.locales.includes(maybeLocale)
  const target = isLocalePrefixed ? segments[1] : segments[0]

  if (target !== undefined && PROTECTED_SEGMENTS.includes(target)) {
    if (!request.cookies.get(AUTH_COOKIE)?.value) {
      const signInUrl = new URL('/sign-in', request.url)
      // 로그인 후 원래 가려던 곳으로 되돌려 보낸다
      signInUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(signInUrl)
    }
    return NextResponse.next()
  }

  const shouldLocalize = target !== undefined && LOCALIZED_SEGMENTS.includes(target)

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
