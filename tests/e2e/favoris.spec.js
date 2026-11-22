import { test, expect, euro, openHome, openSettings, bar, back, noHorizontalScroll } from './fixtures.js';

const view = page => page.locator('#view');
const cur = page => page.locator('#cur-order');
const favBeer = (page, name) => view(page).locator('.fav').filter({ hasText: name });
const favSpirit = (page, name) => view(page).locator('.favs').filter({ hasText: name });
const qtyBtn = (page, n) => view(page).getByRole('button', { name: new RegExp(`^${n} · `) });

/** Collecte les erreurs JS / console (hors polices Google coupées par les fixtures). */
function watchErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_FAILED|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  return errors;
}

test('les plus vendus : commande complète depuis l’accueil, total 97 € en bas', async ({ page }) => {
  const errors = watchErrors(page);
  await openHome(page);

  // l'accueil : section « Les plus vendus » avant « Toute la carte », 3 bières + Rhum + Vodka
  await expect(page.getByRole('heading', { name: 'Les plus vendus' })).toBeVisible();
  await expect(view(page).locator('.fav')).toHaveCount(3);
  await expect(view(page).locator('.favs')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Toute la carte' })).toBeVisible();
  await expect(favBeer(page, 'Heineken')).toContainText('5 €');
  await expect(favBeer(page, 'Desperados').first()).toContainText('7 €');
  await expect(favSpirit(page, 'Rhum')).toContainText('10 €');
  await expect(favSpirit(page, 'Rhum')).toContainText('avec soft 15 €');
  await expect(favSpirit(page, 'Vodka')).toContainText('avec soft 15 €');
  const order = await page.evaluate(() => {
    const h = [...document.querySelectorAll('h2.sec')].map(e => e.textContent.trim());
    return h;
  });
  expect(order).toEqual(['Les plus vendus', 'Toute la carte', 'Commande en cours']);
  await expect(cur(page)).toContainText('Aucune boisson pour l’instant');

  // bières : un tap = +1, on reste sur l'accueil, toast avec Annuler, badge de quantité
  await favBeer(page, 'Heineken').click();
  await expect(page.locator('#toast')).toContainText('+1 Heineken');
  await expect(page.locator('#toast').getByRole('button', { name: 'Annuler' })).toBeVisible();
  await favBeer(page, 'Heineken').click();
  await expect(favBeer(page, 'Heineken').locator('.qty')).toHaveText('2');
  await expect(page.getByRole('heading', { name: /Qu’est-ce que tu bois/ })).toBeVisible();
  await favBeer(page, 'Rouge').click();
  await expect(favBeer(page, 'Rouge').locator('.qty')).toHaveText('1');

  // Rhum -> Coca -> quantité 3 -> retour accueil
  await favSpirit(page, 'Rhum').click();
  await expect(page.getByText('Rhum : avec quoi ?')).toBeVisible();
  await expect(view(page).getByRole('button', { name: /^Coca-Cola/ })).toContainText('15 €');
  await expect(view(page).getByRole('button', { name: /^Autre soft/ })).toContainText('15 €');
  await expect(view(page).getByRole('button', { name: /^Rien \(sec\)/ })).toContainText('10 €');
  await view(page).getByRole('button', { name: /^Coca-Cola/ }).click();
  await expect(page.getByText('Rhum + Coca-Cola').first()).toBeVisible();
  for (let n = 1; n <= 6; n++) await expect(qtyBtn(page, n)).toContainText(`${15 * n} €`);
  await qtyBtn(page, 3).click();
  await expect(page.getByRole('heading', { name: /Qu’est-ce que tu bois/ })).toBeVisible();
  await expect(cur(page).locator('.row').filter({ hasText: 'Rhum' })).toContainText('3 × Rhum + Coca-Cola');
  await expect(cur(page).locator('.row').filter({ hasText: 'Rhum' }).locator('.lp')).toHaveText(euro(45));

  // Vodka -> Autre soft -> Schweppes -> quantité 1
  await favSpirit(page, 'Vodka').click();
  await expect(view(page).getByRole('button', { name: /^Red Bull/ })).toContainText('15 €');
  await expect(view(page).getByRole('button', { name: /^Jus de pomme/ })).toContainText('15 €');
  await view(page).getByRole('button', { name: /^Autre soft/ }).click();
  await expect(view(page).getByRole('button', { name: /Schweppes/ })).toBeVisible();
  await expect(view(page).locator('.chip')).toHaveCount(7); // tous les softs mélangeables
  await view(page).getByRole('button', { name: /Schweppes/ }).click();
  await expect(page.getByText('Vodka + Schweppes').first()).toBeVisible();
  await qtyBtn(page, 1).click();

  // Vodka -> Rien (sec) -> quantité 2
  await favSpirit(page, 'Vodka').click();
  await view(page).getByRole('button', { name: /^Rien \(sec\)/ }).click();
  await expect(page.getByText('Vodka sec').first()).toBeVisible();
  await qtyBtn(page, 2).click();

  // la liste et le total en bas de l'accueil : 10 + 7 + 45 + 15 + 20 = 97 €
  await expect(cur(page).locator('.row')).toHaveCount(5);
  await expect(cur(page).locator('.total b')).toHaveText(euro(97));
  await expect(cur(page).getByRole('button', { name: 'Montrer au client' })).toBeVisible();
  await expect(cur(page).getByRole('button', { name: 'Encaisser' })).toBeVisible();
  await expect(cur(page).getByRole('button', { name: 'Vider' })).toBeVisible();
  await expect(bar(page).locator('.tt')).toHaveText(euro(97));
  await expect(bar(page)).toContainText('9 articles');
  await noHorizontalScroll(page);

  // Montrer au client / Encaisser depuis l'accueil
  await cur(page).getByRole('button', { name: 'Montrer au client' }).click();
  await expect(page.locator('#show .tot b')).toHaveText(euro(97));
  await page.locator('#show').click();
  await cur(page).getByRole('button', { name: 'Encaisser' }).click();
  await expect(page.getByRole('heading', { name: 'Encaisser' })).toBeVisible();
  await expect(page.locator('.cashline').first().locator('b')).toHaveText(euro(97));
  await back(page).click();
  await expect(cur(page).locator('.total b')).toHaveText(euro(97));

  // Vider
  await cur(page).getByRole('button', { name: 'Vider' }).click();
  await expect(cur(page)).toContainText('Aucune boisson pour l’instant');
  await expect(cur(page).locator('.total b')).toHaveText(euro(0));

  expect(errors, 'erreurs JS / console').toEqual([]);
});

test('Annuler après un ajout de quantité 3 retire les 3 d’un coup', async ({ page }) => {
  await openHome(page);
  await favBeer(page, 'Heineken').click(); // une Heineken déjà au panier
  await favSpirit(page, 'Rhum').click();
  await view(page).getByRole('button', { name: /^Coca-Cola/ }).click();
  await qtyBtn(page, 3).click();
  const toast = page.locator('#toast');
  await expect(toast).toContainText('+3 Rhum + Coca-Cola');
  await expect(cur(page).locator('.total b')).toHaveText(euro(50));
  await toast.getByRole('button', { name: 'Annuler' }).click();
  await expect(cur(page).locator('.row')).toHaveCount(1);
  await expect(cur(page)).not.toContainText('Rhum');
  await expect(cur(page).locator('.total b')).toHaveText(euro(5));

  // fusion avec une ligne identique : 2 puis 3 = une seule ligne de 5 ; annuler retire seulement les 3
  for (const n of [2, 3]) {
    await favSpirit(page, 'Rhum').click();
    await view(page).getByRole('button', { name: /^Coca-Cola/ }).click();
    await qtyBtn(page, n).click();
  }
  await expect(cur(page).locator('.row').filter({ hasText: 'Rhum' })).toHaveCount(1);
  await expect(cur(page).locator('.row').filter({ hasText: 'Rhum' })).toContainText('5 × Rhum');
  await toast.getByRole('button', { name: 'Annuler' }).click();
  await expect(cur(page).locator('.row').filter({ hasText: 'Rhum' })).toContainText('2 × Rhum');
});

test('boutons − et + de la liste de l’accueil (touchables, ≥ 44 px)', async ({ page }) => {
  await openHome(page);
  await favBeer(page, 'Heineken').click();
  await favBeer(page, 'Heineken').click();
  const row = cur(page).locator('.row').first();
  await expect(row).toContainText('2 × Heineken');
  const plus = row.getByRole('button', { name: 'Ajouter un' }), minus = row.getByRole('button', { name: 'Retirer un' });
  for (const b of [plus, minus]) {
    const box = await b.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await plus.click();
  await expect(row).toContainText('3 × Heineken');
  await expect(cur(page).locator('.total b')).toHaveText(euro(15));
  await minus.click();
  await minus.click();
  await expect(row).toContainText('1 × Heineken');
  await expect(favBeer(page, 'Heineken').locator('.qty')).toHaveText('1');
  await minus.click();
  await expect(cur(page).locator('.row')).toHaveCount(0);
  await expect(cur(page)).toContainText('Aucune boisson pour l’instant');
  await expect(bar(page)).toContainText('Commande vide');
});

test('petite barre de l’accueil : articles + total, défile vers la commande, se masque quand elle est visible', async ({ page }) => {
  await openHome(page);
  await favBeer(page, 'Heineken').click();
  await favBeer(page, 'Heineken').click();
  await expect(bar(page)).toBeVisible();
  await expect(bar(page)).toContainText('2 articles');
  await expect(bar(page).locator('.tt')).toHaveText(euro(10));
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await bar(page).click();
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBeGreaterThan(100);
  await expect(cur(page)).toBeInViewport();
  await expect(page.locator('.bar')).toBeHidden(); // la section est visible : la barre fait doublon
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('.bar')).toBeVisible();
  // sur un autre écran : la barre détaillée habituelle
  await view(page).getByRole('button', { name: /^Bière/ }).click();
  await expect(bar(page)).toContainText('2 Heineken');
  await expect(page.locator('.bar')).not.toHaveClass(/mini/);
});

test('rupture réglée sur le téléphone : la tuile du favori est grisée et non cliquable', async ({ page }) => {
  await openHome(page);
  await openSettings(page);
  const sheet = page.getByRole('dialog', { name: 'Réglages' });
  await sheet.locator('.prow[data-key="desperados"]').getByRole('switch').click();
  await sheet.locator('.prow[data-key="rhum"]').getByRole('switch').click();
  await sheet.locator('.prow[data-key="coca"]').getByRole('switch').click();
  // prix modifiés : Heineken 6, supplément soft 6
  const hp = sheet.locator('.prow[data-key="heineken"] input');
  await hp.fill('6'); await hp.press('Enter');
  const sup = sheet.getByLabel('Supplément soft');
  await sup.fill('6'); await sup.press('Enter');
  await sheet.getByRole('button', { name: 'Terminer' }).click();

  const desp = favBeer(page, 'Original');
  await expect(desp).toBeDisabled();
  await expect(desp).toContainText('Rupture');
  await expect(favSpirit(page, 'Rhum')).toBeDisabled();
  await expect(favSpirit(page, 'Rhum')).toContainText('Rupture');
  await expect(favBeer(page, 'Rouge')).toBeEnabled();
  await expect(favBeer(page, 'Heineken')).toContainText('6 €');
  await expect(favSpirit(page, 'Vodka')).toContainText('avec soft 16 €');
  await favBeer(page, 'Heineken').click();
  await expect(cur(page).locator('.total b')).toHaveText(euro(6));

  // Vodka : choix avec supplément à 6, mélange favori en rupture (Coca) non concerné ici, Red Bull dispo
  await favSpirit(page, 'Vodka').click();
  await expect(view(page).getByRole('button', { name: /^Red Bull/ })).toContainText('16 €');
  await expect(view(page).getByRole('button', { name: /^Rien \(sec\)/ })).toContainText('10 €');
  await view(page).getByRole('button', { name: /^Red Bull/ }).click();
  await qtyBtn(page, 2).click();
  await expect(cur(page).locator('.total b')).toHaveText(euro(38));

  // « Autre soft » : le Coca en rupture est grisé
  await favSpirit(page, 'Vodka').click();
  await view(page).getByRole('button', { name: /^Autre soft/ }).click();
  await expect(view(page).getByRole('button', { name: /Coca-Cola/ })).toBeDisabled();
});

test('rupture d’un mélange favori : le choix est grisé dans « avec quoi ? »', async ({ page }) => {
  await openHome(page);
  await openSettings(page);
  const sheet = page.getByRole('dialog', { name: 'Réglages' });
  await sheet.locator('.prow[data-key="coca"]').getByRole('switch').click();
  await sheet.getByRole('button', { name: 'Terminer' }).click();
  await favSpirit(page, 'Rhum').click();
  const coca = view(page).getByRole('button', { name: /Coca-Cola/ });
  await expect(coca).toBeDisabled();
  await expect(coca).toContainText('Rupture');
  await expect(view(page).getByRole('button', { name: /^Rien \(sec\)/ })).toBeEnabled();
});

test('pas de défilement horizontal : accueil vide, accueil rempli, choix, quantité', async ({ page }) => {
  const errors = watchErrors(page);
  await openHome(page);
  await noHorizontalScroll(page);
  for (const n of [0, 1, 2]) await view(page).locator('.fav').nth(n).click();
  await favSpirit(page, 'Rhum').click();
  await noHorizontalScroll(page);
  await view(page).getByRole('button', { name: /^Coca-Cola/ }).click();
  await noHorizontalScroll(page);
  await qtyBtn(page, 6).click();
  await noHorizontalScroll(page);
  await favSpirit(page, 'Vodka').click();
  await noHorizontalScroll(page);
  await view(page).getByRole('button', { name: /^Autre soft/ }).click();
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});

test('portugais : les nouveaux libellés sont traduits', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'Português (Brasil)' }).click();
  await expect(page.getByRole('heading', { name: 'Os mais vendidos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cardápio completo' })).toBeVisible();
  await expect(cur(page)).toContainText('Pedido em andamento');
  await expect(cur(page)).toContainText('Nenhuma bebida por enquanto');
  await expect(favSpirit(page, 'Rum')).toContainText('com refri 15 €');
  await favBeer(page, 'Heineken').click();
  await expect(page.locator('#toast .undo')).toHaveText('Desfazer');
  await expect(bar(page)).toContainText('1 item');
  await favSpirit(page, 'Rum').click();
  await expect(page.getByText('Rum: com o quê?')).toBeVisible();
  await expect(view(page).getByRole('button', { name: /^Outro refri/ })).toBeVisible();
  await expect(view(page).getByRole('button', { name: /^Nada \(puro\)/ })).toContainText('10 €');
  await view(page).getByRole('button', { name: /^Outro refri/ }).click();
  await expect(page.getByText('Rum: qual refri?')).toBeVisible();
  await view(page).getByRole('button', { name: /Coca-Cola/ }).click();
  await expect(page.getByText('Quantos?')).toBeVisible();
  await qtyBtn(page, 2).click();
  await expect(cur(page)).toContainText('2 × Rum');
  await expect(cur(page)).toContainText('+ Coca-Cola');
  await expect(cur(page).getByRole('button', { name: 'Mostrar ao cliente' })).toBeVisible();
  await expect(cur(page).getByRole('button', { name: 'Receber' })).toBeVisible();
  await expect(cur(page).getByRole('button', { name: 'Limpar' })).toBeVisible();
  await expect(bar(page)).toContainText('3 itens');
});

