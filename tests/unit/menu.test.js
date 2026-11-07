import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';

const raw = readFileSync(new URL('../../app/menu.json', import.meta.url), 'utf8');
const menu = JSON.parse(raw); // lève si le JSON est invalide

/** Tous les produits "feuille" d'une liste (les familles à enfants sont dépliées). */
const leaves = list => list.flatMap(x => x.children ?? [x]);
const bottles = menu.bottles.flatMap(t => t.items.map(i => ({ ...i, price: t.price })));
const byId = (list, id) => list.find(x => x.id === id);
const isHex = c => typeof c === 'string' && /^#[0-9a-f]{3,8}$/i.test(c);
const plain = s => String(s).replace(/­/g, ''); // retire les césures douces

describe('structure', () => {
  test('JSON valide avec les familles attendues', () => {
    for (const k of ['beers', 'softs', 'spirits', 'bottles', 'bottleJuices']) assert.ok(Array.isArray(menu[k]), k);
  });
  test('ids uniques dans chaque famille', () => {
    for (const [fam, list] of Object.entries({
      beers: menu.beers, softs: menu.softs, spirits: leaves(menu.spirits), bottles,
    })) {
      const ids = list.map(x => x.id);
      assert.equal(new Set(ids).size, ids.length, `ids en double dans ${fam}`);
    }
  });
  test('prix entiers > 0 (produits à prix)', () => {
    const priced = [...menu.beers, ...menu.softs, ...leaves(menu.spirits), ...bottles];
    for (const p of priced) {
      assert.ok(Number.isInteger(p.price) && p.price > 0, `${p.id} : prix ${p.price}`);
    }
    assert.ok(Number.isInteger(menu.softSupplement) && menu.softSupplement > 0);
    assert.ok(Number.isInteger(menu.bottleIncludedSofts) && menu.bottleIncludedSofts > 0);
  });
  test('chaque produit a un nom', () => {
    for (const p of [...menu.beers, ...menu.softs, ...menu.spirits, ...leaves(menu.spirits), ...bottles]) {
      assert.ok(typeof p.name === 'string' && p.name.trim(), `nom manquant : ${p.id}`);
    }
  });
  test('bières et softs ont des couleurs (bg et fg)', () => {
    for (const p of [...menu.beers, ...menu.softs]) {
      assert.ok(isHex(p.bg) && isHex(p.fg), `couleurs invalides : ${p.id}`);
    }
  });
  test('alcools au verre ont une couleur de liquide', () => {
    for (const s of menu.spirits) assert.ok(isHex(s.liquid), `liquide manquant : ${s.id}`);
  });
  test('jus de bouteille : ids qui existent parmi les softs', () => {
    for (const id of menu.bottleJuices) assert.ok(byId(menu.softs, id), id);
  });
  test('bouteilles : paliers triés avec des items', () => {
    for (const t of menu.bottles) assert.ok(Number.isInteger(t.price) && t.items.length > 0);
  });
});

describe('carte officielle', () => {
  test('bières', () => {
    const exp = { heineken: 5, desperados: 7, 'desperados-rouge': 7, guinness: 7, corona: 7 };
    assert.deepEqual(Object.fromEntries(menu.beers.map(b => [b.id, b.price])), exp);
    assert.equal(byId(menu.beers, 'desperados').label, 'Desperados Original');
    assert.equal(byId(menu.beers, 'desperados-rouge').label, 'Desperados Rouge');
  });
  test('softs à 5 €, eau à 3 €', () => {
    const exp = { coca: 5, schweppes: 5, perrier: 5, orange: 5, pomme: 5, ananas: 5, redbull: 5, eau: 3 };
    assert.deepEqual(Object.fromEntries(menu.softs.map(s => [s.id, s.price])), exp);
    assert.equal(byId(menu.softs, 'eau').mixer, false, 'l’eau n’est pas un soft de mélange');
    assert.equal(menu.softs.filter(s => s.mixer).length, 7);
  });
  test('jus de bouteille : orange, pomme, ananas', () => {
    assert.deepEqual([...menu.bottleJuices].sort(), ['ananas', 'orange', 'pomme']);
  });
  test('alcools au verre', () => {
    const sp = leaves(menu.spirits);
    const exp = {
      vodka: 10, rhum: 10, tequila: 10, gin: 10, redlabel: 10, jb: 10, jack: 12, black: 15,
      cognac: 15, get27: 10, get31: 10, jager: 10, baileys: 10, caipi: 10, champ: 20,
    };
    assert.deepEqual(Object.fromEntries(sp.map(s => [s.id, s.price])), exp);
  });
  test('noms : Hennessy, Jägermeister, Get 27/31', () => {
    assert.equal(byId(menu.spirits, 'cognac').short, 'Hennessy');
    assert.equal(plain(byId(menu.spirits, 'jager').name), 'Jägermeister');
    const get = byId(menu.spirits, 'get');
    assert.deepEqual(get.children.map(c => c.name), ['Get 27', 'Get 31']);
  });
  test('whisky : sous-marques', () => {
    const w = byId(menu.spirits, 'whisky');
    assert.deepEqual(w.children.map(c => c.id), ['redlabel', 'jb', 'jack', 'black']);
  });
  test('noSoft : uniquement caïpi maracuja et coupe de champagne', () => {
    const ns = leaves(menu.spirits).filter(s => s.noSoft).map(s => s.id).sort();
    assert.deepEqual(ns, ['caipi', 'champ']);
    assert.equal(byId(menu.spirits, 'caipi').noSoft, true);
  });
  test('bouteilles', () => {
    const exp = {
      hennessy: 140, 'black-label': 140, moet: 120, 'jack-daniels': 120,
      vodka: 90, tequila: 90, rhum: 90, baileys: 90, gin: 90, jagermeister: 90,
      get27: 90, get31: 90, 'red-label': 90, jb: 90,
    };
    assert.deepEqual(Object.fromEntries(bottles.map(b => [b.id, b.price])), exp);
    assert.deepEqual(menu.bottles.map(t => t.price), [140, 120, 90]);
  });
  test('le champagne Moët est marqué champagne, lui seul', () => {
    assert.deepEqual(bottles.filter(b => b.champagne).map(b => b.id), ['moet']);
  });
  test('supplément soft 5, softs inclus bouteille 5', () => {
    assert.equal(menu.softSupplement, 5);
    assert.equal(menu.bottleIncludedSofts, 5);
  });
  test('tous les produits sont disponibles par défaut', () => {
    for (const p of [...menu.beers, ...menu.softs, ...leaves(menu.spirits), ...bottles]) {
      assert.notEqual(p.available, false, p.id);
    }
  });
});

