export const stats = {
  totalScans: 248,
  vulnsFound: 47,
  avgSecurityScore: 92,
  blockchainAudits: 12,
}

export type ScanStatus = "completed" | "running" | "failed" | "queued"
export type Severity = "critical" | "high" | "medium" | "low"
export type VulnType = "SAST" | "SCA" | "Blockchain"
export type RepoType = "Web" | "AI" | "Blockchain"

export interface RecentScan {
  id: string
  repo: string
  status: ScanStatus
  time: string
  vulns: number
  language: string
}

export const recentScans: RecentScan[] = [
  { id: "1", repo: "frontend-app", status: "completed", time: "2 min ago", vulns: 3, language: "TypeScript" },
  { id: "2", repo: "smart-contracts", status: "completed", time: "5 min ago", vulns: 7, language: "Solidity" },
  { id: "3", repo: "ai-agent-service", status: "running", time: "Running...", vulns: 0, language: "Python" },
  { id: "4", repo: "defi-protocol", status: "completed", time: "12 min ago", vulns: 2, language: "Solidity" },
  { id: "5", repo: "api-gateway", status: "failed", time: "18 min ago", vulns: 0, language: "Go" },
  { id: "6", repo: "nft-marketplace", status: "completed", time: "25 min ago", vulns: 5, language: "TypeScript" },
  { id: "7", repo: "ml-pipeline", status: "queued", time: "Queued", vulns: 0, language: "Python" },
]

export interface Repository {
  id: string
  name: string
  language: string
  lastScan: string
  securityScore: number
  type: RepoType
  connected: boolean
  stars: number
}

export const repositories: Repository[] = [
  { id: "1", name: "frontend-app", language: "TypeScript", lastScan: "2 min ago", securityScore: 94, type: "Web", connected: true, stars: 128 },
  { id: "2", name: "smart-contracts", language: "Solidity", lastScan: "5 min ago", securityScore: 78, type: "Blockchain", connected: true, stars: 342 },
  { id: "3", name: "ai-agent-service", language: "Python", lastScan: "Running...", securityScore: 88, type: "AI", connected: true, stars: 67 },
  { id: "4", name: "defi-protocol", language: "Solidity", lastScan: "12 min ago", securityScore: 82, type: "Blockchain", connected: true, stars: 891 },
  { id: "5", name: "api-gateway", language: "Go", lastScan: "18 min ago", securityScore: 96, type: "Web", connected: true, stars: 45 },
  { id: "6", name: "nft-marketplace", language: "TypeScript", lastScan: "25 min ago", securityScore: 71, type: "Blockchain", connected: true, stars: 234 },
  { id: "7", name: "ml-pipeline", language: "Python", lastScan: "1 hr ago", securityScore: 91, type: "AI", connected: true, stars: 156 },
  { id: "8", name: "token-bridge", language: "Rust", lastScan: "Never", securityScore: 0, type: "Blockchain", connected: false, stars: 512 },
  { id: "9", name: "chatbot-ui", language: "TypeScript", lastScan: "3 hrs ago", securityScore: 87, type: "AI", connected: true, stars: 73 },
]

export interface ActiveScan {
  id: string
  repo: string
  tool: string
  progress: number
  status: "scanning" | "analyzing" | "reporting"
  logs: string[]
  startedAt: string
}

export const activeScans: ActiveScan[] = [
  {
    id: "1",
    repo: "ai-agent-service",
    tool: "Semgrep",
    progress: 67,
    status: "scanning",
    startedAt: "3 min ago",
    logs: [
      "[INFO] Scanning src/agents/core.py...",
      "[WARN] Potential SQL injection at line 142",
      "[INFO] Analyzing dependency tree...",
      "[INFO] Found 3 patterns matching rules...",
    ],
  },
  {
    id: "2",
    repo: "defi-protocol",
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
    repo: "frontend-app",
    tool: "Trivy",
    progress: 89,
    status: "reporting",
    startedAt: "5 min ago",
    logs: [
      "[INFO] Scanning container image...",
      "[INFO] Checking OS packages...",
      "[INFO] Checking language packages...",
      "[INFO] Generating SBOM...",
      "[DONE] 2 vulnerabilities found",
    ],
  },
  {
    id: "4",
    repo: "smart-contracts",
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
    repo: "nft-marketplace",
    tool: "Nuclei",
    progress: 55,
    status: "scanning",
    startedAt: "2 min ago",
    logs: [
      "[INFO] Loading 4,521 templates...",
      "[INFO] Testing XSS vectors...",
      "[WARN] Reflected XSS at /api/search",
      "[INFO] Testing SSRF vectors...",
    ],
  },
]

export interface Vulnerability {
  id: string
  title: string
  severity: Severity
  type: VulnType
  repo: string
  file: string
  line: number
  cvss: number
  status: "open" | "fixed" | "ignored"
  description: string
  detectedAt: string
}

