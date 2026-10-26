/* Заполнение бланков заявок: Excel (рабочие, одна общая) и Word (ИТР, офис, руководство — на каждого). Нужен JSZip. */
(function () {
  const ZV = {};
  const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const NW = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const NR = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const NX = 'http://www.w3.org/XML/1998/namespace';
  const parse = s => new DOMParser().parseFromString(s, 'application/xml');
  const ser = d => new XMLSerializer().serializeToString(d);
  const kids = (el, name) => Array.from(el ? el.childNodes : []).filter(n => n.nodeType === 1 && n.localName === name);
  const all = (el, ns, name) => Array.from(el.getElementsByTagNameNS(ns, name));
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const colNum = s => { let n = 0; for (const ch of s) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
  const colName = n => { let s = ''; n++; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; };
  const EPOCH = Date.UTC(1899, 11, 30);
  const serial = iso => { const [y, m, d] = iso.split('-').map(Number); return (Date.UTC(y, m - 1, d) - EPOCH) / 864e5; };
  const splitRef = ref => { const m = /^([A-Z]+)(\d+)$/.exec(ref); return m ? [m[1], +m[2]] : null; };

  /* ================= EXCEL ================= */
  /* rows: массив строк; строка = {A:..., B:..., ...}; значение: строка | число | {d:'YYYY-MM-DD'} | '' */
  ZV.fillXlsx = async function (buf, rows, opts = {}) {
    const z = await JSZip.loadAsync(buf);
    const rd = async p => { const f = z.file(p); return f ? f.async('string') : null; };
    const wb = parse(await rd('xl/workbook.xml'));
    const relsDoc = parse(await rd('xl/_rels/workbook.xml.rels') || '<Relationships/>');
    const relMap = {}; all(relsDoc, '*', 'Relationship').forEach(r => relMap[r.getAttribute('Id')] = r.getAttribute('Target'));
    const sheetEl = all(wb, NS, 'sheet')[0];
    if (!sheetEl) throw new Error('В шаблоне Excel нет листов');
    const rid = sheetEl.getAttributeNS(NR, 'id') || sheetEl.getAttribute('r:id');
    let target = relMap[rid] || 'worksheets/sheet1.xml';
    const sheetPath = target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '');
    const sstXml = await rd('xl/sharedStrings.xml');
    const sst = sstXml ? all(parse(sstXml), NS, 'si').map(si => all(si, NS, 't').map(t => t.textContent).join('')) : [];
    const doc = parse(await rd(sheetPath));
    const sd = all(doc, NS, 'sheetData')[0];
    const cellText = c => {
      const t = c.getAttribute('t'), v = kids(c, 'v')[0];
      if (t === 's') return sst[+(v && v.textContent)] || '';
      if (t === 'inlineStr') return all(c, NS, 't').map(x => x.textContent).join('');
      return v ? v.textContent : '';
    };
    const rowEls = kids(sd, 'row');
    const rowNum = r => +r.getAttribute('r');
    const rowTexts = r => kids(r, 'c').map(cellText);
    const hdr = rowEls.find(r => rowTexts(r).some(t => /причина/i.test(t)) && rowTexts(r).some(t => /ф\.?\s*и\.?\s*о/i.test(t)));
    if (!hdr) throw new Error('В шаблоне Excel не найдена строка заголовков («Причина поездки», «Ф.И.О.»)');
    const hdrR = rowNum(hdr), tplR = hdrR + 1;
    const foot = rowEls.find(r => rowNum(r) > hdrR && rowTexts(r).some(t => /^\s*\*/.test(t) || /исполнитель/i.test(t)));
    const footR = foot ? rowNum(foot) : (Math.max(tplR, ...rowEls.map(rowNum)) + 1);
    let tplRow = rowEls.find(r => rowNum(r) === tplR);
    if (!tplRow) { tplRow = doc.createElementNS(NS, 'row'); tplRow.setAttribute('r', tplR); }
    const N = Math.max(1, rows.length);
    const delta = N - (footR - tplR);
    const map = r => r < tplR ? r : (r >= footR ? r + delta : null);
    // убрать старые строки данных
    rowEls.filter(r => rowNum(r) >= tplR && rowNum(r) < footR).forEach(r => sd.removeChild(r));
    // сдвинуть нижние строки
    kids(sd, 'row').forEach(r => {
      const n = rowNum(r); if (n < footR) return;
      const nn = map(n); r.setAttribute('r', nn);
      kids(r, 'c').forEach(c => { const p = splitRef(c.getAttribute('r')); if (p) c.setAttribute('r', p[0] + nn); });
    });
    // новые строки по образцу
    const firstFoot = kids(sd, 'row').find(r => rowNum(r) > tplR) || null;
    const setVal = (c, v) => {
      Array.from(c.childNodes).forEach(n => c.removeChild(n)); c.removeAttribute('t');
      if (v == null || v === '') return;
      if (typeof v === 'object' && v.d) { const e = doc.createElementNS(NS, 'v'); e.textContent = serial(v.d); c.appendChild(e); return; }
      if (typeof v === 'number' && isFinite(v)) { const e = doc.createElementNS(NS, 'v'); e.textContent = v; c.appendChild(e); return; }
      c.setAttribute('t', 'inlineStr');
      const is = doc.createElementNS(NS, 'is'), t = doc.createElementNS(NS, 't');
      t.setAttributeNS(NX, 'xml:space', 'preserve'); t.textContent = String(v); is.appendChild(t); c.appendChild(is);
    };
    for (let i = 0; i < N; i++) {
      const rn = tplR + i, data = rows[i] || {};
      const row = tplRow.cloneNode(true); row.setAttribute('r', rn);
      const have = {};
      kids(row, 'c').forEach(c => { const p = splitRef(c.getAttribute('r')); const col = p ? p[0] : 'A'; c.setAttribute('r', col + rn); have[col] = c; setVal(c, data[col]); });
      Object.keys(data).forEach(col => {
        if (have[col] || data[col] === '' || data[col] == null) return;
        const c = doc.createElementNS(NS, 'c'); c.setAttribute('r', col + rn); setVal(c, data[col]);
        const after = kids(row, 'c').find(x => colNum(splitRef(x.getAttribute('r'))[0]) > colNum(col));
        row.insertBefore(c, after || null);
      });
      sd.insertBefore(row, firstFoot);
    }
    const lastData = tplR + N - 1;
    const mapRef = (ref, expand) => {
      const [a, b] = ref.split(':'); const pa = splitRef(a), pb = b ? splitRef(b) : null;
      if (!pa) return ref;
      if (pa[1] >= tplR && pa[1] < footR) return expand ? `${pa[0]}${tplR}${pb ? ':' + pb[0] + lastData : (N > 1 ? ':' + pa[0] + lastData : '')}` : null;
      const na = map(pa[1]), nb = pb ? (pb[1] >= tplR && pb[1] < footR ? lastData : map(pb[1])) : null;
      if (na == null) return null;
      return pa[0] + na + (pb ? ':' + pb[0] + nb : '');
    };
    // объединённые ячейки
    const mcs = all(doc, NS, 'mergeCells')[0];
    if (mcs) { kids(mcs, 'mergeCell').forEach(m => { const r = mapRef(m.getAttribute('ref'), false); if (r && r.includes(':')) m.setAttribute('ref', r); else mcs.removeChild(m); }); mcs.setAttribute('count', kids(mcs, 'mergeCell').length); }
    const dim = all(doc, NS, 'dimension')[0];
    if (dim) { const r = mapRef(dim.getAttribute('ref'), false); if (r) dim.setAttribute('ref', r); }
    const af = all(doc, NS, 'autoFilter')[0];
    if (af) { const p = splitRef(af.getAttribute('ref').split(':')[1] || '') || ['R']; af.setAttribute('ref', `A${hdrR}:${p[0]}${lastData}`); }
    [...all(doc, NS, 'dataValidation'), ...all(doc, NS, 'conditionalFormatting')].forEach(el => {
      const sq = (el.getAttribute('sqref') || '').split(/\s+/).filter(Boolean).map(r => mapRef(r, true)).filter(Boolean);
      if (sq.length) el.setAttribute('sqref', sq.join(' ')); else el.parentNode.removeChild(el);
    });
    const hl = all(doc, NS, 'hyperlinks')[0];
    if (hl) { kids(hl, 'hyperlink').forEach(h => { const r = mapRef(h.getAttribute('ref'), false); if (r) h.setAttribute('ref', r); else hl.removeChild(h); }); if (!kids(hl, 'hyperlink').length) hl.parentNode.removeChild(hl); }
    // заголовок «ЗАЯВКА № … от …»
    if (opts.title) for (const r of kids(sd, 'row')) for (const c of kids(r, 'c')) if (/^\s*заявка/i.test(cellText(c))) { setVal(c, opts.title); break; }
    z.file(sheetPath, ser(doc));
    // имя листа и именованные диапазоны
    const oldName = sheetEl.getAttribute('name');
    const newName = (opts.sheetName || oldName).replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 31).trim() || 'Заявка';
    sheetEl.setAttribute('name', newName);
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const q = n => `'${n.replace(/'/g, "''")}'`;
    all(wb, NS, 'definedName').forEach(dn => {
      let t = dn.textContent;
      const re = new RegExp(`(?:'${esc(oldName.replace(/'/g, "''"))}'|${esc(oldName)})!`, 'g');
      if (!re.test(t) && dn.getAttribute('localSheetId') !== '0') return;
      t = t.replace(re, q(newName) + '!');
      if (/_FilterDatabase/.test(dn.getAttribute('name'))) t = t.replace(/\$([A-Z]+)\$(\d+):\$([A-Z]+)\$(\d+)/, (m, a, r1, b) => `$${a}$${hdrR}:$${b}$${lastData}`);
      else t = t.replace(/\$([A-Z]+)\$(\d+)/g, (m, c, r) => { const n = +r; const nn = n >= footR ? n + delta : (n >= tplR ? lastData : n); return `$${c}$${nn}`; });
      dn.textContent = t;
    });
    z.file('xl/workbook.xml', ser(wb));
    const app = await rd('docProps/app.xml');
    if (app) z.file('docProps/app.xml', app.split(oldName).join(newName));
    z.remove('xl/calcChain.xml');
    return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', compression: 'DEFLATE' });
  };
  ZV.checkXlsx = async function (buf) {
    const z = await JSZip.loadAsync(buf); const ss = z.file('xl/sharedStrings.xml'); const s = ss ? await ss.async('string') : '';
    const sh = Object.keys(z.files).filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)); let t = s;
    for (const n of sh) t += await z.file(n).async('string');
    return /Причина/i.test(t) && /Ф\.?\s*И\.?\s*О/i.test(t);
  };

  /* ================= WORD ================= */
  const W = (doc, name) => doc.createElementNS(NW, 'w:' + name);
  const txt = el => all(el, NW, 't').map(t => t.textContent).join('');
  function setCell(doc, tc, text) {
    if (!tc) return;
    let ps = kids(tc, 'p'); let p = ps[0];
    if (!p) { p = W(doc, 'p'); tc.appendChild(p); }
    ps.slice(1).forEach(x => tc.removeChild(x));
    setPara(doc, p, text);
  }
  function setPara(doc, p, text) {
    const runs = kids(p, 'r'); let r = runs[0];
    Array.from(p.childNodes).forEach(n => { if (n !== r && !(n.nodeType === 1 && n.localName === 'pPr')) p.removeChild(n); });
    if (!r) {
      r = W(doc, 'r'); const ppr = kids(p, 'pPr')[0], mark = ppr && kids(ppr, 'rPr')[0];
      if (mark) r.appendChild(mark.cloneNode(true));
      p.appendChild(r);
    }
    Array.from(r.childNodes).forEach(n => { if (!(n.nodeType === 1 && n.localName === 'rPr')) r.removeChild(n); });
    const t = W(doc, 't'); t.setAttributeNS(NX, 'xml:space', 'preserve'); t.textContent = text == null ? '' : String(text); r.appendChild(t);
  }
  function fillDocOne(doc, a, o) {
    const body = all(doc, NW, 'body')[0];
    const t0 = kids(body, 'tbl')[0];
    if (!t0) throw new Error('В шаблоне Word нет таблицы');
    const rows = kids(t0, 'tr'), cells = tr => kids(tr, 'tc');
    const ct = tc => norm(txt(tc));
    const findRow = (re, from = 0, to = rows.length) => { for (let i = from; i < to; i++) if (cells(rows[i]).some(c => re.test(ct(c)))) return i; return -1; };
    const after = (re, from = 0, to = rows.length) => { for (let i = from; i < to; i++) { const cs = cells(rows[i]); for (let j = 0; j < cs.length - 1; j++) if (re.test(ct(cs[j]))) return cs[j + 1]; } return null; };
    const put = (tc, v) => { if (tc && v != null) setCell(doc, tc, v); };
    const pd = Math.max(0, findRow(/^персональные данные/));
    // реквизиты заказчика (только если заданы в настройках)
    if (o.org) put(after(/^наименование организации/, 0, pd), o.org);
    if (o.contract) put(after(/^номер договора/, 0, pd), o.contract);
    if (o.cName) put(after(/^контактное лицо/, 0, pd), o.cName);
    if (o.cWork) put(after(/^рабочий тел/, 0, pd), o.cWork);
    if (o.cMob) put(after(/^мобильный/, 0, pd), o.cMob);
    if (o.cMail) put(after(/^e-?mail/, 0, pd), o.cMail);
    // работник
    put(after(/^код структурного/, pd), a.mvz);
    put(after(/^дата заявки/, pd), a.date);
    put(after(/^табельный номер/, pd), a.tab);
    put(after(/^рабочий тел/, pd), a.wphone);
    put(after(/^e-?mail/, pd), a.email);
    put(after(/^мобильный/, pd), a.phone);
    const F = findRow(/^фамилия имя/, pd);
    if (F >= 0) {
      const r1 = rows[F + 1] && cells(rows[F + 1]), r2 = rows[F + 2] && cells(rows[F + 2]), r3 = rows[F + 3] && cells(rows[F + 3]), r4 = rows[F + 4] && cells(rows[F + 4]);
      if (r1) { put(r1[1], a.pass); put(r1[2], a.pExp); put(r1[3], a.birth); put(r1[4], a.cit); }
      if (r2) put(r2[0], a.fio);
      if (r3) put(r3[3], a.bplace);
      if (r4) put(r4[0], a.lat);
    }
    const zd = after(/^железнодорожные/), av = after(/^авиационные/);
    put(zd, a.rail ? 'х' : ''); put(av, a.rail ? '' : 'х');
    const T = findRow(/^дата отправления/);
    if (T >= 0) for (let i = 0; i < 2; i++) {
      const r = rows[T + 2 + i]; if (!r) break;
      const cs = cells(r), l = a.legs[i] || {};
      [l.date, l.flight, l.cost, l.from, l.to, l.why, '', ''].forEach((v, j) => { if (cs[j]) put(cs[j], v || ''); });
    }
    // абзацы: номер заявки, согласие
    for (const p of kids(body, 'p')) {
      const t = txt(p);
      if (/на приобретение билетов/i.test(t)) setPara(doc, p, t.replace(/№\s*_*\s*от\s*_*\s*$/i, `№ ${o.num || '_____________'} от ${o.date || '_____________'}`));
      else if (/^\s*Я,/.test(t)) {
        const bold = kids(p, 'r').filter(r => { const pr = kids(r, 'rPr')[0]; return pr && kids(pr, 'b').length; });
        if (bold.length) { bold.forEach((r, i) => { const tt = kids(r, 't')[0]; if (tt) tt.textContent = i === 0 ? ' ' + a.fio + ' ' : ''; }); }
        else setPara(doc, p, t.replace(/^\s*Я,[_\s]*[^,]*?[_\s]*,/, `Я, ${a.fio},`));
      }
    }
  }
  /* apps: [{fio, lat, pass, pExp, birth, cit, bplace, mvz, tab, wphone, email, phone, date, rail, legs:[{date, flight, from, to, why}]}] */
  ZV.fillDocx = async function (buf, apps, o = {}) {
    const out = [];
    for (const a of apps) {
      const z = await JSZip.loadAsync(buf); const doc = parse(await z.file('word/document.xml').async('string'));
      fillDocOne(doc, a, o);
      out.push({ z, doc, a });
    }
    if (!o.combined) return Promise.all(out.map(async x => { x.z.file('word/document.xml', ser(x.doc)); return x.z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' }); }));
    const base = out[0], bdoc = base.doc, bbody = all(bdoc, NW, 'body')[0];
    const sect = kids(bbody, 'sectPr')[0] || null;
    for (const x of out.slice(1)) {
      const br = W(bdoc, 'p'), r = W(bdoc, 'r'), b = W(bdoc, 'br'); b.setAttributeNS(NW, 'w:type', 'page'); r.appendChild(b); br.appendChild(r);
      bbody.insertBefore(br, sect);
      kids(all(x.doc, NW, 'body')[0], '*').length;
      Array.from(all(x.doc, NW, 'body')[0].childNodes).filter(n => n.nodeType === 1 && n.localName !== 'sectPr').forEach(n => bbody.insertBefore(bdoc.importNode(n, true), sect));
    }
    base.z.file('word/document.xml', ser(bdoc));
    return [await base.z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' })];
  };
  ZV.checkDocx = async function (buf) {
    const z = await JSZip.loadAsync(buf); const f = z.file('word/document.xml'); if (!f) return false;
    const t = await f.async('string'); return /Персональные данные/.test(t) && /Фамилия Имя/.test(t);
  };

  /* ===== ЧТЕНИЕ своих Word-файлов: таблицы, абзацы и анкета «Заявка на приобретение билетов» ===== */
  ZV.readDocx = async function (buf) {
    const z = await JSZip.loadAsync(buf); const f = z.file('word/document.xml');
    if (!f) throw new Error('Это не документ Word (.docx)');
    const doc = parse(await f.async('string'));
    const body = all(doc, NW, 'body')[0];
    const cellTxt = tc => kids(tc, 'p').map(p => txt(p)).join(' ').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
    const tables = all(doc, NW, 'tbl').filter(t => !t.parentNode || t.parentNode.localName !== 'tc').map(t => kids(t, 'tr').map(tr => kids(tr, 'tc').map(cellTxt)));
    const paras = kids(body, 'p').map(p => txt(p).replace(/ /g, ' ').trim()).filter(Boolean);
    let form = null;
    const t0 = kids(body, 'tbl')[0];
    if (t0 && /Персональные данные/i.test(txt(t0)) && /Фамилия Имя/i.test(txt(t0))) {
      const rows = kids(t0, 'tr'), cells = tr => kids(tr, 'tc'), ct = tc => norm(txt(tc));
      const findRow = (re, from = 0) => { for (let i = from; i < rows.length; i++) if (cells(rows[i]).some(c => re.test(ct(c)))) return i; return -1; };
      const after = (re, from = 0) => { for (let i = from; i < rows.length; i++) { const cs = cells(rows[i]); for (let j = 0; j < cs.length - 1; j++) if (re.test(ct(cs[j]))) return cellTxt(cs[j + 1]); } return ''; };
      const pd = Math.max(0, findRow(/^персональные данные/));
      form = { mvz: after(/^код структурного/, pd), date: after(/^дата заявки/, pd), tab: after(/^табельный номер/, pd), wphone: after(/^рабочий тел/, pd), email: after(/^e-?mail/, pd), phone: after(/^мобильный/, pd), legs: [] };
      const F = findRow(/^фамилия имя/, pd);
      if (F >= 0) {
        const c = i => rows[F + i] ? cells(rows[F + i]).map(cellTxt) : [];
        const r1 = c(1), r2 = c(2), r3 = c(3), r4 = c(4);
        Object.assign(form, { pass: r1[1] || '', pExp: r1[2] || '', birth: r1[3] || '', cit: r1[4] || '', fio: r2[0] || '', bplace: r3[3] || '', lat: r4[0] || '' });
      }
      const T = findRow(/^дата отправления/);
      if (T >= 0) for (let i = 0; i < 2; i++) { const r = rows[T + 2 + i]; if (!r) break; const v = cells(r).map(cellTxt); if (v[0]) form.legs.push({ date: v[0], flight: v[1], from: v[3], to: v[4], why: v[5] }); }
      if (!form.fio) form = null;
    }
    return { tables, paras, form };
  };
  ZV.kind = async function (buf) {
    try { const z = await JSZip.loadAsync(buf); if (z.file('word/document.xml')) return 'docx'; if (z.file('xl/workbook.xml')) return 'xlsx'; } catch (e) { }
    return null;
  };
  window.ZV = ZV;
})();
