import { test, expect, openHome, bar, back } from './fixtures.js';

const view = page => page.locator('#view');

test('trois drapeaux sur l’accueil, le français est choisi par défaut', async ({ page }) => {
  await openHome(page);
  const flags = page.locator('.langs .lang');
  await expect(flags).toHaveCount(3);
  await expect(flags.nth(0)).toHaveAttribute('aria-pressed', 'true');
  await expect(flags.nth(1)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  for (const svg of await flags.locator('svg').all()) await expect(svg).toBeVisible();
});

test('portugais du Brésil : accueil, commande d’une bière, total pour le client', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'Português (Brasil)' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.getByRole('heading', { name: /O que você vai beber/ })).toBeVisible();
  await expect(view(page).getByRole('button', { name: /^Cerveja/ })).toBeVisible();
  await expect(view(page).getByRole('button', { name: /^Garrafa/ })).toBeVisible();

  await view(page).getByRole('button', { name: /^Cerveja/ }).click();
  await view(page).getByRole('button', { name: /Heineken/ }).click();
  await expect(page.locator('#toast .undo')).toHaveText('Desfazer');
  await back(page).click();

  await expect(page.locator('#cur-order')).toContainText('Pedido em andamento');
  await page.locator('#cur-order').getByRole('button', { name: 'Mostrar ao cliente' }).click();
  await expect(page.locator('#show')).toContainText('TOTAL');
  await expect(page.locator('#show')).toContainText('Toque na tela para voltar');
});

test('anglais : un alcool avec un soft traduit, bouteille avec ses verres', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: /What would you like to drink/ })).toBeVisible();

  await view(page).getByRole('button', { name: /^Spirits by the glass/ }).click();
  await view(page).getByRole('button', { name: /^Vodka/ }).click();
  await expect(page.getByText('with a mixer')).toBeVisible();
  await expect(view(page).getByRole('button', { name: 'No, neat' })).toBeVisible();
  await view(page).getByRole('button', { name: 'No, neat' }).click();
  await expect(page.locator('#cur-order')).toContainText('Vodka');
  await expect(bar(page)).toContainText('1 item');

  await view(page).getByRole('button', { name: /^Bottle/ }).click();
  await view(page).getByRole('button', { name: /^Rum$/ }).click();
  await expect(view(page).getByText('How many glasses?')).toBeVisible();
  await view(page).getByRole('button', { name: /1 bottle/ }).click();
  await expect(view(page).getByRole('button', { name: 'Choose the juice' })).toBeDisabled();
  await view(page).getByRole('button', { name: /Pineapple juice/ }).click();
  await view(page).getByRole('button', { name: /Add the bottle/ }).click();
  await expect(bar(page)).toContainText('Bottle Rum');
});

test('la langue choisie est gardée après rechargement ; les réglages restent en français', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'English' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: /What would you like to drink/ })).toBeVisible();
  await expect(page.locator('.langs .lang').nth(2)).toHaveAttribute('aria-pressed', 'true');
});
