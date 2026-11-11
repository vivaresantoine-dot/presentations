# Présentations Slidev

Projet local initialisé avec le générateur officiel `npm init slidev@latest .`
(Slidev Creator 53.1.0), puis organisé pour plusieurs présentations avec une
seule installation npm. Le workflow `.github/workflows/deploy.yml` prépare la
publication sur GitHub Pages après chaque push sur `main`.

## Prérequis et installation

- Node.js **22.22 ou supérieur** (minimum du CLI verrouillé) ; GitHub Actions utilise **Node 24 LTS**.
- Environnement local vérifié : Node 22.22.2, npm 12.0.2.
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
| `npm run build` | Construit toutes les présentations et l’accueil, pour une base `/` |
| `npm run build -- --base /presentations/` | Construit le site complet pour GitHub Pages |
| `npm run build -- demo` | Construit seulement `demo`, avec un accueil qui la référence |
| `npm run preview -- --base /presentations/` | Sert le dernier site construit sur http://127.0.0.1:8080/presentations/ |
| `npm run export -- demo` | Produit `exports/demo.pdf` |
| `npm run export -- atelier` | Produit `exports/atelier.pdf` |
| `npm run check:render` | Contrôle l’accueil et les présentations en développement et après construction |
| `npm run check:render -- --base /presentations/` | Contrôle la construction Pages, son accueil, ses liens et les présentations |

La construction découvre automatiquement les fichiers `presentations/*/slides.md`.
Une construction complète nettoie `dist/`, y compris les anciennes présentations
supprimées. Une construction ciblée ne reconstruit que le dossier demandé et
l’accueil associé ; faire une construction complète avant publication.
Un nom inconnu provoque une erreur et affiche les choix disponibles.

La base correspond à la racine du **site entier**. Le script ajoute le nom de
chaque présentation : `--base /presentations/` produit les bases
`/presentations/demo/` et `/presentations/atelier/`. Les fichiers restent dans
`dist/demo/` et `dist/atelier/` : GitHub Pages ajoute le préfixe du dépôt lors de
la publication, il ne faut pas créer un second `dist/presentations/`.

Pour reproduire cette organisation localement :

```bash
npm run build -- --base /presentations/
npm run preview -- --base /presentations/
```

Ouvrir http://127.0.0.1:8080/presentations/ puis choisir une présentation.
Arrêter l’aperçu avec `Ctrl+C`. Pour une construction sans préfixe, utiliser
`npm run build` puis `npm run preview` et ouvrir http://127.0.0.1:8080/.
Le paramètre de l’aperçu doit correspondre à celui de la dernière construction.

Le script de construction impose `--router-mode hash` : la troisième diapositive
de `demo` a l’URL `/presentations/demo/#/3`. Le navigateur gère la partie après
`#` ; le serveur reçoit seulement `/presentations/demo/`. Cela permet les liens
directs et les rechargements sur GitHub Pages sans réécriture des routes.
Le développement conserve les routes Slidev habituelles, comme `/3`.

## Organisation et personnalisation

```text
presentations/
  demo/slides.md       # Démonstration française, 6 diapositives
  atelier/slides.md    # Atelier français, 3 diapositives
  petite-danseuse/slides.md # Troisième présentation existante, 3 diapositives
components/
  Compteur.vue        # Interaction réutilisable
styles/
  index.css           # Tous les styles communs
  home.css            # Apparence de l’accueil uniquement
public/
  images/parcours.svg # Illustration locale commune
scripts/
  slidev.mjs          # Sélection, construction et export
  site.mjs            # Découverte des présentations et traitement de la base
  preview.mjs         # Serveur statique local sous le préfixe demandé
  check-render.mjs    # Vérification Chromium
site/index.html       # Modèle de la page d’accueil
.github/workflows/
  deploy.yml          # Construction et publication par GitHub Actions
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
Le format 16:9, le fond clair et les couleurs communes définissent l’identité
visuelle. Les illustrations sont locales et mutualisées dans `public/`.

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
dans la page ; les autres chemins sont adaptés à la base du site et de la présentation.
Les ressources publiques sont aussi copiées dans chaque sortie.

## Ajouter une présentation

1. Créer `presentations/mon-sujet/` et y copier **uniquement** le `slides.md` d’un exemple.
2. Modifier le titre, les métadonnées et le contenu de `slides.md`.
3. Conserver l’addon racine, `aspectRatio: 16/9` et `fonts.webfonts: false`.
4. Exécuter `npm run dev -- mon-sujet`, puis `npm run build`.

Les noms autorisés contiennent des minuscules, chiffres et tirets. Les liens de
l’accueil sont générés à partir de ces noms (les tirets deviennent des espaces).
Aucune liste manuelle à maintenir. Aucun `package.json` ni installation npm
n’est nécessaire dans les présentations. Slidev peut y créer des caches
`node_modules/.slidev/` : ils sont générés et ignorés par Git, à ne pas copier.

## Vérifications

```bash
npm run build
npm run check:render
npm run export -- demo
npm run export -- atelier

