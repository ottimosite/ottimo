import { spawn } from 'node:child_process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx'

const children = [
  spawn(npmCommand, ['run', 'dev:vite', '--', '--host', '127.0.0.1', '--port', '5173'], {
    stdio: 'inherit',
    env: { ...process.env, OTTIMO_LOCAL_AUDIT: 'true' },
    shell: process.platform === 'win32',
  }),
  spawn(npxCommand, ['--yes', 'netlify-cli@27.8.0', 'functions:serve', '--port', '9999'], {
    stdio: 'inherit',
    env: { ...process.env, NETLIFY_DEV: 'true' },
    shell: process.platform === 'win32',
  }),
]

let shuttingDown = false

const shutdown = (code = 0) => {
  if (shuttingDown) return
  shuttingDown = true

  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }

  setTimeout(() => process.exit(code), 250)
}

for (const child of children) {
  child.on('error', (error) => {
    console.error(error)
    shutdown(1)
  })

  child.on('exit', (code, signal) => {
    if (!shuttingDown && (code ?? 0) !== 0) {
      console.error(`Local development process exited with code ${code ?? 'unknown'}${signal ? ` (${signal})` : ''}.`)
      shutdown(code ?? 1)
    }
  })
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
