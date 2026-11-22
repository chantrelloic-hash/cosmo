import { test, expect, openHome, euro, noHorizontalScroll } from './fixtures.js';

/* Pour l'équipe : calculatrice des tarifs (plein écran) et pense-bête d'ouverture. */

test('calculatrice : uniquement les tarifs de la carte, avec leur rappel ; additionne, corrige, efface', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'Calculatrice' }).first().click();
  const calc = page.getByRole('dialog', { name: 'Calculatrice' });
  await expect(calc).toBeVisible();
  const keys = calc.locator('.ck');
  await expect(keys).toHaveCount(10);
  expect(await keys.evaluateAll(ks => ks.map(k => +k.dataset.p))).toEqual([3, 5, 7, 10, 12, 15, 20, 90, 120, 140]);
  await expect(calc.locator('.ck[data-p="3"]')).toContainText('Eau');
  await expect(calc.locator('.ck[data-p="5"]')).toContainText('Supplément soft');
  await expect(calc.locator('.ck[data-p="10"]')).toContainText('Caïpi maracuja');
  await expect(calc.locator('.ck[data-p="140"]')).toContainText('Bouteille');

  const total = calc.locator('.calc-total');
  await expect(total).toHaveText(euro(0));
  for (const p of [10, 5, 10, 7]) await calc.getByRole('button', { name: `${p} €`, exact: true }).click();
  await expect(total).toHaveText(euro(32));
  await expect(calc.locator('.calc-tape')).toContainText('×2');
  await calc.getByRole('button', { name: /Annuler/ }).click();
  await expect(total).toHaveText(euro(25));
  await calc.getByRole('button', { name: 'Effacer' }).click();
  await expect(total).toHaveText(euro(0));

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
  await openHome(page);
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
  await expect(page.getByRole('heading', { name: /Qu’est-ce que tu bois/ })).toBeVisible();
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
