"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Zap, Search, Globe, Smartphone, Code, Shield, Terminal,
  Clock, ShieldCheck, AlertTriangle, FileCode, Copy, Check,
  ChevronDown, ChevronUp, ScanLine, XCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type Severity } from "@/lib/mock-data"
import { toast } from "sonner"

/* ── colour maps ────────────────────────────────────────── */
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

interface RunScan {
  id: string
  asset: string
  scanType: string
  progress: number
  status: "scanning" | "analyzing" | "reporting" | "completed"
  logs: string[]
  startedAt: string
}

interface CompletedScan {
  id: string
  asset: string
  scanType: string
  findings: ScanFinding[]
  completedAt: string
}

/* ── findings database ──────────────────────────────────── */
const findingsForTarget = (target: string): ScanFinding[] => {
  const t = target.toLowerCase()
  if (t.includes("0x") || t.includes("contract") || t.includes("sol")) {
    return [
      {
        id: `F-${Date.now()}-1`, title: "Reentrancy in withdraw()", severity: "critical",
        file: "contracts/Vault.sol", line: 89,
        description: "External call before state update allows reentrancy attack to drain funds.",
        fix: `// Before (vulnerable)\nfunction withdraw(uint256 amount) external {\n    require(balances[msg.sender] >= amount);\n    (bool success, ) = msg.sender.call{value: amount}("");\n    require(success);\n    balances[msg.sender] -= amount;\n}\n\n// After (secure) - Checks-Effects-Interactions + ReentrancyGuard\nimport "@openzeppelin/contracts/security/ReentrancyGuard.sol";\n\nfunction withdraw(uint256 amount) external nonReentrant {\n    require(balances[msg.sender] >= amount);\n    balances[msg.sender] -= amount;\n    (bool success, ) = msg.sender.call{value: amount}("");\n    require(success);\n}`,
      },
      {
        id: `F-${Date.now()}-2`, title: "Missing access control on setFee()", severity: "high",
        file: "contracts/Governance.sol", line: 45,
        description: "The setFee() function lacks the onlyOwner modifier, allowing anyone to change protocol fees.",
        fix: `// Before (vulnerable)\nfunction setFee(uint256 newFee) external {\n    protocolFee = newFee;\n}\n\n// After (secure) - Add access control\nfunction setFee(uint256 newFee) external onlyOwner {\n    require(newFee <= MAX_FEE, "Fee too high");\n    protocolFee = newFee;\n    emit FeeUpdated(newFee);\n}`,
      },
    ]
  }
  if (t.includes("github") || t.includes("repo") || t.includes("git")) {
    return [
      {
        id: `F-${Date.now()}-1`, title: "Prototype pollution in lodash", severity: "high",
        file: "package.json", line: 24,
        description: "lodash < 4.17.21 is vulnerable to prototype pollution via the merge function.",
        fix: `// Fix: Update lodash to safe version\n"lodash": "^4.17.21"\n\n// Or replace with native:\nconst config = { ...defaults, ...structuredClone(userInput) };`,
      },
      {
        id: `F-${Date.now()}-2`, title: "Hardcoded API secret in source", severity: "critical",
        file: "src/config/api.ts", line: 8,
        description: "API secret key is hardcoded in source code and checked into version control.",
        fix: `// Before (vulnerable)\nconst API_SECRET = "sk-live-abc123def456";\n\n// After (secure) - Use environment variables\nconst API_SECRET = process.env.API_SECRET;\n\nif (!API_SECRET) {\n  throw new Error("API_SECRET env var is required");\n}\n\n// Add to .gitignore:\n.env\n.env.local`,
      },
    ]
  }
  // Default: website scan
  return [
    {
      id: `F-${Date.now()}-1`, title: "Reflected XSS on /search", severity: "critical",
      file: "/search?q=", line: 0,
      description: "User input is reflected in the DOM without sanitization, allowing script injection.",
      fix: `// Before (vulnerable)\napp.get('/search', (req, res) => {\n  res.send(\`<h1>Results for: \${req.query.q}</h1>\`);\n});\n\n// After (secure) - Sanitize all user input\nimport DOMPurify from 'dompurify';\n\napp.get('/search', (req, res) => {\n  const safeQuery = DOMPurify.sanitize(req.query.q || '');\n  res.send(\`<h1>Results for: \${safeQuery}</h1>\`);\n});`,
    },
    {
      id: `F-${Date.now()}-2`, title: "SQL Injection in search API", severity: "critical",
      file: "/api/search", line: 0,
      description: "Dynamic SQL query constructed from user input without parameterization.",
      fix: `// Before (vulnerable)\nconst results = await db.query(\n  \`SELECT * FROM products WHERE name LIKE '%\${userInput}%'\`\n);\n\n// After (secure) - Use parameterized queries\nconst results = await db.query(\n  'SELECT * FROM products WHERE name LIKE $1',\n  [\`%\${userInput}%\`]\n);`,
    },
    {
      id: `F-${Date.now()}-3`, title: "Missing Content-Security-Policy", severity: "high",
      file: "server/middleware.ts", line: 1,
      description: "No Content-Security-Policy header set, making the site vulnerable to XSS and data injection.",
      fix: `// Add CSP middleware\napp.use((req, res, next) => {\n  res.setHeader(\n    'Content-Security-Policy',\n    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'"\n  );\n  next();\n});`,
    },
  ]
}

