/* global process, setTimeout, setInterval, clearInterval, console */
import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const functionsPort = 9999
const functionsHost = '127.0.0.1'

function startProcess(command, args, env) {
  return spawn(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
    // Do not wrap npm.cmd/npx.cmd in another shell on Windows.
    shell: false,
  })
}

function waitForPort(host, port, timeoutMs = 60_000) {
  const startedAt = Date.now()
  return new Promise((resolve, reject) => {
    let settled = false
    let timer
    const finish = (error) => {
      if (settled) return
      settled = true
      clearInterval(timer)
      if (error) reject(error)
      else resolve()
    }
    const probe = () => {
      const socket = createConnection({ host, port })
      socket.once('connect', () => { socket.destroy(); finish() })
      socket.once('error', () => socket.destroy())
    }
    timer = setInterval(() => {
      if (Date.now() - startedAt >= timeoutMs) {
        finish(new Error('Netlify Functions server did not become ready on http://' + host + ':' + port + ' within ' + timeoutMs / 1000 + 's.'))
        return
      }
      probe()
    }, 250)
    probe()
  })
}

let functionsProcess
let viteProcess
let shuttingDown = false

const shutdown = (code = 0) => {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of [viteProcess, functionsProcess]) {
    if (child && !child.killed) child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(code), 250)
}

const fail = (error) => {
  console.error(error instanceof Error ? error.message : error)
  shutdown(1)
}

async function main() {
  functionsProcess = startProcess(
    npxCommand,
    ['--yes', 'netlify-cli@27.8.0', 'functions:serve', '--port', String(functionsPort)],
    { NETLIFY_DEV: 'true' },
  )

  functionsProcess.once('error', fail)
  functionsProcess.once('exit', (code, signal) => {
    if (!shuttingDown && (code ?? 0) !== 0) {
      fail(new Error('Netlify Functions server exited before startup with code ' + (code ?? 'unknown') + (signal ? ' (' + signal + ')' : '') + '.'))
    }
  })

  await waitForPort(functionsHost, functionsPort)
  if (shuttingDown) return
  console.log('Netlify Functions ready on http://' + functionsHost + ':' + functionsPort)

  viteProcess = startProcess(
    npmCommand,
    ['run', 'dev:vite', '--', '--host', functionsHost, '--port', '5173'],
    { OTTIMO_LOCAL_AUDIT: 'true' },
  )

  viteProcess.once('error', fail)
  viteProcess.once('exit', (code, signal) => {
    if (!shuttingDown && (code ?? 0) !== 0) {
      fail(new Error('Vite development server exited with code ' + (code ?? 'unknown') + (signal ? ' (' + signal + ')' : '') + '.'))
    }
  })
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
main().catch(fail)