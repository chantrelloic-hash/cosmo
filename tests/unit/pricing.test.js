import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  glassPrice, countSofts, extraSofts, bottlePrice, orderTotal, orderCount, changeDue,
  parsePrice, applyOverride, mergeOverride, sanitizeOverrides, removeOne, sanitizeOrder,
  linePrice, addToOrder, removeFromOrder,
} from '../../app/pricing.js';

describe('glassPrice', () => {
  test('verre sec 10 €, avec soft 15 €', () => {
    assert.equal(glassPrice(10, false, 5), 10);
    assert.equal(glassPrice(10, true, 5), 15);
  });
  test('Jack Daniel’s 12 / 17', () => {
    assert.equal(glassPrice(12, false, 5), 12);
    assert.equal(glassPrice(12, true, 5), 17);
  });
  test('Hennessy et Black Label 15 / 20', () => {
    assert.equal(glassPrice(15, false, 5), 15);
    assert.equal(glassPrice(15, true, 5), 20);
  });
  test('le supplément est paramétrable', () => {
    assert.equal(glassPrice(10, true, 6), 16);
    assert.equal(glassPrice(10, true, 0), 10);
  });
});

describe('countSofts / extraSofts', () => {
  test('somme des quantités', () => {
    assert.equal(countSofts({}), 0);
    assert.equal(countSofts({ coca: 2, redbull: 1 }), 3);
    assert.equal(countSofts({ coca: 7 }), 7);
  });
  test('extraSofts ne descend jamais sous 0', () => {
    assert.equal(extraSofts(0, 5), 0);
    assert.equal(extraSofts(5, 5), 0);
    assert.equal(extraSofts(6, 5), 1);
    assert.equal(extraSofts(7, 5), 2);
    assert.equal(extraSofts(3, 0), 3);
  });
});

describe('bottlePrice', () => {
  test('bouteille à 90 € : 5 softs = 90, 6 = 95, 7 = 100', () => {
    assert.equal(bottlePrice(90, { softCount: 5 }, 5, 5), 90);
    assert.equal(bottlePrice(90, { softCount: 6 }, 5, 5), 95);
    assert.equal(bottlePrice(90, { softCount: 7 }, 5, 5), 100);
  });
  test('sans soft ou moins de 5 softs : prix de la bouteille', () => {
    assert.equal(bottlePrice(90, { softCount: 0 }, 5, 5), 90);
    assert.equal(bottlePrice(90, {}, 5, 5), 90);
    assert.equal(bottlePrice(140, { softCount: 3 }, 5, 5), 140);
  });
  test('options absentes ou undefined', () => {
    assert.equal(bottlePrice(90, undefined, 5, 5), 90);
    assert.equal(bottlePrice(90, null, 5, 5), 90);
  });
  test('1 bouteille de jus : prix de la bouteille même si des softs traînent', () => {
    assert.equal(bottlePrice(90, { mode: 'jus', softCount: 9 }, 5, 5), 90);
    assert.equal(bottlePrice(120, { mode: 'jus', softCount: 0 }, 5, 5), 120);
  });
  test('champagne : jamais de supplément', () => {
    assert.equal(bottlePrice(120, { champagne: true, softCount: 10 }, 5, 5), 120);
    assert.equal(bottlePrice(120, { champagne: true, mode: 'softs', softCount: 6 }, 5, 5), 120);
  });
  test('supplément et softs inclus paramétrables', () => {
    assert.equal(bottlePrice(90, { softCount: 7 }, 5, 6), 102);
    assert.equal(bottlePrice(90, { softCount: 7 }, 3, 5), 110);
  });
});

describe('orderTotal / orderCount', () => {
  const order = [
    { price: 5, qty: 2 }, { price: 15, qty: 1 }, { price: 12, qty: 1 },
    { price: 90, qty: 1 }, { price: 100, qty: 1 }, { price: 10, qty: 1 },
  ];
  test('total de la commande type = 237 €', () => {
    assert.equal(orderTotal([
      { price: 10, qty: 1 }, { price: 15, qty: 1 }, { price: 12, qty: 1 },
      { price: 90, qty: 1 }, { price: 100, qty: 1 }, { price: 10, qty: 1 },
    ]), 237);
  });
  test('total avec quantités', () => { assert.equal(orderTotal(order), 237); });
  test('nombre d’articles', () => { assert.equal(orderCount(order), 7); });
  test('commande vide', () => {
    assert.equal(orderTotal([]), 0);
    assert.equal(orderCount([]), 0);
  });
});

