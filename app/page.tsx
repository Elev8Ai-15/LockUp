"use client"

import { useState, useCallback, useEffect, useRef } from "react"
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
  detectedStack: TechStack
  progress: number
  status: "scanning" | "analyzing" | "reporting" | "completed"
  logs: string[]
  startedAt: string
}

interface CompletedScan {
  id: string
  asset: string
  scanType: string
  detectedStack: TechStack
  findings: ScanFinding[]
  completedAt: string
}

/* ── tech stack detection ───────────────────────────────── */
type TechStack = {
  name: string
  framework: string
  lang: string
  tags: string[]
}

const detectStack = (target: string, scanType: string): TechStack => {
  const t = target.toLowerCase()

  // Smart Contract
  if (t.includes("0x") || t.includes("contract") || t.includes(".sol") || scanType === "Smart Contract") {
    return { name: "Solidity Smart Contract", framework: "EVM / Solidity", lang: "Solidity", tags: ["blockchain", "evm", "solidity"] }
  }

  // Code Repo
  if (t.includes("github") || t.includes("gitlab") || t.includes("bitbucket") || scanType === "Code Repo") {
    // Try to infer the framework from the repo name
    if (t.includes("next") || t.includes("vercel")) return { name: "Next.js Repository", framework: "Next.js", lang: "TypeScript", tags: ["repo", "nextjs", "react", "node"] }
    if (t.includes("django") || t.includes("python") || t.includes("flask")) return { name: "Python Repository", framework: "Django/Flask", lang: "Python", tags: ["repo", "python", "django"] }
    if (t.includes("rails") || t.includes("ruby")) return { name: "Ruby Repository", framework: "Rails", lang: "Ruby", tags: ["repo", "ruby", "rails"] }
    if (t.includes("spring") || t.includes("java")) return { name: "Java Repository", framework: "Spring", lang: "Java", tags: ["repo", "java", "spring"] }
    if (t.includes("go") || t.includes("golang")) return { name: "Go Repository", framework: "Go stdlib", lang: "Go", tags: ["repo", "go"] }
    return { name: "Node.js Repository", framework: "Node.js", lang: "TypeScript", tags: ["repo", "node", "express"] }
  }

  // Website / Web App -- detect framework from URL patterns
  if (t.includes("wordpress") || t.includes("wp-") || t.includes("/wp/")) return { name: "WordPress Site", framework: "WordPress / PHP", lang: "PHP", tags: ["web", "wordpress", "php"] }
  if (t.includes("shopify") || t.includes(".myshopify")) return { name: "Shopify Store", framework: "Shopify / Liquid", lang: "Liquid", tags: ["web", "shopify", "ecommerce"] }
  if (t.includes("vercel.app") || t.includes("nextjs") || t.includes("next")) return { name: "Next.js Application", framework: "Next.js / React", lang: "TypeScript", tags: ["web", "nextjs", "react", "node"] }
  if (t.includes("netlify") || t.includes("gatsby")) return { name: "Gatsby / Static Site", framework: "Gatsby / React", lang: "JavaScript", tags: ["web", "gatsby", "react", "static"] }
  if (t.includes("angular") || t.includes("ng-")) return { name: "Angular Application", framework: "Angular", lang: "TypeScript", tags: ["web", "angular"] }
  if (t.includes("vue") || t.includes("nuxt")) return { name: "Vue / Nuxt Application", framework: "Nuxt / Vue", lang: "TypeScript", tags: ["web", "vue", "nuxt"] }
  if (t.includes("flask") || t.includes("django") || t.includes("python")) return { name: "Python Web App", framework: "Django / Flask", lang: "Python", tags: ["web", "python", "django"] }
  if (t.includes("rails") || t.includes("heroku")) return { name: "Rails Application", framework: "Ruby on Rails", lang: "Ruby", tags: ["web", "rails", "ruby"] }
  if (t.includes("php") || t.includes("laravel")) return { name: "Laravel / PHP App", framework: "Laravel / PHP", lang: "PHP", tags: ["web", "php", "laravel"] }
  if (t.includes("api.") || t.includes("/api/") || t.includes("rest")) return { name: "REST API Service", framework: "Express / Fastify", lang: "TypeScript", tags: ["web", "api", "node", "express"] }

  // Default: general web
  if (scanType === "Web App") return { name: "Web Application", framework: "React / SPA", lang: "TypeScript", tags: ["web", "react", "spa", "node"] }
  return { name: "Website", framework: "HTML / JS", lang: "JavaScript", tags: ["web", "html", "general"] }
}

