/* ════════════════════════════════════════════════════════════
   API Security Scanner - GraphQL, REST, OpenAPI checks
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

/* ── GraphQL Introspection Check ────────────────────────────── */
async function checkGraphQLIntrospection(baseUrl: string): Promise<Finding[]> {
  const findings: Finding[] = []
  
  const graphqlEndpoints = [
    "/graphql",
    "/api/graphql",
    "/v1/graphql",
    "/query",
    "/gql",
  ]
  
  const introspectionQuery = JSON.stringify({
    query: `query IntrospectionQuery { __schema { queryType { name } mutationType { name } types { name } } }`,
  })
  
  for (const endpoint of graphqlEndpoints) {
    try {
      const url = new URL(endpoint, baseUrl).toString()
      
      const response = await fetchWithTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: introspectionQuery,
      })
      
      if (response.status === 200) {
        const data = await response.json()
        
        if (data.data?.__schema) {
          const typeCount = data.data.__schema.types?.length || 0
          
          findings.push({
            id: `API-graphql-introspection-${Date.now()}`,
            title: "GraphQL Introspection Enabled",
            severity: "medium",
            cvss: 5.3,
            owasp: getOWASPCategory("graphql-introspection"),
            type: "API",
            description: `GraphQL introspection is enabled at ${endpoint}, exposing the full API schema.`,
            impact: "Attackers can discover all queries, mutations, and types - making it easier to find attack vectors.",
            location: url,
            evidence: `Schema exposed with ${typeCount} types`,
            remediation: getRemediation("graphql-introspection"),
            detectedAt: new Date().toISOString(),
            status: "open",
          })
          
          break // Found GraphQL, stop checking other endpoints
        }
      }
    } catch {
      // Endpoint doesn't exist or error
    }
  }
  
  return findings
}

/* ── OpenAPI/Swagger Exposure Check ─────────────────────────── */
async function checkSwaggerExposure(baseUrl: string): Promise<Finding[]> {
  const findings: Finding[] = []
  
  const swaggerPaths = [
    "/swagger.json",
    "/swagger.yaml",
    "/openapi.json",
    "/openapi.yaml",
    "/api-docs",
    "/api/docs",
    "/api/swagger",
    "/swagger-ui",
    "/swagger-ui.html",
    "/v1/api-docs",
    "/v2/api-docs",
    "/v3/api-docs",
    "/docs",
    "/redoc",
  ]
  
  for (const path of swaggerPaths) {
    try {
      const url = new URL(path, baseUrl).toString()
      const response = await fetchWithTimeout(url, { method: "GET" })
      
      if (response.status === 200) {
        const contentType = response.headers.get("content-type") || ""
        const text = await response.text()
        
        // Check if it's actually API documentation
        const isSwagger = text.includes("swagger") || 
                          text.includes("openapi") || 
                          text.includes("paths") ||
                          contentType.includes("json") ||
                          contentType.includes("yaml")
        
        if (isSwagger && text.length > 100) {
          findings.push({
            id: `API-swagger-exposed-${Date.now()}`,
            title: "API Documentation Publicly Accessible",
            severity: "low",
            cvss: 3.7,
            owasp: getOWASPCategory("exposed-swagger"),
            type: "API",
            description: `OpenAPI/Swagger documentation is publicly accessible at ${path}.`,
            impact: "API documentation reveals all endpoints, parameters, and sometimes authentication details.",
            location: url,
            evidence: `API docs found at ${path} (${text.length} bytes)`,
            remediation: {
              title: "Protect API Documentation",
              description: "Consider requiring authentication to access API documentation in production.",
              code: `// Protect swagger endpoint
if (process.env.NODE_ENV === 'production') {
  app.use('/api-docs', requireAuth);
}`,
              reference: "https://swagger.io/docs/specification/authentication/",
            },
            detectedAt: new Date().toISOString(),
            status: "open",
          })
          
          break // Found swagger, stop checking
        }
      }
    } catch {
      // Path doesn't exist
    }
  }
  
  return findings
}

