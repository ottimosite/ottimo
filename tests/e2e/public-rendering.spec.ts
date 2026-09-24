import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const routes = [
  { path: '/', title: 'Make your website work better. Know what to fix next. — Ottimo', heading: 'Make your website work better. Know what to fix next.' },
  { path: '/services/', title: 'Services — Ottimo', heading: 'One website. One improvement system.' },
  { path: '/example-audit/', title: 'Sample audit — Ottimo', heading: 'See the evidence before you analyse your own website.' },
  { path: '/methodology/', title: 'Methodology — Ottimo', heading: 'Measure first. Explain clearly. Improve progressively.' },
  { path: '/pricing/', title: 'Plans — Ottimo', heading: 'Start with evidence. Scale when the work demands it.' },
]

test.describe('generated public rendering', () => {
  for (const route of routes) {
    test('serves meaningful generated HTML for ' + route.path, async ({ request }) => {
      const response = await request.get(route.path)
      expect(response.ok()).toBeTruthy()
      const html = await response.text()
      expect(html).toContain('<h1>')
      expect(html).toContain(route.heading)
      expect(html).toContain('<title>' + route.title + '</title>')
      expect(html).toContain('<link rel="canonical"')
      expect(html).toMatch(/<meta name="robots" content="index,follow"\/?>/)
      expect(html).toContain('Analyse your website')
      expect(html).toContain('Sample audit')
      expect(html).toContain('Methodology')
      expect(html).toContain('Plans')
      expect(html).not.toContain('Concept lab')
      expect(html).not.toContain('href="/performance"')
      expect(html).not.toContain('href="/contact"')
    })
  }

  test('public content remains available with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    for (const route of routes) {
      await page.goto(route.path)
      await expect(page.locator('h1')).toHaveText(route.heading)
      await expect(page.getByRole('link', { name: 'Analyse your website' }).first()).toHaveAttribute('href', '/app/audits/new')
      await expect(page.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/services')
      await expect(page.getByRole('link', { name: 'Sample audit' })).toHaveAttribute('href', '/example-audit')
      await expect(page.getByRole('link', { name: 'Methodology' })).toHaveAttribute('href', '/methodology')
      await expect(page.getByRole('link', { name: 'Plans' })).toHaveAttribute('href', '/pricing')
    }
    await context.close()
  })

  test('generated files exist in the production build', async () => {
    for (const route of routes) {
      const file = route.path === '/' ? 'dist/index.html' : 'dist' + route.path + 'index.html'
      await expect(readFile(file, 'utf8')).resolves.toContain(route.heading)
    }
  })
})
