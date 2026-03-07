"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Terminal, Clock, XCircle, Bot, Globe, Smartphone, Copy, Check,
  ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, FileCode,
  Zap, Code, Shield, Search, ScanLine, CheckCircle2, Loader2,
  ExternalLink, X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { agents, type AssetType } from "@/lib/mock-data"
import type { ScanResult, Finding, Severity } from "@/lib/types"
import { agentTextColor, agentBgColor } from "@/lib/agent-colors"
import { toast } from "sonner"

/* ── Type definitions ───────────────────────────────────────── */
type ScanType = "website" | "repo" | "contract" | "api"

interface ActiveScan {
  id: string
  target: string
  type: ScanType
  status: "initializing" | "scanning" | "analyzing" | "completed" | "failed"
  progress: number
  checks: ScanCheck[]
  startedAt: Date
  result?: ScanResult
}

interface ScanCheck {
  id: string
  name: string
  status: "pending" | "running" | "passed" | "failed" | "warning"
}

/* ── Check configurations per scan type ─────────────────────── */
const scanChecks: Record<ScanType, ScanCheck[]> = {
  website: [
    { id: "headers", name: "Security Headers", status: "pending" },
    { id: "tls", name: "TLS/SSL Configuration", status: "pending" },
    { id: "sensitive", name: "Exposed Files", status: "pending" },
    { id: "cors", name: "CORS Policy", status: "pending" },
    { id: "cookies", name: "Cookie Security", status: "pending" },
  ],
  repo: [
    { id: "secrets", name: "Hardcoded Secrets", status: "pending" },
    { id: "deps", name: "Dependency Vulnerabilities", status: "pending" },
    { id: "security", name: "Security Configuration", status: "pending" },
  ],
  contract: [
    { id: "fetch", name: "Fetching Contract Source", status: "pending" },
    { id: "reentrancy", name: "Reentrancy Analysis", status: "pending" },
    { id: "access", name: "Access Control", status: "pending" },
    { id: "overflow", name: "Integer Safety", status: "pending" },
    { id: "compiler", name: "Compiler Version", status: "pending" },
  ],
  api: [
    { id: "graphql", name: "GraphQL Introspection", status: "pending" },
    { id: "swagger", name: "OpenAPI Exposure", status: "pending" },
    { id: "debug", name: "Debug Endpoints", status: "pending" },
    { id: "ratelimit", name: "Rate Limiting", status: "pending" },
    { id: "jwt", name: "JWT Security", status: "pending" },
  ],
}

/* ── Color mappings ─────────────────────────────────────────── */
const severityBadge: Record<Severity, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-primary/15 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
  info: "bg-muted text-muted-foreground border-border",
}

const scanTypeBadge: Record<ScanType, { bg: string; text: string; icon: React.ReactNode }> = {
  website: { bg: "bg-success/10", text: "text-success", icon: <Globe className="h-3.5 w-3.5" /> },
  repo: { bg: "bg-primary/10", text: "text-primary", icon: <Code className="h-3.5 w-3.5" /> },
  contract: { bg: "bg-accent/10", text: "text-accent", icon: <Shield className="h-3.5 w-3.5" /> },
  api: { bg: "bg-warning/10", text: "text-warning", icon: <Terminal className="h-3.5 w-3.5" /> },
}

/* ── Detect scan type from input ────────────────────────────── */
function detectScanType(input: string): ScanType {
  const trimmed = input.trim().toLowerCase()
  
  // Contract address
  if (/^0x[a-f0-9]{40}$/i.test(trimmed)) return "contract"
  
  // GitHub repo
  if (trimmed.includes("github.com/") || /^[a-z0-9-]+\/[a-z0-9._-]+$/i.test(trimmed)) return "repo"
  
  // Default to website
  return "website"
}

