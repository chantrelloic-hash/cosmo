# Cosmo Commande

Appli de prise de commande pour le **Cosmo**, boîte de nuit à Kourou (Guyane). Le serveur (Loïc) entend mal à cause de la musique :
il tourne l'écran du téléphone vers le client, qui montre du doigt sa boisson, puis on lui montre le total en très gros.
Tout l'interface est **en français**. Loïc n'est pas développeur : lui parler simplement, en français.

## Passage de relais (à faire en premier)

**Seule tâche restante : mettre l'appli en ligne sur GitHub Pages.** Tout le reste est fait, fusionné dans `main` et testé.

Situation au 1er novembre 2026 :
- Le workflow `.github/workflows/pages.yml` (« Mise en ligne (GitHub Pages) ») a tourné après la fusion de la PR #1.
  Le job `test` est vert, le job `deploy` a échoué à l'étape `actions/configure-pages@v5` parce que **GitHub Pages n'est pas activé**
  sur le dépôt (run 41293441058).
- Le dépôt `chantrelloic-hash/cosmo` est **privé**. Sur un compte GitHub gratuit, Pages n'est pas disponible pour un dépôt privé.
- La session cloud précédente ne pouvait ni changer les réglages du dépôt ni piloter un navigateur connecté à GitHub.
  Loïc a ouvert cette session locale pour que ces clics soient faits dans son navigateur (Claude in Chrome, où il est connecté à GitHub).

À faire, dans l'ordre :
1. **Rendre le dépôt public** (Loïc l'a demandé ; ne le fais qu'avec sa confirmation dans cette session si elle n'est pas déjà donnée) :
   https://github.com/chantrelloic-hash/cosmo/settings → Danger Zone → « Change visibility » → « Change to public » → confirmer.
   Le dépôt ne contient aucun secret : seulement le code, la carte et le code d'accès par défaut des réglages (1234), visible de toute façon dans l'appli.
   Si Loïc préfère rester en privé : soit GitHub Pro, soit un autre hébergeur gratuit (Netlify ou Cloudflare Pages, en servant le dossier `app/` tel quel, sans build).
2. **Activer Pages** : https://github.com/chantrelloic-hash/cosmo/settings/pages → Source : **GitHub Actions**.
3. **Relancer le déploiement** : https://github.com/chantrelloic-hash/cosmo/actions/workflows/pages.yml → « Run workflow » sur `main`
   (le workflow a `workflow_dispatch`), ou « Re-run failed jobs » sur le run échoué.
4. **Vérifier** que https://chantrelloic-hash.github.io/cosmo/ répond 200 (titre « Cosmo Commande »), que `menu.json` répond 200,
   et ouvrir l'appli : l'accueil affiche Bière / Soft / Alcool au verre / Bouteille, sans erreur console.
5. **Dire à Loïc comment l'installer** sur son téléphone :
   - iPhone : ouvrir le lien dans Safari → Partager → « Sur l'écran d'accueil ».
   - Android : ouvrir le lien dans Chrome → menu ⋮ → « Installer l'application ».
   - Lui rappeler de changer le code des réglages (appui long sur « COSMO », code 1234 par défaut).
6. Mettre à jour cette section (« Passage de relais ») pour dire que c'est en ligne, et la raccourcir.

## Structure

- `app/` : l'appli, servie telle quelle (PWA, JS vanilla en modules ES, **aucun framework, aucune étape de build**).
  - `index.html`, `styles.css`, `app.js` (écrans et interactions), `store.js` (localStorage), `pricing.js` (**calculs purs, sans DOM**).
  - `menu.json` : la carte (produits, prix, couleurs, image optionnelle, disponibilité). Doc : `app/MENU.md`.
  - `sw.js` : service worker (hors ligne). **Incrémenter `CACHE_VERSION` à chaque modification de l'appli** sinon les téléphones gardent l'ancienne version.
    `menu.json` est servi réseau d'abord (délai 2 s) avec repli sur le cache.
  - `manifest.webmanifest`, `icons/` (générées par `tools/make_icons.py`), `images/` (photos produits, voir `app/images/README.md`).
- `maquette/index.html` : maquette cliquable validée par Loïc (référence visuelle, ne pas modifier).
- `docs/BRAINSTORM.md` : besoin, parcours, règles de prix, plan en lots (tous faits), questions encore ouvertes.
- `tests/unit/` (node:test) : `pricing.test.js`, `menu.test.js` (vérifie la carte officielle). `tests/e2e/` (Playwright) : parcours, commande, réglages, hors ligne, mise en page.
- `.github/workflows/ci.yml` (tests sur PR et `main`), `.github/workflows/pages.yml` (tests unitaires puis déploiement de `app/` sur Pages, sur push `main`).

## Commandes

```
npm install
npm run serve      # http://localhost:8080 (python3 -m http.server sur app/)
npm test           # unitaires (71) + e2e Playwright (10), doit rester vert
```

En local, `playwright.config.js` utilise `/opt/pw-browsers/chromium` s'il existe (environnement cloud) ; sinon `npx playwright install chromium`.

## Règles métier (la carte officielle, vérifiée par `tests/unit/menu.test.js`)

- Bières : Heineken 25 cl 5 € ; Desperados Original, Desperados Rouge (33 cl), Guinness 33 cl, Corona 35 cl : 7 €.
- Softs 5 € : Coca-Cola, Schweppes (Tonic), Perrier, Red Bull, jus orange / pomme / ananas. Eau 50 cl : 3 €.
- Alcool au verre, sec : 10 € (vodka, rhum, tequila, gin, Get 27, Get 31, Jägermeister, Baileys, Red Label, J&B) ;
  Jack Daniel's 12 € ; Hennessy et Black Label 15 €. **Avec un soft : +5 €.**
  Caïpi maracuja 10 € et coupe de champagne 20 € : pas de question « avec un soft ».
- Bouteilles : 140 € (Hennessy, Black Label) ; 120 € (Moët, Jack Daniel's) ; 90 € (Vodka, Tequila, Rhum, Baileys, Gin, Jägermeister, Get 27, Get 31, Red Label, J&B).
  On choisit le nombre de verres (1 à 10) puis **5 softs inclus OU 1 bouteille de jus** (orange, pomme, ananas). Au-delà de 5 softs : +5 € par soft.
  Champagne Moët : nombre de flûtes, pas de softs.
- « William » ne fait pas partie de la carte (c'était une erreur).

## Conventions

- Toute règle de calcul va dans `app/pricing.js` (pure, avec JSDoc) et a son test unitaire.
- Changer un prix ou un produit : `app/menu.json` + mettre à jour `tests/unit/menu.test.js` si c'est la carte officielle qui change.
- Ne jamais désactiver ou sauter un test pour faire passer la CI ; pas de réessai automatique en CI (`retries: 0`).
- Commits en français. Garder le style visuel existant (tokens CSS en tête de `app/styles.css`, fond sombre, gros boutons, prix énormes).

## Pistes pour plus tard (non demandées)

- Photos des bouteilles du bar à ajouter dans `app/images/` (Loïc doit les prendre).
- Questions ouvertes à Loïc : paiement carte ou espèces seulement ? Plusieurs téléphones / serveurs ?
- Avertissement GitHub Actions : actions ciblant Node 20 (checkout@v4, configure-pages@v5…), à monter de version quand des versions Node 24 seront disponibles.
- Maquette publiée (privée) : https://claude.ai/artifact/5hUA5n3SBx7icxJLkYqSxf
