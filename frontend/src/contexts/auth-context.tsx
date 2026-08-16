"use client"

import * as React from "react"

import {
  type AuthUser,
  fetchMe,
  getToken,
  login as loginRequest,
  logout as logoutRequest,
} from "@/lib/auth"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

/**
 * 로그인 상태 공급자.
 *
 * 쿠키에 토큰이 있어도 그대로 믿지 않고 /api/auth/me 로 한 번 확인한다.
 * 토큰이 만료됐거나 계정이 비활성화된 경우를 화면에 반영하기 위해서다.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [status, setStatus] = React.useState<AuthStatus>("loading")

  React.useEffect(() => {
    let cancelled = false

    const verify = async () => {
      if (!getToken()) {
        if (!cancelled) setStatus("unauthenticated")
        return
      }

      try {
        const me = await fetchMe()
        if (cancelled) return
        setUser(me)
        setStatus("authenticated")
      } catch {
        // apiFetch 가 인증 실패 코드일 때 쿠키를 이미 지운다
        if (cancelled) return
        setUser(null)
        setStatus("unauthenticated")
      }
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [])

  const login = React.useCallback(async (email: string, password: string) => {
    const me = await loginRequest(email, password)
    setUser(me)
    setStatus("authenticated")
    return me
  }, [])

  const logout = React.useCallback(async () => {
    await logoutRequest()
    setUser(null)
    setStatus("unauthenticated")
  }, [])

  const value = React.useMemo(
    () => ({ user, status, login, logout }),
    [user, status, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth 는 AuthProvider 안에서만 쓸 수 있습니다.")
  }
  return context
}
