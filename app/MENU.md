# Format de `menu.json`

Toute la carte est dans `menu.json`. L'appli le lit au démarrage : aucun code à toucher pour changer un prix ou une boisson.

## Changer un prix

1. Ouvrir `menu.json`, trouver le produit (chercher son nom), modifier `"price"`.
2. Incrémenter `CACHE_VERSION` dans `sw.js` (`'v1'` devient `'v2'`) : sans cela, les téléphones gardent l'ancienne carte en cache.
3. Publier. Les téléphones se mettent à jour à la prochaine ouverture avec du réseau.

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

Communs à tous : `id` (unique, stable, ne jamais le réutiliser), `name`, `image` (`null` pour l'instant, réservé aux photos), `available` (`false` = masqué de la carte, par exemple en rupture).

- **Bière / soft** : `size` (sous-titre), `price`, `bg` (couleur de fond), `fg` (couleur du texte), `logo` (`star`, `d`, `dred`, `foam`, `crown`, `bubbles`, `slice`, `bolt`, `drop`), `wide` (carte pleine largeur), `label` (nom complet affiché dans la commande, sinon `name`).
- **Alcool au verre** : `price`, `liquid` (couleur du liquide), `short` (nom court pour la commande), `note` (texte sous le nom), `noSoft: true` (pas de question « avec un soft ? »), `wide`, `glass: "flute"`.
  - Un alcool à sous-choix n'a pas de `price` : il a `children`, une liste de produits (`id`, `name`, `price`, `liquid` facultatif). Exemple : Whisky, Get.
- **Bouteille** : `id`, `name`, `champagne: true` (on demande des flûtes, pas de softs).

## Ajouter une boisson

1. Copier une ligne existante de la même famille dans `menu.json`, lui donner un nouvel `id` unique, un `name`, un `price` et des couleurs.
2. Pour une bouteille, l'ajouter dans le bon palier de `bottles`, ou créer un nouveau palier.
3. Incrémenter `CACHE_VERSION` dans `sw.js`.

Attention au JSON : virgule entre les éléments, pas de virgule après le dernier, guillemets droits `"` autour des textes (apostrophes typographiques `’` autorisées dans les textes).
