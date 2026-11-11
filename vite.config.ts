import { fileURLToPath } from 'node:url'

// Chargé via l’addon local « @/../.. » de chaque présentation.
export default {
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  build: { emptyOutDir: true },
}
