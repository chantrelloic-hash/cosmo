/* Langues de l'écran client : français (par défaut), portugais du Brésil, anglais.
   Pur (sans DOM). `t` traduit l'interface ; `w` traduit les textes de la carte (menu.json, en français) :
   un texte absent du dictionnaire reste en français. Les réglages, l'écran de commande et l'encaissement
   restent en français (outils du serveur). */

export const LANGS = ['fr', 'pt', 'en'];
export const DEFAULT_LANG = 'fr';
export const LANG_NAMES = { fr: 'Français', pt: 'Português (Brasil)', en: 'English' };
export const HTML_LANG = { fr: 'fr', pt: 'pt-BR', en: 'en' };

export const isLang = x => LANGS.includes(x);

/* Interface. Une valeur peut être une fonction (textes avec nombres). Les textes de type HTML
   (balises, &nbsp;) sont des constantes de ce fichier, jamais des données saisies. */
const UI = {
  fr: {
    askDrink: 'Qu’est-ce que tu bois&nbsp;?',
    hintHome: 'Tourne l’écran vers le client : il montre du doigt.',
    catBeer: 'Bière', catSoft: 'Soft', catSpirit: 'Alcool au verre', catBottle: 'Bouteille',
    beersH1: 'Bières', beersHint: 'En bouteille. Touche plusieurs fois pour en ajouter plusieurs.',
    softsH1: 'Softs', softsHint: 'Sans alcool.',
    spiritsH1: 'Alcool au verre',
    spiritsHint: sup => `Prix sans soft. Avec un soft : <b style="color:var(--soft)">+${sup}&nbsp;€</b>`,
    withSoft: 'avec soft', choices: n => `${n} choix`, aloneDefault: 'Servie seule',
    whichBrand: 'Quelle marque&nbsp;?',
    askMixer: label => `${label} : <em>avec un soft</em>&nbsp;?`,
    noDry: 'Non, sec', justSpirit: 'Juste l’alcool', yesWith: 'Oui, avec', dry: 'sec',
    bottlesH1: 'Bouteilles', bottlesHint: 'Ensuite : nombre de verres et softs.', perBottle: 'la bouteille',
    bottleWord: 'Bouteille',
    included: 'Inclus avec la bouteille', softsN: n => `${n} softs`, ofChoice: 'au choix',
    oneBottle: '1 bouteille', ofJuice: 'de jus', whichJuice: 'Quel jus&nbsp;?', softsLabel: 'Softs',
    clear: 'Effacer',
    tapMany: (n, sup) => `Touche plusieurs fois pour en mettre plusieurs. Au-delà de ${n} : +${sup}&nbsp;€ par soft.`,
    extraMore: (n, amount) => `${n} en plus : +${amount}`,
    softsOrJuice: n => ` · ${n} softs ou 1 bouteille de jus inclus`,
    howManyGlasses: 'Combien de verres&nbsp;?', howManyFlutes: 'Combien de flûtes&nbsp;?',
    addBottle: price => `Ajouter la bouteille · ${price}`, chooseJuice: 'Choisis le jus',
    glass: n => `${n} verre${n > 1 ? 's' : ''}`, flute: n => `${n} flûte${n > 1 ? 's' : ''}`,
    juiceBottle: name => `1 bouteille de ${name}`, noMixer: 'sans soft', extraSub: n => ` (dont ${n} en plus)`,
    undo: 'Annuler', soldOut: 'Rupture', emptyOrder: 'Commande vide',
    total: 'TOTAL', tapBack: 'Touche l’écran pour revenir',
    langLabel: 'Langue',
  },
  pt: {
    askDrink: 'O que você vai beber?',
    hintHome: 'Aponte para a sua bebida.',
    catBeer: 'Cerveja', catSoft: 'Sem álcool', catSpirit: 'Destilado em dose', catBottle: 'Garrafa',
    beersH1: 'Cervejas', beersHint: 'Em garrafa. Toque várias vezes para adicionar mais.',
    softsH1: 'Sem álcool', softsHint: 'Refrigerantes e sucos.',
    spiritsH1: 'Destilados em dose',
    spiritsHint: sup => `Preço sem refrigerante. Com refrigerante: <b style="color:var(--soft)">+${sup}&nbsp;€</b>`,
    withSoft: 'com refri', choices: n => `${n} opções`, aloneDefault: 'Servida pura',
    whichBrand: 'Qual marca?',
    askMixer: label => `${label}: <em>com refrigerante</em>?`,
    noDry: 'Não, puro', justSpirit: 'Só a bebida', yesWith: 'Sim, com', dry: 'puro',
    bottlesH1: 'Garrafas', bottlesHint: 'Depois: número de copos e refrigerantes.', perBottle: 'a garrafa',
    bottleWord: 'Garrafa',
    included: 'Incluído na garrafa', softsN: n => `${n} refrigerantes`, ofChoice: 'à escolha',
    oneBottle: '1 garrafa', ofJuice: 'de suco', whichJuice: 'Qual suco?', softsLabel: 'Refrigerantes',
    clear: 'Limpar',
    tapMany: (n, sup) => `Toque várias vezes para adicionar mais. Acima de ${n}: +${sup}&nbsp;€ por refrigerante.`,
    extraMore: (n, amount) => `${n} a mais: +${amount}`,
    softsOrJuice: n => ` · ${n} refrigerantes ou 1 garrafa de suco incluídos`,
    howManyGlasses: 'Quantos copos?', howManyFlutes: 'Quantas taças?',
    addBottle: price => `Adicionar a garrafa · ${price}`, chooseJuice: 'Escolha o suco',
    glass: n => `${n} copo${n > 1 ? 's' : ''}`, flute: n => `${n} taça${n > 1 ? 's' : ''}`,
    juiceBottle: name => `1 garrafa de ${name}`, noMixer: 'sem refrigerante', extraSub: n => ` (${n} a mais)`,
    undo: 'Desfazer', soldOut: 'Esgotado', emptyOrder: 'Pedido vazio',
    total: 'TOTAL', tapBack: 'Toque na tela para voltar',
    langLabel: 'Idioma',
  },
  en: {
    askDrink: 'What would you like to drink?',
    hintHome: 'Point at your drink.',
    catBeer: 'Beer', catSoft: 'Soft drink', catSpirit: 'Spirits by the glass', catBottle: 'Bottle',
    beersH1: 'Beers', beersHint: 'Bottled. Tap several times to add more.',
    softsH1: 'Soft drinks', softsHint: 'Alcohol-free.',
    spiritsH1: 'Spirits by the glass',
    spiritsHint: sup => `Price without a mixer. With a mixer: <b style="color:var(--soft)">+${sup}&nbsp;€</b>`,
    withSoft: 'with mixer', choices: n => `${n} choices`, aloneDefault: 'Served neat',
    whichBrand: 'Which brand?',
    askMixer: label => `${label}: <em>with a mixer</em>?`,
    noDry: 'No, neat', justSpirit: 'Just the spirit', yesWith: 'Yes, with', dry: 'neat',
    bottlesH1: 'Bottles', bottlesHint: 'Next: number of glasses and mixers.', perBottle: 'per bottle',
    bottleWord: 'Bottle',
    included: 'Included with the bottle', softsN: n => `${n} mixers`, ofChoice: 'of your choice',
    oneBottle: '1 bottle', ofJuice: 'of juice', whichJuice: 'Which juice?', softsLabel: 'Mixers',
    clear: 'Clear',
    tapMany: (n, sup) => `Tap several times to add more. Beyond ${n}: +${sup}&nbsp;€ per mixer.`,
    extraMore: (n, amount) => `${n} extra: +${amount}`,
    softsOrJuice: n => ` · ${n} mixers or 1 bottle of juice included`,
    howManyGlasses: 'How many glasses?', howManyFlutes: 'How many flutes?',
    addBottle: price => `Add the bottle · ${price}`, chooseJuice: 'Choose the juice',
    glass: n => `${n} glass${n > 1 ? 'es' : ''}`, flute: n => `${n} flute${n > 1 ? 's' : ''}`,
    juiceBottle: name => `1 bottle of ${name}`, noMixer: 'no mixer', extraSub: n => ` (${n} extra)`,
    undo: 'Undo', soldOut: 'Sold out', emptyOrder: 'Empty order',
    total: 'TOTAL', tapBack: 'Tap the screen to go back',
    langLabel: 'Language',
  },
};

