import { test, expect, openHome, openSettings, noHorizontalScroll } from './fixtures.js';

test('pas de défilement horizontal sur les écrans principaux', async ({ page }) => {
  await openHome(page);
  await noHorizontalScroll(page); // accueil

  await page.locator('#view').getByRole('button', { name: /^Bière/ }).click();
  await expect(page.getByRole('heading', { name: 'Bières' })).toBeVisible();
  await noHorizontalScroll(page);
  await page.getByRole('button', { name: 'Retour' }).click();

  await page.locator('#view').getByRole('button', { name: /^Soft/ }).click();
  await expect(page.getByRole('heading', { name: 'Softs' })).toBeVisible();
  await noHorizontalScroll(page);
  await page.getByRole('button', { name: 'Retour' }).click();

  await page.locator('#view').getByRole('button', { name: /^Alcool au verre/ }).click();
  await expect(page.getByRole('heading', { name: 'Alcool au verre' })).toBeVisible();
  await noHorizontalScroll(page);
  await page.locator('#view').getByRole('button', { name: /^Whisky/ }).click();
  await expect(page.getByRole('heading', { name: 'Whisky' })).toBeVisible();
  await noHorizontalScroll(page);
  await page.locator('#view').getByRole('button', { name: /Jack Daniel/ }).click();
  await expect(page.getByText('avec un soft', { exact: false }).first()).toBeVisible();
  await noHorizontalScroll(page);
  await page.getByRole('button', { name: 'Retour' }).click();
  await page.getByRole('button', { name: 'Accueil' }).click();

  await page.locator('#view').getByRole('button', { name: /^Bouteille/ }).click();
  await expect(page.getByRole('heading', { name: 'Bouteilles' })).toBeVisible();
  await noHorizontalScroll(page);
  await page.locator('#view').getByRole('button', { name: /^Vodka$/ }).click();
  await expect(page.locator('#view').getByRole('button', { name: /Ajouter la bouteille/ })).toBeVisible();
  for (let i = 0; i < 7; i++) await page.locator('#view').getByRole('button', { name: /Coca-Cola/ }).click();
  await noHorizontalScroll(page);
  await page.locator('#view').getByRole('button', { name: /Ajouter la bouteille/ }).click();

  await page.locator('#bar').click();
  await expect(page.getByRole('heading', { name: 'Commande' })).toBeVisible();
  await noHorizontalScroll(page);
  await page.locator('#view').getByRole('button', { name: 'Montrer au client' }).click();
  await noHorizontalScroll(page);
  await page.locator('#show').click();
  await page.locator('#view').getByRole('button', { name: /^Encaisser/ }).click();
  await expect(page.getByRole('heading', { name: 'Encaisser' })).toBeVisible();
  await noHorizontalScroll(page);
});

test('pas de défilement horizontal dans les réglages', async ({ page }) => {
  await openHome(page);
  await openSettings(page);
  await expect(page.getByRole('heading', { name: 'Réglages' })).toBeVisible();
  await noHorizontalScroll(page);
  const sheetOverflow = await page.locator('#sheet').evaluate(el => el.scrollWidth - el.clientWidth);
  expect(sheetOverflow).toBeLessThanOrEqual(0);
});
