import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const routes = [
  { path: '/', title: 'Ottimo — Make your website work better.', heading: 'Make your website work better.' },
  { path: '/services/', title: 'Services — Ottimo', heading: 'One website. One improvement system.' },
  { path: '/performance/', title: 'Performance — Ottimo', heading: 'Speed is part of the product.' },
]

test.describe('generated public rendering', () => {
  for (const route of routes) {
    test(`serves meaningful generated HTML for ${route.path}`, async ({ request }) => {
      const response = await request.get(route.path)
      expect(response.ok()).toBeTruthy()
      const html = await response.text()
      expect(html).toContain('<h1>')
      expect(html).toContain(route.heading)
      expect(html).toContain(`<title>${route.title}</title>`)
      expect(html).toContain('<link rel="canonical"')
      expect(html).toContain('<meta name="robots" content="index,follow">')
      expect(html).toContain('Start my Website Check')
    })
  }

  test('public content remains available with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/performance/')
    await expect(page.locator('h1')).toHaveText('Speed is part of the product.')
    await expect(page.getByRole('link', { name: 'Start my Website Check' })).toHaveAttribute('href', '/app/audits/new')
    await expect(page.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/services')
    await context.close()
  })

  test('application routes retain the SPA shell boundary', async ({ request }) => {
    const response = await request.get('/app/dashboard')
    expect(response.ok()).toBeTruthy()
    const html = await response.text()
    expect(html).toContain('<div id="root"></div>')
    expect(html).not.toContain('Speed is part of the product.')
  })

  test('generated files exist in the production build', async () => {
    for (const route of routes) {
      const file = route.path === '/' ? 'dist/index.html' : `dist${route.path}index.html`
      await expect(readFile(file, 'utf8')).resolves.toContain(route.heading)
    }
  })
})
