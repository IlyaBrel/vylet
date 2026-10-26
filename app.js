'use strict';
/* ===== Вылеты сотрудников — офлайн-приложение для телефона и ПК ===== */
const VER = '2.2';
const KEY = 'vylety.data.v1', LKEY = 'vylety.local.v1';
const $ = s => document.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const isoOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => isoOf(new Date());
const dn = iso => { const [y, m, d] = iso.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
const addD = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const validIso = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(dn(s));
const fd = iso => iso ? iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.' + iso.slice(0, 4) : '';
const fds = iso => iso ? iso.slice(8, 10) + '.' + iso.slice(5, 7) : '';
const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const WDF = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const wd = iso => WD[new Date(dn(iso) * 864e5).getUTCDay()];
const MON = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONG = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const pl = (n, a, b, c) => { n = Math.abs(n) % 100; const m = n % 10; return n > 10 && n < 20 ? c : m === 1 ? a : m >= 2 && m <= 4 ? b : c; };
const dney = n => n + ' ' + pl(n, 'день', 'дня', 'дней');
const inDays = n => n === 0 ? 'сегодня' : n === 1 ? 'завтра' : n === -1 ? 'вчера' : n > 0 ? 'через ' + dney(n) : dney(-n) + ' назад';
const ftime = ts => { if (!ts) return '—'; const d = new Date(ts); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const fsize = b => b > 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' МБ' : Math.max(1, Math.round(b / 1024)) + ' КБ';
const norm = s => String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
const normPass = s => String(s || '').replace(/[\s№-]/g, '').toUpperCase();
const isPC = () => matchMedia('(min-width:900px)').matches;
let lastTs = 0;
const tick = () => { let t = Date.now(); if (t <= lastTs) t = lastTs + 1; return lastTs = t; };
const uid = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).slice(0, 16);

/* ---------- иконки ---------- */
const P = {
  up: '<path d="M2 22h20"/><path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.41 2.41 0 0 1 1.73-.17L21 7a1.4 1.4 0 0 1 .87 1.99l-.38.76c-.23.46-.6.84-1.07 1.08L7.58 17.2a2 2 0 0 1-1.22.18Z"/>',
  down: '<path d="M2 22h20"/><path d="M3.77 10.77 2 9l2-4.5 1.1.55c.55.28.9.84.9 1.45s.35 1.17.9 1.45L8 8.5l3-6 1.05.53a2 2 0 0 1 1.09 1.52l.72 5.4a2 2 0 0 0 1.09 1.52l4.4 2.2c.42.22.78.55 1.01.96l.6 1.03c.49.88-.06 1.98-1.06 2.1l-1.18.15c-.47.06-.95-.02-1.37-.24L4.29 11.15a2 2 0 0 1-.52-.38Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  req: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  sync: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  xls: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  msg: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  chd: '<path d="m6 9 6 6 6-6"/>',
  chu: '<path d="m18 15-6-6-6 6"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  crown: '<path d="M11.56 3.27a.5.5 0 0 1 .88 0l2.95 5.6a1 1 0 0 0 1.52.29l4.27-3.66a.5.5 0 0 1 .8.52l-2.83 10.24a1 1 0 0 1-.96.74H5.81a1 1 0 0 1-.96-.74L2.02 6.02a.5.5 0 0 1 .8-.52l4.27 3.66a1 1 0 0 0 1.52-.29z" fill="currentColor"/><path d="M5 21h14"/>',
  hat: '<path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M14 6a6 6 0 0 1 6 6v3"/><path d="M4 15v-3a6 6 0 0 1 6-6"/><rect x="2" y="15" width="20" height="4" rx="1"/>',
  brief: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  clip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  rotate: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
  zin: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
  zout: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M8 11h6"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4M12 2v13"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  doc: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M9 13h6M9 17h6M9 9h2"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
};
const ic = (n, cls = '') => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${P[n]}</svg>`;

/* ---------- уровни сотрудников ---------- */
const LV = {
  w: { n: 'Рабочие', one: 'Рабочий', c: 'lw', i: 'hat' },
  m: { n: 'Мастера и офис', one: 'Мастер / офис', c: 'lm', i: 'brief' },
  b: { n: 'Руководство', one: 'Руководство', c: 'lb', i: 'crown' },
};
const lvOf = e => LV[e && e.lvl] ? e.lvl : 'w';
const lvColor = k => `var(--${LV[k].c === 'lb' ? 'lb2' : LV[k].c})`;
const initials = fio => { const p = String(fio || '').trim().split(/\s+/).filter(Boolean); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase(); };
const av = (e, big) => { const l = lvOf(e); return `<button type="button" class="av ${LV[l].c}${big ? ' big' : ''}" data-av aria-label="Выбрать">${l === 'b' ? ic('crown', 'cr') : ''}<span class="ini">${esc(initials(e.fio))}</span>${ic('check', 'ok')}</button>`; };
const lvTag = e => { const l = lvOf(e); return `<span class="lv ${LV[l].c}">${LV[l].one}</span>`; };
const KIND = { pass: 'Паспорт', zagran: 'Загранпаспорт', visa: 'Виза', other: 'Документ' };

/* ---------- хранилище ---------- */
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.emp) { d.trip = d.trip || {}; d.doc = d.doc || {}; d.set = d.set || { _t: {} }; d.set._t = d.set._t || {}; return d; } } catch (e) { }
  return { v: 2, emp: {}, trip: {}, doc: {}, set: { _t: {} } };
}
function loadLocal() {
  let l = {};
  try { l = JSON.parse(localStorage.getItem(LKEY)) || {}; } catch (e) { }
  if (!l.dev) l.dev = uid();
  if (!l.name) l.name = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) ? 'Телефон' : 'ПК';
  l.dirty = l.dirty || {}; l.phOut = l.phOut || {}; l.tab = l.tab || 'req';
  return l;
}
let D = load(), L = loadLocal();
let saveT = 0;
function save(later) {
  clearTimeout(saveT);
  const f = () => {
    try { localStorage.setItem(KEY, JSON.stringify(D)); localStorage.setItem(LKEY, JSON.stringify(L)); }
    catch (e) { toast('Не удалось сохранить: память браузера заполнена'); }
    badges();
  };
  if (later === false) saveT = setTimeout(f, 250); else f();
}
/* IndexedDB — для фото и PDF документов */
const IDB = (() => {
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('vylety', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('blobs');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('blobs', mode); const rq = fn(t.objectStore('blobs')); t.oncomplete = () => res(rq && rq.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); };
  return { put: (k, v) => tx('readwrite', s => s.put(v, k)), get: k => tx('readonly', s => s.get(k)), del: k => tx('readwrite', s => s.delete(k)), keys: () => tx('readonly', s => s.getAllKeys()), clear: () => tx('readwrite', s => s.clear()) };
})();
let HAVE = new Set();
const URLS = {};
async function getBlob(id) { try { const v = await IDB.get(id); return v ? new Blob([v.buf], { type: v.type }) : null; } catch (e) { return null; } }
async function docURL(id) {
  const d = D.doc[id]; if (!d) return null;
  const key = id + ':' + (d.rot || 0);
  if (URLS[key]) return URLS[key];
  const b = await getBlob(id); if (!b) return null;
  let blob = b;
  if (d.rot && /^image\//.test(b.type)) {
    try {
      const bmp = await createImageBitmap(b); const r = +d.rot, sw = r % 180 ? bmp.height : bmp.width, sh = r % 180 ? bmp.width : bmp.height;
      const c = document.createElement('canvas'); c.width = sw; c.height = sh; const x = c.getContext('2d');
      x.translate(sw / 2, sh / 2); x.rotate(r * Math.PI / 180); x.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
      blob = await new Promise(rs => c.toBlob(rs, 'image/jpeg', .9)) || b;
    } catch (e) { }
  }
  return URLS[key] = URL.createObjectURL(blob);
}

const DEF = { lead: 45, warn: 7, tkw: 14, dest: '', mvz: 'МУ-12', stay: '3M', org: '', contract: '', cName: '', cWork: '', cMob: '', cMail: '' };
const S = k => { const v = D.set[k]; return v === undefined || v === '' ? DEF[k] : v; };
const maxT = r => { let m = 0; for (const k in r._t) if (r._t[k] > m) m = r._t[k]; return m; };
const alive = r => !!r && !(r._del && r._del >= maxT(r));
function setF(r, k, v, ts) {
  if (v === undefined || v === null) v = '';
  if ((r[k] ?? '') === v) return false;
  r[k] = v; r._t = r._t || {}; r._t[k] = ts || tick();
  if (!ts) L.dirty[r.id || 'set'] = 1;
  return true;
}
function delRec(r) { r._del = tick() + 1; lastTs = r._del; L.dirty[r.id] = 1; }
const emps = () => Object.values(D.emp).filter(alive).sort((a, b) => (a.fio || '').localeCompare(b.fio || '', 'ru'));
const trips = () => Object.values(D.trip).filter(t => alive(t) && alive(D.emp[t.emp]));
const tripsOf = id => trips().filter(t => t.emp === id).sort((a, b) => (a.oD || a.bD || '9').localeCompare(b.oD || b.bD || '9'));
const docsOf = id => Object.values(D.doc).filter(d => alive(d) && d.emp === id).sort((a, b) => (a._t.emp || 0) - (b._t.emp || 0));
const LEG = { o: 'Вылет', b: 'Прилёт' };
/* у каждого рейса свой маршрут; если пусто: туда — из города вылета сотрудника (или базового) на объект, обратно — наоборот */
function route(t, k) {
  const e = D.emp[t.emp] || {}, base = e.air || e.city || '', dest = S('dest') || '';
  const oF = t.oFrom || t.from || base, oT = t.oTo || t.to || dest;
  return k === 'o' ? [oF, oT] : [t.bFrom || oT, t.bTo || t.from || base];
}
function legsOf(t) {
  const e = D.emp[t.emp], T = dn(today()), lead = +S('lead') || 45, res = [];
  for (const k of ['o', 'b']) {
    const date = t[k + 'D']; if (!validIso(date)) continue;
    const dl = addD(date, -lead), [from, to] = route(t, k);
    res.push({ t, e, k, date, st: t[k + 'S'] || '', sent: t[k + 'Sent'] || '', tk: t[k + 'Tk'] || '', dl, dleft: dn(dl) - T, fleft: dn(date) - T, from, to, key: t.id + ':' + k });
  }
  return res;
}
const allLegs = () => trips().flatMap(legsOf).filter(l => !afterLeave(l.e, l.date));
const legByKey = key => { const [id, k] = key.split(':'); const t = D.trip[id]; return t && alive(t) ? legsOf(t).find(l => l.k === k) : null; };
/* состояние рейса — от него зависит цвет */
function urg(l) {
  if (l.fleft < 0) return 'past';
  if (l.st === 'tk') return 'tk';
  if (l.fleft <= +S('tkw')) return 'notk';
  if (l.st === 'sent') return 'sent';
  if (l.dleft < 0) return 'over';
  if (l.dleft <= +S('warn')) return 'soon';
  if (l.dleft <= 30) return 'near';
  return 'later';
}
const TONE = { notk: 'red', over: 'red', soon: 'org', near: 'yel', sent: 'blu', tk: 'grn', later: 'gry', past: 'gry' };
function statusPill(l) {
  const u = urg(l);
  if (u === 'past') return `<span class="pill gry">рейс прошёл</span>`;
  if (u === 'tk') return '';
  if (u === 'notk') return `<span class="pill red"><i class="pulse"></i>вылет ${inDays(l.fleft)}</span>${l.st === 'sent' ? `<span class="pill blu">заявка подана${l.sent ? ' ' + fds(l.sent) : ''}</span>` : `<span class="pill red">заявки нет</span>`}`;
  if (u === 'sent') return `<span class="pill blu">${ic('clock')}заявка подана${l.sent ? ' ' + fds(l.sent) : ''}, ждём билет</span>`;
  if (u === 'over') return `<span class="pill red"><i class="pulse"></i>заявка просрочена на ${dney(-l.dleft)}</span>`;
  if (u === 'soon') return `<span class="pill org">${l.dleft === 0 ? 'подать заявку сегодня' : `подать заявку до ${fds(l.dl)} · ${dney(l.dleft)}`}</span>`;
  if (u === 'near') return `<span class="pill yel">подать заявку до ${fds(l.dl)} · ${dney(l.dleft)}</span>`;
  return `<span class="pill gry">заявка ${fds(l.dl)} · через ${dney(l.dleft)}</span>`;
}
function tkChip(l) {
  const u = urg(l);
  if (l.st === 'tk') return `<span class="tk yes">${ic('ticket')}Билет есть${l.tk ? ' · ' + esc(l.tk) : ''}</span>`;
  if (u === 'past') return `<span class="tk past">без билета</span>`;
  return `<span class="tk no${u === 'notk' ? ' hot' : ''}">${ic('x')}Нет билета</span>`;
}
const routeHtml = l => `<span class="route"><span>${l.from ? esc(l.from) : '<i class="muted">откуда?</i>'}</span>${ic('arrow')}<span>${l.to ? esc(l.to) : '<i class="muted">куда?</i>'}</span></span>`;
const flyIn = l => l.fleft >= 0 && l.fleft <= 14 ? `<span class="soon ${l.st === 'tk' ? '' : 'red'}">${inDays(l.fleft)}</span>` : (l.fleft >= 0 ? `<span>${inDays(l.fleft)}</span>` : '');
function nextLeg(eid) { return allLegs().filter(l => l.e.id === eid && l.fleft >= 0).sort((a, b) => a.date.localeCompare(b.date))[0]; }
function issues(e, nl) {
  const a = [], t = today();
  if (gone(e)) return a;
  if (leaving(e) && !hasHome(e)) a.push(['нет вылета домой', e.statD && dn(e.statD) - dn(t) <= +S('lead') + 14 ? 'red' : 'org']);
  if (!e.pass) a.push(['нет паспорта', 'red']);
  else if (e.pExp) {
    if (e.pExp < t) a.push(['паспорт просрочен', 'red']);
    else if (e.pExp < addD(nl ? nl.date : t, 180)) a.push(['паспорт до ' + fd(e.pExp), 'org']);
  }
  return a;
}
const STATN = { end: 'Не продлевают контракт', fired: 'Уволен' };
const gone = e => !!e && (e.stat === 'fired' ? (!e.statD || e.statD < today()) : e.stat === 'end' ? (!!e.statD && e.statD < today()) : false);
const leaving = e => !!e && (e.stat === 'fired' || e.stat === 'end') && !gone(e);
const afterLeave = (e, date) => !!e && (e.stat === 'fired' || e.stat === 'end') && !!e.statD && date > addD(e.statD, 7);
const staff = () => emps().filter(e => !gone(e));
function hasHome(e) {
  return trips().filter(t => t.emp === e.id).flatMap(legsOf).some(l => (l.t[l.k + 'Why'] || '') === 'Увольнение' || (e.statD && l.k === 'b' && l.date >= addD(e.statD, -21) && l.date <= addD(e.statD, 7)));
}
function statBadge(e) {
  if (!e || !e.stat) return '';
  if (gone(e)) return `<span class="sbadge gone">${e.stat === 'fired' ? 'уволен' : 'контракт закончился'}${e.statD ? ' ' + fd(e.statD) : ''}</span>`;
  return `<span class="sbadge leave">${e.stat === 'fired' ? 'увольнение' : 'не продлевают'}${e.statD ? ' ' + fd(e.statD) : ''}</span>`;
}
const warnHtml = iss => iss.map(([t, c]) => `<span class="warn ${c}">${ic('alert')}${t}</span>`).join('');
const short = fio => { const p = String(fio || '').trim().split(/\s+/); return p.length < 2 ? (p[0] || '') : p[0] + ' ' + p.slice(1, 3).map(x => x[0] + '.').join(''); };

/* ---------- пример ---------- */
function demo() {
  const t = today(), T = 1;
  const mk = (id, f) => { const r = { id, _t: {} }; for (const k in f) { r[k] = f[k]; r._t[k] = T; } return r; };
  const y1 = (+t.slice(0, 4) + 1) + '-02-10';
  const E = [
    ['Иванов Сергей Петрович', 'IVANOV SERGEI', 'm', 'Прораб', 'Тула', 'Москва', '+7 915 123-45-67', 'ivanov@example.com', 'РФ', '1984-03-12', '75 4412345', '2021-06-01', '2031-06-01'],
    ['Петров Алексей Иванович', 'PETROV ALEKSEI', 'w', 'Монтажник', 'Екатеринбург', '', '+7 912 555-10-20', 'petrov@example.com', 'РФ', '1990-08-23', '76 1188822', '2017-02-10', y1],
    ['Сидоров Николай Андреевич', 'SIDOROV NIKOLAI', 'w', 'Электрик', 'Ростов-на-Дону', '', '+7 903 777-88-99', '', 'РФ', '1979-11-02', '', '', ''],
    ['Кузнецова Марина Олеговна', 'KUZNETSOVA MARINA', 'm', 'Инженер ПТО', 'Санкт-Петербург', '', '+7 921 300-40-50', 'kuznetsova@example.com', 'РФ', '1992-05-17', '75 9900111', '2022-09-15', '2032-09-15'],
    ['Абдуллаев Рустам Шавкатович', 'ABDULLAEV RUSTAM', 'w', 'Сварщик', 'Ташкент', '', '+998 90 123 45 67', '', 'Узбекистан', '1988-01-30', 'FA 1234567', '2020-04-04', '2030-04-04'],
    ['Волков Андрей Николаевич', 'VOLKOV ANDREI', 'b', 'Руководитель проекта', 'Москва', '', '+7 916 222-33-44', 'volkov@example.com', 'РФ', '1975-09-09', '75 1010101', '2019-03-03', '2029-03-03'],
  ];
  const ids = E.map((x, i) => {
    const id = 'demo-e' + (i + 1);
    D.emp[id] = mk(id, { fio: x[0], lat: x[1], lvl: x[2], pos: x[3], city: x[4], air: x[5], phone: x[6], email: x[7], cit: x[8], birth: x[9], pass: x[10], pIss: x[11], pExp: x[12], demo: 1 });
    return id;
  });
  [['18004001', 'г. Тула', '+20 155 000 0001'], ['18040250', 'г. Екатеринбург', ''], ['18040211', '', ''], ['18004102', 'г. Ленинград', '+20 155 000 0102'], ['18040377', 'г. Ташкент', ''], ['18000015', '', '+20 155 000 0015']]
    .forEach((x, i) => { const e = D.emp[ids[i]]; ['tab', 'bplace', 'wphone'].forEach((k, j) => { if (x[j]) { e[k] = x[j]; e._t[k] = T; } }); });
  { const e = D.emp[ids[4]]; e.stat = 'end'; e.statD = addD(t, 90); e.statNote = 'контракт не продлевают'; ['stat', 'statD', 'statNote'].forEach(k => e._t[k] = T); }
  // [сотрудник, вылет через, прилёт через, статус вылета, статус прилёта, куда вернуться]
  const TR = [[0, 40, 100, '', '', ''], [1, 48, 108, '', '', ''], [2, 65, 125, '', '', ''], [3, 70, 130, 'sent', '', ''], [4, 120, 180, '', '', ''], [0, -30, 30, 'tk', 'tk', ''], [5, 10, 24, 'sent', 'tk', 'Санкт-Петербург']];
  TR.forEach((x, i) => {
    const id = 'demo-t' + (i + 1);
    D.trip[id] = mk(id, {
      emp: ids[x[0]], oTo: 'Каир', oD: addD(t, x[1]), bD: addD(t, x[2]), oS: x[3], oSent: x[3] ? addD(t, -12) : '', oTk: x[3] === 'tk' ? 'SU 410' : '',
      bS: x[4], bSent: x[4] ? addD(t, -20) : '', bTk: x[4] ? 'MS 724' : '', bTo: x[5], demo: 1
    });
  });
}
const hasDemo = () => Object.values(D.emp).some(e => e.demo && alive(e)) || Object.values(D.trip).some(e => e.demo && alive(e));

/* ---------- общий интерфейс ---------- */
let TAB = L.tab, Q = { req: '', sch: '', emp: '', app: '' }, SEL = new Set(), F = { sch: 'all', past: false, emp: 'all', lvl: '' };
let toastT;
function toast(m, ms = 2800) { const t = $('#toast'); t.innerHTML = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }
function ask({ title = '', text = '', html = '', input = null, value = '', ok = 'OK', cancel = 'Отмена', danger = false, placeholder = '' }) {
  return new Promise(res => {
    const m = document.createElement('div'); m.id = 'modal';
    m.innerHTML = `<div class="box" role="dialog" aria-modal="true"><h3>${esc(title)}</h3>${text ? `<p>${text}</p>` : ''}${html}${input ? `<label class="fld"><input type="${input}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off"></label>` : ''}<div class="btns">${cancel ? `<button class="btn" data-c>${esc(cancel)}</button>` : ''}<button class="btn ${danger ? 'dan' : 'pri'}" data-ok>${esc(ok)}</button></div></div>`;
    document.body.appendChild(m);
    const inp = m.querySelector('input');
    const done = v => { m.remove(); document.removeEventListener('keydown', kd, true); res(v); };
    const kd = e => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); done(null); } if (e.key === 'Enter' && !(e.target && e.target.tagName === 'TEXTAREA')) { e.preventDefault(); done(input ? inp.value : true); } };
    document.addEventListener('keydown', kd, true);
    m.querySelector('[data-ok]').onclick = () => done(input ? inp.value : true);
    const c = m.querySelector('[data-c]'); if (c) c.onclick = () => done(null);
    m.onclick = e => { if (e.target === m) done(null); };
    setTimeout(() => (inp || m.querySelector('[data-ok]')).focus(), 30);
  });
}
/* шторки + кнопка «Назад» на телефоне закрывает шторку, а не приложение */
const STACK = [];
let skipPop = 0;
function openSheet(level, title, body, foot, onClose) {
  const el = $('#sheet' + level);
  el.innerHTML = `<div class="sh-h"><h3>${title}</h3><button class="ibtn" data-close aria-label="Закрыть">${ic('x')}</button></div><div class="sh-b">${body}</div>${foot ? `<div class="sh-f">${foot}</div>` : ''}`;
  el.querySelector('[data-close]').onclick = () => closeSheet(level);
  const prev = STACK.findIndex(s => s.level === level);
  if (prev >= 0) STACK.splice(prev, 1); else { try { history.pushState({ vy: 1 }, ''); } catch (e) { } }
  STACK.push({ level, onClose });
  $('#scrim').classList.add('on'); document.body.classList.add('lock');
  requestAnimationFrame(() => el.classList.add('on'));
  return el;
}
function closeSheet(level, fromPop) {
  const i = STACK.findIndex(s => s.level === level); if (i < 0) return;
  const s = STACK.splice(i, 1)[0];
  $('#sheet' + level).classList.remove('on');
  if (!STACK.length) { $('#scrim').classList.remove('on'); if (!$('#viewer')) document.body.classList.remove('lock'); }
  if (!fromPop) { skipPop++; history.back(); }
  if (s.onClose) s.onClose();
}
const closeTop = () => { if (STACK.length) closeSheet(STACK[STACK.length - 1].level); };
window.addEventListener('popstate', () => {
  if (skipPop > 0) { skipPop--; return; }
  if ($('#modal')) { const c = $('#modal [data-c]') || $('#modal [data-ok]'); try { history.pushState({ vy: 1 }, ''); } catch (e) { } if (c) c.click(); return; }
  if ($('#viewer')) return closeViewer(true);
  if (STACK.length) closeSheet(STACK[STACK.length - 1].level, true);
});
$('#scrim').onclick = closeTop;

function counts(ls) {
  ls = ls || allLegs().filter(l => !F.lvl || lvOf(l.e) === F.lvl);
  const c = { notk: 0, over: 0, soon: 0, near: 0, later: 0, sent: 0, tk: 0, past: 0 };
  ls.forEach(l => c[urg(l)]++);
  return c;
}
const dirtyN = () => Object.keys(L.dirty).length;
const pendPh = () => Object.keys(L.phOut).filter(id => alive(D.doc[id]) && HAVE.has(id)).length;
const missPh = () => Object.values(D.doc).filter(d => alive(d) && alive(D.emp[d.emp]) && !HAVE.has(d.id)).length;
function badges() {
  const c = counts(allLegs()), n = c.notk + c.over + c.soon;
  $$('[data-cnt="req"]').forEach(el => { el.textContent = n; el.classList.toggle('hide', !n); });
  const dn_ = dirtyN() + pendPh();
  $$('[data-cnt="sync"]').forEach(el => { el.textContent = dn_; el.classList.toggle('hide', !dn_); });
  const ts = $('#topSync'); if (ts) ts.innerHTML = `${ic('sync')}<span>Обмен</span>${dn_ ? `<b>${dn_}</b>` : ''}`;
  const sb = $('#sideSync'); if (sb) sb.innerHTML = dn_ ? `Не отправлено: <b>${dn_}</b>` : 'Всё отправлено';
  const mb = $('#miniSync'); if (mb) { mb.textContent = dn_ || ''; mb.classList.toggle('hide', !dn_); }
  try { if (navigator.setAppBadge) n ? navigator.setAppBadge(n) : navigator.clearAppBadge(); } catch (e) { }
}

const TABS = [['req', 'Заявки', 'req'], ['app', 'Оформить', 'doc'], ['sch', 'График', 'cal'], ['emp', 'Сотрудники', 'users'], ['sync', 'Обмен', 'sync']];
function shell() {
  const cnt = k => k === 'req' || k === 'sync' ? `<span class="cnt hide" data-cnt="${k}"></span>` : '';
  $('#tabs').innerHTML = TABS.map(([k, n, i]) => `<button data-tab="${k}" class="${TAB === k ? 'on' : ''}">${ic(i)}${n}${cnt(k)}</button>`).join('');
  $('#side').innerHTML = `<div class="brand"><img src="icon-192.png" alt=""><span>Вылеты</span></div>` +
    TABS.map(([k, n, i]) => `<button class="nv ${TAB === k ? 'on' : ''}" data-tab="${k}" title="${n}">${ic(i)}<span class="lbl">${n}</span>${cnt(k)}</button>`).join('') +
    `<div class="sp"></div><div class="mini"><button class="ibtn" data-do="export" title="Отправить файл (Ctrl+S)">${ic('send')}<b id="miniSync" class="hide"></b></button><button class="ibtn" data-do="import" title="Принять файл (Ctrl+O)">${ic('inbox')}</button></div>
    <div class="syncbox"><div id="sideSync"></div><button class="btn y" data-do="export">${ic('send')} Отправить файл</button><button class="btn g" data-do="import">${ic('inbox')} Принять файл</button></div>
    <div class="keys"><span class="kbd">/</span> поиск · <span class="kbd">N</span> добавить<br><span class="kbd">Ctrl S</span> отправить · <span class="kbd">Esc</span> закрыть</div>`;
  $$('[data-tab]').forEach(b => b.onclick = () => go(b.dataset.tab));
  $('#fab').innerHTML = ic('plus');
  $('#fab').classList.toggle('hide', TAB === 'sync' || TAB === 'app');
  $('#fab').setAttribute('aria-label', TAB === 'emp' ? 'Добавить сотрудника' : 'Добавить поездку');
  $('#ttl').textContent = { req: 'Заявки и билеты', app: 'Оформление заявок', sch: 'График вылетов', emp: 'Сотрудники', sync: 'Обмен и настройки' }[TAB];
  badges();
}
function go(t) { if (t !== TAB) SEL.clear(); TAB = L.tab = t; save(); shell(); render(); window.scrollTo(0, 0); }

/* отрисовка: шапка страницы + список (#res). Поиск обновляет только список — клавиатура не сбивается */
const VIEWS = {};
function render() {
  const v = $('#view'), y = window.scrollY;
  const V = VIEWS[TAB];
  v.innerHTML = V.head() + `<div id="res">${V.list()}</div>`;
  bindHead(v); bindRes($('#res'));
  document.body.classList.toggle('wiz-on', TAB === 'app' && emps().length > 0);
  bulkBar();
  if (TAB === 'sync') tplInfo();
  window.scrollTo(0, y);
}
function renderList() { const r = $('#res'); if (!r) return render(); r.innerHTML = VIEWS[TAB].list(); bindRes(r); bulkBar(); }
const searchBox = (k, ph) => `<div class="search">${ic('search')}<input type="search" data-q="${k}" placeholder="${ph}" value="${esc(Q[k])}" enterkeyhint="search" autocomplete="off" aria-label="Поиск"></div>`;
const matchQ = (q, ...xs) => { q = norm(q); if (!q) return true; const s = norm(xs.join(' ')); return q.split(' ').every(w => s.includes(w)); };
const demoBanner = () => hasDemo() ? `<div class="banner blu">${ic('info')}<span class="sp">Сейчас показан <b>пример</b> с вымышленными людьми, чтобы было видно, как всё работает.</span><button class="btn sm" data-do="undemo">Удалить пример</button></div>` : '';
function lvChips() {
  const es = staff(), n = l => es.filter(e => lvOf(e) === l).length;
  return `<div class="chips scroll" role="group" aria-label="Уровень">` +
    `<button class="chip ${!F.lvl ? 'on' : ''}" data-lvl="">Все <span class="n">${es.length}</span></button>` +
    Object.entries(LV).map(([k, v]) => `<button class="chip ${F.lvl === k ? 'on' : ''}" data-lvl="${k}"><span class="dot" style="background:${lvColor(k)}"></span>${v.n} <span class="n">${n(k)}</span></button>`).join('') + `</div>`;
}
const byLvl = e => !F.lvl || lvOf(e) === F.lvl;

/* ---------- Заявки ---------- */
const SECS = [
  ['notk', 'red', () => `Вылет в ближайшие ${dney(+S('tkw'))}, а билета нет`],
  ['over', 'red', () => 'Срок заявки прошёл — подать срочно'],
  ['soon', 'org', () => `Подать заявку в ближайшие ${dney(+S('warn'))}`],
  ['near', 'yel', () => 'Подать в течение месяца'],
  ['sent', 'blu', () => 'Заявка подана, ждём билет'],
  ['later', '', () => 'Позже', 1],
  ['tk', 'grn', () => 'Билеты есть', 1],
];
function legBtn(l) {
  const u = urg(l);
  if (u === 'past' || u === 'tk') return '';
  if (l.st === 'sent') return `<button class="btn sm" data-mark="tk" data-key="${l.key}">${ic('ticket')} Билет есть</button>`;
  return `<button class="btn sm" data-mark="sent" data-key="${l.key}">${ic('check')} Заявка подана</button>`;
}
function legRow(l, withBtn) {
  const sel = SEL.has(l.key), tone = TONE[urg(l)];
  const kind = `<span class="i">${ic(l.k === 'o' ? 'up' : 'down')}${LEG[l.k]} <b>${fd(l.date)}</b> ${wd(l.date)}</span>`;
  const w = warnHtml(issues(l.e, l));
  const btn = withBtn ? legBtn(l) : '';
  if (isPC()) return `<div class="tr t-${tone} ${sel ? 'sel' : ''}" data-leg="${l.key}">${av(l.e)}
    <div class="c"><span class="nm one">${esc(l.e.fio)}</span><span class="small muted one">${lvTag(l.e)} ${statBadge(l.e) || esc(l.e.pos || '')}</span></div>
    <div class="c"><span class="l2">${kind}${flyIn(l)}</span><span class="l2">${routeHtml(l)}</span></div>
    <div class="c"><div class="wrapt">${statusPill(l)}${tkChip(l)}${w}</div></div>
    <div class="c"><div class="act">${btn}</div></div></div>`;
  return `<div class="row t-${tone} ${sel ? 'sel' : ''}" data-leg="${l.key}">${av(l.e)}<div class="mn">
    <span class="nm">${esc(l.e.fio)}</span>${l.e.stat ? `<span class="l2">${statBadge(l.e)}</span>` : ''}
    <span class="l2">${kind}${flyIn(l)}</span>
    <span class="l2">${routeHtml(l)}${w}</span>
    <div class="tags">${statusPill(l)}${tkChip(l)}${btn ? `<span class="sp"></span>${btn}` : ''}</div></div></div>`;
}
const LEG_GC = '--gc:40px minmax(0,1.3fr) minmax(0,1.35fr) minmax(0,1.7fr) minmax(150px,auto)';
const legTable = (ls, withBtn = true, head = true) => `<div class="list" style="${LEG_GC}">${isPC() && head ? `<div class="tr th"><div></div><div>Сотрудник</div><div>Рейс и маршрут</div><div>Заявка и билет</div><div></div></div>` : ''}${ls.map(l => legRow(l, withBtn)).join('')}</div>`;
VIEWS.req = {
  head() {
    if (!emps().length) return emptyAll();
    const c = counts(), hot = c.notk + c.over, d = new Date();
    const stat = (k, cls, n, t, sub, icn) => `<button class="stat ${cls}${n && (cls === 'red' || cls === 'org') ? ' hot' : ''}${n ? '' : ' zero'}" data-jump="${k}"><span class="t">${ic(icn)}${t}</span><b>${n}</b><span class="d">${sub}</span></button>`;
    let h = demoBanner();
    h += `<div class="pagehead"><span class="date">${WDF[d.getDay()][0].toUpperCase() + WDF[d.getDay()].slice(1)}, ${d.getDate()} ${MONG[d.getMonth()]}</span><h2>Заявки и билеты</h2><button class="link" data-do="legend">${ic('help')}Что значат цвета</button></div>`;
    h += `<div class="stats">${stat(c.notk ? 'notk' : 'over', 'red', hot, 'Срочно', 'просрочено или нет билета', 'alert')}${stat('soon', 'org', c.soon, 'На этой неделе', `подать в ближайшие ${dney(+S('warn'))}`, 'clock')}${stat('sent', 'blu', c.sent, 'Ждём билет', 'заявка подана', 'req')}${stat('tk', 'grn', c.tk, 'Билеты есть', 'всё готово', 'ticket')}</div>`;
    const lvs = staff().filter(e => leaving(e) && !hasHome(e) && byLvl(e));
    if (lvs.length) h += `<div class="banner red">${ic('alert')}<span class="sp"><b>Уходят — нужен вылет домой:</b> ${lvs.map(e => `<button class="link" data-leave="${e.id}">${esc(short(e.fio))}</button> <span class="muted">(${e.statD ? (e.stat === 'fired' ? 'увольнение ' : 'контракт до ') + fd(e.statD) : (e.stat === 'fired' ? 'увольнение' : 'не продлевают') + ', дата не указана'})</span>`).join(', ')}</span></div>`;
    if (!hot && !c.soon) h += `<div class="allok">${ic('shield')}Срочного ничего нет: все заявки идут по графику</div>`;
    h += `<div class="toolbar">${searchBox('req', 'Поиск: ФИО, город')}<button class="btn" data-do="newtrip">${ic('plus')} Поездка</button></div>`;
    h += lvChips();
    if (!isPC()) h += `<div style="display:flex;justify-content:flex-end;margin-top:2px"><button class="link" data-do="legend">${ic('help')}Что значат цвета</button></div>`;
    return h;
  },
  list() {
    if (!emps().length) return '';
    const q = Q.req;
    const ls = allLegs().filter(l => l.fleft >= 0 && byLvl(l.e) && matchQ(q, l.e.fio, l.e.lat, l.from, l.to, l.e.pos)).sort((a, b) => a.date.localeCompare(b.date) || a.e.fio.localeCompare(b.e.fio, 'ru'));
    const g = {}; SECS.forEach(s => g[s[0]] = []);
    ls.forEach(l => g[urg(l)] && g[urg(l)].push(l));
    ['over', 'soon', 'near'].forEach(k => g[k].sort((a, b) => a.dl.localeCompare(b.dl)));
    let h = '', first = true;
    for (const [k, cls, title, coll] of SECS) {
      const arr = g[k]; if (!arr.length) continue;
      const open = !coll || F['o_' + k] || q;
      h += `<div class="sec ${cls}" id="g-${k}"><i class="dot"></i>${title()}<span class="n">${arr.length}</span>${coll && !q ? `<button class="btn sm tog" data-do="tog:o_${k}">${open ? 'Свернуть' : 'Показать'}</button>` : ''}</div>${open ? legTable(arr, true, first) : ''}`;
      if (open) first = false;
    }
    if (!ls.length) h += `<div class="card empty" style="margin-top:12px">${ic('up')}<h3>${q || F.lvl ? 'Ничего не найдено' : 'Предстоящих рейсов нет'}</h3><p>${q || F.lvl ? '' : 'Добавьте поездку: даты вылета и прилёта. Срок заявки посчитается сам.'}</p></div>`;
    return h;
  }
};
function emptyAll() {
  return `${demoBanner()}<div class="card empty" style="margin-top:20px">${ic('users')}<h3>Пока никого нет</h3><p>Добавьте сотрудников вручную, загрузите из Excel или примите файл с другого устройства.</p>
  <div style="justify-content:center;display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn pri" data-do="newemp">${ic('plus')} Сотрудник</button><button class="btn" data-do="xlsin">${ic('upload')} Загрузить свои файлы</button><button class="btn" data-do="import">${ic('inbox')} Принять файл</button><button class="btn" data-do="demo">Показать пример</button></div></div>`;
}

/* ---------- График ---------- */
VIEWS.sch = {
  head() {
    if (!emps().length) return emptyAll();
    return `<div class="pagehead"><h2>График вылетов</h2><button class="link" data-do="legend">${ic('help')}Что значат цвета</button></div><div class="toolbar">${searchBox('sch', 'Поиск: ФИО, город')}
    <div class="chips"><button class="chip ${F.sch === 'all' ? 'on' : ''}" data-f="sch:all">Все рейсы</button><button class="chip ${F.sch === 'o' ? 'on' : ''}" data-f="sch:o">${ic('up')}Вылеты</button><button class="chip ${F.sch === 'b' ? 'on' : ''}" data-f="sch:b">${ic('down')}Прилёты</button><button class="chip ${F.past ? 'on' : ''}" data-f="past">Прошедшие</button></div></div>${lvChips()}`;
  },
  list() {
    if (!emps().length) return '';
    const q = Q.sch, T = today();
    const ls = allLegs().filter(l => (F.past ? l.fleft < 0 : l.fleft >= 0) && (F.sch === 'all' || F.sch === l.k) && byLvl(l.e) && matchQ(q, l.e.fio, l.e.lat, l.from, l.to, l.e.pos));
    ls.sort((a, b) => F.past ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
    if (!ls.length) return `<div class="card empty" style="margin-top:12px">${ic('cal')}<h3>${F.past ? 'Прошедших рейсов нет' : 'Рейсов нет'}</h3></div>`;
    let h = '', cur = '', buf = [];
    const pc = isPC();
    const flush = () => {
      if (!buf.length) return; const [y, m] = cur.split('-');
      const noTk = buf.filter(l => l.st !== 'tk' && l.fleft >= 0).length;
      h += `<div class="sec"><i class="dot"></i>${MON[+m - 1]} ${y}<span class="n">${buf.length}</span>${noTk ? `<span class="tk no" style="text-transform:none;letter-spacing:0">без билета: ${noTk}</span>` : (F.past ? '' : `<span class="tk yes" style="text-transform:none;letter-spacing:0">${ic('check')}все с билетами</span>`)}</div><div class="list" style="--gc:52px 40px minmax(0,1.3fr) minmax(0,1.5fr) minmax(0,1.6fr)">${buf.map(l => schRow(l, pc, T)).join('')}</div>`; buf = [];
    };
    ls.forEach(l => { const m = l.date.slice(0, 7); if (m !== cur) { flush(); cur = m; } buf.push(l); });
    flush();
    return h;
  }
};
function schRow(l, pc, T) {
  const sel = SEL.has(l.key), tone = TONE[urg(l)];
  const db = `<div class="dbox ${l.fleft < 0 ? 'past' : ''} ${l.date === T ? 'today' : ''}"><b>${+l.date.slice(8)}</b><span>${wd(l.date)}</span></div>`;
  const kind = `<span class="i">${ic(l.k === 'o' ? 'up' : 'down')}${LEG[l.k]}</span>`;
  if (pc) return `<div class="tr t-${tone} ${sel ? 'sel' : ''}" data-leg="${l.key}">${db}${av(l.e)}<div class="c"><span class="nm one">${esc(l.e.fio)}</span><span class="small muted one">${lvTag(l.e)} ${esc(l.e.pos || '')}</span></div><div class="c"><span class="l2">${kind}${flyIn(l)}</span><span class="l2">${routeHtml(l)}</span></div><div class="c"><div class="wrapt">${tkChip(l)}${statusPill(l)}</div></div></div>`;
  return `<div class="row t-${tone} ${sel ? 'sel' : ''}" data-leg="${l.key}" style="grid-template-columns:auto auto minmax(0,1fr)">${db}${av(l.e)}<div class="mn"><span class="nm">${esc(l.e.fio)}</span><span class="l2">${kind}${flyIn(l)}</span><span class="l2">${routeHtml(l)}</span><div class="tags">${tkChip(l)}${statusPill(l)}</div></div></div>`;
}

/* ---------- Сотрудники ---------- */
function dups() {
  const by = {}, out = [], seen = new Set();
  emps().forEach(e => {
    if (e.pass) (by['p' + normPass(e.pass)] = by['p' + normPass(e.pass)] || []).push(e);
    if (e.fio) (by['f' + norm(e.fio)] = by['f' + norm(e.fio)] || []).push(e);
  });
  Object.values(by).forEach(a => { if (a.length > 1) { const k = a.map(x => x.id).sort().join(); if (!seen.has(k)) { seen.add(k); out.push(a); } } });
  return out;
}
VIEWS.emp = {
  head() {
    const all = emps();
    if (!all.length) return emptyAll();
    const nIss = all.filter(e => !gone(e) && issues(e, nextLeg(e.id)).length).length;
    const nLeave = all.filter(leaving).length, nGone = all.filter(gone).length;
    let h = demoBanner();
    const dd = dups();
    if (dd.length) h += `<div class="banner">${ic('alert')}<span class="sp">Похоже на дубли: ${dd.map(a => `<b>${esc(short(a[0].fio))}</b> ×${a.length}`).join(', ')}. Так бывает, если человека добавили и на телефоне, и на ПК.</span><button class="btn sm" data-do="dups">Объединить</button></div>`;
    h += `<div class="pagehead"><h2>Сотрудники <span class="muted" style="font-weight:400">${all.length - nGone}</span></h2></div>`;
    h += `<div class="toolbar">${searchBox('emp', 'ФИО, город, телефон, паспорт')}<div class="chips"><button class="chip ${F.emp === 'all' ? 'on' : ''}" data-f="emp:all">Работают</button><button class="chip ${F.emp === 'iss' ? 'on' : ''}" data-f="emp:iss">${ic('alert')}Проблемы${nIss ? ` <span class="n">${nIss}</span>` : ''}</button><button class="chip ${F.emp === 'notrip' ? 'on' : ''}" data-f="emp:notrip">Без поездок</button>${nLeave || F.emp === 'leave' ? `<button class="chip ${F.emp === 'leave' ? 'on' : ''}" data-f="emp:leave">Уходят <span class="n">${nLeave}</span></button>` : ''}${nGone || F.emp === 'gone' ? `<button class="chip ${F.emp === 'gone' ? 'on' : ''}" data-f="emp:gone">Уволены <span class="n">${nGone}</span></button>` : ''}</div>${isPC() ? `<button class="btn pri" data-do="newemp">${ic('plus')} Сотрудник</button>` : ''}</div>`;
    h += lvChips();
    return h;
  },
  list() {
    const all = emps(); if (!all.length) return '';
    const q = Q.emp;
    const rows = all.filter(byLvl).map(e => { const nl = nextLeg(e.id); return { e, nl, iss: issues(e, nl), nd: docsOf(e.id).length }; })
      .filter(x => matchQ(q, x.e.fio, x.e.lat, x.e.city, x.e.air, x.e.phone, x.e.email, x.e.pos, x.e.pass))
      .filter(x => F.emp === 'gone' ? gone(x.e) : F.emp === 'leave' ? leaving(x.e) : !gone(x.e) && (F.emp === 'all' || (F.emp === 'iss' && x.iss.length) || (F.emp === 'notrip' && !x.nl)));
    if (!rows.length) return `<div class="card empty" style="margin-top:12px">${ic('search')}<h3>Никого не нашлось</h3></div>`;
    const pc = isPC();
    let h = '';
    for (const lv of ['b', 'm', 'w']) {
      const grp = rows.filter(x => lvOf(x.e) === lv); if (!grp.length) continue;
      h += `<div class="sec"><i class="dot" style="background:${lvColor(lv)}"></i>${LV[lv].n}<span class="n">${grp.length}</span></div>`;
      h += `<div class="list" style="--gc:40px minmax(0,1.5fr) minmax(0,1fr) minmax(0,1.3fr) minmax(0,1fr) minmax(0,1.5fr)">`;
      if (pc) h += `<div class="tr th"><div></div><div>ФИО</div><div>Города</div><div>Контакты</div><div>Паспорт</div><div>Ближайший рейс</div></div>`;
      grp.forEach(({ e, nl, iss, nd }) => {
        const sel = SEL.has(e.id), w = warnHtml(iss);
        const docs = nd ? `<span class="i small muted">${ic('clip')}${nd} ${pl(nd, 'файл', 'файла', 'файлов')}</span>` : '<span class="small muted">фото нет</span>';
        if (pc) h += `<div class="tr ${sel ? 'sel' : ''} ${gone(e) ? 'dim' : ''}" data-emp="${e.id}">${av(e)}
          <div class="c"><span class="nm one">${esc(e.fio)}</span><span class="small muted one">${statBadge(e)} ${esc(e.pos || LV[lvOf(e)].one)}</span></div>
          <div class="c"><span class="one">${esc(e.city || '—')}</span>${e.air && e.air !== e.city ? `<span class="small muted one">вылет из: ${esc(e.air)}</span>` : ''}</div>
          <div class="c"><span class="one">${esc(e.phone || '—')}</span><span class="small muted one">${esc(e.email || '')}</span></div>
          <div class="c">${w ? `<div class="wrapt">${w}</div>` : `<span class="one">${e.pExp ? 'до ' + fd(e.pExp) : (e.pass ? 'есть' : '—')}</span>`}${docs}</div>
          <div class="c">${nl ? `<span class="l2"><span class="i">${ic(nl.k === 'o' ? 'up' : 'down')}${LEG[nl.k]} <b>${fd(nl.date)}</b></span>${flyIn(nl)}</span><div class="wrapt">${tkChip(nl)}</div>` : '<span class="muted small">поездок нет</span>'}</div></div>`;
        else h += `<div class="row ${sel ? 'sel' : ''} ${gone(e) ? 'dim' : ''}" data-emp="${e.id}">${av(e)}<div class="mn"><span class="nm">${esc(e.fio)}</span>${e.stat ? `<span class="l2">${statBadge(e)}</span>` : ''}
          <span class="l2">${e.pos ? `<span>${esc(e.pos)}</span>` : ''}${e.city ? `<span class="i">${ic('pin')}${esc(e.city)}${e.air && e.air !== e.city ? ' · вылет из ' + esc(e.air) : ''}</span>` : ''}</span>
          ${e.phone || nd ? `<span class="l2">${e.phone ? `<span class="i">${ic('phone')}${esc(e.phone)}</span>` : ''}${nd ? `<span class="i">${ic('clip')}${nd}</span>` : ''}</span>` : ''}
          ${nl ? `<div class="tags"><span class="l2"><span class="i">${ic(nl.k === 'o' ? 'up' : 'down')}${fd(nl.date)}</span>${flyIn(nl)}</span>${tkChip(nl)}</div>` : '<span class="small muted">поездок нет</span>'}
          ${w ? `<div class="tags">${w}</div>` : ''}</div></div>`;
      });
      h += '</div>';
    }
    return h;
  }
};

/* ---------- Обмен ---------- */
let installEv = null;
VIEWS.sync = {
  head() {
    const dn_ = dirtyN(), pp = pendPh(), mp = missPh();
    const nE = emps().length, nT = trips().length, nD = Object.values(D.doc).filter(d => alive(d) && alive(D.emp[d.emp])).length;
    return `<div class="pagehead"><h2>Обмен и настройки</h2></div><div class="grid2"><div>
  <div class="card"><h3>${ic('sync')}Телефон ⇄ ПК</h3>
    <p>Сервер и интернет не нужны. Одно устройство отправляет файл, другое принимает и объединяет: новое добавится, изменённое обновится, ничего не затрётся.</p>
    <div class="kv"><span>Это устройство</span><div><b>${esc(L.name)}</b> <button class="link" data-do="rename">изменить</button></div>
      <span>Не отправлено</span><div>${dn_ ? `<b style="color:var(--org)">${dn_} ${pl(dn_, 'изменение', 'изменения', 'изменений')}</b>` : 'всё отправлено'}${pp ? `, <b style="color:var(--org)">фото: ${pp}</b>` : ''}</div>
      <span>Отправлено</span><div>${ftime(L.sent)}</div>
      <span>Принято</span><div>${L.recv ? ftime(L.recv) + (L.recvFrom ? ' · с «' + esc(L.recvFrom) + '»' : '') : '—'}</div>
      <span>Файл</span><div>${L.pwd ? `${ic('lock')} зашифрован паролем` : '<span style="color:var(--org);font-weight:600">без пароля</span>'}</div></div>
    ${mp ? `<div class="banner">${ic('image')}<span class="sp">Здесь не хватает <b>${mp}</b> фото документов. На другом устройстве нажмите «Полная копия с фото» и пришлите файл сюда.</span></div>` : ''}
    <div class="btns"><button class="btn pri big" data-do="export">${ic('send')} Отправить файл</button><button class="btn big" data-do="import">${ic('inbox')} Принять файл</button></div>
    <div class="btns" style="margin-top:8px">${!isPC() ? `<button class="btn sm" data-do="exportdl">${ic('download')} Сохранить в «Загрузки»</button>` : ''}<button class="btn sm" data-do="exportfull">${ic('image')} Полная копия с фото</button></div>
    <details style="margin-top:10px"><summary>Как передать данные</summary><ol class="steps">
      <li>На устройстве, где вносили изменения, нажмите <b>«Отправить файл»</b>. На телефоне откроется «Поделиться» — выберите Telegram → «Избранное». На ПК файл сохранится в «Загрузки», перетащите его в Telegram.</li>
      <li>На другом устройстве нажмите <b>«Принять файл»</b>. На ПК файл можно просто перетащить в окно. На Android можно в Telegram нажать «Поделиться» → «Вылеты».</li>
      <li>Меняли и там, и там? Отправьте в обе стороны. Правки разных полей сохранятся все; если одно и то же поле меняли на обоих, останется более поздняя правка.</li>
      <li>Фото документов уходят один раз, с первым файлом после добавления, чтобы файлы не были огромными. «Полная копия с фото» — все данные и все фото, годится и как резервная копия.</li></ol></details>
  </div>
  <div class="card"><h3>${ic('lock')}Пароль на файл обмена</h3>
    <p>В файле паспортные данные и фото. С паролем файл зашифрован, в Telegram или почте его никто не прочитает. Пароль одинаковый на телефоне и на ПК.</p>
    <div class="inl"><input type="password" id="pwd" class="inp" value="${esc(L.pwd || '')}" placeholder="Пароль (по желанию)" autocomplete="new-password" aria-label="Пароль"><button data-do="savepwd" style="width:auto;padding:0 14px;font-weight:600">Сохранить</button></div>
  </div>
  <div class="card"><h3>${ic('xls')}Excel</h3>
    <p>Выгрузка: сотрудники, поездки и сроки заявок, три листа. Загрузка из вашей таблицы добавит новых людей и обновит существующих (ищу по номеру паспорта, потом по ФИО); столбцы узнаю по названиям.</p>
    <div class="btns"><button class="btn" data-do="xlsout">${ic('download')} Скачать Excel</button><button class="btn" data-do="xlsin">${ic('upload')} Загрузить свои Excel / Word</button></div>
    <div class="btns" style="margin-top:8px"><button class="btn sm" data-do="xlstpl">Пустой шаблон для заполнения</button></div>
    <p class="small" style="margin:10px 0 0">«Загрузить свои Excel / Word» подходит для любых ваших таблиц учёта, даже если в них меньше данных или столбцы называются по-другому: программа покажет, что в каком столбце, и даст поправить. Можно выбрать сразу несколько файлов, в том числе старые заявки рабочих и заявки Word на билеты. На ПК файлы можно просто перетащить в окно.</p>
  </div>
  <div class="card"><h3>${ic('doc')}Бланки заявок</h3><p>По ним раздел «Оформить» делает файлы. Если поменяются подписанты или форма — исправьте бланк в Word/Excel и загрузите сюда.</p><div id="tplInfo"></div></div></div><div>
  <div class="card"><h3>${ic('cal')}Напоминания в календарь</h3>
    <p>Файл со сроками неподанных заявок: открываете — и сроки появляются в календаре телефона или Outlook, с напоминанием за 3 дня и в 9:00 в день срока.</p>
    <div class="btns"><button class="btn" data-do="ics">${ic('cal')} Сроки заявок в календарь</button></div></div>
  <div class="card"><h3>${ic('gear')}Настройки</h3>
    <div class="cols"><label class="fld"><span>Заявка подаётся за, дней</span><input type="number" inputmode="numeric" min="1" max="365" data-set="lead" value="${esc(S('lead'))}"></label>
    <label class="fld"><span>Оранжевый: подать за, дней</span><input type="number" inputmode="numeric" min="0" max="60" data-set="warn" value="${esc(S('warn'))}"></label></div>
    <label class="fld"><span>Красный «нет билета»: за сколько дней до вылета</span><input type="number" inputmode="numeric" min="1" max="90" data-set="tkw" value="${esc(S('tkw'))}"></label>
    <label class="fld"><span>Куда летят по умолчанию</span><input data-set="dest" value="${esc(D.set.dest || '')}" placeholder="например, Каир"><div class="hint">Подставляется в поездки, где «Куда» не указано. Настройки передаются при обмене.</div></label>
    <button class="link" data-do="legend">${ic('help')}Что значат цвета</button>
  </div>
  <div class="card"><h3>${ic('info')}Приложение</h3>
    <div class="kv"><span>Сотрудников</span><div>${nE}</div><span>Поездок</span><div>${nT}</div><span>Фото и файлов</span><div>${nD}</div><span>Версия</span><div>${VER}</div><span>Хранение</span><div id="persist">в памяти этого браузера</div></div>
    <div class="btns">${installEv ? `<button class="btn pri" data-do="install">${ic('download')} Установить приложение</button>` : ''}${hasDemo() ? `<button class="btn" data-do="undemo">Удалить пример</button>` : ''}<button class="btn dan" data-do="wipe">${ic('trash')} Стереть данные здесь</button></div>
    ${!installEv && !matchMedia('(display-mode: standalone)').matches ? `<p class="small" style="margin-top:10px">Установка: Android, Chrome — меню ⋮ → «Добавить на главный экран». iPhone, Safari — «Поделиться» → «На экран Домой». ПК, Chrome или Edge — значок установки справа в адресной строке.</p>` : ''}
  </div></div></div>`;
  },
  list() { return ''; }
};

/* ---------- события ---------- */
function bindHead(v) {
  $$('[data-q]', v).forEach(i => i.oninput = () => { Q[i.dataset.q] = i.value; renderList(); });
  $$('[data-f]', v).forEach(b => b.onclick = () => { const [k, val] = b.dataset.f.split(':'); if (k === 'past') F.past = !F.past; else F[k] = val; render(); });
  $$('[data-leave]', v).forEach(b => b.onclick = () => leaveDlg(b.dataset.leave));
  $$('[data-lvl]', v).forEach(b => b.onclick = () => { F.lvl = b.dataset.lvl; SEL.clear(); render(); });
  $$('[data-jump]', v).forEach(b => b.onclick = () => {
    const k = b.dataset.jump;
    if (k === 'tk' && !F.o_tk) { F.o_tk = true; renderList(); }
    const el = $('#g-' + k) || (k === 'notk' ? $('#g-over') : null);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (isPC() ? 16 : 70), behavior: 'smooth' }); else toast('Здесь пусто');
  });
  bindSets(v);
  $$('[data-apstep]', v).forEach(b => b.onclick = () => { const n = +b.dataset.apstep; if (n > 1 && !apUnits().all.length) return toast('Сначала выберите людей'); AP.step = n; render(); window.scrollTo(0, 0); });
  $$('[data-apmode]', v).forEach(b => b.onclick = () => { AP.mode = b.dataset.apmode; render(); });
  if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(p => { const el = $('#persist'); if (el) el.textContent = p ? 'на устройстве, защищено от автоочистки' : 'в памяти этого браузера'; });
}
function bindSets(v) {
  $$('[data-set]', v).forEach(i => i.onchange = () => {
    let val = i.value.trim(); const k = i.dataset.set;
    if (i.type === 'number') { val = Math.max(+i.min, Math.min(+i.max, parseInt(val) || DEF[k])); i.value = val; }
    setF(D.set, k, val); L.dirty.set = 1; save(); badges(); toast('Сохранено');
  });
}
function bindRes(r) {
  bindSets(r);
  $$('[data-pick]', r).forEach(row => row.onclick = () => { const k = row.dataset.pick; AP.sel.has(k) ? AP.sel.delete(k) : AP.sel.add(k); renderList(); });
  $$('[data-aptog]', r).forEach(h => h.onclick = () => { const id = h.dataset.aptog, card = h.closest('.acard'); AP.open[id] = !card.querySelector('.ab'); renderList(); });
  $$('[data-apemp]', r).forEach(b => b.onclick = () => editEmp(b.dataset.apemp));
  $$('[data-apdrop]', r).forEach(b => b.onclick = () => { b.dataset.apdrop.split(',').forEach(k => AP.sel.delete(k)); renderList(); toast('Убрано из заявки'); });
  $$('[data-ak]', r).forEach(i => { i.oninput = () => apField(i, false); i.onchange = () => apField(i, true); });
  $$('[data-apf]', r).forEach(i => i.oninput = i.onchange = () => { AP[i.dataset.apf] = i.dataset.apf === 'date' ? (validIso(i.value) ? i.value : AP.date) : i.value.trim(); });
  $$('[data-apcomb]', r).forEach(b => b.onclick = () => { AP.comb = b.dataset.apcomb === '1'; $$('[data-apcomb]', r).forEach(x => x.classList.toggle('on', x === b)); });
  $$('[data-leg]', r).forEach(row => row.onclick = e => {
    if (e.target.closest('[data-mark]')) return;
    if (e.target.closest('[data-av]') || SEL.size) return toggleSel(row.dataset.leg, row);
    editTrip(row.dataset.leg.split(':')[0]);
  });
  $$('[data-emp]', r).forEach(row => row.onclick = e => {
    if (e.target.closest('[data-av]') || SEL.size) return toggleSel(row.dataset.emp, row);
    editEmp(row.dataset.emp);
  });
  $$('[data-mark]', r).forEach(b => b.onclick = e => { e.stopPropagation(); mark([b.dataset.key], b.dataset.mark); });
}
function toggleSel(k, row) { SEL.has(k) ? SEL.delete(k) : SEL.add(k); $$(`[data-leg="${k}"],[data-emp="${k}"]`).forEach(x => x.classList.toggle('sel', SEL.has(k))); bulkBar(); }
function bulkBar() {
  const b = $('#bulk');
  $('#fab').style.visibility = SEL.size ? 'hidden' : '';
  document.body.classList.toggle('bulk-on', !!SEL.size && TAB !== 'sync' && TAB !== 'app');
  if (!SEL.size || TAB === 'sync' || TAB === 'app') { b.classList.add('hide'); return; }
  b.classList.remove('hide');
  const n = SEL.size, x = `<button class="ibtn" data-b="clr" aria-label="Снять выбор">${ic('x')}</button>`, x2 = isPC() ? `<button class="btn sm" data-b="clr" aria-label="Снять выбор">${ic('x')}</button>` : '';
  if (TAB === 'emp') b.innerHTML = `<span class="t">Выбрано: ${n}${x}</span><div class="bb"><button class="btn sm ok" data-b="grouptrip">${ic('up')} Поездка</button><button class="btn sm" data-b="photos">${ic('image')} Фото</button><button class="btn sm" data-b="empxls">${ic('xls')} Excel</button><button class="btn sm" data-b="all">Все</button><button class="btn sm" data-b="empdel" aria-label="Удалить">${ic('trash')}</button>${x2}</div>`;
  else b.innerHTML = `<span class="t">Выбрано: ${n}${x}</span><div class="bb"><button class="btn sm ok" data-b="form">${ic('doc')} Оформить</button><button class="btn sm" data-b="sent">${ic('check')} Заявка подана</button><button class="btn sm ok" data-b="tk">${ic('ticket')} Билет есть</button><button class="btn sm" data-b="reqxls">${ic('xls')} Excel для заявки</button><button class="btn sm" data-b="photos">${ic('image')} Фото</button><button class="btn sm" data-b="copy">${ic('copy')} Текст</button>${x2}</div>`;
  $$('[data-b]', b).forEach(y => y.onclick = () => bulk(y.dataset.b));
}
async function bulk(a) {
  const keys = [...SEL];
  if (a === 'clr') { SEL.clear(); return renderList(); }
  if (a === 'all') { (F.emp === 'gone' ? emps().filter(gone) : staff()).filter(byLvl).forEach(e => SEL.add(e.id)); return renderList(); }
  if (a === 'sent' || a === 'tk') return mark(keys, a);
  if (a === 'reqxls') return reqXlsx(keys.map(legByKey).filter(Boolean));
  if (a === 'copy') return copyReq(keys.map(legByKey).filter(Boolean));
  if (a === 'form') { AP.sel = new Set(keys); AP.step = 1; AP.inited = true; SEL.clear(); return go('app'); }
  if (a === 'photos') return sendPhotos(TAB === 'emp' ? keys : [...new Set(keys.map(legByKey).filter(Boolean).map(l => l.e.id))]);
  if (a === 'empxls') return exportXlsx(keys);
  if (a === 'grouptrip') return groupTrip(keys);
  if (a === 'empdel') {
    if (!await ask({ title: `Удалить ${keys.length} ${pl(keys.length, 'сотрудника', 'сотрудников', 'сотрудников')}?`, text: 'Вместе с поездками и фото. На другом устройстве они удалятся после обмена.', ok: 'Удалить', danger: true })) return;
    keys.forEach(id => { const e = D.emp[id]; if (e) delEmp(e); });
    SEL.clear(); save(); render(); toast('Удалено');
  }
}
function delEmp(e) { tripsOf(e.id).forEach(delRec); docsOf(e.id).forEach(d => { delRec(d); dropBlob(d.id); }); delRec(e); }
function mark(keys, st) {
  let n = 0;
  keys.forEach(key => {
    const l = legByKey(key); if (!l) return;
    if (setF(l.t, l.k + 'S', st)) n++;
    if (!l.t[l.k + 'Sent']) setF(l.t, l.k + 'Sent', today());
  });
  SEL.clear(); save(); render();
  toast(st === 'sent' ? `Заявка подана: ${n}` : `Билет есть: ${n}`);
}
function legend() {
  const row = (a, b) => `<div>${a}<span>${b}</span></div>`;
  ask({
    title: 'Что значат цвета', cancel: null, ok: 'Понятно', html: `<div class="legend">
    ${row('<span class="pill red">красный</span>', 'Нужно действовать сейчас: срок заявки прошёл или до вылета меньше ' + dney(+S('tkw')) + ', а билета нет.')}
    ${row('<span class="pill org">оранжевый</span>', 'Скоро: подать заявку в ближайшие ' + dney(+S('warn')) + '. Паспорт скоро истекает.')}
    ${row('<span class="pill yel">жёлтый</span>', 'Подать заявку в течение месяца.')}
    ${row('<span class="pill blu">синий</span>', 'В работе: заявка подана, ждём билет.')}
    ${row('<span class="pill gry">серый</span>', 'Спокойно: до срока заявки больше месяца.')}
    ${row('<span class="tk yes">Билет есть</span>', 'Зелёный — билет куплен.')}
    ${row('<span class="tk no">Нет билета</span>', 'Билета ещё нет. Ярко-красный, когда вылет уже близко.')}
    <hr style="border:0;border-top:1px solid var(--line);margin:4px 0">
    ${row(`<span class="av lw" style="width:32px;height:32px;font-size:12px">ИИ</span>`, 'Рабочие')}
    ${row(`<span class="av lm" style="width:32px;height:32px;font-size:12px">ИИ</span>`, 'Мастера и офис')}
    ${row(`<span class="av lb" style="width:32px;height:32px;font-size:12px">${ic('crown', 'cr')}ИИ</span>`, 'Руководство')}
    <p class="small" style="margin:4px 0 0">Нажмите на кружок с инициалами, чтобы выбрать несколько человек или рейсов.</p></div>`
  });
}

/* ---------- карточка сотрудника ---------- */
let curEmp = null;
function editEmp(id, preset) {
  const exist = id ? D.emp[id] : null;
  const r = exist || { id: uid(), _t: {} };
  if (!exist && preset) for (const k in preset) setF(r, k, preset[k]);
  curEmp = r;
  const commit = () => { if (!D.emp[r.id] && (r.fio || '').trim()) D.emp[r.id] = r; save(false); };
  const fld = (k, label, type = 'text', extra = '') => `<label class="fld"><span>${label}</span><input type="${type}" data-f="${k}" value="${esc(r[k] || '')}" ${extra}></label>`;
  const issHtml = () => { const iss = D.emp[r.id] ? issues(r, nextLeg(r.id)) : []; return iss.length ? `<div class="banner ${iss.some(x => x[1] === 'red') ? 'red' : ''}" style="margin:0 0 6px">${ic('alert')}<span class="sp">${iss.map(x => x[0]).join(', ')}</span></div>` : ''; };
  const statHtml = () => r.stat ? `<div class="statbox ${gone(r) ? 'gone' : 'leave'}">${ic('alert')}<div class="sp"><b>${STATN[r.stat]}</b>${r.statD ? ` · ${r.stat === 'fired' ? 'дата увольнения' : 'контракт до'} ${fd(r.statD)}` : ''}${r.statNote ? `<div class="small">${esc(r.statNote)}</div>` : ''}${leaving(r) && !hasHome(r) ? '<div class="small" style="color:var(--red);font-weight:650">Нет вылета домой</div>' : ''}</div><button type="button" class="btn sm" data-leavebtn>Изменить</button></div>`
    : `<button type="button" class="link" data-leavebtn style="margin-top:6px">${ic('alert')}Не продлевают контракт или увольнение…</button>`;
  const headHtml = () => `<div class="ehead">${av(r, 1).replace('data-av', 'data-avx')}<div style="min-width:0"><div class="nm">${esc(r.fio || 'Новый сотрудник')}</div><div class="small muted">${lvTag(r)}${r.pos ? ' · ' + esc(r.pos) : ''}</div></div></div>`;
  const docsHtml = () => `<div class="docs">${docsOf(r.id).map(d => `<button type="button" class="doc ${HAVE.has(d.id) ? '' : 'miss'}" data-doc="${d.id}" title="${esc(d.name || '')}">${/^image\//.test(d.type) && HAVE.has(d.id) ? `<img data-thumb="${d.id}" alt="">` : HAVE.has(d.id) ? ic('file') + 'PDF' : ic('image') + 'на другом устройстве'}<span class="k">${KIND[d.kind] || 'Документ'}</span></button>`).join('')}</div>`;
  const body = () => {
    const tl = D.emp[r.id] ? tripsOf(r.id) : [], nd = docsOf(r.id).length;
    return `<div id="eHead">${headHtml()}</div><div id="issBox">${issHtml()}</div>
    <div class="grp">Уровень</div>
    <div class="seg lvls" data-lvseg>${Object.entries(LV).map(([k, v]) => `<button type="button" data-v="${k}" class="${v.c} ${lvOf(r) === k ? 'on' : ''}">${ic(v.i)}${v.n}</button>`).join('')}</div>
    <div id="statBox">${statHtml()}</div>
    <div class="grp">Сотрудник</div>
    ${fld('fio', 'ФИО *', 'text', 'placeholder="Фамилия Имя Отчество" autocomplete="off" autocapitalize="words"')}
    ${fld('lat', 'ФИО латиницей, как в загранпаспорте', 'text', 'placeholder="IVANOV IVAN" style="text-transform:uppercase" autocomplete="off" autocapitalize="characters"')}
    <div class="cols">${fld('pos', 'Должность', 'text', 'list="poss" autocomplete="off"')}${fld('tab', 'Табельный номер', 'text', 'inputmode="numeric" autocomplete="off"')}</div>
    <div class="grp">Города</div>
    <div class="cols">${fld('city', 'Базовый город', 'text', 'placeholder="где живёт" list="cities" autocomplete="off"')}${fld('air', 'Обычно вылетает из', 'text', `placeholder="${esc(r.city || 'если не из базового')}" list="cities" autocomplete="off"`)}</div>
    <div class="fld" style="margin-top:-6px"><div class="hint">Например, живёт в Туле, а летает из Москвы. В каждой поездке город вылета и прилёта можно поменять отдельно.</div></div>
    <div class="grp">Контакты</div>
    <label class="fld"><span>Мобильный телефон</span><div class="inl"><input type="tel" data-f="phone" value="${esc(r.phone || '')}" placeholder="+7 …" autocomplete="off"><a data-l="tel" title="Позвонить" aria-label="Позвонить">${ic('phone')}</a><a data-l="wa" target="_blank" rel="noopener" title="WhatsApp" aria-label="WhatsApp">${ic('msg')}</a></div></label>
    <label class="fld"><span>Почта</span><div class="inl"><input type="email" data-f="email" value="${esc(r.email || '')}" placeholder="name@mail.ru" autocomplete="off" autocapitalize="off"><a data-l="mail" title="Написать" aria-label="Написать">${ic('mail')}</a></div></label>
    ${fld('wphone', 'Рабочий телефон (на объекте)', 'tel', 'placeholder="+20 …" autocomplete="off"')}
    <div class="grp">Паспорт</div>
    <div class="cols">${fld('pass', 'Серия и номер', 'text', 'autocomplete="off"')}${fld('cit', 'Гражданство', 'text', 'list="cits" autocomplete="off"')}</div>
    <div class="cols">${fld('birth', 'Дата рождения', 'date', 'max="' + today() + '"')}${fld('pIss', 'Дата выдачи', 'date')}</div>
    <div class="cols">${fld('pExp', 'Действует до', 'date')}${fld('bplace', 'Место рождения', 'text', 'autocomplete="off"')}</div>
    <div class="grp">Для заявок</div>
    <div class="cols">${fld('mvz', 'Код подразделения (МВЗ)', 'text', `placeholder="${esc(S('mvz'))}" autocomplete="off"`)}${fld('stay', 'Срок пребывания на объекте', 'text', `placeholder="${esc(S('stay'))}" autocomplete="off"`)}</div>
    <div class="fld" style="margin-top:-6px"><div class="hint">Пустые поля возьмутся из настроек. ИТР, офис и руководство получают заявку в Word, рабочие — в общую Excel.</div></div>
    <div class="grp">Фото документов <span class="n" id="docN">${nd || ''}</span></div>
    <div id="docBox">${docsHtml()}</div>
    <div class="docadd">${!isPC() ? `<button type="button" class="btn" data-adddoc="cam">${ic('camera')} Сфотографировать</button>` : ''}<button type="button" class="btn" data-adddoc="file">${ic('clip')} ${isPC() ? 'Добавить фото или PDF' : 'Из галереи / файл'}</button></div>
    ${isPC() ? `<div class="dropzone">или перетащите файл в это окно, или вставьте картинку <span class="kbd">Ctrl V</span></div>` : ''}
    <div class="grp">Поездки <span class="n">${tl.length || ''}</span></div>
    ${tl.map(t => {
      const ls = legsOf(t);
      return `<div class="tripc" data-trip="${t.id}">${ls.map(l => `<div class="l">${ic(l.k === 'o' ? 'up' : 'down')}<b>${LEG[l.k]} ${fd(l.date)}</b>${flyIn(l)}${routeHtml(l)}</div><div class="l" style="padding-left:23px">${afterLeave(r, l.date) ? '<span class="pill gry">после ухода — не летит</span>' : tkChip(l) + statusPill(l)}${(l.t[l.k + 'Why'] || '') === 'Увольнение' ? '<span class="sbadge leave">увольнение</span>' : ''}</div>`).join('') || '<span class="muted">даты не указаны</span>'}</div>`;
    }).join('')}
    <button type="button" class="btn" data-addtrip style="width:100%">${ic('plus')} Добавить поездку</button>
    <div class="grp">Заметка</div>
    <label class="fld"><textarea data-f="note" placeholder="Любая информация" aria-label="Заметка">${esc(r.note || '')}</textarea></label>
    <datalist id="cities">${[...new Set(emps().flatMap(e => [e.city, e.air]).concat(trips().flatMap(t => [t.oFrom, t.oTo, t.bFrom, t.bTo])).filter(Boolean))].map(c => `<option value="${esc(c)}">`).join('')}</datalist>
    <datalist id="poss">${[...new Set(emps().map(e => e.pos).filter(Boolean))].map(c => `<option value="${esc(c)}">`).join('')}</datalist>
    <datalist id="cits">${[...new Set(['РФ', 'Беларусь', 'Узбекистан', 'Казахстан', 'Таджикистан', 'Кыргызстан', ...emps().map(e => e.cit)].filter(Boolean))].map(c => `<option value="${esc(c)}">`).join('')}</datalist>`;
  };
  const el = openSheet(1, exist ? 'Сотрудник' : 'Новый сотрудник', body(),
    `${exist ? `<button class="btn dan" data-del>${ic('trash')} Удалить</button>` : ''}<button class="btn pri" data-done>${ic('check')} Готово</button>`,
    () => { curEmp = null; commit(); save(); render(); });
  const links = () => {
    const d = String(r.phone || '').replace(/\D/g, '');
    const set = (n, href) => { const a = el.querySelector(`[data-l="${n}"]`); if (!a) return; a.classList.toggle('hide', !href); if (href) a.href = href; };
    set('tel', d ? 'tel:+' + d : ''); set('wa', d ? 'https://wa.me/' + d : ''); set('mail', /@/.test(r.email || '') ? 'mailto:' + r.email : '');
  };
  const refreshDocs = () => { const b = el.querySelector('#docBox'); if (!b) return; b.innerHTML = docsHtml(); bindDocs(); fillThumbs(b); const n = el.querySelector('#docN'); if (n) n.textContent = docsOf(r.id).length || ''; };
  const bindDocs = () => $$('[data-doc]', el).forEach(b => b.onclick = () => viewDoc(b.dataset.doc, refreshDocs));
  const bind = () => {
    $$('[data-f]', el).forEach(i => {
      i.oninput = () => {
        let v = i.value; if (i.dataset.f === 'lat') v = v.toUpperCase();
        if (i.type === 'date' && v && !validIso(v)) return;
        setF(r, i.dataset.f, v);
        if (['fio', 'pos'].includes(i.dataset.f)) el.querySelector('#eHead').innerHTML = headHtml();
        commit(); links();
      };
      i.onchange = () => {
        if (i.type !== 'date' && i.value !== i.value.trim()) { i.value = i.value.trim(); setF(r, i.dataset.f, i.dataset.f === 'lat' ? i.value.toUpperCase() : i.value); }
        commit();
      };
    });
    $$('[data-lvseg] button', el).forEach(b => b.onclick = () => {
      setF(r, 'lvl', b.dataset.v); commit();
      $$('[data-lvseg] button', el).forEach(x => x.classList.toggle('on', x === b));
      el.querySelector('#eHead').innerHTML = headHtml();
    });
    links(); bindDocs();
    $$('[data-leavebtn]', el).forEach(b => b.onclick = () => { if (!(r.fio || '').trim()) { toast('Сначала введите ФИО'); return; } commit(); leaveDlg(r.id, 2, redraw); });
    $$('[data-trip]', el).forEach(c => c.onclick = () => editTrip(c.dataset.trip, null, 2, redraw));
    el.querySelector('[data-addtrip]').onclick = () => {
      if (!(r.fio || '').trim()) { toast('Сначала введите ФИО'); el.querySelector('[data-f="fio"]').focus(); return; }
      commit(); editTrip(null, { emp: r.id }, 2, redraw);
    };
    $$('[data-adddoc]', el).forEach(b => b.onclick = async () => {
      if (!(r.fio || '').trim()) { toast('Сначала введите ФИО'); el.querySelector('[data-f="fio"]').focus(); return; }
      commit();
      const files = await pickFiles(b.dataset.adddoc === 'cam' ? 'image/*' : 'image/*,application/pdf,.pdf,.heic', b.dataset.adddoc === 'cam');
      if (files.length) { const n = await addDocs(r.id, files); if (n) { refreshDocs(); toast(`Добавлено: ${n}`); } }
    });
  };
  const redraw = () => { const b = el.querySelector('.sh-b'), st = b.scrollTop; b.innerHTML = body(); bind(); fillThumbs(b); b.scrollTop = st; };
  el._addDocs = async files => { if (!(r.fio || '').trim()) return toast('Сначала введите ФИО'); commit(); const n = await addDocs(r.id, files); if (n) { refreshDocs(); toast(`Добавлено: ${n}`); } };
  bind(); fillThumbs(el);
  el.querySelector('[data-done]').onclick = () => closeSheet(1);
  const d = el.querySelector('[data-del]');
  if (d) d.onclick = async () => {
    if (!await ask({ title: 'Удалить сотрудника?', text: `${esc(r.fio)}\nВместе с поездками (${tripsOf(r.id).length}) и фото (${docsOf(r.id).length}).`, ok: 'Удалить', danger: true })) return;
    delEmp(r); closeSheet(1); toast('Удалено');
  };
  if (!exist && isPC()) setTimeout(() => el.querySelector('[data-f="fio"]').focus(), 260);
}

/* ---------- документы ---------- */
function pickFiles(accept, camera) {
  return new Promise(res => {
    const i = $('#fileIn'); i.value = ''; i.accept = accept || ''; i.multiple = !camera;
    if (camera) i.setAttribute('capture', 'environment'); else i.removeAttribute('capture');
    i.onchange = () => res(Array.from(i.files || [])); i.click();
  });
}
const pickFile = accept => pickFiles(accept).then(f => f[0] || null);
async function prepImage(f) {
  try {
    const bmp = await createImageBitmap(f);
    const M = 2000, s = Math.min(1, M / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); if (bmp.close) bmp.close();
    const b = await new Promise(r => c.toBlob(r, 'image/jpeg', .85));
    return b && (b.size < f.size || !/jpe?g|png/.test(f.type)) ? b : f;
  } catch (e) { return f; }
}
async function addDocs(eid, files) {
  let n = 0;
  for (const f of files) {
    const isImg = /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(f.name);
    const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
    if (!isImg && !isPdf) { toast('Можно добавить фото или PDF'); continue; }
    if (f.size > 30e6) { toast('Файл больше 30 МБ'); continue; }
    const blob = isImg ? await prepImage(f) : f;
    const type = blob.type || (isPdf ? 'application/pdf' : 'image/jpeg');
    const id = uid();
    try { await IDB.put(id, { type, buf: await blob.arrayBuffer() }); }
    catch (e) { toast('Не хватает места для файла'); continue; }
    HAVE.add(id);
    const r = { id, _t: {} };
    const has = docsOf(eid).map(d => d.kind);
    setF(r, 'emp', eid); setF(r, 'kind', has.includes('pass') ? (has.includes('zagran') ? 'other' : 'zagran') : 'pass');
    setF(r, 'name', f.name || 'фото.jpg'); setF(r, 'type', type); setF(r, 'size', blob.size); setF(r, 'at', today());
    D.doc[id] = r; L.phOut[id] = 1; n++;
  }
  save(); return n;
}
function dropBlob(id) { HAVE.delete(id); delete L.phOut[id]; Object.keys(URLS).filter(k => k.startsWith(id + ':')).forEach(k => { URL.revokeObjectURL(URLS[k]); delete URLS[k]; }); IDB.del(id).catch(() => { }); }
async function fillThumbs(root) {
  for (const img of $$('img[data-thumb]', root || document)) { const u = await docURL(img.dataset.thumb); if (u) img.src = u; }
}
const docFileName = d => { const e = D.emp[d.emp]; const ext = /pdf/.test(d.type) ? 'pdf' : 'jpg'; return `${short(e && e.fio) || 'Сотрудник'} — ${(KIND[d.kind] || 'документ').toLowerCase()}.${ext}`.replace(/[\\/:*?"<>|]+/g, ' '); };
let VW = null;
async function viewDoc(id, after) {
  const d = D.doc[id]; if (!d) return;
  if (!HAVE.has(id)) return ask({ title: 'Фото на другом устройстве', text: 'Этот файл добавили на другом устройстве, и он сюда ещё не пришёл. Там нажмите «Обмен» → «Полная копия с фото» и пришлите файл сюда.', cancel: null });
  const e = D.emp[d.emp];
  const v = document.createElement('div'); v.id = 'viewer'; v.setAttribute('role', 'dialog');
  const isImg = /^image\//.test(d.type);
  v.innerHTML = `<div class="vh"><div class="vt"><b>${KIND[d.kind] || 'Документ'}</b><span>${esc(e ? e.fio : '')}</span></div>
    ${isImg ? `<button class="ibtn" data-z="-1" aria-label="Уменьшить">${ic('zout')}</button><button class="ibtn" data-z="1" aria-label="Увеличить">${ic('zin')}</button><button class="ibtn" data-rot aria-label="Повернуть">${ic('rotate')}</button>` : ''}
    <button class="ibtn" data-vx aria-label="Закрыть">${ic('x')}</button></div>
    <div class="vb">${isImg ? '<img alt="Документ">' : `<div class="pdf">${ic('file')}<p>${esc(d.name || 'PDF')}<br><span style="opacity:.7">${fsize(d.size || 0)}</span></p><button class="btn" data-open>Открыть PDF</button></div>`}</div>
    <div class="vf"><select data-kind aria-label="Тип документа">${Object.entries(KIND).map(([k, n]) => `<option value="${k}" ${d.kind === k ? 'selected' : ''}>${n}</option>`).join('')}</select><span style="flex:1"></span>
    <button class="btn sm" data-share>${ic(isPC() ? 'download' : 'share')} ${isPC() ? 'Скачать' : 'Отправить'}</button><button class="btn sm" data-vdel style="color:#ff8a8a">${ic('trash')} Удалить</button></div>`;
  document.body.appendChild(v); document.body.classList.add('lock');
  try { history.pushState({ vy: 2 }, ''); } catch (er) { }
  VW = { after };
  const vb = v.querySelector('.vb'), img = v.querySelector('img');
  let z = 1;
  const apply = () => {
    if (!img || !img.naturalWidth) return;
    const fit = Math.min(vb.clientWidth / img.naturalWidth, vb.clientHeight / img.naturalHeight, 1);
    if (z <= 1) { img.style.maxWidth = '100%'; img.style.maxHeight = '100%'; img.style.width = ''; }
    else { img.style.maxWidth = 'none'; img.style.maxHeight = 'none'; img.style.width = Math.round(img.naturalWidth * fit * z) + 'px'; }
  };
  const zoomTo = (nz, cx, cy) => {
    nz = Math.max(1, Math.min(6, nz)); if (Math.abs(nz - z) < .001) return;
    const r = vb.getBoundingClientRect(); cx = cx ?? r.width / 2; cy = cy ?? r.height / 2;
    const fx = (vb.scrollLeft + cx) / (vb.scrollWidth || 1), fy = (vb.scrollTop + cy) / (vb.scrollHeight || 1);
    z = nz; apply();
    vb.scrollLeft = fx * vb.scrollWidth - cx; vb.scrollTop = fy * vb.scrollHeight - cy;
  };
  const load = async () => { if (img) img.src = await docURL(id) || ''; };
  if (img) {
    img.onload = () => { z = 1; apply(); };
    load();
    v.querySelectorAll('[data-z]').forEach(b => b.onclick = () => zoomTo(z * (+b.dataset.z > 0 ? 1.6 : 1 / 1.6)));
    v.querySelector('[data-rot]').onclick = async () => { setF(d, 'rot', ((+d.rot || 0) + 90) % 360); save(); await load(); if (VW && VW.after) VW.dirty = 1; };
    img.ondblclick = ev => { const r = vb.getBoundingClientRect(); zoomTo(z > 1 ? 1 : 2.5, ev.clientX - r.left, ev.clientY - r.top); };
    vb.addEventListener('wheel', ev => { if (ev.ctrlKey || ev.metaKey || isPC()) { ev.preventDefault(); const r = vb.getBoundingClientRect(); zoomTo(z * (ev.deltaY < 0 ? 1.2 : 1 / 1.2), ev.clientX - r.left, ev.clientY - r.top); } }, { passive: false });
    /* щипок двумя пальцами и двойной тап */
    const pts = new Map(); let d0 = 0, z0 = 1, lastTap = 0;
    vb.addEventListener('pointerdown', ev => { pts.set(ev.pointerId, ev); if (pts.size === 2) { const [a, b] = [...pts.values()]; d0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); z0 = z; } });
    vb.addEventListener('pointermove', ev => { if (!pts.has(ev.pointerId)) return; pts.set(ev.pointerId, ev); if (pts.size === 2 && d0) { const [a, b] = [...pts.values()]; const r = vb.getBoundingClientRect(); zoomTo(z0 * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / d0, (a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top); } });
    const up = ev => { pts.delete(ev.pointerId); if (pts.size < 2) d0 = 0; };
    vb.addEventListener('pointerup', ev => { up(ev); if (ev.pointerType === 'touch') { const t = Date.now(); if (t - lastTap < 300) { const r = vb.getBoundingClientRect(); zoomTo(z > 1 ? 1 : 2.5, ev.clientX - r.left, ev.clientY - r.top); lastTap = 0; } else lastTap = t; } });
    vb.addEventListener('pointercancel', up);
    window.addEventListener('resize', apply);
    VW.cleanup = () => window.removeEventListener('resize', apply);
  } else v.querySelector('[data-open]').onclick = async () => { const u = await docURL(id); if (u) window.open(u, '_blank'); };
  v.querySelector('[data-vx]').onclick = () => closeViewer();
  v.querySelector('[data-kind]').onchange = ev => { setF(d, 'kind', ev.target.value); save(); v.querySelector('.vt b').textContent = KIND[d.kind]; };
  v.querySelector('[data-share]').onclick = async () => { const u = await docURL(id); if (!u) return; const blob = await (await fetch(u)).blob(); await shareOrDownload(blob, docFileName(d), blob.type, !isPC()); };
  v.querySelector('[data-vdel]').onclick = async () => { if (!await ask({ title: 'Удалить этот файл?', ok: 'Удалить', danger: true })) return; delRec(d); dropBlob(id); save(); closeViewer(); toast('Файл удалён'); };
}
function closeViewer(fromPop) {
  const v = $('#viewer'); if (!v) return;
  v.remove(); if (!STACK.length) document.body.classList.remove('lock');
  if (VW && VW.cleanup) VW.cleanup();
  const a = VW && VW.after; VW = null;
  if (!fromPop) { skipPop++; history.back(); }
  if (a) a();
}
async function sendPhotos(eids) {
  const all = eids.flatMap(docsOf), ds = all.filter(d => HAVE.has(d.id)), miss = all.length - ds.length;
  if (!ds.length) return toast(miss ? 'Фото есть только на другом устройстве' : 'У выбранных нет фото документов');
  const files = [], seen = {};
  for (const d of ds) {
    const u = await docURL(d.id); if (!u) continue;
    const b = await (await fetch(u)).blob(); let n = docFileName(d);
    seen[n] = (seen[n] || 0) + 1; if (seen[n] > 1) n = n.replace(/(\.\w+)$/, ` ${seen[n]}$1`);
    files.push(new File([b], n, { type: b.type }));
  }
  if (!isPC() && navigator.canShare && navigator.canShare({ files })) {
    try { await navigator.share({ files, title: 'Документы' }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  if (files.length === 1) return download(files[0], files[0].name);
  const z = new JSZip(); files.forEach(f => z.file(f.name, f));
  download(await z.generateAsync({ type: 'blob' }), fname(`Документы ${stamp()}.zip`));
  toast(`Скачано файлов: ${files.length}${miss ? `. Ещё ${miss} — на другом устройстве` : ''}`);
}

/* ---------- поездка ---------- */
function editTrip(id, preset, level = 1, after) {
  const exist = id ? D.trip[id] : null;
  const r = exist || { id: uid(), _t: {} };
  if (!exist && preset) for (const k in preset) setF(r, k, preset[k]);
  const commit = () => { if (!D.trip[r.id] && r.emp && (validIso(r.oD) || validIso(r.bD))) D.trip[r.id] = r; save(false); };
  const e = () => D.emp[r.emp] || null;
  const curLeg = k => legsOf(r).find(x => x.k === k);
  const dlHtml = k => { if (!validIso(r[k + 'D']) || !e()) return ''; const l = curLeg(k); return l ? `${tkChip(l)}${statusPill(l)}` : ''; };
  const stripe = k => { const l = e() && validIso(r[k + 'D']) && curLeg(k); return l ? `var(--${TONE[urg(l)] === 'gry' ? 'line' : TONE[urg(l)]})` : 'transparent'; };
  const legBlock = k => {
    const st = r[k + 'S'] || '', [dF, dT] = e() ? route(Object.assign({}, r, { [k + 'From']: '', [k + 'To']: '' }), k) : ['', ''];
    return `<div class="leg" data-legbox="${k}" style="--stripe:${stripe(k)}"><h4>${ic(k === 'o' ? 'up' : 'down')}${k === 'o' ? 'Вылет на объект' : 'Прилёт / обратный рейс'}</h4>
      <div class="cols"><label class="fld"><span>Дата ${k === 'o' ? 'вылета' : 'прилёта'}</span><input type="date" data-f="${k}D" value="${esc(r[k + 'D'] || '')}"></label>
      <label class="fld"><span>Рейс / бронь</span><input data-f="${k}Tk" value="${esc(r[k + 'Tk'] || '')}" placeholder="SU 2133" autocomplete="off"></label></div>
      <div class="cols"><label class="fld"><span>Откуда</span><input data-f="${k}From" value="${esc(r[k + 'From'] || '')}" placeholder="${esc(dF || 'город')}" list="cities2" autocomplete="off"></label>
      <label class="fld"><span>Куда</span><input data-f="${k}To" value="${esc(r[k + 'To'] || '')}" placeholder="${esc(dT || 'город')}" list="cities2" autocomplete="off"></label></div>
      <div class="cols"><label class="fld"><span>Причина поездки</span><select data-f="${k}Why">${REASONS.map(x => `<option ${((r[k + 'Why'] || REASONS[0]) === x) ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      <label class="fld"><span>Транспорт</span><select data-f="${k}Tr">${['АВИА', 'ЖД'].map(x => `<option ${((r[k + 'Tr'] || 'АВИА') === x) ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div>
      <div class="dl" data-dl="${k}">${dlHtml(k)}</div>
      <div class="seg" data-seg="${k}S"><button type="button" data-v="" class="r ${!st ? 'on' : ''}">Нет заявки</button><button type="button" data-v="sent" class="b ${st === 'sent' ? 'on' : ''}">Заявка подана</button><button type="button" data-v="tk" class="g ${st === 'tk' ? 'on' : ''}">${ic('ticket')}Билет есть</button></div>
      ${st ? `<label class="fld" style="margin:10px 0 0"><span>Дата подачи заявки</span><input type="date" data-f="${k}Sent" value="${esc(r[k + 'Sent'] || '')}"></label>` : ''}</div>`;
  };
  const body = () => {
    const em = e();
    return `${exist || (preset && preset.emp) ? `<div class="card" style="padding:10px 12px;margin-bottom:12px;display:flex;gap:11px;align-items:center">${em ? av(em).replace('data-av', 'data-avx') : ''}<div style="min-width:0"><div class="nm">${esc(em ? em.fio : '')}</div><div class="small muted">${em ? lvTag(em) : ''}${em && (em.air || em.city) ? ' · вылетает из ' + esc(em.air || em.city) : ''}</div></div></div>`
      : `<label class="fld"><span>Сотрудник *</span><select data-f="emp"><option value="">— выберите —</option>${['b', 'm', 'w'].map(lk => { const es = emps().filter(x => lvOf(x) === lk && (!gone(x) || x.id === r.emp)); return es.length ? `<optgroup label="${LV[lk].n}">${es.map(x => `<option value="${x.id}" ${x.id === r.emp ? 'selected' : ''}>${esc(x.fio)}${x.city ? ' · ' + esc(x.city) : ''}</option>`).join('')}</optgroup>` : ''; }).join('')}</select></label>`}
      ${legBlock('o')}${legBlock('b')}
      <p class="small muted" style="margin:-4px 2px 12px">Пустые «Откуда / Куда» заполняются сами: туда — из города вылета сотрудника на объект, обратно — с объекта в его город.</p>
      <label class="fld"><span>Заметка</span><textarea data-f="note" placeholder="Например: багаж, пересадка">${esc(r.note || '')}</textarea></label>
      <datalist id="cities2">${[...new Set([...emps().flatMap(x => [x.city, x.air]), ...trips().flatMap(t => [t.oFrom, t.oTo, t.bFrom, t.bTo, t.to, t.from]), S('dest')].filter(Boolean))].map(c => `<option value="${esc(c)}">`).join('')}</datalist>`;
  };
  const el = openSheet(level, exist ? 'Поездка' : 'Новая поездка', body(), `${exist ? `<button class="btn dan" data-del>${ic('trash')} Удалить</button>` : ''}<button class="btn pri" data-done>${ic('check')} Готово</button>`,
    () => { commit(); save(); if (after) after(); else render(); });
  const redraw = () => { const b = el.querySelector('.sh-b'), st = b.scrollTop; b.innerHTML = body(); bind(); b.scrollTop = st; };
  const upd = () => { $$('[data-dl]', el).forEach(d => d.innerHTML = dlHtml(d.dataset.dl)); $$('[data-legbox]', el).forEach(b => b.style.setProperty('--stripe', stripe(b.dataset.legbox))); };
  const bind = () => {
    $$('[data-f]', el).forEach(i => {
      i.oninput = () => { if (i.type === 'date' && i.value && !validIso(i.value)) return; setF(r, i.dataset.f, i.value); commit(); if (i.type === 'date') upd(); };
      i.onchange = () => { if (i.type === 'date' && i.value && !validIso(i.value)) return; setF(r, i.dataset.f, i.tagName === 'SELECT' || i.type === 'date' ? i.value : i.value.trim()); commit(); if (i.tagName === 'SELECT') redraw(); else upd(); };
    });
    $$('[data-seg]', el).forEach(s => $$('button', s).forEach(b => b.onclick = () => {
      const k = s.dataset.seg; setF(r, k, b.dataset.v);
      const sk = k[0] + 'Sent'; if (b.dataset.v && !r[sk]) setF(r, sk, today());
      commit(); redraw();
    }));
  };
  bind();
  el.querySelector('[data-done]').onclick = () => {
    if (!r.emp) return toast('Выберите сотрудника');
    if (!validIso(r.oD) && !validIso(r.bD)) return toast('Укажите дату вылета или прилёта');
    if (validIso(r.oD) && validIso(r.bD) && r.bD < r.oD) return ask({ title: 'Прилёт раньше вылета', text: `Вылет ${fd(r.oD)}, прилёт ${fd(r.bD)}. Проверьте даты.`, ok: 'Всё верно', cancel: 'Исправить' }).then(v => { if (v) closeSheet(level); });
    closeSheet(level);
  };
  const d = el.querySelector('[data-del]');
  if (d) d.onclick = async () => { if (!await ask({ title: 'Удалить поездку?', ok: 'Удалить', danger: true })) return; delRec(r); closeSheet(level); toast('Поездка удалена'); };
}
function groupTrip(ids) {
  const g = { oFrom: '', oTo: '', oD: '', bD: '', bTo: '' };
  const names = ids.map(i => D.emp[i]).filter(Boolean);
  const el = openSheet(1, 'Поездка для ' + names.length + ' ' + pl(names.length, 'сотрудника', 'сотрудников', 'сотрудников'),
    `<p class="muted small" style="margin-top:0">${names.map(e => esc(short(e.fio))).join(', ')}</p>
    <div class="leg"><h4>${ic('up')}Вылет на объект</h4><div class="cols"><label class="fld"><span>Дата вылета</span><input type="date" data-g="oD"></label><label class="fld"><span>Куда</span><input data-g="oTo" placeholder="${esc(S('dest') || 'город объекта')}"></label></div>
    <label class="fld" style="margin:0"><span>Откуда</span><input data-g="oFrom" placeholder="у каждого свой город вылета"></label></div>
    <div class="leg"><h4>${ic('down')}Прилёт / обратный рейс</h4><div class="cols"><label class="fld"><span>Дата прилёта</span><input type="date" data-g="bD"></label><label class="fld"><span>Куда</span><input data-g="bTo" placeholder="у каждого свой город"></label></div></div>
    <p class="small muted">Каждому создастся своя поездка, сроки заявок посчитаются сами.</p>`,
    `<button class="btn" data-x>Отмена</button><button class="btn pri" data-ok>${ic('check')} Создать</button>`);
  $$('[data-g]', el).forEach(i => i.oninput = () => g[i.dataset.g] = i.value.trim());
  el.querySelector('[data-x]').onclick = () => closeSheet(1);
  el.querySelector('[data-ok]').onclick = () => {
    if (!validIso(g.oD) && !validIso(g.bD)) return toast('Укажите хотя бы одну дату');
    names.forEach(e => { const r = { id: uid(), _t: {} }; setF(r, 'emp', e.id); for (const k in g) if (g[k]) setF(r, k, g[k]); D.trip[r.id] = r; });
    SEL.clear(); save(); closeSheet(1); render(); toast('Поездки созданы: ' + names.length);
  };
}

/* ---------- уход сотрудника: не продлевают контракт / увольнение ---------- */
function leaveDlg(eid, level = 1, after) {
  const e = D.emp[eid]; if (!e) return;
  const st = { type: e.stat || 'end', date: e.statD || '', note: e.statNote || '', home: !hasHome(e), hD: '', hFrom: '', hTo: '', del: true };
  const curObj = () => { const t = tripsOf(eid).filter(t => validIso(t.oD) && (!st.date || t.oD <= st.date)).pop(); return (t && route(t, 'o')[1]) || commonDest(); };
  st.obj = curObj;
  const body = () => {
    const lim = validIso(st.date) ? addD(st.date, 7) : null, isF = st.type === 'fired';
    const aft = lim ? trips().filter(t => t.emp === eid).flatMap(legsOf).filter(l => l.date > lim) : [];
    return `<div class="ehead">${av(e, 1).replace('data-av', 'data-avx')}<div style="min-width:0"><div class="nm">${esc(e.fio)}</div><div class="small muted">${lvTag(e)}${e.pos ? ' · ' + esc(e.pos) : ''}</div></div></div>
    <div class="grp">Что случилось</div>
    <div class="seg" data-lt><button type="button" data-v="end" class="${st.type === 'end' ? 'on' : ''}">Не продлевают контракт</button><button type="button" data-v="fired" class="r ${st.type === 'fired' ? 'on' : ''}">Увольнение</button>${e.stat ? `<button type="button" data-v="" class="g ${st.type === '' ? 'on' : ''}">Снова работает</button>` : ''}</div>
    ${st.type ? `<div class="cols" style="margin-top:12px"><label class="fld"><span>${isF ? 'Дата увольнения' : 'Контракт заканчивается'} *</span><input type="date" data-lf="date" value="${esc(st.date)}"></label><div></div></div>
    <label class="fld"><span>Причина, комментарий</span><input data-lf="note" value="${esc(st.note)}" placeholder="${isF ? 'например, по собственному желанию' : 'например, решение руководства'}" autocomplete="off"></label>
    <div class="grp">Вылет домой</div>
    <label class="chk"><input type="checkbox" data-lf="home" ${st.home ? 'checked' : ''}><span>Оформить вылет домой с причиной «Увольнение»${hasHome(e) ? '. Вылет домой уже есть — изменю его' : ''}</span></label>
    ${st.home ? `<div class="cols"><label class="fld"><span>Дата вылета домой</span><input type="date" data-lf="hD" value="${esc(st.hD || st.date)}"></label><div></div></div>
    <div class="cols"><label class="fld"><span>Откуда</span><input data-lf="hFrom" value="${esc(st.hFrom)}" placeholder="${esc(curObj() || 'объект')}" autocomplete="off"></label><label class="fld"><span>Куда</span><input data-lf="hTo" value="${esc(st.hTo)}" placeholder="${esc(e.air || e.city || 'домой')}" autocomplete="off"></label></div>` : ''}
    ${aft.length ? `<div class="grp">Рейсы после ухода</div><label class="chk"><input type="checkbox" data-lf="del" ${st.del ? 'checked' : ''}><span>Удалить: ${aft.map(l => `${LEG[l.k].toLowerCase()} ${fd(l.date)}`).join(', ')}</span></label>` : ''}
    <p class="small muted">Человек останется в программе со всеми данными. После даты ухода он уйдёт из списков в фильтр «Уволены», вылет домой попадёт в заявки как обычно.</p>`
    : `<p class="muted" style="margin-top:12px">Сотрудник снова будет в списках как работающий. Поездки не изменятся.</p>`}`;
  };
  const el = openSheet(level, 'Уход сотрудника', body(), `<button class="btn" data-x>Отмена</button><button class="btn pri" data-ok>${ic('check')} Сохранить</button>`, () => { if (after) after(); else render(); });
  const redraw = () => { const b = el.querySelector('.sh-b'), sc = b.scrollTop; b.innerHTML = body(); bind(); b.scrollTop = sc; };
  const bind = () => {
    $$('[data-lt] button', el).forEach(b => b.onclick = () => { st.type = b.dataset.v; redraw(); });
    $$('[data-lf]', el).forEach(i => {
      const k = i.dataset.lf;
      if (i.type === 'checkbox') i.onchange = () => { st[k] = i.checked; redraw(); };
      else { i.oninput = () => { st[k] = i.value.trim(); }; i.onchange = () => { st[k] = i.value.trim(); if (k === 'date') redraw(); }; }
    });
  };
  bind();
  el.querySelector('[data-x]').onclick = () => closeSheet(level);
  el.querySelector('[data-ok]').onclick = () => {
    if (st.type && !validIso(st.date)) return toast('Укажите дату');
    const r = applyLeave(e, st); closeSheet(level);
    toast(!st.type ? 'Снова работает' : `Сохранено${r.home ? ', вылет домой ' + fd(r.home) : ''}${r.del ? ', удалено рейсов: ' + r.del : ''}`, 4000);
  };
}
function commonDest() {
  if (S('dest')) return S('dest');
  const c = {}; trips().forEach(t => { const d = route(t, 'o')[1]; if (d) c[d] = (c[d] || 0) + 1; });
  return (Object.entries(c).sort((a, b) => b[1] - a[1])[0] || [''])[0];
}
function applyLeave(e, st) {
  const res = { home: '', del: 0 };
  if (!st.type) { ['stat', 'statD', 'statNote'].forEach(k => setF(e, k, '')); save(); return res; }
  setF(e, 'stat', st.type); setF(e, 'statD', st.date); setF(e, 'statNote', st.note);
  const lim = addD(st.date, 7);
  if (st.del) trips().filter(t => t.emp === e.id).forEach(t => {
    const hasO = validIso(t.oD), hasB = validIso(t.bD), o = hasO && t.oD > lim, b = hasB && t.bD > lim;
    if ((!hasO || o) && (!hasB || b)) { delRec(t); res.del += (hasO ? 1 : 0) + (hasB ? 1 : 0); }
    else if (b) { ['bD', 'bS', 'bSent', 'bTk'].forEach(k => setF(t, k, '')); res.del++; }
    else if (o) { ['oD', 'oS', 'oSent', 'oTk'].forEach(k => setF(t, k, '')); res.del++; }
  });
  if (st.home) {
    const hD = validIso(st.hD) ? st.hD : st.date, mine = trips().filter(t => t.emp === e.id);
    let t = mine.find(x => x.bWhy === 'Увольнение') || mine.filter(x => validIso(x.oD) && x.oD <= hD && (!validIso(x.bD) || x.bD >= addD(hD, -21))).sort((a, b) => b.oD.localeCompare(a.oD))[0];
    if (!t) { t = { id: uid(), _t: {} }; setF(t, 'emp', e.id); D.trip[t.id] = t; }
    if (t.bD !== hD) { setF(t, 'bD', hD); ['bS', 'bSent', 'bTk'].forEach(k => setF(t, k, '')); }
    setF(t, 'bWhy', 'Увольнение');
    const from = st.hFrom || (st.obj ? st.obj() : '') || commonDest(), to = st.hTo || e.air || e.city || '';
    if (from && (st.hFrom || !t.bFrom)) setF(t, 'bFrom', from); if (to && (st.hTo || !t.bTo)) setF(t, 'bTo', to);
    res.home = hD;
  }
  save(); return res;
}
async function mergeDups() {
  let n = 0;
  for (const a of dups()) {
    const list = a.filter(alive); if (list.length < 2) continue;
    list.sort((x, y) => (x.demo ? 1 : 0) - (y.demo ? 1 : 0) || Object.keys(y._t).length - Object.keys(x._t).length);
    const main = list[0];
    for (const o of list.slice(1)) {
      if (!alive(o)) continue;
      for (const k in o._t) if (o[k] && (!main[k] || o._t[k] > (main._t[k] || 0))) setF(main, k, o[k]);
      Object.values(D.trip).filter(t => t.emp === o.id && alive(t)).forEach(t => setF(t, 'emp', main.id));
      Object.values(D.doc).filter(d => d.emp === o.id && alive(d)).forEach(d => setF(d, 'emp', main.id));
      delRec(o); n++;
    }
  }
  save(); render(); toast(n ? `Объединено: ${n}` : 'Дублей нет');
}

/* ---------- файлы обмена ---------- */
function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
async function shareOrDownload(blob, name, mime, preferShare) {
  if (preferShare && navigator.canShare) {
    for (const [n, t] of [[name, mime], [name.replace(/\.[^.]+$/, '') + '.txt', 'text/plain']]) {
      try { const f = new File([blob], n, { type: t }); if (navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: n }); return 'shared'; } }
      catch (e) { if (e.name === 'AbortError') return 'abort'; }
    }
  }
  download(blob, name); return 'download';
}
const stamp = () => { const d = new Date(); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + '-' + pad(d.getMinutes()); };
const fname = s => s.replace(/[\\/:*?"<>|]+/g, ' ').trim();
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const ub64 = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
async function keyFrom(pwd, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pwd), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encrypt(text, pwd) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFrom(pwd, salt), new TextEncoder().encode(text));
  return { app: 'vylety', v: 2, enc: 'AES-GCM', salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(ct)) };
}
async function decrypt(o, pwd) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(o.iv) }, await keyFrom(pwd, ub64(o.salt)), ub64(o.data));
  return new TextDecoder().decode(pt);
}
let busy = false;
async function exportFile(mode) {
  if (busy) return; if (!Object.keys(D.emp).length) return toast('Пока нечего отправлять');
  busy = true;
  try {
    const full = mode === 'full';
    const ids = Object.values(D.doc).filter(d => alive(d) && HAVE.has(d.id) && (full || L.phOut[d.id])).map(d => d.id);
    const blobs = {};
    for (const id of ids) { try { const v = await IDB.get(id); if (v) blobs[id] = { type: v.type, b: b64(new Uint8Array(v.buf)) }; } catch (e) { } }
    const payload = { app: 'vylety', v: 2, from: L.name, dev: L.dev, at: Date.now(), full, emp: Object.values(D.emp), trip: Object.values(D.trip), doc: Object.values(D.doc), set: D.set, blobs };
    let body = JSON.stringify(payload);
    if (L.pwd) { if (!crypto.subtle) { toast('Шифрование работает только по https'); return; } body = JSON.stringify(await encrypt(body, L.pwd)); }
    const name = fname(`Вылеты ${stamp()} ${L.name}${full ? ' полная' : ''}.vyl`);
    const blob = new Blob([body], { type: 'application/octet-stream' });
    const res = await shareOrDownload(blob, name, 'application/octet-stream', mode !== 'download' && !isPC());
    if (res === 'abort') return;
    L.sent = Date.now(); L.dirty = {}; ids.forEach(id => delete L.phOut[id]); if (full) L.phOut = {};
    save(); if (TAB === 'sync') render();
    toast(`${res === 'download' ? 'Файл сохранён в «Загрузки»' : 'Файл отправлен'} (${fsize(blob.size)}${ids.length ? ', фото: ' + ids.length : ''}). На другом устройстве нажмите «Принять файл».`, 5000);
  } finally { busy = false; }
}
async function importAny(file) {
  if (!file) return;
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isZip = head[0] === 0x50 && head[1] === 0x4b;
  if (head[0] === 0xD0 && head[1] === 0xCF) return startImport([file]);
  if (isZip || /\.(xlsx|xlsm|csv|docx)$/i.test(file.name)) return startImport([file]);
  if (/^image\/|application\/pdf/.test(file.type) || /\.(jpe?g|png|pdf|heic|webp)$/i.test(file.name)) {
    if (curEmp && $('#sheet1')._addDocs) return $('#sheet1')._addDocs([file]);
    return ask({ title: 'Это фото или PDF', text: 'Чтобы прикрепить документ, откройте карточку сотрудника и перетащите файл туда.', cancel: null });
  }
  let obj;
  try { obj = JSON.parse(await file.text()); } catch (e) { return ask({ title: 'Не получилось открыть', text: 'Это не файл обмена «Вылеты» и не Excel.', cancel: null }); }
  if (!obj || obj.app !== 'vylety') return ask({ title: 'Не тот файл', text: 'Этот файл создан не приложением «Вылеты».', cancel: null });
  if (obj.enc) {
    let pwd = L.pwd, first = true;
    for (; ;) {
      if (!pwd || !first) {
        pwd = await ask({ title: 'Файл защищён паролем', text: first ? 'Введите пароль, который стоит на другом устройстве.' : 'Пароль не подошёл. Попробуйте ещё раз.', input: 'password', ok: 'Открыть' });
        if (pwd == null) return;
      }
      first = false;
      try { obj = JSON.parse(await decrypt(obj, pwd)); break; } catch (e) { pwd = null; }
    }
    if (pwd && pwd !== L.pwd) { L.pwd = pwd; save(); toast('Пароль сохранён и на этом устройстве'); }
  }
  if (obj.dev === L.dev && !(await ask({ title: 'Это файл с этого же устройства', text: 'Его отправили отсюда. Принять всё равно? Ничего не испортится, просто изменений не будет.', ok: 'Принять' }))) return;
  const r = merge(obj);
  let ph = 0;
  for (const id in (obj.blobs || {})) {
    if (HAVE.has(id)) continue;
    try { const x = obj.blobs[id]; await IDB.put(id, { type: x.type, buf: ub64(x.b).buffer }); HAVE.add(id); ph++; } catch (e) { }
  }
  Object.values(D.doc).filter(d => !alive(d) && HAVE.has(d.id)).forEach(d => dropBlob(d.id));
  L.recv = Date.now(); L.recvFrom = obj.from || ''; save(); shell(); render();
  const parts = [];
  if (r.ea) parts.push(`новых сотрудников: ${r.ea}`);
  if (r.eu) parts.push(`обновлено сотрудников: ${r.eu}`);
  if (r.ta) parts.push(`новых поездок: ${r.ta}`);
  if (r.tu) parts.push(`обновлено поездок: ${r.tu}`);
  if (ph) parts.push(`фото документов: ${ph}`);
  if (r.del) parts.push(`удалено: ${r.del}`);
  if (r.set) parts.push('обновлены настройки');
  const mine = dirtyN() + pendPh(), miss = missPh();
  const v = await ask({
    title: parts.length ? 'Данные приняты' : 'Новых изменений нет',
    text: `Файл с устройства «${esc(obj.from || '?')}» от ${ftime(obj.at)}.\n` + (parts.length ? parts.join('\n') : 'Всё уже совпадает.') +
      (miss ? `\n\nНе хватает фото: ${miss}. На том устройстве нажмите «Полная копия с фото».` : '') +
      (mine ? `\n\nЗдесь есть свои изменения (${mine}), которых там нет. Отправьте файл обратно, чтобы данные совпали.` : ''),
    ok: mine ? 'Отправить обратно' : 'Хорошо', cancel: mine ? 'Позже' : null
  });
  if (v && mine) exportFile();
}
function merge(obj) {
  const r = { ea: 0, eu: 0, ta: 0, tu: 0, del: 0, set: 0 };
  const one = (col, rec, a, u) => {
    if (!rec || !rec.id || !rec._t) return;
    const cur = D[col][rec.id];
    if (!cur) { D[col][rec.id] = JSON.parse(JSON.stringify(rec)); if (alive(rec) && !rec.demo && a) r[a]++; return; }
    const wasAlive = alive(cur); let ch = false;
    for (const k in rec._t) { if (!(k in cur._t) || rec._t[k] > cur._t[k]) { cur[k] = rec[k]; cur._t[k] = rec._t[k]; ch = true; } }
    if ((rec._del || 0) > (cur._del || 0)) { cur._del = rec._del; ch = true; }
    if (wasAlive && !alive(cur)) { if (!cur.demo && a) r.del++; } else if (ch && alive(cur) && u) r[u]++;
  };
  (obj.emp || []).forEach(x => one('emp', x, 'ea', 'eu'));
  (obj.trip || []).forEach(x => one('trip', x, 'ta', 'tu'));
  (obj.doc || []).forEach(x => one('doc', x, null, null));
  if (obj.set && obj.set._t) for (const k in obj.set._t) if (!(k in D.set._t) || obj.set._t[k] > D.set._t[k]) { D.set[k] = obj.set[k]; D.set._t[k] = obj.set._t[k]; r.set = 1; }
  return r;
}

/* ---------- Excel ---------- */
const EMP_COLS = [['fio', 'ФИО', 32], ['lat', 'ФИО латиницей', 26], ['lvl', 'Уровень', 16], ['pos', 'Должность', 20], ['tab', 'Табельный номер', 14], ['city', 'Базовый город', 18], ['air', 'Город вылета', 16], ['phone', 'Телефон', 18], ['wphone', 'Рабочий телефон', 18], ['email', 'Почта', 26], ['cit', 'Гражданство', 14], ['birth', 'Дата рождения', 13, 1], ['bplace', 'Место рождения', 20], ['pass', 'Паспорт №', 15], ['pIss', 'Дата выдачи', 13, 1], ['pExp', 'Действует до', 13, 1], ['mvz', 'МВЗ', 10], ['stay', 'Срок пребывания', 12], ['stat', 'Статус', 20], ['statD', 'Дата ухода', 13, 1]];
const cell = (v, isDate) => isDate ? (validIso(v) ? { d: v } : '') : (v || '');
const ST_RU = { '': 'нет заявки', sent: 'заявка подана', tk: 'билет есть' };
const REASONS = ['Межсменка', 'Перевизовка', 'Увольнение', 'Учебный отпуск', 'Экстренно', 'Ежегодный отпуск'];
const empVal = (e, k) => k === 'lvl' ? LV[lvOf(e)].one : k === 'stat' ? (STATN[e.stat] || 'Работает') : e[k];
async function exportXlsx(onlyIds) {
  const es = emps().filter(e => !onlyIds || onlyIds.includes(e.id));
  const ids = new Set(es.map(e => e.id)), lead = +S('lead');
  const s1 = [[...EMP_COLS.map(c => c[1]), 'Фото документов', 'Ближайший рейс', 'Заметка']];
  es.forEach(e => { const nl = nextLeg(e.id); s1.push([...EMP_COLS.map(c => cell(empVal(e, c[0]), c[3])), docsOf(e.id).length || '', nl ? `${LEG[nl.k]} ${fd(nl.date)}` : '', e.note || '']); });
  const s2 = [['ФИО', 'Уровень', 'Дата вылета', 'Откуда (вылет)', 'Куда (вылет)', 'Срок заявки (вылет)', 'Статус (вылет)', 'Рейс (вылет)', 'Дата прилёта', 'Откуда (прилёт)', 'Куда (прилёт)', 'Срок заявки (прилёт)', 'Статус (прилёт)', 'Рейс (прилёт)', 'Заметка']];
  trips().filter(t => ids.has(t.emp)).sort((a, b) => (a.oD || a.bD || '').localeCompare(b.oD || b.bD || '')).forEach(t => {
    const e = D.emp[t.emp], o = route(t, 'o'), b = route(t, 'b'), hasO = validIso(t.oD), hasB = validIso(t.bD);
    s2.push([e.fio, LV[lvOf(e)].one, cell(t.oD, 1), hasO ? o[0] : '', hasO ? o[1] : '', hasO ? { d: addD(t.oD, -lead) } : '', hasO ? ST_RU[t.oS || ''] : '', t.oTk || '', cell(t.bD, 1), hasB ? b[0] : '', hasB ? b[1] : '', hasB ? { d: addD(t.bD, -lead) } : '', hasB ? ST_RU[t.bS || ''] : '', t.bTk || '', t.note || '']);
  });
  const s3 = [['Срок заявки', 'Дней до срока', 'ФИО', 'Уровень', 'Рейс', 'Дата рейса', 'Откуда', 'Куда', 'Заявка', 'Билет']];
  allLegs().filter(l => ids.has(l.e.id) && l.fleft >= 0).sort((a, b) => a.dl.localeCompare(b.dl)).forEach(l => s3.push([{ d: l.dl }, l.st ? '' : l.dleft, l.e.fio, LV[lvOf(l.e)].one, LEG[l.k], { d: l.date }, l.from, l.to, l.st ? 'подана' : 'нет', l.st === 'tk' ? 'есть' + (l.tk ? ' · ' + l.tk : '') : 'нет']));
  const blob = await XL.write([
    { name: 'Сотрудники', rows: s1, head: true, widths: [...EMP_COLS.map(c => c[2]), 10, 20, 30] },
    { name: 'Поездки', rows: s2, head: true, widths: [32, 15, 13, 16, 16, 14, 15, 13, 13, 16, 16, 14, 15, 13, 30] },
    { name: 'Сроки заявок', rows: s3, head: true, widths: [13, 10, 32, 15, 10, 13, 16, 16, 10, 16] }]);
  await shareOrDownload(blob, fname(`Вылеты ${stamp()}.xlsx`), blob.type, false);
  toast('Excel сохранён');
}
async function reqXlsx(ls) {
  if (!ls.length) return;
  ls.sort((a, b) => a.date.localeCompare(b.date) || a.e.fio.localeCompare(b.e.fio, 'ru'));
  const rows = [['№', 'ФИО', 'ФИО латиницей', 'Дата рождения', 'Гражданство', 'Паспорт №', 'Дата выдачи', 'Действует до', 'Телефон', 'Почта', 'Рейс', 'Откуда', 'Куда', 'Дата']];
  ls.forEach((l, i) => { const e = l.e; rows.push([i + 1, e.fio, e.lat || '', cell(e.birth, 1), e.cit || '', e.pass || '', cell(e.pIss, 1), cell(e.pExp, 1), e.phone || '', e.email || '', LEG[l.k], l.from, l.to, { d: l.date }]); });
  const blob = await XL.write([{ name: 'Заявка', rows, head: true, widths: [5, 32, 26, 13, 13, 15, 13, 13, 18, 26, 9, 16, 16, 12] }]);
  await shareOrDownload(blob, fname(`Заявка на вылет ${stamp()}.xlsx`), blob.type, !isPC());
  const todo = ls.filter(l => !l.st);
  if (todo.length && await ask({ title: 'Отметить заявку поданной?', text: `Для ${todo.length} ${pl(todo.length, 'рейса', 'рейсов', 'рейсов')} поставить «заявка подана» с сегодняшней датой?`, ok: 'Отметить', cancel: 'Нет' })) mark(todo.map(l => l.key), 'sent');
  else { SEL.clear(); renderList(); }
}
async function copyReq(ls) {
  ls.sort((a, b) => a.date.localeCompare(b.date));
  const txt = ls.map((l, i) => { const e = l.e; return `${i + 1}. ${e.fio}${e.lat ? ' (' + e.lat + ')' : ''}` + (e.birth ? `, д.р. ${fd(e.birth)}` : '') + (e.pass ? `, паспорт ${e.pass}` + (e.pExp ? ` до ${fd(e.pExp)}` : '') : '') + (e.phone ? `, тел. ${e.phone}` : '') + `\n   ${LEG[l.k]} ${fd(l.date)}: ${l.from || '?'} → ${l.to || '?'}`; }).join('\n');
  try { await navigator.clipboard.writeText(txt); toast('Скопировано: ' + ls.length + '. Вставьте в сообщение или письмо.'); }
  catch (e) { await ask({ title: 'Скопируйте вручную', html: `<textarea class="inp" style="min-height:200px" readonly>${esc(txt)}</textarea>`, cancel: null }); }
}
async function xlsTemplate() {
  const rows = [[...EMP_COLS.map(c => c[1]), 'Дата вылета', 'Откуда (вылет)', 'Куда (вылет)', 'Дата прилёта', 'Куда (прилёт)', 'Заметка'],
  ['Иванов Иван Иванович', 'IVANOV IVAN', 'Рабочий', 'Монтажник', 'Тула', 'Москва', '+7 900 000-00-00', 'ivanov@mail.ru', 'РФ', { d: '1985-01-15' }, '75 1234567', { d: '2020-05-01' }, { d: '2030-05-01' }, { d: addD(today(), 60) }, '', 'Каир', { d: addD(today(), 120) }, '', 'пример, удалите строку']];
  const blob = await XL.write([{ name: 'Сотрудники', rows, head: true, widths: [...EMP_COLS.map(c => c[2]), 13, 16, 16, 13, 16, 24] }]);
  await shareOrDownload(blob, 'Шаблон Вылеты.xlsx', blob.type, false);
}
/* ---------- ЗАГРУЗКА СВОИХ ФАЙЛОВ: Excel, CSV, Word (таблицы и заявки-анкеты) ---------- */
const IMPF = [
  ['Человек', [['fio', 'ФИО полностью'], ['fiolat', 'ФИО «по-русски / латиницей»'], ['fam', 'Фамилия'], ['nam', 'Имя'], ['otc', 'Отчество'], ['lat', 'ФИО латиницей'], ['birth', 'Дата рождения'], ['bplace', 'Место рождения'], ['cit', 'Гражданство']]],
  ['Работа', [['pos', 'Должность'], ['lvl', 'Уровень (рабочий / ИТР / руководство)'], ['tab', 'Табельный номер'], ['mvz', 'Код МВЗ'], ['stay', 'Срок пребывания'], ['stat', 'Статус (работает / не продлевают / уволен)'], ['statD', 'Дата ухода (увольнения, конца контракта)']]],
  ['Паспорт', [['pass', 'Паспорт: серия и номер'], ['pser', 'Серия паспорта'], ['pnum', 'Номер паспорта'], ['pIss', 'Дата выдачи паспорта'], ['pExp', 'Паспорт действует до']]],
  ['Контакты и города', [['phone', 'Мобильный телефон'], ['wphone', 'Рабочий телефон'], ['email', 'Эл. почта'], ['city', 'Базовый город'], ['air', 'Город вылета']]],
  ['Поездки', [['oD', 'Дата вылета (на объект)'], ['bD', 'Дата прилёта / обратного рейса'], ['tripD', 'Дата поездки (направление — по маршруту)'], ['route', 'Маршрут «Откуда-Куда»'], ['oFrom', 'Откуда (вылет)'], ['oTo', 'Куда (вылет)'], ['bFrom', 'Откуда (обратно)'], ['bTo', 'Куда (обратно)'], ['why', 'Причина поездки'], ['tk', 'Рейс / бронь'], ['oTk', 'Рейс (вылет)'], ['bTk', 'Рейс (прилёт)'], ['tkst', 'Билет / заявка: есть, куплен, подана'], ['oSt', 'Статус вылета (заявка / билет)'], ['bSt', 'Статус прилёта (заявка / билет)']]],
  ['Другое', [['note', 'Заметка (добавить к заметке)']]],
];
const IMPL = Object.fromEntries(IMPF.flatMap(g => g[1]));
const IM_DATES = new Set(['birth', 'pIss', 'pExp', 'oD', 'bD', 'tripD', 'statD']);
const IM_EMP = ['fio', 'lat', 'lvl', 'pos', 'tab', 'city', 'air', 'phone', 'wphone', 'email', 'cit', 'birth', 'bplace', 'pass', 'pIss', 'pExp', 'mvz', 'stay', 'stat', 'statD'];
function guessField(h, ctx = {}) {
  const s = norm(h).replace(/[.:«»"()]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (/^№|^n$|^п\/п|^#$|^номер п|ближайш|осталось|дней до|срок заявки|документ|фото|^заявка$|^подана$|кем выдан|стоимост|итого|межсмен/.test(s)) return '';
  if (/статус/.test(s)) { if (/вылет/.test(s)) return 'oSt'; if (/прил|обрат/.test(s)) return 'bSt'; return 'stat'; }
  if (/рейс|бронь/.test(s)) { if (/дата/.test(s)) return 'tripD'; if (/вылет/.test(s)) return 'oTk'; if (/прил|обрат/.test(s)) return 'bTk'; return 'tk'; }
  if (/^билет/.test(s)) return 'tkst';
  if (/ф\s*и\s*о/.test(s) && /лат/.test(s)) return 'fiolat';
  if (/увол|контракт|ухода|договор до/.test(s)) return /дата|до|оконч|ухода/.test(s) ? 'statD' : 'stat';
  if (/табел/.test(s)) return 'tab';
  if (/место рожд/.test(s)) return 'bplace';
  if (/рабоч.*тел/.test(s)) return 'wphone';
  if (/мвз|подразделен/.test(s)) return 'mvz';
  if (/пребыван/.test(s)) return 'stay';
  if (/окончан|действ|годен|expir/.test(s)) return 'pExp';
  if (/маршрут|направлен/.test(s)) return 'route';
  if (/дата поездки|дата отправлен|дата выезда/.test(s)) return 'tripD';
  if (/причин|цель/.test(s)) return 'why';
  const back = /прил[её]т|обрат|возвр/.test(s);
  if (/откуда/.test(s)) return back ? 'bFrom' : 'oFrom';
  if (/куда/.test(s)) return back ? 'bTo' : 'oTo';
  if (/(город|аэропорт).*вылет|вылет.*(город|аэропорт)/.test(s)) return 'air';
  if (/уровень|категор/.test(s)) return 'lvl';
  if (/лат|latin|англ|english/.test(s)) return 'lat';
  if (/рожд|birth/.test(s)) return 'birth';
  if (/выдач|issue/.test(s)) return 'pIss';
  if (/^серия/.test(s) && ctx.hasNum) return 'pser';
  if (/^номер( паспорта)?$/.test(s) && ctx.hasSer) return 'pnum';
  if (/паспорт|passport|серия|номер док/.test(s)) return 'pass';
  if (/граждан|citizen/.test(s)) return 'cit';
  if (/^фамилия$/.test(s) && ctx.hasName) return 'fam';
  if (/^имя$/.test(s)) return 'nam';
  if (/^отчество$/.test(s)) return 'otc';
  if (/фио|ф и о|сотрудник|фамилия|работник|^имя|^name|^ф и о/.test(s)) return 'fio';
  if (/должн|профес|position|специальн/.test(s)) return 'pos';
  if (/назнач|объект/.test(s)) return 'oTo';
  if (/вылет|отъезд|туда|заезд/.test(s)) return 'oD';
  if (back || /приезд|выезд/.test(s)) return 'bD';
  if (/город|city|прожив/.test(s)) return 'city';
  if (/тел|phone|моб/.test(s)) return 'phone';
  if (/почт|mail/.test(s)) return 'email';
  if (/замет|примеч|коммент|note|инфо/.test(s)) return 'note';
  return '';
}
function sniffField(vals) {
  const v = vals.filter(x => x !== '' && x != null).slice(0, 15).map(x => typeof x === 'object' && x.d ? '' : String(x).trim()).filter(Boolean);
  if (v.length < 1) return '';
  const share = re => v.filter(x => re.test(x)).length / v.length;
  if (share(/^[^\s@]+@[^\s@]+\.\w{2,}$/) > .6) return 'email';
  if (share(/^[A-Z][A-Za-z'\-]+(\s+[A-Z][A-Za-z'\-]+)+$/) > .6) return 'lat';
  if (share(/^[А-ЯЁ][А-ЯЁа-яё\-]+(\s+[А-ЯЁ][А-ЯЁа-яё\-]+){1,3}$/) > .6) return 'fio';
  if (share(/^\+?[\d\s\-()]{10,}$/) > .6 && v.every(x => x.replace(/\D/g, '').length >= 10)) return 'phone';
  if (share(/^\d{2}\s?\d{2}\s?\d{6}$|^\d{2}\s\d{7}$|^[A-Z]{1,2}\s?\d{6,7}$/) > .6) return 'pass';
  if (share(/^[А-ЯЁ][а-яё\- ]+\s*[-–—]\s*[А-ЯЁ][а-яё\- ]+$/) > .6) return 'route';
  return '';
}
const parseLvl = v => { const s = norm(v); if (!s) return ''; if (/рук|нач|дир|глав|шеф|топ/.test(s)) return 'b'; if (/маст|офис|итр|инж|прораб|бригад|снаб|бухг|кадр|менедж|специал|пто/.test(s)) return 'm'; if (/раб/.test(s)) return 'w'; return ''; };
const parseStat = (v, hdr) => { const s = norm(v); if (!s) return null; if (/увол/.test(s)) return 'fired'; if (/не прод|оконч|истек|заверш|конец контр/.test(s)) return 'end'; if (/работ|актив|продл/.test(s)) return ''; if (/^(да|\+|yes|1|✓|x|х)$/.test(s)) return /увол/.test(norm(hdr)) ? 'fired' : /контр|прод/.test(norm(hdr)) ? 'end' : null; if (/^(нет|-|no|0)$/.test(s)) return ''; return null; };
const parseTk = v => { const s = norm(v); if (!s) return ''; if (/билет есть|куплен|есть|^да$|^\+$|yes|✓|^x$|^х$/.test(s)) return 'tk'; if (/подан|заявк/.test(s)) return 'sent'; return ''; };
const MONR = ['янв', 'фев', 'мар', 'апр', 'ма', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
function toIso(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'object' && v.d) return v.d;
  if (typeof v === 'number') return v > 20000 && v < 80000 ? XL.serialToIso(v) : '';
  const s = String(v).trim().toLowerCase().replace(/г\.?$/, '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = s.match(/^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})$/);
  if (m) { let y = +m[3]; if (y < 100) y += y > 50 ? 1900 : 2000; if (+m[2] < 1 || +m[2] > 12 || +m[1] < 1 || +m[1] > 31) return ''; return `${y}-${pad(m[2])}-${pad(m[1])}`; }
  m = s.match(/^(\d{1,2})\s+([а-яё]+)\.?\s+(\d{4})/);
  if (m) { const mi = MONR.findIndex((p, i) => i === 4 ? /^ма[йя]/.test(m[2]) : m[2].startsWith(p)); if (mi >= 0) return `${m[3]}-${pad(mi + 1)}-${pad(m[1])}`; }
  return '';
}
const titleCase = s => s.toLowerCase().replace(/(^|[\s\-])([а-яёa-z])/g, (a, b, c) => b + c.toUpperCase());
const cellStr = v => v == null ? '' : (typeof v === 'object' && v.d ? fd(v.d) : (typeof v === 'number' && Number.isInteger(v) ? String(v) : String(v))).replace(/ /g, ' ').trim();
const reasonOf = v => { const s = norm(v); if (!s) return ''; const r = REASONS.find(x => norm(x) === s || norm(x).startsWith(s.slice(0, 5))); return r || String(v).trim(); };

/* таблица → записи */
function imHeaderRow(rows) {
  let best = -1, bs = 1;
  for (let ri = 0; ri < Math.min(15, rows.length); ri++) {
    const hs = (rows[ri] || []).map(cellStr), ctx = imCtx(hs);
    const sc = hs.filter(h => h && guessField(h, ctx)).length;
    if (sc > bs || (sc === bs && best < 0 && sc >= 2)) { bs = sc; best = ri; }
  }
  return bs >= 2 ? best : -1;
}
const imCtx = hs => { const n = hs.map(h => norm(h).replace(/[.:]/g, '')); return { hasName: n.some(h => /^имя$/.test(h)), hasSer: n.some(h => /^серия/.test(h)), hasNum: n.some(h => /^номер( паспорта)?$/.test(h)) }; };
function imAutoMap(src) {
  const rows = src.rows, hdr = src.hdr, ncol = Math.max(0, ...rows.slice(0, 60).map(r => r.length));
  const hs = hdr >= 0 ? (rows[hdr] || []).map(cellStr) : [];
  const key = hs.map(norm).join('|');
  const saved = (() => { try { return JSON.parse(localStorage.getItem('vylety.maps') || '{}')[key]; } catch (e) { return null; } })();
  if (saved && key.replace(/\|/g, '')) { src.map = { ...saved }; src.remembered = true; return; }
  const ctx = imCtx(hs), map = {}, used = new Set();
  const data = rows.slice(hdr + 1, hdr + 41);
  for (let c = 0; c < ncol; c++) {
    let f = hs[c] ? guessField(hs[c], ctx) : '';
    if (!f && (!hs[c] || hdr < 0)) f = sniffField(data.map(r => r[c]));
    if (f && f !== 'note' && used.has(f)) f = '';
    if (f) { used.add(f); map[c] = f; }
  }
  if (map && Object.values(map).includes('fam') && !Object.values(map).includes('nam')) for (const c in map) if (map[c] === 'fam') map[c] = 'fio';
  src.map = map;
}
const STOPROW = /^\s*\*|^исполнитель|^согласовано|^проверил|^утверждаю|^итого/i;
function imRecords(src) {
  if (src.kind === 'forms') return src.recs;
  const out = [], map = src.map, hs = src.hdr >= 0 ? (src.rows[src.hdr] || []).map(cellStr) : [];
  for (const row of src.rows.slice(src.hdr + 1)) {
    if (row.some(c => typeof c === 'string' && STOPROW.test(c.trim()))) break;
    const g = { legs: [] }, notes = [];
    let fam = '', nam = '', otc = '', ser = '', num = '';
    for (const c in map) {
      const f = map[c], raw = row[c]; if (raw == null || raw === '') continue;
      if (IM_DATES.has(f)) { const d = toIso(raw); if (d) g[f] = d; continue; }
      const v = cellStr(raw); if (!v) continue;
      if (f === 'fam') fam = v; else if (f === 'nam') nam = v; else if (f === 'otc') otc = v;
      else if (f === 'pser') ser = v; else if (f === 'pnum') num = v;
      else if (f === 'note') notes.push(hs[c] ? `${hs[c]}: ${v}` : v);
      else if (f === 'stat') { const st = parseStat(v, hs[c]); if (st !== null) g.stat = st; }
      else if (f === 'tkst' || f === 'oSt' || f === 'bSt') g[f] = parseTk(v);
      else g[f] = v;
    }
    if (fam || nam) g.fio = [fam, nam, otc].filter(Boolean).join(' ');
    if (ser || num) g.pass = [ser, num].filter(Boolean).join(' ');
    if (g.fiolat) { const parts = g.fiolat.split('/').map(x => x.trim()).filter(Boolean); g.fio = g.fio || parts.find(x => /[а-яё]/i.test(x)) || ''; const lt = parts.find(x => /[a-z]/i.test(x) && !/[а-яё]/i.test(x)); if (lt && !g.lat) g.lat = lt; delete g.fiolat; }
    if (notes.length) g.note = notes.join('; ');
    if (g.tripD) { const [rf, rt] = String(g.route || '').split(/\s*[-–—]\s*/).map(x => x.trim()); g.legs.push({ date: g.tripD, from: rf || '', to: rt || '', why: g.why || '', tk: g.tk || '', st: g.tkst || '' }); }
    else if (g.route && (g.oD || g.bD)) { const [rf, rt] = g.route.split(/\s*[-–—]\s*/).map(x => x.trim()); const k = g.oD ? 'o' : 'b'; g[k + 'From'] = g[k + 'From'] || rf; g[k + 'To'] = g[k + 'To'] || rt; }
    out.push(g);
  }
  return out.map(imClean).filter(g => g.fio || Object.keys(g).length > 1);
}
function imClean(g) {
  if (g.fio) { g.fio = g.fio.replace(/\s+/g, ' ').trim(); if (g.fio === g.fio.toUpperCase() && /[А-ЯЁ]/.test(g.fio)) g.fio = titleCase(g.fio); if (/^(итого|всего|фио)/i.test(g.fio) || g.fio.split(' ').length > 5) g.fio = ''; }
  if (g.lat) g.lat = g.lat.replace(/\s+/g, ' ').trim().toUpperCase();
  if (g.tab) g.tab = g.tab.replace(/\.0+$/, '');
  if ('lvl' in g) g.lvl = parseLvl(g.lvl);
  if (g.why) g.why = reasonOf(g.why);
  return g;
}
/* запись → сотрудник и поездки */
function imApply(recs, opt) {
  const r = { ea: 0, eu: 0, ta: 0, tu: 0, skip: 0 };
  const byPass = {}, byFio = {};
  emps().forEach(e => { if (e.pass) byPass[normPass(e.pass)] = e; if (e.fio) byFio[norm(e.fio)] = e; });
  const dests = new Set([S('dest'), ...trips().flatMap(t => [t.oTo, t.to])].filter(Boolean).map(norm));
  if (!dests.size) {
    const cnt = {}; recs.forEach(g => g.legs.forEach(l => [l.from, l.to].filter(Boolean).forEach(c => cnt[norm(c)] = (cnt[norm(c)] || 0) + 1)));
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) { dests.add(top[0]); if (!D.set.dest) setF(D.set, 'dest', titleCase(top[0])); }
  }
  const put = (rec, k, v) => { if (v == null || v === '') return false; if (opt.mode === 'fill' && rec[k]) return false; return setF(rec, k, v); };
  for (const g of recs) {
    if (!g.fio) { r.skip++; continue; }
    let e = (g.pass && byPass[normPass(g.pass)]) || byFio[norm(g.fio)];
    const isNew = !e;
    if (!e) { e = { id: uid(), _t: {} }; D.emp[e.id] = e; byFio[norm(g.fio)] = e; if (g.pass) byPass[normPass(g.pass)] = e; setF(e, 'lvl', g.lvl || opt.lvl || 'w'); r.ea++; }
    let ch = false;
    IM_EMP.forEach(k => { if (k === 'lvl' && isNew) return; if (k in g && put(e, k, g[k])) ch = true; });
    if (g.note && !(e.note || '').includes(g.note)) { setF(e, 'note', e.note ? e.note + '\n' + g.note : g.note); ch = true; }
    if (!isNew && ch) r.eu++;
    // поездки
    const legs = [];
    for (const k of ['o', 'b']) if (validIso(g[k + 'D'])) legs.push({ k, date: g[k + 'D'], from: g[k + 'From'], to: g[k + 'To'], tk: g[k + 'Tk'] || (k === 'o' && !g.bD ? g.tk : ''), st: g[k + 'St'] || '', why: g.why && !g.tripD ? g.why : '' });
    g.legs.forEach(l => {
      if (!validIso(l.date)) return;
      const back = l.from && dests.has(norm(l.from)), fwd = l.to && dests.has(norm(l.to));
      const base = norm(e.air || e.city || g.city || '');
      const k = back ? 'b' : fwd ? 'o' : (base && norm(l.to) === base ? 'b' : 'o');
      legs.push({ ...l, k });
      if (k === 'b' && l.to && !e.city && !g.city) setF(e, 'city', l.to);
      if (k === 'o' && l.from && !e.city && !g.city) setF(e, 'city', l.from);
    });
    let trip = null;
    for (const l of legs) {
      const mine = Object.values(D.trip).filter(t => alive(t) && t.emp === e.id);
      let t = mine.find(t => t[l.k + 'D'] === l.date) || (trip && !trip[l.k + 'D'] ? trip : null);
      if (!t && l.k === 'b') t = mine.filter(t => t.oD && !t.bD && t.oD < l.date && dn(l.date) - dn(t.oD) < 250).sort((a, b) => b.oD.localeCompare(a.oD))[0];
      if (!t && l.k === 'o') t = mine.filter(t => t.bD && !t.oD && t.bD > l.date && dn(t.bD) - dn(l.date) < 250).sort((a, b) => a.bD.localeCompare(b.bD))[0];
      const isNewT = !t; if (!t) { t = { id: uid(), _t: {} }; setF(t, 'emp', e.id); }
      let tch = false;
      [['D', l.date], ['From', l.from], ['To', l.to], ['Tk', l.tk], ['Why', l.why]].forEach(([s, v]) => { if (v && (s === 'D' ? setF(t, l.k + 'D', v) : put(t, l.k + s, v))) tch = true; });
      if (l.st && (!t[l.k + 'S'] || opt.mode === 'over' || (l.st === 'tk' && t[l.k + 'S'] !== 'tk'))) { if (setF(t, l.k + 'S', l.st)) tch = true; if (!t[l.k + 'Sent']) setF(t, l.k + 'Sent', today()); }
      if (isNewT) { D.trip[t.id] = t; r.ta++; } else if (tch) r.tu++;
      trip = t;
    }
  }
  return r;
}
/* мастер загрузки */
const IM = { srcs: [], i: 0, sum: { ea: 0, eu: 0, ta: 0, tu: 0, skip: 0, n: 0 }, opt: { lvl: 'w', mode: 'fill' } };
async function startImport(files) {
  files = Array.from(files || []).filter(Boolean); if (!files.length) return;
  const srcs = [], bad = [], forms = [];
  for (const f of files) {
    try {
      const head = new Uint8Array(await f.slice(0, 8).arrayBuffer());
      if (head[0] === 0xD0 && head[1] === 0xCF) { bad.push(`«${f.name}» — старый формат .xls/.doc. Откройте его и сохраните как .xlsx или .docx («Файл» → «Сохранить как»).`); continue; }
      if (/\.csv$/i.test(f.name)) { XL.readCsv(await f.text()).forEach(sh => srcs.push({ kind: 'table', file: f.name, name: 'CSV', rows: sh.rows })); continue; }
      const buf = await f.arrayBuffer(), kind = await ZV.kind(buf);
      if (kind === 'xlsx') { (await XL.read(buf)).forEach(sh => { if (!sh.hidden && sh.rows.filter(r => r.some(c => c !== '' && c != null)).length >= 1 && !/^сроки заявок$/i.test(sh.name)) srcs.push({ kind: 'table', file: f.name, name: sh.name, rows: sh.rows }); }); }
      else if (kind === 'docx') {
        const d = await ZV.readDocx(buf);
        if (d.form) { forms.push({ file: f.name, form: d.form }); continue; }
        const tabs = d.tables.filter(t => t.length >= 1 && t.some(r => r.some(Boolean)));
        if (tabs.length) tabs.forEach((t, i) => srcs.push({ kind: 'table', file: f.name, name: tabs.length > 1 ? `Таблица ${i + 1}` : 'Таблица', rows: t }));
        else if (d.paras.length) srcs.push({ kind: 'table', file: f.name, name: 'Текст', rows: d.paras.map(p => p.split(/\t|\s*;\s*|\s*\|\s*|\s+[—–]\s+/).map(x => x.trim())) });
        else bad.push(`«${f.name}» — в документе нет текста и таблиц.`);
      } else bad.push(`«${f.name}» — это не Excel и не Word. Подойдут .xlsx, .csv, .docx.`);
    } catch (e) { bad.push(`«${f.name}» — не получилось прочитать: ${e.message || e}`); }
  }
  if (forms.length) srcs.unshift({ kind: 'forms', file: forms.length === 1 ? forms[0].file : `${forms.length} ${pl(forms.length, 'файл', 'файла', 'файлов')} Word`, name: 'Заявки на билеты', recs: forms.map(x => formRec(x.form)) });
  srcs.forEach(s => { if (s.kind === 'table') { s.hdr = imHeaderRow(s.rows); imAutoMap(s); } });
  const hasPeople = s => s.kind === 'forms' || Object.values(s.map).some(f => ['fio', 'fiolat', 'fam'].includes(f));
  for (let i = srcs.length - 1; i >= 0; i--) { const s = srcs[i]; if (!hasPeople(s) && (s.rows.length < 3 || Math.max(0, ...s.rows.map(r => r.filter(c => c !== '' && c != null).length)) < 2)) srcs.splice(i, 1); }
  if (!srcs.length && !bad.length) return ask({ title: 'Не нашёл таблиц с людьми', text: 'В файле нет таблицы, где есть ФИО. Проверьте, что выбран нужный файл.', cancel: null });
  if (bad.length && !srcs.length) return ask({ title: 'Не получилось загрузить', text: bad.map(esc).join('\n\n'), cancel: null });
  if (bad.length) await ask({ title: 'Некоторые файлы пропущены', text: bad.map(esc).join('\n\n'), cancel: null, ok: 'Продолжить' });
  IM.srcs = srcs; IM.i = 0; IM.sum = { ea: 0, eu: 0, ta: 0, tu: 0, skip: 0, n: 0 };
  imOpen();
}
function formRec(f) {
  const g = { fio: f.fio, lat: f.lat, pass: f.pass, pExp: toIso(f.pExp), birth: toIso(f.birth), cit: f.cit, bplace: f.bplace, tab: f.tab, wphone: f.wphone, email: f.email, phone: f.phone, mvz: f.mvz, legs: [] };
  (f.legs || []).forEach(l => { const d = toIso(l.date); if (d) g.legs.push({ date: d, from: l.from ? titleCase(l.from) : '', to: l.to ? titleCase(l.to) : '', why: reasonOf(l.why), tk: /^(авиа|жд|ж\/д)$/i.test(l.flight || '') ? '' : (l.flight || '') }); });
  Object.keys(g).forEach(k => { if (g[k] === '' || g[k] == null) delete g[k]; });
  return imClean(g);
}
function imOpen() {
  const src = IM.srcs[IM.i]; if (!src) return imDone();
  if (!src.lvl) src.lvl = src.kind === 'forms' ? 'm' : IM.opt.lvl;
  const el = openSheet(1, `Загрузка ${IM.srcs.length > 1 ? `${IM.i + 1} из ${IM.srcs.length}` : 'данных'}`, imBody(), `<button class="btn" data-imskip>${IM.srcs.length > 1 ? 'Пропустить' : 'Отмена'}</button><button class="btn pri" data-imgo>${ic('upload')} Загрузить</button>`, () => { el.classList.remove('wide'); });
  el.classList.add('wide');
  imBind(el);
}
function imPreview(src) {
  const recs = imRecords(src), ok = recs.filter(g => g.fio);
  const ex = new Set(); emps().forEach(e => { if (e.pass) ex.add('p' + normPass(e.pass)); ex.add('f' + norm(e.fio)); });
  const old = ok.filter(g => (g.pass && ex.has('p' + normPass(g.pass))) || ex.has('f' + norm(g.fio))).length;
  const nl = ok.reduce((s, g) => s + g.legs.length + (validIso(g.oD) ? 1 : 0) + (validIso(g.bD) ? 1 : 0), 0);
  return { recs, ok, old, nl, skip: recs.length - ok.length };
}
function imBody() {
  const src = IM.srcs[IM.i], P = imPreview(src);
  let h = `<div class="imfile">${ic(src.kind === 'forms' || /\.docx$/i.test(src.file) ? 'doc' : 'xls')}<div><b>${esc(src.file)}</b><div class="small muted">${esc(src.name)}${src.rows ? ` · ${src.rows.length} ${pl(src.rows.length, 'строка', 'строки', 'строк')}` : ''}${src.remembered ? ' · столбцы как в прошлый раз' : ''}</div></div></div>`;
  if (src.kind === 'table') {
    const rows = src.rows, ncol = Math.max(0, ...rows.slice(0, 80).map(r => r.length));
    const hs = src.hdr >= 0 ? (rows[src.hdr] || []).map(cellStr) : [];
    h += `<label class="fld"><span>Строка с названиями столбцов</span><select data-imhdr><option value="-1" ${src.hdr < 0 ? 'selected' : ''}>Нет названий — данные с первой строки</option>${rows.slice(0, 15).map((r, i) => `<option value="${i}" ${src.hdr === i ? 'selected' : ''}>Строка ${i + 1}: ${esc(r.map(cellStr).filter(Boolean).slice(0, 4).join(' · ').slice(0, 70))}</option>`).join('')}</select></label>`;
    h += `<div class="grp">Что в каких столбцах</div><p class="small muted" style="margin:-4px 0 8px">Я угадал по названиям и содержимому. Проверьте и поправьте; ненужное оставьте «не загружать».</p><div class="imcols">`;
    const data = rows.slice(src.hdr + 1).filter(r => r.some(c => c !== '' && c != null));
    for (let c = 0; c < ncol; c++) {
      const samples = data.map(r => cellStr(r[c])).filter(Boolean);
      if (!samples.length && !hs[c]) continue;
      const f = src.map[c] || '';
      h += `<div class="imcol ${f ? 'on' : ''}"><div class="imh"><span class="colk">${colLetter(c)}</span><b>${esc(hs[c] || 'без названия')}</b></div><div class="ims">${samples.slice(0, 3).map(x => `<span>${esc(x.slice(0, 40))}</span>`).join('') || '<span class="muted">пусто</span>'}</div>
        <select data-imcol="${c}"><option value="">— не загружать —</option>${IMPF.map(([g, fs]) => `<optgroup label="${g}">${fs.map(([k, n]) => `<option value="${k}" ${f === k ? 'selected' : ''}>${n}</option>`).join('')}</optgroup>`).join('')}</select></div>`;
    }
    h += `</div>`;
    const mapped = Object.values(src.map);
    if (!mapped.some(f => ['fio', 'fiolat', 'fam'].includes(f))) h += `<div class="banner red">${ic('alert')}<span class="sp">Укажите столбец с ФИО (или «Фамилия» и «Имя») — без него людей не загрузить.</span></div>`;
  } else {
    h += `<p class="small muted">Это заявки на приобретение билетов: из каждой беру человека, паспорт, контакты и поездки.</p>`;
  }
  h += `<div class="grp">Как загружать</div>
    <div class="fld"><span class="lbl">Новых людей записать как</span><div class="seg lvls" data-imlvl>${Object.entries(LV).map(([k, v]) => `<button type="button" data-v="${k}" class="${v.c} ${src.lvl === k ? 'on' : ''}">${ic(v.i)}${v.n}</button>`).join('')}</div>${src.kind === 'table' && Object.values(src.map).includes('lvl') ? '<div class="hint">Где в файле указан уровень — возьму из файла.</div>' : ''}</div>
    <div class="fld"><span class="lbl">Если человек уже есть в программе</span><div class="seg" data-immode><button type="button" data-v="fill" class="${IM.opt.mode === 'fill' ? 'on' : ''}">Дополнить пустые поля</button><button type="button" data-v="over" class="${IM.opt.mode === 'over' ? 'on' : ''}">Заменить данными из файла</button></div><div class="hint">Ищу по номеру паспорта, потом по ФИО.</div></div>`;
  h += `<div class="grp">Что получится</div><div class="imsum"><span><b>${P.ok.length - P.old}</b> ${pl(P.ok.length - P.old, 'новый', 'новых', 'новых')}</span><span><b>${P.old}</b> уже ${pl(P.old, 'есть', 'есть', 'есть')}</span><span><b>${P.nl}</b> ${pl(P.nl, 'рейс', 'рейса', 'рейсов')}</span>${P.skip ? `<span class="muted"><b>${P.skip}</b> без ФИО — пропущу</span>` : ''}</div>`;
  if (P.ok.length) {
    const cols = ['fio', 'lat', 'pass', 'birth', 'phone', 'pos', 'stat'].filter(k => P.ok.some(g => g[k] !== undefined && g[k] !== ''));
    h += `<div class="imprev"><table><thead><tr>${cols.map(k => `<th>${({ fio: 'ФИО', lat: 'Латиницей', pass: 'Паспорт', birth: 'Рожд.', phone: 'Телефон', pos: 'Должность', stat: 'Статус' })[k]}</th>`).join('')}<th>Рейсы</th></tr></thead><tbody>${P.ok.slice(0, 8).map(g => `<tr>${cols.map(k => `<td>${esc(k === 'birth' ? fd(g[k]) : k === 'stat' ? (g[k] ? STATN[g[k]] : 'работает') : g[k] || '')}</td>`).join('')}<td>${esc([...(validIso(g.oD) ? ['вылет ' + fd(g.oD)] : []), ...(validIso(g.bD) ? ['прилёт ' + fd(g.bD)] : []), ...g.legs.map(l => fd(l.date) + (l.from || l.to ? ` ${l.from || '?'}→${l.to || '?'}` : ''))].join(', '))}</td></tr>`).join('')}</tbody></table>${P.ok.length > 8 ? `<div class="small muted" style="padding:6px 2px">…и ещё ${P.ok.length - 8}</div>` : ''}</div>`;
  }
  return h;
}
const colLetter = n => { let s = ''; n++; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; };
function imBind(el) {
  const src = IM.srcs[IM.i];
  const redraw = () => { const b = el.querySelector('.sh-b'), st = b.scrollTop; b.innerHTML = imBody(); imBind2(); b.scrollTop = st; upd(); };
  const upd = () => { const P = imPreview(src), go = el.querySelector('[data-imgo]'); go.disabled = !P.ok.length; go.innerHTML = `${ic('upload')} Загрузить${P.ok.length ? ' ' + P.ok.length : ''}`; };
  const imBind2 = () => {
    const hs = el.querySelector('[data-imhdr]'); if (hs) hs.onchange = () => { src.hdr = +hs.value; imAutoMap(src); redraw(); };
    $$('[data-imcol]', el).forEach(s => s.onchange = () => { const c = s.dataset.imcol; if (s.value) { for (const k in src.map) if (src.map[k] === s.value && s.value !== 'note' && k !== c) delete src.map[k]; src.map[c] = s.value; } else delete src.map[c]; src.remembered = false; redraw(); });
    $$('[data-imlvl] button', el).forEach(b => b.onclick = () => { src.lvl = b.dataset.v; if (src.kind === 'table') IM.opt.lvl = b.dataset.v; $$('[data-imlvl] button', el).forEach(x => x.classList.toggle('on', x === b)); });
    $$('[data-immode] button', el).forEach(b => b.onclick = () => { IM.opt.mode = b.dataset.v; $$('[data-immode] button', el).forEach(x => x.classList.toggle('on', x === b)); });
  };
  imBind2(); upd();
  el.querySelector('[data-imskip]').onclick = () => { IM.i++; closeSheet(1); setTimeout(imOpen, 260); };
  el.querySelector('[data-imgo]').onclick = () => {
    const recs = imRecords(src);
    if (src.kind === 'table') { try { const hs = src.hdr >= 0 ? (src.rows[src.hdr] || []).map(cellStr) : []; const key = hs.map(norm).join('|'); if (key.replace(/\|/g, '')) { const m = JSON.parse(localStorage.getItem('vylety.maps') || '{}'); m[key] = src.map; localStorage.setItem('vylety.maps', JSON.stringify(m)); } } catch (e) { } }
    const r = imApply(recs, { ...IM.opt, lvl: src.lvl });
    for (const k in r) IM.sum[k] += r[k]; IM.sum.n++;
    save(); IM.i++; closeSheet(1); setTimeout(imOpen, 260);
  };
}
function imDone() {
  render(); shell();
  const s = IM.sum; if (!s.n) return;
  ask({ title: 'Загрузка закончена', text: `Новых сотрудников: ${s.ea}\nОбновлено: ${s.eu}\nНовых поездок: ${s.ta}${s.tu ? `\nОбновлено поездок: ${s.tu}` : ''}${s.skip ? `\nПропущено строк без ФИО: ${s.skip}` : ''}`, cancel: null });
}
async function importExcel(file) { return startImport([file]); }

/* ---------- календарь ---------- */
function icsFile() {
  const ls = allLegs().filter(l => l.fleft >= 0 && !l.st).sort((a, b) => a.dl.localeCompare(b.dl));
  if (!ls.length) return toast('Нет неподанных заявок');
  const t = today(), stampU = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const enc = new TextEncoder();
  const fold = s => { const out = []; let cur = ''; for (const ch of s) { if (enc.encode(cur + ch).length > 73) { out.push(cur); cur = ' ' + ch; } else cur += ch; } out.push(cur); return out.join('\r\n'); };
  const ie = s => String(s).replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Vylety//RU', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Заявки на вылет'];
  ls.forEach(l => {
    const d = l.dl < t ? t : l.dl;
    out.push('BEGIN:VEVENT', 'UID:' + l.key.replace(':', '-') + '@vylety', 'DTSTAMP:' + stampU, 'DTSTART;VALUE=DATE:' + d.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + addD(d, 1).replace(/-/g, ''),
      fold('SUMMARY:' + ie(`Заявка: ${short(l.e.fio)} (${LEG[l.k].toLowerCase()} ${fds(l.date)})`)),
      fold('DESCRIPTION:' + ie(`${l.e.fio}\n${LEG[l.k]} ${fd(l.date)}: ${l.from || '?'} → ${l.to || '?'}\nСрок заявки: ${fd(l.dl)}${l.e.phone ? '\nТел.: ' + l.e.phone : ''}`)),
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Заявка на вылет', 'TRIGGER:-P3D', 'END:VALARM',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Заявка на вылет', 'TRIGGER:PT9H', 'END:VALARM', 'END:VEVENT');
  });
  out.push('END:VCALENDAR');
  shareOrDownload(new Blob([out.join('\r\n')], { type: 'text/calendar' }), 'Заявки на вылет.ics', 'text/calendar', false);
  toast(`В файле ${ls.length} ${pl(ls.length, 'срок', 'срока', 'сроков')}. Откройте его, чтобы добавить в календарь.`, 4000);
}

/* ---------- ОФОРМЛЕНИЕ ЗАЯВОК: выбор → проверка → файлы ---------- */
const AP = { step: 1, sel: new Set(), mode: 'need', inited: false, num: '', date: today(), comb: false, open: {} };
const fmtOf = e => lvOf(e) === 'w' ? 'x' : 'w';
const FMT = { x: 'Excel', w: 'Word' };
const CITS = [
  [/^(рф|росси|russia|russian|rf\b)/i, 'RUSSIA', 'РОССИЙСКАЯ ФЕДЕРАЦИЯ/RUSSIAN FEDERATION'],
  [/^(узбек|uzbek)/i, 'UZBEKISTAN', 'УЗБЕКИСТАН/UZBEKISTAN'], [/^(казах|kazakh)/i, 'KAZAKHSTAN', 'КАЗАХСТАН/KAZAKHSTAN'],
  [/^(таджик|tajik)/i, 'TAJIKISTAN', 'ТАДЖИКИСТАН/TAJIKISTAN'], [/^(кыргыз|киргиз|kyrgyz)/i, 'KYRGYZSTAN', 'КЫРГЫЗСТАН/KYRGYZSTAN'],
  [/^(беларус|белорус|belarus)/i, 'BELARUS', 'БЕЛАРУСЬ/BELARUS'], [/^(армен|armen)/i, 'ARMENIA', 'АРМЕНИЯ/ARMENIA'],
  [/^(азерб|azerb)/i, 'AZERBAIJAN', 'АЗЕРБАЙДЖАН/AZERBAIJAN'], [/^(молдо|moldov)/i, 'MOLDOVA', 'МОЛДОВА/MOLDOVA'],
  [/^(туркм|turkm)/i, 'TURKMENISTAN', 'ТУРКМЕНИСТАН/TURKMENISTAN'], [/^(украин|ukrain)/i, 'UKRAINE', 'УКРАИНА/UKRAINE'],
  [/^(египет|egypt)/i, 'EGYPT', 'ЕГИПЕТ/EGYPT'], [/^(грузи|georgia)/i, 'GEORGIA', 'ГРУЗИЯ/GEORGIA'],
];
const citX = v => { v = String(v || '').trim(); const c = CITS.find(x => x[0].test(v)); return c ? c[1] : v.toUpperCase(); };
const citW = v => { v = String(v || '').trim(); const c = CITS.find(x => x[0].test(v)); return c ? c[2] : v; };
const EFS = {
  fio: { l: 'ФИО по-русски', req: 'xw' }, lat: { l: 'ФИО латиницей', req: 'xw', up: 1 },
  pass: { l: 'Паспорт: серия и номер', req: 'xw' }, pIss: { l: 'Дата выдачи паспорта', t: 'date', req: 'x' },
  pExp: { l: 'Паспорт действует до', t: 'date', req: 'xw' }, birth: { l: 'Дата рождения', t: 'date', req: 'xw' },
  bplace: { l: 'Место рождения', req: 'xw' }, cit: { l: 'Гражданство', req: 'xw', list: 'apcits' },
  pos: { l: 'Должность', req: 'x' }, tab: { l: 'Табельный номер', req: 'xw', im: 'numeric' },
  stay: { l: 'Срок пребывания на объекте', def: 'stay', req: 'x' }, mvz: { l: 'Код подразделения (МВЗ)', def: 'mvz', req: 'w' },
  phone: { l: 'Мобильный телефон', t: 'tel', req: 'xw' }, wphone: { l: 'Рабочий телефон', t: 'tel' }, email: { l: 'Эл. почта', t: 'email', req: 'xw' },
};
const LFS = {
  date: { l: 'Дата поездки', t: 'date', req: 'xw', k: 'D' }, from: { l: 'Откуда', req: 'xw', k: 'From' }, to: { l: 'Куда', req: 'xw', k: 'To' },
  why: { l: 'Причина / цель поездки', sel: REASONS, k: 'Why', def: REASONS[0] }, tr: { l: 'Вид транспорта', sel: ['АВИА', 'ЖД'], k: 'Tr', def: 'АВИА' },
  next: { l: 'След. дата начала межсменки', t: 'date', k: 'Next' }, flight: { l: 'Рейс / поезд', k: 'Tk' },
};
const XF_E = ['fio', 'lat', 'pass', 'pIss', 'pExp', 'birth', 'bplace', 'cit', 'pos', 'tab', 'stay', 'phone', 'email'];
const WF_E = ['fio', 'lat', 'pass', 'pExp', 'birth', 'bplace', 'cit', 'tab', 'mvz', 'phone', 'wphone', 'email'];
const XF_L = ['why', 'tr', 'date', 'from', 'to', 'next'];
const WF_L = ['date', 'from', 'to', 'why', 'tr', 'flight'];
const eVal = (e, f) => { const v = e[f]; return (v == null || v === '') && EFS[f].def ? S(EFS[f].def) : (v || ''); };
const lVal = (l, f) => f === 'date' ? l.date : f === 'from' ? l.from : f === 'to' ? l.to : (l.t[l.k + LFS[f].k] || LFS[f].def || '');
function chkE(e, f, fmt, l) {
  const v = String(eVal(e, f) || '').trim(), sp = EFS[f], T = today();
  if (!v) return sp.req && sp.req.includes(fmt) ? ['err', 'не заполнено'] : null;
  switch (f) {
    case 'fio': if (/[a-z]/i.test(v)) return ['err', 'нужно по-русски']; if (v.split(/\s+/).length < 2) return ['warn', 'нужны фамилия и имя']; break;
    case 'lat': if (/[^A-Za-z\s\-']/.test(v)) return ['err', 'только латинские буквы']; if (v.split(/\s+/).length < 2) return ['warn', 'нужны фамилия и имя']; break;
    case 'pass': if (v.replace(/[^0-9A-Za-zА-Яа-я]/g, '').length < 6) return ['warn', 'слишком короткий номер']; break;
    case 'pIss': if (v > T) return ['err', 'дата выдачи в будущем']; if (e.birth && v < e.birth) return ['err', 'раньше даты рождения']; break;
    case 'pExp': if (v < T) return ['err', 'паспорт просрочен']; if (l && v < l.date) return ['err', 'истекает до поездки']; if (l && v < addD(l.date, 180)) return ['warn', 'меньше 6 мес. после поездки']; break;
    case 'birth': { if (v > T) return ['err', 'дата в будущем']; const age = (dn(T) - dn(v)) / 365.25; if (age < 16 || age > 80) return ['warn', 'проверьте год']; break; }
    case 'email': if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return ['err', 'неверный адрес']; break;
    case 'phone': case 'wphone': if (v.replace(/\D/g, '').length < 10) return ['err', 'мало цифр']; break;
    case 'tab': if (!/^\d+$/.test(v)) return ['warn', 'обычно только цифры']; break;
  }
  return null;
}
function chkL(l, f, fmt) {
  const v = String(lVal(l, f) || '').trim(), sp = LFS[f];
  if (!v) return sp.req && sp.req.includes(fmt) ? ['err', 'не заполнено'] : null;
  if (f === 'date' && v < today()) return ['err', 'дата уже прошла'];
  if (f === 'to' && norm(v) === norm(l.from)) return ['err', 'совпадает с «Откуда»'];
  if (f === 'next' && v < l.date) return ['warn', 'раньше даты поездки'];
  return null;
}
function apUnits() {
  const legs = [...AP.sel].map(legByKey).filter(l => l && l.fleft >= 0);
  legs.sort((a, b) => a.date.localeCompare(b.date) || a.e.fio.localeCompare(b.e.fio, 'ru'));
  const x = legs.filter(l => fmtOf(l.e) === 'x').map(l => ({ fmt: 'x', e: l.e, legs: [l], id: 'x:' + l.key }));
  const byE = {}; legs.filter(l => fmtOf(l.e) === 'w').forEach(l => (byE[l.e.id] = byE[l.e.id] || []).push(l));
  const w = []; Object.values(byE).forEach(ls => { for (let i = 0; i < ls.length; i += 2) w.push({ fmt: 'w', e: ls[0].e, legs: ls.slice(i, i + 2), id: 'w:' + ls[i].key }); });
  w.sort((a, b) => a.e.fio.localeCompare(b.e.fio, 'ru'));
  return { x, w, all: [...x, ...w] };
}
function unitIssues(u) {
  const out = [], EF = u.fmt === 'x' ? XF_E : WF_E, LF = u.fmt === 'x' ? XF_L : WF_L, last = u.legs[u.legs.length - 1];
  EF.forEach(f => { const r = chkE(u.e, f, u.fmt, last); if (r) out.push([r[0], EFS[f].l, r[1]]); });
  u.legs.forEach(l => LF.forEach(f => { const r = chkL(l, f, u.fmt); if (r) out.push([r[0], LFS[f].l, r[1]]); }));
  return out;
}
const nErrs = iss => iss.filter(x => x[0] === 'err').length;
function wizbar() {
  const U = apUnits(), nx = U.x.length, nw = U.w.length;
  const info = nx + nw ? `<b>${nx}</b> ${pl(nx, 'строка', 'строки', 'строк')} в Excel · <b>${nw}</b> ${pl(nw, 'заявка', 'заявки', 'заявок')} Word` : 'Никто не выбран';
  const back = AP.step > 1 ? `<button class="btn" data-do="ap:back">Назад</button>` : '';
  const next = AP.step === 1 ? `<button class="btn pri" data-do="ap:next" ${nx + nw ? '' : 'disabled'}>Проверить данные ${ic('arrow')}</button>` : AP.step === 2 ? `<button class="btn pri" data-do="ap:next">К файлам ${ic('arrow')}</button>` : '';
  return `<div class="wizbar"><div class="info">${info}</div>${back}${next}</div>`;
}
VIEWS.app = {
  head() {
    if (!emps().length) return emptyAll();
    if (!AP.inited) { AP.inited = true; if (!AP.sel.size) allLegs().filter(l => l.fleft >= 0 && !l.st && ['over', 'soon', 'notk'].includes(urg(l))).forEach(l => AP.sel.add(l.key)); }
    const st = (n, t) => `<button class="stp ${AP.step === n ? 'on' : ''} ${AP.step > n ? 'done' : ''}" data-apstep="${n}"><b>${AP.step > n ? ic('check') : n}</b>${t}</button>`;
    let h = `<div class="pagehead"><h2>Оформление заявок</h2></div><div class="steps2">${st(1, 'Кого')}${st(2, 'Проверка')}${st(3, 'Файлы')}</div>`;
    if (AP.step === 1) h += `<div class="banner blu">${ic('info')}<span class="sp"><b>Рабочие</b> — одна общая заявка Excel. <b>ИТР, офис и руководство</b> — у каждого своя заявка Word, вылет и прилёт одного человека в одной заявке.</span></div>
      <div class="toolbar">${searchBox('app', 'Поиск: ФИО, город')}<div class="chips"><button class="chip ${AP.mode === 'need' ? 'on' : ''}" data-apmode="need">Без заявки</button><button class="chip ${AP.mode === 'all' ? 'on' : ''}" data-apmode="all">Все рейсы</button></div></div>${lvChips()}
      <div class="chips" style="margin-top:8px"><button class="chip" data-do="ap:urgent">${ic('alert')}Выбрать срочные</button><button class="chip" data-do="ap:all">Выбрать всех в списке</button><button class="chip" data-do="ap:none">${ic('x')}Снять выбор</button></div>`;
    return h;
  },
  list() { if (!emps().length) return ''; return AP.step === 1 ? apPick() : AP.step === 2 ? apCheck() : apFiles(); }
};
const apList = () => allLegs().filter(l => l.fleft >= 0 && (AP.mode === 'all' || !l.st || AP.sel.has(l.key)) && byLvl(l.e) && matchQ(Q.app, l.e.fio, l.e.lat, l.from, l.to, l.e.pos)).sort((a, b) => a.dl.localeCompare(b.dl) || a.e.fio.localeCompare(b.e.fio, 'ru'));
function apPick() {
  const ls = apList();
  if (!ls.length) return `<div class="card empty" style="margin-top:12px">${ic('doc')}<h3>${Q.app || F.lvl ? 'Ничего не найдено' : 'Нет рейсов без заявки'}</h3><p>${AP.mode === 'need' ? 'Нажмите «Все рейсы», чтобы оформить заявку повторно.' : ''}</p></div>` + wizbar();
  let h = '';
  for (const [fmt, title] of [['x', 'Рабочие'], ['w', 'ИТР, офис и руководство']]) {
    const g = ls.filter(l => fmtOf(l.e) === fmt); if (!g.length) continue;
    h += `<div class="sec"><span class="fmt ${fmt}">${FMT[fmt]}</span>${title}<span class="n">${g.filter(l => AP.sel.has(l.key)).length} из ${g.length}</span></div><div class="list">`;
    g.forEach(l => {
      const sel = AP.sel.has(l.key), ne = nErrs(unitIssues({ fmt, e: l.e, legs: [l] }));
      h += `<div class="row pick ${sel ? 'sel' : ''}" data-pick="${l.key}">${av(l.e)}<div class="mn"><span class="nm">${esc(l.e.fio)}</span>
        <span class="l2"><span class="i">${ic(l.k === 'o' ? 'up' : 'down')}${LEG[l.k]} <b>${fd(l.date)}</b></span>${routeHtml(l)}</span>
        <div class="tags">${statusPill(l)}${ne ? `<span class="warn red">${ic('alert')}в данных ошибок: ${ne}</span>` : `<span class="warn ok">${ic('check')}данные полные</span>`}</div></div></div>`;
    });
    h += '</div>';
  }
  return h + wizbar();
}
function apSummary(U) {
  let ne = 0, nw = 0, bad = 0;
  U.all.forEach(u => { const iss = unitIssues(u), e = nErrs(iss); ne += e; nw += iss.length - e; if (e) bad++; });
  return ne ? `<div class="banner red">${ic('alert')}<span class="sp">Ошибок в данных: <b>${ne}</b> у ${bad} ${pl(bad, 'человека', 'человек', 'человек')}. Исправьте прямо здесь — всё сохранится в карточках сотрудников.</span></div>`
    : `<div class="allok">${ic('shield')}Все обязательные данные на месте${nw ? `, замечаний: ${nw}` : ''}</div>`;
}
function apCheck() {
  const U = apUnits(); if (!U.all.length) { AP.step = 1; return apPick(); }
  let h = `<div id="apSum">${apSummary(U)}</div>`;
  for (const [fmt, title] of [['x', 'Рабочие — общая заявка'], ['w', 'ИТР, офис и руководство — заявка на каждого']]) {
    const us = U[fmt]; if (!us.length) continue;
    h += `<div class="sec"><span class="fmt ${fmt}">${FMT[fmt]}</span>${title}<span class="n">${us.length}</span></div>`;
    us.forEach(u => h += apCard(u));
  }
  return h + `<datalist id="apcits">${['РФ', 'Беларусь', 'Узбекистан', 'Казахстан', 'Таджикистан', 'Кыргызстан', 'Армения', 'Азербайджан'].map(c => `<option value="${c}">`).join('')}</datalist>` + wizbar();
}
function unitHead(u, iss) {
  const ne = nErrs(iss), nw = iss.length - ne;
  return ne ? `<span class="pill red">${ic('alert')}ошибок: ${ne}</span>` : nw ? `<span class="pill yel">замечаний: ${nw}</span>` : `<span class="pill grn">${ic('check')}готово</span>`;
}
function apCard(u) {
  const iss = unitIssues(u), ne = nErrs(iss), open = AP.open[u.id] ?? (ne > 0);
  const tone = ne ? 'red' : iss.length ? 'yel' : 'grn';
  let h = `<div class="acard t-${tone}" data-unit="${u.id}"><div class="ah" data-aptog="${u.id}">${av(u.e).replace('data-av', 'data-avx')}<div class="mn"><span class="nm">${esc(u.e.fio)}</span><span class="l2">${u.legs.map(l => `${LEG[l.k]} ${fd(l.date)}`).join(' и ')}${routeHtml(u.legs[0])}</span></div><span data-ust>${unitHead(u, iss)}</span>${ic(open ? 'chu' : 'chd', 'chev')}</div>`;
  if (open) {
    const EF = u.fmt === 'x' ? XF_E : WF_E, LF = u.fmt === 'x' ? XF_L : WF_L, last = u.legs[u.legs.length - 1];
    h += `<div class="ab">` + u.legs.map(l => `<div class="legsub">${ic(l.k === 'o' ? 'up' : 'down')}${LEG[l.k]}</div><div class="afg">${LF.map(f => afL(l, f, u.fmt)).join('')}</div>`).join('');
    h += `<div class="legsub">${ic('users')}Сотрудник</div><div class="afg">${EF.map(f => afE(u.e, f, u.fmt, last)).join('')}</div>`;
    h += `<div class="ab-act"><button class="btn sm" data-apemp="${u.e.id}">${ic('users')} Карточка сотрудника</button><button class="btn sm" data-apdrop="${u.legs.map(l => l.key).join(',')}">${ic('x')} Убрать из заявки</button></div></div>`;
  }
  return h + '</div>';
}
function afHtml(key, label, val, type, c, o = {}) {
  const inp = o.sel ? `<select data-ak="${key}">${o.sel.map(x => `<option ${x === val ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`
    : `<input data-ak="${key}" type="${type || 'text'}" value="${esc(val)}"${o.ph ? ` placeholder="${esc(o.ph)}"` : ''}${o.list ? ` list="${o.list}"` : ''}${o.im ? ` inputmode="${o.im}"` : ''} autocomplete="off"${o.up ? ' style="text-transform:uppercase"' : ''}>`;
  return `<label class="af ${c ? c[0] : ''}"><span>${label}${o.req ? ' *' : ''}</span>${inp}<div class="msg">${c ? esc(c[1]) : o.out ? `<i>${esc(o.out)}</i>` : ''}</div></label>`;
}
const citOut = (e, fmt) => e.cit ? 'в заявке: ' + (fmt === 'x' ? citX(e.cit) : citW(e.cit)) : '';
function afE(e, f, fmt, l) { const sp = EFS[f]; return afHtml(`e|${e.id}|${f}|${fmt}|${l ? l.key : ''}`, sp.l, e[f] || '', sp.t, chkE(e, f, fmt, l), { ph: sp.def ? S(sp.def) : '', req: sp.req && sp.req.includes(fmt), up: sp.up, list: sp.list, im: sp.im, out: f === 'cit' ? citOut(e, fmt) : '' }); }
function afL(l, f, fmt) { const sp = LFS[f]; return afHtml(`l|${l.key}|${f}|${fmt}`, sp.l, lVal(l, f), sp.t, chkL(l, f, fmt), { sel: sp.sel, req: sp.req && sp.req.includes(fmt), ph: f === 'flight' ? 'если пусто — «' + lVal(l, 'tr') + '»' : '' }); }
function apField(i, final) {
  const [kind, id, f, fmt, lk] = i.dataset.ak.split('|');
  let v = final && i.tagName !== 'SELECT' ? i.value.trim() : i.value, c;
  if (kind === 'e') {
    const e = D.emp[id]; if (!e) return;
    if (EFS[f].up) v = v.toUpperCase();
    if (EFS[f].t === 'date' && v && !validIso(v)) return;
    setF(e, f, v); c = chkE(e, f, fmt, lk ? legByKey(lk) : null);
    if (final) $$(`[data-ak^="e|${id}|${f}|"]`).forEach(x => { if (x !== i) x.value = e[f] || ''; });
  } else {
    let l = legByKey(id); if (!l) return;
    if (f === 'date') { if (!validIso(v)) { c = ['err', 'укажите дату']; } else setF(l.t, l.k + 'D', v); }
    else setF(l.t, l.k + LFS[f].k, v);
    l = legByKey(id); if (!c) c = l ? chkL(l, f, fmt) : null;
  }
  save(false);
  const lab = i.closest('.af');
  lab.classList.toggle('err', !!c && c[0] === 'err'); lab.classList.toggle('warn', !!c && c[0] === 'warn');
  lab.querySelector('.msg').innerHTML = c ? esc(c[1]) : (f === 'cit' && kind === 'e' ? `<i>${esc(citOut(D.emp[id], fmt))}</i>` : '');
  if (final) {
    const U = apUnits();
    $$('.acard').forEach(card => { const u = U.all.find(x => x.id === card.dataset.unit); if (!u) return; const iss = unitIssues(u); card.querySelector('[data-ust]').innerHTML = unitHead(u, iss); card.className = card.className.replace(/t-\w+/, 't-' + (nErrs(iss) ? 'red' : iss.length ? 'yel' : 'grn')); });
    const s = $('#apSum'); if (s) s.innerHTML = apSummary(U);
  }
}
function apFiles() {
  const U = apUnits(); if (!U.all.length) { AP.step = 1; return apPick(); }
  const ne = U.all.reduce((s, u) => s + nErrs(unitIssues(u)), 0);
  let h = ne ? `<div class="banner red">${ic('alert')}<span class="sp">Осталось ошибок в данных: <b>${ne}</b>. Файлы сформируются, но эти клетки будут пустыми или неверными.</span><button class="btn sm" data-do="ap:back">Исправить</button></div>` : `<div class="allok">${ic('shield')}Данные проверены — можно формировать</div>`;
  h += `<div class="card"><h3>${ic('doc')}Номер и дата заявки</h3><div class="cols"><label class="fld"><span>Номер заявки</span><input data-apf="num" value="${esc(AP.num)}" placeholder="можно оставить пустым" autocomplete="off"></label><label class="fld"><span>Дата заявки</span><input type="date" data-apf="date" value="${esc(AP.date)}"></label></div><p class="small" style="margin:0">Пустой номер останется в бланке линией «____», его можно вписать от руки.</p></div><div class="grid2">`;
  if (U.x.length) h += `<div class="card"><h3><span class="fmt x">Excel</span>Рабочие — общая заявка</h3><p>${U.x.length} ${pl(U.x.length, 'строка', 'строки', 'строк')}: ${esc([...new Set(U.x.map(u => u.e.fio.split(/\s+/)[0]))].join(', '))}. Подписи и примечание о медосмотре — как в вашем бланке, выпадающий список причин работает.</p><div class="btns"><button class="btn pri" data-do="ap:xls">${ic('download')} Скачать Excel</button></div></div>`;
  if (U.w.length) h += `<div class="card"><h3><span class="fmt w">Word</span>ИТР, офис и руководство</h3><p>${U.w.length} ${pl(U.w.length, 'заявка', 'заявки', 'заявок')}: ${esc(U.w.map(u => short(u.e.fio)).join(', '))}.</p><div class="seg" style="margin-bottom:10px"><button type="button" data-apcomb="0" class="${!AP.comb ? 'on' : ''}">Каждая отдельным файлом</button><button type="button" data-apcomb="1" class="${AP.comb ? 'on' : ''}">Все в одном файле</button></div><div class="btns"><button class="btn pri" data-do="ap:doc">${ic('download')} Скачать Word</button></div></div>`;
  h += `</div>`;
  if (U.x.length && U.w.length) h += `<div class="btns" style="display:flex;margin-bottom:12px"><button class="btn big pri" style="flex:1" data-do="ap:allz">${ic('download')} Скачать всё одним архивом</button></div>`;
  h += `<details class="card"><summary>${ic('gear')} Реквизиты в заявке Word и значения по умолчанию</summary><p>Пустые поля — как в вашем бланке. Настройки передаются на другое устройство при обмене.</p>
    <div class="cols"><label class="fld"><span>Организация заказчика</span><input data-set="org" value="${esc(D.set.org || '')}" placeholder="ООО «Трест РосСЭМ»"></label><label class="fld"><span>Номер договора</span><input data-set="contract" value="${esc(D.set.contract || '')}" placeholder="как в бланке (пусто)"></label></div>
    <div class="cols"><label class="fld"><span>Контактное лицо</span><input data-set="cName" value="${esc(D.set.cName || '')}" placeholder="как в бланке"></label><label class="fld"><span>Его эл. почта</span><input data-set="cMail" value="${esc(D.set.cMail || '')}" placeholder="как в бланке"></label></div>
    <div class="cols"><label class="fld"><span>Рабочий телефон</span><input data-set="cWork" value="${esc(D.set.cWork || '')}" placeholder="как в бланке"></label><label class="fld"><span>Мобильный</span><input data-set="cMob" value="${esc(D.set.cMob || '')}" placeholder="как в бланке"></label></div>
    <div class="cols"><label class="fld"><span>Код МВЗ по умолчанию</span><input data-set="mvz" value="${esc(D.set.mvz || '')}" placeholder="${esc(DEF.mvz)}"></label><label class="fld"><span>Срок пребывания по умолчанию</span><input data-set="stay" value="${esc(D.set.stay || '')}" placeholder="${esc(DEF.stay)}"></label></div></details>`;
  h += `<p class="small muted">Бланки — ваши: «Заявка» для рабочих (Excel) и «Заявка на приобретение билетов» (Word). Если подписанты поменяются, замените бланк в разделе «Обмен» → «Бланки заявок».</p>`;
  return h + wizbar();
}
/* бланки: свой (из IndexedDB) или встроенный */
async function tplBuf(kind) {
  try { const v = await IDB.get('tpl:' + kind); if (v && v.buf) return v.buf; } catch (e) { }
  const r = await fetch(kind === 'xlsx' ? 'shablon/rabochie.xlsx' : 'shablon/itr.docx'); if (!r.ok) throw new Error('Бланк не найден. Обновите приложение при интернете.');
  return r.arrayBuffer();
}
const apDateRu = () => { const d = AP.date || today(); return `${+d.slice(8)} ${MONG[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`; };
async function buildXls(U) {
  const rows = U.x.map((u, i) => {
    const e = u.e, l = u.legs[0], tab = String(e.tab || '').trim(), nx = lVal(l, 'next');
    return { A: i + 1, B: lVal(l, 'why'), C: `${e.fio || ''}/ ${(e.lat || '').toUpperCase()}`, D: lVal(l, 'tr'), E: validIso(nx) ? { d: nx } : '', F: { d: l.date }, G: `${l.from || ''}-${l.to || ''}`, H: e.pass || '', I: validIso(e.pIss) ? { d: e.pIss } : '', J: validIso(e.pExp) ? { d: e.pExp } : '', K: e.bplace || '', L: validIso(e.birth) ? { d: e.birth } : '', M: e.pos || '', N: /^\d{1,15}$/.test(tab) ? +tab : tab, O: eVal(e, 'stay'), P: citX(e.cit), Q: e.phone || '', R: e.email || '' };
  });
  const sur = [...new Set(U.x.map(u => u.e.fio.split(/\s+/)[0]))].join(', ');
  return { name: fname(`Заявка рабочие ${fd(AP.date)}${AP.num ? ' №' + AP.num : ''} (${U.x.length} чел).xlsx`), blob: await ZV.fillXlsx(await tplBuf('xlsx'), rows, { title: `ЗАЯВКА № ${AP.num || '________'} от ${apDateRu()} ГОДА`, sheetName: sur }) };
}
async function buildDocs(U) {
  const apps = U.w.map(u => { const e = u.e; return { fio: e.fio || '', lat: (e.lat || '').toUpperCase(), pass: e.pass || '', pExp: fd(e.pExp), birth: fd(e.birth), cit: citW(e.cit), bplace: e.bplace || '', mvz: eVal(e, 'mvz'), tab: e.tab || '', wphone: e.wphone || '', email: e.email || '', phone: e.phone || '', date: fd(AP.date), rail: lVal(u.legs[0], 'tr') === 'ЖД', legs: u.legs.map(l => ({ date: fd(l.date), flight: l.tk || lVal(l, 'tr'), from: l.from, to: l.to, why: lVal(l, 'why') })) }; });
  const o = { num: AP.num, date: fd(AP.date), combined: AP.comb, org: D.set.org, contract: D.set.contract, cName: D.set.cName, cWork: D.set.cWork, cMob: D.set.cMob, cMail: D.set.cMail };
  const blobs = await ZV.fillDocx(await tplBuf('docx'), apps, o);
  if (AP.comb) return [{ name: fname(`Заявки ИТР ${fd(AP.date)} (${U.w.length}).docx`), blob: blobs[0] }];
  const seen = {};
  return blobs.map((b, i) => { const u = U.w[i]; let n = fname(`Заявка ${short(u.e.fio)} ${fd(u.legs[0].date)}.docx`); seen[n] = (seen[n] || 0) + 1; if (seen[n] > 1) n = n.replace(/\.docx$/, ` (${seen[n]}).docx`); return { name: n, blob: b }; });
}
async function apDownload(what) {
  if (busy) return; const U = apUnits(); if (!U.all.length) return toast('Никто не выбран');
  busy = true; toast('Формирую файлы…', 1500);
  let units = [];
  try {
    const files = [];
    if ((what === 'xls' || what === 'all') && U.x.length) { files.push(await buildXls(U)); units.push(...U.x); }
    if ((what === 'doc' || what === 'all') && U.w.length) { files.push(...await buildDocs(U)); units.push(...U.w); }
    if (!files.length) return;
    if (files.length === 1) { const r = await shareOrDownload(files[0].blob, files[0].name, files[0].blob.type, !isPC()); if (r === 'abort') return; }
    else {
      let shared = false;
      if (!isPC() && navigator.canShare) {
        const fs = files.map(f => new File([f.blob], f.name, { type: f.blob.type }));
        try { if (navigator.canShare({ files: fs })) { await navigator.share({ files: fs, title: 'Заявки' }); shared = true; } } catch (e) { if (e.name === 'AbortError') return; }
      }
      if (!shared) { const z = new JSZip(); files.forEach(f => z.file(f.name, f.blob)); download(await z.generateAsync({ type: 'blob' }), fname(`Заявки ${fd(AP.date)}${AP.num ? ' №' + AP.num : ''}.zip`)); }
    }
    toast(`Готово: ${files.length} ${pl(files.length, 'файл', 'файла', 'файлов')}`);
  } catch (e) { busy = false; return ask({ title: 'Не получилось сформировать файл', text: esc(e.message || String(e)), cancel: null }); }
  finally { busy = false; }
  const legs = units.flatMap(u => u.legs).filter(l => !l.st);
  if (legs.length && await ask({ title: 'Отметить заявки поданными?', text: `Для ${legs.length} ${pl(legs.length, 'рейса', 'рейсов', 'рейсов')} поставить «заявка подана» с датой ${fd(AP.date)}. В списке они станут синими.`, ok: 'Отметить', cancel: 'Пока нет' })) {
    legs.forEach(l => { setF(l.t, l.k + 'S', 'sent'); setF(l.t, l.k + 'Sent', AP.date || today()); });
    save(); render(); toast('Отмечено: ' + legs.length);
  }
}
async function tplAct(op, kind) {
  const nm = kind === 'xlsx' ? 'Заявка рабочие (бланк).xlsx' : 'Заявка ИТР (бланк).docx';
  if (op === 'dl') { const b = new Blob([await tplBuf(kind)], { type: kind === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }); return shareOrDownload(b, nm, b.type, false); }
  if (op === 'reset') { await IDB.del('tpl:' + kind).catch(() => { }); render(); return toast('Возвращён встроенный бланк'); }
  if (op === 'up') {
    const f = await pickFile(kind === 'xlsx' ? '.xlsx' : '.docx'); if (!f) return;
    const buf = await f.arrayBuffer();
    let ok = false; try { ok = kind === 'xlsx' ? await ZV.checkXlsx(buf) : await ZV.checkDocx(buf); } catch (e) { }
    if (!ok) return ask({ title: 'Это не похоже на бланк заявки', text: kind === 'xlsx' ? 'В бланке Excel должна быть строка заголовков с «Причина поездки» и «Ф.И.О.».' : 'В бланке Word должны быть строки «Персональные данные работника» и «Фамилия Имя Отчество».', cancel: null });
    await IDB.put('tpl:' + kind, { type: f.type, buf, at: Date.now(), name: f.name });
    render(); toast('Бланк заменён. Проверьте его: сформируйте пробную заявку.', 4000);
  }
}
async function tplInfo() {
  const el = $('#tplInfo'); if (!el) return;
  const st = {}; for (const k of ['xlsx', 'docx']) { try { st[k] = await IDB.get('tpl:' + k); } catch (e) { st[k] = null; } }
  const row = (k, t) => `<div class="tplrow"><div><b>${t}</b><div class="small muted">${st[k] ? `ваш файл «${esc(st[k].name || '')}», заменён ${ftime(st[k].at)}` : 'встроенный — ваш бланк от 20.10.2026'}</div></div><div class="btns"><button class="btn sm" data-do="tpl:dl:${k}">${ic('download')} Скачать</button><button class="btn sm" data-do="tpl:up:${k}">${ic('upload')} Заменить</button>${st[k] ? `<button class="btn sm" data-do="tpl:reset:${k}">Вернуть встроенный</button>` : ''}</div></div>`;
  el.innerHTML = row('xlsx', 'Рабочие — Excel') + row('docx', 'ИТР, офис, руководство — Word');
}

/* ---------- действия ---------- */
async function act(a) {
  if (a === 'export') return exportFile();
  if (a === 'exportdl') return exportFile('download');
  if (a === 'exportfull') return exportFile('full');
  if (a === 'import') return importAny(await pickFile('.vyl,.txt,.json,.xlsx,.csv,application/json,text/plain,application/octet-stream'));
  if (a === 'xlsin') return startImport(await pickFiles('.xlsx,.xlsm,.csv,.docx,.xls,.doc'));
  if (a === 'xlsout') return emps().length ? exportXlsx() : toast('Пока нет сотрудников');
  if (a === 'xlstpl') return xlsTemplate();
  if (a === 'ics') return icsFile();
  if (a === 'legend') return legend();
  if (a.startsWith('ap:')) {
    const c = a.slice(3);
    if (c === 'next') { if (!apUnits().all.length) return toast('Выберите хотя бы одного человека'); AP.step = Math.min(3, AP.step + 1); render(); return window.scrollTo(0, 0); }
    if (c === 'back') { AP.step = Math.max(1, AP.step - 1); render(); return window.scrollTo(0, 0); }
    if (c === 'urgent') { const ls = apList().filter(l => !l.st && ['over', 'soon', 'notk'].includes(urg(l))); ls.forEach(l => AP.sel.add(l.key)); renderList(); return toast(ls.length ? 'Выбрано срочных: ' + ls.length : 'Срочных нет'); }
    if (c === 'all') { apList().forEach(l => AP.sel.add(l.key)); return renderList(); }
    if (c === 'none') { AP.sel.clear(); return renderList(); }
    if (c === 'xls' || c === 'doc') return apDownload(c);
    if (c === 'allz') return apDownload('all');
  }
  if (a.startsWith('tpl:')) { const [, op, kind] = a.split(':'); return tplAct(op, kind); }
  if (a === 'newemp') return editEmp(null, F.lvl ? { lvl: F.lvl } : null);
  if (a === 'newtrip') return emps().length ? editTrip(null) : toast('Сначала добавьте сотрудника');
  if (a.startsWith('tog:')) { const k = a.slice(4); F[k] = !F[k]; return renderList(); }
  if (a === 'dups') return mergeDups();
  if (a === 'demo') { demo(); save(); shell(); return render(); }
  if (a === 'undemo') {
    Object.values(D.emp).concat(Object.values(D.trip)).filter(x => x.demo && alive(x)).forEach(delRec);
    save(); shell(); render(); return toast('Пример удалён');
  }
  if (a === 'rename') { const n = await ask({ title: 'Название устройства', text: 'Видно в файле обмена, чтобы понимать, откуда он.', input: 'text', value: L.name, ok: 'Сохранить' }); if (n && n.trim()) { L.name = n.trim().slice(0, 30); save(); render(); } return; }
  if (a === 'savepwd') {
    const v = $('#pwd').value;
    if (v && v.length < 4) return toast('Пароль слишком короткий (от 4 символов)');
    L.pwd = v; save(); render(); return toast(v ? 'Пароль сохранён. Поставьте такой же на другом устройстве.' : 'Пароль убран', 4000);
  }
  if (a === 'install' && installEv) { installEv.prompt(); installEv = null; return; }
  if (a === 'wipe') {
    if (!await ask({ title: 'Стереть данные на этом устройстве?', text: 'Сотрудники, поездки и фото удалятся только здесь. Если перед этим не отправить файл, изменения с этого устройства пропадут.', ok: 'Стереть', danger: true })) return;
    if (!await ask({ title: 'Точно стереть?', text: 'Отменить будет нельзя.', ok: 'Да, стереть', danger: true })) return;
    D = { v: 2, emp: {}, trip: {}, doc: {}, set: { _t: {} } }; L.dirty = {}; L.phOut = {}; L.seen = 1;
    try { await IDB.clear(); } catch (e) { } HAVE = new Set();
    save(); shell(); render(); toast('Данные стёрты');
  }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-do]'); if (b) { e.preventDefault(); act(b.dataset.do); } });
$('#fab').onclick = () => TAB === 'emp' ? act('newemp') : act('newtrip');
$('#topSync').onclick = () => go('sync');

/* клавиатура */
document.addEventListener('keydown', e => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); return exportFile(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') { e.preventDefault(); return act('import'); }
  if (e.key === 'Escape') { if ($('#modal')) return; if ($('#viewer')) return closeViewer(); if (STACK.length) return closeTop(); if (SEL.size) { SEL.clear(); renderList(); } return; }
  if (typing || e.ctrlKey || e.metaKey || e.altKey || STACK.length || $('#modal') || $('#viewer')) return;
  if (e.key === '/') { const s = $('[data-q]'); if (s) { e.preventDefault(); s.focus(); } }
  else if (e.key.toLowerCase() === 'n' || e.key.toLowerCase() === 'т') { e.preventDefault(); TAB === 'emp' ? act('newemp') : act('newtrip'); }
  else if (/^[1-5]$/.test(e.key)) go(TABS[+e.key - 1][0]);
});
/* вставка картинки из буфера в карточку сотрудника (ПК) */
document.addEventListener('paste', e => {
  if (!curEmp || $('#modal') || $('#viewer') || !$('#sheet1')._addDocs) return;
  const files = Array.from(e.clipboardData && e.clipboardData.files || []).filter(f => /^image\/|pdf/.test(f.type));
  if (files.length) { e.preventDefault(); $('#sheet1')._addDocs(files); }
});

/* перетаскивание файла (ПК) */
let dragN = 0;
window.addEventListener('dragenter', e => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { dragN++; $('#drop').textContent = curEmp ? 'Отпустите, чтобы прикрепить к сотруднику' : 'Отпустите файл, чтобы принять данные'; $('#drop').classList.add('on'); } });
window.addEventListener('dragleave', () => { if (--dragN <= 0) { dragN = 0; $('#drop').classList.remove('on'); } });
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => {
  e.preventDefault(); dragN = 0; $('#drop').classList.remove('on');
  const fs = Array.from(e.dataTransfer.files || []); if (!fs.length) return;
  const media = fs.filter(f => /^image\/|application\/pdf/.test(f.type) || /\.(jpe?g|png|pdf|heic|webp)$/i.test(f.name));
  if (curEmp && media.length && $('#sheet1')._addDocs) return $('#sheet1')._addDocs(media);
  const office = fs.filter(f => /\.(xlsx|xlsm|csv|docx|xls|doc)$/i.test(f.name));
  if (office.length) return startImport(office);
  importAny(fs[0]);
});
if ('launchQueue' in window) launchQueue.setConsumer(async p => { if (p.files && p.files.length) importAny(await p.files[0].getFile()); });
async function inbox() {
  if (!/[?&]inbox=1/.test(location.search) || !('caches' in window)) return;
  history.replaceState(null, '', location.pathname);
  try {
    const c = await caches.open('vylety-inbox'); const r = await c.match('inbox');
    if (r) { const name = decodeURIComponent(r.headers.get('X-Name') || 'file.vyl'); const b = await r.blob(); await c.delete('inbox'); importAny(new File([b], name)); }
  } catch (e) { toast('Не удалось открыть присланный файл'); }
}

/* установка и обновление */
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEv = e; if (TAB === 'sync') render(); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').then(reg => {
    const onNew = w => w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdate(w); });
    if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => onNew(reg.installing));
    setInterval(() => reg.update().catch(() => { }), 3600e3);
  }).catch(() => { });
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
}
function showUpdate(w) {
  if ($('#upd')) return;
  const b = document.createElement('div'); b.id = 'upd'; b.className = 'banner blu'; b.style.cssText = 'position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top,0px) + 12px);z-index:80;max-width:520px;margin:0 auto;box-shadow:var(--sh2)';
  b.innerHTML = `${ic('download')}<span class="sp">Готова новая версия приложения. Данные сохранятся.</span><button class="btn sm pri">Обновить</button>`;
  b.querySelector('button').onclick = () => w.postMessage('skipWaiting');
  document.body.appendChild(b);
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => { if (!p) navigator.storage.persist(); });

/* старт */
{ const m = location.search.match(/[?&]tab=(req|app|sch|emp|sync)/); if (m) { TAB = L.tab = m[1]; history.replaceState(null, '', location.pathname); } }
if (!TABS.some(t => t[0] === TAB)) TAB = 'req';
if (!L.seen && !Object.keys(D.emp).length) { demo(); L.seen = 1; save(); }
L.seen = 1;
let wasPC = isPC();
matchMedia('(min-width:900px)').addEventListener('change', () => { if (isPC() !== wasPC) { wasPC = isPC(); shell(); render(); } });
window.addEventListener('storage', e => { if (e.key === KEY) { D = load(); render(); badges(); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden && !STACK.length && !$('#viewer') && !$('#modal') && !(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) render(); });
shell(); render();
IDB.keys().then(k => { HAVE = new Set(k); badges(); if (TAB === 'sync') render(); }).catch(() => { }).finally(inbox);