describe('changeDue', () => {
  test('positif : à rendre', () => { assert.equal(changeDue(250, 237), 13); });
  test('nul : compte juste', () => { assert.equal(changeDue(237, 237), 0); });
  test('négatif : il manque', () => { assert.equal(changeDue(200, 237), -37); });
  test('rien reçu', () => { assert.equal(changeDue(0, 10), -10); });
});

describe('parsePrice', () => {
  test('entiers valides', () => {
    assert.equal(parsePrice('6'), 6);
    assert.equal(parsePrice('0'), 0);
    assert.equal(parsePrice('999'), 999);
    assert.equal(parsePrice('007'), 7);
    assert.equal(parsePrice(12), 12);
  });
  test('espaces autour tolérés', () => { assert.equal(parsePrice('  15 '), 15); });
  test('valeurs invalides → null', () => {
    for (const bad of ['', '   ', 'abc', '5,5', '5.5', '-3', '+3', '1000', '1e2', '5 €', '1 2', null, undefined, NaN, -1, 1000, 5.5]) {
      assert.equal(parsePrice(bad), null, `devrait refuser ${String(bad)}`);
    }
  });
});

describe('applyOverride', () => {
  const p = { id: 'x', name: 'X', price: 5 };
  test('sans surcouche : inchangé, pas en rupture', () => {
    assert.deepEqual(applyOverride(p), { ...p, soldOut: false });
    assert.deepEqual(applyOverride(p, {}), { ...p, soldOut: false });
    assert.deepEqual(applyOverride(p, null), { ...p, soldOut: false });
  });
  test('prix surchargé', () => { assert.equal(applyOverride(p, { price: 6 }).price, 6); });
  test('prix 0 accepté (entier)', () => { assert.equal(applyOverride(p, { price: 0 }).price, 0); });
  test('prix non entier ignoré', () => {
    assert.equal(applyOverride(p, { price: 5.5 }).price, 5);
    assert.equal(applyOverride(p, { price: '6' }).price, 5);
  });
  test('rupture : available false uniquement', () => {
    assert.equal(applyOverride(p, { available: false }).soldOut, true);
    assert.equal(applyOverride(p, { available: true }).soldOut, false);
  });
  test('produit sans prix (famille) + rupture', () => {
    const fam = { id: 'w', name: 'Whisky' };
    const out = applyOverride(fam, { available: false });
    assert.equal(out.soldOut, true);
    assert.equal('price' in out, false);
  });
  test('ne modifie pas l’original', () => {
    applyOverride(p, { price: 9, available: false });
    assert.deepEqual(p, { id: 'x', name: 'X', price: 5 });
  });
});

describe('mergeOverride', () => {
  test('ajoute une modification', () => {
    assert.deepEqual(mergeOverride({}, 'a', { price: 6 }, { price: 5, available: true }), { a: { price: 6 } });
  });
  test('fusionne avec l’existant', () => {
    const r = mergeOverride({ a: { price: 6 } }, 'a', { available: false }, { price: 5, available: true });
    assert.deepEqual(r, { a: { price: 6, available: false } });
  });
  test('valeur identique à l’origine : supprimée, surcouche vide disparaît', () => {
    const r = mergeOverride({ a: { price: 6 } }, 'a', { price: 5 }, { price: 5, available: true });
    assert.deepEqual(r, {});
  });
  test('remettre disponible retire available', () => {
    const r = mergeOverride({ a: { available: false } }, 'a', { available: true }, { price: 5, available: true });
    assert.deepEqual(r, {});
  });
  test('ne mute pas l’entrée et garde les autres produits', () => {
    const inp = { a: { price: 6 }, b: { price: 8 } };
    const r = mergeOverride(inp, 'a', { price: 5 }, { price: 5 });
    assert.deepEqual(inp, { a: { price: 6 }, b: { price: 8 } });
    assert.deepEqual(r, { b: { price: 8 } });
  });
  test('réglages globaux', () => {
    const base = { softSupplement: 5, bottleIncludedSofts: 5 };
    assert.deepEqual(mergeOverride({}, '_settings', { softSupplement: 6 }, base), { _settings: { softSupplement: 6 } });
  });
});

