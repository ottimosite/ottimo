import { expect, test, type Page, type ConsoleMessage, type Request, type Response } from '@playwright/test'
import axe from 'axe-core'

const publicRoutes = ['/', '/services', '/performance', '/seo', '/accessibility', '/ai', '/methodology', '/usability', '/technical', '/pricing', '/about', '/case-studies', '/contact']
const applicationRoutes = ['/app/dashboard', '/app/websites', '/app/audits', '/app/audits/audit-wikipedia', '/app/recommendations', '/app/reports', '/app/history', '/app/settings']
const routeName = (path: string) => path === '/' ? 'home' : path.replace(/^\//, '').replace(/\//g, '-')

type BrowserAxe = { run: (context: Document, options: { resultTypes: string[] }) => Promise<{ violations: Array<{ id: string }> }> }

async function assertRenderedPage(page: Page, path: string) {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const failedRequests: string[] = []
  const badSameOriginResponses: string[] = []
  const onConsole = (message: ConsoleMessage) => { if (message.type() === 'error') consoleErrors.push(message.text()) }
  const onPageError = (error: Error) => pageErrors.push(error.message)
  const onRequestFailed = (request: Request) => {
    if (request.failure()?.errorText === 'net::ERR_ABORTED') return
    if (new URL(request.url()).origin === new URL(page.url()).origin) {
      failedRequests.push(request.method() + ' ' + request.url() + ' — ' + (request.failure()?.errorText ?? 'unknown failure'))
    }
  }
  const onResponse = (response: Response) => {
    if (response.status() >= 400) {
      const target = new URL(response.url())
      if (target.origin === new URL(page.url()).origin) badSameOriginResponses.push(response.status() + ' ' + response.url())
    }
  }
  page.on('console', onConsole)
  page.on('pageerror', onPageError)
  page.on('requestfailed', onRequestFailed)
  page.on('response', onResponse)

  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(100)
  await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('body')).toBeVisible()
  await expect(page.locator('h1').first()).toBeVisible()
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/)
  if (!path.startsWith('/app/')) {
    const canonicalPath = new URL(path, 'http://127.0.0.1:5173').pathname
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'http://127.0.0.1:5173' + canonicalPath)
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Ottimo$/)
  }
  const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }))
  expect(overflow.width, 'Horizontal overflow on ' + path + ': ' + overflow.width + 'px > ' + overflow.viewport + 'px').toBeLessThanOrEqual(overflow.viewport)
  const axeResults = await page.evaluate(async (source) => {
    const script = document.createElement('script')
    script.textContent = source
    document.documentElement.appendChild(script)
    const runner = (window as unknown as { axe?: BrowserAxe }).axe
    if (!runner) throw new Error('axe-core failed to initialise in the rendered page')
    return runner.run(document, { resultTypes: ['violations'] })
  }, axe.source)
  expect(axeResults.violations, 'Accessibility violations on ' + path + ': ' + axeResults.violations.map(v => v.id).join(', ')).toEqual([])
  await page.screenshot({ path: 'test-results/rendered-pages/' + test.info().project.name + '/' + routeName(path) + '.png', fullPage: true, animations: 'disabled' })

  page.off('console', onConsole)
  page.off('pageerror', onPageError)
  page.off('requestfailed', onRequestFailed)
  page.off('response', onResponse)
  expect(consoleErrors, 'Console errors on ' + path).toEqual([])
  expect(pageErrors, 'Page errors on ' + path).toEqual([])
  expect(failedRequests, 'Failed same-origin requests on ' + path).toEqual([])
  expect(badSameOriginResponses, 'Same-origin HTTP errors on ' + path).toEqual([])
}

test.describe('@rendered public pages', () => {
  for (const path of publicRoutes) {
    test('renders ' + path, async ({ page }) => { await assertRenderedPage(page, path) })
  }
})

test.describe('@rendered application pages', () => {
  for (const path of applicationRoutes) {
    test('renders ' + path, async ({ page }) => { await assertRenderedPage(page, path) })
  }
})
