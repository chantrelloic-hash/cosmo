import {
  glassPrice, countSofts, extraSofts, bottlePrice, orderTotal, orderCount, changeDue,
  parsePrice, applyOverride, mergeOverride, sanitizeOverrides, removeOne, sanitizeOrder,
} from './pricing.js';
import { KEYS, read, write, remove } from './store.js';

/* ============ CARTE (chargée depuis menu.json) ============ */
let SOFT_SUPPLEMENT = 5;
let BOTTLE_SOFTS = 5; /* avec une bouteille : 5 softs OU 1 bouteille de jus ; au-delà, +SOFT_SUPPLEMENT par soft */
let BEERS = [], SOFTS = [], MIXERS = [], JUS = [], SPIRITS = [], BOTTLES = [];

const isAvailable = x => x.available !== false;

/* Carte d'origine (menu.json) et surcouche des réglages (localStorage, par id de produit).
   Les clés de la surcouche sont les id des produits ; les bouteilles sont préfixées « bouteille: »
   (leurs id répètent ceux des alcools) ; les réglages globaux sont sous « _settings ». */
let RAW = null, OV = {};
const bottleKey = id => 'bouteille:' + id;

/** Charge menu.json puis prépare les listes utilisées par les écrans. */
async function loadMenu(){
  const res = await fetch('menu.json', {cache:'no-cache'});
  if(!res.ok) throw new Error('HTTP '+res.status);
  RAW = await res.json();
  OV = sanitizeOverrides(read(KEYS.overrides, {}));
  buildMenu();
}

/** Applique la surcouche par-dessus menu.json. `available:false` dans menu.json = produit masqué ;
    rupture réglée sur le téléphone = produit affiché grisé (`soldOut`). */
function buildMenu(){
  const m = RAW, st = OV._settings || {};
  const ap = (x, key) => applyOverride(x, OV[key || x.id]);
  SOFT_SUPPLEMENT = st.softSupplement ?? m.softSupplement;
  BOTTLE_SOFTS = st.bottleIncludedSofts ?? m.bottleIncludedSofts;
  BEERS = m.beers.filter(isAvailable).map(x=>ap(x));
  SOFTS = m.softs.filter(isAvailable).map(x=>ap(x));
  /* Softs proposés avec un alcool ou une bouteille : ceux marqués "mixer" (tous sauf l'eau) */
  MIXERS = SOFTS.filter(s=>s.mixer);
  /* Jus disponibles en bouteille, au choix à la place des 5 softs */
  JUS = m.bottleJuices.map(id=>SOFTS.find(s=>s.id===id)).filter(Boolean);
  SPIRITS = m.spirits.filter(isAvailable).map(s=>{
    if(!s.children) return ap(s);
    const children = s.children.filter(isAvailable).map(c=>ap(c));
    return {...s, children, soldOut: children.every(c=>c.soldOut)};
  }).filter(s=>!s.children || s.children.length);
  /* Bouteilles : le prix d'un palier peut être modifié par bouteille, on regroupe donc par prix effectif */
  const tiers = new Map();
  for(const t of m.bottles) for(const it of t.items.filter(isAvailable)){
    const b = ap({...it, price:t.price}, bottleKey(it.id));
    if(!tiers.has(b.price)) tiers.set(b.price, []);
    tiers.get(b.price).push(b);
  }
  BOTTLES = [...tiers].sort((x,y)=>y[0]-x[0]).map(([price,items])=>({price, items}));
}

