import { test, expect, openHome, euro, noHorizontalScroll, enterOrder } from './fixtures.js';

/* Pour l'équipe : calculatrice des tarifs (plein écran) et pense-bête d'ouverture. */

test('calculatrice : uniquement les tarifs de la carte, avec leur rappel, bouteilles regroupées ; additionne, annule, nouveau client', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'Calculatrice' }).first().click();
  const calc = page.getByRole('dialog', { name: 'Calculatrice' });
  await expect(calc).toBeVisible();
  const keys = calc.locator('.ck');
  await expect(keys).toHaveCount(8);
  expect(await calc.locator('.ck[data-p]').evaluateAll(ks => ks.map(k => +k.dataset.p))).toEqual([3, 5, 7, 10, 12, 15, 20]);
  await expect(calc.locator('.ck[data-p="3"]')).toContainText('Eau');
  await expect(calc.locator('.ck[data-p="5"]')).toContainText('Supplément soft');
  await expect(calc.locator('.ck[data-p="10"]')).toContainText('Caïpi maracuja');
  await expect(calc.getByRole('button', { name: 'Bouteilles' })).toContainText('90 · 120 · 140');

  const total = calc.locator('.calc-total');
  await expect(total).toHaveText(euro(0));
  for (const p of [10, 5, 10, 7]) await calc.getByRole('button', { name: `${p} €`, exact: true }).click();
  await expect(total).toHaveText(euro(32));

  /* une seule touche « Bouteilles » : on choisit le prix, puis retour aux touches */
  await calc.getByRole('button', { name: 'Bouteilles' }).click();
  await expect(calc.getByText('Quelle bouteille')).toBeVisible();
  await expect(calc.getByRole('button', { name: 'Bouteille 90 €' })).toContainText('Vodka');
  await expect(calc.getByRole('button', { name: 'Bouteille 120 €' })).toContainText('Champagne Moët');
  await calc.getByRole('button', { name: 'Bouteille 140 €' }).click();
  await expect(total).toHaveText(euro(172));
  await expect(calc.locator('.ck[data-p="3"]')).toBeVisible();
  await expect(calc.getByRole('button', { name: /Retour/ })).toHaveCount(0);
  /* ouvert par erreur : « Annuler » referme le choix sans rien retirer */
  await calc.getByRole('button', { name: 'Bouteilles' }).click();
  await calc.getByRole('button', { name: /Annuler/ }).click();
  await expect(calc.locator('.ck[data-p="3"]')).toBeVisible();
  await expect(total).toHaveText(euro(172));
  await calc.getByRole('button', { name: /Annuler/ }).click();
  await expect(total).toHaveText(euro(32));
  await expect(calc.locator('.calc-tape')).toContainText('×2');
  await calc.getByRole('button', { name: /Annuler/ }).click();
  await expect(total).toHaveText(euro(25));
  await calc.getByRole('button', { name: 'Nouveau client' }).click();
  await expect(total).toHaveText(euro(0));
  await expect(calc.getByRole('button', { name: /Annuler/ })).toBeDisabled();

  /* plein écran : la calculatrice couvre tout l'écran */
  const box = await calc.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(389);
  expect(box.height).toBeGreaterThanOrEqual(843);
  await noHorizontalScroll(page);

  await calc.getByRole('button', { name: 'Fermer' }).click();
  await expect(calc).toBeHidden();
  await expect(page.locator('#bar')).toContainText('Commande vide');
});

test('calculatrice : un prix changé dans les réglages devient une touche ; langue suivie', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('init')) {
      localStorage.setItem('cosmo.overrides.v1', JSON.stringify({ heineken: { price: 6 } }));
      localStorage.setItem('cosmo.prefs.v1', JSON.stringify({ lang: 'en' }));
      sessionStorage.setItem('init', '1');
    }
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Calculator' }).first().click();
  const calc = page.getByRole('dialog', { name: 'Calculator' });
  await expect(calc.locator('.ck[data-p="6"]')).toContainText('Heineken');
  await expect(calc.locator('.ck[data-p="5"]')).not.toContainText('Heineken');
  await expect(calc.getByRole('button', { name: 'Close' })).toBeVisible();
});

