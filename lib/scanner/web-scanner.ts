/* ════════════════════════════════════════════════════════════
   Website Security Scanner - HTTP-based checks
   ════════════════════════════════════════════════════════════ */

import type { Finding, ScanResult, ScanOptions } from "@/lib/types"
import { getOWASPCategory, severityFromCVSS, cvssFromSeverity, calculateRiskScore } from "./scoring"
import { getRemediation } from "./remediation"

const TIMEOUT = 10000

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "LockUp-Scanner/1.0",
        ...options.headers,
      },
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/* ── Security Headers Check ─────────────────────────────────── */
async function checkSecurityHeaders(url: string): Promise<Finding[]> {
  const findings: Finding[] = []
  
  try {
    const response = await fetchWithTimeout(url)
    const headers = response.headers
    
    const requiredHeaders = [
      { name: "content-security-policy", id: "missing-csp", title: "Missing Content-Security-Policy", cvss: 6.1 },
      { name: "strict-transport-security", id: "missing-hsts", title: "Missing Strict-Transport-Security", cvss: 5.4 },
      { name: "x-frame-options", id: "missing-x-frame-options", title: "Missing X-Frame-Options", cvss: 4.3 },
      { name: "x-content-type-options", id: "missing-x-content-type-options", title: "Missing X-Content-Type-Options", cvss: 3.7 },
      { name: "referrer-policy", id: "missing-referrer-policy", title: "Missing Referrer-Policy", cvss: 3.1 },
      { name: "permissions-policy", id: "missing-permissions-policy", title: "Missing Permissions-Policy", cvss: 2.6 },
    ]
    
    for (const header of requiredHeaders) {
      if (!headers.get(header.name)) {
        const remediation = getRemediation(header.id)
        findings.push({
          id: `WEB-${header.id}-${Date.now()}`,
          title: header.title,
          severity: severityFromCVSS(header.cvss),
          cvss: header.cvss,
          owasp: getOWASPCategory(header.id),
          type: "Web",
          description: `The ${header.name} security header is not set on this website.`,
          impact: remediation.description,
          location: url,
          evidence: `Header "${header.name}" not found in response`,
          remediation,
          detectedAt: new Date().toISOString(),
          status: "open",
        })
      }
    }
    
    // Check for server disclosure
    const serverHeader = headers.get("server")
    const poweredBy = headers.get("x-powered-by")
    
    if (serverHeader && /\d/.test(serverHeader)) {
      findings.push({
        id: `WEB-server-disclosure-${Date.now()}`,
        title: "Server Version Disclosed",
        severity: "low",
        cvss: 2.6,
        owasp: getOWASPCategory("server-disclosure"),
        type: "Web",
        description: "The server reveals version information in response headers.",
        impact: "Attackers can search for version-specific exploits.",
        location: url,
        evidence: `Server: ${serverHeader}`,
        remediation: getRemediation("server-disclosure"),
        detectedAt: new Date().toISOString(),
        status: "open",
      })
    }
    
    if (poweredBy) {
      findings.push({
        id: `WEB-x-powered-by-${Date.now()}`,
        title: "X-Powered-By Header Exposes Technology",
        severity: "low",
        cvss: 2.6,
        owasp: getOWASPCategory("server-disclosure"),
        type: "Web",
        description: "The X-Powered-By header reveals the server technology stack.",
        impact: "Helps attackers identify potential vulnerabilities.",
        location: url,
        evidence: `X-Powered-By: ${poweredBy}`,
        remediation: getRemediation("server-disclosure"),
        detectedAt: new Date().toISOString(),
        status: "open",
      })
    }
    
  } catch (error) {
    // Connection failed - can't check headers
  }
  
  return findings
}

/* ── TLS/SSL Check ──────────────────────────────────────────── */
async function checkTLS(url: string): Promise<Finding[]> {
  const findings: Finding[] = []
  
  try {
    const urlObj = new URL(url)
    
    // Check if HTTPS
    if (urlObj.protocol !== "https:") {
      findings.push({
        id: `WEB-no-https-${Date.now()}`,
        title: "Site Not Using HTTPS",
        severity: "high",
        cvss: 7.5,
        owasp: getOWASPCategory("weak-tls"),
        type: "Web",
        description: "The website is served over unencrypted HTTP.",
        impact: "All traffic can be intercepted and modified by attackers.",
        location: url,
        remediation: getRemediation("weak-tls"),
        detectedAt: new Date().toISOString(),
        status: "open",
      })
    }
    
  } catch (error) {
    // Invalid URL
  }
  
  return findings
}