describe('sanitizeOverrides', () => {
  test('entrées non exploitables → {}', () => {
    for (const bad of [null, undefined, 'x', 12, [], [{ price: 5 }], true]) {
      assert.deepEqual(sanitizeOverrides(bad), {});
    }
  });
  test('garde prix entiers 0-999 et available:false', () => {
    assert.deepEqual(
      sanitizeOverrides({ a: { price: 6 }, b: { available: false }, c: { price: 0, available: false } }),
      { a: { price: 6 }, b: { available: false }, c: { price: 0, available: false } });
  });
  test('rejette prix invalides', () => {
    assert.deepEqual(sanitizeOverrides({ a: { price: -1 }, b: { price: 1000 }, c: { price: 5.5 }, d: { price: '5' } }), {});
  });
  test('available:true ou autre est ignoré', () => {
    assert.deepEqual(sanitizeOverrides({ a: { available: true }, b: { available: 'false' } }), {});
  });
  test('ignore champs inconnus et valeurs non objets', () => {
    assert.deepEqual(sanitizeOverrides({ a: { price: 7, evil: 1 }, b: null, c: 'x', d: 3 }), { a: { price: 7 } });
  });
  test('_settings : seulement les deux entiers', () => {
    assert.deepEqual(
      sanitizeOverrides({ _settings: { softSupplement: 6, bottleIncludedSofts: 4, price: 9, available: false } }),
      { _settings: { softSupplement: 6, bottleIncludedSofts: 4 } });
    assert.deepEqual(sanitizeOverrides({ _settings: { softSupplement: -1, bottleIncludedSofts: 'x' } }), {});
  });
});

describe('removeOne', () => {
  const order = [{ key: 'a', qty: 2, price: 5 }, { key: 'b', qty: 1, price: 7 }];
  test('décrémente', () => {
    assert.deepEqual(removeOne(order, 'a'), [{ key: 'a', qty: 1, price: 5 }, { key: 'b', qty: 1, price: 7 }]);
  });
  test('supprime la ligne à 0', () => {
    assert.deepEqual(removeOne(order, 'b'), [{ key: 'a', qty: 2, price: 5 }]);
  });
  test('clé inconnue : inchangé', () => {
    assert.deepEqual(removeOne(order, 'zzz'), order);
  });
  test('ne mute pas l’original', () => {
    removeOne(order, 'a');
    assert.equal(order[0].qty, 2);
  });
  test('même clé, prix différents : seul le prix visé est touché', () => {
    const o = [{ key: 'a', qty: 1, price: 5 }, { key: 'a', qty: 1, price: 6 }];
    assert.deepEqual(removeOne(o, 'a', 6), [{ key: 'a', qty: 1, price: 5 }]);
    assert.deepEqual(removeOne(o, 'a', 5), [{ key: 'a', qty: 1, price: 6 }]);
  });
});

describe('sanitizeOrder', () => {
  test('non tableau → []', () => {
    for (const bad of [null, undefined, {}, 'x', 5]) assert.deepEqual(sanitizeOrder(bad), []);
  });
  test('ligne valide conservée, sub par défaut ""', () => {
    assert.deepEqual(sanitizeOrder([{ key: 'k', label: 'L', price: 5, qty: 2 }]),
      [{ key: 'k', label: 'L', sub: '', price: 5, qty: 2 }]);
    assert.equal(sanitizeOrder([{ key: 'k', label: 'L', sub: 'sec', price: 10, qty: 1 }])[0].sub, 'sec');
  });
  test('lignes invalides filtrées', () => {
    const raw = [
      null, 'x', { key: 'k', label: 'L', price: 5, qty: 0 }, { key: 'k', label: 'L', price: 5, qty: -1 },
      { key: 'k', label: 'L', price: 5.5, qty: 1 }, { key: 'k', label: 'L', price: -5, qty: 1 },
      { key: 'k', label: 'L', price: '5', qty: 1 }, { key: 1, label: 'L', price: 5, qty: 1 },
      { key: 'k', price: 5, qty: 1 }, { key: 'ok', label: 'OK', price: 0, qty: 3 },
    ];
    assert.deepEqual(sanitizeOrder(raw), [{ key: 'ok', label: 'OK', sub: '', price: 0, qty: 3 }]);
  });
  test('sub non texte → ""', () => {
    assert.equal(sanitizeOrder([{ key: 'k', label: 'L', sub: 3, price: 5, qty: 1 }])[0].sub, '');
  });
  test('retire les champs en trop', () => {
    assert.deepEqual(Object.keys(sanitizeOrder([{ key: 'k', label: 'L', price: 5, qty: 1, evil: 1 }])[0]).sort(),
      ['key', 'label', 'price', 'qty', 'sub']);
  });
});

