"use client"

import { motion } from "framer-motion"
import { ScanLine, Bug, ShieldCheck, Link2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { stats } from "@/lib/mock-data"

const statItems = [
  {
    label: "Total Scans",
    value: stats.totalScans,
    icon: ScanLine,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  },
  {
    label: "Vulns Found",
    value: stats.vulnsFound,
    icon: Bug,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/20",
  },
  {
    label: "Avg Security Score",
    value: `${stats.avgSecurityScore}%`,
    icon: ShieldCheck,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
  },
  {
    label: "Blockchain Audits",
    value: stats.blockchainAudits,
    icon: Link2,
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/20",
  },
]

export function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className={`bg-card border ${item.borderColor} hover:border-opacity-50 transition-colors`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${item.color}`}>{item.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${item.bgColor}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