test('ouverture : 9 étapes à cocher, gardées sur le téléphone, « Recommencer » avec confirmation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ouverture du Cosmo/ }).click();
  await expect(page.getByRole('heading', { name: 'Ouverture du Cosmo' })).toBeVisible();
  const cards = page.locator('.opcard');
  await expect(cards).toHaveCount(9);
  await expect(cards.nth(0)).toContainText('agent de sécurité');
  await expect(cards.nth(2)).toContainText('flèche rose');
  await expect(page.locator('#bar')).toBeHidden();
  await noHorizontalScroll(page);

  await cards.nth(0).click();
  await cards.nth(2).click();
  await expect(cards.nth(0)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.opprog')).toContainText('2');

  await page.reload();
  await expect(page.getByRole('button', { name: /Ouverture du Cosmo/ })).toContainText('2 / 9');
  await page.getByRole('button', { name: /Ouverture du Cosmo/ }).click();
  for (let i = 0; i < 9; i++) if (i !== 0 && i !== 2) await cards.nth(i).click();
  await expect(page.getByText('Tout est prêt. On peut ouvrir')).toBeVisible();

  await page.getByRole('button', { name: 'Recommencer' }).click();
  await page.getByRole('button', { name: 'Non' }).click();
  await expect(page.locator('.opcard[aria-pressed="true"]')).toHaveCount(9);
  await page.getByRole('button', { name: 'Recommencer' }).click();
  await page.getByRole('button', { name: 'Oui' }).click();
  await expect(page.locator('.opcard[aria-pressed="true"]')).toHaveCount(0);
  await expect(page.getByText('Tout est prêt. On peut ouvrir')).toBeHidden();
});

/* Tout tient sur un écran, sans défilement, même sur petit téléphone et dans une langue plus longue. */
for (const [w, h, lang] of [[390, 844, 'fr'], [375, 667, 'pt'], [320, 568, 'en']]) {
  test(`calculatrice : tout tient sur l’écran sans défiler (${w}×${h}, ${lang})`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.addInitScript(l => localStorage.setItem('cosmo.prefs.v1', JSON.stringify({ lang: l })), lang);
    await page.goto('/');
    await page.locator('.lt-calc').click();
    await expect(page.locator('#calc .ck').first()).toBeVisible();
    const fits = () => page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('#calc .calc-in > *, #calc .calc-top > *, #calc .ck').forEach(e => {
        const r = e.getBoundingClientRect();
        if (r.width <= 1) return; // titre masqué à l'écran sur très petit téléphone (lu par les lecteurs d'écran)
        if (r.bottom > innerHeight + 0.5 || r.right > innerWidth + 0.5) bad.push(`dépasse : ${e.className}`);
        if (e.scrollHeight > e.clientHeight + 1) bad.push(`texte coupé : ${e.className} ${e.dataset.p || ''}`);
      });
      return bad;
    });
    expect(await fits()).toEqual([]);
    await page.locator('#calc .ckb').click();
    expect(await fits()).toEqual([]);
  });
}

test('lancement : 4 grands boutons qui mènent à la commande, à la calculatrice, au rendu de monnaie et à l’ouverture', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Que veux-tu faire ?' })).toBeVisible();
  const tiles = page.locator('#view .lt');
  await expect(tiles).toHaveCount(4);
  await expect(tiles.nth(0)).toContainText('Prise de commande');
  await expect(tiles.nth(1)).toContainText('Calculatrice');
  await expect(tiles.nth(2)).toContainText('Rendre la monnaie');
  await expect(tiles.nth(3)).toContainText('Ouverture du Cosmo');
  await expect(page.locator('.bar')).toBeHidden();
  await expect(page.locator('#calcBtn')).toBeHidden();
  await noHorizontalScroll(page);

  /* les 3 boutons tiennent sur l'écran, sans défiler */
  const bottom = await tiles.nth(3).evaluate(e => e.getBoundingClientRect().bottom);
  expect(bottom).toBeLessThanOrEqual(844);

  /* commande : une commande en cours se voit sur le bouton ; « Retour » ramène au lancement */
  await tiles.nth(0).click();
  await page.locator('#view .fav').filter({ hasText: 'Heineken' }).click();
  await page.getByRole('button', { name: 'Retour' }).click();
  await expect(tiles.nth(0)).toContainText('1 article');
  await expect(tiles.nth(0)).toContainText('5 €');

  /* calculatrice : par-dessus le lancement, « Fermer » y revient */
  await tiles.nth(1).click();
  await expect(page.getByRole('dialog', { name: 'Calculatrice' })).toBeVisible();
  await page.getByRole('button', { name: 'Fermer' }).click();
  await expect(page.getByRole('heading', { name: 'Que veux-tu faire ?' })).toBeVisible();

  /* ouverture, puis retour */
  await tiles.nth(3).click();
  await expect(page.getByRole('heading', { name: 'Ouverture du Cosmo' })).toBeVisible();
  await page.getByRole('button', { name: 'Retour' }).click();
  await expect(tiles).toHaveCount(4);
});

