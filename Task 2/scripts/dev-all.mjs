import { spawn } from 'node:child_process'

const processes = [
  spawn(process.execPath, ['server/index.mjs'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '0.0.0.0'], { stdio: 'inherit' }),
]

const shutdown = () => processes.forEach((child) => child.kill())
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
processes.forEach((child) => child.on('exit', (code) => {
  if (code && code !== 0) shutdown()
}))