const statusLabels: Record<string, string> = {
  scanning: "Scanning target...",
  analyzing: "Analyzing vulnerabilities...",
  reporting: "Generating fix code...",
  completed: "Complete",
}

const logMessages = [
  "[INIT] Connecting to target...",
  "[INFO] Target reachable -- starting scan",
  "[INFO] Running OWASP ZAP passive scan",
  "[INFO] Running Nuclei CVE templates",
  "[INFO] Running Semgrep SAST rules",
  "[WARN] Potential vulnerability detected",
  "[INFO] Cross-referencing CVE database",
  "[INFO] Running deep analysis pass",
  "[INFO] Generating remediation code",
]

/* ════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [url, setUrl] = useState("")
  const [scans, setScans] = useState<RunScan[]>([])
  const [completedScans, setCompletedScans] = useState<CompletedScan[]>([])
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  /* ── start a scan ──────────────────────────────────────── */
  const startScan = (scanType: string) => {
    const target = url.trim()
    if (!target) {
      toast.error("Enter a URL, repo, or contract address to scan")
      return
    }

    const newScan: RunScan = {
      id: `scan-${Date.now()}`,
      asset: target,
      scanType,
      progress: 0,
      status: "scanning",
      logs: ["[INIT] Connecting to target..."],
      startedAt: new Date().toLocaleTimeString(),
    }

    setScans((prev) => [newScan, ...prev])
    setUrl("")
    toast.success(`${scanType} scan started`, {
      description: `Scanning ${target}`,
    })
  }

  /* ── scan completion ───────────────────────────────────── */
  const completeScan = useCallback((scan: RunScan) => {
    setCompletedScans((prev) => {
      if (prev.some((c) => c.id === scan.id)) return prev
      const findings = findingsForTarget(scan.asset)
        const completed: CompletedScan = {
        id: scan.id,
        asset: scan.asset,
        scanType: scan.scanType,
        findings,
        completedAt: new Date().toLocaleTimeString(),
      }

      const critCount = findings.filter((f) => f.severity === "critical").length
      const highCount = findings.filter((f) => f.severity === "high").length
      if (critCount > 0) {
        toast.error(`${scan.asset}: ${critCount} critical, ${highCount} high severity`, { duration: 6000 })
      } else if (highCount > 0) {
        toast.warning(`${scan.asset}: ${highCount} high severity findings`, { duration: 5000 })
      } else {
        toast.success(`${scan.asset}: No critical issues`, { duration: 4000 })
      }

      return [completed, ...prev]
    })
    setScans((prev) => prev.filter((s) => s.id !== scan.id))
    setExpandedResults((prev) => ({ ...prev, [scan.id]: true }))
  }, [])

  /* ── progress ticker ───────────────────────────────────── */
  useEffect(() => {
    if (scans.length === 0) return
    const completedIds = new Set<string>()
    const interval = setInterval(() => {
      setScans((prev) => {
        const stillRunning: RunScan[] = []
        const justFinished: RunScan[] = []

        for (const scan of prev) {
          if (completedIds.has(scan.id)) continue
          const newProgress = Math.min(scan.progress + 2.2, 100)
          let newStatus = scan.status
          const newLogs = [...scan.logs]

          const logIdx = Math.floor((newProgress / 100) * logMessages.length)
          if (logIdx < logMessages.length && !newLogs.includes(logMessages[logIdx])) {
            newLogs.push(logMessages[logIdx])
          }
          if (newProgress >= 50 && scan.status === "scanning") newStatus = "analyzing"
          if (newProgress >= 80 && scan.status === "analyzing") newStatus = "reporting"
          if (newProgress >= 95 && !newLogs.some((l) => l.includes("[DONE]"))) {
            newLogs.push("[DONE] Scan complete -- fix code ready")
          }

          const updated = { ...scan, progress: newProgress, status: newStatus, logs: newLogs }

          if (newProgress >= 100) {
            completedIds.add(scan.id)
            justFinished.push(updated)
          } else {
            stillRunning.push(updated)
          }
        }

        justFinished.forEach((s) => {
          setTimeout(() => completeScan(s), 400)
        })

        return stillRunning
      })
    }, 800)
    return () => clearInterval(interval)
  }, [scans.length, completeScan])

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success("Fix code copied to clipboard")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const totalFindings = completedScans.reduce((a, s) => a + s.findings.length, 0)
  const criticalCount = completedScans.reduce((a, s) => a + s.findings.filter((f) => f.severity === "critical").length, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* ── SCAN INPUT ──────────────────────────────────────── */}
      <Card className="bg-card border-primary/20 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Scan & Fix</h1>
                <p className="text-xs text-muted-foreground">Paste a target below. Results and fix code appear right here.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="https://yoursite.com, github.com/user/repo, or 0xContractAddress..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono text-sm h-11"
                  onKeyDown={(e) => { if (e.key === "Enter") startScan("Full Spectrum") }}
                />
              </div>
              <Button
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11 px-6 shrink-0"
                onClick={() => startScan("Full Spectrum")}
              >
                <Zap className="h-4 w-4" />
                Scan Now
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" onClick={() => startScan("Website DAST")}>
                <Globe className="h-3.5 w-3.5 text-success" /> Website
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" onClick={() => startScan("Web App")}>
                <Smartphone className="h-3.5 w-3.5 text-primary" /> Web App
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" onClick={() => startScan("Code Repo")}>
                <Code className="h-3.5 w-3.5 text-primary" /> Repo
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 border-border text-foreground hover:bg-secondary text-xs h-8" onClick={() => startScan("Smart Contract")}>
                <Shield className="h-3.5 w-3.5 text-accent" /> Smart Contract
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── ACTIVE SCANS (inline, below input) ────────────── */}
      <AnimatePresence>
        {scans.map((scan, i) => (
          <motion.div key={scan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}>
            <Card className="bg-card border-primary/30 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ScanLine className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-sm font-semibold text-foreground font-mono">{scan.asset}</span>
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{scan.scanType}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => { setScans((prev) => prev.filter((s) => s.id !== scan.id)); toast.info(`Scan cancelled`) }}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{scan.startedAt}</span>
                  <span className="text-[11px] text-primary font-medium">{statusLabels[scan.status]}</span>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-muted-foreground">Progress</span>
                    <span className="text-[11px] font-mono text-primary">{Math.round(scan.progress)}%</span>
                  </div>
                  <Progress value={scan.progress} className="h-2 bg-secondary [&>div]:bg-primary" />
                </div>
                <ScrollArea className="h-[120px] rounded-lg bg-sidebar border border-border p-2.5">
                  <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                    {scan.logs.map((log, idx) => (
                      <div key={idx} className={log.includes("[WARN]") ? "text-warning" : log.includes("[DONE]") ? "text-success font-semibold" : "text-muted-foreground"}>
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
      </AnimatePresence>

      {/* ── COMPLETED RESULTS WITH FIX CODE ───────────────── */}
      <AnimatePresence>
        {completedScans.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
            {/* Summary bar */}
            <div className="flex items-center gap-3 px-1 flex-wrap">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-success" />
                Scan Results
              </h2>
              <span className="text-xs text-muted-foreground">{completedScans.length} scan{completedScans.length !== 1 ? "s" : ""}</span>
              <span className="text-xs text-muted-foreground">{totalFindings} finding{totalFindings !== 1 ? "s" : ""}</span>
              {criticalCount > 0 && (
                <Badge variant="outline" className={`text-[10px] ${severityBadge.critical}`}>{criticalCount} Critical</Badge>
              )}
            </div>

            {completedScans.map((scan) => (
              <motion.div key={scan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-card border-success/20 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                        <span className="text-sm font-semibold text-foreground font-mono">{scan.asset}</span>
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{scan.scanType}</Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => setExpandedResults((prev) => ({ ...prev, [scan.id]: !prev[scan.id] }))}>
                        {scan.findings.length} finding{scan.findings.length !== 1 ? "s" : ""}
                        {expandedResults[scan.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[11px] text-muted-foreground">Completed at {scan.completedAt}</span>
                      {(["critical", "high", "medium"] as Severity[]).map((sev) => {
                        const count = scan.findings.filter((f) => f.severity === sev).length
                        return count > 0 ? (
                          <Badge key={sev} variant="outline" className={`text-[10px] ${severityBadge[sev]}`}>{count} {sev.charAt(0).toUpperCase() + sev.slice(1)}</Badge>
                        ) : null
                      })}
                    </div>
                  </CardHeader>

                  <AnimatePresence initial={false}>
                    {expandedResults[scan.id] && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <CardContent className="pt-0 pb-4 flex flex-col gap-3">
                          {scan.findings.map((finding) => (
                            <div key={finding.id} className="rounded-lg border border-border bg-secondary/30 overflow-hidden">
                              {/* Finding header */}
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

                              {/* Fix code block */}
                              <div className="border-t border-border">
                                <div className="flex items-center justify-between px-3 py-2 bg-background/50">
                                  <span className="text-[11px] font-semibold text-success flex items-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Remediation Code
                                  </span>
                                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => copyCode(finding.fix, finding.id)}>
                                    {copiedId === finding.id ? (<><Check className="h-3 w-3 text-success" />Copied</>) : (<><Copy className="h-3 w-3" />Copy Fix</>)}
                                  </Button>
                                </div>
                                <ScrollArea className="max-h-[200px]">
                                  <pre className="p-3 text-xs font-mono text-foreground/90 bg-sidebar overflow-x-auto whitespace-pre">{finding.fix}</pre>
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

      {/* ── Empty state when nothing is running ─────────── */}
      {scans.length === 0 && completedScans.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <ScanLine className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Ready to Scan</h3>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Enter a website URL, GitHub repo, or smart contract address above.
              Scan results with copyable fix code will appear right here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
