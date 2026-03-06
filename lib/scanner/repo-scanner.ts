/* ════════════════════════════════════════════════════════════
   Repository Security Scanner - GitHub API + OSV.dev checks
   ════════════════════════════════════════════════════════════ */

import type { Finding, ScanResult, ScanOptions } from "@/lib/types"
import { getOWASPCategory, severityFromCVSS, calculateRiskScore } from "./scoring"
import { getRemediation } from "./remediation"

const TIMEOUT = 10000

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/* ── Secret Detection Patterns ──────────────────────────────── */
const secretPatterns = [
  { name: "AWS Access Key", pattern: /AKIA[0-9A-Z]{16}/g, cvss: 9.8 },
  { name: "AWS Secret Key", pattern: /(?:aws_secret_access_key|secret_access_key)\s*[:=]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gi, cvss: 9.8 },
  { name: "Private Key", pattern: /-----BEGIN\s+(RSA|DSA|EC|OPENSSH|PGP)\s+PRIVATE\s+KEY-----/gi, cvss: 9.8 },
  { name: "GitHub Token", pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g, cvss: 9.1 },
  { name: "Generic API Key", pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?([A-Za-z0-9_\-]{20,})['"]?/gi, cvss: 7.5 },
  { name: "JWT Secret", pattern: /(?:jwt[_-]?secret|JWT_SECRET)\s*[:=]\s*['"]?([A-Za-z0-9_\-]{16,})['"]?/gi, cvss: 9.1 },
  { name: "Database URL with Password", pattern: /(?:postgres|mysql|mongodb|redis):\/\/[^:]+:([^@]+)@/gi, cvss: 9.8 },
  { name: "Stripe API Key", pattern: /sk_live_[A-Za-z0-9]{24,}/g, cvss: 9.5 },
  { name: "Stripe Publishable Key (Live)", pattern: /pk_live_[A-Za-z0-9]{24,}/g, cvss: 3.1 },
  { name: "OpenAI API Key", pattern: /sk-[A-Za-z0-9]{48}/g, cvss: 7.5 },
  { name: "Slack Token", pattern: /xox[baprs]-[0-9]{10,}-[A-Za-z0-9-]+/g, cvss: 7.5 },
  { name: "Discord Token", pattern: /[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}/g, cvss: 7.5 },
  { name: "Twilio API Key", pattern: /SK[a-f0-9]{32}/g, cvss: 7.5 },
  { name: "SendGrid API Key", pattern: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/g, cvss: 7.5 },
]

/* ── Parse GitHub Repo URL ──────────────────────────────────── */
function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  // Handle: github.com/user/repo, https://github.com/user/repo, user/repo
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/\s]+)/i,
    /^([^\/]+)\/([^\/\s]+)$/,
  ]
  
  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ""),
      }
    }
  }
  
  return null
}

/* ── Check for Hardcoded Secrets ────────────────────────────── */
async function checkForSecrets(owner: string, repo: string): Promise<Finding[]> {
  const findings: Finding[] = []
  
  try {
    // Fetch repo contents - check common files
    const filesToCheck = [
      "package.json",
      ".env.example",
      "config/default.json",
      "src/config.js",
      "src/config.ts",
      "app/config.py",
      "settings.py",
    ]
    
    for (const file of filesToCheck) {
      try {
        const response = await fetchWithTimeout(
          `https://raw.githubusercontent.com/${owner}/${repo}/main/${file}`
        )
        
        if (response.status !== 200) {
          // Try master branch
          const masterResponse = await fetchWithTimeout(
            `https://raw.githubusercontent.com/${owner}/${repo}/master/${file}`
          )
          if (masterResponse.status !== 200) continue
        }
        
        const content = await response.text()
        
        for (const secretPattern of secretPatterns) {
          const matches = content.match(secretPattern.pattern)
          if (matches && matches.length > 0) {
            findings.push({
              id: `REPO-secret-${secretPattern.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
              title: `Hardcoded ${secretPattern.name} Detected`,
              severity: severityFromCVSS(secretPattern.cvss),
              cvss: secretPattern.cvss,
              owasp: getOWASPCategory("hardcoded-secret"),
              type: "SAST",
              description: `A ${secretPattern.name} was found hardcoded in ${file}.`,
              impact: "Secrets in source code can be extracted from version history even after deletion.",
              location: `${owner}/${repo}/${file}`,
              evidence: `Found ${matches.length} match(es) for ${secretPattern.name} pattern`,
              remediation: getRemediation("hardcoded-secret"),
              detectedAt: new Date().toISOString(),
              status: "open",
            })
          }
        }
        
      } catch {
        // File not found or error - continue
      }
    }
    
  } catch (error) {
    // API error
  }
  
  return findings
}

/* ── Check Dependencies via OSV.dev ─────────────────────────── */
async function checkDependencies(owner: string, repo: string): Promise<Finding[]> {
  const findings: Finding[] = []
  
  try {
    // Fetch package.json
    let packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> } | null = null
    
    for (const branch of ["main", "master"]) {
      try {
        const response = await fetchWithTimeout(
          `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/package.json`
        )
        if (response.status === 200) {
          packageJson = await response.json()
          break
        }
      } catch {
        continue
      }
    }
    
    if (!packageJson) return findings
    
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }
    
    // Check each dependency against OSV.dev
    for (const [name, versionSpec] of Object.entries(allDeps)) {
      try {
        // Clean version (remove ^, ~, etc.)
        const version = versionSpec.replace(/^[\^~>=<]+/, "").split(" ")[0]
        
        const osvResponse = await fetchWithTimeout(
          "https://api.osv.dev/v1/query",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              package: { name, ecosystem: "npm" },
              version,
            }),
          }
        )
        
        if (osvResponse.status === 200) {
          const data = await osvResponse.json()
          
          if (data.vulns && data.vulns.length > 0) {
            for (const vuln of data.vulns.slice(0, 3)) { // Limit to 3 vulns per package
              const severity = vuln.severity?.[0]?.score 
                ? severityFromCVSS(parseFloat(vuln.severity[0].score))
                : "medium"
              
              const cvssScore = vuln.severity?.[0]?.score 
                ? parseFloat(vuln.severity[0].score)
                : 5.0
              
              findings.push({
                id: `REPO-vuln-${vuln.id || name}-${Date.now()}`,
                title: `Vulnerable Dependency: ${name}@${version}`,
                severity,
                cvss: cvssScore,
                owasp: getOWASPCategory("outdated-dependency"),
                type: "SCA",
                description: vuln.summary || `Known vulnerability in ${name}@${version}`,
                impact: "Vulnerable dependencies can be exploited to compromise your application.",
                location: `${owner}/${repo}/package.json`,
                evidence: `${vuln.id || "CVE"}: ${vuln.summary || "See advisory for details"}`,
                remediation: {
                  title: `Update ${name}`,
                  description: `Update to a patched version of ${name}.`,
                  code: `npm update ${name}\n# or\npnpm update ${name}`,
                  reference: vuln.references?.[0]?.url || "https://osv.dev",
                },
                detectedAt: new Date().toISOString(),
                status: "open",
              })
            }
          }
        }
        
      } catch {
        // Skip this dependency
      }
    }
    
  } catch (error) {
    // Package.json fetch failed
  }
  
  return findings
}