/* ── findings per stack ────────────────────────────────── */
interface FindingTemplate { title: string; severity: Severity; file: string; line: number; description: string; fix: string; requiredTags: string[] }

const allFindings: FindingTemplate[] = [
  // -- Blockchain / Solidity --------------------------------
  {
    requiredTags: ["solidity"],
    title: "Reentrancy in withdraw()", severity: "critical",
    file: "contracts/Vault.sol", line: 89,
    description: "External call before state update allows reentrancy attack to drain funds.",
    fix: `// BEFORE (vulnerable)\nfunction withdraw(uint256 amount) external {\n    require(balances[msg.sender] >= amount);\n    (bool success, ) = msg.sender.call{value: amount}("");\n    require(success);\n    balances[msg.sender] -= amount;\n}\n\n// AFTER (secure) -- Checks-Effects-Interactions + ReentrancyGuard\nimport "@openzeppelin/contracts/security/ReentrancyGuard.sol";\n\nfunction withdraw(uint256 amount) external nonReentrant {\n    require(balances[msg.sender] >= amount);\n    balances[msg.sender] -= amount;\n    (bool success, ) = msg.sender.call{value: amount}("");\n    require(success);\n}`,
  },
  {
    requiredTags: ["solidity"],
    title: "Missing access control on setFee()", severity: "high",
    file: "contracts/Governance.sol", line: 45,
    description: "setFee() lacks the onlyOwner modifier, allowing anyone to change protocol fees.",
    fix: `// BEFORE (vulnerable)\nfunction setFee(uint256 newFee) external {\n    protocolFee = newFee;\n}\n\n// AFTER (secure) -- Add Ownable access control\nfunction setFee(uint256 newFee) external onlyOwner {\n    require(newFee <= MAX_FEE, "Fee too high");\n    protocolFee = newFee;\n    emit FeeUpdated(newFee);\n}`,
  },
  {
    requiredTags: ["evm"],
    title: "Unchecked return on low-level call", severity: "medium",
    file: "contracts/Bridge.sol", line: 112,
    description: "Low-level .call() return value is not checked, silently swallowing failures.",
    fix: `// BEFORE (vulnerable)\naddress(target).call{value: amount}("");\n\n// AFTER (secure) -- Check return value\n(bool success, ) = address(target).call{value: amount}("");\nrequire(success, "Transfer failed");`,
  },

  // -- Repo / Dependency vulnerabilities --------------------
  {
    requiredTags: ["repo", "node"],
    title: "Prototype pollution in lodash", severity: "high",
    file: "package.json", line: 24,
    description: "lodash < 4.17.21 is vulnerable to prototype pollution via the merge function.",
    fix: `// Fix: Update lodash to safe version\n"lodash": "^4.17.21"\n\n// Or replace with native:\nconst config = { ...defaults, ...structuredClone(userInput) };`,
  },
  {
    requiredTags: ["repo"],
    title: "Hardcoded API secret in source", severity: "critical",
    file: "src/config/api.ts", line: 8,
    description: "API secret key is hardcoded in source code and committed to version control.",
    fix: `// BEFORE (vulnerable)\nconst API_SECRET = "sk-live-abc123def456";\n\n// AFTER (secure) -- Use environment variables\nconst API_SECRET = process.env.API_SECRET;\nif (!API_SECRET) throw new Error("API_SECRET env var required");\n\n// Add to .gitignore:\n.env\n.env.local`,
  },
  {
    requiredTags: ["repo", "python"],
    title: "Insecure deserialization with pickle", severity: "critical",
    file: "src/utils/cache.py", line: 34,
    description: "Using pickle.loads() on untrusted input allows arbitrary code execution.",
    fix: `# BEFORE (vulnerable)\nimport pickle\ndata = pickle.loads(user_input)\n\n# AFTER (secure) -- Use JSON for untrusted data\nimport json\ndata = json.loads(user_input)\n\n# If you must use pickle, restrict classes:\nimport pickle\nimport io\n\nclass RestrictedUnpickler(pickle.Unpickler):\n    def find_class(self, module, name):\n        raise pickle.UnpicklingError(f"Blocked: {module}.{name}")`,
  },

  // -- Next.js specific ------------------------------------
  {
    requiredTags: ["nextjs"],
    title: "Exposed Server Action without auth check", severity: "critical",
    file: "app/actions.ts", line: 12,
    description: "Server Action performs database mutation without verifying the user session.",
    fix: `// BEFORE (vulnerable)\n"use server"\nexport async function deleteUser(id: string) {\n  await db.user.delete({ where: { id } });\n}\n\n// AFTER (secure) -- Verify session first\n"use server"\nimport { auth } from "@/lib/auth";\n\nexport async function deleteUser(id: string) {\n  const session = await auth();\n  if (!session?.user?.isAdmin) throw new Error("Unauthorized");\n  await db.user.delete({ where: { id } });\n}`,
  },
  {
    requiredTags: ["nextjs"],
    title: "Missing CSRF protection on API route", severity: "high",
    file: "app/api/update/route.ts", line: 1,
    description: "POST route handler has no CSRF token validation, allowing cross-site request forgery.",
    fix: `// AFTER (secure) -- Validate origin header in Next.js\nimport { headers } from "next/headers";\n\nexport async function POST(req: Request) {\n  const h = await headers();\n  const origin = h.get("origin");\n  if (origin !== process.env.NEXT_PUBLIC_URL) {\n    return Response.json({ error: "Forbidden" }, { status: 403 });\n  }\n  // ... handle request\n}`,
  },

  // -- React / SPA -----------------------------------------
  {
    requiredTags: ["react"],
    title: "Unsafe dangerouslySetInnerHTML usage", severity: "high",
    file: "src/components/RichText.tsx", line: 18,
    description: "User-generated HTML is rendered via dangerouslySetInnerHTML without sanitization.",
    fix: `// BEFORE (vulnerable)\n<div dangerouslySetInnerHTML={{ __html: userContent }} />\n\n// AFTER (secure) -- Sanitize with DOMPurify\nimport DOMPurify from "dompurify";\n\n<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />`,
  },

  // -- WordPress specific ----------------------------------
  {
    requiredTags: ["wordpress"],
    title: "Outdated WordPress core (< 6.4)", severity: "critical",
    file: "wp-includes/version.php", line: 1,
    description: "WordPress core version is outdated and vulnerable to known CVEs including remote code execution.",
    fix: `# Update WordPress core via WP-CLI:\nwp core update\nwp core update-db\n\n# Or via SSH:\ncd /var/www/html\nwp core update --allow-root\n\n# Verify version:\nwp core version`,
  },
  {
    requiredTags: ["wordpress"],
    title: "wp-config.php exposed to public", severity: "critical",
    file: ".htaccess", line: 0,
    description: "wp-config.php is accessible via direct URL request, leaking database credentials.",
    fix: `# Add to .htaccess to block access:\n<Files wp-config.php>\n  Order Allow,Deny\n  Deny from all\n</Files>\n\n# Also move wp-config.php one level up (WordPress auto-detects this):\nmv /var/www/html/wp-config.php /var/www/wp-config.php`,
  },
  {
    requiredTags: ["wordpress", "php"],
    title: "SQL injection in custom plugin query", severity: "critical",
    file: "wp-content/plugins/custom/query.php", line: 22,
    description: "Custom plugin builds SQL queries by string concatenation with user input.",
    fix: `// BEFORE (vulnerable)\n$results = $wpdb->get_results(\n  "SELECT * FROM {$wpdb->posts} WHERE post_title LIKE '%{$_GET['q']}%'"\n);\n\n// AFTER (secure) -- Use $wpdb->prepare()\n$results = $wpdb->get_results(\n  $wpdb->prepare(\n    "SELECT * FROM {$wpdb->posts} WHERE post_title LIKE %s",\n    '%' . $wpdb->esc_like($_GET['q']) . '%'\n  )\n);`,
  },

  // -- Django / Python web ---------------------------------
  {
    requiredTags: ["django"],
    title: "DEBUG = True in production settings", severity: "high",
    file: "settings.py", line: 26,
    description: "Django DEBUG mode is enabled in production, exposing stack traces, settings, and SQL queries.",
    fix: `# BEFORE (vulnerable)\nDEBUG = True\n\n# AFTER (secure) -- Read from environment\nimport os\nDEBUG = os.environ.get("DJANGO_DEBUG", "False").lower() == "true"\n\n# Also set ALLOWED_HOSTS:\nALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")`,
  },
  {
    requiredTags: ["django", "python"],
    title: "Missing CSRF middleware", severity: "high",
    file: "settings.py", line: 45,
    description: "CsrfViewMiddleware is missing from MIDDLEWARE list, disabling Django CSRF protection.",
    fix: `# Ensure CsrfViewMiddleware is in MIDDLEWARE:\nMIDDLEWARE = [\n    'django.middleware.security.SecurityMiddleware',\n    'django.middleware.csrf.CsrfViewMiddleware',  # <-- Required\n    'django.middleware.common.CommonMiddleware',\n    # ...\n]\n\n# In templates, always use:\n# {% csrf_token %}`,
  },

  // -- PHP / Laravel ---------------------------------------
  {
    requiredTags: ["php"],
    title: "Unsanitized file upload path", severity: "critical",
    file: "app/Http/Controllers/UploadController.php", line: 31,
    description: "Uploaded file name is used directly without sanitization, allowing path traversal.",
    fix: `// BEFORE (vulnerable)\n$path = $request->file('doc')->storeAs(\n    'uploads', $request->file('doc')->getClientOriginalName()\n);\n\n// AFTER (secure) -- Generate a safe filename\nuse Illuminate\\Support\\Str;\n\n$ext = $request->file('doc')->getClientOriginalExtension();\n$safeName = Str::uuid() . '.' . $ext;\n$path = $request->file('doc')->storeAs('uploads', $safeName);`,
  },

  // -- Shopify specific ------------------------------------
  {
    requiredTags: ["shopify"],
    title: "Exposed Storefront API token in client JS", severity: "high",
    file: "assets/theme.js", line: 3,
    description: "Storefront API access token is embedded in client-side JavaScript, allowing unauthorized API access.",
    fix: `// BEFORE (vulnerable)\nconst client = ShopifyBuy.buildClient({\n  domain: 'store.myshopify.com',\n  storefrontAccessToken: 'shpat_xxxxx'  // <-- exposed\n});\n\n// AFTER (secure) -- Proxy through a server endpoint\n// 1. Create a server-side proxy\n// api/storefront.ts\nexport async function POST(req: Request) {\n  const body = await req.json();\n  const res = await fetch('https://store.myshopify.com/api/graphql', {\n    method: 'POST',\n    headers: {\n      'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_TOKEN!,\n      'Content-Type': 'application/json',\n    },\n    body: JSON.stringify(body),\n  });\n  return Response.json(await res.json());\n}`,
  },

  // -- Node / Express (general web) ------------------------
  {
    requiredTags: ["node", "web"],
    title: "Missing rate limiting on auth endpoint", severity: "high",
    file: "src/routes/auth.ts", line: 15,
    description: "Login endpoint has no rate limiting, allowing brute-force credential attacks.",
    fix: `// AFTER (secure) -- Add rate limiting\nimport rateLimit from "express-rate-limit";\n\nconst authLimiter = rateLimit({\n  windowMs: 15 * 60 * 1000, // 15 minutes\n  max: 5,\n  message: { error: "Too many login attempts, try again later" },\n  standardHeaders: true,\n});\n\napp.post("/api/login", authLimiter, loginHandler);`,
  },
  {
    requiredTags: ["web"],
    title: "Missing Content-Security-Policy header", severity: "medium",
    file: "server/middleware", line: 1,
    description: "No CSP header set. This allows inline scripts and third-party resource loading.",
    fix: `// Add CSP header (adjust per your needs)\n// Next.js -- next.config.mjs:\nconst securityHeaders = [\n  {\n    key: 'Content-Security-Policy',\n    value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'"\n  }\n];\n\n// Express:\napp.use((req, res, next) => {\n  res.setHeader('Content-Security-Policy', "default-src 'self'");\n  next();\n});`,
  },
  {
    requiredTags: ["web"],
    title: "Cookies set without Secure/HttpOnly flags", severity: "medium",
    file: "src/auth/session.ts", line: 28,
    description: "Session cookies lack Secure, HttpOnly, and SameSite flags, making them vulnerable to theft.",
    fix: `// BEFORE (vulnerable)\nres.cookie("session", token);\n\n// AFTER (secure) -- Set all security flags\nres.cookie("session", token, {\n  httpOnly: true,\n  secure: process.env.NODE_ENV === "production",\n  sameSite: "strict",\n  maxAge: 24 * 60 * 60 * 1000, // 24 hours\n  path: "/",\n});`,
  },

  // -- General (applies to all web targets) ----------------
  {
    requiredTags: ["general"],
    title: "TLS certificate expiring within 30 days", severity: "medium",
    file: "N/A", line: 0,
    description: "SSL/TLS certificate expires soon. Expired certs cause browser warnings and break HTTPS.",
    fix: `# Renew with certbot (Let's Encrypt):\nsudo certbot renew --dry-run\nsudo certbot renew\n\n# Or set up auto-renewal:\nsudo crontab -e\n# Add: 0 0 1 * * certbot renew --quiet`,
  },
]

