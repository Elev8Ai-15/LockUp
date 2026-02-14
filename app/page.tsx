import { StatCards } from "@/components/dashboard/stat-cards"
import { RecentScansTable } from "@/components/dashboard/recent-scans-table"
import { SecurityTrendChart } from "@/components/dashboard/security-trend-chart"
import { QuickScan } from "@/components/dashboard/quick-scan"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your security posture across all repositories.
        </p>
      </div>

      <StatCards />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SecurityTrendChart />
        </div>
        <QuickScan />
      </div>

      <RecentScansTable />
    </div>
  )
}
