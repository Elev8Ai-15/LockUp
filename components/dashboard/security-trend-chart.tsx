"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { securityTrendData } from "@/lib/mock-data"

export function SecurityTrendChart() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground text-base">Security Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={securityTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="vulnGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fixedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0F1629",
                  border: "1px solid #1E293B",
                  borderRadius: "8px",
                  color: "#E2E8F0",
                }}
              />
              <Area
                type="monotone"
                dataKey="vulns"
                stroke="#EF4444"
                fill="url(#vulnGradient)"
                strokeWidth={2}
                name="Vulnerabilities"
              />
              <Area
                type="monotone"
                dataKey="fixed"
                stroke="#22C55E"
                fill="url(#fixedGradient)"
                strokeWidth={2}
                name="Fixed"
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#00F5FF"
                strokeWidth={2}
                dot={false}
                name="Score"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
