import { test, expect, openHome, bar } from './fixtures.js';

test('hors ligne : l’accueil s’affiche et on peut commander', async ({ page, context }) => {
  await openHome(page);
  // service worker actif et qui contrôle la page
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Qu’est-ce que tu bois/ })).toBeVisible();

  await page.getByRole('button', { name: /^Bière/ }).click();
  await page.getByRole('button', { name: /Heineken/ }).click();
  await expect(bar(page)).toContainText('1 Heineken');
  await context.setOffline(false);
});
