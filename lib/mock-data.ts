export const stats = {
  totalScans: 1247,
  vulnsFixed: 892,
  aiFixRate: 96,
  assetsScanned: 312,
}

export type ScanStatus = "completed" | "running" | "failed" | "queued"
export type Severity = "critical" | "high" | "medium" | "low"
export type VulnType =
  | "SAST"
  | "DAST"
  | "SCA"
  | "Web"
  | "App"
  | "Blockchain"
  | "Shadow AI"
  | "API Security"
  | "AI/LLM"
  | "Supply Chain"
  | "Cloud/Infra"
  | "Cryptography"
export type AssetType = "Repo" | "Website" | "WebApp" | "SmartContract"

export interface RecentScan {
  id: string
  asset: string
  assetType: AssetType
  status: ScanStatus
  time: string
  vulns: number
  language: string
  autoFixed?: boolean
}

export const recentScans: RecentScan[] = [
  { id: "1", asset: "frontend-app", assetType: "Repo", status: "completed", time: "2 min ago", vulns: 3, language: "TypeScript", autoFixed: true },
  { id: "2", asset: "vault-contracts", assetType: "SmartContract", status: "completed", time: "5 min ago", vulns: 7, language: "Solidity" },
  { id: "3", asset: "yoursite.com", assetType: "Website", status: "running", time: "Running...", vulns: 0, language: "HTML/JS" },
  { id: "4", asset: "app.example.com", assetType: "WebApp", status: "completed", time: "12 min ago", vulns: 2, language: "React Native", autoFixed: true },
  { id: "5", asset: "api-gateway", assetType: "Repo", status: "failed", time: "18 min ago", vulns: 0, language: "Go" },
  { id: "6", asset: "nft-marketplace", assetType: "SmartContract", status: "completed", time: "25 min ago", vulns: 5, language: "Solidity" },
  { id: "7", asset: "ml-pipeline", assetType: "Repo", status: "queued", time: "Queued", vulns: 0, language: "Python" },
]

export interface Asset {
  id: string
  name: string
  type: AssetType
  language: string
  lastScan: string
  securityScore: number
  connected: boolean
  shadowAI?: number
  stars?: number
  crawlDepth?: string
  endpoints?: string
}

export const assets: Asset[] = [
  { id: "1", name: "frontend-app", type: "Repo", language: "TypeScript", lastScan: "2 min ago", securityScore: 94, connected: true, shadowAI: 12, stars: 128 },
  { id: "2", name: "vault-contracts", type: "SmartContract", language: "Solidity", lastScan: "5 min ago", securityScore: 78, connected: true, stars: 342 },
  { id: "3", name: "ai-agent-service", type: "Repo", language: "Python", lastScan: "Running...", securityScore: 88, connected: true, shadowAI: 47, stars: 67 },
  { id: "4", name: "defi-protocol", type: "SmartContract", language: "Solidity", lastScan: "12 min ago", securityScore: 82, connected: true },
  { id: "5", name: "yoursite.com", type: "Website", language: "HTML/JS/CSS", lastScan: "30 min ago", securityScore: 91, connected: true, crawlDepth: "87 pages", endpoints: "142" },
  { id: "6", name: "app.example.com", type: "WebApp", language: "React Native", lastScan: "1 hr ago", securityScore: 87, connected: true, shadowAI: 23, crawlDepth: "34 routes", endpoints: "89" },
  { id: "7", name: "nft-marketplace", type: "SmartContract", language: "TypeScript", lastScan: "25 min ago", securityScore: 71, connected: true },
  { id: "8", name: "token-bridge", type: "SmartContract", language: "Rust", lastScan: "Never", securityScore: 0, connected: false },
  { id: "9", name: "chatbot-ui", type: "Repo", language: "TypeScript", lastScan: "3 hrs ago", securityScore: 87, connected: true, shadowAI: 35 },
  { id: "10", name: "store.brand.io", type: "Website", language: "Next.js", lastScan: "45 min ago", securityScore: 96, connected: true, crawlDepth: "124 pages", endpoints: "203" },
  { id: "11", name: "mobile-banking-app", type: "WebApp", language: "Flutter", lastScan: "2 hrs ago", securityScore: 83, connected: true, shadowAI: 8, crawlDepth: "18 routes", endpoints: "56" },
  { id: "12", name: "admin-dashboard", type: "WebApp", language: "Vue.js", lastScan: "4 hrs ago", securityScore: 90, connected: true, crawlDepth: "42 routes", endpoints: "115" },
]

