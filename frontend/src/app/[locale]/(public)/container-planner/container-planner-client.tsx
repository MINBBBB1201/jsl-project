"use client"

import { useCallback, useId, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Boxes, Calculator, Container, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CargoForm } from "@/components/container-planner/cargo-form"
import { ContainerViewer } from "@/components/container-planner/container-viewer"
import { LoadResult } from "@/components/container-planner/load-result"
import {
  CONTAINER_SPECS,
  CONTAINER_TYPE_IDS,
  planLoad,
  type CargoBoxInput,
  type ContainerTypeId,
  type LoadPlan,
} from "@/lib/container-planner"

/**
 * 컨테이너 적재 계산기.
 *
 * 왼쪽에 입력(컨테이너 선택 + 화물 목록), 오른쪽에 3D 뷰어와 결과 패널.
 *
 * ⚠️ PublicPageShell 을 여기서 감싸지 말 것. (public)/layout.tsx 가 이미
 *    감싸고 있어서, 한 번 더 쓰면 헤더와 푸터가 두 벌씩 렌더된다.
 */

/** 기본 선택. 가장 흔하게 쓰는 규격이라 40HC 로 둔다 */
const DEFAULT_CONTAINER: ContainerTypeId = "40FT_HC"

export function ContainerPlannerClient() {
  const t = useTranslations("containerPlanner")
  const selectId = useId()

  const [containerId, setContainerId] = useState<ContainerTypeId>(DEFAULT_CONTAINER)
  const [cargo, setCargo] = useState<CargoBoxInput[]>([])
  const [plan, setPlan] = useState<LoadPlan | null>(null)

  const container = CONTAINER_SPECS[containerId]

  /**
   * 화물 id 발급용.
   *
   * planLoad 는 id 가 겹치면 예외를 던진다(1단계 assertValidInput). 이름은
   * 얼마든지 같을 수 있으므로 — 같은 품목을 규격만 달리해 두 줄 넣는 건 흔하다 —
   * 이름이 아니라 증가하는 번호로 만든다.
   */
  const [nextId, setNextId] = useState(1)

  const addCargo = useCallback(
    (box: Omit<CargoBoxInput, "id">) => {
      setCargo((prev) => [...prev, { ...box, id: `cargo-${nextId}` }])
      setNextId((n) => n + 1)
      // 목록이 바뀌면 지금 떠 있는 결과는 더 이상 이 목록의 결과가 아니다.
      // 남겨 두면 방금 추가한 화물이 이미 반영된 것처럼 보인다.
      setPlan(null)
    },
    [nextId]
  )

  const removeCargo = useCallback((id: string) => {
    setCargo((prev) => prev.filter((item) => item.id !== id))
    setPlan(null)
  }, [])

  const clearAll = useCallback(() => {
    setCargo([])
    setPlan(null)
  }, [])

  const changeContainer = useCallback((value: string) => {
    setContainerId(value as ContainerTypeId)
    // 컨테이너가 바뀌면 이전 계산은 다른 컨테이너의 결과다.
    setPlan(null)
  }, [])

  const calculate = useCallback(() => {
    setPlan(planLoad(CONTAINER_SPECS[containerId], cargo))
  }, [containerId, cargo])

  const totalUnits = useMemo(
    () => cargo.reduce((sum, item) => sum + item.quantity, 0),
    [cargo]
  )

  const containerName = t(`containers.${containerId}`)

  /** 캔버스 대체 텍스트 — 계산 전후로 말이 달라진다 */
  const viewerLabel = plan
    ? t("viewerAlt", {
        container: containerName,
        placed: plan.placed.length,
        percent: plan.volumeUtilizationPercent,
      })
    : t("viewerAltEmpty", { container: containerName })

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>

      {/*
        좁은 화면에서는 1열로 쌓이고, lg 부터 좌우로 갈린다. 왼쪽 입력 열은
        폭을 고정해 두었다 — 자유롭게 늘어나면 넓은 화면에서 입력칸만 커지고
        정작 봐야 하는 3D 뷰가 좁아진다.
      */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {/* ── 왼쪽: 입력 ───────────────────────────────────────────── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Container className="size-4" aria-hidden />
                {t("containerSection")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor={selectId}>{t("containerLabel")}</Label>
              <Select value={containerId} onValueChange={changeContainer}>
                <SelectTrigger id={selectId} className="w-full cursor-pointer">
                  {/*
                    SelectValue 에 children 을 직접 넘긴다. 비워 두면 Radix 가
                    선택된 SelectItem 의 자식을 통째로 복제해 트리거에 넣는데,
                    아래 항목에는 제원 두 줄이 붙어 있어서 트리거가 세 줄로 부푼다.
                  */}
                  <SelectValue>{containerName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CONTAINER_TYPE_IDS.map((id) => {
                    const spec = CONTAINER_SPECS[id]
                    return (
                      <SelectItem key={id} value={id} className="cursor-pointer">
                        <span className="flex flex-col gap-0.5 py-0.5">
                          <span className="font-medium">{t(`containers.${id}`)}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {t("containerDims", {
                              length: spec.innerLengthCm,
                              width: spec.innerWidthCm,
                              height: spec.innerHeightCm,
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {t("containerPayload", { payload: spec.maxPayloadKg })}
                          </span>
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              {/* 고른 컨테이너의 제원. 화물 치수와 같은 cm 단위로 맞춰 둔다 */}
              <dl className="space-y-1 pt-1 text-xs text-muted-foreground tabular-nums">
                <div>
                  {t("containerDims", {
                    length: container.innerLengthCm,
                    width: container.innerWidthCm,
                    height: container.innerHeightCm,
                  })}
                </div>
                <div>
                  {t("containerPayload", { payload: container.maxPayloadKg })}
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Boxes className="size-4" aria-hidden />
                {t("cargoSection")}
              </CardTitle>
              {cargo.length > 0 ? (
                <CardDescription className="tabular-nums">
                  {t("cargoSummary", { types: cargo.length, units: totalUnits })}
                </CardDescription>
              ) : null}
            </CardHeader>

            <CardContent className="space-y-5">
              <CargoForm onAdd={addCargo} />

              <div className="border-t pt-4">
                {cargo.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">
                    {t("cargoEmpty")}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {cargo.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 rounded-md border p-3"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="truncate text-sm font-medium">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {t("cargoItemDims", {
                              length: item.lengthCm,
                              width: item.widthCm,
                              height: item.heightCm,
                              weight: item.weightKg,
                              quantity: item.quantity,
                            })}
                          </p>
                          {item.stackable === false || item.rotatable === false ? (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {item.stackable === false ? (
                                <Badge variant="outline" className="text-[10px]">
                                  {t("badgeNonStackable")}
                                </Badge>
                              ) : null}
                              {item.rotatable === false ? (
                                <Badge variant="outline" className="text-[10px]">
                                  {t("badgeNoRotate")}
                                </Badge>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                          onClick={() => removeCargo(item.id)}
                          aria-label={t("removeCargo", { name: item.name })}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={calculate}
                  disabled={cargo.length === 0}
                  className="w-full cursor-pointer"
                >
                  <Calculator className="size-4" aria-hidden />
                  {plan ? t("recalculate") : t("calculate")}
                </Button>

                {cargo.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground">
                    {t("needCargo")}
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={clearAll}
                    className="w-full cursor-pointer text-muted-foreground"
                  >
                    {t("clearAll")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 오른쪽: 3D 뷰어 + 결과 ───────────────────────────────── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("viewerSection")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ContainerViewer
                container={container}
                /* 계산 전에는 빈 배열 — 빈 컨테이너만 그려진다 */
                placed={plan?.placed ?? []}
                label={viewerLabel}
              />
              {plan ? null : (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("viewerEmpty")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("resultSection")}</CardTitle>
            </CardHeader>
            <CardContent>
              {plan ? (
                <LoadResult plan={plan} />
              ) : (
                <p className="text-sm text-muted-foreground">{t("resultEmpty")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="mt-8 max-w-3xl text-xs text-muted-foreground">
        {t("disclaimer")}
      </p>
    </div>
  )
}
