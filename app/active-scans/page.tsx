"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Terminal, Clock, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { activeScans } from "@/lib/mock-data"
import { toast } from "sonner"

const toolColors: Record<string, string> = {
  Semgrep: "border-primary/30 text-primary bg-primary/10",
  Slither: "border-accent/30 text-accent bg-accent/10",
  Trivy: "border-success/30 text-success bg-success/10",
  Mythril: "border-warning/30 text-warning bg-warning/10",
  Nuclei: "border-destructive/30 text-destructive bg-destructive/10",
}

const statusLabels: Record<string, string> = {
  scanning: "Scanning files...",
  analyzing: "Analyzing results...",
  reporting: "Generating report...",
}

export default function ActiveScansPage() {
  const [scans, setScans] = useState(activeScans)

  useEffect(() => {
    const interval = setInterval(() => {
      setScans((prev) =>
        prev.map((scan) => ({
          ...scan,
          progress: Math.min(scan.progress + Math.random() * 2, 99),
        }))
      )
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Active Scans</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {scans.length} scans currently running across your repositories.
        </p>
      </div>

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
                    <CardTitle className="text-foreground text-base font-mono">{scan.repo}</CardTitle>
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
                            toast.info(`Scan cancelled for ${scan.repo}`)
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover text-popover-foreground border-border">
                        Cancel Scan
                      </TooltipContent>
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
                  <Progress
                    value={scan.progress}
                    className="h-2 bg-secondary [&>div]:bg-primary"
                  />
                </div>

                <ScrollArea className="h-[120px] rounded-lg bg-[#070B16] border border-border p-3">
                  <div className="flex flex-col gap-1 font-mono text-xs">
                    {scan.logs.map((log, idx) => (
                      <div
                        key={idx}
                        className={
                          log.includes("[WARN]")
                            ? "text-warning"
                            : log.includes("[DONE]")
                              ? "text-success"
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
