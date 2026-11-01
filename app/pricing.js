/* Calculs de prix purs (aucun accès au DOM) : facile à tester. Tous les montants sont en euros entiers. */

/**
 * Prix d'un alcool au verre.
 * @param {number} basePrice Prix de l'alcool sec.
 * @param {boolean} withSoft Vrai si servi avec un soft.
 * @param {number} softSupplement Supplément pour un soft (ex. 5).
 * @returns {number} basePrice, ou basePrice + softSupplement.
 */
export function glassPrice(basePrice, withSoft, softSupplement) {
  return basePrice + (withSoft ? softSupplement : 0);
}

/**
 * Nombre total de softs choisis pour une bouteille.
 * @param {Record<string, number>} softs Quantité par id de soft, ex. {coca: 2, redbull: 1}.
 * @returns {number}
 */
export function countSofts(softs) {
  return Object.values(softs).reduce((a, n) => a + n, 0);
}

/**
 * Nombre de softs facturés en plus des softs inclus avec la bouteille.
 * @param {number} softCount Nombre de softs choisis.
 * @param {number} includedSofts Softs inclus (ex. 5).
 * @returns {number} max(0, softCount - includedSofts)
 */
export function extraSofts(softCount, includedSofts) {
  return Math.max(0, softCount - includedSofts);
}

/**
 * Prix d'une bouteille avec ses softs. Une bouteille de jus (mode "jus") et le
 * champagne (flûtes, pas de softs) n'ont jamais de supplément.
 * @param {number} bottlePrice Prix de la bouteille (palier).
 * @param {{mode?: 'softs'|'jus', champagne?: boolean, softCount?: number}} opts
 * @param {number} includedSofts Softs inclus avec la bouteille (ex. 5).
 * @param {number} softSupplement Supplément par soft au-delà (ex. 5).
 * @returns {number} bottlePrice + softSupplement * softs en trop.
 */
export function bottlePrice(bottlePrice, opts, includedSofts, softSupplement) {
  const { mode = 'softs', champagne = false, softCount = 0 } = opts || {};
  if (champagne || mode === 'jus') return bottlePrice;
  return bottlePrice + extraSofts(softCount, includedSofts) * softSupplement;
}

/**
 * Total d'une commande.
 * @param {{price: number, qty: number}[]} order Lignes de commande.
 * @returns {number}
 */
export function orderTotal(order) {
  return order.reduce((s, i) => s + i.qty * i.price, 0);
}

/**
 * Nombre d'articles d'une commande.
 * @param {{qty: number}[]} order
 * @returns {number}
 */
export function orderCount(order) {
  return order.reduce((s, i) => s + i.qty, 0);
}

/**
 * Rendu monnaie. Négatif si le client n'a pas donné assez (il manque |résultat|).
 * @param {number} received Montant reçu.
 * @param {number} total Montant à payer.
 * @returns {number} received - total
 */
export function changeDue(received, total) {
  return received - total;
}
