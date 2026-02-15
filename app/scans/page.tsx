"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { Terminal, Clock, XCircle, Bot, Globe, Smartphone, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { activeScans, agents, type AssetType } from "@/lib/mock-data"
import { agentTextColor, agentBgColor } from "@/lib/agent-colors"
import { toast } from "sonner"

const toolColors: Record<string, string> = {
  "OWASP ZAP": "border-success/30 text-success bg-success/10",
  Slither: "border-accent/30 text-accent bg-accent/10",
  Nuclei: "border-primary/30 text-primary bg-primary/10",
  Mythril: "border-warning/30 text-warning bg-warning/10",
  Semgrep: "border-primary/30 text-primary bg-primary/10",
}

const assetTypeBadge: Record<AssetType, string> = {
  Repo: "border-primary/30 text-primary",
  Website: "border-success/30 text-success",
  WebApp: "border-primary/30 text-primary",
  SmartContract: "border-accent/30 text-accent",
}

const statusLabels: Record<string, string> = {
  scanning: "Scanning files...",
  analyzing: "Analyzing results...",
  reporting: "Generating report...",
}

export default function ScansPage() {
  const [scans, setScans] = useState(activeScans)
  const [agenticMode, setAgenticMode] = useState(false)
  const [quickUrl, setQuickUrl] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setScans((prev) =>
        prev.map((scan) => ({
          ...scan,
          progress: Math.min(scan.progress + 1.2, 99),
        }))
      )
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Active Scans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {scans.length} scans currently running across your assets.
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Label htmlFor="agentic" className="text-sm text-foreground">Agentic Mode</Label>
                <Switch
                  id="agentic"
                  checked={agenticMode}
                  onCheckedChange={setAgenticMode}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-popover text-popover-foreground border-border max-w-xs">
              Enable AI agents to think in parallel across asset types, auto-triaging and fixing as they scan.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Quick scan inputs */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="https://yoursite.com"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
              />
              <Button
                variant="outline"
                className="gap-1.5 border-border text-foreground hover:bg-secondary shrink-0"
                onClick={() => { toast.success("Website DAST scan started!"); setQuickUrl("") }}
              >
                <Globe className="h-3.5 w-3.5 text-success" />
                Scan Website
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 border-border text-foreground hover:bg-secondary shrink-0"
                onClick={() => { toast.success("Web App scan started!"); setQuickUrl("") }}
              >
                <Smartphone className="h-3.5 w-3.5 text-primary" />
                Scan App
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agentic mode panel */}
      {agenticMode && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <Card className="bg-card border-primary/20 glow-blue">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <CardTitle className="text-foreground text-base">Agentic Mode Active</CardTitle>
                <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">4 agents deployed</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-2.5">
                    <div className="relative">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-md ${agentBgColor[agent.colorKey]}`}>
                        <Bot className={`h-3.5 w-3.5 ${agentTextColor[agent.colorKey]}`} />
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-card ${agent.status === "active" ? "bg-success" : agent.status === "thinking" ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{agent.currentTask}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {scans.map((scan, i) => (
          <motion.div
            key={scan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-foreground text-base font-mono">{scan.asset}</CardTitle>
                    <Badge variant="outline" className={`text-[10px] ${assetTypeBadge[scan.assetType]}`}>
                      {scan.assetType}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={toolColors[scan.tool] || "border-border text-muted-foreground"}
                    >
                      {scan.tool}
                    </Badge>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setScans((prev) => prev.filter((s) => s.id !== scan.id))
                            toast.info(`Scan cancelled for ${scan.asset}`)
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover text-popover-foreground border-border">Cancel Scan</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Started {scan.startedAt}
                  </div>
                  <span className="text-xs text-muted-foreground">{statusLabels[scan.status]}</span>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Progress</span>
                    <span className="text-xs font-mono text-primary">{Math.round(scan.progress)}%</span>
                  </div>
                  <Progress value={scan.progress} className="h-2 bg-secondary [&>div]:bg-primary" />
                </div>

                <ScrollArea className="h-[120px] rounded-lg bg-[#0B1410] border border-border p-3">
                  <div className="flex flex-col gap-1 font-mono text-xs">
                    {scan.logs.map((log, idx) => (
                      <div
                        key={idx}
                        className={
                          log.includes("[WARN]") ? "text-warning"
                            : log.includes("[DONE]") ? "text-success"
                              : "text-muted-foreground"
                        }
                      >
                        <Terminal className="inline h-3 w-3 mr-1.5" />
                        {log}
                      </div>
                    ))}
                    <div className="text-primary animate-pulse-glow">
                      <Terminal className="inline h-3 w-3 mr-1.5" />
                      {"_"}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
