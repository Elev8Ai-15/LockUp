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
        <CardTitle className="text-foreground text-base">Vulnerability Reduction Trend</CardTitle>
        <p className="text-xs text-muted-foreground">Across code, web, apps, and blockchain</p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={securityTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="codeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#89CFF0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#89CFF0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="webGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#228B22" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#228B22" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="blockchainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A67B5B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#A67B5B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F3D2B" />
              <XAxis dataKey="month" stroke="#7C9A8E" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#7C9A8E" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#132419",
                  border: "1px solid #1F3D2B",
                  borderRadius: "8px",
                  color: "#E2E8F0",
                }}
              />
              <Area type="monotone" dataKey="code" stroke="#89CFF0" fill="url(#codeGrad)" strokeWidth={2} name="Code" />
              <Area type="monotone" dataKey="web" stroke="#228B22" fill="url(#webGrad)" strokeWidth={2} name="Web" />
              <Area type="monotone" dataKey="blockchain" stroke="#A67B5B" fill="url(#blockchainGrad)" strokeWidth={2} name="Blockchain" />
              <Line type="monotone" dataKey="fixed" stroke="#228B22" strokeWidth={2} dot={false} name="Fixed" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
