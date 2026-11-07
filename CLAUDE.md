# Cosmo Commande

Appli de prise de commande pour le **Cosmo**, boîte de nuit à Kourou (Guyane). Le serveur (Loïc) entend mal à cause de la musique :
il tourne l'écran du téléphone vers le client, qui montre du doigt sa boisson, puis on lui montre le total en très gros.
Tout l'interface est **en français**. Loïc n'est pas développeur : lui parler simplement, en français.

## Mise en ligne

**L'appli est en ligne** : https://chantrelloic-hash.github.io/cosmo/ (dépôt public, Pages source « GitHub Actions », déploiement automatique à chaque push sur `main`).
Vérifié le 1er novembre 2026 : page et `menu.json` répondent 200, accueil Bière / Soft / Alcool au verre / Bouteille, aucune erreur console.
Installation : iPhone, Safari → Partager → « Sur l'écran d'accueil » ; Android, Chrome → ⋮ → « Installer l'application ». Rappeler à Loïc de changer le code des réglages (appui long sur « COSMO », 1234 par défaut).

## Structure

- `app/` : l'appli, servie telle quelle (PWA, JS vanilla en modules ES, **aucun framework, aucune étape de build**).
  - `index.html`, `styles.css`, `app.js` (écrans et interactions), `store.js` (localStorage), `pricing.js` (**calculs purs, sans DOM**).
  - `menu.json` : la carte (produits, prix, couleurs, image optionnelle, disponibilité, `favorites` = « Les plus vendus » de l'accueil). Doc : `app/MENU.md`.
  - `sw.js` : service worker (hors ligne). **Incrémenter `CACHE_VERSION` à chaque modification de l'appli** sinon les téléphones gardent l'ancienne version.
    `menu.json` est servi réseau d'abord (délai 2 s) avec repli sur le cache.
  - `manifest.webmanifest`, `icons/` (générées par `tools/make_icons.py`), `images/` (photos produits WebP < 40 Ko, voir `app/images/README.md` ; **crédits obligatoires dans `app/images/CREDITS.md`**, Open Food Facts CC-BY-SA 3.0 + photos du Cosmo ; générées par `tools/fetch_product_images.py`).
- `maquette/index.html` : maquette cliquable validée par Loïc (référence visuelle, ne pas modifier).
- `docs/BRAINSTORM.md` : besoin, parcours, règles de prix, plan en lots (tous faits), questions encore ouvertes.
- `tests/unit/` (node:test) : `pricing.test.js`, `menu.test.js` (vérifie la carte officielle). `tests/e2e/` (Playwright) : parcours, commande, réglages, hors ligne, mise en page.
- `.github/workflows/ci.yml` (tests sur PR et `main`), `.github/workflows/pages.yml` (tests unitaires puis déploiement de `app/` sur Pages, sur push `main`).

## Commandes

```
npm install
npm run serve      # http://localhost:8080 (python3 -m http.server sur app/)
npm test           # unitaires (96) + e2e Playwright (24), doit rester vert
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

## Accueil : les plus vendus et la commande en cours

- L'accueil montre d'abord « Les plus vendus » (`favorites` dans `menu.json` : Heineken, Desperados, Desperados Rouge en 1 tap ; Rhum et Vodka : « avec quoi ? » puis quantité 1 à 6), puis « Toute la carte » (les 4 familles), puis la section **« Commande en cours »** (lignes avec − / +, total énorme, « Montrer au client », « Encaisser », « Vider »).
- Sur l'accueil la barre du bas est une petite barre (articles + total) qui défile vers « Commande en cours » et se masque quand cette section est visible ; sur les autres écrans, la barre détaillée ouvre l'écran Commande.
- Marques servies au bar (photos du client) : vodka Eristoff, gin Bombay London Dry, tequila Camino Real, rhum Saint James Royal Blanc (d'autres rhums au bar, mais pas de choix de marque dans l'appli), Hennessy VS, Get 27 / 31, Baileys, Jägermeister. Ne pas ajouter de produit hors carte officielle (Malibu, Martini, Campari, Ricard...).
- Le service worker précache toutes les images référencées par `menu.json`.

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
