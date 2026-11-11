# Conventions

- Utiliser npm et conserver `package-lock.json` ; installation reproductible avec `npm ci`.
- Chaque présentation réside dans `presentations/<nom>/slides.md` (nom en minuscules avec tirets).
- Privilégier le Markdown en français ; réserver Vue aux interactions.
- Mutualiser les styles dans `styles/`, les composants dans `components/` et les ressources dans `public/`.
- Conserver `addons: ['@/../..']` dans chaque présentation pour charger les ressources communes et la configuration Vite racine (`@/` désigne le dossier de `slides.md`).
- Conserver le format 16:9 et les polices locales ; éviter les ressources distantes.
- Vérifier `npm run build` et `npm run check:render` après une modification des ressources communes.
- Rester en local : aucune publication ni aucun déploiement sans demande explicite.