describe('les plus vendus (favorites)', () => {
  const favs = menu.favorites;
  test('liste non vide, chaque entrée est une bière OU un alcool', () => {
    assert.ok(Array.isArray(favs) && favs.length > 0);
    for (const f of favs) assert.equal(Number('beer' in f) + Number('spirit' in f), 1, JSON.stringify(f));
  });
  test('les bières et alcools cités existent (alcools : produit à prix, pas une famille à sous-choix)', () => {
    for (const f of favs) {
      if (f.beer) assert.ok(byId(menu.beers, f.beer), `bière inconnue : ${f.beer}`);
      if (f.spirit) {
        const s = byId(menu.spirits, f.spirit);
        assert.ok(s, `alcool inconnu : ${f.spirit}`);
        assert.ok(!s.children && Number.isInteger(s.price), `${f.spirit} doit avoir un prix`);
      }
    }
  });
  test('les softs de mélange cités existent, sont des mélanges, sans doublon', () => {
    for (const f of favs.filter(x => x.spirit)) {
      const mixers = f.mixers ?? [];
      assert.ok(Array.isArray(mixers));
      assert.equal(new Set(mixers).size, mixers.length, `doublon dans ${f.spirit}`);
      for (const id of mixers) {
        const m = byId(menu.softs, id);
        assert.ok(m, `soft inconnu : ${id}`);
        assert.equal(m.mixer, true, `${id} n’est pas un soft de mélange`);
      }
    }
  });
  test('carte demandée par Loïc : Heineken, Desperados, Desperados Rouge, Rhum (Coca), Vodka (Red Bull, pomme)', () => {
    assert.deepEqual(favs, [
      { beer: 'heineken' }, { beer: 'desperados' }, { beer: 'desperados-rouge' },
      { spirit: 'rhum', mixers: ['coca'] }, { spirit: 'vodka', mixers: ['redbull', 'pomme'] },
    ]);
  });
  test('pas de doublon', () => {
    const keys = favs.map(f => f.beer ?? f.spirit);
    assert.equal(new Set(keys).size, keys.length);
  });
});

describe('photos des produits', () => {
  const all = [...menu.beers, ...menu.softs, ...menu.spirits, ...leaves(menu.spirits), ...bottles];
  test('chaque image renseignée est un fichier existant de app/images (WebP, moins de 40 Ko)', () => {
    for (const p of all.filter(x => x.image)) {
      assert.match(p.image, /^images\/[a-z0-9-]+\.(webp|png)$/, `${p.id} : chemin ${p.image}`);
      const url = new URL('../../app/' + p.image, import.meta.url);
      assert.ok(existsSync(url), `${p.id} : fichier absent ${p.image}`);
      assert.ok(statSync(url).size < 40 * 1024, `${p.id} : ${p.image} dépasse 40 Ko`);
    }
  });
  test('les photos des favoris existent (bières)', () => {
    for (const f of menu.favorites.filter(x => x.beer)) {
      assert.ok(byId(menu.beers, f.beer).image, `photo manquante : ${f.beer}`);
    }
  });
  test('CREDITS.md cite chaque image utilisée', () => {
    const credits = readFileSync(new URL('../../app/images/CREDITS.md', import.meta.url), 'utf8');
    for (const f of new Set(all.filter(x => x.image).map(x => x.image))) {
      assert.ok(credits.includes(f.replace('images/', '')), `crédit manquant : ${f}`);
    }
  });
  test('chaque fichier de app/images (hors docs) est référencé par menu.json', () => {
    const used = new Set(all.filter(x => x.image).map(x => x.image.replace('images/', '')));
    for (const f of readdirSync(new URL('../../app/images/', import.meta.url)).filter(n => /\.(webp|png)$/.test(n))) {
      assert.ok(used.has(f), `image orpheline : ${f}`);
    }
  });
});