/* ── Sensitive File Check ───────────────────────────────────── */
async function checkSensitiveFiles(baseUrl: string): Promise<Finding[]> {
  const findings: Finding[] = []
  
  const sensitiveFiles = [
    { path: "/.env", id: "exposed-env", title: "Exposed .env File", cvss: 9.8 },
    { path: "/.git/config", id: "exposed-git", title: "Exposed .git Directory", cvss: 9.1 },
    { path: "/phpinfo.php", id: "exposed-phpinfo", title: "Exposed phpinfo()", cvss: 5.3 },
    { path: "/wp-config.php", id: "exposed-wp-config", title: "Exposed WordPress Config", cvss: 9.8 },
    { path: "/actuator/health", id: "exposed-actuator", title: "Exposed Spring Boot Actuator", cvss: 5.3 },
    { path: "/api/swagger.json", id: "exposed-swagger", title: "Exposed Swagger API Docs", cvss: 3.7 },
    { path: "/.htaccess", id: "exposed-htaccess", title: "Exposed .htaccess File", cvss: 5.3 },
    { path: "/web.config", id: "exposed-webconfig", title: "Exposed web.config", cvss: 5.3 },
    { path: "/debug", id: "exposed-debug", title: "Exposed Debug Endpoint", cvss: 7.5 },
    { path: "/.well-known/security.txt", id: "has-security-txt", title: "Security.txt Present", cvss: 0 }, // Good thing!
  ]
  
  for (const file of sensitiveFiles) {
    try {
      const testUrl = new URL(file.path, baseUrl).toString()
      const response = await fetchWithTimeout(testUrl, { method: "HEAD" })
      
      if (file.id === "has-security-txt") {
        // This is a positive check - we want this to exist
        if (response.status !== 200) {
          findings.push({
            id: `WEB-missing-security-txt-${Date.now()}`,
            title: "Missing security.txt",
            severity: "info",
            cvss: 0,
            owasp: getOWASPCategory("missing-security-txt"),
            type: "Config",
            description: "No security.txt file found at /.well-known/security.txt",
            impact: "Security researchers may not know how to report vulnerabilities.",
            location: testUrl,
            remediation: getRemediation("missing-security-txt"),
            detectedAt: new Date().toISOString(),
            status: "open",
          })
        }
        continue
      }
      
      if (response.status === 200) {
        findings.push({
          id: `WEB-${file.id}-${Date.now()}`,
          title: file.title,
          severity: severityFromCVSS(file.cvss),
          cvss: file.cvss,
          owasp: getOWASPCategory(file.id),
          type: "Web",
          description: `Sensitive file ${file.path} is publicly accessible.`,
          impact: "May expose secrets, source code, or configuration details.",
          location: testUrl,
          evidence: `HTTP ${response.status} returned for ${file.path}`,
          remediation: getRemediation(file.id),
          detectedAt: new Date().toISOString(),
          status: "open",
        })
      }
    } catch (error) {
      // File not accessible - good!
    }
  }
  
  return findings
}

/* ── CORS Check ─────────────────────────────────────────────── */
async function checkCORS(url: string): Promise<Finding[]> {
  const findings: Finding[] = []
  
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        "Origin": "https://evil-attacker.com",
      },
    })
    
    const allowOrigin = response.headers.get("access-control-allow-origin")
    const allowCredentials = response.headers.get("access-control-allow-credentials")
    
    if (allowOrigin === "*") {
      findings.push({
        id: `WEB-cors-wildcard-${Date.now()}`,
        title: "CORS Wildcard (*) Allows Any Origin",
        severity: "high",
        cvss: 7.5,
        owasp: getOWASPCategory("cors-wildcard"),
        type: "Web",
        description: "The server allows requests from any origin via Access-Control-Allow-Origin: *",
        impact: "Any website can make authenticated requests to this API if credentials are included.",
        location: url,
        evidence: "Access-Control-Allow-Origin: *",
        remediation: getRemediation("cors-wildcard"),
        detectedAt: new Date().toISOString(),
        status: "open",
      })
    }
    
    if (allowOrigin === "https://evil-attacker.com" && allowCredentials === "true") {
      findings.push({
        id: `WEB-cors-reflect-${Date.now()}`,
        title: "CORS Reflects Arbitrary Origin with Credentials",
        severity: "critical",
        cvss: 9.1,
        owasp: getOWASPCategory("cors-wildcard"),
        type: "Web",
        description: "The server reflects any Origin header and allows credentials.",
        impact: "Complete bypass of same-origin policy - attackers can steal user data.",
        location: url,
        evidence: `Access-Control-Allow-Origin reflects attacker origin with credentials`,
        remediation: getRemediation("cors-wildcard"),
        detectedAt: new Date().toISOString(),
        status: "open",
      })
    }
    
  } catch (error) {
    // CORS check failed
  }
  
  return findings
}

