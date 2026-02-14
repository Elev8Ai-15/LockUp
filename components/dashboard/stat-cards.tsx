"use client"

import { motion } from "framer-motion"
import { ScanLine, Bug, Zap, Box } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { stats } from "@/lib/mock-data"

const statItems = [
  {
    label: "Total Scans",
    value: stats.totalScans.toLocaleString(),
    icon: ScanLine,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    glow: "glow-blue",
    tip: "Across all asset types: repos, websites, apps, contracts",
  },
  {
    label: "Vulns Fixed",
    value: stats.vulnsFixed.toLocaleString(),
    icon: Bug,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
    glow: "glow-green",
    tip: "Auto-fixed by AI agents with 96% success rate",
  },
  {
    label: "AI Fix Rate",
    value: `${stats.aiFixRate}%`,
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    glow: "glow-blue",
    tip: "Percentage of vulns automatically remediated by agents",
  },
  {
    label: "Assets Scanned",
    value: stats.assetsScanned.toLocaleString(),
    icon: Box,
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/20",
    glow: "glow-brown",
    tip: "Repos, websites, web/mobile apps, and smart contracts",
  },
]

export function StatCards() {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className={`bg-card border ${item.borderColor} ${item.glow} hover:border-opacity-50 transition-all`}>
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
              </TooltipTrigger>
              <TooltipContent className="bg-popover text-popover-foreground border-border">{item.tip}</TooltipContent>
            </Tooltip>
          </motion.div>
        ))}
      </div>
    </TooltipProvider>
  )
}
