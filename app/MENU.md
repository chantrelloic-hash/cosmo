# Format de `menu.json`

Toute la carte est dans `menu.json`. L'appli le lit au démarrage : aucun code à toucher pour changer un prix ou une boisson.

## Deux façons de changer la carte

**1. Sur le téléphone (réglages, pour le service)** : prix, rupture de stock, supplément soft. Immédiat, sans publier.

- Appui long (~1 s) sur le logo COSMO en haut, puis le code à 4 chiffres (1234 par défaut, modifiable dans les réglages).
- Pour chaque produit : interrupteur « Disponible » (éteint = la carte reste affichée, grisée avec « Rupture », non cliquable) et prix (entier).
- Aussi : supplément soft, nombre de softs inclus avec une bouteille, mode gaucher, changement de code, « Remettre la carte d'origine » (avec confirmation).
- Ces réglages sont des **surcouches** stockées dans le téléphone (`localStorage`, clé `cosmo.overrides.v1`) et appliquées par-dessus `menu.json`. Elles ne sont **pas** partagées entre téléphones, et un prix mis dans `menu.json` ne passe pas sur un téléphone qui a déjà une surcouche pour ce produit (utiliser « Remettre la carte d'origine » ou corriger dans les réglages).
- Si le stockage du téléphone est indisponible, l'appli marche avec la carte d'origine (et les réglages ne sont pas conservés).

**2. Dans `menu.json` (changement durable pour tous les téléphones)** :

1. Ouvrir `menu.json`, trouver le produit (chercher son nom), modifier `"price"`.
2. Publier. **Pas besoin d'incrémenter `CACHE_VERSION`** : `menu.json` est servi réseau d'abord (délai max 2 s, puis copie en cache), donc un téléphone en ligne récupère la nouvelle carte à sa prochaine ouverture, et un téléphone hors ligne garde la dernière carte reçue. L'appli reste 100 % utilisable sans réseau.
3. N'incrémenter `CACHE_VERSION` dans `sw.js` (`'v2'` devient `'v3'`) que si l'on change le code de l'appli (HTML, CSS, JS) ou la liste des fichiers du précache.

## Structure

| Clé | Rôle |
|---|---|
| `softSupplement` | Supplément (en €) quand un alcool au verre est servi avec un soft, et par soft au-delà des softs inclus d'une bouteille (5). |
| `bottleIncludedSofts` | Nombre de softs inclus avec une bouteille (5). |
| `beers` | Bières. |
| `softs` | Softs. `"mixer": true` = proposé comme mélange avec un alcool ou une bouteille (tous sauf l'eau). |
| `bottleJuices` | Liste d'`id` de softs proposés en « 1 bouteille de jus » avec une bouteille (`orange`, `pomme`, `ananas`). |
| `spirits` | Alcools au verre. Prix = prix sec ; avec soft = prix + `softSupplement`. |
| `bottles` | Paliers de prix : `{ "price": 90, "items": [ ... ] }`. |

## Champs d'un produit

Communs à tous : `id` (unique, stable, ne jamais le réutiliser), `name`, `image` (`null` = picto d'origine ; sinon chemin relatif d'une photo, voir ci-dessous), `available` (`false` = masqué de la carte pour tous ; pour une rupture temporaire, utiliser les réglages du téléphone : le produit reste affiché grisé).

- **Bière / soft** : `size` (sous-titre), `price`, `bg` (couleur de fond), `fg` (couleur du texte), `logo` (`star`, `d`, `dred`, `foam`, `crown`, `bubbles`, `slice`, `bolt`, `drop`), `wide` (carte pleine largeur), `label` (nom complet affiché dans la commande, sinon `name`).
- **Alcool au verre** : `price`, `liquid` (couleur du liquide), `short` (nom court pour la commande), `note` (texte sous le nom), `noSoft: true` (pas de question « avec un soft ? »), `wide`, `glass: "flute"`.
  - Un alcool à sous-choix n'a pas de `price` : il a `children`, une liste de produits (`id`, `name`, `price`, `liquid` facultatif). Exemple : Whisky, Get.
- **Bouteille** : `id`, `name`, `champagne: true` (on demande des flûtes, pas de softs).

## Photos

Mettre le fichier dans `images/` (nom = `id` du produit, voir `images/README.md`) et renseigner `"image": "images/heineken.webp"`. La photo remplace le picto, sur le fond de couleur de la marque ; si elle ne charge pas, le picto revient. Les photos sont mises en cache à la première utilisation (hors ligne ensuite) ; pour en changer une, lui donner un nouveau nom de fichier.

## Ajouter une boisson

1. Copier une ligne existante de la même famille dans `menu.json`, lui donner un nouvel `id` unique, un `name`, un `price` et des couleurs.
2. Pour une bouteille, l'ajouter dans le bon palier de `bottles`, ou créer un nouveau palier.

Attention au JSON : virgule entre les éléments, pas de virgule après le dernier, guillemets droits `"` autour des textes (apostrophes typographiques `’` autorisées dans les textes).