export interface ActiveScan {
  id: string
  asset: string
  assetType: AssetType
  tool: string
  progress: number
  status: "scanning" | "analyzing" | "reporting"
  logs: string[]
  startedAt: string
}

export const activeScans: ActiveScan[] = [
  {
    id: "1",
    asset: "yoursite.com",
    assetType: "Website",
    tool: "OWASP ZAP",
    progress: 67,
    status: "scanning",
    startedAt: "3 min ago",
    logs: [
      "[INFO] Spider crawling https://yoursite.com...",
      "[INFO] Found 147 endpoints",
      "[WARN] Reflected XSS on /search?q=",
      "[INFO] Testing SQL injection vectors...",
    ],
  },
  {
    id: "2",
    asset: "defi-protocol",
    assetType: "SmartContract",
    tool: "Slither",
    progress: 34,
    status: "analyzing",
    startedAt: "1 min ago",
    logs: [
      "[INFO] Compiling contracts...",
      "[INFO] Running detector: reentrancy-eth",
      "[WARN] Reentrancy detected in Vault.sol:89",
    ],
  },
  {
    id: "3",
    asset: "app.example.com",
    assetType: "WebApp",
    tool: "Nuclei",
    progress: 89,
    status: "reporting",
    startedAt: "5 min ago",
    logs: [
      "[INFO] Loading 4,521 templates...",
      "[INFO] Testing CORS misconfiguration...",
      "[WARN] Insecure CORS policy detected",
      "[INFO] Testing API endpoints...",
      "[DONE] 3 vulnerabilities found",
    ],
  },
  {
    id: "4",
    asset: "vault-contracts",
    assetType: "SmartContract",
    tool: "Mythril",
    progress: 12,
    status: "scanning",
    startedAt: "30 sec ago",
    logs: [
      "[INFO] Starting symbolic execution...",
      "[INFO] Analyzing Token.sol...",
    ],
  },
  {
    id: "5",
    asset: "frontend-app",
    assetType: "Repo",
    tool: "Semgrep",
    progress: 55,
    status: "scanning",
    startedAt: "2 min ago",
    logs: [
      "[INFO] Scanning src/ directory...",
      "[WARN] Potential prototype pollution in utils.ts",
      "[INFO] Analyzing import graph...",
    ],
  },
]

export interface Vulnerability {
  id: string
  title: string
  severity: Severity
  type: VulnType
  asset: string
  file: string
  line: number
  cvss: number
  status: "open" | "fixed" | "ignored"
  description: string
  detectedAt: string
}

