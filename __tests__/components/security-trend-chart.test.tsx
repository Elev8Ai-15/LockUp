import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SecurityTrendChart } from "@/components/dashboard/security-trend-chart"

describe("SecurityTrendChart", () => {
  it("renders the chart title and subtitle", () => {
    render(<SecurityTrendChart />)
    expect(screen.getByText("Vulnerability Reduction Trend")).toBeInTheDocument()
    expect(screen.getByText("Across code, web, apps, and blockchain")).toBeInTheDocument()
  })

  it("renders the chart container", () => {
    render(<SecurityTrendChart />)
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument()
  })
})