/* ── Check Repo Security Files ──────────────────────────────── */
async function checkSecurityFiles(owner: string, repo: string): Promise<Finding[]> {
  const findings: Finding[] = []
  
  const securityFiles = [
    { path: ".gitignore", id: "missing-gitignore", title: "Missing .gitignore", cvss: 3.1 },
    { path: "SECURITY.md", id: "missing-security-md", title: "Missing SECURITY.md", cvss: 0 },
    { path: ".github/dependabot.yml", id: "missing-dependabot", title: "Missing Dependabot Configuration", cvss: 2.6 },
  ]
  
  for (const file of securityFiles) {
    try {
      let found = false
      
      for (const branch of ["main", "master"]) {
        const response = await fetchWithTimeout(
          `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
          { headers: { "Accept": "application/vnd.github.v3+json" } }
        )
        
        if (response.status === 200) {
          found = true
          break
        }
      }
      
      if (!found) {
        findings.push({
          id: `REPO-${file.id}-${Date.now()}`,
          title: file.title,
          severity: file.cvss > 0 ? severityFromCVSS(file.cvss) : "info",
          cvss: file.cvss,
          owasp: getOWASPCategory(file.id),
          type: "Config",
          description: `The repository is missing ${file.path}.`,
          impact: file.id === "missing-gitignore" 
            ? "Sensitive files may be accidentally committed." 
            : file.id === "missing-dependabot"
            ? "Dependencies won't be automatically updated for security patches."
            : "Security researchers won't know how to report vulnerabilities.",
          location: `${owner}/${repo}`,
          remediation: getRemediation(file.id),
          detectedAt: new Date().toISOString(),
          status: "open",
        })
      }
      
    } catch {
      // API error
    }
  }
  
  return findings
}

/* ── Main Scanner ───────────────────────────────────────────── */
export async function scanRepository(repoUrl: string, options: ScanOptions = {}): Promise<ScanResult> {
  const startTime = Date.now()
  const findings: Finding[] = []
  
  const parsed = parseGitHubUrl(repoUrl)
  
  if (!parsed) {
    return {
      id: `scan-repo-${Date.now()}`,
      target: repoUrl,
      scanType: "repo",
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      duration: Date.now() - startTime,
      status: "failed",
      findings: [],
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0, riskScore: 0 },
      metadata: { error: "Invalid GitHub repository URL" },
    }
  }
  
  const { owner, repo } = parsed
  
  try {
    // Run all checks in parallel
    const results = await Promise.allSettled([
      checkForSecrets(owner, repo),
      checkDependencies(owner, repo),
      checkSecurityFiles(owner, repo),
    ])
    
    for (const result of results) {
      if (result.status === "fulfilled") {
        findings.push(...result.value)
      }
    }
    
    // Filter by options
    const filteredFindings = options.includeInfo 
      ? findings 
      : findings.filter(f => f.severity !== "info")
    
    const summary = {
      critical: filteredFindings.filter(f => f.severity === "critical").length,
      high: filteredFindings.filter(f => f.severity === "high").length,
      medium: filteredFindings.filter(f => f.severity === "medium").length,
      low: filteredFindings.filter(f => f.severity === "low").length,
      info: filteredFindings.filter(f => f.severity === "info").length,
      total: filteredFindings.length,
      riskScore: calculateRiskScore(filteredFindings),
    }
    
    return {
      id: `scan-repo-${Date.now()}`,
      target: `${owner}/${repo}`,
      scanType: "repo",
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      duration: Date.now() - startTime,
      status: "completed",
      findings: filteredFindings,
      summary,
      metadata: { owner, repo },
    }
    
  } catch (error) {
    return {
      id: `scan-repo-${Date.now()}`,
      target: `${owner}/${repo}`,
      scanType: "repo",
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      duration: Date.now() - startTime,
      status: "failed",
      findings: [],
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0, riskScore: 0 },
      metadata: { error: error instanceof Error ? error.message : "Unknown error" },
    }
  }
}
