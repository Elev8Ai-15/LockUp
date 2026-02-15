import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { AgentSwarm } from "@/components/dashboard/agent-swarm"

describe("AgentSwarm", () => {
  it("renders the swarm header", () => {
    render(<AgentSwarm />)
    expect(screen.getByText("Live Security Swarm")).toBeInTheDocument()
    expect(screen.getByText("4 agents active")).toBeInTheDocument()
  })

  it("renders all four agent names", () => {
    render(<AgentSwarm />)
    expect(screen.getByText("Triage Agent")).toBeInTheDocument()
    expect(screen.getByText("Exploit Agent")).toBeInTheDocument()
    expect(screen.getByText("Fix Agent")).toBeInTheDocument()
    expect(screen.getByText("Validator Agent")).toBeInTheDocument()
  })

  it("renders current task descriptions", () => {
    render(<AgentSwarm />)
    expect(screen.getByText("Classifying XSS on yoursite.com...")).toBeInTheDocument()
    expect(screen.getByText("Generating PoC for reentrancy...")).toBeInTheDocument()
    expect(screen.getByText("Patching XSS on website...")).toBeInTheDocument()
    expect(screen.getByText("Awaiting fix from Fix Agent...")).toBeInTheDocument()
  })
})
