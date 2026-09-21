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
  test('keeps the hero responsive without overflow or cramped columns', async ({ browser }) => {
    const viewports = [
      { width: 1440, height: 1000, columns: 2 },
      { width: 899, height: 1000, columns: 1 },
      { width: 389, height: 844, columns: 1 },
    ]

    const baseURL = test.info().project.use.baseURL as string

    for (const viewport of viewports) {
      const context = await browser.newContext({ baseURL, viewport: { width: viewport.width, height: viewport.height } })
      const page = await context.newPage()

      try {
        await page.goto('/')

        const grid = page.locator('.lead-hero-grid')
        const heading = page.getByRole('heading', { level: 1 })

        await expect(grid).toBeVisible()
        await expect(heading).toBeVisible()

        const layout = await page.evaluate(() => {
          const grid = document.querySelector('.lead-hero-grid')
          if (!grid) return null
          return {
            viewportWidth: window.innerWidth,
            columns: getComputedStyle(grid).gridTemplateColumns,
            overflow: document.documentElement.scrollWidth > window.innerWidth,
          }
        })

        expect(layout).not.toBeNull()
        expect(layout?.viewportWidth).toBe(viewport.width)
        expect(layout?.columns.split(' ').length).toBe(viewport.columns)
        expect(layout?.overflow).toBe(false)
      } finally {
        await context.close()
      }
    }
  })

  test('uses the authoritative sans-serif family on public and application routes', async ({ page }) => {
    for (const route of ['/', '/app/audits']) {
      await page.goto(route)

      const typography = await page.evaluate(() => {
        const bodyFamily = getComputedStyle(document.body).fontFamily
        const textElements = Array.from(document.querySelectorAll('body *')).filter(element => {
          const style = getComputedStyle(element)
          return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0 && element.textContent?.trim()
        })

        return {
          bodyFamily,
          families: [...new Set(textElements.map(element => getComputedStyle(element).fontFamily))],
        }
      })

      expect(typography.bodyFamily).toContain('sans-serif')
      const genericFamilies = typography.families.flatMap(family => family.split(',').map(token => token.trim().replace(/^["']|["']$/g, '').toLowerCase()))
      expect(genericFamilies).not.toContain('serif')
      expect(genericFamilies).not.toContain('monospace')
      expect(genericFamilies).not.toContain('cursive')
      expect(genericFamilies).not.toContain('fantasy')
    }
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
