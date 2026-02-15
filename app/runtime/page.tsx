"use client"

import { motion } from "motion/react"
import { Activity, AlertTriangle, Cpu, Globe, Link2, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { runtimeMetrics, shadowAIDetections, type Severity } from "@/lib/mock-data"
import { toast } from "sonner"

const riskColors: Record<Severity, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-primary/15 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
}

export default function RuntimePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Runtime Monitoring</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live asset health, API monitoring, and Shadow AI runtime detection.
        </p>
      </div>

      {/* Live health stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "API Calls/min", value: "310", icon: Activity, color: "text-primary", borderColor: "border-primary/20" },
          { label: "Memory Usage", value: "61%", icon: Cpu, color: "text-success", borderColor: "border-success/20" },
          { label: "On-Chain Events", value: "7", icon: Link2, color: "text-accent", borderColor: "border-accent/20" },
          { label: "Web Traffic", value: "1.9K", icon: Globe, color: "text-primary", borderColor: "border-primary/20" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`bg-card border ${stat.borderColor}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`h-5 w-5 ${stat.color} opacity-50`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Real-time graphs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">API Calls & Web Traffic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={runtimeMetrics} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="apiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#89CFF0" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#89CFF0" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#228B22" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#228B22" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F3D2B" />
                  <XAxis dataKey="time" stroke="#7C9A8E" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7C9A8E" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#132419", border: "1px solid #1F3D2B", borderRadius: "8px", color: "#E2E8F0" }} />
                  <Area type="monotone" dataKey="apiCalls" stroke="#89CFF0" fill="url(#apiGrad)" strokeWidth={2} name="API Calls" />
                  <Area type="monotone" dataKey="webTraffic" stroke="#228B22" fill="url(#trafficGrad)" strokeWidth={2} name="Web Traffic" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Memory & On-Chain Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={runtimeMetrics} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4A054" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D4A054" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="chainGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A67B5B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#A67B5B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F3D2B" />
                  <XAxis dataKey="time" stroke="#7C9A8E" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7C9A8E" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#132419", border: "1px solid #1F3D2B", borderRadius: "8px", color: "#E2E8F0" }} />
                  <Area type="monotone" dataKey="memory" stroke="#D4A054" fill="url(#memGrad)" strokeWidth={2} name="Memory %" />
                  <Area type="monotone" dataKey="onChain" stroke="#A67B5B" fill="url(#chainGrad)" strokeWidth={2} name="On-Chain Events" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shadow AI Runtime Scan */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-warning" />
            <CardTitle className="text-foreground text-base">Shadow AI Runtime Scan</CardTitle>
            <Badge variant="outline" className="border-warning/30 text-warning text-[10px]">
              {shadowAIDetections.length} detections
            </Badge>
          </div>
          <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-secondary text-xs" onClick={() => toast.success("Runtime scan refreshed!")}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">File</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Confidence</TableHead>
                <TableHead className="text-muted-foreground hidden sm:table-cell">Asset</TableHead>
                <TableHead className="text-muted-foreground">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shadowAIDetections.map((detection, i) => (
                <TableRow key={i} className="border-border hover:bg-secondary/50">
                  <TableCell className="font-mono text-sm text-foreground">{detection.file}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{detection.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono ${detection.confidence >= 90 ? "text-destructive" : detection.confidence >= 75 ? "text-warning" : "text-muted-foreground"}`}>
                        {detection.confidence}%
                      </span>
                      {detection.confidence >= 85 && <AlertTriangle className="h-3 w-3 text-warning" />}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs font-mono text-muted-foreground">{detection.asset}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${riskColors[detection.risk]}`}>
                      {detection.risk}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
