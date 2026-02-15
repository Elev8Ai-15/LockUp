import { test, expect } from "@playwright/test"

test.describe("App Navigation", () => {
  test("should load the dashboard", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/LockUp/)
    await expect(page.getByText("Security Overview")).toBeVisible()
  })

  test("should navigate to all sidebar routes", async ({ page }) => {
    const routes = [
      { path: "/assets", heading: "Asset Inventory" },
      { path: "/scans", heading: "Active Scans" },
      { path: "/reports", heading: "Vulnerability Reports" },
      { path: "/agents", heading: "Security Agents" },
      { path: "/blockchain", heading: "Blockchain Security" },
      { path: "/runtime", heading: "Runtime Monitoring" },
      { path: "/settings", heading: "Settings" },
    ]

    for (const route of routes) {
      await page.goto(route.path)
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible()
    }
  })

  test("should show 404 for unknown routes", async ({ page }) => {
    await page.goto("/nonexistent-page")
    await expect(page.getByText("Page Not Found")).toBeVisible()
  })
})