/* Carte (clés = textes français de menu.json, sans césures douces). */
const MENU = {
  pt: {
    'Soda': 'Refrigerante', 'Tonic': 'Água tônica', 'Eau gazeuse': 'Água com gás',
    'Jus': 'Suco', 'Jus d’orange': 'Suco de laranja', 'Jus de pomme': 'Suco de maçã', 'Jus d’ananas': 'Suco de abacaxi',
    'Énergisant': 'Energético', 'Eau': 'Água', 'Bouteille 50 cl': 'Garrafa 50 cl',
    'Rouge · 33 cl': 'Vermelha · 33 cl',
    'Rhum': 'Rum', 'Whisky': 'Uísque', 'Whisky Black Label': 'Uísque Black Label',
    'Caïpi maracuja': 'Caipirinha de maracujá', 'Cocktail maison': 'Coquetel da casa',
    'Coupe de champagne': 'Taça de champanhe', 'Coupe champagne': 'Taça de champanhe',
    'Champagne Moët': 'Champanhe Moët',
  },
  en: {
    'Soda': 'Soda', 'Tonic': 'Tonic water', 'Eau gazeuse': 'Sparkling water',
    'Jus': 'Juice', 'Jus d’orange': 'Orange juice', 'Jus de pomme': 'Apple juice', 'Jus d’ananas': 'Pineapple juice',
    'Énergisant': 'Energy drink', 'Eau': 'Water', 'Bouteille 50 cl': '50 cl bottle',
    'Rouge · 33 cl': 'Red · 33 cl',
    'Rhum': 'Rum', 'Whisky Black Label': 'Whisky Black Label',
    'Caïpi maracuja': 'Passion fruit caipirinha', 'Cocktail maison': 'House cocktail',
    'Coupe de champagne': 'Glass of champagne', 'Coupe champagne': 'Glass of champagne',
    'Champagne Moët': 'Moët champagne',
  },
};

/** Texte d'interface dans la langue `lang` (repli : français). */
export function t(lang, key, ...args) {
  const v = UI[lang]?.[key] ?? UI[DEFAULT_LANG][key];
  return typeof v === 'function' ? v(...args) : v;
}

/** Texte de la carte (nom, taille, note) dans la langue `lang` (repli : le texte français d'origine). */
export function w(lang, text) {
  const s = String(text ?? '');
  return MENU[lang]?.[s.replace(/­/g, '')] ?? s;
}

export const UI_KEYS = Object.keys(UI[DEFAULT_LANG]);
export const MENU_TEXT = MENU;
