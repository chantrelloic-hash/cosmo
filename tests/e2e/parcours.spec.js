import { test, expect, euro, openHome, bar, back } from './fixtures.js';

test('parcours complet : commande de 237 €, client, encaissement, fin', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_FAILED|Failed to load resource/.test(m.text())) errors.push(m.text()); });

  await openHome(page);

  // Bières : Heineken x2
  await page.locator('#view').getByRole('button', { name: /^Bière/ }).click();
  await page.locator('#view').getByRole('button', { name: /Heineken/ }).click();
  await page.locator('#view').getByRole('button', { name: /Heineken/ }).click();
  await expect(bar(page)).toContainText('2 Heineken');
  await back(page).click();

  // Vodka + Red Bull = 15
  await page.locator('#view').getByRole('button', { name: /^Alcool au verre/ }).click();
  await page.locator('#view').getByRole('button', { name: /^Vodka/ }).click();
  await expect(page.getByText('avec un soft', { exact: false }).first()).toBeVisible();
  await page.locator('#view').getByRole('button', { name: /Red Bull/ }).click();
  await expect(page.getByRole('heading', { name: /Qu’est-ce que tu bois/ })).toBeVisible();

  // Jack Daniel's sec = 12
  await page.locator('#view').getByRole('button', { name: /^Alcool au verre/ }).click();
  await page.locator('#view').getByRole('button', { name: /^Whisky/ }).click();
  await page.locator('#view').getByRole('button', { name: /Jack Daniel/ }).click();
  await page.locator('#view').getByRole('button', { name: /Non, sec/ }).click();

  // Bouteille Rhum, 6 verres, 1 bouteille de jus d'ananas = 90
  await page.locator('#view').getByRole('button', { name: /^Bouteille/ }).click();
  await page.locator('#view').getByRole('button', { name: /^Rhum$/ }).click();
  await page.locator('#view').getByRole('button', { name: '6', exact: true }).click();
  await page.locator('#view').getByRole('button', { name: /1 bouteille/ }).click();
  await expect(page.locator('#view').getByRole('button', { name: 'Choisis le jus' })).toBeDisabled();
  await page.locator('#view').getByRole('button', { name: /ananas/ }).click();
  await page.locator('#view').getByRole('button', { name: /Ajouter la bouteille/ }).click();

  // Bouteille Vodka, 4 verres, 7 Coca-Cola = 100
  await page.locator('#view').getByRole('button', { name: /^Vodka$/ }).click();
  const coca = page.locator('#view').getByRole('button', { name: /Coca-Cola/ });
  for (let i = 0; i < 7; i++) await coca.click();
  await expect(page.locator('#view').getByRole('button', { name: /Ajouter la bouteille · 100 €/ })).toBeVisible();
  await page.locator('#view').getByRole('button', { name: /Ajouter la bouteille/ }).click();
  await back(page).click();

  // Caïpi maracuja = 10
  await page.locator('#view').getByRole('button', { name: /^Alcool au verre/ }).click();
  await page.locator('#view').getByRole('button', { name: /Caïpi maracuja/ }).click();

  // Commande
  await bar(page).click();
  await expect(page.getByRole('heading', { name: 'Commande' })).toBeVisible();
  const rows = page.locator('.row');
  await expect(rows).toHaveCount(6);
  const expected = [
    ['Heineken', '2', '10 €'],
    ['Vodka', '1', '15 €', '+ Red Bull'],
    ['Jack Daniel', '1', '12 €', 'sec'],
    ['Bouteille Rhum', '1', '90 €', '6 verres', 'ananas'],
    ['Bouteille Vodka', '1', '100 €', '4 verres', '7 Coca-Cola', '2 en plus'],
    ['Caïpi', '1', '10 €'],
  ];
  for (const [label, qty, price, ...extra] of expected) {
    const row = rows.filter({ hasText: label }).first();
    await expect(row, label).toBeVisible();
    await expect(row.locator('output')).toHaveText(qty);
    await expect(row.locator('.lp')).toHaveText(new RegExp(`^${price.replace(' €', '')}\\s*€$`));
    for (const e of extra) await expect(row).toContainText(e);
  }
  // Heineken x2 = 10 € : la ligne est à 2 x 5
  await expect(page.locator('.total b')).toHaveText(euro(237));

  // Montrer au client
  await page.locator('#view').getByRole('button', { name: 'Montrer au client' }).click();
  const show = page.locator('#show');
  await expect(show).toBeVisible();
  await expect(show.locator('.tot')).toContainText('TOTAL');
  await expect(show.locator('.tot b')).toHaveText(euro(237));
  await show.click();
  await expect(show).toBeHidden();

  // Encaisser 100 + 100 + 50 -> à rendre 13
  await page.locator('#view').getByRole('button', { name: /^Encaisser/ }).click();
  await expect(page.locator('.cashline').first().locator('b')).toHaveText(euro(237));
  for (const b of ['100', '100', '50']) await page.locator('#view').getByRole('button', { name: new RegExp(`^${b}\\s*€$`) }).click();
  const rendu = page.locator('.cashline.rendu');
  await expect(rendu).toContainText('À rendre');
  await expect(rendu.locator('b')).toHaveText(euro(13));

  // Terminé
  await page.locator('#view').getByRole('button', { name: /Terminé/ }).click();
  await expect(bar(page)).toContainText('Commande vide');
  await expect(page.getByRole('heading', { name: /Qu’est-ce que tu bois/ })).toBeVisible();
  await expect(page.locator('#cur-order')).toContainText('Aucune boisson pour l’instant');
  await page.locator('#view').getByRole('button', { name: /^Bière/ }).click();
  await bar(page).click();
  await expect(page.getByText('Rien pour l’instant.')).toBeVisible();

  expect(errors, 'erreurs JS / console').toEqual([]);
});

test('rendu monnaie : il manque quand le client donne trop peu', async ({ page }) => {
  await openHome(page);
  await page.locator('#view').getByRole('button', { name: /^Bière/ }).click();
  await page.locator('#view').getByRole('button', { name: /Heineken/ }).click();
  await bar(page).click();
  await page.locator('#view').getByRole('button', { name: /^Encaisser/ }).click();
  await page.locator('#view').getByRole('button', { name: /^5\s*€$/ }).first().click(); // 5 € = compte juste
  await expect(page.locator('.cashline.rendu b')).toHaveText(euro(0));
  await page.locator('#view').getByRole('button', { name: 'Effacer' }).click();
  await expect(page.locator('.cashline.rendu')).toContainText('Il manque');
  await expect(page.locator('.cashline.rendu b')).toHaveText(euro(5));
});
