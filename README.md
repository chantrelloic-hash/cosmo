# Cosmo Commande

Petite appli pour prendre les commandes au **Cosmo** (Kourou) quand la musique est trop forte pour s'entendre.
On tourne l'écran vers le client, il montre la boisson du doigt, et l'appli calcule le total et le rendu de monnaie.
Elle s'installe sur l'écran d'accueil du téléphone, **marche sans réseau**, et existe en **français, portugais (Brésil) et anglais**.

**Adresse : https://chantrelloic-hash.github.io/cosmo/**

À chaque fusion dans `main`, l'appli est testée puis publiée toute seule à cette adresse (1 à 2 minutes).
Si les tests échouent, rien n'est publié.

## Installer sur le téléphone

- **iPhone** : ouvrir l'adresse dans **Safari** → bouton **Partager** → **Sur l'écran d'accueil**.
- **Android** : ouvrir l'adresse dans **Chrome** → menu **⋮** → **Installer l'application** (ou **Ajouter à l'écran d'accueil**).

Ouvrir l'appli une fois avec du réseau : ensuite elle fonctionne sans connexion.
Après une mise à jour, fermer complètement l'appli puis la rouvrir avec du réseau (une ou deux fois) pour récupérer la nouvelle version.

## Utilisation en service

L'accueil, de haut en bas :

1. **La langue** (drapeaux) : français, portugais, anglais. Le choix est gardé.
2. **Les plus vendus**, avec les photos des bouteilles :
   - **Heineken, Desperados, Desperados Rouge** : chaque touche ajoute 1 bière, on reste sur l'accueil.
   - **Rhum** : « Coca-Cola », « Autre soft » ou « Rien (sec) », puis **Combien ?** (1 à 6, le prix est écrit sur chaque bouton) → retour à l'accueil.
   - **Vodka** : pareil, avec « Red Bull », « Jus de pomme », « Autre soft » ou « Rien (sec) ».
3. **Toute la carte** : Bière, Soft, Alcool au verre (avec ou sans soft, +5 €), Bouteille (nombre de verres, puis 5 softs ou 1 bouteille de jus).
4. **Commande en cours** : chaque ligne avec **−** et **+**, le **total** en gros, puis :
   - **Montrer au client** : le total en très gros sur fond noir ;
   - **Encaisser** : toucher les billets reçus, l'appli affiche la monnaie à rendre, puis **Terminé** vide la commande ;
   - **Vider** : efface la commande.

Après chaque ajout, **Annuler** apparaît en bas pendant 3 secondes (il retire tout l'ajout, par exemple les 3 rhums d'un coup).
La commande reste en mémoire si l'appli est fermée par erreur. L'écran reste allumé pendant le service.

## Réglages (prix, ruptures)

**Appui long (1 seconde) sur le mot COSMO** en haut de l'écran, puis le code. Le code par défaut est **1234** :
pensez à le **changer** (Réglages → Changer le code). On peut y modifier un prix, marquer un produit en rupture
(il reste affiché, grisé, avec « Rupture »), changer le supplément soft, passer en mode gaucher, et « Remettre la carte d'origine ».
Ces réglages ne valent que pour le téléphone sur lequel on les fait.

## Changer la carte

Voir [`app/MENU.md`](app/MENU.md) (prix, boissons, « Les plus vendus »).

## Photos des bouteilles

Voir [`app/images/README.md`](app/images/README.md). Sources et licences : [`app/images/CREDITS.md`](app/images/CREDITS.md)
(Open Food Facts, CC-BY-SA 3.0, et photos prises au Cosmo).

## Pour les développeurs

Appli statique : HTML/CSS/JS sans framework ni étape de build, dans `app/`. Les calculs sont dans `app/pricing.js`,
les textes traduits dans `app/i18n.js`.

```bash
npm install        # installe Playwright (seule dépendance)
npm run serve      # sert app/ sur http://localhost:8080
npm test           # tests unitaires (node:test) + tests de bout en bout (Playwright)
```

- `npm run test:unit` : calculs de prix, traductions et validation de `menu.json` (`tests/unit/`).
- `npm run test:e2e` : parcours complets sur un viewport de téléphone (`tests/e2e/`). Il faut un Chromium :
  `npx playwright install chromium` (en local, si `/opt/pw-browsers/chromium` existe il est utilisé).
- Après toute modification des fichiers de `app/` (hors `menu.json`), incrémenter `CACHE_VERSION` dans `app/sw.js` pour que les téléphones se mettent à jour.
- Intégration continue : `.github/workflows/ci.yml` ; mise en ligne : `.github/workflows/pages.yml`.
- Contexte, règles de prix et conventions : [`CLAUDE.md`](CLAUDE.md) ; historique des choix : [`docs/BRAINSTORM.md`](docs/BRAINSTORM.md).
