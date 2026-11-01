import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LANGS, DEFAULT_LANG, UI_KEYS, MENU_TEXT, t, w, isLang } from '../../app/i18n.js';

const menu = JSON.parse(readFileSync(new URL('../../app/menu.json', import.meta.url), 'utf8'));
const plain = s => String(s).replace(/­/g, '');
const walk = list => list.flatMap(x => [x, ...(x.children ? walk(x.children) : [])]);
const products = [...menu.beers, ...menu.softs, ...walk(menu.spirits), ...menu.bottles.flatMap(b => b.items)];
const texts = new Set(products.flatMap(p => [p.name, p.short, p.label, p.size, p.note]).filter(Boolean).map(plain));

describe('langues', () => {
  test('français, portugais du Brésil, anglais ; le français par défaut', () => {
    assert.deepEqual(LANGS, ['fr', 'pt', 'en']);
    assert.equal(DEFAULT_LANG, 'fr');
    assert.ok(isLang('pt') && !isLang('es') && !isLang(undefined));
  });

  test('chaque langue a toutes les clés de l’interface, avec un texte non vide', () => {
    for (const lang of LANGS) for (const key of UI_KEYS) {
      const v = t(lang, key, 3, 'x', 'y');
      assert.equal(typeof v, 'string', `${lang}.${key}`);
      assert.ok(v.length > 0, `${lang}.${key} vide`);
    }
  });

  test('les textes à nombres suivent les nombres (pluriels, prix)', () => {
    assert.equal(t('fr', 'glass', 1), '1 verre');
    assert.equal(t('fr', 'glass', 4), '4 verres');
    assert.equal(t('pt', 'flute', 2), '2 taças');
    assert.equal(t('en', 'glass', 2), '2 glasses');
    assert.match(t('en', 'tapMany', 5, 5), /Beyond 5: \+5/);
  });

  test('clé ou langue inconnue : repli sur le français', () => {
    assert.equal(t('es', 'undo'), 'Annuler');
    assert.equal(t('pt', 'undo'), 'Desfazer');
  });

  test('la carte : texte traduit, sinon le texte français d’origine', () => {
    assert.equal(w('fr', 'Jus d’orange'), 'Jus d’orange');
    assert.equal(w('pt', 'Jus d’orange'), 'Suco de laranja');
    assert.equal(w('en', 'Jus d’orange'), 'Orange juice');
    assert.equal(w('en', 'Heineken'), 'Heineken');
    assert.equal(w('pt', 'Jäger­meister'), 'Jäger­meister');
  });

  test('aucune traduction de la carte ne vise un texte absent de menu.json', () => {
    for (const lang of Object.keys(MENU_TEXT)) for (const key of Object.keys(MENU_TEXT[lang]))
      assert.ok(texts.has(key), `${lang} : « ${key} » n’existe pas dans menu.json`);
  });

  test('les mots français de la carte sont tous traduits en portugais et en anglais', () => {
    const french = ['Jus d’orange', 'Jus de pomme', 'Jus d’ananas', 'Eau gazeuse', 'Énergisant', 'Eau', 'Bouteille 50 cl',
      'Rhum', 'Cocktail maison', 'Coupe de champagne', 'Champagne Moët', 'Rouge · 33 cl'];
    for (const f of french) {
      assert.ok(texts.has(f), `${f} absent de menu.json`);
      for (const lang of ['pt', 'en']) assert.ok(MENU_TEXT[lang][f], `${lang} : « ${f} » non traduit`);
    }
  });
});