const findingsForTarget = (target: string, scanId: string, scanType: string): { findings: ScanFinding[]; stack: TechStack } => {
  const stack = detectStack(target, scanType)
  const matched = allFindings.filter((f) =>
    f.requiredTags.some((tag) => stack.tags.includes(tag))
  )

  // Always include "general" findings for web targets
  const generalFindings = stack.tags.some((t) => ["web", "repo"].includes(t))
    ? allFindings.filter((f) => f.requiredTags.includes("general"))
    : []

  const combined = [...matched, ...generalFindings.filter((gf) => !matched.includes(gf))]

  const findings: ScanFinding[] = combined.map((f, i) => ({
    id: `${scanId}-f${i + 1}`,
    title: f.title,
    severity: f.severity,
    file: f.file,
    line: f.line,
    description: f.description,
    fix: f.fix,
  }))

  return { findings, stack }
}

const statusLabels: Record<string, string> = {
  scanning: "Scanning target...",
  analyzing: "Analyzing vulnerabilities...",
  reporting: "Generating fix code...",
  completed: "Complete",
}

const getLogMessages = (stack: TechStack): string[] => [
  "[INIT] Connecting to target...",
  `[INFO] Target reachable -- detected ${stack.framework}`,
  `[INFO] Loading ${stack.name} scan profile`,
  `[INFO] Running ${stack.tags.includes("solidity") ? "Slither + Mythril" : stack.tags.includes("wordpress") ? "WPScan + Nuclei" : stack.tags.includes("python") ? "Bandit + Safety" : stack.tags.includes("php") ? "PHPStan + Psalm" : "Semgrep + Nuclei"} rules`,
  `[INFO] Analyzing ${stack.lang} sources for known CVEs`,
  "[WARN] Potential vulnerability detected",
  `[INFO] Cross-referencing ${stack.tags.includes("solidity") ? "SWC Registry" : "NVD / CVE"} database`,
  `[INFO] Running ${stack.framework}-specific deep analysis`,
  `[INFO] Generating ${stack.lang} remediation code`,
]

