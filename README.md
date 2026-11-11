# Présentations Slidev

Projet local initialisé avec le générateur officiel `npm init slidev@latest .`
(Slidev Creator 53.1.0), puis organisé pour plusieurs présentations avec une
seule installation npm. Aucun service de publication n’est configuré.

## Prérequis et installation

- Node.js **22.12 ou supérieur** ; environnement initial : Node 22.22.2, npm 12.0.2.
- npm ; conserver `package-lock.json` pour figer les dépendances.
- Chromium via Playwright pour les PDF et les contrôles du rendu.

```bash
npm ci
npx playwright install chromium
```

Sous Linux, si Chromium signale des bibliothèques manquantes :

```bash
npx playwright install-deps chromium
```

Cette dernière commande peut demander les droits administrateur. L’installation
du navigateur est explicite : elle fonctionne aussi lorsque npm bloque les
scripts d’installation de `playwright-chromium`.

## Commandes

Exécuter les commandes depuis la racine du projet.

| Commande | Résultat |
| --- | --- |
| `npm run dev` | Lance `demo` sur http://localhost:3030 |
| `npm run dev -- atelier` | Lance la présentation `atelier` |
| `npm run dev -- demo --port 3031 --open` | Choisit le port et ouvre le navigateur |
| `npm run build` | Construit toutes les présentations dans `dist/<nom>/` |
| `npm run build -- demo` | Construit seulement `demo` |
| `npm run export -- demo` | Produit `exports/demo.pdf` |
| `npm run export -- atelier` | Produit `exports/atelier.pdf` |
| `npm run check:render` | Contrôle les deux exemples en développement et après construction |

La construction découvre automatiquement les fichiers `presentations/*/slides.md`.
Chaque sous-dossier de sortie est nettoyé avant sa reconstruction.
Un nom inconnu provoque une erreur et affiche les choix disponibles.

Les versions construites utilisent une base explicite `/<nom>/`, par exemple
`/demo/` et `/atelier/`. Pour les consulter localement, servir **tout `dist/`** :

```bash
python3 -m http.server 8080 --directory dist
```

Puis ouvrir http://localhost:8080/demo/ ou http://localhost:8080/atelier/.
Ce serveur suffit pour la consultation depuis la page d’entrée ; un rechargement
direct sur `/demo/3` nécessite un serveur avec repli SPA vers `demo/index.html`.
Le script de contrôle fournit ce repli et vérifie aussi ces routes directes.

## Organisation et personnalisation

```text
presentations/
  demo/slides.md       # Démonstration française, 6 diapositives
  atelier/slides.md    # Atelier français, 3 diapositives
components/
  Compteur.vue        # Interaction réutilisable
styles/
  index.css           # Tous les styles communs
public/
  images/parcours.svg # Illustration locale commune
scripts/
  slidev.mjs          # Sélection, construction et export
  check-render.mjs    # Vérification Chromium
vite.config.ts        # publicDir commun explicite
package.json
package-lock.json
AGENTS.md
```

Le contenu est écrit en Markdown ; `---` sépare les diapositives. Utiliser Vue
pour les interactions ponctuelles, par exemple `<Compteur :initial="3" />`.
Le compteur expose des boutons accessibles au clavier et une valeur annoncée
par les lecteurs d’écran. Un PDF conserve son état initial sans interaction.

Les styles communs sont centralisés dans `styles/index.css`. Les sélecteurs
commencent par `.slidev-layout` pour préserver l’interface du présentateur.
Le format 16:9, le fond clair, les polices système et les ressources locales
évitent les téléchargements de polices ou d’images pendant la présentation.

Chaque fichier `slides.md` charge explicitement la racine comme **addon local** :

```yaml
addons:
  - '@/../..'
```

Dans Slidev, `@/` désigne le dossier du fichier d’entrée. Cette déclaration rend
les `components/`, `styles/` et `vite.config.ts` de la racine disponibles depuis
les présentations imbriquées. La configuration Vite définit un chemin absolu
vers le `public/` commun. Aucun import CSS ni composant Vue n’est dupliqué.

Pour une image commune, utiliser dans le Markdown :

```html
<img class="local-visual" src="/images/parcours.svg" alt="Trois étapes : écrire, personnaliser, présenter." />
```

Ne pas inclure `public/` dans l’URL. Slidev/Vite peut intégrer les petits SVG
dans la page ; les autres chemins sont adaptés à la base `/<nom>/` à la construction.
Les ressources publiques sont aussi copiées dans chaque sortie.

## Ajouter une présentation

1. Copier `presentations/atelier/` vers `presentations/mon-sujet/`.
2. Modifier le titre, les métadonnées et le contenu de `slides.md`.
3. Conserver l’addon racine, `aspectRatio: 16/9` et `fonts.webfonts: false`.
4. Exécuter `npm run dev -- mon-sujet`, puis `npm run build`.

Les noms autorisés contiennent des minuscules, chiffres et tirets. Aucun
`package.json` ni `node_modules/` n’est nécessaire dans les présentations.

## Vérifications

```bash
npm run build
npm run check:render
npm run export -- demo
npm run export -- atelier
```

Le contrôle de rendu couvre les 9 diapositives des deux exemples, en développement
et dans les sorties statiques : styles partagés, format 16:9, absence de débordement,
images locales, incrémentation et réinitialisation du compteur, erreurs navigateur.
Il démarre puis arrête ses serveurs locaux et écrit des captures dans `artifacts/`
(ignoré par Git). Le port 3041 doit être libre. Adapter les scénarios de ce script
si les exemples ou leur pagination changent.

Lors de l’initialisation, Chromium était présent mais trois bibliothèques Linux
manquaient (`libnspr4`, `libnss3`, `libasound2t64`). Des copies extraites dans
`/tmp/slidev-browser-libs/runtime` permettent le contrôle sur cet environnement :

```bash
LD_LIBRARY_PATH=/tmp/slidev-browser-libs/runtime/usr/lib/x86_64-linux-gnu npm run check:render
LD_LIBRARY_PATH=/tmp/slidev-browser-libs/runtime/usr/lib/x86_64-linux-gnu npm run export -- demo
```

Ce chemin temporaire est propre à cette session. Sur une autre machine, installer
les dépendances système avec la commande Playwright donnée plus haut.

L’audit npm initial signale 8 alertes transitives dans la version officielle
53.1.0, notamment via Monaco/DOMPurify et l’export PPTX (`pptxgenjs/image-size`).
Aucune correction forcée avec changement de version Slidev n’a été appliquée.
Relancer `npm audit` pour obtenir le rapport actuel.

Documentation officielle : [démarrage](https://sli.dev/guide/),
[addons locaux](https://sli.dev/guide/write-addon),
[structure](https://sli.dev/custom/directory-structure),
[export PDF](https://sli.dev/guide/exporting).