/* ============ PICTOS ============ */
const ICON = {
  beer:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 1.5h4v3.2l1.6 3.4V21a1.5 1.5 0 0 1-1.5 1.5H9.9A1.5 1.5 0 0 1 8.4 21V8.1L10 4.7z"/></svg>`,
  can:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 2.5h9l1 2v15l-1 2h-9l-1-2v-15z"/><rect x="9" y="1" width="6" height="1.2" rx=".6"/></svg>`,
  glass:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 4h15l-1.7 15.4A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.6z" opacity=".35"/><path d="M6.4 11h11.2l-1 8.3a1 1 0 0 1-1 .9H8.4a1 1 0 0 1-1-.9z"/></svg>`,
  bottle:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 1h4v1.6h-.4v4.2c2.5 1 3.6 3 3.6 5.6V21a2 2 0 0 1-2 2H8.8a2 2 0 0 1-2-2v-8.6c0-2.6 1.1-4.6 3.6-5.6V2.6H10z"/></svg>`,
  star:`<svg viewBox="0 0 24 24"><polygon fill="#E1251B" points="12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6"/></svg>`,
  d:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#F4C430"/><path fill="#111" d="M8 6h4.2c3.6 0 5.8 2.3 5.8 6s-2.2 6-5.8 6H8zm3 2.7v6.6h1.1c1.8 0 2.8-1.2 2.8-3.3s-1-3.3-2.8-3.3z"/></svg>`,
  dred:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FFFFFF"/><path fill="#B3121B" d="M8 6h4.2c3.6 0 5.8 2.3 5.8 6s-2.2 6-5.8 6H8zm3 2.7v6.6h1.1c1.8 0 2.8-1.2 2.8-3.3s-1-3.3-2.8-3.3z"/></svg>`,
  crown:`<svg viewBox="0 0 24 24"><path fill="#D4A017" d="M3 8l4.5 3.5L12 4l4.5 7.5L21 8l-2 10H5z"/><circle cx="19.5" cy="19" r="4" fill="#7BC043"/><circle cx="19.5" cy="19" r="2.4" fill="#C9E7A0"/></svg>`,
  foam:`<svg viewBox="0 0 24 24"><path fill="#E9D9A8" d="M6 3h12l-1.6 18H7.6z" opacity=".25"/><path fill="#E9D9A8" d="M6 3h12l-.4 4H6.4z"/></svg>`,
  bubbles:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="15" r="4"/><circle cx="16" cy="8" r="3"/><circle cx="17" cy="17" r="2"/></svg>`,
  slice:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/></svg>`,
  bolt:`<svg viewBox="0 0 24 24"><polygon fill="#FFD400" points="13,1 4,14 11,14 9,23 20,9 13,9"/></svg>`,
  drop:`<svg viewBox="0 0 24 24"><path fill="#2B8BD9" d="M12 2s7 7.6 7 12.5A7 7 0 0 1 5 14.5C5 9.6 12 2 12 2z"/></svg>`,
};
function glassIcon(liquid, kind){
  if(kind==='flute') return `<svg viewBox="0 0 24 24"><path d="M8.5 2h7l-.6 8.2a2.9 2.9 0 0 1-2.4 2.7V20h3v2h-7v-2h3v-7.1a2.9 2.9 0 0 1-2.4-2.7z" fill="#ffffff30"/><path d="M8.9 5h6.2l-.4 5.1a2.7 2.7 0 0 1-5.4 0z" fill="${liquid}"/></svg>`;
  return `<svg viewBox="0 0 24 24"><path d="M4.5 3.5h15l-1.7 15.9A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.6z" fill="#ffffff26"/><path d="M6.2 10.5h11.6l-1.1 8.8a1 1 0 0 1-1 .9H8.3a1 1 0 0 1-1-.9z" fill="${liquid}"/></svg>`;
}
/* ============ ÉTAT ============ */
const state = { stack:[{v:'home'}], order:sanitizeOrder(read(KEYS.order, [])), received:0 };
const eur = n => `${n} €`;
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
let A = []; // actions de l'écran courant
let FB = []; // pictos de repli des photos de l'écran courant (si l'image ne charge pas)
const on = fn => `data-a="${A.push(fn)-1}"`;
/** Attributs d'un bouton de produit : cliquable, ou grisé et inactif si le produit est en rupture. */
const act = (item, fn) => item.soldOut ? 'disabled aria-disabled="true"' : on(fn);
const outCls = item => item.soldOut ? ' out' : '';
const outTag = item => item.soldOut ? '<span class="rupture">Rupture</span>' : '';
/** Photo du produit (si `image`), avec repli silencieux sur le picto si elle ne charge pas ; sinon le picto d'origine. */
function pic(item, plain, fallback, cls){
  if(!item.image) return plain;
  FB.push(fallback);
  return `<span class="pic photo ${cls}" data-fb="${FB.length-1}"><img src="${esc(item.image)}" alt="" draggable="false"></span>`;
}

function go(v,p){ state.stack.push({v,p}); render(true); }
function back(){ if(state.stack.length>1) state.stack.pop(); render(true); }
function home(){ state.stack=[{v:'home'}]; render(true); }

function qtyOf(key){ return state.order.filter(i=>i.key===key).reduce((s,i)=>s+i.qty,0); }
function qtyPrefix(prefix){ return state.order.filter(i=>i.key.startsWith(prefix)).reduce((s,i)=>s+i.qty,0); }
function add(item){
  /* même clé ET même prix : si le prix a changé en cours de commande, les anciennes lignes gardent leur prix */
  const f = state.order.find(i=>i.key===item.key && i.price===item.price);
  f ? f.qty++ : state.order.push({...item, qty:1});
  lastAdd = {key:item.key, price:item.price};
  try{ if(navigator.vibrate) navigator.vibrate(15); }catch(_){}
  toast(`+1 ${item.label}${item.sub?' '+item.sub:''} · ${eur(item.price)}`, true);
  render(false);
}
/** Annule le dernier ajout (décrémente la ligne, la supprime à 0). */
let lastAdd = null;
function undoLast(){
  if(lastAdd==null) return;
  state.order = removeOne(state.order, lastAdd.key, lastAdd.price);
  lastAdd = null;
  hideToast();
  render(false);
}
const total = () => orderTotal(state.order);
const count = () => orderCount(state.order);