export const vulnerabilities: Vulnerability[] = [
  // ── Blockchain ──────────────────────────────────────────────────────────
  {
    id: "VULN-001", title: "Reentrancy in withdraw()", severity: "critical", type: "Blockchain",
    asset: "vault-contracts", file: "contracts/Vault.sol", line: 89, cvss: 9.8, status: "open",
    description: "The withdraw() function makes an external call before updating contract state (CEI pattern violation), allowing an attacker to re-enter and drain funds.",
    detectedAt: "5 min ago",
  },
  {
    id: "VULN-008", title: "Missing access control on setFee()", severity: "high", type: "Blockchain",
    asset: "defi-protocol", file: "contracts/Governance.sol", line: 45, cvss: 8.6, status: "open",
    description: "setFee() lacks the onlyOwner modifier, allowing any address to change protocol fees to 100% and drain all liquidity.",
    detectedAt: "12 min ago",
  },
  // ── Web ─────────────────────────────────────────────────────────────────
  {
    id: "VULN-002", title: "Reflected XSS on search endpoint", severity: "critical", type: "Web",
    asset: "yoursite.com", file: "/search?q=", line: 0, cvss: 9.1, status: "open",
    description: "User input from query parameter is reflected in the DOM without sanitization, enabling script injection that steals session cookies and bypasses SameSite protections.",
    detectedAt: "3 min ago",
  },
  {
    id: "VULN-007", title: "Missing security headers (CSP, HSTS, X-Frame-Options)", severity: "medium", type: "Web",
    asset: "store.brand.io", file: "next.config.js", line: 5, cvss: 5.8, status: "open",
    description: "Missing Content-Security-Policy, Strict-Transport-Security, and X-Frame-Options expose the site to XSS, clickjacking, and SSL-stripping attacks.",
    detectedAt: "45 min ago",
  },
  // ── DAST ────────────────────────────────────────────────────────────────
  {
    id: "VULN-005", title: "SQL Injection in search API", severity: "critical", type: "DAST",
    asset: "yoursite.com", file: "/api/search", line: 0, cvss: 9.5, status: "open",
    description: "Dynamic SQL constructed from user input without parameterization. Confirmed blind time-based SQLi via DAST crawl — full database read/write possible.",
    detectedAt: "10 min ago",
  },
  {
    id: "VULN-010", title: "Exposed debug/env endpoint", severity: "high", type: "DAST",
    asset: "app.example.com", file: "/debug/vars", line: 0, cvss: 7.8, status: "open",
    description: "Debug endpoint returns all environment variables including DATABASE_URL and API keys to unauthenticated requests — critical info disclosure in production.",
    detectedAt: "1 hr ago",
  },
  // ── App ─────────────────────────────────────────────────────────────────
  {
    id: "VULN-003", title: "Wildcard CORS with credentials", severity: "high", type: "App",
    asset: "app.example.com", file: "server/cors.config.js", line: 12, cvss: 8.2, status: "open",
    description: "Access-Control-Allow-Origin: * combined with credentials: true violates the CORS spec and allows any attacker-controlled origin to make authenticated API requests.",
    detectedAt: "12 min ago",
  },
  // ── SCA ─────────────────────────────────────────────────────────────────
  {
    id: "VULN-004", title: "Prototype pollution in lodash merge()", severity: "high", type: "SCA",
    asset: "frontend-app", file: "package.json", line: 24, cvss: 7.5, status: "fixed",
    description: "lodash < 4.17.21 prototype pollution via merge(). Attacker-controlled input modifies Object.prototype, escalating to RCE in Node.js server-side contexts.",
    detectedAt: "2 hrs ago",
  },
  // ── SAST ────────────────────────────────────────────────────────────────
  {
    id: "VULN-009", title: "Hardcoded API key in source", severity: "medium", type: "SAST",
    asset: "chatbot-ui", file: "src/lib/api.ts", line: 5, cvss: 5.3, status: "open",
    description: "OpenAI API key hardcoded in source — present in git history. Any repository clone or accidental public exposure permanently leaks the credential.",
    detectedAt: "3 hrs ago",
  },
  // ── Shadow AI ───────────────────────────────────────────────────────────
  {
    id: "VULN-006", title: "AI-generated insecure PRNG (Math.random)", severity: "medium", type: "Shadow AI",
    asset: "chatbot-ui", file: "src/lib/auth.ts", line: 42, cvss: 6.5, status: "open",
    description: "AI-generated session token uses Math.random() — not a CSPRNG. Predictable tokens allow session hijacking. Detected as vibe-coded function at 92% confidence.",
    detectedAt: "1 hr ago",
  },
  // ── API Security (OWASP API Top 10 2023) ─────────────────────────────
  {
    id: "VULN-011", title: "BOLA — Broken Object Level Authorization", severity: "critical", type: "API Security",
    asset: "api-gateway", file: "/api/users/{id}/data", line: 0, cvss: 9.3, status: "open",
    description: "/api/users/:id does not verify resource ownership. Any authenticated user can access any other user's data by iterating IDs — the #1 OWASP API vulnerability.",
    detectedAt: "20 min ago",
  },
  {
    id: "VULN-012", title: "GraphQL introspection + excessive data exposure", severity: "high", type: "API Security",
    asset: "api-gateway", file: "/graphql", line: 0, cvss: 7.5, status: "open",
    description: "GraphQL introspection enabled in production; passwordHash, internalNotes, and stripeCustomerId returned without field-level authorization guards.",
    detectedAt: "35 min ago",
  },
  // ── AI/LLM Security ──────────────────────────────────────────────────
  {
    id: "VULN-013", title: "Prompt Injection in AI chat endpoint", severity: "critical", type: "AI/LLM",
    asset: "chatbot-ui", file: "/api/chat", line: 0, cvss: 9.0, status: "open",
    description: "User input is concatenated directly into the LLM system prompt. Attackers override system instructions, exfiltrate context window, or trigger policy-violating outputs.",
    detectedAt: "15 min ago",
  },
  // ── Supply Chain ────────────────────────────────────────────────────
  {
    id: "VULN-014", title: "Dependency confusion attack surface", severity: "high", type: "Supply Chain",
    asset: "ml-pipeline", file: "requirements.txt", line: 0, cvss: 8.1, status: "open",
    description: "Private package names in requirements.txt are available on PyPI under the same name. A dependency confusion attack substitutes malicious code silently at install time.",
    detectedAt: "2 hrs ago",
  },
  // ── Cloud/Infra ─────────────────────────────────────────────────────
  {
    id: "VULN-015", title: "SSRF via unvalidated URL parameter", severity: "high", type: "Cloud/Infra",
    asset: "ai-agent-service", file: "src/tools/fetch.py", line: 23, cvss: 8.3, status: "open",
    description: "User-controlled URLs passed to requests.get() without allowlist validation. Attacker probes AWS metadata endpoint (169.254.169.254), internal APIs, and Redis via SSRF.",
    detectedAt: "40 min ago",
  },
  // ── Cryptography ────────────────────────────────────────────────────
  {
    id: "VULN-016", title: "MD5 used for password hashing (no salt)", severity: "critical", type: "Cryptography",
    asset: "admin-dashboard", file: "lib/auth/hash.js", line: 8, cvss: 9.2, status: "open",
    description: "Passwords hashed with MD5 with no salt. MD5 is not a password-hashing function — pre-computed rainbow tables crack all stored passwords offline in seconds.",
    detectedAt: "1 hr ago",
  },
]

