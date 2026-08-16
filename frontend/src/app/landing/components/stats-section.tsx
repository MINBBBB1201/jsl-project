"use client"

import { useContent } from '@/config/use-content'

export function StatsSection() {
  const { stats, monthlyVolumes, volumesHeading } = useContent()

  return (
    <section className="relative border-b py-12 sm:py-16">
      {/*
        예전에는 그라데이션 배경 + 도트 패턴 + 카드 blur 를 겹쳐 썼다.
        색으로 만든 깊이감은 정보를 전달하지 않으면서 시선을 나눠 가져간다.
        지금은 구획선(보더)과 그리드만 남기고, 색은 수치 자체에만 쓴다.
      */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/*
          스위스 양식의 표 조판 — 카드 대신 격자 구획선으로 항목을 나눈다.
          네거티브 마진 + 셀 보더 조합이라 바깥 테두리가 겹쳐 두꺼워지지 않는다.
        */}
        <div className="grid grid-cols-2 border-t border-l lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="border-r border-b p-6 sm:p-8">
              <stat.icon
                className="mb-4 size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="tabular-figures text-3xl font-semibold sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">{stat.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* 월간 처리 물동량 */}
        <div className="mt-10 md:mt-12">
          <div className="mb-6 max-w-xl">
            <h3 className="text-lg font-semibold text-foreground">
              {volumesHeading.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {volumesHeading.description}
            </p>
          </div>

          <div className="grid grid-cols-1 border-t border-l sm:grid-cols-3">
            {monthlyVolumes.map((volume) => (
              <div
                key={volume.mode}
                className="flex items-center gap-4 border-r border-b p-5"
              >
                <volume.icon
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  {/* 운송모드 코드는 라벨이라 대문자 + 넓은 자간으로 본문과 구분한다 */}
                  <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground">
                    {volume.mode}
                  </p>
                  <p className="tabular-figures text-xl font-semibold text-foreground">
                    {volume.value}
                    <span className="ms-1 text-sm font-normal text-muted-foreground">
                      {volume.unit}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
