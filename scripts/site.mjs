import { access, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export const root = fileURLToPath(new URL('../', import.meta.url))

// Base du site complet : chaque présentation reçoit ensuite son propre suffixe.
export function normalizeBase(value = '/') {
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(value)) {
    throw new Error('La base doit commencer et finir par /, par exemple /presentations/.')
  }
  return value
}

export function takeBase(args) {
  let base = '/'
  const remaining = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base') base = args[++i] ?? ''
    else if (args[i].startsWith('--base=')) base = args[i].slice(7)
    else remaining.push(args[i])
  }
  return { base: normalizeBase(base), args: remaining }
}

export async function listDecks() {
  const entries = await readdir(path.join(root, 'presentations'), { withFileTypes: true })
  const decks = []
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[a-z0-9][a-z0-9-]*$/.test(entry.name)) continue
    try {
      await access(path.join(root, 'presentations', entry.name, 'slides.md'))
      decks.push(entry.name)
    } catch { /* Un dossier sans slides.md n’est pas une présentation. */ }
  }
  return decks.sort()
}