test('calculatrice et écran client partagent la même commande ; « Nouveau client » remet tout à zéro', async ({ page }) => {
  await openHome(page);
  const cur = page.locator('#cur-order');
  const calc = page.getByRole('dialog', { name: 'Calculatrice' });
  const total = calc.locator('.calc-total');

  /* le client choisit 2 Heineken (10 €) */
  await page.locator('#view .fav').filter({ hasText: 'Heineken' }).click();
  await page.locator('#view .fav').filter({ hasText: 'Heineken' }).click();

  /* calculatrice : elle part du total du client et le rappelle en haut */
  await page.locator('#calcBtn').click();
  await expect(total).toHaveText(euro(10));
  await expect(calc.locator('.calc-tape')).toContainText('2× Heineken');
  await calc.getByRole('button', { name: '15 €', exact: true }).click();
  await calc.getByRole('button', { name: '15 €', exact: true }).click();
  await calc.getByRole('button', { name: '7 €', exact: true }).click();
  await expect(total).toHaveText(euro(47));

  /* « Annuler » retire le dernier prix de la calculatrice, jamais une boisson */
  await calc.getByRole('button', { name: /Annuler/ }).click();
  await calc.getByRole('button', { name: /Annuler/ }).click();
  await calc.getByRole('button', { name: /Annuler/ }).click();
  await expect(total).toHaveText(euro(10));
  await expect(calc.getByRole('button', { name: /Annuler/ })).toBeDisabled();
  await calc.getByRole('button', { name: '15 €', exact: true }).click();
  await calc.getByRole('button', { name: '15 €', exact: true }).click();
  await calc.getByRole('button', { name: 'Fermer' }).click();

  /* écran client : une ligne par prix de la calculatrice, avec − / + */
  await expect(cur.locator('.total b')).toHaveText(euro(40));
  const line = cur.locator('.row').filter({ hasText: 'Calculatrice' });
  await expect(line).toHaveCount(1);
  await expect(line).toContainText('2 ×');
  await expect(line).toContainText('15 €');
  await line.getByRole('button', { name: 'Ajouter un' }).click();
  await expect(cur.locator('.total b')).toHaveText(euro(55));
  await page.locator('#view .fav').filter({ hasText: 'Heineken' }).click();
  await expect(cur.locator('.total b')).toHaveText(euro(60));

  /* retour à la calculatrice : tout est là ; on garde tout après un rechargement */
  await page.locator('#calcBtn').click();
  await expect(total).toHaveText(euro(60));
  await page.reload();
  await enterOrder(page);
  await expect(cur.locator('.total b')).toHaveText(euro(60));
  await page.locator('#calcBtn').click();
  await expect(total).toHaveText(euro(60));
  await calc.getByRole('button', { name: /Annuler/ }).click(); // historique perdu : la dernière ligne calculatrice
  await expect(total).toHaveText(euro(45));

  /* un seul bouton de remise à zéro : tout repart à 0, des deux côtés */
  await calc.getByRole('button', { name: 'Nouveau client' }).click();
  await expect(total).toHaveText(euro(0));
  await expect(calc.locator('.calc-tape')).toContainText('Touche les prix');
  await calc.getByRole('button', { name: 'Fermer' }).click();
  await expect(cur.locator('.total b')).toHaveText(euro(0));
  await expect(page.getByRole('button', { name: 'Nouveau client' })).toBeDisabled();
});

