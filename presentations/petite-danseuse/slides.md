---
theme: apple-basic
addons:
  - '@/../..'
title: La Petite Danseuse de quatorze ans
info: Présentation faite par et pour Hortense.
author: Hortense
aspectRatio: 16/9
canvasWidth: 980
colorSchema: light
fonts:
  provider: none
  sans: Arial
transition: fade
drawings:
  enabled: false

layout: intro-image
image: '/images/Danceuse-vue-face.jpg'

---

<script setup>
import '../../styles/petite-danseuse.css'
</script>

<div class="absolute top-10">
  <span class="font-700">
    Hortense Vivares
  </span>
</div>

<div class="absolute bottom-10 titre-couverture">
  <h1>La Petite Danseuse de quatorze ans</h1>
  <p>Une sculpture d'Edgar Degas</p>
</div>


---

# Passer de l’idée à l’action

<script setup>
import '../../styles/petite-danseuse.css'
</script>

1. Écrire les propositions de chacun.
2. Clarifier le résultat attendu.
3. Présenter une prochaine étape concrète.

<img class="local-visual" src="/images/parcours.svg" alt="Trois étapes : écrire, personnaliser, présenter." />

---

# Compter les contributions

<script setup>
import '../../styles/petite-danseuse.css'
</script>

Le même composant et les mêmes styles sont utilisés dans les deux présentations.

<Compteur :initial="3" />

Choisissez une action à tester dès la prochaine réunion.