export const vulnerabilities: Vulnerability[] = [
  {
    id: "VULN-001",
    title: "Reentrancy in withdraw()",
    severity: "critical",
    type: "Blockchain",
    repo: "smart-contracts",
    file: "contracts/Vault.sol",
    line: 89,
    cvss: 9.8,
    status: "open",
    description: "The withdraw() function makes an external call before updating the contract state, allowing an attacker to re-enter the function and drain funds.",
    detectedAt: "5 min ago",
  },
  {
    id: "VULN-002",
    title: "SQL Injection in search endpoint",
    severity: "critical",
    type: "SAST",
    repo: "ai-agent-service",
    file: "src/routes/search.py",
    line: 142,
    cvss: 9.1,
    status: "open",
    description: "User input is directly interpolated into SQL query without parameterization.",
    detectedAt: "3 min ago",
  },
  {
    id: "VULN-003",
    title: "Unchecked return value in transfer()",
    severity: "high",
    type: "Blockchain",
    repo: "defi-protocol",
    file: "contracts/Bridge.sol",
    line: 234,
    cvss: 8.2,
    status: "open",
    description: "The return value of ERC20.transfer() is not checked, which could silently fail.",
    detectedAt: "12 min ago",
  },
  {
    id: "VULN-004",
    title: "Prototype Pollution in lodash",
    severity: "high",
    type: "SCA",
    repo: "frontend-app",
    file: "package.json",
    line: 24,
    cvss: 7.5,
    status: "fixed",
    description: "lodash versions prior to 4.17.21 are vulnerable to prototype pollution via the merge function.",
    detectedAt: "2 hrs ago",
  },
  {
    id: "VULN-005",
    title: "Reflected XSS via search parameter",
    severity: "high",
    type: "SAST",
    repo: "nft-marketplace",
    file: "pages/search.tsx",
    line: 67,
    cvss: 7.1,
    status: "open",
    description: "User input from query parameter is rendered without sanitization.",
    detectedAt: "25 min ago",
  },
  {
    id: "VULN-006",
    title: "Integer overflow in token minting",
    severity: "medium",
    type: "Blockchain",
    repo: "smart-contracts",
    file: "contracts/Token.sol",
    line: 156,
    cvss: 6.5,
    status: "open",
    description: "Multiplication of user-supplied amount could overflow, bypassing max supply check.",
    detectedAt: "5 min ago",
  },
  {
    id: "VULN-007",
    title: "Insecure deserialization",
    severity: "medium",
    type: "SAST",
    repo: "ai-agent-service",
    file: "src/utils/parser.py",
    line: 89,
    cvss: 6.3,
    status: "ignored",
    description: "pickle.loads() is used to deserialize untrusted data, allowing arbitrary code execution.",
    detectedAt: "1 hr ago",
  },
  {
    id: "VULN-008",
    title: "Missing access control on admin function",
    severity: "high",
    type: "Blockchain",
    repo: "defi-protocol",
    file: "contracts/Governance.sol",
    line: 45,
    cvss: 8.6,
    status: "open",
    description: "The setFee() function lacks the onlyOwner modifier, allowing anyone to change protocol fees.",
    detectedAt: "12 min ago",
  },
  {
    id: "VULN-009",
    title: "Outdated OpenSSL dependency",
    severity: "low",
    type: "SCA",
    repo: "api-gateway",
    file: "go.mod",
    line: 12,
    cvss: 3.1,
    status: "fixed",
    description: "OpenSSL version 1.1.1 is end-of-life and no longer receives security updates.",
    detectedAt: "18 min ago",
  },
  {
    id: "VULN-010",
    title: "Hardcoded API key in source",
    severity: "medium",
    type: "SAST",
    repo: "chatbot-ui",
    file: "src/lib/api.ts",
    line: 5,
    cvss: 5.3,
    status: "open",
    description: "OpenAI API key is hardcoded in the source file instead of using environment variables.",
    detectedAt: "3 hrs ago",
  },
]

export const securityTrendData = [
  { month: "Jul", vulns: 28, fixed: 22, score: 85 },
  { month: "Aug", vulns: 35, fixed: 30, score: 83 },
  { month: "Sep", vulns: 22, fixed: 20, score: 88 },
  { month: "Oct", vulns: 31, fixed: 28, score: 86 },
  { month: "Nov", vulns: 18, fixed: 17, score: 91 },
  { month: "Dec", vulns: 24, fixed: 23, score: 89 },
  { month: "Jan", vulns: 15, fixed: 14, score: 92 },
]

export interface BlockchainVuln {
  type: string
  count: number
  severity: Severity
}

export const blockchainVulns: BlockchainVuln[] = [
  { type: "Reentrancy", count: 2, severity: "critical" },
  { type: "Access Control", count: 1, severity: "high" },
  { type: "Integer Overflow", count: 3, severity: "medium" },
  { type: "Unchecked Return", count: 2, severity: "high" },
  { type: "Front-Running", count: 1, severity: "medium" },
  { type: "Gas Optimization", count: 5, severity: "low" },
]

export const gasOptimizations = [
  { function: "transfer()", currentGas: 45_230, optimizedGas: 32_100, savings: "29%" },
  { function: "approve()", currentGas: 28_450, optimizedGas: 21_200, savings: "25%" },
  { function: "mint()", currentGas: 67_800, optimizedGas: 51_300, savings: "24%" },
  { function: "stake()", currentGas: 89_100, optimizedGas: 72_400, savings: "19%" },
  { function: "withdraw()", currentGas: 54_600, optimizedGas: 43_800, savings: "20%" },
]

export const exampleContracts = [
  { name: "UniswapV2 Fork", address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", type: "DEX" },
  { name: "Aave Lending Pool", address: "0x398eC7346DcD622eDc5ae82352F02bE94C62d119", type: "Lending" },
  { name: "Custom NFT Drop", address: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", type: "NFT" },
]

export const fundFlowData = [
  { source: "User", target: "Router", value: 100 },
  { source: "Router", target: "Pool A", value: 60 },
  { source: "Router", target: "Pool B", value: 40 },
  { source: "Pool A", target: "Treasury", value: 3 },
  { source: "Pool B", target: "Treasury", value: 2 },
  { source: "Pool A", target: "LP Holders", value: 57 },
  { source: "Pool B", target: "LP Holders", value: 38 },
]
