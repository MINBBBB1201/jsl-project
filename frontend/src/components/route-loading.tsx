/**
 * 라우트 로딩 화면. 예전 app/loading.tsx 하나가 하던 일을 루트 레이아웃마다
 * 둔 loading.tsx 가 이걸 다시 내보내는 식으로 나눠 맡는다.
 */
export function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Loading...</p>
      </div>
    </div>
  )
}
