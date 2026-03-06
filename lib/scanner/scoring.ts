/* ════════════════════════════════════════════════════════════
   CVSS-style Scoring and OWASP Mapping
   ════════════════════════════════════════════════════════════ */

import type { Severity, OWASPCategory, Finding } from "@/lib/types"

export function severityFromCVSS(cvss: number): Severity {
  if (cvss >= 9.0) return "critical"
  if (cvss >= 7.0) return "high"
  if (cvss >= 4.0) return "medium"
  if (cvss >= 0.1) return "low"
  return "info"
}

export function cvssFromSeverity(severity: Severity): number {
  switch (severity) {
    case "critical": return 9.5
    case "high": return 7.5
    case "medium": return 5.5
    case "low": return 2.5
    case "info": return 0
  }
}

/* ── OWASP Top 10 2021 Mapping ────────────────────────────── */
export const owaspMapping: Record<string, OWASPCategory> = {
  // Access Control
  "missing-auth": "A01:2021-Broken Access Control",
  "cors-wildcard": "A01:2021-Broken Access Control",
  "exposed-admin": "A01:2021-Broken Access Control",
  "missing-access-control": "A01:2021-Broken Access Control",
  
  // Cryptographic Failures
  "weak-tls": "A02:2021-Cryptographic Failures",
  "expired-cert": "A02:2021-Cryptographic Failures",
  "insecure-cookie": "A02:2021-Cryptographic Failures",
  "hardcoded-secret": "A02:2021-Cryptographic Failures",
  "weak-crypto": "A02:2021-Cryptographic Failures",
  
  // Injection
  "xss": "A03:2021-Injection",
  "sqli": "A03:2021-Injection",
  "command-injection": "A03:2021-Injection",
  "prototype-pollution": "A03:2021-Injection",
  
  // Insecure Design
  "reentrancy": "A04:2021-Insecure Design",
  "integer-overflow": "A04:2021-Insecure Design",
  "unchecked-call": "A04:2021-Insecure Design",
  "selfdestruct": "A04:2021-Insecure Design",
  
  // Security Misconfiguration
  "missing-csp": "A05:2021-Security Misconfiguration",
  "missing-hsts": "A05:2021-Security Misconfiguration",
  "server-disclosure": "A05:2021-Security Misconfiguration",
  "exposed-env": "A05:2021-Security Misconfiguration",
  "exposed-git": "A05:2021-Security Misconfiguration",
  "debug-enabled": "A05:2021-Security Misconfiguration",
  "graphql-introspection": "A05:2021-Security Misconfiguration",
  "missing-security-txt": "A05:2021-Security Misconfiguration",
  
  // Vulnerable Components
  "outdated-dependency": "A06:2021-Vulnerable Components",
  "known-cve": "A06:2021-Vulnerable Components",
  "deprecated-compiler": "A06:2021-Vulnerable Components",
  
  // Auth Failures
  "jwt-none": "A07:2021-Auth Failures",
  "tx-origin": "A07:2021-Auth Failures",
  "missing-rate-limit": "A07:2021-Auth Failures",
  
  // Integrity Failures
  "missing-sri": "A08:2021-Integrity Failures",
  "missing-dependabot": "A08:2021-Integrity Failures",
  
  // Logging Failures  
  "missing-logging": "A09:2021-Logging Failures",
  
  // SSRF
  "ssrf": "A10:2021-SSRF",
  "open-redirect": "A10:2021-SSRF",
}

export function getOWASPCategory(findingType: string): OWASPCategory {
  return owaspMapping[findingType] || "A05:2021-Security Misconfiguration"
}

/* ── Risk Score Calculation ─────────────────────────────────── */
export function calculateRiskScore(findings: Finding[]): number {
  if (findings.length === 0) return 100

  let totalWeight = 0
  let maxPossibleWeight = 0

  for (const finding of findings) {
    const weight = finding.cvss * (finding.status === "fixed" ? 0 : 1)
    totalWeight += weight
    maxPossibleWeight += 10 // Max CVSS
  }

  if (maxPossibleWeight === 0) return 100

  const rawScore = 100 - (totalWeight / maxPossibleWeight) * 100
  return Math.max(0, Math.min(100, Math.round(rawScore)))
}

export function getRiskRating(score: number): "Critical" | "High" | "Medium" | "Low" | "Secure" {
  if (score >= 90) return "Secure"
  if (score >= 70) return "Low"
  if (score >= 50) return "Medium"
  if (score >= 30) return "High"
  return "Critical"
}

export function generateExecutiveSummary(findings: Finding[], target: string): string {
  const critical = findings.filter(f => f.severity === "critical").length
  const high = findings.filter(f => f.severity === "high").length
  const medium = findings.filter(f => f.severity === "medium").length
  const total = findings.length

  if (total === 0) {
    return `Security scan of ${target} completed successfully with no vulnerabilities detected. The target appears to follow security best practices.`
  }

  const riskLevel = critical > 0 ? "critical" : high > 0 ? "high" : medium > 0 ? "moderate" : "low"
  
  return `Security scan of ${target} identified ${total} finding${total !== 1 ? "s" : ""} with ${riskLevel} overall risk. ` +
    `${critical > 0 ? `${critical} critical issue${critical !== 1 ? "s" : ""} require immediate attention. ` : ""}` +
    `${high > 0 ? `${high} high severity finding${high !== 1 ? "s" : ""} should be addressed promptly. ` : ""}` +
    `Review the detailed findings below and prioritize remediation based on CVSS scores and business impact.`
}