describe('lignes de commande : quantités', () => {
  const heineken = { key: 'biere:heineken', label: 'Heineken', sub: '', price: 5 };
  const rhumCoca = { key: 'verre:rhum:coca', label: 'Rhum', sub: '+ Coca-Cola', price: 15 };

  test('linePrice : prix unitaire × quantité', () => {
    assert.equal(linePrice(15, 3), 45);
    assert.equal(linePrice(10, 1), 10);
    assert.equal(linePrice(7, 0), 0);
  });

  test('addToOrder : crée une ligne avec la quantité demandée', () => {
    const o = addToOrder([], rhumCoca, 3);
    assert.deepEqual(o, [{ ...rhumCoca, qty: 3 }]);
    assert.equal(orderTotal(o), 45);
  });

  test('addToOrder : quantité 1 par défaut, fusion avec la ligne de même clé et même prix', () => {
    let o = addToOrder([], heineken);
    o = addToOrder(o, heineken);
    o = addToOrder(o, heineken, 3);
    assert.equal(o.length, 1);
    assert.equal(o[0].qty, 5);
  });

  test('addToOrder : un prix différent crée une autre ligne (l’ancienne garde son prix)', () => {
    let o = addToOrder([], heineken, 2);
    o = addToOrder(o, { ...heineken, price: 6 }, 1);
    assert.deepEqual(o.map(i => [i.price, i.qty]), [[5, 2], [6, 1]]);
    assert.equal(orderTotal(o), 16);
  });

  test('addToOrder ne modifie pas la commande reçue', () => {
    const o = [{ ...heineken, qty: 1 }];
    addToOrder(o, heineken, 2);
    assert.equal(o[0].qty, 1);
  });

  test('removeFromOrder : annuler un ajout de 3 retire les 3 d’un coup', () => {
    let o = addToOrder([], heineken, 2);
    o = addToOrder(o, rhumCoca, 3);
    o = removeFromOrder(o, rhumCoca.key, rhumCoca.price, 3);
    assert.deepEqual(o.map(i => [i.key, i.qty]), [['biere:heineken', 2]]);
  });

  test('removeFromOrder : retire un exemplaire par défaut, supprime la ligne à 0, jamais de quantité négative', () => {
    let o = addToOrder([], heineken, 2);
    o = removeFromOrder(o, heineken.key, 5);
    assert.equal(o[0].qty, 1);
    o = removeFromOrder(o, heineken.key, 5, 4);
    assert.deepEqual(o, []);
  });

  test('removeFromOrder : ne touche que la ligne du bon prix', () => {
    let o = addToOrder([], heineken, 1);
    o = addToOrder(o, { ...heineken, price: 6 }, 1);
    o = removeFromOrder(o, heineken.key, 6);
    assert.deepEqual(o.map(i => [i.price, i.qty]), [[5, 1]]);
  });

  test('scénario favoris : 10 + 7 + 45 + 15 + 20 = 97', () => {
    let o = [];
    o = addToOrder(o, heineken, 2);
    o = addToOrder(o, { key: 'biere:desperados-rouge', label: 'Desperados Rouge', sub: '', price: 7 });
    o = addToOrder(o, rhumCoca, 3);
    o = addToOrder(o, { key: 'verre:vodka:schweppes', label: 'Vodka', sub: '+ Schweppes', price: glassPrice(10, true, 5) });
    o = addToOrder(o, { key: 'verre:vodka:sec', label: 'Vodka', sub: 'sec', price: glassPrice(10, false, 5) }, 2);
    assert.equal(orderTotal(o), 97);
    assert.equal(orderCount(o), 9);
  });
});
