"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"

/**
 * 로그인하지 않은 접근을 로그인 화면으로 보낸다.
 *
 * 미들웨어(src/middleware.ts)가 쿠키 유무로 1차로 막지만, 쿠키에 죽은 토큰이
 * 남아 있는 경우는 서버에서 알 수 없다. 여기서 /api/auth/me 결과까지 확인한 뒤
 * 화면을 그린다. 실제 데이터 보호는 백엔드가 403 을 내리는 쪽이 담당한다.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (status !== "unauthenticated") return
    const next = encodeURIComponent(pathname || "/dashboard")
    router.replace(`/sign-in?next=${next}`)
  }, [status, pathname, router])

  if (status !== "authenticated") {
    return (
      <div
        className="flex min-h-svh items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
        <span className="sr-only">
          {status === "loading" ? "로그인 상태를 확인하는 중" : "로그인 화면으로 이동 중"}
        </span>
      </div>
    )
  }

  return <>{children}</>
}
