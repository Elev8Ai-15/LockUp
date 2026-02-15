"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Shield,
  Upload,
  Search,
  Fuel,
  AlertTriangle,
  Bot,
  ArrowRight,
  Globe,
  Link2,
  Layers,
  Zap,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  blockchainVulns,
  gasOptimizations,
  exampleContracts,
  type Severity,
} from "@/lib/mock-data"
import { toast } from "sonner"

const severityBg: Record<Severity, string> = {
  critical: "bg-destructive/15 border-destructive/30 text-destructive",
  high: "bg-warning/15 border-warning/30 text-warning",
  medium: "bg-primary/15 border-primary/30 text-primary",
  low: "bg-muted border-border text-muted-foreground",
}

const severityColors: Record<Severity, string> = {
  critical: "text-destructive",
  high: "text-warning",
  medium: "text-primary",
  low: "text-muted-foreground",
}

function RiskGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? "#228B22" : score >= 60 ? "#D4A054" : "#EF4444"
  const label = score >= 80 ? "Low Risk" : score >= 60 ? "Medium Risk" : "High Risk"

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 120 120" className="-rotate-90">
          <circle cx="60" cy="60" r="45" fill="none" stroke="#1F3D2B" strokeWidth="10" />
          <motion.circle
            cx="60" cy="60" r="45" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <span className={`text-sm font-medium mt-2 ${score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive"}`}>{label}</span>
    </div>
  )
}