export const securityTrendData = [
  { month: "Aug", code: 28, web: 15, app: 8, blockchain: 12, fixed: 52 },
  { month: "Sep", code: 22, web: 11, app: 6, blockchain: 9, fixed: 40 },
  { month: "Oct", code: 31, web: 18, app: 10, blockchain: 14, fixed: 61 },
  { month: "Nov", code: 18, web: 9, app: 5, blockchain: 7, fixed: 35 },
  { month: "Dec", code: 24, web: 12, app: 7, blockchain: 10, fixed: 48 },
  { month: "Jan", code: 15, web: 7, app: 4, blockchain: 6, fixed: 30 },
  { month: "Feb", code: 12, web: 5, app: 3, blockchain: 4, fixed: 23 },
]

export type AgentColorKey = "primary" | "destructive" | "success" | "warning"

export interface Agent {
  id: string
  name: string
  role: string
  status: "active" | "idle" | "thinking"
  currentTask: string
  colorKey: AgentColorKey
}

export const agents: Agent[] = [
  { id: "1", name: "Triage Agent", role: "Classifies vulnerabilities by CVSS, exploitability, and business impact", status: "active", currentTask: "Classifying XSS on yoursite.com...", colorKey: "primary" },
  { id: "2", name: "Exploit Agent", role: "Validates exploitability with proof-of-concept code generation", status: "thinking", currentTask: "Generating PoC for reentrancy...", colorKey: "destructive" },
  { id: "3", name: "Fix Agent", role: "Generates secure code patches, config fixes, and dependency updates", status: "active", currentTask: "Patching XSS on website...", colorKey: "success" },
  { id: "4", name: "Validator Agent", role: "Runs tests, verifies fixes, and opens PRs — zero regressions guaranteed", status: "idle", currentTask: "Awaiting fix from Fix Agent...", colorKey: "warning" },
]

