# Cosmo Commande : brainstorm

Appli pour prendre les commandes au **Cosmo** (boîte de nuit, Kourou, Guyane) quand on n'entend pas le client.

## Le problème

- Musique forte : on entend mal le nom de la boisson, et encore moins « avec ou sans soft ».
- Le client hésite ou ne connaît pas la carte.
- Les erreurs coûtent cher : mauvaise boisson servie, mauvais prix encaissé, mauvais rendu monnaie.

## L'idée

Le téléphone sert de **carte qu'on pointe du doigt**. On tourne l'écran vers le client, il montre ce qu'il veut,
on confirme en lui montrant le total en très gros. Zéro texte à lire de près.

## Principes de design

1. **Se lit à bout de bras, dans le noir.** Fond sombre (n'éblouit pas), textes et prix énormes, contrastes forts.
2. **Reconnaissance par la couleur et la forme, pas par la lecture.** Chaque marque garde sa couleur
   (Heineken vert + étoile rouge, Corona crème + couronne, Guinness noir + mousse, etc.).
3. **Le prix est toujours visible** sur la carte, sans tap supplémentaire.
4. **3 taps maximum** pour n'importe quelle boisson.
5. **Gros boutons** (au moins 56 px), utilisables avec les doigts mouillés ou un verre dans l'autre main.
6. **Marche sans réseau.** Le réseau en boîte est mauvais : l'appli doit fonctionner hors ligne.
7. **L'écran reste allumé** pendant le service.

## Parcours

```
Accueil : Bière · Soft · Alcool au verre · Bouteille
 ├─ Bière   → Heineken 5 € · Desperados 7 € · Guinness 7 € · Corona 7 €   (tap = +1)
 ├─ Soft    → Soda 5 € · Jus 5 € · Énergisant 5 € · Eau 3 €
 ├─ Alcool  → Vodka · Rhum · Whisky ▸ · Tequila · Gin · Hennessy · Get ▸ · Jäger · Baileys · Coupe champagne
 │             Whisky ▸ Red Label 10 · J&B 10 · William 10 · Jack Daniel's 12 · Black Label 15
 │             Get ▸ Get 27 · Get 31
 │             puis « Avec un soft ? »  →  Non, sec (prix alcool)  |  Oui (+5 €) → Coca, Sprite, Jus, Énergisant…
 │             (la coupe de champagne n'a pas la question du soft)
 └─ Bouteille → 140 € · 120 € · 90 €, rangées par prix
Barre du bas (toujours visible) : nb d'articles + total → Commande
Commande : +/− par ligne, total, « Montrer au client » (plein écran noir, total géant), « Encaisser »
Encaisser : on tape les billets reçus (5/10/20/50/100) → « À rendre » en gros → nouvelle commande
```

## Règle de prix des alcools au verre

| Alcool | Sec | Avec soft (+5 €) |
|---|---|---|
| Autres alcools (vodka, rhum, tequila, gin, Get, Jäger, Baileys, Red Label, J&B, William) | 10 € | 15 € |
| Jack Daniel's | 12 € | 17 € |
| Hennessy, Black Label | 15 € | 20 € |
| Coupe de champagne | 20 € | sans objet |

## Ce que fait la maquette (`maquette/index.html`)

Prototype cliquable complet, un seul fichier, sans dépendance : tous les écrans ci-dessus fonctionnent.
Une commande d'exemple (2 Heineken + 1 Vodka-Énergisant) est préchargée pour montrer la barre du bas.

## Questions ouvertes (à valider par Loïc)

1. **Softs servis avec l'alcool** : quelle liste exacte ? (maquette : Coca, Sprite, Jus d'orange, Jus d'ananas, Énergisant, Tonic)
2. **Softs seuls** : quelles marques de soda, de jus et d'énergisant (Red Bull ? Monster ?)
3. **« William »** : William Peel ou William Lawson's ?
4. **Bouteilles** : des softs sont-ils inclus avec une bouteille ? Prix des softs en plus ?
5. **Photos** : prendre en photo les bouteilles derrière le bar pour remplacer les pastilles de couleur (meilleure reconnaissance).
6. **Paiement** : uniquement espèces, ou carte aussi ? (garder ou non l'écran de rendu monnaie)
7. **Un seul téléphone** ou plusieurs serveurs ? (si plusieurs : historique / total de la soirée par serveur ?)

## Plan de réalisation (lots pour les sous-agents)

Stack proposée : **PWA statique** (HTML/CSS/JS sans framework, ou Vite + vanilla), installable sur l'écran d'accueil,
hors ligne via service worker, hébergée gratuitement (GitHub Pages). Pas de serveur, pas de compte.

1. **Lot 1 — Socle PWA** : découper la maquette en `index.html` + `styles.css` + `app.js`, `manifest.webmanifest`,
   icônes, service worker (cache complet), déploiement GitHub Pages.
2. **Lot 2 — Carte en données** : sortir la carte dans `menu.json` (familles, produits, prix, couleurs, image optionnelle,
   `noSoft`, supplément soft). Le rendu lit ce fichier.
3. **Lot 3 — Photos** : support d'une image par produit (`images/heineken.webp`…) avec repli sur la pastille couleur.
4. **Lot 4 — Écran réglages (protégé par code)** : modifier prix / activer-désactiver un produit en rupture,
   sauvegarde locale (localStorage).
5. **Lot 5 — Confort de service** : commande conservée si l'appli est fermée par erreur, vibration au tap,
   annuler le dernier ajout, mode gaucher (barre à gauche).
6. **Lot 6 — Tests** : tests unitaires des calculs (total, supplément soft, rendu monnaie) + test Playwright du parcours complet.
