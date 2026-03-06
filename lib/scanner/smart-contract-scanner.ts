/* ════════════════════════════════════════════════════════════
   Smart Contract Security Scanner - Solidity Static Analysis
   ════════════════════════════════════════════════════════════ */

import type { Finding, ScanResult, ScanOptions } from "@/lib/types"
import { getOWASPCategory, severityFromCVSS, calculateRiskScore } from "./scoring"
import { getRemediation } from "./remediation"

const TIMEOUT = 10000

/* ── Vulnerability Patterns ─────────────────────────────────── */
const vulnerabilityPatterns = [
  {
    id: "reentrancy",
    title: "Potential Reentrancy Vulnerability",
    pattern: /\.call\s*\{?\s*value\s*:/gi,
    secondaryCheck: (code: string, matchIndex: number): boolean => {
      // Check if state update happens AFTER external call (within 200 chars)
      const afterCall = code.slice(matchIndex, matchIndex + 300)
      const stateUpdateAfter = /\w+\s*[\-+]?=\s*\w+/.test(afterCall)
      const hasNonReentrant = /nonReentrant/gi.test(code.slice(Math.max(0, matchIndex - 200), matchIndex))
      return stateUpdateAfter && !hasNonReentrant
    },
    cvss: 9.8,
    description: "External call found before state update. This pattern can allow reentrancy attacks.",
    impact: "Attackers can recursively call back into the contract before state updates, potentially draining funds.",
  },
  {
    id: "tx-origin",
    title: "tx.origin Used for Authentication",
    pattern: /tx\.origin/gi,
    cvss: 7.5,
    description: "tx.origin is used for authorization, which can be spoofed via phishing contracts.",
    impact: "Attackers can trick users into calling malicious contracts that then authenticate as the user.",
  },
  {
    id: "unchecked-call",
    title: "Unchecked External Call Return Value",
    pattern: /\.\s*call\s*\{[^}]*\}\s*\([^)]*\)\s*;/gi,
    secondaryCheck: (code: string, matchIndex: number): boolean => {
      // Check if return value is being checked
      const beforeCall = code.slice(Math.max(0, matchIndex - 50), matchIndex)
      const hasCheck = /\(\s*bool\s+\w+\s*,?\s*\)?\s*=/.test(beforeCall)
      return !hasCheck
    },
    cvss: 6.5,
    description: "External call return value is not checked, which may silently fail.",
    impact: "Failed transfers may go unnoticed, leading to inconsistent contract state.",
  },
  {
    id: "selfdestruct",
    title: "selfdestruct Function Present",
    pattern: /selfdestruct\s*\(/gi,
    cvss: 8.6,
    description: "Contract contains selfdestruct which can permanently destroy the contract.",
    impact: "If access control is weak, attackers could destroy the contract and steal remaining funds.",
  },
  {
    id: "block-timestamp",
    title: "block.timestamp Used for Critical Logic",
    pattern: /block\.timestamp/gi,
    secondaryCheck: (code: string, matchIndex: number): boolean => {
      // Check if used in comparison or require
      const context = code.slice(Math.max(0, matchIndex - 50), matchIndex + 100)
      return /require\s*\(|if\s*\(|while\s*\(/.test(context)
    },
    cvss: 4.3,
    description: "block.timestamp is used for critical logic and can be manipulated by miners.",
    impact: "Miners can manipulate timestamps by ~15 seconds, affecting time-dependent logic.",
  },
  {
    id: "deprecated-constructor",
    title: "Deprecated Constructor Pattern",
    pattern: /function\s+\w+\s*\([^)]*\)\s*(public)?\s*\{[^}]*owner\s*=/gi,
    cvss: 3.7,
    description: "Using function name as constructor (pre-Solidity 0.4.22) is deprecated and dangerous.",
    impact: "Anyone can call a misnamed constructor and take ownership of the contract.",
  },
  {
    id: "floating-pragma",
    title: "Floating Pragma Version",
    pattern: /pragma\s+solidity\s*\^\s*0\./gi,
    cvss: 2.6,
    description: "Floating pragma (^) allows compilation with different compiler versions.",
    impact: "Different compiler versions may introduce bugs or behave differently.",
  },
  {
    id: "old-solidity",
    title: "Outdated Solidity Version",
    pattern: /pragma\s+solidity\s*[\^~]?\s*0\.[0-7]\./gi,
    cvss: 5.3,
    description: "Solidity version is outdated and lacks important security features.",
    impact: "Missing SafeMath (pre-0.8), missing overflow checks, known compiler bugs.",
  },
  {
    id: "no-safemath",
    title: "Integer Arithmetic Without SafeMath",
    pattern: /(\w+)\s*[\+\-\*]\s*(\w+)/gi,
    secondaryCheck: (code: string): boolean => {
      // Only flag if Solidity version < 0.8.0 and no SafeMath import
      const versionMatch = code.match(/pragma\s+solidity\s*[\^~]?\s*0\.([0-9]+)/)
      const version = versionMatch ? parseInt(versionMatch[1]) : 8
      const hasSafeMath = /SafeMath|using\s+SafeMath/i.test(code)
      return version < 8 && !hasSafeMath
    },
    cvss: 7.5,
    description: "Arithmetic operations without overflow protection in Solidity < 0.8.0.",
    impact: "Integer overflow/underflow can corrupt balances or bypass checks.",
  },
  {
    id: "delegatecall",
    title: "delegatecall to User-Controlled Address",
    pattern: /delegatecall\s*\(/gi,
    cvss: 9.1,
    description: "delegatecall executes code in the context of the calling contract.",
    impact: "If the target is user-controlled, attackers can execute arbitrary code with full permissions.",
  },
  {
    id: "arbitrary-send",
    title: "Unrestricted Ether Transfer",
    pattern: /\.transfer\s*\(|\.send\s*\(|\.call\s*\{[^}]*value/gi,
    secondaryCheck: (code: string, matchIndex: number): boolean => {
      // Check if there's no onlyOwner/access control nearby
      const context = code.slice(Math.max(0, matchIndex - 300), matchIndex)
      return !/onlyOwner|require\s*\(\s*msg\.sender\s*==|modifier/.test(context)
    },
    cvss: 8.6,
    description: "Ether transfer without apparent access control.",
    impact: "Unauthorized users may be able to drain contract funds.",
  },
]

/* ── Fetch Contract Source from Etherscan ───────────────────── */
async function fetchContractSource(address: string, apiKey?: string): Promise<string | null> {
  const networks = [
    { name: "mainnet", url: "api.etherscan.io" },
    { name: "goerli", url: "api-goerli.etherscan.io" },
    { name: "sepolia", url: "api-sepolia.etherscan.io" },
    { name: "polygon", url: "api.polygonscan.com" },
    { name: "arbitrum", url: "api.arbiscan.io" },
    { name: "optimism", url: "api-optimistic.etherscan.io" },
    { name: "bsc", url: "api.bscscan.com" },
  ]
  
  for (const network of networks) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)
      
      const url = `https://${network.url}/api?module=contract&action=getsourcecode&address=${address}${apiKey ? `&apikey=${apiKey}` : ""}`
      
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.status === "1" && data.result?.[0]?.SourceCode) {
          let sourceCode = data.result[0].SourceCode
          
          // Handle multi-file format (wrapped in {})
          if (sourceCode.startsWith("{{")) {
            try {
              const parsed = JSON.parse(sourceCode.slice(1, -1))
              sourceCode = Object.values(parsed.sources || {})
                .map((s: any) => s.content)
                .join("\n\n")
            } catch {
              // Use as-is
            }
          }
          
          return sourceCode
        }
      }
    } catch {
      // Try next network
    }
  }
  
  return null
}

/* ── Analyze Contract Source Code ───────────────────────────── */
function analyzeSourceCode(source: string, address: string): Finding[] {
  const findings: Finding[] = []
  
  for (const vuln of vulnerabilityPatterns) {
    const matches = [...source.matchAll(vuln.pattern)]
    
    for (const match of matches) {
      // Skip if secondary check fails
      if (vuln.secondaryCheck && !vuln.secondaryCheck(source, match.index || 0)) {
        continue
      }
      
      // Find line number
      const beforeMatch = source.slice(0, match.index)
      const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1
      
      // Get context (surrounding code)
      const start = Math.max(0, (match.index || 0) - 50)
      const end = Math.min(source.length, (match.index || 0) + match[0].length + 50)
      const context = source.slice(start, end).trim()
      
      findings.push({
        id: `CONTRACT-${vuln.id}-${lineNumber}-${Date.now()}`,
        title: vuln.title,
        severity: severityFromCVSS(vuln.cvss),
        cvss: vuln.cvss,
        owasp: getOWASPCategory(vuln.id),
        type: "Blockchain",
        description: vuln.description,
        impact: vuln.impact,
        location: `${address}:${lineNumber}`,
        evidence: `Line ${lineNumber}: ${context.slice(0, 100)}...`,
        remediation: getRemediation(vuln.id),
        detectedAt: new Date().toISOString(),
        status: "open",
      })
      
      // Only report first occurrence per vulnerability type
      break
    }
  }
  
  return findings
}

/* ── Validate Ethereum Address ──────────────────────────────── */
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/* ── Main Scanner ───────────────────────────────────────────── */
export async function scanContract(address: string, options: ScanOptions = {}): Promise<ScanResult> {
  const startTime = Date.now()
  const findings: Finding[] = []
  
  // Clean address
  const cleanAddress = address.trim().toLowerCase()
  
  if (!isValidAddress(cleanAddress)) {
    return {
      id: `scan-contract-${Date.now()}`,
      target: address,
      scanType: "contract",
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      duration: Date.now() - startTime,
      status: "failed",
      findings: [],
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0, riskScore: 0 },
      metadata: { error: "Invalid Ethereum address format" },
    }
  }
  
  try {
    // Fetch source code
    const apiKey = process.env.ETHERSCAN_API_KEY
    const sourceCode = await fetchContractSource(cleanAddress, apiKey)
    
    if (!sourceCode) {
      return {
        id: `scan-contract-${Date.now()}`,
        target: cleanAddress,
        scanType: "contract",
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        status: "partial",
        findings: [{
          id: `CONTRACT-not-verified-${Date.now()}`,
          title: "Contract Source Code Not Verified",
          severity: "info",
          cvss: 0,
          owasp: "A05:2021-Security Misconfiguration",
          type: "Blockchain",
          description: "The contract source code is not verified on any supported block explorer.",
          impact: "Cannot perform static analysis without source code. The contract may be a proxy or not verified.",
          location: cleanAddress,
          remediation: {
            title: "Verify Contract Source",
            description: "Verify the contract source code on Etherscan or the appropriate block explorer.",
            reference: "https://etherscan.io/verifyContract",
          },
          detectedAt: new Date().toISOString(),
          status: "open",
        }],
        summary: { critical: 0, high: 0, medium: 0, low: 0, info: 1, total: 1, riskScore: 100 },
        metadata: { verified: false },
      }
    }
    
    // Analyze source code
    const codeFindings = analyzeSourceCode(sourceCode, cleanAddress)
    findings.push(...codeFindings)
    
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
      id: `scan-contract-${Date.now()}`,
      target: cleanAddress,
      scanType: "contract",
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      duration: Date.now() - startTime,
      status: "completed",
      findings: filteredFindings,
      summary,
      metadata: { verified: true, linesOfCode: sourceCode.split("\n").length },
    }
    
  } catch (error) {
    return {
      id: `scan-contract-${Date.now()}`,
      target: cleanAddress,
      scanType: "contract",
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
