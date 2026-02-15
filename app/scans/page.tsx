"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Terminal, Clock, XCircle, Bot, Globe, Smartphone, Copy, Check, ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, FileCode } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { activeScans, agents, type AssetType, type Severity } from "@/lib/mock-data"
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

const severityBadge: Record<Severity, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-primary/15 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
}

interface ScanFinding {
  id: string
  title: string
  severity: Severity
  file: string
  line: number
  description: string
  fix: string
}

const scanFindings: Record<string, ScanFinding[]> = {
  "yoursite.com": [
    {
      id: "F-001",
      title: "Reflected XSS on /search",
      severity: "critical",
      file: "/search?q=",
      line: 0,
      description: "User input is reflected in the DOM without sanitization, allowing script injection.",
      fix: `// Before (vulnerable)
app.get('/search', (req, res) => {
  res.send(\`<h1>Results for: \${req.query.q}</h1>\`);
});

// After (secure) - Sanitize all user input
import DOMPurify from 'dompurify';

app.get('/search', (req, res) => {
  const safeQuery = DOMPurify.sanitize(req.query.q || '');
  res.send(\`<h1>Results for: \${safeQuery}</h1>\`);
});`,
    },
    {
      id: "F-002",
      title: "SQL Injection in search API",
      severity: "critical",
      file: "/api/search",
      line: 0,
      description: "Dynamic SQL query constructed from user input without parameterization.",
      fix: `// Before (vulnerable)
const results = await db.query(
  \`SELECT * FROM products WHERE name LIKE '%\${userInput}%'\`
);

// After (secure) - Use parameterized queries
const results = await db.query(
  'SELECT * FROM products WHERE name LIKE $1',
  [\`%\${userInput}%\`]
);`,
    },
  ],
  "defi-protocol": [
    {
      id: "F-003",
      title: "Reentrancy in withdraw()",
      severity: "critical",
      file: "contracts/Vault.sol",
      line: 89,
      description: "External call before state update allows reentrancy attack to drain funds.",
      fix: `// Before (vulnerable)
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount);
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
    balances[msg.sender] -= amount; // State updated AFTER call
}

// After (secure) - Checks-Effects-Interactions pattern
function withdraw(uint256 amount) external nonReentrant {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount; // State updated BEFORE call
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
}`,
    },
    {
      id: "F-004",
      title: "Missing access control on setFee()",
      severity: "high",
      file: "contracts/Governance.sol",
      line: 45,
      description: "The setFee() function lacks the onlyOwner modifier.",
      fix: `// Before (vulnerable)
function setFee(uint256 newFee) external {
    protocolFee = newFee;
}

// After (secure) - Add access control
function setFee(uint256 newFee) external onlyOwner {
    require(newFee <= MAX_FEE, "Fee too high");
    protocolFee = newFee;
    emit FeeUpdated(newFee);
}`,
    },
  ],
  "app.example.com": [
    {
      id: "F-005",
      title: "Insecure CORS policy",
      severity: "high",
      file: "server/cors.config.js",
      line: 12,
      description: "Access-Control-Allow-Origin set to wildcard (*) allowing any domain to make requests.",
      fix: `// Before (vulnerable)
app.use(cors({ origin: '*' }));

// After (secure) - Whitelist allowed origins
const allowedOrigins = [
  'https://app.example.com',
  'https://admin.example.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));`,
    },
    {
      id: "F-006",
      title: "Exposed debug endpoint",
      severity: "high",
      file: "/debug/vars",
      line: 0,
      description: "Debug endpoint exposes environment variables including database credentials.",
      fix: `// Before (vulnerable) - Debug route in production
app.get('/debug/vars', (req, res) => {
  res.json(process.env);
});

// After (secure) - Remove or gate behind auth
if (process.env.NODE_ENV === 'development') {
  app.get('/debug/vars', requireAdmin, (req, res) => {
    const safeVars = { NODE_ENV: process.env.NODE_ENV };
    res.json(safeVars);
  });
}`,
    },
  ],
  "vault-contracts": [
    {
      id: "F-007",
      title: "Integer overflow in token math",
      severity: "medium",
      file: "contracts/Token.sol",
      line: 34,
      description: "Arithmetic operations without overflow checks can lead to incorrect balances.",
      fix: `// Before (vulnerable) - Solidity < 0.8.0
uint256 total = balance + amount; // Can overflow

// After (secure) - Use SafeMath or Solidity >= 0.8.0
// Option 1: Upgrade to Solidity ^0.8.0 (built-in checks)
pragma solidity ^0.8.0;
uint256 total = balance + amount; // Auto-reverts on overflow

// Option 2: Use OpenZeppelin SafeMath
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
using SafeMath for uint256;
uint256 total = balance.add(amount);`,
    },
  ],
  "frontend-app": [
    {
      id: "F-008",
      title: "Prototype pollution in lodash",
      severity: "high",
      file: "package.json",
      line: 24,
      description: "lodash < 4.17.21 is vulnerable to prototype pollution via the merge function.",
      fix: `// Fix: Update lodash to patched version
// In package.json, change:
"lodash": "^4.17.21"

// Or replace with native alternatives:
// Before
import { merge } from 'lodash';
const config = merge(defaults, userInput);

// After - Use structuredClone + spread
const config = { ...defaults, ...structuredClone(userInput) };`,
    },
    {
      id: "F-009",
      title: "Potential prototype pollution in utils.ts",
      severity: "medium",
      file: "src/utils/merge.ts",
      line: 15,
      description: "Deep merge utility does not guard against __proto__ or constructor keys.",
      fix: `// Before (vulnerable)
function deepMerge(target: any, source: any) {
  for (const key in source) {
    target[key] = source[key];
  }
  return target;
}

// After (secure) - Block dangerous keys
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>) {
  const BLOCKED = new Set(['__proto__', 'constructor', 'prototype']);
  for (const key of Object.keys(source)) {
    if (BLOCKED.has(key)) continue;
    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] = deepMerge(
        (target[key] as Record<string, unknown>) || {},
        source[key] as Record<string, unknown>
      );
    } else {
      target[key] = source[key];
    }
  }
  return target;
}`,
    },
  ],
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

export default function ScansPage() {
  const [scans, setScans] = useState<RunScan[]>(activeScans.map(s => ({ ...s })))
  const [completedScans, setCompletedScans] = useState<CompletedScan[]>([])
  const [agenticMode, setAgenticMode] = useState(false)
  const [quickUrl, setQuickUrl] = useState("")
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const completeScan = useCallback((scan: RunScan) => {
    const findings = scanFindings[scan.asset] || [
      {
        id: `F-${Date.now()}`,
        title: "No critical issues found",
        severity: "low" as Severity,
        file: "N/A",
        line: 0,
        description: "Scan completed with no critical or high severity findings.",
        fix: "// No remediation needed - scan passed!\n// Consider running periodic scans to maintain security posture.",
      },
    ]

    const completed: CompletedScan = {
      id: scan.id,
      asset: scan.asset,
      assetType: scan.assetType,
      tool: scan.tool,
      findings,
      completedAt: "just now",
      scanDuration: scan.startedAt,
    }

    setCompletedScans((prev) => [completed, ...prev])
    setScans((prev) => prev.filter((s) => s.id !== scan.id))
    setExpandedResults((prev) => ({ ...prev, [scan.id]: true }))

    const critCount = findings.filter(f => f.severity === "critical").length
    const highCount = findings.filter(f => f.severity === "high").length

    if (critCount > 0) {
      toast.error(`Scan complete: ${scan.asset} -- ${critCount} critical, ${highCount} high severity findings`, { duration: 5000 })
    } else if (highCount > 0) {
      toast.warning(`Scan complete: ${scan.asset} -- ${highCount} high severity findings`, { duration: 5000 })
    } else {
      toast.success(`Scan complete: ${scan.asset} -- No critical issues found`, { duration: 4000 })
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setScans((prev) => {
        const updated = prev.map((scan) => {
          const newProgress = Math.min(scan.progress + 1.8, 100)
          let newStatus = scan.status
          let newLogs = [...scan.logs]

          if (newProgress >= 50 && scan.status === "scanning") {
            newStatus = "analyzing"
            newLogs.push("[INFO] Analysis phase started...")
          }
          if (newProgress >= 80 && scan.status === "analyzing") {
            newStatus = "reporting"
            newLogs.push("[INFO] Generating remediation report...")
          }
          if (newProgress >= 95 && !newLogs.some(l => l.includes("[DONE]"))) {
            newLogs.push("[DONE] Scan complete -- generating fix code...")
          }

          return { ...scan, progress: newProgress, status: newStatus, logs: newLogs }
        })

        const justCompleted = updated.filter(s => s.progress >= 100 && s.status !== "completed")
        justCompleted.forEach(s => {
          setTimeout(() => completeScan(s), 300)
        })

        return updated.filter(s => s.progress < 100)
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

  const statusLabels: Record<string, string> = {
    scanning: "Scanning files...",
    analyzing: "Analyzing results...",
    reporting: "Generating report...",
    completed: "Complete",
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Active Scans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {scans.length} scan{scans.length !== 1 ? "s" : ""} running, {completedScans.length} completed with results.
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
              Enable AI agents to auto-triage and generate fixes in parallel as scans complete.
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
          <Card className="bg-card border-primary/20">
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

      {/* Completed scans with results */}
      <AnimatePresence>
        {completedScans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-success" />
              <h2 className="text-lg font-semibold text-foreground">Scan Results</h2>
              <Badge variant="outline" className="border-success/30 text-success text-xs">{completedScans.length} completed</Badge>
            </div>

            {completedScans.map((scan) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-card border-success/20 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-success" />
                        <CardTitle className="text-foreground text-base font-mono">{scan.asset}</CardTitle>
                        <Badge variant="outline" className={`text-[10px] ${assetTypeBadge[scan.assetType]}`}>
                          {scan.assetType}
                        </Badge>
                        <Badge variant="outline" className={toolColors[scan.tool] || "border-border text-muted-foreground"}>
                          {scan.tool}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() => setExpandedResults(prev => ({ ...prev, [scan.id]: !prev[scan.id] }))}
                      >
                        {scan.findings.length} finding{scan.findings.length !== 1 ? "s" : ""}
                        {expandedResults[scan.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">Completed {scan.completedAt}</span>
                      <div className="flex gap-1.5">
                        {scan.findings.filter(f => f.severity === "critical").length > 0 && (
                          <Badge variant="outline" className={`text-[10px] ${severityBadge.critical}`}>
                            {scan.findings.filter(f => f.severity === "critical").length} Critical
                          </Badge>
                        )}
                        {scan.findings.filter(f => f.severity === "high").length > 0 && (
                          <Badge variant="outline" className={`text-[10px] ${severityBadge.high}`}>
                            {scan.findings.filter(f => f.severity === "high").length} High
                          </Badge>
                        )}
                        {scan.findings.filter(f => f.severity === "medium").length > 0 && (
                          <Badge variant="outline" className={`text-[10px] ${severityBadge.medium}`}>
                            {scan.findings.filter(f => f.severity === "medium").length} Medium
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <AnimatePresence>
                    {expandedResults[scan.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardContent className="pt-0 pb-4 flex flex-col gap-4">
                          {scan.findings.map((finding) => (
                            <div key={finding.id} className="rounded-lg border border-border bg-secondary/30 overflow-hidden">
                              {/* Finding header */}
                              <div className="flex items-start justify-between p-3 pb-2">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${finding.severity === "critical" ? "text-destructive" : finding.severity === "high" ? "text-warning" : "text-primary"}`} />
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{finding.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{finding.description}</p>
                                    {finding.file !== "N/A" && (
                                      <p className="text-[11px] text-muted-foreground font-mono mt-1">
                                        <FileCode className="inline h-3 w-3 mr-1" />
                                        {finding.file}{finding.line > 0 ? `:${finding.line}` : ""}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="outline" className={`text-[10px] shrink-0 ${severityBadge[finding.severity]}`}>
                                  {finding.severity.toUpperCase()}
                                </Badge>
                              </div>

                              {/* Fix code block */}
                              <div className="border-t border-border">
                                <div className="flex items-center justify-between px-3 py-2 bg-background/50">
                                  <span className="text-[11px] font-medium text-success flex items-center gap-1.5">
                                    <ShieldCheck className="h-3 w-3" />
                                    Remediation Code
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => copyCode(finding.fix, finding.id)}
                                  >
                                    {copiedId === finding.id ? (
                                      <>
                                        <Check className="h-3 w-3 text-success" />
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        Copy Fix
                                      </>
                                    )}
                                  </Button>
                                </div>
                                <ScrollArea className="max-h-[200px]">
                                  <pre className="p-3 text-xs font-mono text-foreground/90 bg-[#0B1410] overflow-x-auto whitespace-pre">
                                    {finding.fix}
                                  </pre>
                                </ScrollArea>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active scans in progress */}
      {scans.length > 0 && (
        <div className="flex flex-col gap-4">
          {completedScans.length > 0 && (
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Still Scanning</h2>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {scans.map((scan, i) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
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
                        <div className="text-primary animate-pulse">
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
      )}

      {/* All done state */}
      {scans.length === 0 && completedScans.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <ShieldCheck className="h-12 w-12 text-success mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No Active Scans</h3>
            <p className="text-sm text-muted-foreground">Start a scan above or navigate to Assets to scan a connected repository.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
