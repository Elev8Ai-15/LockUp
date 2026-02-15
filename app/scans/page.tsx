"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Terminal, Clock, XCircle, Bot, Globe, Smartphone, Copy, Check,
  ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, FileCode,
  Zap, Code, Shield, Search, ScanLine,
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
import { activeScans, agents, type AssetType, type Severity } from "@/lib/mock-data"
import { agentTextColor, agentBgColor } from "@/lib/agent-colors"
import { toast } from "sonner"

/* ── colour maps ────────────────────────────────────────── */
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

const severityBadge: Record<Severity, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-primary/15 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
}

/* ── types ──────────────────────────────────────────────── */
interface ScanFinding {
  id: string
  title: string
  severity: Severity
  file: string
  line: number
  description: string
  fix: string
}

interface CompletedScan {
  id: string
  asset: string
  assetType: AssetType
  tool: string
  findings: ScanFinding[]
  completedAt: string
  scanDuration: string
}

interface RunScan {
  id: string
  asset: string
  assetType: AssetType
  tool: string
  progress: number
  status: "scanning" | "analyzing" | "reporting" | "completed"
  logs: string[]
  startedAt: string
}

/* ── findings database ──────────────────────────────────── */
const scanFindings: Record<string, ScanFinding[]> = {
  "yoursite.com": [
    {
      id: "F-001", title: "Reflected XSS on /search", severity: "critical",
      file: "/search?q=", line: 0,
      description: "User input is reflected in the DOM without sanitization, allowing script injection.",
      fix: `// Before (vulnerable)\napp.get('/search', (req, res) => {\n  res.send(\`<h1>Results for: \${req.query.q}</h1>\`);\n});\n\n// After (secure) - Sanitize all user input\nimport DOMPurify from 'dompurify';\n\napp.get('/search', (req, res) => {\n  const safeQuery = DOMPurify.sanitize(req.query.q || '');\n  res.send(\`<h1>Results for: \${safeQuery}</h1>\`);\n});`,
    },
    {
      id: "F-002", title: "SQL Injection in search API", severity: "critical",
      file: "/api/search", line: 0,
      description: "Dynamic SQL query constructed from user input without parameterization.",
      fix: `// Before (vulnerable)\nconst results = await db.query(\n  \`SELECT * FROM products WHERE name LIKE '%\${userInput}%'\`\n);\n\n// After (secure) - Use parameterized queries\nconst results = await db.query(\n  'SELECT * FROM products WHERE name LIKE $1',\n  [\`%\${userInput}%\`]\n);`,
    },
  ],
  "defi-protocol": [
    {
      id: "F-003", title: "Reentrancy in withdraw()", severity: "critical",
      file: "contracts/Vault.sol", line: 89,
      description: "External call before state update allows reentrancy attack to drain funds.",
      fix: `// Before (vulnerable)\nfunction withdraw(uint256 amount) external {\n    require(balances[msg.sender] >= amount);\n    (bool success, ) = msg.sender.call{value: amount}("");\n    require(success);\n    balances[msg.sender] -= amount;\n}\n\n// After (secure) - Checks-Effects-Interactions\nfunction withdraw(uint256 amount) external nonReentrant {\n    require(balances[msg.sender] >= amount);\n    balances[msg.sender] -= amount;\n    (bool success, ) = msg.sender.call{value: amount}("");\n    require(success);\n}`,
    },
    {
      id: "F-004", title: "Missing access control on setFee()", severity: "high",
      file: "contracts/Governance.sol", line: 45,
      description: "The setFee() function lacks the onlyOwner modifier.",
      fix: `// Before (vulnerable)\nfunction setFee(uint256 newFee) external {\n    protocolFee = newFee;\n}\n\n// After (secure) - Add access control\nfunction setFee(uint256 newFee) external onlyOwner {\n    require(newFee <= MAX_FEE, "Fee too high");\n    protocolFee = newFee;\n    emit FeeUpdated(newFee);\n}`,
    },
  ],
  "app.example.com": [
    {
      id: "F-005", title: "Insecure CORS policy", severity: "high",
      file: "server/cors.config.js", line: 12,
      description: "Access-Control-Allow-Origin set to wildcard (*) allowing any domain to make requests.",
      fix: `// Before (vulnerable)\napp.use(cors({ origin: '*' }));\n\n// After (secure) - Whitelist origins\nconst allowedOrigins = [\n  'https://app.example.com',\n  'https://admin.example.com',\n];\n\napp.use(cors({\n  origin: (origin, callback) => {\n    if (!origin || allowedOrigins.includes(origin)) {\n      callback(null, true);\n    } else {\n      callback(new Error('Not allowed by CORS'));\n    }\n  },\n  credentials: true,\n}));`,
    },
    {
      id: "F-006", title: "Exposed debug endpoint", severity: "high",
      file: "/debug/vars", line: 0,
      description: "Debug endpoint exposes environment variables including database credentials.",
      fix: `// Before (vulnerable)\napp.get('/debug/vars', (req, res) => {\n  res.json(process.env);\n});\n\n// After (secure) - Remove or gate behind auth\nif (process.env.NODE_ENV === 'development') {\n  app.get('/debug/vars', requireAdmin, (req, res) => {\n    const safeVars = { NODE_ENV: process.env.NODE_ENV };\n    res.json(safeVars);\n  });\n}`,
    },
  ],
  "vault-contracts": [
    {
      id: "F-007", title: "Integer overflow in token math", severity: "medium",
      file: "contracts/Token.sol", line: 34,
      description: "Arithmetic operations without overflow checks can lead to incorrect balances.",
      fix: `// Before (vulnerable)\nuint256 total = balance + amount; // Can overflow\n\n// After (secure) - Use Solidity >= 0.8.0\npragma solidity ^0.8.0;\nuint256 total = balance + amount; // Auto-reverts on overflow`,
    },
  ],
  "frontend-app": [
    {
      id: "F-008", title: "Prototype pollution in lodash", severity: "high",
      file: "package.json", line: 24,
      description: "lodash < 4.17.21 is vulnerable to prototype pollution via the merge function.",
      fix: `// Fix: Update lodash\n"lodash": "^4.17.21"\n\n// Or replace with native:\nconst config = { ...defaults, ...structuredClone(userInput) };`,
    },
  ],
}

