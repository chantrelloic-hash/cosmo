import { test as base, expect } from '@playwright/test';

/* Les polices Google ne sont pas nécessaires aux tests (l'appli retombe sur les polices système) :
   on les coupe pour que les tests ne dépendent pas du réseau. */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await use(context);
  },
});
export { expect };

const euro = n => new RegExp(`^${n}\\s*€$`);
export { euro };

/** Ouvre l'accueil et attend que la carte soit chargée. */
export async function openHome(page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Qu’est-ce que tu bois/ })).toBeVisible();
}

export const bar = page => page.locator('#bar');
export const back = page => page.getByRole('button', { name: 'Retour' });

/** Appui long (~1 s) sur le logo puis saisie du code. */
export async function openSettings(page, code = '1234') {
  const mark = page.locator('.mark');
  const box = await mark.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1200);
  await page.mouse.up();
  await expect(page.getByRole('heading', { name: 'Code' })).toBeVisible();
  await typeCode(page, code);
}
export async function typeCode(page, code) {
  for (const d of code) await page.locator('.pad').getByRole('button', { name: d, exact: true }).click();
}

export async function noHorizontalScroll(page) {
  const o = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    bw: document.body.scrollWidth,
  }));
  expect(o.sw, 'scrollWidth du document').toBeLessThanOrEqual(o.cw);
  expect(o.bw, 'scrollWidth du body').toBeLessThanOrEqual(o.cw);
}
