import { StatCards } from "@/components/dashboard/stat-cards"
import { AgentSwarm } from "@/components/dashboard/agent-swarm"
import { RecentScansTable } from "@/components/dashboard/recent-scans-table"
import { SecurityTrendChart } from "@/components/dashboard/security-trend-chart"
import { QuickScan } from "@/components/dashboard/quick-scan"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <QuickScan />

      <StatCards />

      <AgentSwarm />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SecurityTrendChart />
        <RecentScansTable />
      </div>
    </div>
  )
}
