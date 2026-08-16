"use client"

import { useCallback, useState } from "react"
import { AlertCircle, Info } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { ImageUploader } from "./components/image-uploader"
import { InspectionHistory } from "./components/inspection-history"
import { InspectionResultCard, RateLimitNotice } from "./components/inspection-result"
import { useDamageInspection, useInspectionHistory } from "./use-damage-inspection"

export default function DamageInspectionPage() {
  const { result, isInspecting, error, isRateLimited, inspect, reset } =
    useDamageInspection()
  const history = useInspectionHistory(8)
  const [validationError, setValidationError] = useState<string | null>(null)

  const displayError = validationError ?? error

  const handleInspect = useCallback(
    async (file: File) => {
      setValidationError(null)
      const created = await inspect(file)
      if (created) history.reload()
    },
    [inspect, history]
  )

  const handleClear = useCallback(() => {
    setValidationError(null)
    reset()
  }, [reset])

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* 제목 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">화물 파손 판정</h1>
        <p className="text-muted-foreground">
          화물 사진을 올리면 AI가 손상 여부를 1차로 확인합니다. 최종 판단은
          담당자가 실물을 확인한 뒤 내려주세요.
        </p>
      </div>

      {/* 기능 성격 고지 — 과장하지 않기 위해 상단에 명시 */}
      <Card className="border-dashed">
        <CardContent className="flex gap-3 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">판정 보조 도구입니다.</span>{" "}
              학습된 전용 파손 감지 모델이 아니라, 비전 LLM이 사진을 보고 그때그때
              판단하는 zero-shot 방식입니다.
            </p>
            <p>
              검증 과정에서 <span className="font-medium text-foreground">눈에 보이는
              손상을 &ldquo;이상 없음&rdquo;으로 놓치는 사례</span>가 확인됐습니다.
              이 결과만으로 배상이나 반품을 확정하지 마세요.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 업로드 */}
        <Card>
          <CardContent className="p-5">
            <ImageUploader
              onInspect={handleInspect}
              isInspecting={isInspecting}
              onValidationError={setValidationError}
              onClear={handleClear}
            />
          </CardContent>
        </Card>

        {/* 결과 */}
        <div className="space-y-4">
          {isRateLimited && displayError ? (
            <RateLimitNotice message={displayError} />
          ) : displayError ? (
            <Card className="border-destructive/50">
              <CardContent className="flex gap-3 p-5">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
                <div className="space-y-1">
                  <p className="font-medium text-destructive">판정에 실패했습니다</p>
                  <p className="text-sm text-muted-foreground">{displayError}</p>
                </div>
              </CardContent>
            </Card>
          ) : result ? (
            <InspectionResultCard inspection={result} />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex min-h-64 items-center justify-center p-5">
                <p className="text-center text-sm text-muted-foreground">
                  사진을 올리고 판정하기를 누르면
                  <br />
                  결과가 여기에 표시됩니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <InspectionHistory
        items={history.items}
        isLoading={history.isLoading}
        error={history.error}
        onReload={history.reload}
      />
    </div>
  )
}
