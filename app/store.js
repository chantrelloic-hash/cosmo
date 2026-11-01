/* Accès localStorage : tout est dans try/catch. Si le stockage est indisponible (navigation privée,
   données bloquées...), les lectures renvoient la valeur de repli et les écritures renvoient false :
   l'appli continue de marcher avec la carte d'origine. */
export const KEYS = {
  overrides: 'cosmo.overrides.v1', // surcouches de la carte {idProduit: {price, available:false}, _settings:{...}}
  order: 'cosmo.order.v1',         // commande en cours
  code: 'cosmo.code.v1',           // code d'accès aux réglages (4 chiffres)
  prefs: 'cosmo.prefs.v1',         // préférences d'affichage {lefty}
};

/** @returns {*} valeur JSON stockée, ou `fallback` si absente / illisible / stockage indisponible. */
export function read(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch (_) { return fallback; }
}

/** @returns {boolean} vrai si l'écriture a réussi. */
export function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (_) { return false; }
}

export function remove(key) {
  try { localStorage.removeItem(key); } catch (_) {}
}
