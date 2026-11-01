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

/**
 * Lit un prix saisi à la main : entier de 0 à 999, rien d'autre.
 * @param {string|number} text Texte saisi (espaces autour tolérés).
 * @returns {number|null} L'entier, ou null si la saisie n'est pas valide (vide, virgule, négatif, lettres...).
 */
export function parsePrice(text) {
  const s = String(text).trim();
  return /^\d{1,3}$/.test(s) ? Number(s) : null;
}

/**
 * Applique la surcouche des réglages à un produit de menu.json.
 * `available: false` dans la surcouche = rupture (`soldOut: true`, le produit reste affiché grisé).
 * @param {object} product Produit d'origine (avec ou sans `price`).
 * @param {{price?: number, available?: boolean}} [override] Surcouche pour ce produit.
 * @returns {object} Copie du produit avec le prix surchargé (si entier) et `soldOut`.
 */
export function applyOverride(product, override) {
  const o = override || {};
  const out = { ...product, soldOut: o.available === false };
  if (Number.isInteger(o.price)) out.price = o.price;
  return out;
}

/**
 * Ajoute (ou retire) une modification à la surcouche, sans muter l'objet reçu.
 * Les valeurs identiques à la carte d'origine (`base`) sont supprimées : une surcouche vide disparaît.
 * @param {Record<string, object>} overrides Surcouches par id de produit.
 * @param {string} id Id du produit (ou clé de réglage).
 * @param {object} patch Champs modifiés, ex. {price: 6} ou {available: false}.
 * @param {object} base Valeurs d'origine de ces champs, ex. {price: 5, available: true}.
 * @returns {Record<string, object>} Nouvelle surcouche.
 */
export function mergeOverride(overrides, id, patch, base) {
  const next = { ...overrides };
  const cur = { ...(next[id] || {}), ...patch };
  for (const k of Object.keys(cur)) if (cur[k] === base[k]) delete cur[k];
  if (Object.keys(cur).length) next[id] = cur; else delete next[id];
  return next;
}

/**
 * Nettoie une surcouche lue du stockage (données possiblement corrompues) : ne garde que
 * `price` (entier 0-999), `available: false`, et pour `_settings` les entiers `softSupplement` / `bottleIncludedSofts`.
 * @param {unknown} raw Valeur lue (JSON parsé).
 * @returns {Record<string, object>} Surcouche saine (vide si rien d'exploitable).
 */
export function sanitizeOverrides(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const isInt = n => Number.isInteger(n) && n >= 0 && n <= 999;
  for (const [id, v] of Object.entries(raw)) {
    if (!v || typeof v !== 'object') continue;
    const o = {};
    if (id === '_settings') {
      if (isInt(v.softSupplement)) o.softSupplement = v.softSupplement;
      if (isInt(v.bottleIncludedSofts)) o.bottleIncludedSofts = v.bottleIncludedSofts;
    } else {
      if (isInt(v.price)) o.price = v.price;
      if (v.available === false) o.available = false;
    }
    if (Object.keys(o).length) out[id] = o;
  }
  return out;
}

/**
 * Retire un exemplaire de la ligne `key` (annuler le dernier ajout) : décrémente la quantité, supprime la ligne à 0.
 * @param {{key: string, qty: number, price: number}[]} order Lignes de commande.
 * @param {string} key Clé de la ligne.
 * @param {number} [price] Prix de la ligne visée, si plusieurs lignes ont la même clé (prix changé en cours de commande).
 * @returns {object[]} Nouvelle commande (l'originale n'est pas modifiée).
 */
export function removeOne(order, key, price) {
  const hit = i => i.key === key && (price === undefined || i.price === price);
  return order
    .map(i => (hit(i) ? { ...i, qty: i.qty - 1 } : i))
    .filter(i => i.qty > 0);
}

/**
 * Valide une commande lue du stockage (données possiblement corrompues).
 * @param {unknown} raw Valeur lue (JSON parsé).
 * @returns {object[]} Lignes valides (key, label, price entier, qty entier > 0) ; vide sinon.
 */
export function sanitizeOrder(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(i => i && typeof i.key === 'string' && typeof i.label === 'string'
    && Number.isInteger(i.price) && i.price >= 0 && Number.isInteger(i.qty) && i.qty > 0)
    .map(i => ({ key: i.key, label: i.label, sub: typeof i.sub === 'string' ? i.sub : '', price: i.price, qty: i.qty }));
}
