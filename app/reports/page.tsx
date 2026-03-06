"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Search,
  X,
  AlertTriangle,
  GitPullRequest,
  Bot,
  Globe,
  Loader2,
  Copy,
  Check,
  Download,
  FileText,
  Shield,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Printer,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { vulnerabilities, type Vulnerability } from "@/lib/mock-data"
import type { Finding, Severity, OWASPCategory } from "@/lib/types"
import { toast } from "sonner"

/* ── Styling Maps ───────────────────────────────────────────── */
const severityStyles: Record<Severity, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-primary/15 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
  info: "bg-muted text-muted-foreground border-border",
}

const statusStyles: Record<string, string> = {
  open: "bg-destructive/15 text-destructive border-destructive/30",
  fixed: "bg-success/15 text-success border-success/30",
  ignored: "bg-muted text-muted-foreground border-border",
}

/* ── Convert legacy vulns to new Finding type ───────────────── */
function vulnToFinding(vuln: Vulnerability): Finding {
  return {
    id: vuln.id,
    title: vuln.title,
    severity: vuln.severity as Severity,
    cvss: vuln.cvss,
    owasp: getOWASPFromType(vuln.type),
    type: vuln.type,
    description: vuln.description,
    impact: "Review the finding details for potential business impact.",
    location: `${vuln.asset}/${vuln.file}${vuln.line > 0 ? `:${vuln.line}` : ""}`,
    remediation: {
      title: "Apply recommended fix",
      description: "See detailed remediation guidance in the finding panel.",
    },
    detectedAt: vuln.detectedAt,
    status: vuln.status as "open" | "fixed" | "ignored",
  }
}

function getOWASPFromType(type: string): OWASPCategory {
  const mapping: Record<string, OWASPCategory> = {
    "Blockchain": "A04:2021-Insecure Design",
    "Web": "A03:2021-Injection",
    "App": "A01:2021-Broken Access Control",
    "SAST": "A03:2021-Injection",
    "DAST": "A05:2021-Security Misconfiguration",
    "SCA": "A06:2021-Vulnerable Components",
    "Shadow AI": "A04:2021-Insecure Design",
  }
  return mapping[type] || "A05:2021-Security Misconfiguration"
}

/* ── Print Styles ───────────────────────────────────────────── */
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    #print-report, #print-report * {
      visibility: visible;
    }
    #print-report {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      padding: 20px;
    }
    .no-print {
      display: none !important;
    }
    .print-break {
      page-break-before: always;
    }
  }
