import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test, expect, type Page } from '@playwright/test'

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
    const axe = (window as unknown as { axe: { run: () => Promise<{ violations: unknown[] }> } }).axe
    return axe.run()
  })
}

test.describe('public landing page', () => {
  test('renders the core product narrative and has no accessibility violations', async ({ page }) => {
    const errors = await assertNoPageErrors(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: /start|audit|get started/i }).first()).toBeVisible()

    const results = await runAccessibilityCheck(page)
    expect(results.violations).toEqual([])
    errors.assertClean()

    await page.screenshot({ path: 'test-results/landing-desktop.png', fullPage: true })
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
