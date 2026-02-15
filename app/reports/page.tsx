"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Search,
  X,
  AlertTriangle,
  GitPullRequest,
  Bot,
  Send,
  Globe,
  FlaskConical,
  Loader2,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { vulnerabilities, type Vulnerability, type Severity } from "@/lib/mock-data"
import { toast } from "sonner"

const severityStyles: Record<Severity, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-primary/15 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
}

const statusStyles: Record<string, string> = {
  open: "bg-destructive/15 text-destructive border-destructive/30",
  fixed: "bg-success/15 text-success border-success/30",
  ignored: "bg-muted text-muted-foreground border-border",
}

interface ChatMessage {
  role: "triage" | "fix" | "validator" | "code"
  agent?: string
  content: string
}

const mockAgentChat: Record<string, ChatMessage[]> = {
  Blockchain: [
    { role: "triage", agent: "Triage Agent", content: "High risk detected. Reentrancy in withdraw() allows fund drainage. Priority: CRITICAL." },
    { role: "fix", agent: "Fix Agent", content: "Generating fix using OpenZeppelin ReentrancyGuard pattern..." },
    { role: "code", content: `// BEFORE (vulnerable)
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount);
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
    balances[msg.sender] -= amount;
}

// AFTER (fixed with ReentrancyGuard)
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

function withdraw(uint256 amount) external nonReentrant {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount; // State update BEFORE call
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
    emit Withdrawn(msg.sender, amount);
}` },
    { role: "validator", agent: "Validator Agent", content: "All 12 tests passed. Reentrancy attack vector eliminated. Gas impact: +2,100 gas per call." },
  ],
  Web: [
    { role: "triage", agent: "Triage Agent", content: "High risk on website. Reflected XSS allows script injection via search parameter." },
    { role: "fix", agent: "Fix Agent", content: "Generating secure headers and input sanitization..." },
    { role: "code", content: `// Secure headers middleware (next.config.js)
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
];

// Input sanitization
import DOMPurify from 'dompurify';
const sanitized = DOMPurify.sanitize(userInput);` },
    { role: "validator", agent: "Validator Agent", content: "Tests passed. XSS vector neutralized. CSP headers applied." },
  ],
  App: [
    { role: "triage", agent: "Triage Agent", content: "Insecure CORS policy on app API allows cross-origin data theft." },
    { role: "fix", agent: "Fix Agent", content: "Generating CORS fix..." },
    { role: "code", content: `// BEFORE (vulnerable)
app.use(cors({ origin: '*' }));

// AFTER (fixed CORS)
app.use(cors({
  origin: ['https://app.example.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));` },
    { role: "validator", agent: "Validator Agent", content: "Tests passed. CORS properly restricted to allowed origins." },
  ],
  default: [
    { role: "triage", agent: "Triage Agent", content: "Analyzing vulnerability and assessing risk..." },
    { role: "fix", agent: "Fix Agent", content: "Generating remediation patch..." },
    { role: "code", content: "// AI-generated fix applied\n// See diff for details" },
    { role: "validator", agent: "Validator Agent", content: "Tests passed. Vulnerability resolved." },
  ],
}

const agentChatTextColors: Record<string, string> = {
  triage: "text-primary",
  fix: "text-success",
  validator: "text-warning",
}

const agentChatBgColors: Record<string, string> = {
  triage: "bg-primary/10",
  fix: "bg-success/10",
  validator: "bg-warning/10",
}

