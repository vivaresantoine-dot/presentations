import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright-chromium'
import { listDecks, root, takeBase } from './site.mjs'
import { createPreviewServer } from './preview.mjs'

const { base: siteBase, args } = takeBase(process.argv.slice(2))
if (args.length) throw new Error('Utilisation : npm run check:render -- --base /presentations/')
const artifacts = path.join(root, 'artifacts')
const scenarios = {
  demo: { slides: 6, image: 3, counter: 4, initial: 0 },
  atelier: { slides: 3, image: 2, counter: 3, initial: 3 },
  'petite-danseuse': { slides: 3, image: 2, counter: 3, initial: 3 },
}
const decks = (await listDecks()).map(name => ({ name, slides: 1, ...scenarios[name] }))
const server = createPreviewServer(siteBase)

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
  const home = await browser.newPage()
  const response = await home.goto(`${builtOrigin}${siteBase}`, { waitUntil: 'networkidle' })
  assert.equal(response.status(), 200, 'Accueil accessible')
  const links = home.locator('main a')
  assert.equal(await links.count(), decks.length, 'Accueil : toutes les présentations détectées')
  for (const deck of decks) {
    const href = `${siteBase}${deck.name}/`
    const link = home.locator(`a[href="${href}"]`)
    assert.equal(await link.count(), 1, `Lien d’accueil vers ${deck.name}`)
    await link.click()
    await home.locator('.slidev-layout:visible').last().waitFor()
    assert.ok(home.url().startsWith(`${builtOrigin}${href}`))
    await home.goto(`${builtOrigin}${siteBase}`)
  }
  const homeStyle = await home.locator('body').evaluate(el => getComputedStyle(el).borderTopColor)
  assert.equal(homeStyle, 'rgb(23, 107, 112)', 'CSS de l’accueil chargé sous la bonne base')
  await home.screenshot({ path: path.join(artifacts, 'home.png') })
  await home.close()
  if (siteBase !== '/') {
    assert.equal((await fetch(`${builtOrigin}/demo/`)).status, 404, 'Aucun faux repli hors du préfixe')
  }
  console.log(`OK accueil ${siteBase} : ${decks.length} liens et feuille de styles.`)
  for (const mode of ['dev', 'build']) {
    for (const deck of decks) {
      let base = `${builtOrigin}${siteBase}${deck.name}/`
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
        const url = `${base}${mode === 'build' ? '#/' : ''}${slide}`
        await page.goto(url, { waitUntil: 'networkidle' })
        if (mode === 'build') {
          await page.reload({ waitUntil: 'networkidle' })
          assert.equal(new URL(page.url()).hash, `#/${slide}`, 'Lien direct conservé après rechargement')
        }
        const layout = page.locator('.slidev-layout:visible').last()
        await layout.waitFor()
        const geometry = await layout.evaluate(el => {
          const rect = el.getBoundingClientRect()
          const style = getComputedStyle(el)
          return { ratio: rect.width / rect.height, brand: style.getPropertyValue('--brand').trim(),
            overflow: el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2 }
        })
        assert.ok(geometry.brand, `${mode}/${deck.name} : styles communs`)
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
      if (deck.slides > 1) {
        await page.goto(`${base}${mode === 'build' ? '#/' : ''}1`, { waitUntil: 'networkidle' })
        // Slidev suspend les raccourcis quand un bouton du compteur garde le focus.
        await page.locator('.slidev-layout:visible').last().locator('h1').click()
        await page.keyboard.press('ArrowRight')
        await page.waitForURL(`${base}${mode === 'build' ? '#/' : ''}2`)
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