/* ════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [url, setUrl] = useState("")
  const [scans, setScans] = useState<RunScan[]>([])
  const [completedScans, setCompletedScans] = useState<CompletedScan[]>([])
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const completedIdsRef = useRef(new Set<string>())

  /* ── start a scan ──────────────────────────────────────── */
  const startScan = (scanType: string) => {
    const target = url.trim()
    if (!target) {
      toast.error("Enter a URL, repo, or contract address to scan")
      return
    }

    const stack = detectStack(target, scanType)
    const newScan: RunScan = {
      id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      asset: target,
      scanType,
      detectedStack: stack,
      progress: 0,
      status: "scanning",
      logs: ["[INIT] Connecting to target...", `[INFO] Target reachable -- detected ${stack.framework}`],
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
      const { findings } = findingsForTarget(scan.asset, scan.id, scan.scanType)
      const completed: CompletedScan = {
        id: scan.id,
        asset: scan.asset,
        scanType: scan.scanType,
        detectedStack: scan.detectedStack,
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
    const interval = setInterval(() => {
      setScans((prev) => {
        const stillRunning: RunScan[] = []
        const justFinished: RunScan[] = []

        for (const scan of prev) {
          if (completedIdsRef.current.has(scan.id)) continue
          const newProgress = Math.min(scan.progress + 2.2, 100)
          let newStatus = scan.status
          const newLogs = [...scan.logs]
          const msgs = getLogMessages(scan.detectedStack)

          const logIdx = Math.floor((newProgress / 100) * msgs.length)
          if (logIdx < msgs.length && !newLogs.includes(msgs[logIdx])) {
            newLogs.push(msgs[logIdx])
          }
          if (newProgress >= 50 && scan.status === "scanning") newStatus = "analyzing"
          if (newProgress >= 80 && scan.status === "analyzing") newStatus = "reporting"
          if (newProgress >= 95 && !newLogs.some((l) => l.includes("[DONE]"))) {
            newLogs.push("[DONE] Scan complete -- fix code ready")
          }

          const updated = { ...scan, progress: newProgress, status: newStatus, logs: newLogs }

          if (newProgress >= 100) {
            completedIdsRef.current.add(scan.id)
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
      <Card className="bg-card border-2 border-sky-400/30 shadow-md ring-1 ring-sky-400/10 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/10">
                <Zap className="h-5 w-5 text-sky-400" />
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
  className="gap-2 font-semibold h-11 px-6 shrink-0 transition-all hover:-translate-y-0.5 active:translate-y-0"
  style={{
    background: 'linear-gradient(180deg, #89CFF0 0%, #5AB4E0 100%)',
    color: '#0F1A14',
    boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(137,207,240,0.25)',
    border: 'none',
  }}
  onClick={() => startScan("Full Spectrum")}
  >
  <Zap className="h-4 w-4" />
  Scan Now
  </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 border-green-600/30 text-foreground hover:bg-green-600/10 hover:border-green-600/50 text-xs h-8" onClick={() => startScan("Website DAST")}>
                <Globe className="h-3.5 w-3.5 text-green-600" /> Website
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 border-sky-400/30 text-foreground hover:bg-sky-400/10 hover:border-sky-400/50 text-xs h-8" onClick={() => startScan("Web App")}>
                <Smartphone className="h-3.5 w-3.5 text-sky-400" /> Web App
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 border-sky-400/30 text-foreground hover:bg-sky-400/10 hover:border-sky-400/50 text-xs h-8" onClick={() => startScan("Code Repo")}>
                <Code className="h-3.5 w-3.5 text-sky-400" /> Repo
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 border-amber-600/30 text-foreground hover:bg-amber-600/10 hover:border-amber-600/50 text-xs h-8" onClick={() => startScan("Smart Contract")}>
                <Shield className="h-3.5 w-3.5 text-amber-600" /> Smart Contract
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
                    <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">{scan.detectedStack.framework}</Badge>
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
                        <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">{scan.detectedStack.framework}</Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => setExpandedResults((prev) => ({ ...prev, [scan.id]: !prev[scan.id] }))}>
                        {scan.findings.length} finding{scan.findings.length !== 1 ? "s" : ""}
                        {expandedResults[scan.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[11px] text-muted-foreground">Completed at {scan.completedAt}</span>
                      <span className="text-[11px] text-accent font-medium">Stack: {scan.detectedStack.name} ({scan.detectedStack.lang})</span>
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