test('rendre la monnaie : 4e bouton, lié à la commande et à la calculatrice ; Terminé remet tout à zéro', async ({ page }) => {
  await openHome(page);
  await page.locator('#view .fav').filter({ hasText: 'Heineken' }).click(); // 5 €
  await page.locator('#calcBtn').click();
  const calc = page.getByRole('dialog', { name: 'Calculatrice' });
  await calc.getByRole('button', { name: '15 €', exact: true }).click();
  await calc.getByRole('button', { name: '7 €', exact: true }).click(); // total 27 €
  await calc.getByRole('button', { name: 'Fermer' }).click();
  await page.getByRole('button', { name: 'Retour' }).click();

  const tile = page.locator('#view .lt-change');
  await expect(tile).toContainText('27 €');
  await tile.click();
  const chg = page.getByRole('dialog', { name: 'Rendre la monnaie' });
  await expect(chg.locator('.cs b.pay')).toHaveText(euro(27));
  await expect(chg.getByRole('button', { name: 'Valider' })).toBeDisabled();
  /* 7 boutons : billets 5, 10, 20, 50, 100 et pièces 1, 2 ; le nombre de chaque s'affiche */
  await expect(chg.locator('.mb')).toHaveCount(7);
  await chg.getByRole('button', { name: '20 €', exact: true }).click();
  await chg.getByRole('button', { name: '20 €', exact: true }).click();
  await chg.getByRole('button', { name: '2 €', exact: true }).click();
  await expect(chg.getByRole('button', { name: '20 €', exact: true }).locator('.qty')).toHaveText('2');
  await expect(chg.locator('.cs').nth(1).locator('b')).toHaveText(euro(42));
  await expect(chg.locator('.st')).toContainText('C’est bon');

  /* Valider : 15 € à rendre = 1 billet de 10 + 1 billet de 5 */
  await chg.getByRole('button', { name: 'Valider' }).click();
  await expect(chg.locator('.chg-res .big')).toHaveText(euro(15));
  await expect(chg.locator('.gv')).toHaveCount(2);
  await expect(chg.locator('.gv').nth(0).locator('.bill-10')).toBeVisible();
  await expect(chg.locator('.gv').nth(0)).toContainText('× 1');
  await expect(chg.locator('.gv').nth(1).locator('.bill-5')).toBeVisible();

  /* tout tient sur l'écran (saisie et résultat) */
  const fits = () => page.evaluate(() => [...document.querySelectorAll('#change .calc-in > *, #change .mb, #change .gv')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.bottom > innerHeight + 0.5 || r.right > innerWidth + 0.5; }).length);
  expect(await fits()).toBe(0);
  await chg.getByRole('button', { name: /Corriger/ }).click();
  /* chaque billet / pièce reste dans sa case */
  expect(await page.evaluate(() => [...document.querySelectorAll('#change .mb')].every(m => {
    const c = m.firstElementChild.getBoundingClientRect(), r = m.getBoundingClientRect();
    return c.left >= r.left - 0.5 && c.right <= r.right + 0.5 && c.top >= r.top - 0.5 && c.bottom <= r.bottom + 0.5;
  }))).toBe(true);
  expect(await fits()).toBe(0);
  await chg.getByRole('button', { name: 'Valider' }).click();

  /* Terminé : retour à la page de lancement, commande et calculatrice à zéro */
  await chg.getByRole('button', { name: /Terminé/ }).click();
  await expect(chg).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Que veux-tu faire ?' })).toBeVisible();
  await expect(tile).not.toContainText('€');
  await page.locator('#view .lt-calc').click();
  await expect(calc.locator('.calc-total')).toHaveText(euro(0));
});

test('écran principal : choix de la langue en haut, en petit', async ({ page }) => {
  await page.goto('/');
  const langs = page.getByRole('group', { name: 'Langue' });
  await expect(langs.getByRole('button')).toHaveCount(3);
  await expect(langs.getByRole('button', { name: 'Français' })).toHaveAttribute('aria-pressed', 'true');
  /* en haut et petit : dans l'en-tête, moins haut que les grands boutons */
  const box = await langs.boundingBox();
  expect(box.y).toBeLessThan(80);
  expect(box.height).toBeLessThan(50);
  await langs.getByRole('button', { name: 'Português (Brasil)' }).click();
  await expect(page.getByRole('heading', { name: 'O que você quer fazer?' })).toBeVisible();
  await expect(page.locator('#view .lt-order')).toContainText('Anotar pedido');
  await expect(page.getByRole('group', { name: 'Idioma' }).getByRole('button', { name: 'Português (Brasil)' })).toHaveAttribute('aria-pressed', 'true');
  /* la langue suit sur l'écran client, et pas de choix de langue dans l'en-tête ailleurs */
  await page.locator('#view .lt-order').click();
  await expect(page.getByRole('heading', { name: 'O que você vai beber?' })).toBeVisible();
  await expect(page.locator('#hlangs')).toBeHidden();
  await page.getByRole('button', { name: 'Retour' }).click();
  await page.getByRole('group', { name: 'Idioma' }).getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'What do you want to do?' })).toBeVisible();
  /* tient sur l'écran, même sur un très petit téléphone */
  for (const [w, h] of [[390, 844], [320, 568]]) {
    await page.setViewportSize({ width: w, height: h });
    await noHorizontalScroll(page);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(h);
  }
});

/* La page de lancement tient sur l'écran dans les 3 langues (titres plus ou moins longs), sans texte coupé. */
for (const [w, h] of [[390, 844], [375, 667], [320, 568]]) {
  test(`lancement : tient sur l’écran dans les 3 langues (${w}×${h})`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.addInitScript(() => localStorage.setItem('cosmo.order.v1', JSON.stringify([{ key: 'calc:17', label: 'C', sub: '', price: 17, qty: 1 }])));
    await page.goto('/');
    for (const name of ['Português (Brasil)', 'English', 'Français']) {
      await page.locator('#hlangs').getByRole('button', { name }).click();
      const r = await page.evaluate(() => ({
        sh: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth,
        cut: [...document.querySelectorAll('#view .lt')].filter(t => {
          const x = t.querySelector('.ltx').getBoundingClientRect(), b = t.getBoundingClientRect();
          return x.bottom > b.bottom - 2 || x.top < b.top + 2;
        }).length,
      }));
      expect(r, name).toEqual({ sh: h, sw: w, cut: 0 });
    }
  });
}