`

/* ════════════════════════════════════════════════════════════ */
export default function ReportsPage() {
  const [search, setSearch] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selected, setSelected] = useState<Vulnerability | null>(null)
  const [copied, setCopied] = useState(false)
  const [checkedFindings, setCheckedFindings] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState("findings")

  // Convert vulnerabilities to findings
  const findings = vulnerabilities.map(vulnToFinding)

  // Filter findings
  const filtered = vulnerabilities.filter((v) => {
    const matchesSeverity = severityFilter === "all" || v.severity === severityFilter
    const matchesType = typeFilter === "all" || v.type === typeFilter
    const matchesStatus = statusFilter === "all" || v.status === statusFilter
    const matchesSearch =
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.asset.toLowerCase().includes(search.toLowerCase())
    return matchesSeverity && matchesType && matchesSearch && matchesStatus
  })

  // Calculate stats
  const stats = {
    total: vulnerabilities.length,
    critical: vulnerabilities.filter(v => v.severity === "critical").length,
    high: vulnerabilities.filter(v => v.severity === "high").length,
    medium: vulnerabilities.filter(v => v.severity === "medium").length,
    low: vulnerabilities.filter(v => v.severity === "low").length,
    open: vulnerabilities.filter(v => v.status === "open").length,
    fixed: vulnerabilities.filter(v => v.status === "fixed").length,
  }

  // Calculate risk score (0-100, higher is worse)
  const riskScore = Math.min(100, Math.round(
    (stats.critical * 25 + stats.high * 15 + stats.medium * 8 + stats.low * 2) / 
    Math.max(1, stats.total) * 10
  ))

  const getRiskRating = (score: number) => {
    if (score >= 80) return { label: "Critical", color: "text-destructive" }
    if (score >= 60) return { label: "High", color: "text-warning" }
    if (score >= 40) return { label: "Medium", color: "text-primary" }
    if (score >= 20) return { label: "Low", color: "text-muted-foreground" }
    return { label: "Secure", color: "text-success" }
  }

  const riskRating = getRiskRating(riskScore)

  // Generate executive summary
  const executiveSummary = `Security analysis identified ${stats.total} findings across all scanned assets. ` +
    `${stats.critical} critical and ${stats.high} high severity issues require immediate attention. ` +
    `${stats.fixed} vulnerabilities have been remediated. ` +
    `Overall risk assessment: ${riskRating.label}.`

  const openVuln = (vuln: Vulnerability) => {
    setSelected(vuln)
    setCopied(false)
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const toggleFindingCheck = (id: string) => {
    setCheckedFindings(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const checkedCount = Object.values(checkedFindings).filter(Boolean).length

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      
      <div className="flex flex-col gap-6" id="print-report">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Security Report</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.total} findings | {stats.open} open | {stats.fixed} fixed
            </p>
          </div>
          <div className="flex items-center gap-2 no-print">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5"
              onClick={handlePrint}
            >
              <Printer className="h-3.5 w-3.5" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* ── Executive Summary Card ─────────────────────────── */}
        <Card className="bg-card border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Executive Summary</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Risk Score:</span>
                <span className={`text-2xl font-bold ${riskRating.color}`}>{riskScore}</span>
                <Badge variant="outline" className={`${
                  riskRating.label === "Critical" ? "border-destructive/30 text-destructive" :
                  riskRating.label === "High" ? "border-warning/30 text-warning" :
                  riskRating.label === "Medium" ? "border-primary/30 text-primary" :
                  riskRating.label === "Low" ? "border-border text-muted-foreground" :
                  "border-success/30 text-success"
                }`}>
                  {riskRating.label} Risk
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{executiveSummary}</p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-destructive/80">Critical</p>
                <p className="text-2xl font-bold text-destructive">{stats.critical}</p>
              </div>
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-xs text-warning/80">High</p>
                <p className="text-2xl font-bold text-warning">{stats.high}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-primary/80">Medium</p>
                <p className="text-2xl font-bold text-primary">{stats.medium}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted border border-border">
                <p className="text-xs text-muted-foreground">Low</p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.low}</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs text-success/80">Fixed</p>
                <p className="text-2xl font-bold text-success">{stats.fixed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Tabs ───────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="no-print">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="findings" className="gap-1.5 data-[state=active]:bg-background">
              <AlertTriangle className="h-3.5 w-3.5" />
              Findings
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-1.5 data-[state=active]:bg-background">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Remediation Checklist
              {checkedCount > 0 && (
                <Badge variant="outline" className="ml-1 text-[10px] border-success/30 text-success h-4 px-1">
                  {checkedCount}/{stats.total}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Findings Tab ─────────────────────────────────── */}
          <TabsContent value="findings" className="mt-4">
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row mb-4 no-print">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search findings..."
                  className="pl-9 bg-secondary border-border text-foreground"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-[130px] bg-secondary border-border">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[130px] bg-secondary border-border">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Blockchain">Blockchain</SelectItem>
                  <SelectItem value="Web">Web</SelectItem>
                  <SelectItem value="App">App</SelectItem>
                  <SelectItem value="SAST">SAST</SelectItem>
                  <SelectItem value="DAST">DAST</SelectItem>
                  <SelectItem value="SCA">SCA</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[130px] bg-secondary border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="ignored">Ignored</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Findings Table */}
            <div className="flex gap-6">
              <div className={`flex-1 min-w-0 ${selected ? "hidden lg:block" : ""}`}>
                <Card className="bg-card border-border">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground w-[250px]">Vulnerability</TableHead>
                          <TableHead className="text-muted-foreground">Severity</TableHead>
                          <TableHead className="text-muted-foreground hidden md:table-cell">CVSS</TableHead>
                          <TableHead className="text-muted-foreground hidden md:table-cell">OWASP</TableHead>
                          <TableHead className="text-muted-foreground hidden sm:table-cell">Asset</TableHead>
                          <TableHead className="text-muted-foreground">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((vuln) => {
                          const finding = vulnToFinding(vuln)
                          return (
                            <TableRow
                              key={vuln.id}
                              className="border-border hover:bg-secondary/50 cursor-pointer"
                              onClick={() => openVuln(vuln)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${
                                    vuln.severity === "critical" ? "text-destructive" :
                                    vuln.severity === "high" ? "text-warning" : "text-muted-foreground"
                                  }`} />
                                  <span className="text-sm text-foreground truncate max-w-[200px]">{vuln.title}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-[10px] uppercase ${severityStyles[vuln.severity as Severity]}`}>
                                  {vuln.severity}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className={`text-sm font-mono ${
                                  vuln.cvss >= 9 ? "text-destructive" : vuln.cvss >= 7 ? "text-warning" : "text-muted-foreground"
                                }`}>{vuln.cvss}</span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {finding.owasp.split("-")[0]}
                                </span>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <span className="text-xs font-mono text-muted-foreground">{vuln.asset}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-[10px] ${statusStyles[vuln.status]}`}>
                                  {vuln.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Detail Panel */}
              <AnimatePresence>
                {selected && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="w-full lg:w-[440px] shrink-0"
                  >
                    <Card className="bg-card border-border sticky top-20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-foreground text-base pr-2">{selected.title}</CardTitle>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0" 
                            onClick={() => setSelected(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] uppercase ${severityStyles[selected.severity as Severity]}`}>
                            {selected.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{selected.id}</span>
                          <span className="text-xs font-mono text-muted-foreground">CVSS {selected.cvss}</span>
                          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                            {vulnToFinding(selected).owasp.split("-")[0]}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Location</p>
                          <p className="text-sm font-mono text-foreground">{selected.file}{selected.line > 0 ? `:${selected.line}` : ""}</p>
                          <p className="text-xs text-muted-foreground mt-1">{selected.asset}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Description</p>
                          <p className="text-sm text-secondary-foreground leading-relaxed">{selected.description}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">OWASP Category</p>
                          <p className="text-sm text-foreground">{vulnToFinding(selected).owasp}</p>
                        </div>

                        <div className="flex gap-2 flex-wrap no-print">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5 border-border text-foreground hover:bg-secondary"
                                  onClick={() => {
                                    toast.success("PR created!", { description: `Auto-Fix PR for ${selected.title}` })
                                  }}
                                >
                                  <GitPullRequest className="h-3.5 w-3.5" />
                                  Create PR
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-popover text-popover-foreground border-border">
                                Create a GitHub PR with the fix
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => handleCopy(JSON.stringify(vulnToFinding(selected), null, 2))}
                          >
                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            Copy JSON
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* ── Remediation Checklist Tab ────────────────────── */}
          <TabsContent value="checklist" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Remediation Checklist
                </CardTitle>
                <CardDescription>
                  Track your progress fixing vulnerabilities. {checkedCount} of {stats.open} open issues addressed.
                </CardDescription>
                <Progress value={(checkedCount / Math.max(1, stats.open)) * 100} className="h-2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vulnerabilities
                    .filter(v => v.status === "open")
                    .sort((a, b) => {
                      const order = { critical: 0, high: 1, medium: 2, low: 3 }
                      return (order[a.severity as keyof typeof order] || 4) - (order[b.severity as keyof typeof order] || 4)
                    })
                    .map((vuln) => (
                      <div
                        key={vuln.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                          checkedFindings[vuln.id] 
                            ? "border-success/30 bg-success/5" 
                            : "border-border bg-secondary/30"
                        }`}
                      >
                        <Checkbox
                          id={vuln.id}
                          checked={checkedFindings[vuln.id] || false}
                          onCheckedChange={() => toggleFindingCheck(vuln.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={vuln.id}
                            className={`text-sm font-medium cursor-pointer ${
                              checkedFindings[vuln.id] ? "text-muted-foreground line-through" : "text-foreground"
                            }`}
                          >
                            {vuln.title}
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-[10px] uppercase ${severityStyles[vuln.severity as Severity]}`}>
                              {vuln.severity}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">{vuln.asset}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs shrink-0"
                          onClick={() => openVuln(vuln)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  
                  {vulnerabilities.filter(v => v.status === "open").length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">All vulnerabilities have been addressed!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Print-only full findings list ──────────────────── */}
        <div className="hidden print:block print-break">
          <h2 className="text-lg font-bold mb-4">Detailed Findings</h2>
          {vulnerabilities.map((vuln, i) => (
            <div key={vuln.id} className="mb-6 p-4 border border-border rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold">{i + 1}. {vuln.title}</span>
                <span className={`text-xs uppercase px-2 py-0.5 rounded ${
                  vuln.severity === "critical" ? "bg-red-100 text-red-800" :
                  vuln.severity === "high" ? "bg-orange-100 text-orange-800" :
                  vuln.severity === "medium" ? "bg-blue-100 text-blue-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {vuln.severity}
                </span>
              </div>
              <p className="text-sm mb-2"><strong>Asset:</strong> {vuln.asset}</p>
              <p className="text-sm mb-2"><strong>Location:</strong> {vuln.file}{vuln.line > 0 ? `:${vuln.line}` : ""}</p>
              <p className="text-sm mb-2"><strong>CVSS:</strong> {vuln.cvss}</p>
              <p className="text-sm mb-2"><strong>OWASP:</strong> {vulnToFinding(vuln).owasp}</p>
              <p className="text-sm"><strong>Description:</strong> {vuln.description}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