let tT;
/** Toast ~3 s ; avec `undo`, il porte un bouton « Annuler » (retire le dernier ajout). */
function toast(t, undo){
  const el=document.getElementById('toast');
  el.innerHTML = `<span class="tx">${esc(t)}</span>${undo?'<button type="button" class="undo" id="undo">Annuler</button>':''}`;
  el.classList.add('on'); el.classList.toggle('act', !!undo);
  clearTimeout(tT); tT=setTimeout(hideToast,3000);
}
function hideToast(){ clearTimeout(tT); document.getElementById('toast').classList.remove('on','act'); }
document.getElementById('toast').addEventListener('click',e=>{ if(e.target.closest('#undo')) undoLast(); });

/* ============ ÉCRANS ============ */
const V = {
  home(){
    /* fourchette de prix des produits non en rupture (si tout est en rupture, tous les produits) */
    const range = list => {
      const flat = list.flatMap(x=>x.children||[x]), live = flat.filter(x=>!x.soldOut);
      const p=(live.length?live:flat).map(x=>x.price); return [Math.min(...p),Math.max(...p)];
    };
    const fmt = ([a,b]) => a===b ? `${a} €` : `${a} – ${b} €`;
    const cat=(c,icon,name,r,v)=>`<button class="cat" style="--c:var(${c})" ${on(()=>go(v))}>${ICON[icon]}<span><span class="name">${name}</span><br><span class="range price-num">${r}</span></span></button>`;
    const bottlePrices = BOTTLES.map(t=>t.price);
    return `<h1>Qu’est-ce que tu bois&nbsp;?</h1>
      <p class="hint">Tourne l’écran vers le client : il montre du doigt.</p>
      <div class="grid">
        ${cat('--beer','beer','Bière',fmt(range(BEERS)),'beers')}
        ${cat('--soft','can','Soft',fmt(range(SOFTS)),'softs')}
        ${cat('--spirit','glass','Alcool au verre',fmt(range(SPIRITS)),'spirits')}
        ${cat('--bottle','bottle','Bouteille',fmt([Math.min(...bottlePrices),Math.max(...bottlePrices)]),'bottles')}
      </div>`;
  },
  beers(){ return `<h1>Bières</h1><p class="hint">En bouteille. Touche plusieurs fois pour en ajouter plusieurs.</p><div class="grid">${BEERS.map(b=>brandCard(b,'biere')).join('')}</div>`; },
  softs(){ return `<h1>Softs</h1><p class="hint">Sans alcool.</p><div class="grid">${SOFTS.map(b=>brandCard(b,'soft')).join('')}</div>`; },
  spirits(){
    return `<h1>Alcool au verre</h1><p class="hint">Prix sans soft. Avec un soft : <b style="color:var(--soft)">+${SOFT_SUPPLEMENT}&nbsp;€</b></p>
      <div class="grid">${SPIRITS.map(s=>{
        const prices = s.children ? s.children.map(c=>c.price) : [s.price];
        const min=Math.min(...prices), max=Math.max(...prices);
        const n = s.children ? s.children.reduce((t,c)=>t+qtyPrefix('verre:'+c.id),0) : qtyPrefix('verre:'+s.id);
        const wide = s.wide ? ' wide' : '';
        const p2 = s.noSoft ? esc(s.note||'Servie seule') : s.children ? `${s.children.length} choix` : `avec soft <b>${eur(glassPrice(s.price,true,SOFT_SUPPLEMENT))}</b>`;
        return `<button class="spirit${wide}${outCls(s)}" ${act(s,()=> s.children ? go('spiritSub',s) : pickSpirit(s))}>
          ${n?`<span class="qty">${n}</span>`:''}${outTag(s)}
          ${pic(s,glassIcon(s.liquid,s.glass),glassIcon(s.liquid,s.glass),'sp')}
          <span class="grow"><span class="sname">${esc(s.name)}</span><br><span class="p2">${p2}</span></span>
          <span class="p1 price-num">${min===max?eur(min):`${min}–${max} €`}</span>
        </button>`;}).join('')}</div>`;
  },
  spiritSub(s){
    return `<h1>${esc(s.name)}</h1><p class="hint">Quelle marque&nbsp;?</p>
      <div class="grid">${s.children.map(c=>{
        const n=qtyPrefix('verre:'+c.id);
        return `<button class="spirit${outCls(c)}" ${act(c,()=>pickSpirit({...c, liquid:c.liquid||s.liquid, family:s.name}))}>
          ${n?`<span class="qty">${n}</span>`:''}${outTag(c)}
          ${pic(c,glassIcon(c.liquid||s.liquid),glassIcon(c.liquid||s.liquid),'sp')}
          <span class="sname">${esc(c.name)}</span>
          <span class="p2">avec soft <b>${eur(glassPrice(c.price,true,SOFT_SUPPLEMENT))}</b></span>
          <span class="p1 price-num">${eur(c.price)}</span>
        </button>`;}).join('')}</div>`;
  },
  mixer(s){
    const label = s.short||s.name;
    return `<p class="ask">${esc(label)} : <em>avec un soft</em>&nbsp;?</p>
      <button class="bigbtn" ${on(()=>{add({key:`verre:${s.id}:sec`,label,sub:'sec',price:glassPrice(s.price,false,SOFT_SUPPLEMENT)}); home();})}>
        <span><span class="t">Non, sec</span><br><span class="s">Juste l’alcool</span></span>
        <span class="p price-num">${eur(s.price)}</span>
      </button>
      <div class="or">Oui, avec <b class="price-num">${eur(glassPrice(s.price,true,SOFT_SUPPLEMENT))}</b></div>
      <div class="chips">${MIXERS.map(m=>`<button class="chip${m.id==='redbull'?' full':''}${outCls(m)}" style="--bg:${m.bg};--fg:${m.fg};color:${m.fg}" ${act(m,()=>{add({key:`verre:${s.id}:${m.id}`,label,sub:'+ '+m.name,price:glassPrice(s.price,true,SOFT_SUPPLEMENT)}); home();})}>${outTag(m)}${ICON[m.logo]}${esc(m.name)}</button>`).join('')}</div>`;
  },
  bottles(){
    return `<h1>Bouteilles</h1><p class="hint">Ensuite : nombre de verres et softs.</p>
      ${BOTTLES.map(t=>`<div class="tier"><b class="price-num">${eur(t.price)}</b><span>la bouteille</span></div>
        <div class="grid">${t.items.map(it=>{
          const key='bouteille:'+it.name, n=qtyPrefix(key+':');
          return `<button class="bottle${outCls(it)}" ${act(it,()=>{state.bcfg={glasses:4,softs:{},mode:'softs',jus:null}; go('bottleSetup',{name:it.name,price:t.price,champagne:!!it.champagne});})}>${n?`<span class="qty">${n}</span>`:''}${outTag(it)}${pic(it,ICON.bottle,ICON.bottle,'bt')}<span>${esc(it.name)}</span></button>`;}).join('')}</div>`).join('')}`;
  },
  bottleSetup(b){
    const c=state.bcfg, champ=b.champagne, jus=c.mode==='jus';
    const nSoft=countSofts(c.softs);
    const extra=(champ||jus)?0:extraSofts(nSoft,BOTTLE_SOFTS);
    const price=bottlePrice(b.price,{mode:c.mode,champagne:champ,softCount:nSoft},BOTTLE_SOFTS,SOFT_SUPPLEMENT);
    const ready=champ||!jus||!!c.jus;
    const seg=(mode,t,st)=>`<button class="seg" aria-pressed="${c.mode===mode}" ${on(()=>{c.mode=mode; render(false);})}><b>${t}</b><small>${st}</small></button>`;
    const chip=(m,n,fn,full)=>`<button class="chip${full?' full':''}${outCls(m)}" style="--bg:${m.bg};--fg:${m.fg};color:${m.fg}" ${act(m,fn)}>${n?`<span class="qty">${n}</span>`:''}${outTag(m)}${ICON[m.logo]}${esc(m.name)}</button>`;
    let inclus='';
    if(!champ){
      inclus = `<div class="sect">Inclus avec la bouteille</div>
      <div class="segs">${seg('softs',`${BOTTLE_SOFTS} softs`,'au choix')}${seg('jus','1 bouteille','de jus')}</div>`;
      inclus += jus
        ? `<div class="sect">Quel jus&nbsp;?</div>
      <div class="chips">${JUS.map(m=>chip(m, c.jus===m.id?'✓':0, ()=>{c.jus=m.id; render(false);})).join('')}</div>`
        : `<div class="sect"><span>Softs <span class="price-num" style="color:${extra?'var(--flame)':'var(--soft)'}">${nSoft}/${BOTTLE_SOFTS}</span></span>${nSoft?`<button ${on(()=>{c.softs={}; render(false);})}>Effacer</button>`:''}</div>
      <p class="hint">Touche plusieurs fois pour en mettre plusieurs. Au-delà de ${BOTTLE_SOFTS} : +${SOFT_SUPPLEMENT}&nbsp;€ par soft.${extra?` <b style="color:var(--flame)">${extra} en plus : +${eur(extra*SOFT_SUPPLEMENT)}</b>`:''}</p>
      <div class="chips">${MIXERS.map(m=>{const n=c.softs[m.id]||0; return chip(m,n,()=>{c.softs[m.id]=n+1; render(false);}, m.id==='redbull');}).join('')}</div>`;
    }
    return `<h1>${esc(b.name)}</h1><p class="hint">Bouteille · <b class="price-num" style="color:var(--bottle)">${eur(b.price)}</b>${champ?'':` · ${BOTTLE_SOFTS} softs ou 1 bouteille de jus inclus`}</p>
      <div class="sect">Combien de ${champ?'flûtes':'verres'}&nbsp;?</div>
      <div class="nums">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button class="num price-num" aria-pressed="${c.glasses===n}" ${on(()=>{c.glasses=n; render(false);})}>${n}</button>`).join('')}</div>
      ${inclus}
      <div class="actions" style="margin-top:20px"><button class="cta" ${ready?'':'disabled'} ${on(()=>{ if(!ready) return; add(bottleItem(b,c)); state.stack.pop(); render(true);})}>${ready?`Ajouter la bouteille · ${eur(price)}`:'Choisis le jus'}</button></div>`;
  },
  order(){
    if(!state.order.length) return `<h1>Commande</h1><div class="empty">Rien pour l’instant.<br><br><button class="cta ghost" ${on(home)}>Choisir une boisson</button></div>`;
    return `<h1>Commande</h1>
      <div class="rows">${state.order.map(i=>`<div class="row">
        <div class="step"><button aria-label="Retirer un" ${on(()=>{i.qty--; state.order=state.order.filter(x=>x.qty>0); render(false);})}>−</button><output>${i.qty}</output><button aria-label="Ajouter un" ${on(()=>{i.qty++; render(false);})}>+</button></div>
        <div class="l">${esc(i.label)}${i.sub?`<small>${esc(i.sub)}</small>`:''}</div>
        <div class="lp price-num">${eur(i.qty*i.price)}</div></div>`).join('')}</div>
      <div class="total"><span>Total</span><b class="price-num">${eur(total())}</b></div>
      <div class="actions">
        <button class="cta" ${on(showCustomer)}>Montrer au client</button>
        <button class="cta ghost" ${on(()=>{state.received=0; go('cash');})}>Encaisser · rendu monnaie</button>
        <button class="cta danger" ${on(()=>{state.order=[]; lastAdd=null; home();})}>Vider la commande</button>
      </div>`;
  },
  cash(){
    const t=total(), r=changeDue(state.received,t);
    const bills=[{v:5,bg:'#B8B0A6'},{v:10,bg:'#E58B7A'},{v:20,bg:'#7FA8E0'},{v:50,bg:'#F2A65A'},{v:100,bg:'#7BC77A'}];
    return `<h1>Encaisser</h1><p class="hint">Touche les billets que le client te donne.</p>
      <div class="cashline"><span>À payer</span><b class="price-num">${eur(t)}</b></div>
      <div class="bills">${bills.map(b=>`<button class="bill price-num" style="--bg:${b.bg}" ${on(()=>{state.received+=b.v; render(false);})}>${b.v}&nbsp;€</button>`).join('')}
        <button class="bill" style="--bg:#34307A;color:#F6F4FF;font-size:16px" ${on(()=>{state.received=0; render(false);})}>Effacer</button></div>
      <div class="cashline"><span>Reçu</span><b class="price-num">${eur(state.received)}</b></div>
      <div class="cashline rendu ${r<0?'manque':''}"><span>${r<0?'Il manque':'À rendre'}</span><b class="price-num">${eur(Math.abs(r))}</b></div>
      <div class="actions" style="margin-top:18px">
        <button class="cta" ${on(()=>{state.order=[]; state.received=0; lastAdd=null; toast('Commande terminée'); home();})}>Terminé · nouvelle commande</button>
      </div>`;
  },
};

function brandCard(b,kind){
  const key=`${kind}:${b.id}`, n=qtyOf(key);
  return `<button class="brand${b.wide?' wide':''}${outCls(b)}" style="--bg:${b.bg};--fg:${b.fg}" ${act(b,()=>add({key,label:b.label||b.name,sub:'',price:b.price}))}>
    ${b.logo==='foam'?'<span class="foam"></span>':''}
    ${n?`<span class="qty">${n}</span>`:''}${outTag(b)}
    ${pic(b,`<span class="logo">${ICON[b.logo]}</span>`,ICON[b.logo],'logo')}
    <span><span class="bname">${esc(b.name)}</span><span class="size" style="display:block">${esc(b.size)}</span></span>
    <span class="pill price-num">${eur(b.price)}</span>
  </button>`;
}

function bottleItem(b,c){
  const champ=b.champagne, g=`${c.glasses} ${champ?'flûte':'verre'}${c.glasses>1?'s':''}`, label=`Bouteille ${b.name}`;
  if(champ) return {key:`bouteille:${b.name}:${c.glasses}`, label, sub:g, price:b.price};
  if(c.mode==='jus'){
    const j=JUS.find(m=>m.id===c.jus);
    return {key:`bouteille:${b.name}:${c.glasses}:jus-${j.id}`, label, sub:`${g} · 1 bouteille de ${j.name.toLowerCase()}`, price:b.price};
  }
  const softs=MIXERS.filter(m=>c.softs[m.id]).map(m=>`${c.softs[m.id]} ${m.name}`);
  const n=countSofts(c.softs), extra=extraSofts(n,BOTTLE_SOFTS);
  return {key:`bouteille:${b.name}:${c.glasses}:${softs.join('|')}`, label,
    sub:`${g} · ${softs.length?softs.join(', '):'sans soft'}${extra?` (dont ${extra} en plus)`:''}`,
    price:bottlePrice(b.price,{mode:'softs',softCount:n},BOTTLE_SOFTS,SOFT_SUPPLEMENT)};
}

function pickSpirit(s){
  if(s.noSoft){ add({key:`verre:${s.id}`,label:s.short||s.name,sub:'',price:s.price}); return; }
  go('mixer',s);
}

function showCustomer(){
  const el=document.getElementById('show');
  el.innerHTML = state.order.map(i=>`<div class="ln"><span>${i.qty} × ${esc(i.label)}${i.sub?' '+esc(i.sub):''}</span><b class="price-num">${eur(i.qty*i.price)}</b></div>`).join('')
    + `<div class="tot"><span>TOTAL</span><b class="price-num">${eur(total())}</b></div><p>Touche l’écran pour revenir</p>`;
  el.hidden=false;
}
document.getElementById('show').addEventListener('click',e=>e.currentTarget.hidden=true);

/* ============ RENDU ============ */
function render(scroll){
  A=[]; FB=[];
  const top=state.stack[state.stack.length-1];
  document.getElementById('view').innerHTML = V[top.v](top.p);
  document.getElementById('back').hidden = state.stack.length<=1;
  document.getElementById('reset').hidden = state.stack.length<=2;
  const n=count(), bar=document.getElementById('bar');
  const summary = state.order.map(i=>`${i.qty} ${esc(i.label)}`).join(', ');
  bar.className = n ? '' : 'off';
  bar.innerHTML = `<span class="n">${n}</span><span class="lbl">${n?summary:'Commande vide'}</span><span class="tt price-num">${eur(total())}</span>`;
  bar.hidden = top.v==='order'||top.v==='cash';
  document.querySelector('.bar').hidden = top.v==='order'||top.v==='cash';
  if(scroll) window.scrollTo(0,0);
  saveOrder();
}
/** Commande en cours sauvegardée à chaque changement (vidée quand elle est vide). */
function saveOrder(){ if(state.order.length) write(KEYS.order, state.order); else remove(KEYS.order); }
/* Photo qui ne charge pas : retour silencieux au picto */
document.addEventListener('error',e=>{
  const img=e.target; if(!img || img.tagName!=='IMG') return;
  const w=img.closest('[data-fb]'); if(!w) return;
  w.classList.remove('photo'); w.innerHTML=FB[+w.dataset.fb]||'';
},true);
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-a]'); if(t){ A[+t.dataset.a](); }
});
document.getElementById('back').onclick=back;
document.getElementById('reset').onclick=home;
document.getElementById('bar').onclick=()=>go('order');

/* ============ PRÉFÉRENCES (mode gaucher) ============ */
const prefs = { lefty:false, ...(read(KEYS.prefs, {}) || {}) };
function applyPrefs(){ document.body.classList.toggle('lefty', !!prefs.lefty); }
applyPrefs();

/* ============ RÉGLAGES (protégés par un code) ============ */
const sheet = document.getElementById('sheet');
let S = null; // écran de la feuille : {v:'pin', ...} ou {v:'settings', ...}
let storageFailed = false;
let codeMem = null;
const getCode = () => { const c = codeMem ?? read(KEYS.code, null); return /^\d{4}$/.test(c||'') ? c : '1234'; };
function saveCode(c){ codeMem = c; if(!write(KEYS.code, c)) storageFailed = true; }

function persistOverrides(){
  const ok = Object.keys(OV).length ? write(KEYS.overrides, OV) : (remove(KEYS.overrides), true);
  if(!ok) storageFailed = true;
  buildMenu(); render(false);
}

/** Pavé numérique à 4 chiffres. `onDone(code)` est appelé au 4e chiffre. */
function openPin({title, sub, onDone, onCancel, cancelLabel='Fermer'}){
  S = {v:'pin', title, sub, onDone, onCancel, cancelLabel, digits:'', error:''};
  sheet.hidden = false; drawSheet();
}
function openAccess(){
  openPin({
    title:'Code', sub:'Entre le code à 4 chiffres',
    onDone: c => { if(c===getCode()) openSettings(); else pinFail('Code incorrect'); },
    onCancel: closeSheet,
  });
}
function pinFail(msg){ S.digits=''; S.error=msg; S.shake=true; drawSheet(); }
function changeCode(){
  const cancel = () => openSettings('');
  openPin({
    title:'Nouveau code', sub:'Choisis 4 chiffres', cancelLabel:'Annuler', onCancel:cancel,
    onDone: c1 => openPin({
      title:'Confirme', sub:'Entre-le encore une fois', cancelLabel:'Annuler', onCancel:cancel,
      onDone: c2 => { if(c1===c2){ saveCode(c2); openSettings('Code modifié.'); } else { changeCodeAgain(); } },
    }),
  });
}
function changeCodeAgain(){ changeCode(); S.error='Les deux codes sont différents'; S.shake=true; drawSheet(); }

function openSettings(notice){ S = {v:'settings', notice:notice||'', confirmReset:false}; sheet.hidden=false; drawSheet(0); }
function closeSheet(){ S=null; sheet.hidden=true; sheet.innerHTML=''; render(false); }

const PAD = ['1','2','3','4','5','6','7','8','9','del','0','ok'];
function pinHTML(){
  return `<div class="sheet-in pin">
    <div class="sheet-top"><h1>${esc(S.title)}</h1><button class="ghostbtn" data-s="cancel">${esc(S.cancelLabel)}</button></div>
    <p class="hint">${esc(S.sub)}</p>
    <div class="dots${S.shake?' shake':''}" aria-label="${S.digits.length} chiffres saisis">${[0,1,2,3].map(i=>`<i class="${i<S.digits.length?'on':''}"></i>`).join('')}</div>
    <p class="pinerr" role="alert">${esc(S.error)}</p>
    <div class="pad">${PAD.map(k=>k==='del'?`<button data-s="del" aria-label="Effacer le dernier chiffre">&larr;</button>`
      :k==='ok'?`<span></span>`:`<button class="price-num" data-s="k" data-k="${k}">${k}</button>`).join('')}</div>
  </div>`;
}

/** Catalogue des réglages : groupes de lignes {key, name, sub, base} d'après menu.json (produits masqués exclus). */
function catalog(){
  const m = RAW, rows = (list, keyOf=x=>x.id, base=x=>x.price) => list.filter(isAvailable)
    .map(x=>({key:keyOf(x), name:x.label||x.name, sub:x.size||'', base:base(x)}));
  const groups = [
    {title:'Bières', rows:rows(m.beers)},
    {title:'Softs', rows:rows(m.softs)},
  ];
  const spir = {title:'Alcools au verre', rows:[]};
  for(const s of m.spirits.filter(isAvailable)){
    if(s.children){ spir.rows.push({head:s.name}); spir.rows.push(...rows(s.children).map(r=>({...r, name:r.name}))); }
    else spir.rows.push(...rows([s]));
  }
  groups.push(spir);
  for(const t of m.bottles) groups.push({title:`Bouteilles · ${t.price} €`, rows:rows(t.items, x=>bottleKey(x.id), ()=>t.price)});
  return groups;
}
const baseOfKey = key => { for(const g of catalog()) for(const r of g.rows) if(r.key===key) return r.base; return undefined; };

function rowHTML(r){
  if(r.head) return `<div class="subhead">${esc(r.head)}</div>`;
  const o = OV[r.key]||{}, out = o.available===false, price = o.price ?? r.base, mod = price!==r.base;
  return `<div class="prow${out?' out':''}${mod||out?' mod':''}" data-key="${esc(r.key)}">
    <div class="pn"><b>${esc(r.name)}</b>${r.sub?`<small>${esc(r.sub)}</small>`:''}${mod?`<small class="orig">carte : ${r.base} €</small>`:''}${out?'<small class="orig">Rupture</small>':''}</div>
    <button class="sw" role="switch" aria-checked="${!out}" data-s="toggle"><i></i><span>Disponible</span></button>
    <label class="pp"><input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" enterkeyhint="done" value="${price}" data-s="price" aria-label="Prix de ${esc(r.name)} en euros"><span>€</span></label>
  </div>`;
}
function numRow(label, name, value, hint){
  return `<div class="prow set"><div class="pn"><b>${label}</b><small>${hint}</small></div>
    <label class="pp"><input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" enterkeyhint="done" value="${value}" data-s="setting" data-name="${name}" aria-label="${label}"></label></div>`;
}
function settingsHTML(){
  const st = RAW;
  return `<div class="sheet-in">
    <div class="sheet-top"><h1>Réglages</h1><button class="cta small" data-s="cancel">Terminer</button></div>
    ${S.notice?`<p class="notice" role="status">${esc(S.notice)}</p>`:''}
    ${storageFailed?`<p class="notice warn" role="alert">Stockage indisponible sur ce téléphone : les modifications seront perdues à la fermeture de l’appli.</p>`:''}
    <div class="sect">Affichage</div>
    <div class="prow"><div class="pn"><b>Mode gaucher</b><small>Barre de commande et en-tête inversés</small></div>
      <button class="sw" role="switch" aria-checked="${!!prefs.lefty}" data-s="lefty"><i></i><span>Activé</span></button></div>
    <div class="sect">Softs</div>
    ${numRow('Supplément soft','softSupplement',SOFT_SUPPLEMENT,`en € · carte : ${st.softSupplement} €`)}
    ${numRow('Softs inclus avec une bouteille','bottleIncludedSofts',BOTTLE_SOFTS,`nombre · carte : ${st.bottleIncludedSofts}`)}
    ${catalog().map(g=>`<div class="sect">${esc(g.title)}</div><div class="plist">${g.rows.map(rowHTML).join('')}</div>`).join('')}
    <div class="sect">Sécurité</div>
    <button class="cta ghost" data-s="code">Changer le code</button>
    <div class="sect">Carte d’origine</div>
    ${S.confirmReset
      ? `<div class="confirm" id="confirm"><p>Remettre tous les prix, les disponibilités et les suppléments de la carte d’origine&nbsp;?</p>
          <div class="actions"><button class="cta danger solid" data-s="reset-yes">Oui, remettre</button><button class="cta ghost" data-s="reset-no">Non, garder</button></div></div>`
      : `<button class="cta danger" data-s="reset">Remettre la carte d’origine</button>`}
  </div>`;
}
function drawSheet(scrollTop){
  const keep = scrollTop ?? sheet.scrollTop;
  sheet.innerHTML = S.v==='pin' ? pinHTML() : settingsHTML();
  sheet.scrollTop = keep;
  if(S.shake){ S.shake=false; }
  if(S.confirmReset) document.getElementById('confirm')?.scrollIntoView({block:'center'});
}

