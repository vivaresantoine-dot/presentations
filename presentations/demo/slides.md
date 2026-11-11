---
theme: default
addons:
  - '@/../..'
title: Des idées aux diapositives
info: Démonstration en français — Markdown, CSS et Vue.
author: Équipe présentations
aspectRatio: 16/9
canvasWidth: 980
colorSchema: light
fonts:
  webfonts: false
  sans: Arial
transition: fade
drawings:
  enabled: false
---

<p class="eyebrow">Présentation de démonstration · 01</p>

# Des idées aux diapositives

Un contenu clair en **Markdown**, une identité commune en **CSS**, des interactions en **Vue**.

---

# Écrire pour être compris

- Une idée principale par diapositive.
- Des titres qui annoncent le message.
- Des phrases courtes et des exemples concrets.

Le fichier `slides.md` reste la source du contenu.

---

# Un parcours simple

Du premier brouillon à la présentation, trois étapes suffisent.

<img class="local-visual" src="/images/parcours.svg" alt="Trois étapes : écrire, personnaliser, présenter." />

Cette illustration est une ressource locale partagée dans `public/`.

---

# Faire participer le public

Essayez les boutons : seul ce bloc utilise un composant Vue.

<Compteur :initial="0" />

Le texte qui l’entoure reste écrit en Markdown.

---

# Une apparence cohérente

- Format **16:9**, fond clair et accents discrets.
- Styles regroupés dans `styles/index.css`.
- Composants partagés dans `components/`.
- Une seule installation npm pour toutes les présentations.

---
layout: center
---

<p class="eyebrow">À vous de jouer</p>

# Préparer votre prochaine histoire

Copiez une présentation, écrivez votre message et prévisualisez-le.

**Écrire → Personnaliser → Présenter**