test('anglais : les nouveaux libellés sont traduits', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'Best sellers' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Full menu' })).toBeVisible();
  await expect(cur(page)).toContainText('Current order');
  await expect(cur(page)).toContainText('No drinks yet');
  await expect(favSpirit(page, 'Rum')).toContainText('with mixer 15 €');
  await favSpirit(page, 'Vodka').click();
  await expect(page.getByText('Vodka: with what?')).toBeVisible();
  await expect(view(page).getByRole('button', { name: /^Apple juice/ })).toContainText('15 €');
  await expect(view(page).getByRole('button', { name: /^Other mixer/ })).toBeVisible();
  await expect(view(page).getByRole('button', { name: /^Nothing \(neat\)/ })).toContainText('10 €');
  await view(page).getByRole('button', { name: /^Nothing \(neat\)/ }).click();
  await expect(page.getByText('How many?')).toBeVisible();
  await expect(page.getByText('Vodka neat')).toBeVisible();
  await qtyBtn(page, 4).click();
  await expect(cur(page)).toContainText('4 × Vodka');
  await expect(cur(page).locator('.total span')).toHaveText('TOTAL');
  await expect(cur(page).locator('.total b')).toHaveText(euro(40));
  await expect(cur(page).getByRole('button', { name: 'Show to customer' })).toBeVisible();
  await expect(cur(page).getByRole('button', { name: 'Cash in' })).toBeVisible();
  await expect(cur(page).getByRole('button', { name: 'Clear' })).toBeVisible();
  await expect(bar(page)).toContainText('4 items');
});

test('les photos des produits s’affichent (tuiles favoris et cartes de bières, softs)', async ({ page }) => {
  await openHome(page);
  const loaded = sel => page.locator(sel).evaluateAll(imgs => imgs.map(i => i.complete && i.naturalWidth > 0));
  await expect.poll(async () => (await loaded('.fav img')).every(Boolean) && (await loaded('.fav img')).length === 3).toBe(true);
  await expect.poll(async () => (await loaded('.favs img')).length).toBe(2);
  expect((await loaded('.favs img')).every(Boolean)).toBe(true);
  await view(page).getByRole('button', { name: /^Soft/ }).click();
  await expect.poll(async () => (await loaded('.brand img')).length).toBe(2); // Coca-Cola, Red Bull
  expect((await loaded('.brand img')).every(Boolean)).toBe(true);
});