# Même construction que le workflow de publication :
npm run build -- --base /presentations/
npm run check:render -- --base /presentations/
```

Le contrôle de rendu couvre les 12 diapositives des trois présentations actuelles, en développement
et dans les sorties statiques : styles partagés, format 16:9, absence de débordement,
images locales, incrémentation et réinitialisation du compteur, navigation clavier,
erreurs navigateur. Il vérifie aussi l’accueil, tous ses liens, et le rechargement
des URL `#/n` avec un serveur statique strict, sans repli SPA. Pour une nouvelle
présentation, il vérifie le lien d’accueil et la première diapositive ; ajouter un
scénario dans `scripts/check-render.mjs` pour couvrir ses interactions spécifiques.
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

## Comprendre la publication

Trois opérations différentes interviennent :

1. **Sauvegarder les sources** : un commit Git enregistre les Markdown, CSS, Vue,
   scripts et configuration ; `git push` envoie ces commits à GitHub.
2. **Construire le site** : `npm run build` transforme ces sources en HTML, CSS,
   JavaScript et ressources statiques dans `dist/`. Cette commande locale ne
   publie rien. `npm ci` installe préalablement les versions exactes du verrouillage.
3. **Publier le site** : GitHub Actions construit une nouvelle copie du site,
   transmet `dist/` comme artefact, puis GitHub Pages rend cet artefact public.

`node_modules/`, les caches Slidev, `dist/`, `exports/` et `artifacts/` sont
ignorés par `.gitignore`. Seuls les fichiers sources et `package-lock.json`
sont à committer. Il n’y a pas de branche `gh-pages` à créer et pas de PDF
généré par le workflow. Les interactions Vue fonctionnent dans le site publié.

### Fichiers et chaîne de construction

- `package.json` expose `dev`, `build`, `preview`, `export` et `check:render`.
  Le minimum Node a été aligné sur celui du CLI installé : 22.22.
- `package-lock.json` conserve les versions exactes et leur intégrité. Seule sa
  métadonnée du minimum Node a changé ; aucune dépendance n’a été ajoutée.
- `scripts/site.mjs` partage la découverte des présentations et la validation
  du chemin de base entre les commandes.
- `scripts/slidev.mjs` demeure l’unique chaîne de construction. Il transmet à
  Slidev une base par présentation et le routage hash, puis génère l’accueil.
- `site/index.html` est le modèle HTML de l’accueil ; les emplacements
  `{{BASE}}` et `{{PRESENTATIONS}}` sont remplacés à la construction.
- `styles/home.css` personnalise l’accueil. `styles/index.css`, `components/`
  et `public/` restent les ressources communes aux présentations.
- `scripts/preview.mjs` sert le résultat construit en simulant le préfixe Pages.
- `scripts/check-render.mjs` utilise ce serveur et Chromium pour contrôler les liens,
  les images, les interactions et les URL avec fragment.
- `.github/workflows/deploy.yml` décrit les opérations que GitHub exécutera.
  `AGENTS.md` rappelle la commande de validation sous le préfixe Pages.

### Lire le workflow YAML

Le fichier contient des commentaires pour suivre chaque étape :

- `on.push.branches: [main]` déclenche la publication après un push sur `main`.
  `workflow_dispatch` ajoute le bouton de lancement manuel dans Actions.
- `permissions.contents: read` autorise la récupération du code.
- `concurrency` évite deux publications simultanées ; le déploiement en cours
  se termine avant le suivant.
- Le job `build` utilise une machine Ubuntu neuve. `checkout` y récupère le commit ;
  `setup-node` sélectionne Node 24 LTS et met en cache les téléchargements npm.
  Le cache accélère `npm ci` mais ne remplace pas l’installation depuis le verrouillage.
- `configure-pages` lit les paramètres Pages du dépôt avec `pages: read`, sans
  les activer à ta place.
- `npm ci` installe les dépendances verrouillées. La variable
  `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` évite de télécharger Chromium : la construction
  statique n’a besoin ni de navigateur ni des exports PDF.
- `npm run build -- --base /presentations/` construit l’accueil et toutes les
  présentations avec les bons chemins. `upload-pages-artifact` transmet `dist/`
  comme paquet de fichiers au job suivant, sans le committer.
- Le job `deploy` attend le succès de `build` grâce à `needs: build`, et publie
  uniquement depuis `main`. `pages: write` autorise le déploiement ;
  `id-token: write` fournit une identité temporaire OIDC à GitHub Pages.
  GitHub fournit les jetons nécessaires : aucun jeton personnel à créer.
