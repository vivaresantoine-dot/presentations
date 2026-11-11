import { spawn } from 'node:child_process'
import { readdir, access, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const [command, ...args] = process.argv.slice(2)
const cli = path.join(root, 'node_modules/@slidev/cli/bin/slidev.mjs')

async function run(...params) {
  const child = spawn(process.execPath, [cli, ...params], { cwd: root, stdio: 'inherit' })
  const forward = signal => child.kill(signal)
  const onInt = () => forward('SIGINT')
  const onTerm = () => forward('SIGTERM')
  process.on('SIGINT', onInt)
  process.on('SIGTERM', onTerm)
  try {
    await new Promise((resolve, reject) => {
      child.on('error', reject)
      child.on('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`Slidev interrompu (${signal ?? code}).`)))
    })
  } finally {
    process.off('SIGINT', onInt)
    process.off('SIGTERM', onTerm)
  }
}

try {
  if (!['dev', 'build', 'export'].includes(command)) throw new Error('Commande attendue : dev, build ou export.')
  const entries = await readdir(path.join(root, 'presentations'), { withFileTypes: true })
  const decks = []
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[a-z0-9][a-z0-9-]*$/.test(entry.name)) continue
    try { await access(path.join(root, 'presentations', entry.name, 'slides.md')); decks.push(entry.name) } catch { /* autre dossier */ }
  }
  decks.sort()
  const requested = args[0] && !args[0].startsWith('-') ? args.shift() : undefined
  const selected = requested ? [requested] : command === 'build' ? decks : ['demo']
  if (!selected.length || selected.some(name => !decks.includes(name))) {
    throw new Error(`Présentation inconnue. Choix disponibles : ${decks.join(', ')}`)
  }
  for (const name of selected) {
    const entry = `presentations/${name}/slides.md`
    if (command === 'dev') await run(entry, ...args)
    if (command === 'build') await run('build', entry, '--out', path.join(root, 'dist', name), '--base', `/${name}/`, ...args)
    if (command === 'export') {
      await mkdir(path.join(root, 'exports'), { recursive: true })
      await run('export', entry, '--output', path.join(root, 'exports', `${name}.pdf`), ...args)
    }
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
