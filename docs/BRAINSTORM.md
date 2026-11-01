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
 ├─ Bière   → Heineken 5 € · Desperados Original 7 € · Desperados Rouge 7 € · Guinness 7 € · Corona 7 €   (tap = +1)
 ├─ Soft    → Coca-Cola · Schweppes Tonic · Perrier · Jus d'orange · Jus de pomme · Jus d'ananas · Red Bull (5 €) · Eau 50 cl (3 €)
 ├─ Alcool  → Vodka · Rhum · Whisky ▸ · Tequila · Gin · Hennessy · Get ▸ · Jäger · Baileys · Caïpi maracuja · Coupe champagne
 │             Whisky ▸ Red Label 10 · J&B 10 · Jack Daniel's 12 · Black Label 15
 │             Get ▸ Get 27 · Get 31
 │             puis « Avec un soft ? »  →  Non, sec (prix alcool)  |  Oui (+5 €) → un des 7 softs (tous sauf l'eau)
 │             (la caïpi maracuja 10 € et la coupe de champagne n'ont pas la question du soft)
 └─ Bouteille → 140 € · 120 € · 90 €, rangées par prix
               puis « Combien de verres ? » (1 à 10, 4 par défaut)
               puis « Inclus avec la bouteille » : 5 softs au choix  OU  1 bouteille de jus
                 - 5 softs : chaque tap sur un soft ajoute 1 (ex. 2 Coca-Cola + 1 Red Bull) ;
                   à partir du 6e, +5 € par soft (compteur « 3/5 » qui passe en orange au-delà)
                 - 1 bouteille de jus : orange, pomme ou ananas (bouton « Ajouter » bloqué tant que le jus n'est pas choisi)
               (Champagne Moët : on demande le nombre de flûtes, pas de softs)
               Ligne de commande : « Bouteille Vodka · 6 verres · 2 Coca-Cola, 1 Red Bull · 90 € »
Barre du bas (toujours visible) : nb d'articles + total → Commande
Commande : +/− par ligne, total, « Montrer au client » (plein écran noir, total géant), « Encaisser »
Encaisser : on tape les billets reçus (5/10/20/50/100) → « À rendre » en gros → nouvelle commande
```

## Règle de prix des alcools au verre

| Alcool | Sec | Avec soft (+5 €) |
|---|---|---|
| Autres alcools (vodka, rhum, tequila, gin, Get, Jäger, Baileys, Red Label, J&B) | 10 € | 15 € |
| Jack Daniel's | 12 € | 17 € |
| Hennessy, Black Label | 15 € | 20 € |
| Caïpi maracuja (cocktail maison) | 10 € | sans objet |
| Coupe de champagne | 20 € | sans objet |

## Ce que fait la maquette (`maquette/index.html`)

Prototype cliquable complet, un seul fichier, sans dépendance : tous les écrans ci-dessus fonctionnent.
Une commande d'exemple (2 Heineken + 1 Vodka-Énergisant) est préchargée pour montrer la barre du bas.

## Questions ouvertes (à valider par Loïc)

Réglé : liste des softs (Perrier, Coca-Cola, Red Bull, Schweppes Tonic, jus orange/pomme/ananas), Desperados Original et Rouge à 7 €,
bouteille = nombre de verres + (5 softs ou 1 bouteille de jus) inclus, +5 € par soft au-delà de 5,
« William » retiré de la carte (c'était une erreur).

1. **Photos** : prendre en photo les bouteilles derrière le bar pour remplacer les pastilles de couleur (meilleure reconnaissance).
2. **Paiement** : uniquement espèces, ou carte aussi ? (garder ou non l'écran de rendu monnaie)
3. **Un seul téléphone** ou plusieurs serveurs ? (si plusieurs : historique / total de la soirée par serveur ?)

## Plan de réalisation (lots pour les sous-agents)

Stack proposée : **PWA statique** (HTML/CSS/JS sans framework, ou Vite + vanilla), installable sur l'écran d'accueil,
hors ligne via service worker, hébergée gratuitement (GitHub Pages). Pas de serveur, pas de compte.

1. **Lot 1 — Socle PWA** : découper la maquette en `index.html` + `styles.css` + `app.js`, `manifest.webmanifest`,
   icônes, service worker (cache complet), déploiement GitHub Pages.
2. **Lot 2 — Carte en données** : sortir la carte dans `menu.json` (familles, produits, prix, couleurs, image optionnelle,
   `noSoft`, supplément soft). Le rendu lit ce fichier.
3. **Lot 3 — Photos (fait)** : support d'une image par produit (`images/heineken.webp`…) avec repli sur la pastille couleur.
4. **Lot 4 — Écran réglages protégé par code (fait)** : modifier prix / activer-désactiver un produit en rupture,
   sauvegarde locale (localStorage).
   *Réalisé* : appui long sur le logo, code 4 chiffres (1234 par défaut), rupture = carte grisée « Rupture », prix, supplément soft,
   softs inclus, bouton « Remettre la carte d'origine ». Surcouches dans `cosmo.overrides.v1` (voir `app/MENU.md`).
5. **Lot 5 — Confort de service (fait)** : commande conservée si l'appli est fermée par erreur, vibration au tap,
   annuler le dernier ajout, mode gaucher (barre à gauche).
   *Réalisé* : commande dans `cosmo.order.v1`, vibration 15 ms, « Annuler » dans le toast (3 s), mode gaucher dans les réglages.
6. **Lot 6 — Tests** : tests unitaires des calculs (total, supplément soft, rendu monnaie) + test Playwright du parcours complet.
