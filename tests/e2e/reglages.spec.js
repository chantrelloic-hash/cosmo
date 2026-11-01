import { test, expect, euro, openHome, openSettings, typeCode, bar } from './fixtures.js';

test('réglages : code, rupture, prix, supplément, remise à zéro', async ({ page }) => {
  await openHome(page);

  // code faux refusé
  await openSettings(page, '0000');
  await expect(page.getByRole('alert').filter({ hasText: 'Code incorrect' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Réglages' })).toHaveCount(0);

  // bon code
  await typeCode(page, '1234');
  const sheet = page.getByRole('dialog', { name: 'Réglages' });
  await expect(sheet.getByRole('heading', { name: 'Réglages' })).toBeVisible();

  // rupture Corona
  await sheet.locator('.prow[data-key="corona"]').getByRole('switch').click();
  await expect(sheet.locator('.prow[data-key="corona"]')).toContainText('Rupture');

  // prix Heineken 6
  const hp = sheet.locator('.prow[data-key="heineken"] input');
  await hp.fill('6');
  await hp.press('Enter');
  await expect(sheet.locator('.prow[data-key="heineken"]')).toContainText('carte : 5 €');

  // supplément soft 6
  const sup = sheet.getByLabel('Supplément soft');
  await sup.fill('6');
  await sup.press('Enter');
  await expect(sup).toHaveValue('6');

  await sheet.getByRole('button', { name: 'Terminer' }).click();
  await expect(sheet).toBeHidden();

  // Corona non cliquable + « Rupture »
  await page.locator('#view').getByRole('button', { name: /^Bière/ }).click();
  const corona = page.locator('#view').getByRole('button', { name: /Corona/ });
  await expect(corona).toBeDisabled();
  await expect(corona).toContainText('Rupture');
  await expect(page.locator('#view').getByRole('button', { name: /Heineken/ })).toContainText('6 €');
  await page.locator('#view').getByRole('button', { name: /Heineken/ }).click();
  await expect(bar(page).locator('.tt')).toHaveText(euro(6));
  await page.getByRole('button', { name: 'Retour' }).click();

  // Vodka avec soft = 16
  await page.locator('#view').getByRole('button', { name: /^Alcool au verre/ }).click();
  await page.locator('#view').getByRole('button', { name: /^Vodka/ }).click();
  await expect(page.getByText('Oui, avec')).toContainText('16 €');
  await page.locator('#view').getByRole('button', { name: /Coca-Cola/ }).click();
  await expect(bar(page).locator('.tt')).toHaveText(euro(22));

  // les réglages survivent au rechargement
  await page.reload();
  await page.locator('#view').getByRole('button', { name: /^Bière/ }).click();
  await expect(page.locator('#view').getByRole('button', { name: /Corona/ })).toBeDisabled();

  // remise à zéro avec confirmation
  await openSettings(page);
  await sheet.getByRole('button', { name: 'Remettre la carte d’origine' }).click();
  await expect(sheet.getByText(/Remettre tous les prix/)).toBeVisible();
  await sheet.getByRole('button', { name: 'Non, garder' }).click();
  await expect(page.locator('#view').getByRole('button', { name: /Corona/ })).toBeDisabled();
  await sheet.getByRole('button', { name: 'Remettre la carte d’origine' }).click();
  await sheet.getByRole('button', { name: 'Oui, remettre' }).click();
  await expect(sheet.getByRole('status')).toContainText('Carte d’origine remise');
  await sheet.getByRole('button', { name: 'Terminer' }).click();
  await expect(page.locator('#view').getByRole('button', { name: /Corona/ })).toBeEnabled();
  await expect(page.locator('#view').getByRole('button', { name: /Heineken/ })).toContainText('5 €');
});

test('réglages : un prix invalide est refusé', async ({ page }) => {
  await openHome(page);
  await openSettings(page);
  const hp = page.locator('.prow[data-key="heineken"] input');
  await hp.fill('abc');
  await hp.press('Enter');
  await expect(hp).toHaveValue('5');
});
