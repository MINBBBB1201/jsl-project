import { AutomationLogCard } from "./components/automation-log-card"
import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { DelayRiskTable } from "./components/delay-risk-table"
import { SectionCards } from "./components/section-cards"
import { ShipmentTable } from "./components/shipment-table"
import { PortalPageHeader } from "@/components/portal/portal-kit"

export default function Page() {
  return (
    <>
      <PortalPageHeader
        eyebrow="Operations"
        title="운영 현황"
        tail="최근 30일"
        description="화물 처리 실적과 진행 중인 배송의 지연 위험을 봅니다."
      />

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
