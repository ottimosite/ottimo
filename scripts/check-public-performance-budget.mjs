import { gzipSync } from 'node:zlib'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const htmlPath = join(dist, 'index.html')
const html = await readFile(htmlPath, 'utf8')

const scriptSources = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1])
const stylesheetSources = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(match => match[1])

async function resourceSize(source) {
  const path = join(dist, source.replace(/^\//, ''))
  const contents = await readFile(path)
  return { source, bytes: contents.byteLength, gzipBytes: gzipSync(contents).byteLength }
}

const scripts = await Promise.all(scriptSources.map(resourceSize))
const stylesheets = await Promise.all(stylesheetSources.map(resourceSize))
const inlineStyles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
  .map(match => match[1])

const javascriptBytes = scripts.reduce((total, asset) => total + asset.gzipBytes, 0)
const cssBytes = stylesheets.reduce((total, asset) => total + asset.gzipBytes, 0) +
  inlineStyles.reduce((total, value) => total + gzipSync(Buffer.from(value, 'utf8')).byteLength, 0)

const javascriptBudget = 150 * 1024
const cssBudget = 100 * 1024

console.log(JSON.stringify({
  route: '/',
  javascript: { gzipBytes: javascriptBytes, budgetBytes: javascriptBudget, assets: scripts },
  css: { gzipBytes: cssBytes, budgetBytes: cssBudget, externalAssets: stylesheets, inlineBlocks: inlineStyles.length },
}, null, 2))

if (javascriptBytes > javascriptBudget || cssBytes > cssBudget) {
  console.error('Public performance budget exceeded.')
  process.exit(1)
}
