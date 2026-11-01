import { test, expect, euro, openHome, bar } from './fixtures.js';

test('Annuler depuis le toast retire le dernier ajout', async ({ page }) => {
  await openHome(page);
  await page.locator('#view').getByRole('button', { name: /^Bière/ }).click();
  await page.locator('#view').getByRole('button', { name: /Guinness/ }).click();
  await expect(bar(page)).toContainText('1 Guinness');
  const toast = page.locator('#toast');
  await expect(toast).toContainText('+1 Guinness');
  await toast.getByRole('button', { name: 'Annuler' }).click();
  await expect(bar(page)).toContainText('Commande vide');
  await expect(bar(page).locator('.tt')).toHaveText(euro(0));
});

test('la commande survit à un rechargement', async ({ page }) => {
  await openHome(page);
  await page.locator('#view').getByRole('button', { name: /^Bière/ }).click();
  await page.locator('#view').getByRole('button', { name: /Corona/ }).click();
  await page.locator('#view').getByRole('button', { name: /Corona/ }).click();
  await expect(bar(page).locator('.tt')).toHaveText(euro(14));
  await page.reload();
  await expect(page.getByRole('heading', { name: /Qu’est-ce que tu bois/ })).toBeVisible();
  await expect(bar(page)).toContainText('2 Corona');
  await expect(bar(page).locator('.tt')).toHaveText(euro(14));
  await bar(page).click();
  await expect(page.locator('.row').filter({ hasText: 'Corona' }).locator('output')).toHaveText('2');
});

test('vider la commande efface aussi la sauvegarde', async ({ page }) => {
  await openHome(page);
  await page.locator('#view').getByRole('button', { name: /^Bière/ }).click();
  await page.locator('#view').getByRole('button', { name: /Heineken/ }).click();
  await bar(page).click();
  await page.locator('#view').getByRole('button', { name: 'Vider la commande' }).click();
  await page.reload();
  await expect(bar(page)).toContainText('Commande vide');
});
