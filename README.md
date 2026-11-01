# Cosmo Commande

Petite appli pour prendre les commandes au **Cosmo** (Kourou) quand la musique est trop forte pour s'entendre.
On tourne l'écran vers le client, il montre la boisson du doigt, et l'appli calcule le total et le rendu de monnaie.
Elle s'installe sur l'écran d'accueil du téléphone et **marche sans réseau**.

Adresse prévue : https://chantrelloic-hash.github.io/cosmo/

## Mettre l'appli en ligne (une seule étape pour Loïc)

1. Sur GitHub, ouvrir le dépôt **cosmo** → **Settings** → **Pages** → **Source** : choisir **« GitHub Actions »**.
2. Fusionner la Pull Request dans `main`.

C'est tout : à chaque fusion dans `main`, l'appli est testée puis publiée toute seule à l'adresse ci-dessus
(compter 1 à 2 minutes). Si les tests échouent, rien n'est publié.

## Installer sur le téléphone

- **iPhone** : ouvrir l'adresse dans **Safari** → bouton **Partager** → **Sur l'écran d'accueil**.
- **Android** : ouvrir l'adresse dans **Chrome** → menu **⋮** → **Installer l'application** (ou **Ajouter à l'écran d'accueil**).

Ouvrir l'appli une fois avec du réseau : ensuite elle fonctionne sans connexion.

## Utilisation en service

Choisir la catégorie (Bière, Soft, Alcool au verre, Bouteille), toucher les boissons : chaque touche ajoute 1.
La barre du bas montre le total ; **Annuler** (en bas, pendant 3 secondes) retire le dernier ajout.
Dans la commande : **Montrer au client** affiche le total en gros, **Encaisser** calcule le rendu de monnaie
(toucher les billets reçus), puis **Terminé** vide la commande. La commande reste en mémoire si l'appli est fermée par erreur.

## Réglages (prix, ruptures)

**Appui long (1 seconde) sur le mot COSMO** en haut de l'écran, puis le code. Le code par défaut est **1234** :
pensez à le **changer** (Réglages → Changer le code). On peut y modifier un prix, marquer un produit en rupture,
changer le supplément soft, et « Remettre la carte d'origine ».

## Changer la carte

Voir [`app/MENU.md`](app/MENU.md).

## Ajouter des photos

Voir [`app/images/README.md`](app/images/README.md).

## Pour les développeurs

Appli statique : HTML/CSS/JS sans framework ni étape de build, dans `app/`. Les calculs sont dans `app/pricing.js`.

```bash
npm install        # installe Playwright (seule dépendance)
npm run serve      # sert app/ sur http://localhost:8080
npm test           # tests unitaires (node:test) + tests de bout en bout (Playwright)
```

- `npm run test:unit` : calculs de prix et validation de `menu.json` (`tests/unit/`).
- `npm run test:e2e` : parcours complets sur un viewport de téléphone (`tests/e2e/`). Il faut un Chromium :
  `npx playwright install chromium` (en local, si `/opt/pw-browsers/chromium` existe il est utilisé).
- Après toute modification des fichiers de `app/`, incrémenter `CACHE_VERSION` dans `app/sw.js` pour que les téléphones se mettent à jour.
- Intégration continue : `.github/workflows/ci.yml` ; mise en ligne : `.github/workflows/pages.yml`.
- Règles de prix et plan : [`docs/BRAINSTORM.md`](docs/BRAINSTORM.md).
