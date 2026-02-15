import { describe, it, expect } from "vitest"
import {
  stats,
  recentScans,
  assets,
  activeScans,
  vulnerabilities,
  agents,
  blockchainVulns,
  gasOptimizations,
  exampleContracts,
  securityTrendData,
  runtimeMetrics,
  shadowAIDetections,
} from "@/lib/mock-data"

describe("mock-data exports", () => {
  it("stats contains all required fields with positive values", () => {
    expect(stats.totalScans).toBeGreaterThan(0)
    expect(stats.vulnsFixed).toBeGreaterThan(0)
    expect(stats.aiFixRate).toBeGreaterThanOrEqual(0)
    expect(stats.aiFixRate).toBeLessThanOrEqual(100)
    expect(stats.assetsScanned).toBeGreaterThan(0)
  })

  it("recentScans all have valid status values", () => {
    const validStatuses = ["completed", "running", "failed", "queued"]
    recentScans.forEach((scan) => {
      expect(validStatuses).toContain(scan.status)
      expect(scan.id).toBeTruthy()
      expect(scan.asset).toBeTruthy()
    })
  })

  it("assets all have valid types and security scores", () => {
    const validTypes = ["Repo", "Website", "WebApp", "SmartContract"]
    assets.forEach((asset) => {
      expect(validTypes).toContain(asset.type)
      expect(asset.securityScore).toBeGreaterThanOrEqual(0)
      expect(asset.securityScore).toBeLessThanOrEqual(100)
    })
  })

  it("activeScans all have progress between 0 and 100", () => {
    activeScans.forEach((scan) => {
      expect(scan.progress).toBeGreaterThanOrEqual(0)
      expect(scan.progress).toBeLessThanOrEqual(100)
      expect(scan.logs.length).toBeGreaterThan(0)
    })
  })

  it("vulnerabilities all have valid severity and CVSS scores", () => {
    const validSeverities = ["critical", "high", "medium", "low"]
    vulnerabilities.forEach((vuln) => {
      expect(validSeverities).toContain(vuln.severity)
      expect(vuln.cvss).toBeGreaterThanOrEqual(0)
      expect(vuln.cvss).toBeLessThanOrEqual(10)
    })
  })

  it("agents all have valid colorKey values", () => {
    const validKeys = ["primary", "destructive", "success", "warning"]
    agents.forEach((agent) => {
      expect(validKeys).toContain(agent.colorKey)
      expect(["active", "idle", "thinking"]).toContain(agent.status)
    })
  })

  it("blockchainVulns have counts greater than 0", () => {
    blockchainVulns.forEach((vuln) => {
      expect(vuln.count).toBeGreaterThan(0)
    })
  })

  it("gasOptimizations show savings", () => {
    gasOptimizations.forEach((opt) => {
      expect(opt.optimizedGas).toBeLessThan(opt.currentGas)
      expect(opt.savings).toMatch(/%$/)
    })
  })

  it("exampleContracts have valid Ethereum addresses", () => {
    exampleContracts.forEach((c) => {
      expect(c.address).toMatch(/^0x[a-fA-F0-9]+$/)
    })
  })

  it("securityTrendData has 7 months of data", () => {
    expect(securityTrendData).toHaveLength(7)
    securityTrendData.forEach((d) => {
      expect(d.month).toBeTruthy()
      expect(d.fixed).toBeGreaterThan(0)
    })
  })

  it("runtimeMetrics has valid entries", () => {
    runtimeMetrics.forEach((m) => {
      expect(m.time).toBeTruthy()
      expect(m.apiCalls).toBeGreaterThanOrEqual(0)
      expect(m.memory).toBeGreaterThanOrEqual(0)
    })
  })

  it("shadowAIDetections have confidence between 0 and 100", () => {
    shadowAIDetections.forEach((d) => {
      expect(d.confidence).toBeGreaterThanOrEqual(0)
      expect(d.confidence).toBeLessThanOrEqual(100)
    })
  })
})
