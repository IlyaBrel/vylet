'use strict';
/* ===== Вылеты сотрудников — офлайн-приложение для телефона и ПК ===== */
const VER = '1.0';
const KEY = 'vylety.data.v1', LKEY = 'vylety.local.v1';
const $ = s => document.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const isoOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => isoOf(new Date());
const dn = iso => { const [y, m, d] = iso.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
const addD = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const fd = iso => iso ? iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.' + iso.slice(0, 4) : '';
const fds = iso => iso ? iso.slice(8, 10) + '.' + iso.slice(5, 7) : '';
const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const wd = iso => WD[new Date(dn(iso) * 864e5).getUTCDay()];
const MON = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const pl = (n, a, b, c) => { n = Math.abs(n) % 100; const m = n % 10; return n > 10 && n < 20 ? c : m === 1 ? a : m >= 2 && m <= 4 ? b : c; };
const dney = n => n + ' ' + pl(n, 'день', 'дня', 'дней');
const ftime = ts => { if (!ts) return '—'; const d = new Date(ts); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const norm = s => String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
const normPass = s => String(s || '').replace(/[\s№-]/g, '').toUpperCase();
const isPC = () => matchMedia('(min-width:900px)').matches;
let lastTs = 0;
const tick = () => { let t = Date.now(); if (t <= lastTs) t = lastTs + 1; return lastTs = t; };
const uid = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 16);

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
  pass: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2M7 16h10"/>',
  msg: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  pc: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  mob: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
};
const ic = (n, cls = '') => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${P[n]}</svg>`;

/* ---------- данные ---------- */
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.emp) { d.set = d.set || { _t: {} }; return d; } } catch (e) { }
  return { v: 1, emp: {}, trip: {}, set: { _t: {} } };
}
function loadLocal() {
  let l = {};
  try { l = JSON.parse(localStorage.getItem(LKEY)) || {}; } catch (e) { }
  if (!l.dev) l.dev = uid();
  if (!l.name) l.name = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) ? 'Телефон' : 'ПК';
  l.dirty = l.dirty || {}; l.tab = l.tab || 'req';
  return l;
}
let D = load(), L = loadLocal();
let saveT = 0;
function save(now) {
  clearTimeout(saveT);
  const f = () => {
    try { localStorage.setItem(KEY, JSON.stringify(D)); localStorage.setItem(LKEY, JSON.stringify(L)); }
    catch (e) { toast('Не удалось сохранить: память браузера заполнена'); }
    badges();
  };
  if (now === false) saveT = setTimeout(f, 250); else f();
}
const DEF = { lead: 45, warn: 7, dest: '' };
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
const LEG = { o: 'Вылет', b: 'Прилёт' };
function legsOf(t) {
  const e = D.emp[t.emp], T = dn(today()), lead = +S('lead') || 45, res = [];
  const A = t.from || e.city || '', B = t.to || S('dest') || '';
  for (const k of ['o', 'b']) {
    const date = t[k + 'D']; if (!date) continue;
    const dl = addD(date, -lead);
    res.push({ t, e, k, date, st: t[k + 'S'] || '', sent: t[k + 'Sent'] || '', tk: t[k + 'Tk'] || '', dl, dleft: dn(dl) - T, fleft: dn(date) - T, from: k === 'o' ? A : B, to: k === 'o' ? B : A, key: t.id + ':' + k });
  }
  return res;
}
const allLegs = () => trips().flatMap(legsOf);
const legByKey = key => { const [id, k] = key.split(':'); const t = D.trip[id]; return t ? legsOf(t).find(l => l.k === k) : null; };
function urg(l) {
  if (l.fleft < 0) return 'past';
  if (l.st === 'tk') return 'tk';
  if (l.st === 'sent') return 'sent';
  if (l.dleft < 0) return 'over';
  if (l.dleft <= +S('warn')) return 'soon';
  if (l.dleft <= 30) return 'near';
  return 'later';
}
function nextLeg(eid) { return allLegs().filter(l => l.e.id === eid && l.fleft >= 0).sort((a, b) => a.date.localeCompare(b.date))[0]; }
function issues(e, nl) {
  const a = [], t = today();
  if (!e.pass) a.push(['нет паспорта', 'red']);
  else if (e.pExp) {
    if (e.pExp < t) a.push(['паспорт просрочен', 'red']);
    else if (e.pExp < addD(nl ? nl.date : t, 180)) a.push(['паспорт до ' + fd(e.pExp), 'amb']);
  }
  if (!e.phone) a.push(['нет телефона', 'amb']);
  return a;
}
const short = fio => { const p = String(fio || '').trim().split(/\s+/); return p.length < 2 ? (p[0] || '') : p[0] + ' ' + p.slice(1, 3).map(x => x[0] + '.').join(''); };
function legPill(l) {
  const u = urg(l);
  if (u === 'past') return `<span class="pill gry">${l.st === 'tk' ? 'билет был' : 'рейс прошёл'}</span>`;
  if (u === 'tk') return `<span class="pill grn">${ic('check')} билет${l.tk ? ' · ' + esc(l.tk) : ''}</span>`;
  if (u === 'sent') return `<span class="pill blu">заявка подана${l.sent ? ' ' + fds(l.sent) : ''}</span>`;
  if (u === 'over') return `<span class="pill red">${ic('alert')} заявка просрочена на ${dney(-l.dleft)}</span>`;
  if (l.dleft === 0) return `<span class="pill red">заявка сегодня</span>`;
  if (u === 'soon') return `<span class="pill amb">заявка ${fds(l.dl)} · через ${dney(l.dleft)}</span>`;
  return `<span class="pill gry">заявка ${fds(l.dl)} · через ${dney(l.dleft)}</span>`;
}

/* ---------- пример ---------- */
function demo() {
  const t = today(), T = 1;
  const mk = (id, f) => { const r = { id, _t: {} }; for (const k in f) { r[k] = f[k]; r._t[k] = T; } return r; };
  const E = [
    ['Иванов Сергей Петрович', 'IVANOV SERGEI', 'Прораб', 'Москва', '+7 915 123-45-67', 'ivanov@example.com', 'РФ', '1984-03-12', '75 4412345', '2021-06-01', '2031-06-01'],
    ['Петров Алексей Иванович', 'PETROV ALEKSEI', 'Монтажник', 'Екатеринбург', '+7 912 555-10-20', 'petrov@example.com', 'РФ', '1990-08-23', '76 1188822', '2017-02-10', t.slice(0, 4) * 1 + 1 + '-02-10'],
    ['Сидоров Николай Андреевич', 'SIDOROV NIKOLAI', 'Электрик', 'Ростов-на-Дону', '+7 903 777-88-99', '', 'РФ', '1979-11-02', '', '', ''],
    ['Кузнецова Марина Олеговна', 'KUZNETSOVA MARINA', 'Инженер ПТО', 'Санкт-Петербург', '+7 921 300-40-50', 'kuznetsova@example.com', 'РФ', '1992-05-17', '75 9900111', '2022-09-15', '2032-09-15'],
    ['Абдуллаев Рустам Шавкатович', 'ABDULLAEV RUSTAM', 'Сварщик', 'Ташкент', '+998 90 123 45 67', '', 'Узбекистан', '1988-01-30', 'FA 1234567', '2020-04-04', '2030-04-04'],
  ];
  const ids = E.map((x, i) => {
    const id = 'demo-e' + (i + 1);
    D.emp[id] = mk(id, { fio: x[0], lat: x[1], pos: x[2], city: x[3], phone: x[4], email: x[5], cit: x[6], birth: x[7], pass: x[8], pIss: x[9], pExp: x[10], demo: 1 });
    return id;
  });
  const TR = [[0, 40, 100, '', ''], [1, 48, 108, '', ''], [2, 65, 125, '', ''], [3, 70, 130, 'sent', ''], [4, 120, 180, '', ''], [0, 30 - 60, 30, 'tk', 'tk']];
  TR.forEach((x, i) => {
    const id = 'demo-t' + (i + 1);
    D.trip[id] = mk(id, { emp: ids[x[0]], to: 'Каир', oD: addD(t, x[1]), bD: addD(t, x[2]), oS: x[3] || (x[1] < 0 ? 'tk' : ''), oSent: x[3] ? addD(t, -2) : '', bS: x[4], bSent: x[4] ? addD(t, -20) : '', bTk: x[4] ? 'MS 724' : '', demo: 1 });
  });
}
const hasDemo = () => Object.values(D.emp).some(e => e.demo && alive(e)) || Object.values(D.trip).some(e => e.demo && alive(e));

/* ---------- UI: общие ---------- */
let TAB = L.tab, Q = { req: '', sch: '', emp: '' }, SEL = new Set(), F = { sch: 'all', past: false, emp: 'all', later: false };
let toastT;
function toast(m, ms = 2600) { const t = $('#toast'); t.innerHTML = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }
function ask({ title = '', text = '', input = null, value = '', ok = 'OK', cancel = 'Отмена', danger = false, placeholder = '' }) {
  return new Promise(res => {
    const m = document.createElement('div'); m.id = 'modal';
    m.innerHTML = `<div class="box" role="dialog"><h3>${esc(title)}</h3>${text ? `<p>${text}</p>` : ''}${input ? `<label class="fld"><input type="${input}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off"></label>` : ''}<div class="btns">${cancel ? `<button class="btn" data-c>${esc(cancel)}</button>` : ''}<button class="btn ${danger ? 'dan' : 'pri'}" data-ok>${esc(ok)}</button></div></div>`;
    document.body.appendChild(m);
    const inp = m.querySelector('input');
    const done = v => { m.remove(); document.removeEventListener('keydown', kd, true); res(v); };
    const kd = e => { if (e.key === 'Escape') { e.stopPropagation(); done(null); } if (e.key === 'Enter') { e.preventDefault(); done(input ? inp.value : true); } };
    document.addEventListener('keydown', kd, true);
    m.querySelector('[data-ok]').onclick = () => done(input ? inp.value : true);
    const c = m.querySelector('[data-c]'); if (c) c.onclick = () => done(null);
    m.onclick = e => { if (e.target === m) done(null); };
    setTimeout(() => (inp || m.querySelector('[data-ok]')).focus(), 30);
  });
}
const STACK = [];
function openSheet(level, title, body, foot, onClose) {
  const el = $('#sheet' + level);
  el.innerHTML = `<div class="sh-h"><h3>${title}</h3><button class="ibtn" data-close aria-label="Закрыть">${ic('x')}</button></div><div class="sh-b">${body}</div>${foot ? `<div class="sh-f">${foot}</div>` : ''}`;
  el.querySelector('[data-close]').onclick = () => closeSheet(level);
  const prev = STACK.findIndex(s => s.level === level); if (prev >= 0) STACK.splice(prev, 1);
  STACK.push({ level, onClose });
  $('#scrim').classList.add('on');
  requestAnimationFrame(() => el.classList.add('on'));
  return el;
}
function closeSheet(level) {
  const i = STACK.findIndex(s => s.level === level); if (i < 0) return;
  const s = STACK.splice(i, 1)[0];
  $('#sheet' + level).classList.remove('on');
  if (!STACK.length) $('#scrim').classList.remove('on');
  if (s.onClose) s.onClose();
}
const closeTop = () => { if (STACK.length) closeSheet(STACK[STACK.length - 1].level); };
$('#scrim').onclick = closeTop;

function counts() {
  const ls = allLegs(), c = { over: 0, soon: 0, near: 0, later: 0, sent: 0, tk: 0 };
  ls.forEach(l => { const u = urg(l); if (u in c) c[u]++; });
  return c;
}
const dirtyN = () => Object.keys(L.dirty).length;
function badges() {
  const c = counts(), n = c.over + c.soon;
  $$('[data-cnt="req"]').forEach(el => { el.textContent = n; el.classList.toggle('hide', !n); });
  const dn_ = dirtyN();
  $$('[data-cnt="sync"]').forEach(el => { el.textContent = dn_; el.classList.toggle('hide', !dn_); });
  const ts = $('#topSync'); if (ts) ts.innerHTML = `${ic('sync')}<span>Обмен</span>${dn_ ? `<b>${dn_}</b>` : ''}`;
  const sb = $('#sideSync'); if (sb) sb.innerHTML = dn_ ? `Не отправлено изменений: <b>${dn_}</b>` : 'Все изменения отправлены';
  try { if (navigator.setAppBadge) n ? navigator.setAppBadge(n) : navigator.clearAppBadge(); } catch (e) { }
}

const TABS = [['req', 'Заявки', 'req'], ['sch', 'График', 'cal'], ['emp', 'Сотрудники', 'users'], ['sync', 'Обмен', 'sync']];
function shell() {
  $('#tabs').innerHTML = TABS.map(([k, n, i]) => `<button data-tab="${k}" class="${TAB === k ? 'on' : ''}">${ic(i)}${n}${k === 'req' || k === 'sync' ? `<span class="cnt hide" data-cnt="${k}"></span>` : ''}</button>`).join('');
  $('#side').innerHTML = `<div class="brand"><img src="icon-192.png" alt="">Вылеты</div>` +
    TABS.map(([k, n, i]) => `<button class="nv ${TAB === k ? 'on' : ''}" data-tab="${k}">${ic(i)}${n}${k === 'req' || k === 'sync' ? `<span class="cnt hide" data-cnt="${k}"></span>` : ''}</button>`).join('') +
    `<div class="sp"></div><div class="syncbox"><div id="sideSync"></div><button class="btn sm" data-do="export">${ic('send')} Отправить файл</button><button class="btn sm" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.25)" data-do="import">${ic('inbox')} Принять файл</button></div>
    <div class="keys"><span class="kbd">/</span> поиск · <span class="kbd">N</span> добавить<br><span class="kbd">Ctrl S</span> отправить · <span class="kbd">Esc</span> закрыть</div>`;
  $$('[data-tab]').forEach(b => b.onclick = () => go(b.dataset.tab));
  $('#fab').innerHTML = ic('plus');
  $('#fab').classList.toggle('hide', TAB === 'sync');
  $('#ttl').textContent = { req: 'Заявки на вылет', sch: 'График вылетов', emp: 'Сотрудники', sync: 'Обмен и настройки' }[TAB];
  badges();
}
function go(t) { if (t !== TAB) SEL.clear(); TAB = L.tab = t; save(); shell(); render(); window.scrollTo(0, 0); }

function render() {
  const v = $('#view');
  const y = window.scrollY;
  v.innerHTML = ({ req: vReq, sch: vSch, emp: vEmp, sync: vSync })[TAB]();
  bindView(v);
  bulkBar();
  window.scrollTo(0, y);
}
function searchBox(k, ph) { return `<div class="search">${ic('search')}<input type="search" data-q="${k}" placeholder="${ph}" value="${esc(Q[k])}"></div>`; }
const matchQ = (q, ...xs) => { q = norm(q); if (!q) return true; const s = norm(xs.join(' ')); return q.split(' ').every(w => s.includes(w)); };
const demoBanner = () => hasDemo() ? `<div class="banner blu">${ic('info')}<span class="sp">Сейчас показан <b>пример</b> с вымышленными людьми, чтобы было видно, как всё работает.</span><button class="btn sm" data-do="undemo">Удалить пример</button></div>` : '';

/* ---------- Заявки ---------- */
function legRow(l, mode) {
  const sel = SEL.has(l.key), u = urg(l), iss = issues(l.e, l);
  const warns = iss.filter(x => x[0] !== 'нет телефона').map(([t, c]) => `<span class="warn ${c}">${ic('alert')}${t}</span>`).join('');
  const kind = `<span class="i">${ic(l.k === 'o' ? 'up' : 'down')}${LEG[l.k]} <b>${fd(l.date)}</b>&nbsp;${wd(l.date)}</span>`;
  const route = l.from || l.to ? `<span class="i">${esc(l.from || '?')} → ${esc(l.to || '?')}</span>` : '';
  let btn = '';
  if (mode === 'req' && (u === 'over' || u === 'soon' || u === 'near' || u === 'later')) btn = `<button class="btn sm" data-mark="sent" data-key="${l.key}">${ic('check')} Подано</button>`;
  if (mode === 'req' && u === 'sent') btn = `<button class="btn sm" data-mark="tk" data-key="${l.key}">${ic('ticket')} Билет есть</button>`;
  if (isPC()) {
    return `<div class="tr ${sel ? 'sel' : ''}" data-leg="${l.key}"><div class="ck">${ic('check')}</div>
      <div class="c"><div class="nm">${esc(l.e.fio)}</div><div class="small muted">${esc(l.e.pos || '')}${warns ? ' ' + warns : ''}</div></div>
      <div class="c">${kind}</div><div class="c">${route || '<span class="muted">—</span>'}</div><div class="c">${legPill(l)}</div><div class="c" style="text-align:right">${btn}</div></div>`;
  }
  return `<div class="row ${sel ? 'sel' : ''}" data-leg="${l.key}"><div class="ck">${ic('check')}</div><div class="nm">${esc(l.e.fio)}</div><div></div>
    <div class="sub">${kind}${route}${warns}</div>
    <div class="act">${legPill(l)}${btn ? `<span style="flex:1"></span>${btn}` : ''}</div></div>`;
}
const LEG_GC = '--gc:24px minmax(170px,1.5fr) 190px minmax(130px,1.3fr) minmax(200px,1.2fr) 120px';
const legTable = (ls, mode) => `<div class="list" style="${LEG_GC}">${isPC() ? `<div class="tr th"><div></div><div>Сотрудник</div><div>Рейс</div><div>Маршрут</div><div>Заявка</div><div></div></div>` : ''}${ls.map(l => legRow(l, mode)).join('')}</div>`;
function vReq() {
  if (!emps().length) return emptyAll();
  const q = Q.req;
  const ls = allLegs().filter(l => l.fleft >= 0 && matchQ(q, l.e.fio, l.e.lat, l.from, l.to)).sort((a, b) => a.dl.localeCompare(b.dl) || a.e.fio.localeCompare(b.e.fio, 'ru'));
  const g = { over: [], soon: [], near: [], later: [], sent: [], tk: [] };
  ls.forEach(l => g[urg(l)].push(l));
  const warn = +S('warn'), lead = +S('lead');
  const stat = (k, cls, n, t) => `<button class="stat ${cls}" data-jump="${k}"><b>${n}</b><span>${t}</span></button>`;
  let h = demoBanner();
  h += `<div class="pagehead"><h2 class="hide-m">Заявки на вылет</h2></div>`;
  h += `<div class="stats">${stat('over', 'red', g.over.length, 'срок заявки прошёл')}${stat('soon', 'amb', g.soon.length, `подать в ближайшие ${dney(warn)}`)}${stat('near', 'blu', g.near.length, 'подать в течение месяца')}${stat('sent', 'grn', g.sent.length, 'подано, ждём билет')}</div>`;
  h += `<div class="toolbar">${searchBox('req', 'Поиск по ФИО или городу')}<button class="btn" data-do="newtrip">${ic('plus')} Поездка</button></div>`;
  h += `<p class="small muted" style="margin:-4px 0 6px">Срок заявки = дата рейса − ${dney(lead)}. Выберите строки галочкой, чтобы отметить поданными или выгрузить данные для заявки.</p>`;
  const sec = (k, cls, title, arr, collapsible) => {
    if (!arr.length) return '';
    const open = !collapsible || F['o_' + k] || q;
    return `<div class="sec ${cls}" id="g-${k}">${title}<span class="n">${arr.length}</span>${collapsible && !q ? `<button class="btn sm tog" data-do="tog:o_${k}">${open ? 'Свернуть' : 'Показать'}</button>` : ''}</div>${open ? legTable(arr, 'req') : ''}`;
  };
  h += sec('over', 'red', 'Срок заявки прошёл, подать срочно', g.over);
  h += sec('soon', 'amb', `Подать в ближайшие ${dney(warn)}`, g.soon);
  h += sec('near', '', 'Подать в течение месяца', g.near);
  h += sec('later', '', 'Позже', g.later, true);
  h += sec('sent', '', 'Заявка подана, ждём билет', g.sent);
  h += sec('tk', '', 'Билеты есть', g.tk, true);
  if (!ls.length) h += `<div class="card empty">${ic('up')}<h3>${q ? 'Ничего не найдено' : 'Предстоящих рейсов нет'}</h3><p>${q ? '' : 'Добавьте поездку: даты вылета и прилёта, и приложение посчитает срок заявки.'}</p></div>`;
  return h;
}
function emptyAll() {
  return `${demoBanner()}<div class="card empty" style="margin-top:20px">${ic('users')}<h3>Пока никого нет</h3><p>Добавьте сотрудников вручную, загрузите из Excel или примите файл с другого устройства.</p>
  <div class="btns" style="justify-content:center;display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn pri" data-do="newemp">${ic('plus')} Сотрудник</button><button class="btn" data-do="xlsin">${ic('xls')} Из Excel</button><button class="btn" data-do="import">${ic('inbox')} Принять файл</button><button class="btn" data-do="demo">Показать пример</button></div></div>`;
}

/* ---------- График ---------- */
function vSch() {
  if (!emps().length) return emptyAll();
  const q = Q.sch;
  let ls = allLegs().filter(l => (F.past || l.fleft >= 0) && (F.sch === 'all' || F.sch === l.k) && matchQ(q, l.e.fio, l.e.lat, l.from, l.to));
  ls.sort((a, b) => F.past ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  let h = `<div class="pagehead"><h2>График вылетов</h2></div><div class="toolbar">${searchBox('sch', 'Поиск')}
    <div class="chips"><button class="chip ${F.sch === 'all' ? 'on' : ''}" data-f="sch:all">Все</button><button class="chip ${F.sch === 'o' ? 'on' : ''}" data-f="sch:o">Вылеты</button><button class="chip ${F.sch === 'b' ? 'on' : ''}" data-f="sch:b">Прилёты</button><button class="chip ${F.past ? 'on' : ''}" data-f="past">Прошедшие</button></div></div>`;
  if (!ls.length) return h + `<div class="card empty">${ic('cal')}<h3>Рейсов нет</h3></div>`;
  let cur = '', buf = [];
  const flush = () => { if (!buf.length) return; const [y, m] = cur.split('-'); h += `<div class="sec">${MON[+m - 1]} ${y}<span class="n">${buf.length}</span></div><div class="list" style="--gc:24px 64px minmax(170px,1.5fr) minmax(130px,1.3fr) minmax(200px,1.2fr) 120px">${buf.map(schRow).join('')}</div>`; buf = []; };
  ls.forEach(l => { const m = l.date.slice(0, 7); if (m !== cur) { flush(); cur = m; } buf.push(l); });
  flush();
  return h;
}
function schRow(l) {
  const sel = SEL.has(l.key), past = l.fleft < 0;
  const db = `<div class="dbox ${past ? 'past' : ''}"><b>${l.date.slice(8)}</b><span>${wd(l.date)}</span></div>`;
  const kind = `<span class="i">${ic(l.k === 'o' ? 'up' : 'down')}${LEG[l.k]}</span>`;
  const route = `<span class="i">${esc(l.from || '?')} → ${esc(l.to || '?')}</span>`;
  if (isPC()) return `<div class="tr ${sel ? 'sel' : ''}" data-leg="${l.key}"><div class="ck">${ic('check')}</div>${db}<div class="c"><div class="nm">${esc(l.e.fio)}</div><div class="small muted">${esc(l.e.pos || '')}</div></div><div class="c">${kind} · ${route}</div><div class="c">${legPill(l)}</div><div class="c small muted" style="text-align:right">${l.e.phone ? esc(l.e.phone) : ''}</div></div>`;
  return `<div class="row ${sel ? 'sel' : ''}" data-leg="${l.key}" style="grid-template-columns:auto auto 1fr">${db}<div class="nm" style="grid-column:2/4">${esc(l.e.fio)}</div><div class="sub" style="grid-column:2/4">${kind}${route}</div><div class="act" style="grid-column:2/4">${legPill(l)}</div></div>`;
}

/* ---------- Сотрудники ---------- */
function dups() {
  const by = {}, out = [];
  emps().forEach(e => {
    const keys = [];
    if (e.pass) keys.push('p' + normPass(e.pass));
    if (e.fio) keys.push('f' + norm(e.fio));
    keys.forEach(k => (by[k] = by[k] || []).push(e));
  });
  const seen = new Set();
  Object.values(by).forEach(a => { if (a.length > 1) { const k = a.map(x => x.id).sort().join(); if (!seen.has(k)) { seen.add(k); out.push(a); } } });
  return out;
}
function vEmp() {
  const all = emps();
  if (!all.length) return emptyAll();
  const q = Q.emp;
  const rows = all.map(e => { const nl = nextLeg(e.id); return { e, nl, iss: issues(e, nl) }; })
    .filter(x => matchQ(q, x.e.fio, x.e.lat, x.e.city, x.e.phone, x.e.email, x.e.pos, x.e.pass))
    .filter(x => F.emp === 'all' || (F.emp === 'iss' && x.iss.length) || (F.emp === 'notrip' && !x.nl));
  const nIss = all.filter(e => issues(e, nextLeg(e.id)).length).length;
  let h = demoBanner();
  const dd = dups();
  if (dd.length) h += `<div class="banner">${ic('alert')}<span class="sp">Похоже на дубли: ${dd.map(a => `<b>${esc(short(a[0].fio))}</b> ×${a.length}`).join(', ')}. Так бывает, если одного человека добавили и на телефоне, и на ПК.</span><button class="btn sm" data-do="dups">Объединить</button></div>`;
  h += `<div class="pagehead"><h2>Сотрудники <span class="muted" style="font-weight:400">${all.length}</span></h2></div>`;
  h += `<div class="toolbar">${searchBox('emp', 'ФИО, город, телефон, паспорт')}<div class="chips"><button class="chip ${F.emp === 'all' ? 'on' : ''}" data-f="emp:all">Все</button><button class="chip ${F.emp === 'iss' ? 'on' : ''}" data-f="emp:iss">Не хватает данных ${nIss ? `(${nIss})` : ''}</button><button class="chip ${F.emp === 'notrip' ? 'on' : ''}" data-f="emp:notrip">Без поездок</button></div><button class="btn pri" data-do="newemp">${ic('plus')} Сотрудник</button></div>`;
  if (!rows.length) return h + `<div class="card empty">${ic('search')}<h3>Никого не нашлось</h3></div>`;
  const pc = isPC();
  h += `<div class="list" style="--gc:24px minmax(190px,1.6fr) minmax(100px,.9fr) minmax(130px,1fr) minmax(150px,1.2fr) 110px minmax(150px,1.1fr)">`;
  if (pc) h += `<div class="tr th"><div></div><div>ФИО</div><div>Город</div><div>Телефон</div><div>Почта</div><div>Паспорт до</div><div>Ближайший рейс</div></div>`;
  rows.forEach(({ e, nl, iss }) => {
    const sel = SEL.has(e.id);
    const w = iss.map(([t, c]) => `<span class="warn ${c}">${ic('alert')}${t}</span>`).join(' ');
    const nlt = nl ? `${ic(nl.k === 'o' ? 'up' : 'down')}${fds(nl.date)} ${legPill(nl)}` : '<span class="muted">нет</span>';
    if (pc) h += `<div class="tr ${sel ? 'sel' : ''}" data-emp="${e.id}"><div class="ck">${ic('check')}</div><div class="c"><div class="nm">${esc(e.fio)}</div><div class="small muted">${esc(e.pos || '')}${w ? ' ' + w : ''}</div></div><div class="c">${esc(e.city || '—')}</div><div class="c">${esc(e.phone || '—')}</div><div class="c">${esc(e.email || '—')}</div><div class="c">${e.pExp ? fd(e.pExp) : '—'}</div><div class="c small" style="display:flex;gap:5px;align-items:center">${nl ? `${ic(nl.k === 'o' ? 'up' : 'down', 'sm')}${LEG[nl.k]} ${fd(nl.date)}` : '<span class="muted">нет</span>'}</div></div>`;
    else h += `<div class="row ${sel ? 'sel' : ''}" data-emp="${e.id}"><div class="ck">${ic('check')}</div><div class="nm">${esc(e.fio)}</div><div></div><div class="sub">${e.pos ? `<span>${esc(e.pos)}</span>` : ''}${e.city ? `<span class="i">${ic('pin')}${esc(e.city)}</span>` : ''}${e.phone ? `<span class="i">${ic('phone')}${esc(e.phone)}</span>` : ''}</div><div class="sub">${nl ? `<span class="i">${ic(nl.k === 'o' ? 'up' : 'down')}${LEG[nl.k]} ${fd(nl.date)}</span>` : '<span class="muted">поездок нет</span>'}${w}</div></div>`;
  });
  return h + '</div>';
}

/* ---------- Обмен ---------- */
let installEv = null;
function vSync() {
  const dn_ = dirtyN();
  const nE = emps().length, nT = trips().length;
  return `<div class="pagehead"><h2>Обмен и настройки</h2></div><div class="grid2"><div>
  <div class="card"><h3>${ic('sync')}Телефон ⇄ ПК</h3>
    <p>Сервер и интернет не нужны. Одно устройство отправляет файл, другое принимает его и объединяет с тем, что у него есть: новое добавится, изменённое обновится, ничего не затрётся.</p>
    <div class="kv"><span>Это устройство</span><div><b>${esc(L.name)}</b> <button class="btn sm" data-do="rename" style="padding:2px 8px">изменить</button></div>
      <span>Не отправлено</span><div>${dn_ ? `<b style="color:var(--amb)">${dn_} ${pl(dn_, 'запись', 'записи', 'записей')}</b>` : 'всё отправлено'}</div>
      <span>Отправлено</span><div>${ftime(L.sent)}</div>
      <span>Принято</span><div>${L.recv ? ftime(L.recv) + (L.recvFrom ? ' · с «' + esc(L.recvFrom) + '»' : '') : '—'}</div>
      <span>Файл</span><div>${L.pwd ? `${ic('lock', 'sm')} зашифрован паролем` : '<span style="color:var(--amb)">без пароля</span>'}</div></div>
    <div class="btns"><button class="btn pri big" data-do="export">${ic('send')} Отправить файл</button><button class="btn big" data-do="import">${ic('inbox')} Принять файл</button></div>
    ${!isPC() ? `<div class="btns" style="margin-top:8px"><button class="btn sm" data-do="exportdl">${ic('download')} Сохранить файл в «Загрузки»</button></div>` : ''}
    <details style="margin-top:12px"><summary style="cursor:pointer;font-weight:600">Как передать данные</summary><ol class="steps">
      <li>На устройстве, где вносили изменения, нажмите <b>«Отправить файл»</b>. На телефоне откроется «Поделиться»: выберите Telegram → «Избранное» (или WhatsApp, почту себе). На ПК файл сохранится в «Загрузки», его можно перетащить в Telegram.</li>
      <li>На другом устройстве нажмите <b>«Принять файл»</b> и выберите его. На ПК файл можно просто перетащить в окно приложения. На Android можно в Telegram нажать «Поделиться» → «Вылеты».</li>
      <li>Меняли и там, и там? Отправьте файл в обе стороны. Правки разных полей сохранятся все; если одно и то же поле меняли на обоих устройствах, останется более поздняя правка.</li></ol></details>
  </div>
  <div class="card"><h3>${ic('lock')}Пароль на файл обмена</h3>
    <p>В файле паспортные данные. С паролем файл зашифрован, и в Telegram или почте его никто не прочитает. Пароль нужен одинаковый на телефоне и на ПК.</p>
    <div class="inl"><input type="password" id="pwd" value="${esc(L.pwd || '')}" placeholder="Пароль (по желанию)" autocomplete="new-password" style="border:1px solid var(--line);border-radius:9px;padding:10px;background:var(--card)"><button data-do="savepwd">Сохранить</button></div>
  </div>
  <div class="card"><h3>${ic('xls')}Excel</h3>
    <p>Выгрузка: сотрудники, поездки и сроки заявок, три листа. Загрузка из вашей таблицы добавит новых людей и обновит существующих (ищу по номеру паспорта, потом по ФИО); столбцы узнаю по названиям.</p>
    <div class="btns"><button class="btn" data-do="xlsout">${ic('download')} Скачать Excel</button><button class="btn" data-do="xlsin">${ic('upload')} Загрузить из Excel</button></div>
    <div class="btns" style="margin-top:8px"><button class="btn sm" data-do="xlstpl">Пустой шаблон для заполнения</button></div>
  </div></div><div>
  <div class="card"><h3>${ic('cal')}Напоминания в календарь</h3>
    <p>Файл со сроками всех неподанных заявок: открываете его, и сроки появляются в календаре телефона или Outlook с напоминанием за 3 дня и в 9:00 в день срока. Добавили новых людей — выгрузите ещё раз.</p>
    <div class="btns"><button class="btn" data-do="ics">${ic('cal')} Сроки заявок в календарь</button></div></div>
  <div class="card"><h3>${ic('gear')}Настройки</h3>
    <div class="cols"><label class="fld"><span>Заявка подаётся за, дней</span><input type="number" min="1" max="365" data-set="lead" value="${esc(S('lead'))}"></label>
    <label class="fld"><span>Предупреждать за, дней</span><input type="number" min="0" max="60" data-set="warn" value="${esc(S('warn'))}"></label></div>
    <label class="fld"><span>Куда летят по умолчанию</span><input data-set="dest" value="${esc(D.set.dest || '')}" placeholder="например, Каир"><div class="hint">Подставляется в поездки, где не указано «Куда». Настройки тоже передаются при обмене.</div></label>
  </div>
  <div class="card"><h3>${ic('info')}Приложение</h3>
    <div class="kv"><span>Сотрудников</span><div>${nE}</div><span>Поездок</span><div>${nT}</div><span>Версия</span><div>${VER}</div><span>Хранение</span><div id="persist">в памяти этого браузера</div></div>
    <div class="btns">${installEv ? `<button class="btn pri" data-do="install">${ic('download')} Установить приложение</button>` : ''}${hasDemo() ? `<button class="btn" data-do="undemo">Удалить пример</button>` : ''}<button class="btn dan" data-do="wipe">${ic('trash')} Стереть данные на этом устройстве</button></div>
    ${!installEv && !matchMedia('(display-mode: standalone)').matches ? `<p class="small" style="margin-top:10px">Установка: на Android в Chrome меню ⋮ → «Добавить на главный экран». На iPhone в Safari «Поделиться» → «На экран Домой». На ПК в Chrome или Edge значок установки справа в адресной строке.</p>` : ''}
  </div></div></div>`;
}

/* ---------- привязка событий в списках ---------- */
function bindView(v) {
  $$('[data-q]', v).forEach(i => i.oninput = () => { Q[i.dataset.q] = i.value; const pos = i.selectionStart; render(); const ni = $(`[data-q="${i.dataset.q}"]`); ni.focus(); try { ni.setSelectionRange(pos, pos); } catch (e) { } });
  $$('[data-f]', v).forEach(b => b.onclick = () => { const [k, val] = b.dataset.f.split(':'); if (k === 'past') F.past = !F.past; else F[k] = val; render(); });
  $$('[data-jump]', v).forEach(b => b.onclick = () => { const el = $('#g-' + b.dataset.jump); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); else toast('Здесь пусто'); });
  $$('[data-leg]', v).forEach(r => r.onclick = e => {
    if (e.target.closest('[data-mark]')) return;
    if (e.target.closest('.ck') || SEL.size) return toggleSel(r.dataset.leg);
    editTrip(r.dataset.leg.split(':')[0]);
  });
  $$('[data-emp]', v).forEach(r => r.onclick = e => {
    if (e.target.closest('.ck') || SEL.size) return toggleSel(r.dataset.emp);
    editEmp(r.dataset.emp);
  });
  $$('[data-mark]', v).forEach(b => b.onclick = e => { e.stopPropagation(); mark([b.dataset.key], b.dataset.mark); });
  $$('[data-set]', v).forEach(i => i.onchange = () => {
    let val = i.value.trim(); const k = i.dataset.set;
    if (k !== 'dest') { val = Math.max(+i.min, Math.min(+i.max, parseInt(val) || DEF[k])); i.value = val; }
    setF(D.set, k, val); L.dirty.set = 1; save(); badges(); toast('Сохранено');
  });
  if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(p => { const el = $('#persist'); if (el) el.textContent = p ? 'в памяти устройства, защищено от автоочистки' : 'в памяти этого браузера'; });
}
function toggleSel(k) { SEL.has(k) ? SEL.delete(k) : SEL.add(k); render(); }
function bulkBar() {
  const b = $('#bulk');
  $('#fab').style.visibility = SEL.size ? 'hidden' : '';
  if (!SEL.size || TAB === 'sync') { b.classList.add('hide'); return; }
  b.classList.remove('hide');
  const n = SEL.size;
  if (TAB === 'emp') b.innerHTML = `<span class="t">Выбрано: ${n}</span><button class="btn sm ok" data-b="grouptrip">${ic('up')} Поездка</button><button class="btn sm" data-b="empxls">${ic('xls')} Excel</button><button class="btn sm" data-b="empdel">${ic('trash')}</button><button class="btn sm" data-b="all">Все</button><button class="btn sm" data-b="clr">${ic('x')}</button>`;
  else b.innerHTML = `<span class="t">Выбрано: ${n}</span><button class="btn sm ok" data-b="sent">${ic('check')} Подано</button><button class="btn sm" data-b="tk">${ic('ticket')} Билет</button><button class="btn sm" data-b="reqxls">${ic('xls')} Excel для заявки</button><button class="btn sm" data-b="copy">${ic('copy')} Текст</button><button class="btn sm" data-b="clr">${ic('x')}</button>`;
  $$('[data-b]', b).forEach(x => x.onclick = () => bulk(x.dataset.b));
}
async function bulk(a) {
  const keys = [...SEL];
  if (a === 'clr') { SEL.clear(); return render(); }
  if (a === 'all') { emps().forEach(e => SEL.add(e.id)); return render(); }
  if (a === 'sent' || a === 'tk') return mark(keys, a);
  if (a === 'reqxls') return reqXlsx(keys.map(legByKey).filter(Boolean));
  if (a === 'copy') return copyReq(keys.map(legByKey).filter(Boolean));
  if (a === 'empxls') return exportXlsx(keys);
  if (a === 'grouptrip') return groupTrip(keys);
  if (a === 'empdel') {
    if (!await ask({ title: `Удалить ${keys.length} ${pl(keys.length, 'сотрудника', 'сотрудников', 'сотрудников')}?`, text: 'Вместе с их поездками. На другом устройстве они удалятся после обмена.', ok: 'Удалить', danger: true })) return;
    keys.forEach(id => { const e = D.emp[id]; if (e) { delRec(e); tripsOf(id).forEach(delRec); } });
    SEL.clear(); save(); render(); toast('Удалено');
  }
}
function mark(keys, st) {
  let n = 0;
  keys.forEach(key => { const l = legByKey(key); if (!l) return; if (setF(l.t, l.k + 'S', st)) n++; if (!l.t[l.k + 'Sent'] || st === 'sent') setF(l.t, l.k + 'Sent', l.t[l.k + 'Sent'] || today()); });
  SEL.clear(); save(); render();
  toast(st === 'sent' ? `Отмечено: заявка подана (${keys.length})` : `Отмечено: билет есть (${keys.length})`);
}

/* ---------- карточка сотрудника ---------- */
function editEmp(id, preset) {
  const exist = id ? D.emp[id] : null;
  const r = exist || { id: uid(), _t: {} };
  if (!exist && preset) for (const k in preset) setF(r, k, preset[k]);
  const commit = () => { if (!D.emp[r.id] && (r.fio || '').trim()) D.emp[r.id] = r; save(false); };
  const fld = (k, label, type = 'text', extra = '') => `<label class="fld" data-w="${k}"><span>${label}</span><input type="${type}" data-f="${k}" value="${esc(r[k] || '')}" ${extra}></label>`;
  const issHtml = () => { const iss = D.emp[r.id] ? issues(r, nextLeg(r.id)) : []; return iss.length ? `<div class="banner" style="margin-bottom:6px">${ic('alert')}<span class="sp">${iss.map(x => x[0]).join(', ')}</span></div>` : ''; };
  const body = () => {
    const tl = D.emp[r.id] ? tripsOf(r.id) : [];
    return `<div id="issBox">${issHtml()}</div>
    <div class="grp">Сотрудник</div>
    ${fld('fio', 'ФИО *', 'text', 'placeholder="Фамилия Имя Отчество" autocomplete="off"')}
    ${fld('lat', 'ФИО латиницей, как в загранпаспорте', 'text', 'placeholder="IVANOV IVAN" style="text-transform:uppercase" autocomplete="off"')}
    <div class="cols">${fld('pos', 'Должность')}${fld('city', 'Базовый город', 'text', 'placeholder="откуда летит" list="cities"')}</div>
    <div class="grp">Контакты</div>
    <label class="fld"><span>Телефон</span><div class="inl"><input type="tel" data-f="phone" value="${esc(r.phone || '')}" placeholder="+7 …"><a data-l="tel" title="Позвонить">${ic('phone')}</a><a data-l="wa" target="_blank" rel="noopener" title="WhatsApp">${ic('msg')}</a></div></label>
    <label class="fld"><span>Почта</span><div class="inl"><input type="email" data-f="email" value="${esc(r.email || '')}" placeholder="name@mail.ru"><a data-l="mail" title="Написать">${ic('mail')}</a></div></label>
    <div class="grp">Паспорт</div>
    <div class="cols">${fld('pass', 'Серия и номер', 'text', 'autocomplete="off"')}${fld('cit', 'Гражданство', 'text', 'list="cits"')}</div>
    <div class="cols">${fld('birth', 'Дата рождения', 'date')}${fld('pIss', 'Дата выдачи', 'date')}</div>
    <div class="cols">${fld('pExp', 'Действует до', 'date')}<div></div></div>
    <div class="grp">Поездки${tl.length ? ` · ${tl.length}` : ''}</div>
    ${tl.map(t => {
      const ls = legsOf(t);
      return `<div class="tripc" data-trip="${t.id}">${ls.map(l => `<div class="l">${ic(l.k === 'o' ? 'up' : 'down')}<b>${LEG[l.k]} ${fd(l.date)}</b><span class="muted">${esc(l.from || '?')} → ${esc(l.to || '?')}</span>${legPill(l)}</div>`).join('') || '<span class="muted">даты не указаны</span>'}</div>`;
    }).join('')}
    <button class="btn" data-addtrip style="width:100%">${ic('plus')} Добавить поездку</button>
    <div class="grp">Заметка</div>
    <label class="fld"><textarea data-f="note" placeholder="Любая информация">${esc(r.note || '')}</textarea></label>
    <datalist id="cities">${[...new Set(emps().map(e => e.city).filter(Boolean))].map(c => `<option value="${esc(c)}">`).join('')}</datalist>
    <datalist id="cits">${[...new Set(['РФ', 'Беларусь', 'Узбекистан', 'Казахстан', 'Таджикистан', 'Кыргызстан', ...emps().map(e => e.cit)].filter(Boolean))].map(c => `<option value="${esc(c)}">`).join('')}</datalist>`;
  };
  const el = openSheet(1, exist ? esc(r.fio) : 'Новый сотрудник', body(),
    `${exist ? `<button class="btn dan" data-del>${ic('trash')} Удалить</button>` : ''}<button class="btn pri" data-done>${ic('check')} Готово</button>`,
    () => { commit(); save(); render(); });
  const links = () => {
    const d = String(r.phone || '').replace(/\D/g, '');
    const set = (n, href) => { const a = el.querySelector(`[data-l="${n}"]`); if (!a) return; a.classList.toggle('hide', !href); if (href) a.href = href; };
    set('tel', d ? 'tel:+' + d : ''); set('wa', d ? 'https://wa.me/' + d : ''); set('mail', r.email ? 'mailto:' + r.email : '');
  };
  const bind = () => {
    $$('[data-f]', el).forEach(i => {
      i.oninput = () => {
        let v = i.value; if (i.dataset.f === 'lat') v = v.toUpperCase();
        setF(r, i.dataset.f, v);
        if (i.dataset.f === 'fio') el.querySelector('.sh-h h3').textContent = r.fio || 'Новый сотрудник';
        commit(); links();
      };
      i.onchange = () => {
        if (i.type !== 'date' && i.value !== i.value.trim()) { i.value = i.value.trim(); setF(r, i.dataset.f, i.dataset.f === 'lat' ? i.value.toUpperCase() : i.value); }
        commit(); const b = el.querySelector('#issBox'); if (b) b.innerHTML = issHtml();
      };
    });
    links();
    $$('[data-trip]', el).forEach(c => c.onclick = () => editTrip(c.dataset.trip, null, 2, redraw));
    el.querySelector('[data-addtrip]').onclick = () => {
      if (!(r.fio || '').trim()) { toast('Сначала введите ФИО'); el.querySelector('[data-f="fio"]').focus(); return; }
      commit(); editTrip(null, { emp: r.id }, 2, redraw);
    };
  };
  const redraw = () => { const b = el.querySelector('.sh-b'), st = b.scrollTop; b.innerHTML = body(); bind(); b.scrollTop = st; };
  bind();
  el.querySelector('[data-done]').onclick = () => closeSheet(1);
  const d = el.querySelector('[data-del]');
  if (d) d.onclick = async () => {
    if (!await ask({ title: 'Удалить сотрудника?', text: `${r.fio}\nВместе с поездками (${tripsOf(r.id).length}).`, ok: 'Удалить', danger: true })) return;
    tripsOf(r.id).forEach(delRec); delRec(r); closeSheet(1); toast('Удалено');
  };
  if (!exist) setTimeout(() => el.querySelector('[data-f="fio"]').focus(), 260);
}

/* ---------- поездка ---------- */
function editTrip(id, preset, level = 1, after) {
  const exist = id ? D.trip[id] : null;
  const r = exist || { id: uid(), _t: {} };
  if (!exist && preset) for (const k in preset) setF(r, k, preset[k]);
  const commit = () => { if (!D.trip[r.id] && r.emp && (r.oD || r.bD)) D.trip[r.id] = r; save(false); };
  const e = () => D.emp[r.emp] || null;
  const dlHtml = k => { if (!r[k + 'D'] || !e()) return ''; const l = legsOf(r).find(x => x.k === k); return l ? `<div class="dl">${legPill(l)}</div>` : ''; };
  const legBlock = k => {
    const date = r[k + 'D'] || '', st = r[k + 'S'] || '';
    const dlLine = `<div data-dl="${k}">${dlHtml(k)}</div>`;
    return `<div class="leg"><h4>${ic(k === 'o' ? 'up' : 'down')}${k === 'o' ? 'Вылет' : 'Прилёт (обратный рейс)'}</h4>
      <div class="cols"><label class="fld"><span>Дата ${k === 'o' ? 'вылета' : 'прилёта'}</span><input type="date" data-f="${k}D" value="${esc(date)}"></label>
      <label class="fld"><span>Рейс / бронь</span><input data-f="${k}Tk" value="${esc(r[k + 'Tk'] || '')}" placeholder="например, SU 2133"></label></div>
      ${dlLine}
      <div class="seg" data-seg="${k}S" style="margin-top:8px"><button data-v="" class="${!st ? 'on' : ''}">Нет заявки</button><button data-v="sent" class="b ${st === 'sent' ? 'on' : ''}">Заявка подана</button><button data-v="tk" class="g ${st === 'tk' ? 'on' : ''}">Билет есть</button></div>
      ${st ? `<label class="fld" style="margin:10px 0 0"><span>Дата подачи заявки</span><input type="date" data-f="${k}Sent" value="${esc(r[k + 'Sent'] || '')}"></label>` : ''}</div>`;
  };
  const body = () => {
    const em = e();
    return `${exist || (preset && preset.emp) ? `<div class="card" style="padding:10px 12px;margin-bottom:12px;display:flex;gap:10px;align-items:center">${ic('users')}<div style="flex:1"><b>${esc(em ? em.fio : '')}</b><div class="small muted">${esc([em && em.pos, em && em.city].filter(Boolean).join(' · '))}</div></div></div>`
      : `<label class="fld"><span>Сотрудник *</span><select data-f="emp"><option value="">— выберите —</option>${emps().map(x => `<option value="${x.id}" ${x.id === r.emp ? 'selected' : ''}>${esc(x.fio)}${x.city ? ' · ' + esc(x.city) : ''}</option>`).join('')}</select></label>`}
      <div class="cols"><label class="fld"><span>Откуда</span><input data-f="from" value="${esc(r.from || '')}" placeholder="${esc(em && em.city ? em.city + ' (базовый)' : 'базовый город')}" list="cities2"></label>
      <label class="fld"><span>Куда</span><input data-f="to" value="${esc(r.to || '')}" placeholder="${esc(S('dest') || 'город объекта')}" list="cities2"></label></div>
      ${legBlock('o')}${legBlock('b')}
      <label class="fld"><span>Заметка</span><textarea data-f="note" placeholder="Например: багаж, пересадка">${esc(r.note || '')}</textarea></label>
      <datalist id="cities2">${[...new Set([...emps().map(x => x.city), ...trips().map(t => t.to), S('dest')].filter(Boolean))].map(c => `<option value="${esc(c)}">`).join('')}</datalist>`;
  };
  const title = exist ? 'Поездка' : 'Новая поездка';
  const el = openSheet(level, title, body(), `${exist ? `<button class="btn dan" data-del>${ic('trash')} Удалить</button>` : ''}<button class="btn pri" data-done>${ic('check')} Готово</button>`,
    () => { commit(); save(); if (after) after(); render(); });
  const redraw = () => { const b = el.querySelector('.sh-b'), st = b.scrollTop; b.innerHTML = body(); bind(); b.scrollTop = st; };
  const bind = () => {
    $$('[data-f]', el).forEach(i => {
      const upd = () => { $$('[data-dl]', el).forEach(d => d.innerHTML = dlHtml(d.dataset.dl)); };
      i.oninput = () => { setF(r, i.dataset.f, i.value); commit(); if (i.type === 'date') upd(); };
      i.onchange = () => { setF(r, i.dataset.f, i.tagName === 'SELECT' || i.type === 'date' ? i.value : i.value.trim()); commit(); if (i.tagName === 'SELECT') redraw(); else upd(); };
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
    if (!r.oD && !r.bD) return toast('Укажите дату вылета или прилёта');
    closeSheet(level);
  };
  const d = el.querySelector('[data-del]');
  if (d) d.onclick = async () => { if (!await ask({ title: 'Удалить поездку?', ok: 'Удалить', danger: true })) return; delRec(r); closeSheet(level); toast('Поездка удалена'); };
}
function groupTrip(ids) {
  const g = { from: '', to: '', oD: '', bD: '' };
  const names = ids.map(i => D.emp[i]).filter(Boolean);
  const el = openSheet(1, 'Поездка для ' + names.length + ' ' + pl(names.length, 'сотрудника', 'сотрудников', 'сотрудников'),
    `<p class="muted small" style="margin-top:0">${names.map(e => esc(short(e.fio))).join(', ')}</p>
    <div class="cols"><label class="fld"><span>Откуда</span><input data-g="from" placeholder="у каждого свой базовый город"></label><label class="fld"><span>Куда</span><input data-g="to" placeholder="${esc(S('dest') || 'город объекта')}"></label></div>
    <div class="cols"><label class="fld"><span>Дата вылета</span><input type="date" data-g="oD"></label><label class="fld"><span>Дата прилёта (обратно)</span><input type="date" data-g="bD"></label></div>
    <p class="small muted">Каждому создастся своя поездка, сроки заявки посчитаются автоматически.</p>`,
    `<button class="btn" data-x>Отмена</button><button class="btn pri" data-ok>${ic('check')} Создать</button>`);
  $$('[data-g]', el).forEach(i => i.oninput = () => g[i.dataset.g] = i.value.trim());
  el.querySelector('[data-x]').onclick = () => closeSheet(1);
  el.querySelector('[data-ok]').onclick = () => {
    if (!g.oD && !g.bD) return toast('Укажите хотя бы одну дату');
    names.forEach(e => { const r = { id: uid(), _t: {} }; setF(r, 'emp', e.id); for (const k in g) if (g[k]) setF(r, k, g[k]); D.trip[r.id] = r; });
    SEL.clear(); save(); closeSheet(1); render(); toast('Поездки созданы: ' + names.length);
  };
}
async function mergeDups() {
  const groups = dups(); let n = 0;
  for (const a of groups) {
    const list = a.filter(alive); if (list.length < 2) continue;
    list.sort((x, y) => (x.demo ? 1 : 0) - (y.demo ? 1 : 0) || Object.keys(y._t).length - Object.keys(x._t).length);
    const main = list[0];
    for (const o of list.slice(1)) {
      if (!alive(o)) continue;
      for (const k in o._t) if (!['id'].includes(k) && o[k] && (!main[k] || o._t[k] > (main._t[k] || 0))) setF(main, k, o[k]);
      Object.values(D.trip).filter(t => t.emp === o.id && alive(t)).forEach(t => setF(t, 'emp', main.id));
      delRec(o); n++;
    }
  }
  save(); render(); toast(n ? `Объединено: ${n}` : 'Дублей нет');
}

/* ---------- файлы ---------- */
function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
async function shareOrDownload(blob, name, mime, preferShare) {
  if (preferShare && navigator.canShare) {
    for (const [n, t] of [[name, mime], [name.replace(/\.[^.]+$/, '') + '.txt', 'text/plain']]) {
      try {
        const f = new File([blob], n, { type: t });
        if (navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: n }); return 'shared'; }
      } catch (e) { if (e.name === 'AbortError') return 'abort'; }
    }
  }
  download(blob, name); return 'download';
}
const stamp = () => { const d = new Date(); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + '-' + pad(d.getMinutes()); };
const fname = s => s.replace(/[\\/:*?"<>|]+/g, ' ').trim();

/* шифрование */
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const ub64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function keyFrom(pwd, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pwd), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encrypt(text, pwd) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFrom(pwd, salt), new TextEncoder().encode(text));
  return { app: 'vylety', v: 1, enc: 'AES-GCM', salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(ct)) };
}
async function decrypt(o, pwd) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(o.iv) }, await keyFrom(pwd, ub64(o.salt)), ub64(o.data));
  return new TextDecoder().decode(pt);
}

async function exportFile(forceDownload) {
  if (!Object.keys(D.emp).length) return toast('Пока нечего отправлять');
  const payload = { app: 'vylety', v: 1, from: L.name, dev: L.dev, at: Date.now(), emp: Object.values(D.emp), trip: Object.values(D.trip), set: D.set };
  let body = JSON.stringify(payload);
  if (L.pwd) { if (!crypto.subtle) return toast('Шифрование доступно только по https'); body = JSON.stringify(await encrypt(body, L.pwd)); }
  const name = fname(`Вылеты ${stamp()} ${L.name}.vyl`);
  const res = await shareOrDownload(new Blob([body], { type: 'application/octet-stream' }), name, 'application/octet-stream', !forceDownload && !isPC());
  if (res === 'abort') return;
  L.sent = Date.now(); L.dirty = {}; save(); render();
  toast(res === 'download' ? `Файл сохранён в «Загрузки». Передайте его на другое устройство и нажмите там «Принять файл».` : 'Файл отправлен. На другом устройстве нажмите «Принять файл».', 5000);
}
function pickFile(accept) {
  return new Promise(res => { const i = $('#fileIn'); i.value = ''; i.accept = accept || ''; i.onchange = () => res(i.files[0] || null); i.click(); });
}
async function importAny(file) {
  if (!file) return;
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isZip = head[0] === 0x50 && head[1] === 0x4b;
  if (isZip || /\.(xlsx|xlsm)$/i.test(file.name)) return importExcel(file);
  if (/\.csv$/i.test(file.name)) return importExcel(file);
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
  L.recv = Date.now(); L.recvFrom = obj.from || ''; save(); shell(); render();
  const parts = [];
  if (r.ea) parts.push(`новых сотрудников: ${r.ea}`);
  if (r.eu) parts.push(`обновлено сотрудников: ${r.eu}`);
  if (r.ta) parts.push(`новых поездок: ${r.ta}`);
  if (r.tu) parts.push(`обновлено поездок: ${r.tu}`);
  if (r.del) parts.push(`удалено: ${r.del}`);
  if (r.set) parts.push('обновлены настройки');
  const mine = dirtyN();
  await ask({
    title: parts.length ? 'Данные приняты' : 'Новых изменений нет',
    text: `Файл с устройства «${esc(obj.from || '?')}» от ${ftime(obj.at)}.\n` + (parts.length ? parts.join('\n') : 'Всё уже совпадает.') +
      (mine ? `\n\nНа этом устройстве есть свои изменения (${mine}), которых там нет. Отправьте файл обратно, чтобы данные совпали.` : ''),
    ok: mine ? 'Отправить обратно' : 'Хорошо', cancel: mine ? 'Позже' : null
  }).then(v => { if (v && mine) exportFile(); });
}
function merge(obj) {
  const r = { ea: 0, eu: 0, ta: 0, tu: 0, del: 0, set: 0 };
  const one = (col, rec, a, u) => {
    if (!rec || !rec.id || !rec._t) return;
    const cur = D[col][rec.id];
    if (!cur) { D[col][rec.id] = JSON.parse(JSON.stringify(rec)); if (alive(rec) && !rec.demo) r[a]++; return; }
    const wasAlive = alive(cur); let ch = false;
    for (const k in rec._t) { if (!(k in cur._t) || rec._t[k] > cur._t[k]) { cur[k] = rec[k]; cur._t[k] = rec._t[k]; ch = true; } }
    if ((rec._del || 0) > (cur._del || 0)) { cur._del = rec._del; ch = true; }
    if (wasAlive && !alive(cur)) { if (!cur.demo) r.del++; } else if (ch && alive(cur)) r[u]++;
  };
  (obj.emp || []).forEach(x => one('emp', x, 'ea', 'eu'));
  (obj.trip || []).forEach(x => one('trip', x, 'ta', 'tu'));
  if (obj.set && obj.set._t) for (const k in obj.set._t) if (!(k in D.set._t) || obj.set._t[k] > D.set._t[k]) { D.set[k] = obj.set[k]; D.set._t[k] = obj.set._t[k]; r.set = 1; }
  return r;
}

/* ---------- Excel ---------- */
const EMP_COLS = [['fio', 'ФИО', 32], ['lat', 'ФИО латиницей', 26], ['pos', 'Должность', 18], ['city', 'Базовый город', 18], ['phone', 'Телефон', 18], ['email', 'Почта', 26], ['cit', 'Гражданство', 14], ['birth', 'Дата рождения', 13, 1], ['pass', 'Паспорт №', 15], ['pIss', 'Дата выдачи', 13, 1], ['pExp', 'Действует до', 13, 1]];
const cell = (v, isDate) => isDate ? (v ? { d: v } : '') : (v || '');
const ST_RU = { '': 'нет заявки', sent: 'заявка подана', tk: 'билет есть' };
async function exportXlsx(onlyIds) {
  const es = emps().filter(e => !onlyIds || onlyIds.includes(e.id));
  const ids = new Set(es.map(e => e.id));
  const s1 = [[...EMP_COLS.map(c => c[1]), 'Ближайший рейс', 'Заметка']];
  es.forEach(e => { const nl = nextLeg(e.id); s1.push([...EMP_COLS.map(c => cell(e[c[0]], c[3])), nl ? `${LEG[nl.k]} ${fd(nl.date)}` : '', e.note || '']); });
  const s2 = [['ФИО', 'Откуда', 'Куда', 'Дата вылета', 'Срок заявки (вылет)', 'Статус (вылет)', 'Рейс (вылет)', 'Дата прилёта', 'Срок заявки (прилёт)', 'Статус (прилёт)', 'Рейс (прилёт)', 'Заметка']];
  const lead = +S('lead');
  trips().filter(t => ids.has(t.emp)).sort((a, b) => (a.oD || a.bD || '').localeCompare(b.oD || b.bD || '')).forEach(t => {
    const e = D.emp[t.emp];
    s2.push([e.fio, t.from || e.city || '', t.to || S('dest') || '', cell(t.oD, 1), t.oD ? { d: addD(t.oD, -lead) } : '', t.oD ? ST_RU[t.oS || ''] : '', t.oTk || '', cell(t.bD, 1), t.bD ? { d: addD(t.bD, -lead) } : '', t.bD ? ST_RU[t.bS || ''] : '', t.bTk || '', t.note || '']);
  });
  const s3 = [['Срок заявки', 'Осталось дней', 'ФИО', 'Рейс', 'Дата рейса', 'Откуда', 'Куда', 'Статус']];
  allLegs().filter(l => ids.has(l.e.id) && l.fleft >= 0).sort((a, b) => a.dl.localeCompare(b.dl)).forEach(l => s3.push([{ d: l.dl }, l.st ? '' : l.dleft, l.e.fio, LEG[l.k], { d: l.date }, l.from, l.to, ST_RU[l.st]]));
  const blob = await XL.write([
    { name: 'Сотрудники', rows: s1, head: true, widths: [...EMP_COLS.map(c => c[2]), 20, 30] },
    { name: 'Поездки', rows: s2, head: true, widths: [32, 16, 16, 13, 14, 15, 14, 13, 14, 15, 14, 30] },
    { name: 'Сроки заявок', rows: s3, head: true, widths: [13, 10, 32, 10, 13, 16, 16, 16] }]);
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
  const ask2 = ls.filter(l => !l.st).length;
  if (ask2 && await ask({ title: 'Отметить заявку поданной?', text: `Для ${ask2} ${pl(ask2, 'рейса', 'рейсов', 'рейсов')} поставить «заявка подана» с сегодняшней датой?`, ok: 'Отметить', cancel: 'Нет' })) mark(ls.filter(l => !l.st).map(l => l.key), 'sent');
  else { SEL.clear(); render(); }
}
async function copyReq(ls) {
  ls.sort((a, b) => a.date.localeCompare(b.date));
  const txt = ls.map((l, i) => { const e = l.e; return `${i + 1}. ${e.fio}${e.lat ? ' (' + e.lat + ')' : ''}` + (e.birth ? `, д.р. ${fd(e.birth)}` : '') + (e.pass ? `, паспорт ${e.pass}` + (e.pExp ? ` до ${fd(e.pExp)}` : '') : '') + (e.phone ? `, тел. ${e.phone}` : '') + `\n   ${LEG[l.k]} ${fd(l.date)}: ${l.from || '?'} → ${l.to || '?'}`; }).join('\n');
  try { await navigator.clipboard.writeText(txt); toast('Скопировано: ' + ls.length); }
  catch (e) { await ask({ title: 'Скопируйте вручную', text: esc(txt), cancel: null }); }
}
async function xlsTemplate() {
  const rows = [[...EMP_COLS.map(c => c[1]), 'Откуда', 'Куда', 'Дата вылета', 'Дата прилёта', 'Заметка'],
  ['Иванов Иван Иванович', 'IVANOV IVAN', 'Монтажник', 'Москва', '+7 900 000-00-00', 'ivanov@mail.ru', 'РФ', { d: '1985-01-15' }, '75 1234567', { d: '2020-05-01' }, { d: '2030-05-01' }, '', 'Каир', { d: addD(today(), 60) }, { d: addD(today(), 120) }, 'пример, удалите строку']];
  const blob = await XL.write([{ name: 'Сотрудники', rows, head: true, widths: [...EMP_COLS.map(c => c[2]), 16, 16, 13, 13, 24] }]);
  await shareOrDownload(blob, 'Шаблон Вылеты.xlsx', blob.type, false);
}
function mapHeader(h) {
  const s = norm(h).replace(/[.:]/g, '');
  if (!s || /заявк|статус|подан|ближайш|осталось|№ п|^№$|^n$|кем выдан|рейс/.test(s)) return null;
  if (/лат|latin|англ|english|en name|name/.test(s)) return 'lat';
  if (/рожд|birth/.test(s)) return 'birth';
  if (/действ|срок|expir|годен/.test(s)) return 'pExp';
  if (/выдач|issue/.test(s)) return 'pIss';
  if (/паспорт|passport|серия|номер док/.test(s)) return 'pass';
  if (/граждан|citizen/.test(s)) return 'cit';
  if (/фио|ф и о|сотрудник|фамилия|работник|^имя/.test(s)) return 'fio';
  if (/должн|профес|position/.test(s)) return 'pos';
  if (/откуда/.test(s)) return 'from';
  if (/куда|назнач|объект/.test(s)) return 'to';
  if (/вылет|отъезд|туда/.test(s)) return 'oD';
  if (/прил[её]т|возвр|обрат|приезд/.test(s)) return 'bD';
  if (/город|city/.test(s)) return 'city';
  if (/тел|phone|моб/.test(s)) return 'phone';
  if (/почт|mail/.test(s)) return 'email';
  if (/замет|примеч|коммент|note/.test(s)) return 'note';
  return null;
}
function toIso(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'object' && v.d) return v.d;
  if (typeof v === 'number') return v > 20000 && v < 80000 ? XL.serialToIso(v) : '';
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (m) { let y = +m[3]; if (y < 100) y += y > 50 ? 1900 : 2000; return `${y}-${pad(m[2])}-${pad(m[1])}`; }
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
      if ('fio' in map && Object.keys(map).some(k => !['fio', 'from', 'to'].includes(k)) && (!best || score > best.score)) best = { sh, ri, map, score };
    }
    if (best) found.push(best);
  }
  if (!found.length) return ask({ title: 'Не нашёл столбец с ФИО', text: 'В первой строке таблицы должны быть названия столбцов: ФИО, Паспорт, Телефон, Почта, Город, Дата вылета, Дата прилёта… Скачайте шаблон в разделе «Обмен», там всё подписано.', cancel: null });
  const byPass = {}, byFio = {};
  emps().forEach(e => { if (e.pass) byPass[normPass(e.pass)] = e; if (e.fio) byFio[norm(e.fio)] = e; });
  const r = { ea: 0, eu: 0, ta: 0, skip: 0 };
  const EF = ['fio', 'lat', 'pos', 'city', 'phone', 'email', 'cit', 'birth', 'pass', 'pIss', 'pExp', 'note'];
  for (const { sh, ri, map } of found) for (const row of sh.rows.slice(ri + 1)) {
    const tripSheet = ('oD' in map || 'bD' in map) && !('pass' in map) && !('phone' in map);
    const g = {};
    for (const k in map) { let v = row[map[k]]; v = DATES.has(k) ? toIso(v) : (v == null ? '' : (typeof v === 'object' && v.d ? fd(v.d) : String(v))).trim(); g[k] = v; }
    if (g.lat) g.lat = g.lat.toUpperCase();
    if (!g.fio) { if (Object.values(g).some(Boolean)) r.skip++; continue; }
    if (/пример, удалите/i.test(g.note || '')) continue;
    let e = (g.pass && byPass[normPass(g.pass)]) || byFio[norm(g.fio)];
    if (!e) { e = { id: uid(), _t: {} }; D.emp[e.id] = e; r.ea++; byFio[norm(g.fio)] = e; if (g.pass) byPass[normPass(g.pass)] = e; }
    else if (!tripSheet) { let ch = false; EF.forEach(k => { if (g[k] && g[k] !== (e[k] || '')) ch = true; }); if (ch) r.eu++; }
    if (tripSheet) { delete g.city; }
    EF.forEach(k => { if (g[k] && !(tripSheet && k === 'note')) setF(e, k, g[k]); });
    if (g.oD || g.bD) {
      const ex = Object.values(D.trip).filter(t => alive(t) && t.emp === e.id).find(t => (g.oD && t.oD === g.oD) || (g.bD && t.bD === g.bD) || (g.oD && !t.oD && t.bD && t.bD > g.oD && !g.bD));
      const t = ex || { id: uid(), _t: {} };
      setF(t, 'emp', e.id);
      ['oD', 'bD', 'from', 'to'].forEach(k => { if (g[k]) setF(t, k, g[k]); });
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
  const fold = s => { const out = []; let cur = ''; for (const ch of s) { if (new TextEncoder().encode(cur + ch).length > 73) { out.push(cur); cur = ' ' + ch; } else cur += ch; } out.push(cur); return out.join('\r\n'); };
  const ie = s => String(s).replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const L_ = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Vylety//RU', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Заявки на вылет'];
  ls.forEach(l => {
    const d = l.dl < t ? t : l.dl;
    L_.push('BEGIN:VEVENT', 'UID:' + l.key.replace(':', '-') + '@vylety', 'DTSTAMP:' + stampU, 'DTSTART;VALUE=DATE:' + d.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + addD(d, 1).replace(/-/g, ''),
      fold('SUMMARY:' + ie(`Заявка: ${short(l.e.fio)} (${LEG[l.k].toLowerCase()} ${fds(l.date)})`)),
      fold('DESCRIPTION:' + ie(`${l.e.fio}\n${LEG[l.k]} ${fd(l.date)}: ${l.from || '?'} → ${l.to || '?'}\nСрок заявки: ${fd(l.dl)}${l.e.phone ? '\nТел.: ' + l.e.phone : ''}`)),
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Заявка на вылет', 'TRIGGER:-P3D', 'END:VALARM',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Заявка на вылет', 'TRIGGER:PT9H', 'END:VALARM', 'END:VEVENT');
  });
  L_.push('END:VCALENDAR');
  shareOrDownload(new Blob([L_.join('\r\n')], { type: 'text/calendar' }), 'Заявки на вылет.ics', 'text/calendar', false);
  toast(`В файле ${ls.length} ${pl(ls.length, 'срок', 'срока', 'сроков')}. Откройте его, чтобы добавить в календарь.`, 4000);
}

/* ---------- действия ---------- */
async function act(a) {
  if (a === 'export') return exportFile();
  if (a === 'exportdl') return exportFile(true);
  if (a === 'import') return importAny(await pickFile('.vyl,.txt,.json,.xlsx,.csv,application/json,text/plain,application/octet-stream'));
  if (a === 'xlsin') return importAny(await pickFile('.xlsx,.xlsm,.csv'));
  if (a === 'xlsout') return emps().length ? exportXlsx() : toast('Пока нет сотрудников');
  if (a === 'xlstpl') return xlsTemplate();
  if (a === 'ics') return icsFile();
  if (a === 'newemp') return editEmp(null);
  if (a === 'newtrip') return emps().length ? editTrip(null) : toast('Сначала добавьте сотрудника');
  if (a.startsWith('tog:')) { const k = a.slice(4); F[k] = !F[k]; return render(); }
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
    if (!await ask({ title: 'Стереть данные на этом устройстве?', text: 'Сотрудники и поездки удалятся только здесь. Если перед этим не отправить файл, изменения с этого устройства пропадут.', ok: 'Стереть', danger: true })) return;
    if (!await ask({ title: 'Точно стереть?', text: 'Отменить будет нельзя.', ok: 'Да, стереть', danger: true })) return;
    D = { v: 1, emp: {}, trip: {}, set: { _t: {} } }; L.dirty = {}; L.seen = 1; save(); shell(); render(); toast('Данные стёрты');
  }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-do]'); if (b) { e.preventDefault(); act(b.dataset.do); } });
$('#fab').onclick = () => TAB === 'emp' ? editEmp(null) : act('newtrip');
$('#topSync').onclick = () => go('sync');

/* клавиатура */
document.addEventListener('keydown', e => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); return exportFile(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') { e.preventDefault(); return act('import'); }
  if (e.key === 'Escape') { if (STACK.length) return closeTop(); if (SEL.size) { SEL.clear(); render(); } return; }
  if (typing || e.ctrlKey || e.metaKey || e.altKey || STACK.length || $('#modal')) return;
  if (e.key === '/') { const s = $('[data-q]'); if (s) { e.preventDefault(); s.focus(); } }
  else if (e.key.toLowerCase() === 'n' || e.key.toLowerCase() === 'т') { e.preventDefault(); TAB === 'emp' ? editEmp(null) : act('newtrip'); }
  else if (/^[1-4]$/.test(e.key)) go(TABS[+e.key - 1][0]);
});

/* перетаскивание файла (ПК) */
let dragN = 0;
window.addEventListener('dragenter', e => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { dragN++; $('#drop').classList.add('on'); } });
window.addEventListener('dragleave', () => { if (--dragN <= 0) { dragN = 0; $('#drop').classList.remove('on'); } });
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => { e.preventDefault(); dragN = 0; $('#drop').classList.remove('on'); const f = e.dataTransfer.files[0]; if (f) importAny(f); });

/* открытие .vyl двойным щелчком (установленное приложение на ПК) */
if ('launchQueue' in window) launchQueue.setConsumer(async p => { if (p.files && p.files.length) importAny(await p.files[0].getFile()); });

/* файл, присланный через «Поделиться» (Android) */
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
  const b = document.createElement('div'); b.className = 'banner blu'; b.style.cssText = 'position:fixed;left:12px;right:12px;top:12px;z-index:80;max-width:520px;margin:0 auto;box-shadow:0 6px 20px rgba(0,0,0,.2)';
  b.innerHTML = `${ic('download')}<span class="sp">Готова новая версия приложения.</span><button class="btn sm pri">Обновить</button>`;
  b.querySelector('button').onclick = () => w.postMessage('skipWaiting');
  document.body.appendChild(b);
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => { if (!p) navigator.storage.persist(); });

/* старт */
{ const m = location.search.match(/[?&]tab=(req|sch|emp|sync)/); if (m) { TAB = L.tab = m[1]; history.replaceState(null, '', location.pathname); } }
if (!L.seen && !Object.keys(D.emp).length) { demo(); L.seen = 1; save(); }
L.seen = 1;
let wasPC = isPC();
matchMedia('(min-width:900px)').addEventListener('change', () => { if (isPC() !== wasPC) { wasPC = isPC(); render(); } });
window.addEventListener('storage', e => { if (e.key === KEY) { D = load(); render(); badges(); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden && !STACK.length) render(); });
shell(); render(); inbox();