export default function ReportsPage() {
  const [search, setSearch] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selected, setSelected] = useState<Vulnerability | null>(null)
  const [showAiChat, setShowAiChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [retesting, setRetesting] = useState(false)
  const [copied, setCopied] = useState(false)

  const filtered = vulnerabilities.filter((v) => {
    const matchesSeverity = severityFilter === "all" || v.severity === severityFilter
    const matchesType = typeFilter === "all" || v.type === typeFilter
    const matchesSearch =
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.asset.toLowerCase().includes(search.toLowerCase())
    return matchesSeverity && matchesType && matchesSearch
  })

  const openVuln = (vuln: Vulnerability) => {
    setSelected(vuln)
    setShowAiChat(false)
    setChatMessages([])
    setCopied(false)
  }

  const startAiRemediation = () => {
    if (!selected) return
    setShowAiChat(true)
    const key = selected.type in mockAgentChat ? selected.type : "default"
    const messages = mockAgentChat[key as keyof typeof mockAgentChat] || mockAgentChat.default
    setChatMessages(messages)
  }

  const handleRetest = () => {
    setRetesting(true)
    setTimeout(() => {
      setRetesting(false)
      toast.success("Retest complete!", { description: "Vulnerability confirmed fixed in sandbox." })
    }, 2500)
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success("Code copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Reports & Auto-Fix Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {vulnerabilities.length} vulnerabilities across all asset types. {vulnerabilities.filter(v => v.status === "fixed").length} auto-fixed.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vulnerabilities..."
            className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-[140px] bg-secondary border-border text-foreground">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[140px] bg-secondary border-border text-foreground">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="SAST">SAST</SelectItem>
            <SelectItem value="DAST">DAST</SelectItem>
            <SelectItem value="SCA">SCA</SelectItem>
            <SelectItem value="Web">Web</SelectItem>
            <SelectItem value="App">App</SelectItem>
            <SelectItem value="Blockchain">Blockchain</SelectItem>
            <SelectItem value="Shadow AI">Shadow AI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-6">
        <div className={`flex-1 min-w-0 ${selected ? "hidden lg:block" : ""}`}>
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Vulnerability</TableHead>
                    <TableHead className="text-muted-foreground">Severity</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Type</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">CVSS</TableHead>
                    <TableHead className="text-muted-foreground hidden sm:table-cell">Asset</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((vuln) => (
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
                        <Badge variant="outline" className={`text-[10px] uppercase ${severityStyles[vuln.severity]}`}>
                          {vuln.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{vuln.type}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={`text-sm font-mono ${
                          vuln.cvss >= 9 ? "text-destructive" : vuln.cvss >= 7 ? "text-warning" : "text-muted-foreground"
                        }`}>{vuln.cvss}</span>
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

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
                    <CardTitle className="text-foreground text-base">{selected.title}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setSelected(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] uppercase ${severityStyles[selected.severity]}`}>{selected.severity}</Badge>
                    <span className="text-xs text-muted-foreground">{selected.id}</span>
                    <span className="text-xs font-mono text-muted-foreground">CVSS {selected.cvss}</span>
                    <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">{selected.type}</Badge>
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

                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" className="flex-1 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={startAiRemediation}>
                      <Bot className="h-3.5 w-3.5" />
                      AI Remediation
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-border text-foreground hover:bg-secondary"
                            onClick={() => toast.success("PR created!", { description: `Auto-Fix PR for ${selected.title}` })}
                          >
                            <GitPullRequest className="h-3.5 w-3.5" />
                            Auto-Open PR
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground border-border">
                          Simulates GitHub PR creation with test results
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {(selected.type === "Web" || selected.type === "App") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-success/30 text-success hover:bg-success/10"
                        onClick={() => toast.success("Fix applied to live site!", { description: `${selected.asset} updated` })}
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Apply to Live
                      </Button>
                    )}
                  </div>

                  {showAiChat && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border border-border rounded-lg overflow-hidden">
                      <div className="bg-[#0B1410] px-3 py-2 border-b border-border flex items-center gap-2">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs text-foreground font-medium">Security Agents Collaborating</span>
                      </div>
                      <ScrollArea className="h-[300px] p-3">
                        <div className="flex flex-col gap-3">
                          {chatMessages.map((msg, idx) => (
                            <div key={idx}>
                              {msg.role === "code" ? (
                                <div className="relative">
                                  <pre className="bg-[#0B1410] border border-border rounded-md p-3 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                                    {msg.content}
                                  </pre>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleCopy(msg.content)}
                                  >
                                    {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2">
                                  <div className={`flex h-5 w-5 items-center justify-center rounded-full shrink-0 mt-0.5 ${agentChatBgColors[msg.role] || "bg-muted"}`}>
                                    <Bot className={`h-3 w-3 ${agentChatTextColors[msg.role] || "text-muted-foreground"}`} />
                                  </div>
                                  <div>
                                    <p className={`text-[10px] font-medium mb-0.5 ${agentChatTextColors[msg.role] || "text-muted-foreground"}`}>{msg.agent}</p>
                                    <p className="text-sm text-secondary-foreground leading-relaxed">{msg.content}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="border-t border-border p-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-border text-foreground hover:bg-secondary"
                          onClick={handleRetest}
                          disabled={retesting}
                        >
                          {retesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
                          Retest in Sandbox
                        </Button>
                        <div className="flex-1 flex gap-2">
                          <Input placeholder="Ask about this vulnerability..." className="bg-secondary border-border text-foreground text-xs placeholder:text-muted-foreground h-8" />
                          <Button size="icon" className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
