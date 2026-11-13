import Link from "next/link"
import { Button } from "@/components/ui/button"

/**
 * 404 본문. 루트 레이아웃이 여럿이라 app/global-not-found.tsx(어느 라우트에도
 * 안 걸린 URL)와 [locale]/not-found.tsx(공개 페이지 안의 notFound())가 함께 쓴다.
 */
export function NotFoundContent() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground mt-2">Page not found</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
