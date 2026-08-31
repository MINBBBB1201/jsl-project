import { AutomationLogCard } from "./components/automation-log-card"
import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { DelayRiskTable } from "./components/delay-risk-table"
import { SectionCards } from "./components/section-cards"
import { ShipmentTable } from "./components/shipment-table"

export default function Page() {
  return (
    <>
      {/* Page Title and Description */}
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your admin dashboard</p>
        </div>
      </div>

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
