'use strict';
/* ===== Вылеты сотрудников — офлайн-приложение для телефона и ПК ===== */
const VER = '2.0';
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

const DEF = { lead: 45, warn: 7, tkw: 14, dest: '' };
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
const allLegs = () => trips().flatMap(legsOf);
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
  if (!e.pass) a.push(['нет паспорта', 'red']);
  else if (e.pExp) {
    if (e.pExp < t) a.push(['паспорт просрочен', 'red']);
    else if (e.pExp < addD(nl ? nl.date : t, 180)) a.push(['паспорт до ' + fd(e.pExp), 'org']);
  }
  return a;
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
let TAB = L.tab, Q = { req: '', sch: '', emp: '' }, SEL = new Set(), F = { sch: 'all', past: false, emp: 'all', lvl: '' };
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

const TABS = [['req', 'Заявки', 'req'], ['sch', 'График', 'cal'], ['emp', 'Сотрудники', 'users'], ['sync', 'Обмен', 'sync']];
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
  $('#fab').classList.toggle('hide', TAB === 'sync');
  $('#fab').setAttribute('aria-label', TAB === 'emp' ? 'Добавить сотрудника' : 'Добавить поездку');
  $('#ttl').textContent = { req: 'Заявки и билеты', sch: 'График вылетов', emp: 'Сотрудники', sync: 'Обмен и настройки' }[TAB];
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
  bulkBar();
  window.scrollTo(0, y);
}
function renderList() { const r = $('#res'); if (!r) return render(); r.innerHTML = VIEWS[TAB].list(); bindRes(r); bulkBar(); }
const searchBox = (k, ph) => `<div class="search">${ic('search')}<input type="search" data-q="${k}" placeholder="${ph}" value="${esc(Q[k])}" enterkeyhint="search" autocomplete="off" aria-label="Поиск"></div>`;
const matchQ = (q, ...xs) => { q = norm(q); if (!q) return true; const s = norm(xs.join(' ')); return q.split(' ').every(w => s.includes(w)); };
const demoBanner = () => hasDemo() ? `<div class="banner blu">${ic('info')}<span class="sp">Сейчас показан <b>пример</b> с вымышленными людьми, чтобы было видно, как всё работает.</span><button class="btn sm" data-do="undemo">Удалить пример</button></div>` : '';
function lvChips() {
  const es = emps(), n = l => es.filter(e => lvOf(e) === l).length;
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
    <div class="c"><span class="nm one">${esc(l.e.fio)}</span><span class="small muted one">${lvTag(l.e)} ${esc(l.e.pos || '')}</span></div>
    <div class="c"><span class="l2">${kind}${flyIn(l)}</span><span class="l2">${routeHtml(l)}</span></div>
    <div class="c"><div class="wrapt">${statusPill(l)}${tkChip(l)}${w}</div></div>
    <div class="c"><div class="act">${btn}</div></div></div>`;
  return `<div class="row t-${tone} ${sel ? 'sel' : ''}" data-leg="${l.key}">${av(l.e)}<div class="mn">
    <span class="nm">${esc(l.e.fio)}</span>
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
  <div style="justify-content:center;display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn pri" data-do="newemp">${ic('plus')} Сотрудник</button><button class="btn" data-do="xlsin">${ic('xls')} Из Excel</button><button class="btn" data-do="import">${ic('inbox')} Принять файл</button><button class="btn" data-do="demo">Показать пример</button></div></div>`;
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
    const nIss = all.filter(e => issues(e, nextLeg(e.id)).length).length;
    let h = demoBanner();
    const dd = dups();
    if (dd.length) h += `<div class="banner">${ic('alert')}<span class="sp">Похоже на дубли: ${dd.map(a => `<b>${esc(short(a[0].fio))}</b> ×${a.length}`).join(', ')}. Так бывает, если человека добавили и на телефоне, и на ПК.</span><button class="btn sm" data-do="dups">Объединить</button></div>`;
    h += `<div class="pagehead"><h2>Сотрудники <span class="muted" style="font-weight:400">${all.length}</span></h2></div>`;
    h += `<div class="toolbar">${searchBox('emp', 'ФИО, город, телефон, паспорт')}<div class="chips"><button class="chip ${F.emp === 'all' ? 'on' : ''}" data-f="emp:all">Все</button><button class="chip ${F.emp === 'iss' ? 'on' : ''}" data-f="emp:iss">${ic('alert')}Паспорт${nIss ? ` <span class="n">${nIss}</span>` : ''}</button><button class="chip ${F.emp === 'notrip' ? 'on' : ''}" data-f="emp:notrip">Без поездок</button></div>${isPC() ? `<button class="btn pri" data-do="newemp">${ic('plus')} Сотрудник</button>` : ''}</div>`;
    h += lvChips();
    return h;
  },
  list() {
    const all = emps(); if (!all.length) return '';
    const q = Q.emp;
    const rows = all.filter(byLvl).map(e => { const nl = nextLeg(e.id); return { e, nl, iss: issues(e, nl), nd: docsOf(e.id).length }; })
      .filter(x => matchQ(q, x.e.fio, x.e.lat, x.e.city, x.e.air, x.e.phone, x.e.email, x.e.pos, x.e.pass))
      .filter(x => F.emp === 'all' || (F.emp === 'iss' && x.iss.length) || (F.emp === 'notrip' && !x.nl));
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
        if (pc) h += `<div class="tr ${sel ? 'sel' : ''}" data-emp="${e.id}">${av(e)}
          <div class="c"><span class="nm one">${esc(e.fio)}</span><span class="small muted one">${esc(e.pos || LV[lvOf(e)].one)}</span></div>
          <div class="c"><span class="one">${esc(e.city || '—')}</span>${e.air && e.air !== e.city ? `<span class="small muted one">вылет из: ${esc(e.air)}</span>` : ''}</div>
          <div class="c"><span class="one">${esc(e.phone || '—')}</span><span class="small muted one">${esc(e.email || '')}</span></div>
          <div class="c">${w ? `<div class="wrapt">${w}</div>` : `<span class="one">${e.pExp ? 'до ' + fd(e.pExp) : (e.pass ? 'есть' : '—')}</span>`}${docs}</div>
          <div class="c">${nl ? `<span class="l2"><span class="i">${ic(nl.k === 'o' ? 'up' : 'down')}${LEG[nl.k]} <b>${fd(nl.date)}</b></span>${flyIn(nl)}</span><div class="wrapt">${tkChip(nl)}</div>` : '<span class="muted small">поездок нет</span>'}</div></div>`;
        else h += `<div class="row ${sel ? 'sel' : ''}" data-emp="${e.id}">${av(e)}<div class="mn"><span class="nm">${esc(e.fio)}</span>
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
    <div class="btns"><button class="btn" data-do="xlsout">${ic('download')} Скачать Excel</button><button class="btn" data-do="xlsin">${ic('upload')} Загрузить из Excel</button></div>
    <div class="btns" style="margin-top:8px"><button class="btn sm" data-do="xlstpl">Пустой шаблон для заполнения</button></div>
  </div></div><div>
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
  $$('[data-lvl]', v).forEach(b => b.onclick = () => { F.lvl = b.dataset.lvl; SEL.clear(); render(); });
  $$('[data-jump]', v).forEach(b => b.onclick = () => {
    const k = b.dataset.jump;
    if (k === 'tk' && !F.o_tk) { F.o_tk = true; renderList(); }
    const el = $('#g-' + k) || (k === 'notk' ? $('#g-over') : null);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (isPC() ? 16 : 70), behavior: 'smooth' }); else toast('Здесь пусто');
  });
  $$('[data-set]', v).forEach(i => i.onchange = () => {
    let val = i.value.trim(); const k = i.dataset.set;
    if (k !== 'dest') { val = Math.max(+i.min, Math.min(+i.max, parseInt(val) || DEF[k])); i.value = val; }
    setF(D.set, k, val); L.dirty.set = 1; save(); badges(); toast('Сохранено');
  });
  if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(p => { const el = $('#persist'); if (el) el.textContent = p ? 'на устройстве, защищено от автоочистки' : 'в памяти этого браузера'; });
}
function bindRes(r) {
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
  document.body.classList.toggle('bulk-on', !!SEL.size && TAB !== 'sync');
  if (!SEL.size || TAB === 'sync') { b.classList.add('hide'); return; }
  b.classList.remove('hide');
  const n = SEL.size, x = `<button class="ibtn" data-b="clr" aria-label="Снять выбор">${ic('x')}</button>`, x2 = isPC() ? `<button class="btn sm" data-b="clr" aria-label="Снять выбор">${ic('x')}</button>` : '';
  if (TAB === 'emp') b.innerHTML = `<span class="t">Выбрано: ${n}${x}</span><div class="bb"><button class="btn sm ok" data-b="grouptrip">${ic('up')} Поездка</button><button class="btn sm" data-b="photos">${ic('image')} Фото</button><button class="btn sm" data-b="empxls">${ic('xls')} Excel</button><button class="btn sm" data-b="all">Все</button><button class="btn sm" data-b="empdel" aria-label="Удалить">${ic('trash')}</button>${x2}</div>`;
  else b.innerHTML = `<span class="t">Выбрано: ${n}${x}</span><div class="bb"><button class="btn sm ok" data-b="sent">${ic('check')} Заявка подана</button><button class="btn sm ok" data-b="tk">${ic('ticket')} Билет есть</button><button class="btn sm" data-b="reqxls">${ic('xls')} Excel для заявки</button><button class="btn sm" data-b="photos">${ic('image')} Фото</button><button class="btn sm" data-b="copy">${ic('copy')} Текст</button>${x2}</div>`;
  $$('[data-b]', b).forEach(y => y.onclick = () => bulk(y.dataset.b));
}
async function bulk(a) {
  const keys = [...SEL];
  if (a === 'clr') { SEL.clear(); return renderList(); }
  if (a === 'all') { emps().filter(byLvl).forEach(e => SEL.add(e.id)); return renderList(); }
  if (a === 'sent' || a === 'tk') return mark(keys, a);
  if (a === 'reqxls') return reqXlsx(keys.map(legByKey).filter(Boolean));
  if (a === 'copy') return copyReq(keys.map(legByKey).filter(Boolean));
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
  const headHtml = () => `<div class="ehead">${av(r, 1).replace('data-av', 'data-avx')}<div style="min-width:0"><div class="nm">${esc(r.fio || 'Новый сотрудник')}</div><div class="small muted">${lvTag(r)}${r.pos ? ' · ' + esc(r.pos) : ''}</div></div></div>`;
  const docsHtml = () => `<div class="docs">${docsOf(r.id).map(d => `<button type="button" class="doc ${HAVE.has(d.id) ? '' : 'miss'}" data-doc="${d.id}" title="${esc(d.name || '')}">${/^image\//.test(d.type) && HAVE.has(d.id) ? `<img data-thumb="${d.id}" alt="">` : HAVE.has(d.id) ? ic('file') + 'PDF' : ic('image') + 'на другом устройстве'}<span class="k">${KIND[d.kind] || 'Документ'}</span></button>`).join('')}</div>`;
  const body = () => {
    const tl = D.emp[r.id] ? tripsOf(r.id) : [], nd = docsOf(r.id).length;
    return `<div id="eHead">${headHtml()}</div><div id="issBox">${issHtml()}</div>
    <div class="grp">Уровень</div>
    <div class="seg lvls" data-lvseg>${Object.entries(LV).map(([k, v]) => `<button type="button" data-v="${k}" class="${v.c} ${lvOf(r) === k ? 'on' : ''}">${ic(v.i)}${v.n}</button>`).join('')}</div>
    <div class="grp">Сотрудник</div>
    ${fld('fio', 'ФИО *', 'text', 'placeholder="Фамилия Имя Отчество" autocomplete="off" autocapitalize="words"')}
    ${fld('lat', 'ФИО латиницей, как в загранпаспорте', 'text', 'placeholder="IVANOV IVAN" style="text-transform:uppercase" autocomplete="off" autocapitalize="characters"')}
    ${fld('pos', 'Должность', 'text', 'list="poss" autocomplete="off"')}
    <div class="grp">Города</div>
    <div class="cols">${fld('city', 'Базовый город', 'text', 'placeholder="где живёт" list="cities" autocomplete="off"')}${fld('air', 'Обычно вылетает из', 'text', `placeholder="${esc(r.city || 'если не из базового')}" list="cities" autocomplete="off"`)}</div>
    <div class="fld" style="margin-top:-6px"><div class="hint">Например, живёт в Туле, а летает из Москвы. В каждой поездке город вылета и прилёта можно поменять отдельно.</div></div>
    <div class="grp">Контакты</div>
    <label class="fld"><span>Телефон</span><div class="inl"><input type="tel" data-f="phone" value="${esc(r.phone || '')}" placeholder="+7 …" autocomplete="off"><a data-l="tel" title="Позвонить" aria-label="Позвонить">${ic('phone')}</a><a data-l="wa" target="_blank" rel="noopener" title="WhatsApp" aria-label="WhatsApp">${ic('msg')}</a></div></label>
    <label class="fld"><span>Почта</span><div class="inl"><input type="email" data-f="email" value="${esc(r.email || '')}" placeholder="name@mail.ru" autocomplete="off" autocapitalize="off"><a data-l="mail" title="Написать" aria-label="Написать">${ic('mail')}</a></div></label>
    <div class="grp">Паспорт</div>
    <div class="cols">${fld('pass', 'Серия и номер', 'text', 'autocomplete="off"')}${fld('cit', 'Гражданство', 'text', 'list="cits" autocomplete="off"')}</div>
    <div class="cols">${fld('birth', 'Дата рождения', 'date', 'max="' + today() + '"')}${fld('pIss', 'Дата выдачи', 'date')}</div>
    <div class="cols">${fld('pExp', 'Действует до', 'date')}<div></div></div>
    <div class="grp">Фото документов <span class="n" id="docN">${nd || ''}</span></div>
    <div id="docBox">${docsHtml()}</div>
    <div class="docadd">${!isPC() ? `<button type="button" class="btn" data-adddoc="cam">${ic('camera')} Сфотографировать</button>` : ''}<button type="button" class="btn" data-adddoc="file">${ic('clip')} ${isPC() ? 'Добавить фото или PDF' : 'Из галереи / файл'}</button></div>
    ${isPC() ? `<div class="dropzone">или перетащите файл в это окно, или вставьте картинку <span class="kbd">Ctrl V</span></div>` : ''}
    <div class="grp">Поездки <span class="n">${tl.length || ''}</span></div>
    ${tl.map(t => {
      const ls = legsOf(t);
      return `<div class="tripc" data-trip="${t.id}">${ls.map(l => `<div class="l">${ic(l.k === 'o' ? 'up' : 'down')}<b>${LEG[l.k]} ${fd(l.date)}</b>${flyIn(l)}${routeHtml(l)}</div><div class="l" style="padding-left:23px">${tkChip(l)}${statusPill(l)}</div>`).join('') || '<span class="muted">даты не указаны</span>'}</div>`;
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
      <div class="dl" data-dl="${k}">${dlHtml(k)}</div>
      <div class="seg" data-seg="${k}S"><button type="button" data-v="" class="r ${!st ? 'on' : ''}">Нет заявки</button><button type="button" data-v="sent" class="b ${st === 'sent' ? 'on' : ''}">Заявка подана</button><button type="button" data-v="tk" class="g ${st === 'tk' ? 'on' : ''}">${ic('ticket')}Билет есть</button></div>
      ${st ? `<label class="fld" style="margin:10px 0 0"><span>Дата подачи заявки</span><input type="date" data-f="${k}Sent" value="${esc(r[k + 'Sent'] || '')}"></label>` : ''}</div>`;
  };
  const body = () => {
    const em = e();
    return `${exist || (preset && preset.emp) ? `<div class="card" style="padding:10px 12px;margin-bottom:12px;display:flex;gap:11px;align-items:center">${em ? av(em).replace('data-av', 'data-avx') : ''}<div style="min-width:0"><div class="nm">${esc(em ? em.fio : '')}</div><div class="small muted">${em ? lvTag(em) : ''}${em && (em.air || em.city) ? ' · вылетает из ' + esc(em.air || em.city) : ''}</div></div></div>`
      : `<label class="fld"><span>Сотрудник *</span><select data-f="emp"><option value="">— выберите —</option>${['b', 'm', 'w'].map(lk => { const es = emps().filter(x => lvOf(x) === lk); return es.length ? `<optgroup label="${LV[lk].n}">${es.map(x => `<option value="${x.id}" ${x.id === r.emp ? 'selected' : ''}>${esc(x.fio)}${x.city ? ' · ' + esc(x.city) : ''}</option>`).join('')}</optgroup>` : ''; }).join('')}</select></label>`}
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
  if (isZip || /\.(xlsx|xlsm|csv)$/i.test(file.name)) return importExcel(file);
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
const EMP_COLS = [['fio', 'ФИО', 32], ['lat', 'ФИО латиницей', 26], ['lvl', 'Уровень', 16], ['pos', 'Должность', 20], ['city', 'Базовый город', 18], ['air', 'Город вылета', 16], ['phone', 'Телефон', 18], ['email', 'Почта', 26], ['cit', 'Гражданство', 14], ['birth', 'Дата рождения', 13, 1], ['pass', 'Паспорт №', 15], ['pIss', 'Дата выдачи', 13, 1], ['pExp', 'Действует до', 13, 1]];
const cell = (v, isDate) => isDate ? (validIso(v) ? { d: v } : '') : (v || '');
const ST_RU = { '': 'нет заявки', sent: 'заявка подана', tk: 'билет есть' };
const empVal = (e, k) => k === 'lvl' ? LV[lvOf(e)].one : e[k];
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
function mapHeader(h) {
  const s = norm(h).replace(/[.:]/g, '');
  if (!s || /заявк|статус|подан|ближайш|осталось|дней до|^№|^n$|кем выдан|рейс|документ|фото/.test(s)) return null;
  const back = /прил[её]т|обрат|возвр/.test(s);
  if (/откуда/.test(s)) return back ? 'bFrom' : 'oFrom';
  if (/куда/.test(s)) return back ? 'bTo' : 'oTo';
  if (/(город|аэропорт).*вылет|вылет.*(город|аэропорт)/.test(s)) return 'air';
  if (/уровень|категор/.test(s)) return 'lvl';
  if (/лат|latin|англ|english/.test(s)) return 'lat';
  if (/рожд|birth/.test(s)) return 'birth';
  if (/действ|срок|expir|годен/.test(s)) return 'pExp';
  if (/выдач|issue/.test(s)) return 'pIss';
  if (/паспорт|passport|серия|номер док/.test(s)) return 'pass';
  if (/граждан|citizen/.test(s)) return 'cit';
  if (/фио|ф и о|сотрудник|фамилия|работник|^имя|^name/.test(s)) return 'fio';
  if (/должн|профес|position/.test(s)) return 'pos';
  if (/назнач|объект/.test(s)) return 'oTo';
  if (/вылет|отъезд|туда/.test(s)) return 'oD';
  if (back || /приезд/.test(s)) return 'bD';
  if (/город|city/.test(s)) return 'city';
  if (/тел|phone|моб/.test(s)) return 'phone';
  if (/почт|mail/.test(s)) return 'email';
  if (/замет|примеч|коммент|note/.test(s)) return 'note';
  return null;
}
const parseLvl = v => { const s = norm(v); if (!s) return ''; if (/рук|нач|дир|глав|шеф|топ/.test(s)) return 'b'; if (/маст|офис|итр|инж|прораб|бригад|снаб|бухг|кадр|менедж|специал|пто/.test(s)) return 'm'; if (/раб/.test(s)) return 'w'; return ''; };
function toIso(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'object' && v.d) return v.d;
  if (typeof v === 'number') return v > 20000 && v < 80000 ? XL.serialToIso(v) : '';
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (m) { let y = +m[3]; if (y < 100) y += y > 50 ? 1900 : 2000; if (+m[2] < 1 || +m[2] > 12 || +m[1] < 1 || +m[1] > 31) return ''; return `${y}-${pad(m[2])}-${pad(m[1])}`; }
  return '';
}
async function importExcel(file) {
  let sheets;
  try { sheets = /\.csv$/i.test(file.name) ? XL.readCsv(await file.text()) : await XL.read(await file.arrayBuffer()); }
  catch (e) { return ask({ title: 'Не получилось прочитать Excel', text: 'Сохраните файл как .xlsx и попробуйте снова.\n' + esc(e.message), cancel: null }); }
  const DATES = new Set(['birth', 'pIss', 'pExp', 'oD', 'bD']);
  const found = [];
  for (const sh of sheets) {
    let best = null;
    for (let ri = 0; ri < Math.min(12, sh.rows.length); ri++) {
      const map = {}; (sh.rows[ri] || []).forEach((h, ci) => { const k = mapHeader(h); if (k && !(k in map)) map[k] = ci; });
      const score = Object.keys(map).length;
      if ('fio' in map && Object.keys(map).some(k => !['fio', 'oFrom', 'oTo', 'bFrom', 'bTo', 'lvl'].includes(k)) && (!best || score > best.score)) best = { sh, ri, map, score };
    }
    if (best) found.push(best);
  }
  if (!found.length) return ask({ title: 'Не нашёл столбец с ФИО', text: 'В первой строке таблицы должны быть названия столбцов: ФИО, Паспорт, Телефон, Почта, Город, Дата вылета, Дата прилёта… Скачайте шаблон в разделе «Обмен», там всё подписано.', cancel: null });
  const byPass = {}, byFio = {};
  emps().forEach(e => { if (e.pass) byPass[normPass(e.pass)] = e; if (e.fio) byFio[norm(e.fio)] = e; });
  const r = { ea: 0, eu: 0, ta: 0, skip: 0 };
  const EF = ['fio', 'lat', 'lvl', 'pos', 'city', 'air', 'phone', 'email', 'cit', 'birth', 'pass', 'pIss', 'pExp', 'note'];
  for (const { sh, ri, map } of found) for (const row of sh.rows.slice(ri + 1)) {
    const tripSheet = ('oD' in map || 'bD' in map) && !('pass' in map) && !('phone' in map);
    const g = {};
    for (const k in map) { let v = row[map[k]]; v = DATES.has(k) ? toIso(v) : (v == null ? '' : (typeof v === 'object' && v.d ? fd(v.d) : String(v))).trim(); g[k] = v; }
    if (g.lat) g.lat = g.lat.toUpperCase();
    if ('lvl' in g) g.lvl = parseLvl(g.lvl);
    if (!g.fio) { if (Object.values(g).some(Boolean)) r.skip++; continue; }
    if (/пример, удалите/i.test(g.note || '')) continue;
    let e = (g.pass && byPass[normPass(g.pass)]) || byFio[norm(g.fio)];
    if (!e) { e = { id: uid(), _t: {} }; D.emp[e.id] = e; r.ea++; byFio[norm(g.fio)] = e; if (g.pass) byPass[normPass(g.pass)] = e; }
    else if (!tripSheet) { if (EF.some(k => g[k] && g[k] !== (e[k] || ''))) r.eu++; }
    EF.forEach(k => { if (g[k] && !(tripSheet && k === 'note')) setF(e, k, g[k]); });
    if (validIso(g.oD) || validIso(g.bD)) {
      const ex = Object.values(D.trip).filter(t => alive(t) && t.emp === e.id).find(t => (g.oD && t.oD === g.oD) || (g.bD && t.bD === g.bD) || (g.oD && !t.oD && t.bD && t.bD > g.oD && !g.bD));
      const t = ex || { id: uid(), _t: {} };
      setF(t, 'emp', e.id);
      ['oD', 'bD', 'oFrom', 'oTo', 'bFrom', 'bTo'].forEach(k => { if (g[k]) setF(t, k, g[k]); });
      if (!ex) { D.trip[t.id] = t; r.ta++; }
    }
  }
  save(); render();
  ask({ title: 'Excel загружен', text: `${found.length > 1 ? 'Листы' : 'Лист'} ${found.map(f => '«' + esc(f.sh.name) + '»').join(', ')}.\nНовых сотрудников: ${r.ea}\nОбновлено: ${r.eu}\nНовых поездок: ${r.ta}` + (r.skip ? `\nПропущено строк без ФИО: ${r.skip}` : ''), cancel: null });
}

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

/* ---------- действия ---------- */
async function act(a) {
  if (a === 'export') return exportFile();
  if (a === 'exportdl') return exportFile('download');
  if (a === 'exportfull') return exportFile('full');
  if (a === 'import') return importAny(await pickFile('.vyl,.txt,.json,.xlsx,.csv,application/json,text/plain,application/octet-stream'));
  if (a === 'xlsin') return importAny(await pickFile('.xlsx,.xlsm,.csv'));
  if (a === 'xlsout') return emps().length ? exportXlsx() : toast('Пока нет сотрудников');
  if (a === 'xlstpl') return xlsTemplate();
  if (a === 'ics') return icsFile();
  if (a === 'legend') return legend();
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
  else if (/^[1-4]$/.test(e.key)) go(TABS[+e.key - 1][0]);
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
{ const m = location.search.match(/[?&]tab=(req|sch|emp|sync)/); if (m) { TAB = L.tab = m[1]; history.replaceState(null, '', location.pathname); } }
if (!TABS.some(t => t[0] === TAB)) TAB = 'req';
if (!L.seen && !Object.keys(D.emp).length) { demo(); L.seen = 1; save(); }
L.seen = 1;
let wasPC = isPC();
matchMedia('(min-width:900px)').addEventListener('change', () => { if (isPC() !== wasPC) { wasPC = isPC(); shell(); render(); } });
window.addEventListener('storage', e => { if (e.key === KEY) { D = load(); render(); badges(); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden && !STACK.length && !$('#viewer') && !$('#modal') && !(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) render(); });
shell(); render();
IDB.keys().then(k => { HAVE = new Set(k); badges(); if (TAB === 'sync') render(); }).catch(() => { }).finally(inbox);