/* ── Debug Endpoints Check ──────────────────────────────────── */
async function checkDebugEndpoints(baseUrl: string): Promise<Finding[]> {
  const findings: Finding[] = []
  
  const debugPaths = [
    { path: "/debug", name: "Debug Endpoint" },
    { path: "/debug/vars", name: "Debug Variables" },
    { path: "/debug/pprof", name: "Go pprof" },
    { path: "/_debug", name: "Debug Endpoint" },
    { path: "/test", name: "Test Endpoint" },
    { path: "/actuator", name: "Spring Boot Actuator" },
    { path: "/actuator/env", name: "Spring Boot Environment" },
    { path: "/actuator/health", name: "Spring Boot Health" },
    { path: "/actuator/mappings", name: "Spring Boot Mappings" },
    { path: "/metrics", name: "Metrics Endpoint" },
    { path: "/health", name: "Health Check" },
    { path: "/status", name: "Status Endpoint" },
    { path: "/__debug", name: "Debug Endpoint" },
    { path: "/phpinfo.php", name: "PHP Info" },
    { path: "/server-status", name: "Apache Status" },
    { path: "/nginx_status", name: "Nginx Status" },
  ]
  
  for (const debug of debugPaths) {
    try {
      const url = new URL(debug.path, baseUrl).toString()
      const response = await fetchWithTimeout(url)
      
      if (response.status === 200) {
        const text = await response.text()
        
        // Check if it contains sensitive info
        const hasSensitiveInfo = /password|secret|key|token|database|env|config/i.test(text)
        const hasStructuredData = text.includes("{") || text.includes("<")
        
        if (hasSensitiveInfo && hasStructuredData && text.length > 50) {
          findings.push({
            id: `API-debug-exposed-${debug.path.replace(/\//g, "-")}-${Date.now()}`,
            title: `${debug.name} Exposes Sensitive Information`,
            severity: "high",
            cvss: 7.5,
            owasp: getOWASPCategory("debug-enabled"),
            type: "API",
            description: `The ${debug.path} endpoint is accessible and may expose sensitive information.`,
            impact: "Debug endpoints can leak environment variables, database credentials, and internal state.",
            location: url,
            evidence: `Endpoint returns ${text.length} bytes with potential sensitive data`,
            remediation: getRemediation("exposed-env"),
            detectedAt: new Date().toISOString(),
            status: "open",
          })
        } else if (hasStructuredData && text.length > 100) {
          findings.push({
            id: `API-debug-info-${debug.path.replace(/\//g, "-")}-${Date.now()}`,
            title: `${debug.name} Accessible`,
            severity: "info",
            cvss: 0,
            owasp: getOWASPCategory("debug-enabled"),
            type: "API",
            description: `The ${debug.path} endpoint is publicly accessible.`,
            impact: "May reveal internal application state or version information.",
            location: url,
            evidence: `Endpoint accessible at ${debug.path}`,
            remediation: {
              title: "Protect Debug Endpoints",
              description: "Debug endpoints should be disabled or protected in production.",
              code: `// Disable in production
if (process.env.NODE_ENV !== 'production') {
  app.get('${debug.path}', debugHandler);
}`,
            },
            detectedAt: new Date().toISOString(),
            status: "open",
          })
        }
      }
    } catch {
      // Endpoint not accessible
    }
  }
  
  return findings
}

/* ── Rate Limiting Check ────────────────────────────────────── */
async function checkRateLimiting(baseUrl: string): Promise<Finding[]> {
  const findings: Finding[] = []
  
  try {
    const response = await fetchWithTimeout(baseUrl)
    const headers = response.headers
    
    const rateLimitHeaders = [
      "x-ratelimit-limit",
      "x-ratelimit-remaining",
      "x-ratelimit-reset",
      "ratelimit-limit",
      "ratelimit-remaining",
      "retry-after",
    ]
    
    const hasRateLimit = rateLimitHeaders.some(h => headers.get(h))
    
    if (!hasRateLimit) {
      findings.push({
        id: `API-no-rate-limit-${Date.now()}`,
        title: "No Rate Limiting Headers Detected",
        severity: "medium",
        cvss: 5.3,
        owasp: getOWASPCategory("missing-rate-limit"),
        type: "API",
        description: "The API does not include rate limiting headers in responses.",
        impact: "Without rate limiting, APIs are vulnerable to brute force attacks and DoS.",
        location: baseUrl,
        evidence: "No X-RateLimit-* or RateLimit-* headers found",
        remediation: getRemediation("missing-rate-limit"),
        detectedAt: new Date().toISOString(),
        status: "open",
      })
    }
    
  } catch {
    // Request failed
  }
  
  return findings
}

/* ── JWT Algorithm None Check ───────────────────────────────── */
async function checkJWTVulnerabilities(baseUrl: string): Promise<Finding[]> {
  const findings: Finding[] = []
  
  // Try common auth endpoints with alg:none JWT
  const authEndpoints = [
    "/api/auth/verify",
    "/api/user",
    "/api/me",
    "/api/v1/user",
    "/auth/verify",
    "/verify",
  ]
  
  // Create an alg:none JWT token
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url")
  const payload = Buffer.from(JSON.stringify({ sub: "1", admin: true, exp: Date.now() + 3600000 })).toString("base64url")
  const noneToken = `${header}.${payload}.`
  
  for (const endpoint of authEndpoints) {
    try {
      const url = new URL(endpoint, baseUrl).toString()
      
      const response = await fetchWithTimeout(url, {
        headers: {
          "Authorization": `Bearer ${noneToken}`,
        },
      })
      
      // If we get a 200 with an alg:none token, that's very bad
      if (response.status === 200) {
        const text = await response.text()
        
        // Check if it looks like we got authenticated
        if (text.includes("user") || text.includes("admin") || text.includes("id")) {
          findings.push({
            id: `API-jwt-none-${Date.now()}`,
            title: "JWT Algorithm None Vulnerability",
            severity: "critical",
            cvss: 9.8,
            owasp: getOWASPCategory("jwt-none"),
            type: "API",
            description: "The API accepts JWT tokens with alg:none, allowing signature bypass.",
            impact: "Attackers can forge valid JWT tokens without knowing the secret key.",
            location: url,
            evidence: `Endpoint ${endpoint} accepted alg:none JWT`,
            remediation: getRemediation("jwt-none"),
            detectedAt: new Date().toISOString(),
            status: "open",
          })
          
          break
        }
      }
      
    } catch {
      // Endpoint error
    }
  }
  
  return findings
}

/* ── Main Scanner ───────────────────────────────────────────── */
export async function scanAPI(url: string, options: ScanOptions = {}): Promise<ScanResult> {
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
      checkGraphQLIntrospection(targetUrl),
      checkSwaggerExposure(targetUrl),
      checkDebugEndpoints(targetUrl),
      checkRateLimiting(targetUrl),
      checkJWTVulnerabilities(targetUrl),
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
      id: `scan-api-${Date.now()}`,
      target: targetUrl,
      scanType: "api",
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      duration: Date.now() - startTime,
      status: "completed",
      findings: filteredFindings,
      summary,
    }
    
  } catch (error) {
    return {
      id: `scan-api-${Date.now()}`,
      target: targetUrl,
      scanType: "api",
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
