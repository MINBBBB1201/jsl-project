import { AutomationLogCard } from "./components/automation-log-card"
import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { DelayRiskTable } from "./components/delay-risk-table"
import { SectionCards } from "./components/section-cards"
import { ShipmentTable } from "./components/shipment-table"

export default function Page() {
  return (
    <>
      <header className="px-4 lg:px-6">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.18em] uppercase">
          Operations
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">운영 현황</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          최근 30일 화물 처리 실적과 진행 중인 배송의 지연 위험을 봅니다.
        </p>
      </header>

      <div className="@container/main px-4 lg:px-6 space-y-6">
        <SectionCards />
        <DelayRiskTable />
        <AutomationLogCard />
        <ChartAreaInteractive />
        <ShipmentTable />
      </div>
    </>
  )
}
