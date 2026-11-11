import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { chromium } from 'playwright-chromium'

const root = fileURLToPath(new URL('../', import.meta.url))
const dist = path.join(root, 'dist')
const artifacts = path.join(root, 'artifacts')
const decks = [
  { name: 'demo', slides: 6, image: 3, counter: 4, initial: 0 },
  { name: 'atelier', slides: 3, image: 2, counter: 3, initial: 3 },
]
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' }

// Sert réellement dist/<nom>/ sous /<nom>/, y compris les routes SPA.
const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    let file = path.resolve(dist, `.${urlPath}`)
    if (!file.startsWith(`${dist}/`)) throw new Error('Chemin invalide')
    if (!path.extname(file)) file = path.join(dist, urlPath.split('/')[1], 'index.html')
    res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream')
    res.end(await readFile(file))
  } catch {
    res.statusCode = 404
    res.end('Introuvable')
  }
})

async function waitForServer(url, child) {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (child.exitCode !== null) throw new Error(`Serveur arrêté : ${child.exitCode}`)
    try { if ((await fetch(url)).ok) return } catch { /* démarrage */ }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw new Error(`Serveur indisponible : ${url}`)
}

let browser
let child
try {
  await mkdir(artifacts, { recursive: true })
  browser = await chromium.launch({ headless: true })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const builtOrigin = `http://127.0.0.1:${server.address().port}`
  for (const mode of ['dev', 'build']) {
    for (const deck of decks) {
      let base = `${builtOrigin}/${deck.name}/`
      if (mode === 'dev') {
        child = spawn(process.execPath, [path.join(root, 'node_modules/@slidev/cli/bin/slidev.mjs'),
          `presentations/${deck.name}/slides.md`, '--port', '3041'], { cwd: root, stdio: 'ignore' })
        base = 'http://127.0.0.1:3041/'
        await waitForServer(base, child)
      }
      const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
      // Le mode sans fenêtre ne peut pas maintenir l’écran allumé.
      await page.addInitScript(() => localStorage.setItem('slidev-wake-lock', 'false'))
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
      for (let slide = 1; slide <= deck.slides; slide++) {
        await page.goto(`${base}${slide}`, { waitUntil: 'networkidle' })
        const layout = page.locator('.slidev-layout:visible').last()
        await layout.waitFor()
        const geometry = await layout.evaluate(el => {
          const rect = el.getBoundingClientRect()
          const style = getComputedStyle(el)
          return { ratio: rect.width / rect.height, brand: style.getPropertyValue('--brand').trim(),
            overflow: el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2 }
        })
        assert.equal(geometry.brand, '#176b70', `${mode}/${deck.name} : styles communs`)
        assert.ok(Math.abs(geometry.ratio - 16 / 9) < 0.01, 'Format 16:9')
        assert.equal(geometry.overflow, false, `Débordement sur ${deck.name}/${slide}`)
        if (slide === deck.image) {
          const image = layout.locator('img.local-visual')
          assert.ok(await image.evaluate(el => el.complete && el.naturalWidth > 0), 'Image locale chargée')
          // Slidev peut intégrer les petits SVG en data URL ; vérifier aussi public/.
          const asset = await page.request.get(`${base}images/parcours.svg`)
          assert.equal(asset.status(), 200, 'Ressource publique accessible sous la bonne base')
          assert.equal(await asset.text(), await readFile(path.join(root, 'public/images/parcours.svg'), 'utf8'))
        }
        if (slide === deck.counter) {
          const output = layout.locator('output')
          assert.equal(await output.textContent(), String(deck.initial))
          await layout.getByRole('button', { name: 'Augmenter le compteur', exact: true }).click()
          assert.equal(await output.textContent(), String(deck.initial + 1))
          await layout.getByRole('button', { name: 'Réinitialiser', exact: true }).click()
          assert.equal(await output.textContent(), String(deck.initial))
        }
        await page.screenshot({ path: path.join(artifacts, `${mode}-${deck.name}-${slide}.png`) })
      }
      assert.deepEqual(errors, [], `Erreurs navigateur sur ${mode}/${deck.name}`)
      await page.close()
      if (child) { child.kill('SIGTERM'); await once(child, 'exit'); child = undefined }
      console.log(`OK ${mode}/${deck.name} : ${deck.slides} diapositives, styles, image, interaction.`)
    }
  }
} finally {
  if (child) { child.kill('SIGTERM'); await once(child, 'exit') }
  if (server.listening) await new Promise(resolve => server.close(resolve))
  await browser?.close()
}