- `environment: github-pages` associe le déploiement à l’environnement Pages.
  `steps.deployment.outputs.page_url` affiche l’URL renvoyée par le déploiement.

### Première publication : réglages à faire toi-même

1. Ouvrir le dépôt `vivaresantoine-dot/presentations` sur GitHub.
2. Aller dans **Settings → Pages → Build and deployment → Source** et choisir
   **GitHub Actions**. Ne pas sélectionner « Deploy from a branch » et ne pas
   ajouter un second workflow proposé par l’interface.
3. Si Actions est désactivé pour le dépôt, l’activer dans
   **Settings → Actions → General** et autoriser les actions officielles `actions/*`.
   Les permissions nécessaires sont déjà déclarées dans le YAML.
4. Examiner puis committer et pousser les changements, depuis `main` :

```bash
git status --short
git diff --check
git diff
cat .github/workflows/deploy.yml

git add .github/workflows/deploy.yml AGENTS.md README.md package.json package-lock.json scripts site styles/home.css
git diff --cached --stat
git diff --cached
git commit -m "Configure la publication des présentations sur GitHub Pages"
git push origin main
```

`git diff` n’affiche pas le contenu des nouveaux fichiers avant leur ajout ;
`git diff --cached` permet de tous les relire avant le commit.

### Suivre et confirmer le résultat

1. Ouvrir l’onglet **Actions** du dépôt, puis **Publier sur GitHub Pages**.
   Choisir l’exécution correspondant au commit poussé.
2. Vérifier que les jobs `build` puis `deploy` deviennent verts. En cas d’échec,
   ouvrir le job rouge puis l’étape en erreur pour lire son journal.
3. Le job `deploy` et **Settings → Pages** indiquent l’URL de publication.
   Sans domaine personnalisé, l’URL attendue d’après `origin` est
   `https://vivaresantoine-dot.github.io/presentations/`. Cette adresse est une
   prévision : sa disponibilité doit être confirmée après le déploiement.
4. Ouvrir cette URL, puis chaque lien de l’accueil. Vérifier l’illustration,
   le compteur, la navigation avec les flèches et le rechargement de
   `https://vivaresantoine-dot.github.io/presentations/demo/#/3`.
5. Si le workflow n’est pas parti automatiquement, utiliser
   **Actions → Publier sur GitHub Pages → Run workflow**, branche `main`.

Si `configure-pages` échoue, vérifier d’abord le choix de la source dans Pages.
Si `deploy` attend une approbation, vérifier les règles de l’environnement
`github-pages`. Si une ressource retourne 404, vérifier son URL dans les outils
du navigateur : elle doit inclure `/presentations/` et le nom de la présentation.

### Publier les modifications suivantes

Modifier les sources, vérifier localement, puis faire un commit et un push sur
`main` : le même workflow reconstruit tout le site et remplace la publication.
Pour une nouvelle présentation, ajouter `presentations/<nom>/slides.md` ; la
découverte automatique l’ajoute aussi à l’accueil, sans modifier le YAML.
Supprimer une présentation retire également son lien et ses fichiers lors de
la prochaine construction complète. Ne jamais ajouter `dist/` avec `git add -f`.

### Portée de la vérification locale

Lors de cette préparation, `npm ci`, les constructions avec les bases `/` et
`/presentations/`, ainsi que le contrôle Chromium des 12 diapositives en
développement et après construction ont réussi. Le YAML a été analysé localement.
Ces vérifications ont utilisé Node 22.22.2 ; le job Node 24 reste à exécuter sur Actions.

La construction Pages et le contrôle navigateur vérifient localement le site
sous `/presentations/`, avec un serveur statique sans réécriture. Cela couvre
les fichiers construits, l’accueil, les liens, les images et les interactions.
Le workflow lui-même, les droits du jeton, les paramètres Pages, l’environnement
`github-pages` et l’URL publique nécessitent une exécution réelle sur GitHub.
La préparation locale ne confirme donc pas que le site est déjà accessible.

L’audit npm initial signale 8 alertes transitives dans la version officielle
53.1.0, notamment via Monaco/DOMPurify et l’export PPTX (`pptxgenjs/image-size`).
Aucune correction forcée avec changement de version Slidev n’a été appliquée.
Relancer `npm audit` pour obtenir le rapport actuel.

Documentation officielle : [démarrage](https://sli.dev/guide/),
[addons locaux](https://sli.dev/guide/write-addon),
[structure](https://sli.dev/custom/directory-structure),
[export PDF](https://sli.dev/guide/exporting),
[hébergement Slidev](https://sli.dev/guide/hosting),
[workflows officiels GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[versions Node LTS](https://nodejs.org/en/about/previous-releases).