/* ── status label map ───────────────────────────────────── */
const statusLabels: Record<string, string> = {
  scanning: "Scanning...",
  analyzing: "Analyzing...",
  reporting: "Generating report...",
  completed: "Complete",
}

/* ════════════════════════════════════════════════════════ */
export default function ScansPage() {
  const [scans, setScans] = useState<RunScan[]>(activeScans.map((s) => ({ ...s })))
  const [completedScans, setCompletedScans] = useState<CompletedScan[]>([])
  const [agenticMode, setAgenticMode] = useState(false)
  const [quickUrl, setQuickUrl] = useState("")
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("active")

  /* ── scan completion handler ──────────────────────────── */
  const completeScan = useCallback((scan: RunScan) => {
    const findings = scanFindings[scan.asset] || [
      {
        id: `F-${Date.now()}`, title: "No critical issues found", severity: "low" as Severity,
        file: "N/A", line: 0,
        description: "Scan completed with no critical or high severity findings.",
        fix: "// No remediation needed - scan passed!",
      },
    ]
    const completed: CompletedScan = {
      id: scan.id, asset: scan.asset, assetType: scan.assetType, tool: scan.tool,
      findings, completedAt: "just now", scanDuration: scan.startedAt,
    }
    setCompletedScans((prev) => [completed, ...prev])
    setScans((prev) => prev.filter((s) => s.id !== scan.id))
    setExpandedResults((prev) => ({ ...prev, [scan.id]: true }))

    const critCount = findings.filter((f) => f.severity === "critical").length
    const highCount = findings.filter((f) => f.severity === "high").length
    if (critCount > 0) {
      toast.error(`Scan complete: ${scan.asset} -- ${critCount} critical, ${highCount} high severity`, { duration: 5000 })
    } else if (highCount > 0) {
      toast.warning(`Scan complete: ${scan.asset} -- ${highCount} high severity findings`, { duration: 5000 })
    } else {
      toast.success(`Scan complete: ${scan.asset} -- No critical issues`, { duration: 4000 })
    }
    // Auto-switch to results tab
    setActiveTab("results")
  }, [])

  /* ── progress ticker ──────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setScans((prev) => {
        const updated = prev.map((scan) => {
          const newProgress = Math.min(scan.progress + 1.8, 100)
          let newStatus = scan.status
          const newLogs = [...scan.logs]

          if (newProgress >= 50 && scan.status === "scanning") {
            newStatus = "analyzing"
            newLogs.push("[INFO] Analysis phase started...")
          }
          if (newProgress >= 80 && scan.status === "analyzing") {
            newStatus = "reporting"
            newLogs.push("[INFO] Generating remediation report...")
          }
          if (newProgress >= 95 && !newLogs.some((l) => l.includes("[DONE]"))) {
            newLogs.push("[DONE] Scan complete -- generating fix code...")
          }
          return { ...scan, progress: newProgress, status: newStatus, logs: newLogs }
        })

        const justCompleted = updated.filter((s) => s.progress >= 100 && s.status !== "completed")
        justCompleted.forEach((s) => {
          setTimeout(() => completeScan(s), 300)
        })
        return updated.filter((s) => s.progress < 100)
      })
    }, 1200)
    return () => clearInterval(interval)
  }, [completeScan])

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success("Fix code copied to clipboard")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const startQuickScan = (type: string) => {
    if (!quickUrl.trim()) {
      toast.error("Enter a URL or address to scan")
      return
    }
    toast.success(`${type} scan started for ${quickUrl}`, { description: "Estimated completion: ~47 seconds." })
    setQuickUrl("")
  }

  const totalFindings = completedScans.reduce((acc, s) => acc + s.findings.length, 0)
  const criticalFindings = completedScans.reduce((acc, s) => acc + s.findings.filter((f) => f.severity === "critical").length, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* ── HERO: Quick Scan ─────────────────────────────── */}
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
                  <p className="text-xs text-muted-foreground">Paste a URL, repo, or contract address to scan instantly</p>
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
                  placeholder="https://yoursite.com, github.com/user/repo, or 0xContractAddress"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono text-sm h-10"
                  onKeyDown={(e) => { if (e.key === "Enter") startQuickScan("Full Spectrum") }}
                />
              </div>
              <Button
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-10 px-5 shrink-0"
                onClick={() => startQuickScan("Full Spectrum")}
              >
                <Zap className="h-4 w-4" />
                Scan Now
              </Button>
            </div>

            {/* Scan type buttons */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" onClick={() => startQuickScan("Website DAST")}>
                <Globe className="h-3.5 w-3.5 text-success" /> Website
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" onClick={() => startQuickScan("Web App")}>
                <Smartphone className="h-3.5 w-3.5 text-primary" /> Web App
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" onClick={() => startQuickScan("Code Repo")}>
                <Code className="h-3.5 w-3.5 text-primary" /> Repo
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" onClick={() => startQuickScan("Smart Contract")}>
                <Shield className="h-3.5 w-3.5 text-accent" /> Smart Contract
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Agentic Mode panel ───────────────────────────── */}
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

      {/* ── Tabs: Active / Results ───────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="active" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground">
            <ScanLine className="h-3.5 w-3.5" />
            Active
            {scans.length > 0 && (
              <Badge variant="outline" className="ml-1 text-[10px] border-primary/30 text-primary h-4 px-1">{scans.length}</Badge>
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

        {/* ── Active scans tab ─────────────────────────────── */}
        <TabsContent value="active" className="mt-4">
          {scans.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                <ScanLine className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">No Active Scans</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Start a new scan above to analyze your assets for vulnerabilities.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {scans.map((scan, i) => (
                <motion.div key={scan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}>
                  <Card className="bg-card border-border overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground font-mono">{scan.asset}</span>
                          <Badge variant="outline" className={`text-[10px] ${assetTypeBadge[scan.assetType]}`}>{scan.assetType}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${toolColors[scan.tool] || "border-border text-muted-foreground"}`}>{scan.tool}</Badge>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => { setScans((prev) => prev.filter((s) => s.id !== scan.id)); toast.info(`Scan cancelled for ${scan.asset}`) }}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover text-popover-foreground border-border">Cancel</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{scan.startedAt}</span>
                        <span className="text-[11px] text-primary">{statusLabels[scan.status]}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-muted-foreground">Progress</span>
                          <span className="text-[11px] font-mono text-primary">{Math.round(scan.progress)}%</span>
                        </div>
                        <Progress value={scan.progress} className="h-1.5 bg-secondary [&>div]:bg-primary" />
                      </div>
                      <ScrollArea className="h-[100px] rounded-lg bg-[#0B1410] border border-border p-2.5">
                        <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                          {scan.logs.map((log, idx) => (
                            <div key={idx} className={log.includes("[WARN]") ? "text-warning" : log.includes("[DONE]") ? "text-success" : "text-muted-foreground"}>
                              <Terminal className="inline h-3 w-3 mr-1" />{log}
                            </div>
                          ))}
                          <div className="text-primary animate-pulse"><Terminal className="inline h-3 w-3 mr-1" />{"_"}</div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Results tab ──────────────────────────────────── */}
        <TabsContent value="results" className="mt-4">
          {completedScans.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                <ShieldCheck className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">No Results Yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Completed scans will appear here with vulnerability findings and remediation code you can copy.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Summary bar */}
              <div className="flex items-center gap-4 px-1">
                <span className="text-sm text-muted-foreground">{completedScans.length} scan{completedScans.length !== 1 ? "s" : ""} completed</span>
                <span className="text-xs text-muted-foreground">{totalFindings} finding{totalFindings !== 1 ? "s" : ""}</span>
                {criticalFindings > 0 && (
                  <Badge variant="outline" className={`text-[10px] ${severityBadge.critical}`}>{criticalFindings} Critical</Badge>
                )}
              </div>

              {completedScans.map((scan) => (
                <Card key={scan.id} className="bg-card border-success/20 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                        <span className="text-sm font-semibold text-foreground font-mono">{scan.asset}</span>
                        <Badge variant="outline" className={`text-[10px] ${assetTypeBadge[scan.assetType]}`}>{scan.assetType}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${toolColors[scan.tool] || "border-border text-muted-foreground"}`}>{scan.tool}</Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => setExpandedResults((prev) => ({ ...prev, [scan.id]: !prev[scan.id] }))}>
                        {scan.findings.length} finding{scan.findings.length !== 1 ? "s" : ""}
                        {expandedResults[scan.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-muted-foreground">Completed {scan.completedAt}</span>
                      <div className="flex gap-1">
                        {(["critical", "high", "medium"] as Severity[]).map((sev) => {
                          const count = scan.findings.filter((f) => f.severity === sev).length
                          return count > 0 ? (
                            <Badge key={sev} variant="outline" className={`text-[10px] ${severityBadge[sev]}`}>{count} {sev.charAt(0).toUpperCase() + sev.slice(1)}</Badge>
                          ) : null
                        })}
                      </div>
                    </div>
                  </CardHeader>

                  <AnimatePresence>
                    {expandedResults[scan.id] && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <CardContent className="pt-0 pb-4 flex flex-col gap-3">
                          {scan.findings.map((finding) => (
                            <div key={finding.id} className="rounded-lg border border-border bg-secondary/30 overflow-hidden">
                              <div className="flex items-start justify-between p-3 pb-2">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${finding.severity === "critical" ? "text-destructive" : finding.severity === "high" ? "text-warning" : "text-primary"}`} />
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{finding.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{finding.description}</p>
                                    {finding.file !== "N/A" && (
                                      <p className="text-[11px] text-muted-foreground font-mono mt-1">
                                        <FileCode className="inline h-3 w-3 mr-1" />{finding.file}{finding.line > 0 ? `:${finding.line}` : ""}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="outline" className={`text-[10px] shrink-0 ${severityBadge[finding.severity]}`}>{finding.severity.toUpperCase()}</Badge>
                              </div>
                              <div className="border-t border-border">
                                <div className="flex items-center justify-between px-3 py-2 bg-background/50">
                                  <span className="text-[11px] font-medium text-success flex items-center gap-1.5">
                                    <ShieldCheck className="h-3 w-3" />Remediation Code
                                  </span>
                                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => copyCode(finding.fix, finding.id)}>
                                    {copiedId === finding.id ? (<><Check className="h-3 w-3 text-success" />Copied</>) : (<><Copy className="h-3 w-3" />Copy Fix</>)}
                                  </Button>
                                </div>
                                <ScrollArea className="max-h-[180px]">
                                  <pre className="p-3 text-xs font-mono text-foreground/90 bg-[#0B1410] overflow-x-auto whitespace-pre">{finding.fix}</pre>
                                </ScrollArea>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