/* ── Tech Stack Detection ───────────────────────────────────── */
interface DetectedStack {
  framework: string | null
  server: string | null
  language: string | null
  cms: string | null
  cdn: string | null
}

async function detectTechStack(url: string): Promise<{ stack: DetectedStack; findings: Finding[] }> {
  const stack: DetectedStack = {
    framework: null,
    server: null,
    language: null,
    cms: null,
    cdn: null,
  }
  const findings: Finding[] = []
  
  try {
    const response = await fetchWithTimeout(url)
    const headers = response.headers
    const html = await response.text()
    
    // Detect from headers
    const server = headers.get("server")
    const poweredBy = headers.get("x-powered-by")
    const via = headers.get("via")
    
    if (server) {
      stack.server = server
      if (server.toLowerCase().includes("nginx")) stack.server = "nginx"
      if (server.toLowerCase().includes("apache")) stack.server = "Apache"
      if (server.toLowerCase().includes("cloudflare")) { stack.server = "Cloudflare"; stack.cdn = "Cloudflare" }
    }
    
    if (poweredBy) {
      if (poweredBy.toLowerCase().includes("express")) stack.framework = "Express.js"
      if (poweredBy.toLowerCase().includes("php")) stack.language = "PHP"
      if (poweredBy.toLowerCase().includes("asp.net")) stack.framework = "ASP.NET"
      if (poweredBy.toLowerCase().includes("next")) stack.framework = "Next.js"
    }
    
    // Detect CDN
    if (headers.get("x-vercel-id")) stack.cdn = "Vercel"
    if (headers.get("x-amz-cf-id")) stack.cdn = "CloudFront"
    if (headers.get("cf-ray")) stack.cdn = "Cloudflare"
    if (via?.includes("cloudfront")) stack.cdn = "CloudFront"
    
    // Detect from HTML content
    if (html.includes("__NEXT_DATA__") || html.includes("/_next/")) stack.framework = "Next.js"
    if (html.includes("__NUXT__") || html.includes("/_nuxt/")) stack.framework = "Nuxt.js"
    if (html.includes("ng-app") || html.includes("ng-controller")) stack.framework = "Angular"
    if (html.includes("data-reactroot") || html.includes("__REACT_")) stack.framework = "React"
    if (html.includes("data-v-") || html.includes("Vue.js")) stack.framework = "Vue.js"
    if (html.includes("wp-content") || html.includes("wp-includes")) { stack.cms = "WordPress"; stack.language = "PHP" }
    if (html.includes("drupal") || html.includes("Drupal.settings")) { stack.cms = "Drupal"; stack.language = "PHP" }
    if (html.includes("joomla") || html.includes("Joomla!")) { stack.cms = "Joomla"; stack.language = "PHP" }
    if (html.includes("shopify") || html.includes("myshopify.com")) stack.cms = "Shopify"
    if (html.includes("wix.com") || html.includes("wixstatic")) stack.cms = "Wix"
    if (html.includes("squarespace")) stack.cms = "Squarespace"
    
    // Framework-specific vulnerability hints
    if (stack.cms === "WordPress") {
      // Check for outdated WordPress version
      const wpVersionMatch = html.match(/WordPress\s*([\d.]+)/i) || html.match(/ver=([\d.]+).*wp-/)
      if (wpVersionMatch) {
        const version = wpVersionMatch[1]
        if (version && parseFloat(version) < 6.0) {
          findings.push({
            id: `WEB-outdated-wordpress-${Date.now()}`,
            title: `Outdated WordPress Version (${version})`,
            severity: "high",
            cvss: 8.1,
            owasp: getOWASPCategory("outdated-software"),
            type: "Web",
            description: `WordPress ${version} is outdated and may contain known vulnerabilities.`,
            impact: "Known CVEs may allow remote code execution or data theft.",
            location: url,
            evidence: `Detected WordPress version: ${version}`,
            remediation: getRemediation("outdated-software"),
            detectedAt: new Date().toISOString(),
            status: "open",
          })
        }
      }
    }
    
    if (stack.framework === "Next.js") {
      // Check for exposed _next/static source maps
      try {
        const sourceMapCheck = await fetchWithTimeout(`${url}/_next/static/chunks/main.js.map`, { method: "HEAD" })
        if (sourceMapCheck.status === 200) {
          findings.push({
            id: `WEB-exposed-sourcemaps-${Date.now()}`,
            title: "Source Maps Exposed in Production",
            severity: "low",
            cvss: 3.1,
            owasp: getOWASPCategory("server-disclosure"),
            type: "Web",
            description: "JavaScript source maps are publicly accessible.",
            impact: "Attackers can reverse-engineer your client-side code.",
            location: `${url}/_next/static/chunks/main.js.map`,
            remediation: getRemediation("server-disclosure"),
            detectedAt: new Date().toISOString(),
            status: "open",
          })
        }
      } catch { /* Not exposed - good */ }
    }
    
  } catch (error) {
    // Detection failed
  }
  
  return { stack, findings }
}

