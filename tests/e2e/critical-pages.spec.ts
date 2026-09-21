import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test, expect, type Page } from 'playwright/test'

const require = createRequire(import.meta.url)
const axeSourcePath = require.resolve('axe-core/axe.min.js')

async function assertNoPageErrors(page: Page) {
  const consoleErrors: string[] = []
  const requestFailures: string[] = []

  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', request => {
    requestFailures.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText ?? 'request failed'}`)
  })

  return {
    assertClean: () => {
      expect(consoleErrors, 'browser console errors').toEqual([])
      expect(requestFailures, 'failed network requests').toEqual([])
    },
  }
}

async function runAccessibilityCheck(page: Page) {
  await page.addScriptTag({ content: await readFile(axeSourcePath, 'utf8') })
  return page.evaluate(async () => {
    const axe = (window as unknown as {
      axe: {
        run: () => Promise<{
          violations: Array<{
            id: string
            impact?: string | null
            help: string
            nodes: Array<{ target: string[] }>
          }>
        }>
      }
    }).axe
    return axe.run()
  })
}

function accessibilitySummary(
  violations: Array<{
    id: string
    impact?: string | null
    help: string
    nodes: Array<{ target: string[] }>
  }>,
) {
  return violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map(node => node.target.join(' ')),
  }))
}

test.describe('public landing page', () => {
  test('keeps the hero responsive without overflow or cramped columns', async ({ page }) => {
    await page.goto('/')

    const grid = page.locator('.lead-hero-grid')
    const heading = page.getByRole('heading', { level: 1 })

    await expect(grid).toBeVisible()
    await expect(heading).toBeVisible()

    const desktopLayout = await page.evaluate(() => {
      const grid = document.querySelector('.lead-hero-grid')
      if (!grid) return null
      const styles = getComputedStyle(grid)
      return {
        columns: styles.gridTemplateColumns,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      }
    })

    expect(desktopLayout).not.toBeNull()
    expect(desktopLayout?.columns.split(' ').length).toBe(2)
    expect(desktopLayout?.overflow).toBe(false)

    await page.setViewportSize({ width: 900, height: 1000 })

    const tabletLayout = await page.evaluate(() => {
      const grid = document.querySelector('.lead-hero-grid')
      if (!grid) return null
      const styles = getComputedStyle(grid)
      return {
        columns: styles.gridTemplateColumns,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      }
    })

    expect(tabletLayout).not.toBeNull()
    expect(tabletLayout?.columns.split(' ').length).toBe(1)
    expect(tabletLayout?.overflow).toBe(false)

    await page.setViewportSize({ width: 390, height: 844 })

    const mobileLayout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      gridColumns: getComputedStyle(document.querySelector('.lead-hero-grid')!).gridTemplateColumns,
    }))

    expect(mobileLayout.overflow).toBe(false)
    expect(mobileLayout.gridColumns.split(' ').length).toBe(1)
  })

  test('renders the core product narrative and has no accessibility violations', async ({ page }) => {
    const errors = await assertNoPageErrors(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: /start|audit|get started/i }).first()).toBeVisible()

    const results = await runAccessibilityCheck(page)
    const violations = accessibilitySummary(results.violations)
    expect(violations, 'accessibility violations').toEqual([])
    errors.assertClean()

    await page.screenshot({
      path: `test-results/landing-${test.info().project.name}.png`,
      fullPage: true,
    })
  })
})

test.describe('onboarding and audit workspace', () => {
  test('opens onboarding and preserves the audit entry point', async ({ page }) => {
    const errors = await assertNoPageErrors(page)
    await page.goto('/app/audits/new')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/website/i)
    await expect(page.getByRole('button', { name: /continue to audit/i })).toBeVisible()
    errors.assertClean()
  })

  test('renders the deterministic audit list without runtime errors', async ({ page }) => {
    const errors = await assertNoPageErrors(page)
    await page.goto('/app/audits')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link').filter({ hasText: /audit/i }).first()).toBeVisible()
    errors.assertClean()
  })
})
