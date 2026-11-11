import { spawn } from 'node:child_process'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { listDecks, root, takeBase } from './site.mjs'

const [command, ...rawArgs] = process.argv.slice(2)
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
  const { base, args } = takeBase(rawArgs)
  const decks = await listDecks()
  const requested = args[0] && !args[0].startsWith('-') ? args.shift() : undefined
  const selected = requested ? [requested] : command === 'build' ? decks : ['demo']
  if (!selected.length || selected.some(name => !decks.includes(name))) {
    throw new Error(`Présentation inconnue. Choix disponibles : ${decks.join(', ')}`)
  }
  // Une construction complète retire aussi les anciennes présentations supprimées.
  if (command === 'build' && !requested) await rm(path.join(root, 'dist'), { recursive: true, force: true })
  for (const name of selected) {
    const entry = `presentations/${name}/slides.md`
    if (command === 'dev') await run(entry, '--base', base, ...args)
    if (command === 'build') {
      await run('build', entry, ...args, '--out', path.join(root, 'dist', name),
        '--base', `${base}${name}/`, '--router-mode', 'hash')
    }
    if (command === 'export') {
      await mkdir(path.join(root, 'exports'), { recursive: true })
      await run('export', entry, '--output', path.join(root, 'exports', `${name}.pdf`), ...args)
    }
  }
  if (command === 'build') {
    const template = await readFile(path.join(root, 'site/index.html'), 'utf8')
    // Les noms sont limités à [a-z0-9-] par listDecks().
    const links = selected.map(name =>
      `      <li><a href="${base}${name}/"><span>${name.replaceAll('-', ' ')}</span><span aria-hidden="true">→</span></a></li>`,
    ).join('\n')
    await writeFile(path.join(root, 'dist/index.html'), template.replaceAll('{{BASE}}', base).replace('{{PRESENTATIONS}}', links))
    await copyFile(path.join(root, 'styles/home.css'), path.join(root, 'dist/home.css'))
    console.log(`Accueil construit : ${base} (${selected.length} présentations).`)
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