/* ════════════════════════════════════════════════════════════ */
export default function ScansPage() {
  const [activeScans, setActiveScans] = useState<ActiveScan[]>([])
  const [completedScans, setCompletedScans] = useState<ScanResult[]>([])
  const [agenticMode, setAgenticMode] = useState(false)
  const [quickUrl, setQuickUrl] = useState("")
  const [activeTab, setActiveTab] = useState("active")
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
const scanIdRef = useRef(0)
  
  /* ── Start a real scan ────────────────────────────────────── */
  const startRealScan = useCallback(async (target: string, type: ScanType) => {
    // Generate a truly unique ID using counter + timestamp + random suffix
    const scanId = `scan-${++scanIdRef.current}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const checks = scanChecks[type].map(c => ({ ...c, status: "pending" as const }))
    
    const newScan: ActiveScan = {
      id: scanId,
      target,
      type,
      status: "initializing",
      progress: 0,
      checks,
      startedAt: new Date(),
    }
    
    setActiveScans(prev => [newScan, ...prev])
    setActiveTab("active")
    setIsScanning(true)
    
    // Simulate check progress
    const updateCheck = (checkId: string, status: ScanCheck["status"]) => {
      setActiveScans(prev => prev.map(scan => {
        if (scan.id !== scanId) return scan
        return {
          ...scan,
          checks: scan.checks.map(c => c.id === checkId ? { ...c, status } : c),
          progress: Math.min(scan.progress + 15, 90),
          status: "scanning",
        }
      }))
    }
    
    // Run through checks visually
    for (let i = 0; i < checks.length; i++) {
      await new Promise(r => setTimeout(r, 300))
      updateCheck(checks[i].id, "running")
      await new Promise(r => setTimeout(r, 400))
    }
    
    // Make real API call
    try {
      const endpoint = `/api/scan/${type}`
      const body = type === "contract" 
        ? { address: target }
        : { url: target }
      
      setActiveScans(prev => prev.map(scan => 
        scan.id === scanId ? { ...scan, status: "analyzing", progress: 85 } : scan
      ))
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      
      const result: ScanResult = await response.json()
      
      // Update checks based on findings
      setActiveScans(prev => prev.map(scan => {
        if (scan.id !== scanId) return scan
        
        const updatedChecks = scan.checks.map(check => {
          const hasIssue = result.findings?.some(f => 
            f.id.toLowerCase().includes(check.id) || 
            f.title.toLowerCase().includes(check.name.toLowerCase().split(" ")[0])
          )
          return {
            ...check,
            status: (hasIssue ? "warning" : "passed") as ScanCheck["status"],
          }
        })
        
        return {
          ...scan,
          status: "completed",
          progress: 100,
          checks: updatedChecks,
          result,
        }
      }))
      
      // Move to completed after delay
      setTimeout(() => {
        setActiveScans(prev => prev.filter(s => s.id !== scanId))
        // Use the local scanId to guarantee uniqueness (API id might clash)
        const uniqueResult = { ...result, id: scanId }
        setCompletedScans(prev => {
          // Prevent duplicates from strict mode double-renders
          if (prev.some(s => s.id === scanId)) return prev
          return [uniqueResult, ...prev]
        })
        setExpandedResults(prev => ({ ...prev, [scanId]: true }))
        setActiveTab("results")
        
        const { critical = 0, high = 0 } = result.summary || {}
        if (critical > 0) {
          toast.error(`Scan complete: ${target}`, {
            description: `${critical} critical, ${high} high severity findings`,
          })
        } else if (high > 0) {
          toast.warning(`Scan complete: ${target}`, {
            description: `${high} high severity findings`,
          })
        } else {
          toast.success(`Scan complete: ${target}`, {
            description: result.summary?.total === 0 
              ? "No issues detected" 
              : `${result.summary?.total} findings`,
          })
        }
      }, 1000)
      
    } catch (error) {
      setActiveScans(prev => prev.map(scan => 
        scan.id === scanId ? { 
          ...scan, 
          status: "failed", 
          progress: 100,
          checks: scan.checks.map(c => ({ ...c, status: "failed" as const })),
        } : scan
      ))
      
      toast.error(`Scan failed: ${target}`, {
        description: error instanceof Error ? error.message : "Unknown error",
      })
      
      setTimeout(() => {
        setActiveScans(prev => prev.filter(s => s.id !== scanId))
      }, 3000)
    } finally {
      setIsScanning(false)
    }
  }, [])

  /* ── Quick scan handler ───────────────────────────────────── */
  const startQuickScan = useCallback((overrideType?: ScanType) => {
    if (!quickUrl.trim()) {
      toast.error("Enter a URL, repo, or contract address to scan")
      return
    }
    
    const type = overrideType || detectScanType(quickUrl)
    startRealScan(quickUrl.trim(), type)
    setQuickUrl("")
  }, [quickUrl, startRealScan])

  /* ── Copy code helper ─────────────────────────────────────── */
  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success("Code copied to clipboard")
    setTimeout(() => setCopiedId(null), 2000)
  }

  /* ── Stats ────────────────────────────────────────────────── */
  const totalFindings = completedScans.reduce((acc, s) => acc + (s.summary?.total || 0), 0)
  const criticalFindings = completedScans.reduce((acc, s) => acc + (s.summary?.critical || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      {/* ── HERO: Quick Scan ─────────────────────────────────── */}
      <Card className="bg-card border-primary/20 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground tracking-tight">Start a Scan</h1>
                  <p className="text-xs text-muted-foreground">Real security analysis - paste a URL, repo, or contract address</p>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="agentic" className="text-xs text-muted-foreground hidden sm:inline">Agentic Mode</Label>
                      <Switch id="agentic" checked={agenticMode} onCheckedChange={setAgenticMode} className="data-[state=checked]:bg-primary" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-popover text-popover-foreground border-border max-w-xs">
                    AI agents auto-triage and generate fixes in parallel as scans complete.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Input row */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="https://example.com, github.com/user/repo, or 0x..."
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono text-sm h-10"
                  onKeyDown={(e) => { if (e.key === "Enter" && !isScanning) startQuickScan() }}
                  disabled={isScanning}
                />
              </div>
              <Button
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-10 px-5 shrink-0"
                onClick={() => startQuickScan()}
                disabled={isScanning}
              >
                {isScanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {isScanning ? "Scanning..." : "Scan Now"}
              </Button>
            </div>

            {/* Scan type buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" 
                onClick={() => startQuickScan("website")}
                disabled={isScanning || !quickUrl.trim()}
              >
                <Globe className="h-3.5 w-3.5 text-success" /> Website
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" 
                onClick={() => startQuickScan("api")}
                disabled={isScanning || !quickUrl.trim()}
              >
                <Terminal className="h-3.5 w-3.5 text-warning" /> API
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" 
                onClick={() => startQuickScan("repo")}
                disabled={isScanning || !quickUrl.trim()}
              >
                <Code className="h-3.5 w-3.5 text-primary" /> Repo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" 
                onClick={() => startQuickScan("contract")}
                disabled={isScanning || !quickUrl.trim()}
              >
                <Shield className="h-3.5 w-3.5 text-accent" /> Smart Contract
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Agentic Mode panel ───────────────────────────────── */}
      <AnimatePresence>
        {agenticMode && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="bg-card border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Agentic Mode Active</span>
                  <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">4 agents</Badge>
                </div>
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
      </AnimatePresence>

      {/* ── Tabs: Active / Results ───────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="active" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground">
            <ScanLine className="h-3.5 w-3.5" />
            Active
            {activeScans.length > 0 && (
              <Badge variant="outline" className="ml-1 text-[10px] border-primary/30 text-primary h-4 px-1">{activeScans.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Results
            {completedScans.length > 0 && (
              <Badge variant="outline" className="ml-1 text-[10px] border-success/30 text-success h-4 px-1">{completedScans.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Active scans tab ─────────────────────────────────── */}
        <TabsContent value="active" className="mt-4">
          {activeScans.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                <ScanLine className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">No Active Scans</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Start a new scan above to analyze your assets for vulnerabilities.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {activeScans.map((scan, i) => (
                <motion.div
                  key={`${scan.id}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="bg-card border-border overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-md ${scanTypeBadge[scan.type].bg}`}>
                            <span className={scanTypeBadge[scan.type].text}>{scanTypeBadge[scan.type].icon}</span>
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold text-foreground truncate max-w-[180px]">
                              {scan.target}
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground capitalize">{scan.type} scan</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${
                          scan.status === "completed" ? "border-success/30 text-success" :
                          scan.status === "failed" ? "border-destructive/30 text-destructive" :
                          "border-primary/30 text-primary"
                        }`}>
                          {scan.status === "initializing" && "Initializing..."}
                          {scan.status === "scanning" && "Scanning..."}
                          {scan.status === "analyzing" && "Analyzing..."}
                          {scan.status === "completed" && "Complete"}
                          {scan.status === "failed" && "Failed"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Progress value={scan.progress} className="h-1.5 mb-4" />
                      
                      {/* Real-time checks */}
                      <div className="space-y-2">
                        {scan.checks.map((check) => (
                          <div key={check.id} className="flex items-center gap-2">
                            {check.status === "pending" && (
                              <div className="h-4 w-4 rounded-full border border-border" />
                            )}
                            {check.status === "running" && (
                              <Loader2 className="h-4 w-4 text-primary animate-spin" />
                            )}
                            {check.status === "passed" && (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            )}
                            {check.status === "warning" && (
                              <AlertTriangle className="h-4 w-4 text-warning" />
                            )}
                            {check.status === "failed" && (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span className={`text-xs ${
                              check.status === "running" ? "text-foreground" :
                              check.status === "passed" ? "text-success" :
                              check.status === "warning" ? "text-warning" :
                              check.status === "failed" ? "text-destructive" :
                              "text-muted-foreground"
                            }`}>
                              {check.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Results tab ──────────────────────────────────────── */}
        <TabsContent value="results" className="mt-4">
          {completedScans.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                <ShieldCheck className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">No Results Yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Completed scans will appear here with detailed findings.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
            {completedScans.map((result, i) => (
              <motion.div
                key={`${result.id}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                  <Card className="bg-card border-border overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-md ${scanTypeBadge[result.scanType as ScanType]?.bg || "bg-muted"}`}>
                            <span className={scanTypeBadge[result.scanType as ScanType]?.text || "text-muted-foreground"}>
                              {scanTypeBadge[result.scanType as ScanType]?.icon || <Globe className="h-3.5 w-3.5" />}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold text-foreground">{result.target}</CardTitle>
                            <p className="text-[10px] text-muted-foreground">
                              Scanned {new Date(result.completedAt).toLocaleString()} | {result.duration}ms
                              {result.metadata?.detectedStack && (
                                <span className="ml-2 text-primary">
                                  Stack: {[
                                    result.metadata.detectedStack.framework,
                                    result.metadata.detectedStack.cms,
                                    result.metadata.detectedStack.server
                                  ].filter(Boolean).join(" + ") || "Unknown"}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Summary badges */}
                          {result.summary?.critical > 0 && (
                            <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">
                              {result.summary.critical} Critical
                            </Badge>
                          )}
                          {result.summary?.high > 0 && (
                            <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">
                              {result.summary.high} High
                            </Badge>
                          )}
                          {result.summary?.total === 0 && (
                            <Badge variant="outline" className="text-[10px] border-success/30 text-success">
                              No Issues
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setExpandedResults(prev => ({ ...prev, [result.id]: !prev[result.id] }))}
                          >
                            {expandedResults[result.id] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <AnimatePresence>
                      {expandedResults[result.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <CardContent className="pt-0 border-t border-border">
                            {result.findings?.length === 0 ? (
                              <div className="py-6 text-center">
                                <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No vulnerabilities detected</p>
                              </div>
                            ) : (
                              <ScrollArea className="max-h-[400px]">
                                <div className="space-y-3 py-3">
                                  {result.findings?.map((finding) => (
                                    <div key={finding.id} className="p-3 rounded-lg border border-border bg-secondary/30">
                                      <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                          <AlertTriangle className={`h-4 w-4 shrink-0 ${
                                            finding.severity === "critical" ? "text-destructive" :
                                            finding.severity === "high" ? "text-warning" :
                                            "text-muted-foreground"
                                          }`} />
                                          <span className="text-sm font-medium text-foreground">{finding.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className={`text-[10px] uppercase ${severityBadge[finding.severity]}`}>
                                            {finding.severity}
                                          </Badge>
                                          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                                            CVSS {finding.cvss}
                                          </Badge>
                                        </div>
                                      </div>
                                      <p className="text-xs text-muted-foreground mb-2">{finding.description}</p>
                                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <FileCode className="h-3 w-3" />
                                        <span className="font-mono">{finding.location}</span>
                                      </div>
                                      
                                      {/* Remediation */}
                                      {finding.remediation && (
                                        <div className="mt-3 p-2 rounded bg-background border border-border">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-semibold text-success">Fix: {finding.remediation.title}</span>
                                            {finding.remediation.code && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 px-1.5 text-[10px]"
                                                onClick={() => copyCode(finding.remediation.code!, finding.id)}
                                              >
                                                {copiedId === finding.id ? (
                                                  <Check className="h-3 w-3 mr-1" />
                                                ) : (
                                                  <Copy className="h-3 w-3 mr-1" />
                                                )}
                                                Copy
                                              </Button>
                                            )}
                                          </div>
                                          {finding.remediation.code && (
                                            <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-[100px]">
                                              {finding.remediation.code.slice(0, 300)}
                                              {finding.remediation.code.length > 300 && "..."}
                                            </pre>
                                          )}
                                          {finding.remediation.reference && (
                                            <a
                                              href={finding.remediation.reference}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1"
                                            >
                                              <ExternalLink className="h-3 w-3" />
                                              Reference
                                            </a>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            )}
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Summary Stats ────────────────────────────────────── */}
      {completedScans.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Total Scans</p>
                  <p className="text-xl font-bold text-foreground">{completedScans.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Findings</p>
                  <p className="text-xl font-bold text-foreground">{totalFindings}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Critical</p>
                  <p className={`text-xl font-bold ${criticalFindings > 0 ? "text-destructive" : "text-success"}`}>
                    {criticalFindings}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5"
                onClick={() => {
                  setCompletedScans([])
                  setExpandedResults({})
                  toast.success("Scan history cleared")
                }}
              >
                <X className="h-3.5 w-3.5" />
                Clear History
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
