"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "motion/react"
import { Bot, Zap, Terminal, Sliders, Plus, Play, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { agents } from "@/lib/mock-data"
import { agentTextColor, agentBgColor } from "@/lib/agent-colors"
import { toast } from "sonner"

const statusDot: Record<string, string> = {
  active: "bg-success",
  thinking: "bg-primary animate-pulse",
  idle: "bg-muted-foreground",
}

export default function AgentsPage() {
  const [deploying, setDeploying] = useState(false)
  const [swarmLogs, setSwarmLogs] = useState<string[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [agentSettings, setAgentSettings] = useState(
    agents.map((a) => ({ ...a, aggressiveness: 60, creativity: 40 }))
  )
  // Track pending timers so they can be cleared on unmount
  const timerIdsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Cleanup all pending timers when the component unmounts
  useEffect(() => {
    return () => {
      timerIdsRef.current.forEach(clearTimeout)
    }
  }, [])

  const deploySwarm = () => {
    // Cancel any in-flight timers before starting a new run
    timerIdsRef.current.forEach(clearTimeout)
    timerIdsRef.current = []

    setDeploying(true)
    setSwarmLogs([])
    const logs = [
      "[Triage Agent] Connecting to asset: frontend-app...",
      "[Triage Agent] Scanning 247 files for vulnerability patterns...",
      "[Exploit Agent] Generating proof-of-concept for XSS in search.tsx...",
      "[Triage Agent] Found 3 high-risk, 5 medium-risk vulnerabilities",
      "[Fix Agent] Generating patch for XSS vulnerability...",
      "[Fix Agent] Applying DOMPurify sanitization to 4 input handlers...",
      "[Validator Agent] Running test suite (47 tests)...",
      "[Validator Agent] All tests passed. Build stable.",
      "[Fix Agent] Opening PR #142: Fix XSS vulnerabilities",
      "[System] Swarm deployment complete. 3 vulns fixed, 0 regressions.",
    ]

    logs.forEach((log, i) => {
      const id = setTimeout(() => {
        setSwarmLogs((prev) => [...prev, log])
        if (i === logs.length - 1) {
          setDeploying(false)
          toast.success("Swarm deployment complete!", { description: "3 vulnerabilities fixed, 0 regressions." })
        }
      }, (i + 1) * 800)
      timerIdsRef.current.push(id)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Security Swarm Control Center -- configure, deploy, and monitor your AI agents.
          </p>
        </div>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Custom Agent
        </Button>
      </div>

      {/* Agent grid with sliders */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {agentSettings.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative shrink-0">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${agentBgColor[agent.colorKey]}`}>
                      <Bot className={`h-5 w-5 ${agentTextColor[agent.colorKey]}`} />
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${statusDot[agent.status]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                      <Badge variant="outline" className={`text-[10px] ${agent.status === "active" ? "border-success/30 text-success" : agent.status === "thinking" ? "border-primary/30 text-primary" : "border-border text-muted-foreground"}`}>
                        {agent.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{agent.role}</p>
                    <p className="text-xs text-primary mt-1 truncate">{agent.currentTask}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sliders className="h-3 w-3" />
                        Aggressiveness
                      </Label>
                      <span className="text-xs font-mono text-foreground">{agent.aggressiveness}%</span>
                    </div>
                    <Slider
                      value={[agent.aggressiveness]}
                      onValueChange={([v]) => setAgentSettings((prev) => prev.map((a) => a.id === agent.id ? { ...a, aggressiveness: v } : a))}
                      max={100}
                      step={5}
                      className="[&>span:first-child>span]:bg-primary [&>span:first-child]:bg-secondary"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Creativity
                      </Label>
                      <span className="text-xs font-mono text-foreground">{agent.creativity}%</span>
                    </div>
                    <Slider
                      value={[agent.creativity]}
                      onValueChange={([v]) => setAgentSettings((prev) => prev.map((a) => a.id === agent.id ? { ...a, creativity: v } : a))}
                      max={100}
                      step={5}
                      className="[&>span:first-child>span]:bg-accent [&>span:first-child]:bg-secondary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Deploy Swarm */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <Play className="h-4 w-4 text-primary" />
              Deploy Swarm on Asset
            </CardTitle>
            <Button
              size="sm"
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={deploySwarm}
              disabled={deploying}
            >
              {deploying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              {deploying ? "Deploying..." : "Deploy Swarm"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[240px] rounded-lg bg-sidebar border border-border p-3">
            <div className="flex flex-col gap-1 font-mono text-xs">
              {swarmLogs.length === 0 && (
                <p className="text-muted-foreground">Click Deploy Swarm to see agents working in sequence...</p>
              )}
              {swarmLogs.map((log, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={
                    log.includes("[Triage") ? "text-primary"
                      : log.includes("[Exploit") ? "text-destructive"
                      : log.includes("[Fix") ? "text-success"
                      : log.includes("[Validator") ? "text-warning"
                      : "text-foreground"
                  }
                >
                  <Terminal className="inline h-3 w-3 mr-1.5" />
                  {log}
                </motion.div>
              ))}
              {deploying && (
                <div className="text-primary animate-pulse-glow">
                  <Terminal className="inline h-3 w-3 mr-1.5" />
                  {"_"}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Custom Agent Builder Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create Custom Agent</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Build a specialized security agent for your workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Agent Name</Label>
              <Input placeholder="My Web Fix Agent" className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Specialization</Label>
              <Select defaultValue="web-fix">
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="web-fix">Web Fix Agent</SelectItem>
                  <SelectItem value="app-scanner">App Scanner</SelectItem>
                  <SelectItem value="contract-auditor">Contract Auditor</SelectItem>
                  <SelectItem value="shadow-ai">Shadow AI Detector</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Custom Instructions</Label>
              <Input placeholder="Focus on OWASP Top 10 for React apps..." className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setCreateOpen(false); toast.success("Custom agent created!") }}>
              Create Agent
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
