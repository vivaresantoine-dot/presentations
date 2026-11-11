import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { root, takeBase, normalizeBase } from './site.mjs'

const dist = path.join(root, 'dist')
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' }

// Serveur statique strict : pas de repli SPA qui masquerait une erreur sur Pages.
export function createPreviewServer(base = '/') {
  normalizeBase(base)
  return createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      if (base !== '/' && pathname === base.slice(0, -1)) {
        res.writeHead(301, { Location: base }); res.end(); return
      }
      if (!pathname.startsWith(base)) throw new Error('En dehors du site')
      let file = path.resolve(dist, pathname.slice(base.length))
      if (file !== dist && !file.startsWith(`${dist}${path.sep}`)) throw new Error('Chemin invalide')
      if ((await stat(file)).isDirectory()) {
        if (!pathname.endsWith('/')) {
          res.writeHead(301, { Location: `${pathname}/` }); res.end(); return
        }
        file = path.join(file, 'index.html')
      }
      const body = await readFile(file)
      res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream')
      res.end(body)
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Introuvable')
    }
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { base, args } = takeBase(process.argv.slice(2))
  if (args.length) throw new Error('Utilisation : npm run preview -- --base /presentations/')
  const server = createPreviewServer(base)
  server.listen(8080, '127.0.0.1', () => console.log(`Aperçu local : http://127.0.0.1:8080${base}`))
}
