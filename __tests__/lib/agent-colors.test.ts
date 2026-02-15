import { describe, it, expect } from "vitest"
import { agentTextColor, agentBgColor } from "@/lib/agent-colors"
import type { AgentColorKey } from "@/lib/mock-data"

describe("agent-colors", () => {
  const keys: AgentColorKey[] = ["primary", "destructive", "success", "warning"]

  it("agentTextColor maps all keys to Tailwind text- classes", () => {
    keys.forEach((key) => {
      expect(agentTextColor[key]).toBeDefined()
      expect(agentTextColor[key]).toMatch(/^text-/)
    })
  })

  it("agentBgColor maps all keys to Tailwind bg- classes", () => {
    keys.forEach((key) => {
      expect(agentBgColor[key]).toBeDefined()
      expect(agentBgColor[key]).toMatch(/^bg-/)
    })
  })
})
