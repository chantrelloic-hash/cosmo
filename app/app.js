import {
  glassPrice, countSofts, extraSofts, bottlePrice, orderTotal, orderCount, changeDue,
} from './pricing.js';

/* ============ CARTE (chargée depuis menu.json) ============ */
let SOFT_SUPPLEMENT = 5;
let BOTTLE_SOFTS = 5; /* avec une bouteille : 5 softs OU 1 bouteille de jus ; au-delà, +SOFT_SUPPLEMENT par soft */
let BEERS = [], SOFTS = [], MIXERS = [], JUS = [], SPIRITS = [], BOTTLES = [];

const isAvailable = x => x.available !== false;

/** Charge menu.json et prépare les listes utilisées par les écrans (produits indisponibles écartés). */
async function loadMenu(){
  const res = await fetch('menu.json', {cache:'no-cache'});
  if(!res.ok) throw new Error('HTTP '+res.status);
  const m = await res.json();
  SOFT_SUPPLEMENT = m.softSupplement;
  BOTTLE_SOFTS = m.bottleIncludedSofts;
  BEERS = m.beers.filter(isAvailable);
  SOFTS = m.softs.filter(isAvailable);
  /* Softs proposés avec un alcool ou une bouteille : ceux marqués "mixer" (tous sauf l'eau) */
  MIXERS = SOFTS.filter(s=>s.mixer);
  /* Jus disponibles en bouteille, au choix à la place des 5 softs */
  JUS = m.bottleJuices.map(id=>SOFTS.find(s=>s.id===id)).filter(Boolean);
  SPIRITS = m.spirits.filter(isAvailable)
    .map(s=>s.children ? {...s, children:s.children.filter(isAvailable)} : s)
    .filter(s=>!s.children || s.children.length);
  BOTTLES = m.bottles
    .map(t=>({...t, items:t.items.filter(isAvailable)}))
    .filter(t=>t.items.length);
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
const state = { stack:[{v:'home'}], order:[], received:0 };
const eur = n => `${n} €`;
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
let A = []; // actions de l'écran courant
const on = fn => `data-a="${A.push(fn)-1}"`;

function go(v,p){ state.stack.push({v,p}); render(true); }
function back(){ if(state.stack.length>1) state.stack.pop(); render(true); }
function home(){ state.stack=[{v:'home'}]; render(true); }

function qtyOf(key){ return state.order.filter(i=>i.key===key).reduce((s,i)=>s+i.qty,0); }
function qtyPrefix(prefix){ return state.order.filter(i=>i.key.startsWith(prefix)).reduce((s,i)=>s+i.qty,0); }
function add(item){
  const f = state.order.find(i=>i.key===item.key);
  f ? f.qty++ : state.order.push({...item, qty:1});
  toast(`+1 ${item.label}${item.sub?' '+item.sub:''} · ${eur(item.price)}`);
  render(false);
}
const total = () => orderTotal(state.order);
const count = () => orderCount(state.order);

let tT;
function toast(t){ const el=document.getElementById('toast'); el.textContent=t; el.classList.add('on'); clearTimeout(tT); tT=setTimeout(()=>el.classList.remove('on'),1300); }

/* ============ ÉCRANS ============ */
const V = {
  home(){
    const range = list => { const p=list.flatMap(x=>x.children?x.children.map(c=>c.price):[x.price]); return [Math.min(...p),Math.max(...p)]; };
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
        return `<button class="spirit${wide}" ${on(()=> s.children ? go('spiritSub',s) : pickSpirit(s))}>
          ${n?`<span class="qty">${n}</span>`:''}
          ${glassIcon(s.liquid,s.glass)}
          <span class="grow"><span class="sname">${esc(s.name)}</span><br><span class="p2">${p2}</span></span>
          <span class="p1 price-num">${min===max?eur(min):`${min}–${max} €`}</span>
        </button>`;}).join('')}</div>`;
  },
  spiritSub(s){
    return `<h1>${esc(s.name)}</h1><p class="hint">Quelle marque&nbsp;?</p>
      <div class="grid">${s.children.map(c=>{
        const n=qtyPrefix('verre:'+c.id);
        return `<button class="spirit" ${on(()=>pickSpirit({...c, liquid:c.liquid||s.liquid, family:s.name}))}>
          ${n?`<span class="qty">${n}</span>`:''}
          ${glassIcon(c.liquid||s.liquid)}
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
      <div class="chips">${MIXERS.map(m=>`<button class="chip${m.id==='redbull'?' full':''}" style="--bg:${m.bg};--fg:${m.fg};color:${m.fg}" ${on(()=>{add({key:`verre:${s.id}:${m.id}`,label,sub:'+ '+m.name,price:glassPrice(s.price,true,SOFT_SUPPLEMENT)}); home();})}>${ICON[m.logo]}${esc(m.name)}</button>`).join('')}</div>`;
  },
  bottles(){
    return `<h1>Bouteilles</h1><p class="hint">Ensuite : nombre de verres et softs.</p>
      ${BOTTLES.map(t=>`<div class="tier"><b class="price-num">${eur(t.price)}</b><span>la bouteille</span></div>
        <div class="grid">${t.items.map(it=>{
          const key='bouteille:'+it.name, n=qtyPrefix(key+':');
          return `<button class="bottle" ${on(()=>{state.bcfg={glasses:4,softs:{},mode:'softs',jus:null}; go('bottleSetup',{name:it.name,price:t.price,champagne:!!it.champagne});})}>${n?`<span class="qty">${n}</span>`:''}${ICON.bottle}<span>${esc(it.name)}</span></button>`;}).join('')}</div>`).join('')}`;
  },
  bottleSetup(b){
    const c=state.bcfg, champ=b.champagne, jus=c.mode==='jus';
    const nSoft=countSofts(c.softs);
    const extra=(champ||jus)?0:extraSofts(nSoft,BOTTLE_SOFTS);
    const price=bottlePrice(b.price,{mode:c.mode,champagne:champ,softCount:nSoft},BOTTLE_SOFTS,SOFT_SUPPLEMENT);
    const ready=champ||!jus||!!c.jus;
    const seg=(mode,t,st)=>`<button class="seg" aria-pressed="${c.mode===mode}" ${on(()=>{c.mode=mode; render(false);})}><b>${t}</b><small>${st}</small></button>`;
    const chip=(m,n,act,full)=>`<button class="chip${full?' full':''}" style="--bg:${m.bg};--fg:${m.fg};color:${m.fg}" ${on(act)}>${n?`<span class="qty">${n}</span>`:''}${ICON[m.logo]}${esc(m.name)}</button>`;
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
        <button class="cta danger" ${on(()=>{state.order=[]; home();})}>Vider la commande</button>
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
        <button class="cta" ${on(()=>{state.order=[]; state.received=0; toast('Commande terminée'); home();})}>Terminé · nouvelle commande</button>
      </div>`;
  },
};

function brandCard(b,kind){
  const key=`${kind}:${b.id}`, n=qtyOf(key);
  return `<button class="brand${b.wide?' wide':''}" style="--bg:${b.bg};--fg:${b.fg}" ${on(()=>add({key,label:b.label||b.name,sub:'',price:b.price}))}>
    ${b.logo==='foam'?'<span class="foam"></span>':''}
    ${n?`<span class="qty">${n}</span>`:''}
    <span class="logo">${ICON[b.logo]}</span>
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
  A=[];
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
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-a]'); if(t){ A[+t.dataset.a](); }
});
document.getElementById('back').onclick=back;
document.getElementById('reset').onclick=home;
document.getElementById('bar').onclick=()=>go('order');

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