function setProduct(key, patch){
  const base = baseOfKey(key);
  OV = mergeOverride(OV, key, patch, {price:base, available:true});
  persistOverrides();
  const row = sheet.querySelector(`.prow[data-key="${CSS.escape(key)}"]`);
  const r = catalog().flatMap(g=>g.rows).find(x=>x.key===key);
  if(row && r){ const t=document.createElement('div'); t.innerHTML=rowHTML(r); row.replaceWith(t.firstElementChild); }
}

sheet.addEventListener('click',e=>{
  const t = e.target.closest('[data-s]'); if(!t || !S) return;
  const a = t.dataset.s;
  if(S.v==='pin'){
    if(a==='cancel') return S.onCancel();
    if(a==='del'){ S.digits=S.digits.slice(0,-1); S.error=''; return drawSheet(); }
    if(a==='k' && S.digits.length<4){
      S.digits += t.dataset.k; S.error=''; drawSheet();
      if(S.digits.length===4){ const c=S.digits, done=S.onDone, cur=S; setTimeout(()=>{ if(S===cur) done(c); },150); }
    }
    return;
  }
  if(a==='cancel') return closeSheet();
  if(a==='lefty'){ prefs.lefty=!prefs.lefty; if(!write(KEYS.prefs,prefs)) storageFailed=true; applyPrefs(); return drawSheet(); }
  if(a==='toggle'){
    const key=t.closest('.prow').dataset.key, out=OV[key]?.available===false;
    return setProduct(key, {available: out});
  }
  if(a==='code') return changeCode();
  if(a==='reset'){ S.confirmReset=true; return drawSheet(); }
  if(a==='reset-no'){ S.confirmReset=false; return drawSheet(); }
  if(a==='reset-yes'){ OV={}; persistOverrides(); S.confirmReset=false; S.notice='Carte d’origine remise.'; return drawSheet(0); }
});
sheet.addEventListener('change',e=>{
  const t=e.target; if(!S || S.v!=='settings' || !t.dataset?.s) return;
  const n = parsePrice(t.value);
  if(t.dataset.s==='price'){
    const key=t.closest('.prow').dataset.key;
    if(n===null){ t.value = OV[key]?.price ?? baseOfKey(key); return; }
    setProduct(key,{price:n});
  } else if(t.dataset.s==='setting'){
    const name=t.dataset.name, cur = name==='softSupplement' ? SOFT_SUPPLEMENT : BOTTLE_SOFTS;
    if(n===null){ t.value=cur; return; }
    OV = mergeOverride(OV, '_settings', {[name]:n}, {softSupplement:RAW.softSupplement, bottleIncludedSofts:RAW.bottleIncludedSofts});
    persistOverrides();
    const hint = t.closest('.prow'); hint && (t.value = n);
  }
});
sheet.addEventListener('keydown',e=>{ if(e.key==='Enter' && e.target.tagName==='INPUT') e.target.blur(); });