/* ── Cookie Security Check ──────────────────────────────────── */
async function checkCookies(url: string): Promise<Finding[]> {
  const findings: Finding[] = []
  
  try {
    const response = await fetchWithTimeout(url)
    const setCookie = response.headers.get("set-cookie")
    
    if (setCookie) {
      const cookieParts = setCookie.toLowerCase()
      
      if (!cookieParts.includes("httponly")) {
        findings.push({
          id: `WEB-cookie-no-httponly-${Date.now()}`,
          title: "Cookie Missing HttpOnly Flag",
          severity: "medium",
          cvss: 5.4,
          owasp: getOWASPCategory("insecure-cookie"),
          type: "Web",
          description: "Session cookie is accessible via JavaScript.",
          impact: "XSS attacks can steal session cookies.",
          location: url,
          evidence: `Set-Cookie header missing HttpOnly`,
          remediation: getRemediation("insecure-cookie"),
          detectedAt: new Date().toISOString(),
          status: "open",
        })
      }
      
      if (!cookieParts.includes("secure") && url.startsWith("https")) {
        findings.push({
          id: `WEB-cookie-no-secure-${Date.now()}`,
          title: "Cookie Missing Secure Flag",
          severity: "medium",
          cvss: 5.4,
          owasp: getOWASPCategory("insecure-cookie"),
          type: "Web",
          description: "Cookie can be transmitted over unencrypted HTTP.",
          impact: "Session can be hijacked via network interception.",
          location: url,
          evidence: `Set-Cookie header missing Secure flag`,
          remediation: getRemediation("insecure-cookie"),
          detectedAt: new Date().toISOString(),
          status: "open",
        })
      }
      
      if (!cookieParts.includes("samesite")) {
        findings.push({
          id: `WEB-cookie-no-samesite-${Date.now()}`,
          title: "Cookie Missing SameSite Flag",
          severity: "low",
          cvss: 3.7,
          owasp: getOWASPCategory("insecure-cookie"),
          type: "Web",
          description: "Cookie vulnerable to cross-site request forgery.",
          impact: "CSRF attacks may be possible.",
          location: url,
          evidence: `Set-Cookie header missing SameSite attribute`,
          remediation: getRemediation("insecure-cookie"),
          detectedAt: new Date().toISOString(),
          status: "open",
        })
      }
    }
    
  } catch (error) {
    // Cookie check failed
  }
  
  return findings
}

/* ── Main Scanner ───────────────────────────────────────────── */
export async function scanWebsite(url: string, options: ScanOptions = {}): Promise<ScanResult> {
  const startTime = Date.now()
  const findings: Finding[] = []
  
  // Normalize URL
  let targetUrl = url
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = `https://${targetUrl}`
  }
  
  try {
    // Run all checks in parallel
    const results = await Promise.allSettled([
      checkSecurityHeaders(targetUrl),
      checkTLS(targetUrl),
      checkSensitiveFiles(targetUrl),
      checkCORS(targetUrl),
      checkCookies(targetUrl),
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
      id: `scan-web-${Date.now()}`,
      target: targetUrl,
      scanType: "website",
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      duration: Date.now() - startTime,
      status: "completed",
      findings: filteredFindings,
      summary,
    }
    
  } catch (error) {
    return {
      id: `scan-web-${Date.now()}`,
      target: targetUrl,
      scanType: "website",
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
