import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

import "./route-loading.css"

/**
 * 로딩 화면 모음.
 *
 * 예전에는 어디서나 화면 가운데 스피너와 영어 "Loading..." 한 줄이었다.
 * 공개 페이지는 4개 언어인데 문구가 영어로 고정이었고, 대시보드는 사이드바까지
 * 통째로 사라졌다 나타나 화면이 깜빡였다. IBM Carbon 의 로딩 패턴처럼
 * 페이지 전환은 화면 골격으로, 그 밖에는 상단의 얇은 진행 바로 바꾼다.
 * 화면에는 글자를 띄우지 않고 스크린리더용 상태 문구만 둔다.
 */

/** 화면 맨 위 2px 오렌지 진행 바. 레이아웃에 자리를 차지하지 않는다 */
export function ProgressBar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden", className)}
    >
      <div className="jsl-route-progress bg-brand-orange h-full w-1/4" />
    </div>
  )
}

function LoadingStatus({ label = "불러오는 중" }: { label?: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  )
}

/**
 * 로그인·공개 페이지용. 이전 화면 바탕을 그대로 두고 진행 바만 보인다.
 * 공개 페이지는 [locale] 아래라 상태 문구를 언어별로 나눠야 하지만, 이 파일은
 * 번역 컨텍스트 밖에서도 쓰이므로 화면에 보이지 않는 문구만 한국어로 둔다.
 */
export function RouteLoading() {
  return (
    <div className="min-h-[50svh]">
      <ProgressBar />
      <LoadingStatus />
    </div>
  )
}

/**
 * 대시보드 본문 골격. (dashboard)/loading.tsx 는 사이드바·헤더를 그리는 레이아웃
 * 안쪽에서 보이므로 본문만 그린다. 모양은 대시보드 머리말 + 지표 띠 + 표 한 덩이.
 */
export function DashboardContentSkeleton() {
  return (
    <div className="px-4 lg:px-6">
      <ProgressBar />
      <LoadingStatus />
      <div className="space-y-2">
        <Skeleton className="h-3 w-20 rounded-sm motion-reduce:animate-none" />
        <Skeleton className="h-7 w-40 rounded-sm motion-reduce:animate-none" />
      </div>
      <div className="bg-card mt-6 grid grid-cols-2 border xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "space-y-3 p-5",
              i % 2 === 1 && "border-l",
              i >= 2 && "border-t xl:border-t-0",
              i === 2 && "xl:border-l"
            )}
          >
            <Skeleton className="h-3 w-24 rounded-sm motion-reduce:animate-none" />
            <Skeleton className="h-8 w-16 rounded-sm motion-reduce:animate-none" />
            <Skeleton className="h-3 w-32 rounded-sm motion-reduce:animate-none" />
          </div>
        ))}
      </div>
      <div className="bg-card mt-6 border">
        <div className="border-b px-5 py-4">
          <Skeleton className="h-4 w-32 rounded-sm motion-reduce:animate-none" />
        </div>
        <div className="space-y-3 p-5">
          <Skeleton className="h-4 w-full rounded-sm motion-reduce:animate-none" />
          <Skeleton className="h-4 w-11/12 rounded-sm motion-reduce:animate-none" />
          <Skeleton className="h-4 w-4/5 rounded-sm motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  )
}

/**
 * 로그인 확인 중(RequireAuth)에 보이는 업무 포털 전체 골격.
 * 이때는 아직 사이드바도 그려지지 않았으므로 사이드바(네이비)·헤더 자리까지 그린다.
 * 사이드바 폭(16rem)과 헤더 높이(3.5rem)는 dashboard-shell.tsx 의 값과 같다.
 */
export function PortalShellSkeleton({ label }: { label: string }) {
  return (
    <div className="bg-background flex min-h-svh">
      <ProgressBar />
      <LoadingStatus label={label} />
      <div aria-hidden className="bg-sidebar hidden w-64 shrink-0 flex-col gap-3 p-4 md:flex">
        <div className="mb-6 h-8 w-32 rounded-sm bg-white/10" />
        <div className="h-3 w-16 rounded-sm bg-white/10" />
        <div className="h-7 rounded-sm bg-white/10" />
        <div className="mt-3 h-3 w-16 rounded-sm bg-white/10" />
        <div className="h-7 rounded-sm bg-white/5" />
        <div className="h-7 rounded-sm bg-white/5" />
        <div className="h-7 rounded-sm bg-white/5" />
      </div>
      <div aria-hidden className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center border-b px-4 lg:px-6">
          <Skeleton className="h-8 w-56 rounded-sm motion-reduce:animate-none" />
        </div>
        <div className="py-4 md:py-6">
          <DashboardContentBody />
        </div>
      </div>
    </div>
  )
}

/** PortalShellSkeleton 안에서 진행 바·상태 문구를 겹쳐 그리지 않도록 본문만 뺀 것 */
function DashboardContentBody() {
  return (
    <div className="px-4 lg:px-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20 rounded-sm motion-reduce:animate-none" />
        <Skeleton className="h-7 w-40 rounded-sm motion-reduce:animate-none" />
      </div>
      <div className="bg-card mt-6 h-28 border" />
      <div className="bg-card mt-6 h-48 border" />
    </div>
  )
}
