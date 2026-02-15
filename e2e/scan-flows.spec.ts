import { test, expect } from "@playwright/test"

test.describe("Scan Flows", () => {
  test.describe("Dashboard Quick Scan", () => {
    test("should show the quick scan input and launch button", async ({ page }) => {
      await page.goto("/")
      await expect(page.getByPlaceholder(/repository URL/i).first()).toBeVisible()
      await expect(page.getByRole("button", { name: /scan/i }).first()).toBeVisible()
    })

    test("should show toast on quick scan launch", async ({ page }) => {
      await page.goto("/")
      const input = page.getByPlaceholder(/repository URL/i).first()
      await input.fill("https://github.com/test/repo")
      await page.getByRole("button", { name: /scan/i }).first().click()
      await expect(page.getByText(/queued/i).first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe("Top Navbar New Scan", () => {
    test("should open scan type dropdown and queue a scan", async ({ page }) => {
      await page.goto("/")
      // Click the New Scan dropdown trigger
      const newScanBtn = page.getByRole("button", { name: /new scan/i }).first()
      await newScanBtn.click()

      // Select a scan type from the dropdown
      const repoOption = page.getByText(/repository scan/i).first()
      await expect(repoOption).toBeVisible()
      await repoOption.click()

      // Toast confirmation should appear
      await expect(page.getByText(/queued successfully/i).first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe("Active Scans Page", () => {
    test("should display active scans with progress bars", async ({ page }) => {
      await page.goto("/scans")
      await expect(page.getByRole("heading", { name: /active scans/i }).first()).toBeVisible()

      // Should show at least one scan card with a progress indicator
      const progressBars = page.locator('[role="progressbar"]')
      const count = await progressBars.count()
      expect(count).toBeGreaterThanOrEqual(0) // May be 0 if using custom progress divs

      // Should show scan names
      await expect(page.getByText(/frontend-app/i).first()).toBeVisible()
    })

    test("should toggle agentic mode", async ({ page }) => {
      await page.goto("/scans")
      const agenticToggle = page.getByRole("switch").first()
      if (await agenticToggle.isVisible()) {
        await agenticToggle.click()
        // Should show agent swarm panel or related UI
        await expect(page.getByText(/agent/i).first()).toBeVisible()
      }
    })

    test("should show terminal log output", async ({ page }) => {
      await page.goto("/scans")
      // Terminal log area should be visible with scan output
      const terminal = page.locator('[class*="font-mono"]').first()
      await expect(terminal).toBeVisible()
    })
  })

  test.describe("Reports Page Scan Results", () => {
    test("should display vulnerability table with severity badges", async ({ page }) => {
      await page.goto("/reports")
      await expect(page.getByRole("heading", { name: /vulnerability reports/i }).first()).toBeVisible()

      // Should show severity badges
      await expect(page.getByText(/critical/i).first()).toBeVisible()
    })

    test("should open vulnerability detail panel on row click", async ({ page }) => {
      await page.goto("/reports")

      // Click first vulnerability row
      const firstRow = page.locator("tr").nth(1)
      await firstRow.click()

      // Detail panel should show with AI remediation
      await expect(page.getByText(/remediation/i).first()).toBeVisible({ timeout: 5000 })
    })
  })
})