export interface BlockchainVuln {
  type: string
  count: number
  severity: Severity
}

export const blockchainVulns: BlockchainVuln[] = [
  { type: "Reentrancy", count: 3, severity: "critical" },
  { type: "Oracle Manipulation", count: 1, severity: "high" },
  { type: "Flash Loan Attack Surface", count: 2, severity: "high" },
  { type: "Integer Overflow/Underflow", count: 2, severity: "medium" },
  { type: "Access Control Missing", count: 1, severity: "high" },
  { type: "Unchecked Return Values", count: 4, severity: "medium" },
  { type: "Timestamp Dependence", count: 2, severity: "medium" },
  { type: "Gas Optimization", count: 5, severity: "low" },
]

export const gasOptimizations = [
  { function: "transfer()", currentGas: 45_230, optimizedGas: 32_100, savings: "29%", suggestion: "Use unchecked block for safe arithmetic after require checks" },
  { function: "approve()", currentGas: 28_450, optimizedGas: 21_200, savings: "25%", suggestion: "Cache storage variable in memory before loop" },
  { function: "mint()", currentGas: 67_800, optimizedGas: 51_300, savings: "24%", suggestion: "Use ERC721A batch minting — avoids per-token SSTORE" },
  { function: "stake()", currentGas: 89_100, optimizedGas: 72_400, savings: "19%", suggestion: "Replace mapping + struct with packed storage slot" },
  { function: "withdraw()", currentGas: 54_600, optimizedGas: 43_800, savings: "20%", suggestion: "Combine multiple SLOADs into one memory cache" },
]

export const exampleContracts = [
  { name: "UniswapV2 Fork", address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", type: "DEX" },
  { name: "Aave Lending Pool", address: "0x398eC7346DcD622eDc5ae82352F02bE94C62d119", type: "Lending" },
  { name: "Custom NFT Drop", address: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", type: "NFT" },
]

export const runtimeMetrics = [
  { time: "00:00", apiCalls: 120, memory: 45, onChain: 3, webTraffic: 890 },
  { time: "04:00", apiCalls: 80, memory: 42, onChain: 1, webTraffic: 340 },
  { time: "08:00", apiCalls: 250, memory: 58, onChain: 5, webTraffic: 1200 },
  { time: "12:00", apiCalls: 380, memory: 67, onChain: 8, webTraffic: 2100 },
  { time: "16:00", apiCalls: 420, memory: 72, onChain: 12, webTraffic: 2800 },
  { time: "20:00", apiCalls: 290, memory: 55, onChain: 6, webTraffic: 1600 },
  { time: "Now", apiCalls: 310, memory: 61, onChain: 7, webTraffic: 1900 },
]

export const shadowAIDetections = [
  { file: "src/utils/auth.ts", confidence: 92, type: "Insecure PRNG (Math.random) for tokens", risk: "high" as Severity, asset: "chatbot-ui" },
  { file: "src/api/search.py", confidence: 87, type: "Raw SQL string concatenation", risk: "critical" as Severity, asset: "ai-agent-service" },
  { file: "components/Form.tsx", confidence: 74, type: "Missing input validation/sanitization", risk: "medium" as Severity, asset: "frontend-app" },
  { file: "lib/crypto.js", confidence: 95, type: "Weak encryption (MD5/DES)", risk: "high" as Severity, asset: "app.example.com" },
  { file: "hooks/useAuth.ts", confidence: 68, type: "Insecure session handler pattern", risk: "medium" as Severity, asset: "admin-dashboard" },
  { file: "api/ai_chat.py", confidence: 91, type: "Prompt injection vulnerability", risk: "critical" as Severity, asset: "ai-agent-service" },
  { file: "utils/fetch.py", confidence: 83, type: "Unvalidated URL fetch (SSRF)", risk: "high" as Severity, asset: "ai-agent-service" },
]
