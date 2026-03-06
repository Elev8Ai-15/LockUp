/* ════════════════════════════════════════════════════════════
   LockUp Core Types - Production Security Scanner
   ════════════════════════════════════════════════════════════ */

export type Severity = "critical" | "high" | "medium" | "low" | "info"

export type OWASPCategory =
  | "A01:2021-Broken Access Control"
  | "A02:2021-Cryptographic Failures"
  | "A03:2021-Injection"
  | "A04:2021-Insecure Design"
  | "A05:2021-Security Misconfiguration"
  | "A06:2021-Vulnerable Components"
  | "A07:2021-Auth Failures"
  | "A08:2021-Integrity Failures"
  | "A09:2021-Logging Failures"
  | "A10:2021-SSRF"

export type ScanType = "website" | "repo" | "contract" | "api"

export type AssetType = "Website" | "Repo" | "WebApp" | "SmartContract" | "API"

export type VulnType = "SAST" | "DAST" | "SCA" | "Web" | "App" | "Blockchain" | "API" | "Config" | "Shadow AI"

export interface RemediationStep {
  title: string
  description: string
  code?: string
  reference?: string
}

export interface Finding {
  id: string
  title: string
  severity: Severity
  cvss: number
  owasp: OWASPCategory
  type: VulnType
  description: string
  impact: string
  location: string
  evidence?: string
  remediation: RemediationStep
  detectedAt: string
  status: "open" | "fixed" | "ignored"
}

export interface ScanOptions {
  timeout?: number
  depth?: "quick" | "standard" | "deep"
  includeInfo?: boolean
  demoMode?: boolean
}

export interface ScanProgress {
  phase: string
  progress: number
  currentCheck: string
  findings: Finding[]
  logs: string[]
}

export interface ScanResult {
  id: string
  target: string
  scanType: ScanType
  startedAt: string
  completedAt: string
  duration: number
  status: "completed" | "failed" | "partial"
  findings: Finding[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
    total: number
    riskScore: number
  }
  metadata?: Record<string, unknown>
}

export interface ScanReport extends ScanResult {
  executiveSummary: string
  riskRating: "Critical" | "High" | "Medium" | "Low" | "Secure"
  topFindings: Finding[]
  remediationPriority: Finding[]
}

/* ── Legacy compatibility re-exports ────────────────────────── */
export type ScanStatus = "completed" | "running" | "failed" | "queued"

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

export type AgentColorKey = "primary" | "destructive" | "success" | "warning"

export interface Agent {
  id: string
  name: string
  role: string
  status: "active" | "idle" | "thinking"
  currentTask: string
  colorKey: AgentColorKey
}
