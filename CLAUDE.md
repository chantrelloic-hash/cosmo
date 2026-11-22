# Cosmo Commande

Appli de prise de commande pour le **Cosmo**, boîte de nuit à Kourou (Guyane). Le serveur (Loïc) entend mal à cause de la musique :
il tourne l'écran du téléphone vers le client, qui montre du doigt sa boisson, puis on lui montre le total en très gros.
L'interface est en français par défaut, avec un choix de langue sur l'accueil (français, portugais du Brésil, anglais). Loïc n'est pas développeur : lui parler simplement, en français.

## Mise en ligne

**L'appli est en ligne** : https://chantrelloic-hash.github.io/cosmo/ (dépôt public, Pages source « GitHub Actions », déploiement automatique à chaque push sur `main`).
Vérifié le 22 novembre 2026 après la PR #6 (`CACHE_VERSION` v7, puis v8 lancement, v9 note partagée, en ligne le 22 novembre ; v10 : rendre la monnaie) : accueil avec « Les plus vendus » et « Pour l'équipe », calculatrice (bouteilles 120 €, tout tient sans défiler), ouverture (9 cartes), aucune erreur console ni ressource en erreur.
Une fusion dans `main` met en ligne tout de suite l'appli utilisée en service. **Loïc veut que chaque changement soit mis en ligne sans lui redemander** : dès que les tests (locaux et CI) sont verts, fusionner, puis vérifier le site.
Installation : iPhone, Safari → Partager → « Sur l'écran d'accueil » ; Android, Chrome → ⋮ → « Installer l'application ». Rappeler à Loïc de changer le code des réglages (appui long sur « COSMO », 1234 par défaut).

## Structure

