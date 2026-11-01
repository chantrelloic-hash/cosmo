# Photos des produits

Une photo par produit, affichée sur la carte au-dessus du nom (sur le fond de couleur de la marque).
Sans photo, la carte garde son picto d'origine.

- **Format** : WebP (idéal) ou JPG, environ **400 px de hauteur**, fond détouré (WebP/PNG transparent) ou neutre, **moins de 80 Ko** par image.
- **Nom du fichier** : l'`id` du produit dans `menu.json`, en minuscules : `heineken.webp`, `desperados-rouge.webp`, `vodka.webp`...
- **Renseigner la photo** : dans `menu.json`, sur le produit, remplacer `"image": null` par le chemin relatif :

  ```json
  "image": "images/heineken.webp"
  ```

- Fonctionne pour les bières, softs, alcools au verre et bouteilles.
- Si le fichier est absent ou illisible, la carte retombe silencieusement sur le picto.
- Les photos sont mises en cache par le service worker à la première utilisation : elles marchent ensuite hors ligne. Ce cache n'est pas vidé par `CACHE_VERSION` : pour remplacer une photo, lui donner un nouveau nom de fichier (ex. `heineken-2.webp`) et mettre à jour `image` dans `menu.json`.