/* Accès discret : appui long (~1 s) sur le logo */
(function(){
  const mark=document.querySelector('.mark'); let lp=null;
  const stop=()=>{ clearTimeout(lp); lp=null; };
  mark.addEventListener('pointerdown',()=>{ stop(); lp=setTimeout(()=>{ lp=null; if(RAW) openAccess(); },1000); });
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>mark.addEventListener(ev,stop));
  mark.addEventListener('contextmenu',e=>e.preventDefault());
})();

/* Garder l'écran allumé pendant le service */
let lock=null;
async function keepAwake(){ try{ if(!lock && 'wakeLock' in navigator){ lock=await navigator.wakeLock.request('screen'); lock.addEventListener('release',()=>lock=null);} }catch(_){} }
document.addEventListener('pointerdown',keepAwake);
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') keepAwake(); });

/* Hors ligne : service worker (chemin relatif pour le sous-chemin GitHub Pages) */
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}

/* ============ DÉMARRAGE ============ */
function showLoadError(){
  document.getElementById('view').innerHTML = `<h1>Carte indisponible</h1>
    <p class="hint">Impossible de charger la carte des boissons. Vérifie la connexion puis réessaie.</p>
    <div class="actions"><button class="cta" id="retry">Réessayer</button></div>`;
  document.getElementById('retry').onclick = start;
  document.querySelector('.bar').hidden = true;
  document.getElementById('back').hidden = true;
  document.getElementById('reset').hidden = true;
}
async function start(){
  try{ await loadMenu(); }
  catch(err){ console.warn('menu.json', err); showLoadError(); return; }
  render(false);
}
start();