- `app/` : l'appli, servie telle quelle (PWA, JS vanilla en modules ES, **aucun framework, aucune étape de build**).
  - `index.html`, `styles.css`, `app.js` (écrans et interactions), `store.js` (localStorage), `pricing.js` (**calculs purs, sans DOM**).
  - `ouverture.js` : les 9 étapes du pense-bête d'ouverture (dessins SVG, classes `o-`).
  - `i18n.js` : tous les textes affichés, en `fr`, `pt` (Brésil) et `en`. **Tout nouveau texte passe par `i18n.js` dans les 3 langues** (vérifié par `tests/unit/i18n.test.js`).
  - `menu.json` : la carte (produits, prix, couleurs, image optionnelle, disponibilité, `favorites` = « Les plus vendus » de l'accueil). Doc : `app/MENU.md`.
  - `sw.js` : service worker (hors ligne). **Incrémenter `CACHE_VERSION` à chaque modification de l'appli** sinon les téléphones gardent l'ancienne version.
    `menu.json` est servi réseau d'abord (délai 2 s) avec repli sur le cache.
  - `manifest.webmanifest`, `icons/` (générées par `tools/make_icons.py`), `images/` (photos produits WebP < 40 Ko, voir `app/images/README.md` ; **crédits obligatoires dans `app/images/CREDITS.md`**, Open Food Facts CC-BY-SA 3.0 + photos du Cosmo ; générées par `tools/fetch_product_images.py`).
- `maquette/index.html` : maquette cliquable validée par Loïc au départ (référence historique, ne pas modifier ; elle n'a ni favoris, ni photos, ni langues).
- `docs/BRAINSTORM.md` : besoin, parcours, règles de prix, plan en lots (tous faits), questions encore ouvertes.
- `tests/unit/` (node:test) : `pricing.test.js`, `menu.test.js` (carte officielle, favoris, images, crédits), `i18n.test.js`. `tests/e2e/` (Playwright) : parcours, commande, favoris, langue, réglages, hors ligne, mise en page, équipe (lancement, calculatrice, ouverture).
  Les tests e2e bloquent les polices Google : vérifier aussi le rendu avec la vraie police (Unbounded, plus large) avant une mise en ligne qui touche aux textes.
- `.github/workflows/ci.yml` (tests sur PR et `main`), `.github/workflows/pages.yml` (tests unitaires puis déploiement de `app/` sur Pages, sur push `main`).

## Commandes

```
npm install
npm run serve      # http://localhost:8080 (python3 -m http.server sur app/)
npm test           # unitaires (113) + e2e Playwright (33), doit rester vert
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

## Lancement : 4 grands boutons

- Au lancement (et à chaque rechargement), l'appli affiche la page **« Que veux-tu faire ? »** (vue `launch`) : **Prise de commande** (l'écran client ci-dessous ; une commande en cours s'y voit : articles · total), **Calculatrice**, **Rendre la monnaie** (« À payer · total » si commande), **Ouverture du Cosmo** (avancement x / 9). Sur les écrans courts (< 780 px de haut), les sous-titres sont masqués pour que les 4 tiennent. Pas de barre du bas ni de bouton calculatrice dans l'en-tête sur cette page, qui tient sur un écran sans défiler.
- La pile des écrans commence par `launch` ; `home()` ramène à l'écran client (`[launch, home]`), « Retour » depuis l'écran client ramène au lancement.

## Accueil client : les plus vendus et la commande en cours

- L'accueil montre d'abord « Les plus vendus » (`favorites` dans `menu.json` : Heineken, Desperados, Desperados Rouge en 1 tap ; Rhum et Vodka : « avec quoi ? » puis quantité 1 à 6), puis « Toute la carte » (les 4 familles), puis la section **« Commande en cours »** (lignes avec − / +, total énorme, « Montrer au client », « Encaisser », « Vider »).
- Sur l'accueil la barre du bas est une petite barre (articles + total) qui défile vers « Commande en cours » et se masque quand cette section est visible ; sur les autres écrans, la barre détaillée ouvre l'écran Commande.
- Marques servies au bar (photos du client) : vodka Eristoff, gin Bombay London Dry, tequila Camino Real, rhum Saint James Royal Blanc (d'autres rhums au bar, mais pas de choix de marque dans l'appli), Hennessy VS, Get 27 / 31, Baileys, Jägermeister. Ne pas ajouter de produit hors carte officielle (Malibu, Martini, Campari, Ricard...).
- Le service worker précache toutes les images référencées par `menu.json` (cache `cosmo-images`, non vidé par `CACHE_VERSION` : pour remplacer une photo, lui donner un nouveau nom de fichier).

## Calculatrice et pense-bête d'ouverture

- Accès : depuis la page de lancement, et bouton calculatrice dans l'en-tête (sur tous les écrans sauf le lancement).
- **Une seule note par client, partagée** : chaque prix tapé sur la calculatrice est une ligne de la commande en cours (clé `calc:<prix>`, libellé « Calculatrice », sous-titre le prix), avec − / + comme les boissons ; la calculatrice affiche le total de toute la commande et rappelle en haut les boissons et prix déjà pris. **Un seul bouton de remise à zéro, « Nouveau client »**, en haut de l'écran client (en-tête) et de la calculatrice : vide tout, sans confirmation (choix de Loïc). Plus de « Vider » ni « Effacer » ailleurs. « Annuler » de la calculatrice retire seulement le dernier prix tapé sur la calculatrice (`undoCalc`), jamais une boisson.
- **Calculatrice** (plein écran, `#calc`) : une touche par tarif de la carte, calculée par `priceKeys` (`pricing.js`) depuis la carte + réglages, avec le rappel des produits à ce prix ; les 3 prix de bouteilles sont réunis sur une touche « Bouteilles » qui ouvre le choix 90 / 120 / 140 € (retour automatique aux touches après le choix, pas de bouton retour ; « Annuler » referme le choix sans rien retirer). Pas de saisie libre. **Tout tient sur un écran sans défiler** (touches en lignes `1fr`, resserrées par `fitCalc` si un texte déborde ; vérifié en e2e jusqu'à 320×568).
- **Ouverture du Cosmo** : 9 étapes à cocher (volet après l'arrivée d'au moins 1 agent de sécurité, barrière, disjoncteurs à flèche rose, 2 boîtiers clim, 2 clims à la télécommande, écran des tarifs USB → « tarif » → pause, désodorisant + 2 WC, gobelets/pailles/bougies + réserve, pièces de caisse + SumUp en charge). Cases gardées sur le téléphone (`cosmo.opening.v1`) jusqu'à « Recommencer ».

## Rendre la monnaie

- Plein écran (`#change`, même cadre que la calculatrice), ouvert par le 4e bouton du lancement et par « Encaisser » (l'ancien écran `cash` est supprimé). **À payer = total de la commande partagée** (écran client + calculatrice).
- On touche ce que le client donne : billets 5 / 10 / 20 / 50 / 100 € et pièces 1 / 2 € (dessinés en CSS aux couleurs réelles, nombre de chaque en pastille) ; « Annuler » retire le dernier ; état « Il manque x € » / « C'est bon ». « Valider » (actif seulement si reçu ≥ à payer) affiche **À rendre** en énorme et le détail en billets de **20 / 10 / 5** et pièces de **2 / 1** seulement (`changeBreakdown`, `pricing.js`). « Corriger » revient à la saisie ; **« Terminé » remet tout à zéro (comme « Nouveau client ») et revient au lancement.**
- Tout tient sur un écran (vérifié en e2e et de 320×568 à 430×932).

## Conventions

- Toute règle de calcul va dans `app/pricing.js` (pure, avec JSDoc) et a son test unitaire.
- Changer un prix ou un produit : `app/menu.json` + mettre à jour `tests/unit/menu.test.js` si c'est la carte officielle qui change.
- Ne jamais désactiver ou sauter un test pour faire passer la CI ; pas de réessai automatique en CI (`retries: 0`).
- Commits en français. Garder le style visuel existant (tokens CSS en tête de `app/styles.css`, fond sombre, gros boutons, prix énormes).

## Pistes pour plus tard (non demandées)

- Photos manquantes ou sombres (liste dans `docs/BRAINSTORM.md`) : Loïc doit les prendre de face, sur fond uni.
- Proposé à Loïc, pas encore demandé : bouton « Payé par carte » (terminal SumUp au bar) ; bouteilles hors carte (Malibu, Martini, Campari, Ricard, Captain Morgan, Bacardi, La Belle Cabresse) à ajouter seulement avec leurs prix ; confirmation sur « Nouveau client » (refusée pour l'instant).
- Question ouverte : plusieurs téléphones / serveurs ?
- Avertissement GitHub Actions : actions ciblant Node 20 (checkout@v4, configure-pages@v5…), à monter de version quand des versions Node 24 seront disponibles.
- Maquette publiée (privée) : https://claude.ai/artifact/5hUA5n3SBx7icxJLkYqSxf