function FundFlowDiagram() {
  const nodes = [
    { id: "user", label: "User", x: 50, y: 60, color: "#89CFF0" },
    { id: "router", label: "Router", x: 200, y: 60, color: "#89CFF0" },
    { id: "poolA", label: "Pool A", x: 350, y: 20, color: "#A67B5B" },
    { id: "poolB", label: "Pool B", x: 350, y: 100, color: "#A67B5B" },
    { id: "treasury", label: "Treasury", x: 500, y: 20, color: "#D4A054" },
    { id: "lp", label: "LP Holders", x: 500, y: 100, color: "#228B22" },
  ]

  const edges = [
    { from: "user", to: "router", label: "100 ETH" },
    { from: "router", to: "poolA", label: "60 ETH" },
    { from: "router", to: "poolB", label: "40 ETH" },
    { from: "poolA", to: "treasury", label: "3 ETH" },
    { from: "poolB", to: "treasury", label: "2 ETH" },
    { from: "poolA", to: "lp", label: "57 ETH" },
    { from: "poolB", to: "lp", label: "38 ETH" },
  ]

  return (
    <svg viewBox="0 0 560 140" className="w-full h-auto">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#7C9A8E" />
        </marker>
      </defs>
      {edges.map((edge, i) => {
        const from = nodes.find((n) => n.id === edge.from)!
        const to = nodes.find((n) => n.id === edge.to)!
        const midX = (from.x + to.x) / 2
        const midY = (from.y + to.y) / 2
        return (
          <g key={i}>
            <motion.line
              x1={from.x + 35} y1={from.y} x2={to.x - 35} y2={to.y}
              stroke="#1F3D2B" strokeWidth="1.5" markerEnd="url(#arrowhead)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
            />
            <text x={midX} y={midY - 6} textAnchor="middle" fill="#7C9A8E" fontSize="8" fontFamily="monospace">{edge.label}</text>
          </g>
        )
      })}
      {nodes.map((node, i) => (
        <motion.g key={node.id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
          <rect x={node.x - 32} y={node.y - 14} width="64" height="28" rx="6" fill="#132419" stroke={node.color} strokeWidth="1" opacity="0.8" />
          <text x={node.x} y={node.y + 4} textAnchor="middle" fill={node.color} fontSize="9" fontFamily="monospace">{node.label}</text>
        </motion.g>
      ))}
    </svg>
  )
}

export default function BlockchainSecurityPage() {
  const [mode, setMode] = useState<"web" | "blockchain" | "multichain" | "full">("blockchain")
  const [contractAddress, setContractAddress] = useState("")
  const [scanned, setScanned] = useState(true)
  const riskScore = 64

  const handleScan = () => {
    toast.success("Contract scan initiated!", { description: "Analyzing bytecode and source code..." })
    setScanned(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Blockchain Security</h1>
          <p className="text-sm text-muted-foreground mt-1">Oracle Mode: Audit smart contracts and cross-chain assets.</p>
        </div>
        <div className="flex items-center rounded-lg border border-border bg-secondary p-0.5 flex-wrap">
          {([
            { key: "web", label: "Web", icon: Globe },
            { key: "blockchain", label: "Blockchain", icon: Link2 },
            { key: "multichain", label: "Multi-Chain", icon: Layers },
            { key: "full", label: "Full Spectrum", icon: Zap },
          ] as const).map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              className={`gap-1.5 rounded-md text-xs ${mode === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              onClick={() => setMode(key)}
            >
              <Icon className="h-3 w-3" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="0xContractAddress..."
                  className="pl-9 font-mono bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2 border-border text-foreground hover:bg-secondary" onClick={() => toast.info("Upload dialog would open here")}>
                <Upload className="h-4 w-4" />
                Upload .sol/.rs
              </Button>
              <Button variant="outline" className="gap-2 border-border text-foreground hover:bg-secondary" onClick={handleScan}>
                <Globe className="h-4 w-4" />
                Scan Live Deployed
              </Button>
              <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleScan}>
                <Shield className="h-4 w-4" />
                Scan Contract
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <p className="text-xs text-muted-foreground mr-1 self-center">Quick scan:</p>
              {exampleContracts.map((c) => (
                <TooltipProvider key={c.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs border-border text-muted-foreground hover:text-foreground hover:bg-secondary font-mono" onClick={() => { setContractAddress(c.address); handleScan() }}>
                        {c.name}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground border-border font-mono text-xs">
                      {c.address.slice(0, 10)}...{c.address.slice(-8)}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {scanned && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="bg-card border-border glow-brown">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base">Risk Oracle</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-4">
                <RiskGauge score={riskScore} />
              </CardContent>
            </Card>
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base">Vulnerability Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {blockchainVulns.map((vuln) => (
                    <div key={vuln.type} className={`rounded-lg border p-3 ${severityBg[vuln.severity]}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{vuln.type}</span>
                        <Badge variant="outline" className={`text-[10px] ${severityBg[vuln.severity]}`}>{vuln.count}</Badge>
                      </div>
                      <span className="text-[10px] uppercase opacity-70">{vuln.severity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-base">Fund Flow Analysis</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <FundFlowDiagram />
            </CardContent>
          </Card>

          <Tabs defaultValue="gas" className="w-full">
            <TabsList className="bg-secondary border border-border">
              <TabsTrigger value="gas" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground gap-1.5">
                <Fuel className="h-3.5 w-3.5" />
                Gas Optimization
              </TabsTrigger>
              <TabsTrigger value="fixes" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground gap-1.5">
                <Bot className="h-3.5 w-3.5" />
                AI Fix Suggestions
              </TabsTrigger>
              <TabsTrigger value="formal" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Formal Verification
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gas">
              <Card className="bg-card border-border">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Function</TableHead>
                        <TableHead className="text-muted-foreground">Current Gas</TableHead>
                        <TableHead className="text-muted-foreground">Optimized</TableHead>
                        <TableHead className="text-muted-foreground">Savings</TableHead>
                        <TableHead className="text-muted-foreground hidden md:table-cell">AI Suggestion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gasOptimizations.map((opt) => (
                        <TableRow key={opt.function} className="border-border hover:bg-secondary/50">
                          <TableCell className="font-mono text-sm text-foreground">{opt.function}</TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">{opt.currentGas.toLocaleString()}</TableCell>
                          <TableCell className="text-success font-mono text-sm">{opt.optimizedGas.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-success/30 text-success text-[10px]">-{opt.savings}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{opt.suggestion}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fixes">
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4">
                    {blockchainVulns.filter((v) => v.severity === "critical" || v.severity === "high").map((vuln) => (
                      <div key={vuln.type} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/30">
                        <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${severityColors[vuln.severity]}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{vuln.type} ({vuln.count} instances)</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {vuln.type === "Reentrancy" ? "Use OpenZeppelin ReentrancyGuard or Checks-Effects-Interactions pattern."
                              : vuln.type === "Oracle Manipulation" ? "Use Chainlink price feeds with heartbeat checks and fallback oracles."
                              : vuln.type === "Web-Linked" ? "Cross-scan website dependencies linked to on-chain calls."
                              : "Add onlyOwner modifier or implement role-based access with AccessControl."}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1 border-border text-foreground hover:bg-secondary text-xs shrink-0" onClick={() => toast.success(`AI fix generated for ${vuln.type}`)}>
                          <Bot className="h-3 w-3" />
                          Fix
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="formal">
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-10 w-10 text-accent mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Formal Verification</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                    Mathematical proofs that your contract satisfies its specification. Verifies invariants, pre/post conditions, and safety properties.
                  </p>
                  <pre className="bg-[#0B1410] border border-border rounded-lg p-4 text-left text-xs font-mono text-foreground mx-auto max-w-lg mb-4 overflow-x-auto">
{`// Formal Specification (Hoare Logic)
// Pre:  balances[msg.sender] >= amount
// Post: balances[msg.sender] == old(balances[msg.sender]) - amount
//       address(this).balance == old(address(this).balance) - amount
// Invariant: sum(balances) <= address(this).balance

theorem withdraw_safe:
  forall (s: State) (amount: uint256),
    s.balances[msg.sender] >= amount ->
    let s' = withdraw(s, msg.sender, amount) in
    s'.balances[msg.sender] = s.balances[msg.sender] - amount
    /\\ no_reentrancy(s') = true

Status: VERIFIED (3/3 properties proven)`}
                  </pre>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2" onClick={() => toast.success("Formal verification complete!", { description: "3/3 properties proven safe." })}>
                    <BookOpen className="h-4 w-4" />
                    Run Formal Verification
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  )
}
