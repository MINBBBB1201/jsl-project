import { Suspense } from "react"

import { LoginForm1 } from "./components/login-form-1"

export default function Page() {
  // useSearchParams(next 파라미터) 를 쓰므로 Suspense 경계가 필요하다
  return (
    <Suspense fallback={null}>
      <LoginForm1 />
    </Suspense>
  )
}
