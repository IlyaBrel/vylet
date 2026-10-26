/* Мини-модуль Excel (.xlsx): запись и чтение без интернета. Нужен JSZip. */
(function () {
  const X = {};
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const colName = n => { let s = ''; n++; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; };
  const colNum = s => { let n = 0; for (const ch of s) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
  const EPOCH = Date.UTC(1899, 11, 30);
  const isoToSerial = iso => { const [y, m, d] = iso.split('-').map(Number); return (Date.UTC(y, m - 1, d) - EPOCH) / 864e5; };
  const serialToIso = n => { const d = new Date(EPOCH + Math.round(n * 864e5)); return d.toISOString().slice(0, 10); };
  X.isoToSerial = isoToSerial; X.serialToIso = serialToIso;

  /* sheets: [{name, rows:[[v...]], widths:[..], head:true}]
     значение: строка | число | {d:'YYYY-MM-DD'} (дата) | {b:'текст'} (жирный) | null */
  X.write = async function (sheets) {
    const z = new JSZip();
    z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '</Types>');
    z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    z.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      sheets.map((s, i) => `<sheet name="${esc(s.name.slice(0, 31).replace(/[\\\/\?\*\[\]:]/g, ' '))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets>' +
      sheets.map((s, i) => s.head && s.rows.length > 1 ? `` : '').join('') + '</workbook>');
    z.file('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
      `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
    // стили: 0 обычный, 1 заголовок, 2 дата, 3 жирный, 4 дата-красная
    z.file('xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="dd\\.mm\\.yyyy"/></numFmts>' +
      '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F4E79"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD0D7DE"/></left><right style="thin"><color rgb="FFD0D7DE"/></right><top style="thin"><color rgb="FFD0D7DE"/></top><bottom style="thin"><color rgb="FFD0D7DE"/></bottom><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>' +
      '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment horizontal="center" vertical="top"/></xf>' +
      '<xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf>' +
      '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
    sheets.forEach((s, i) => {
      const rows = s.rows, ncol = Math.max(1, ...rows.map(r => r.length));
      let x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';
      x += `<dimension ref="A1:${colName(ncol - 1)}${Math.max(1, rows.length)}"/>`;
      x += s.head ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' : '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
      x += '<sheetFormatPr defaultRowHeight="15"/>';
      if (s.widths) x += '<cols>' + s.widths.map((w, j) => `<col min="${j + 1}" max="${j + 1}" width="${w}" customWidth="1"/>`).join('') + '</cols>';
      x += '<sheetData>';
      rows.forEach((r, ri) => {
        x += `<row r="${ri + 1}"${s.head && ri === 0 ? ' ht="30" customHeight="1"' : ''}>`;
        r.forEach((v, ci) => {
          const ref = colName(ci) + (ri + 1);
          const hs = s.head && ri === 0;
          if (v == null || v === '') { x += `<c r="${ref}" s="${hs ? 1 : 0}"/>`; return; }
          if (typeof v === 'object' && v.d) { x += `<c r="${ref}" s="2"><v>${isoToSerial(v.d)}</v></c>`; return; }
          if (typeof v === 'object' && 'b' in v) { x += `<c r="${ref}" s="3" t="inlineStr"><is><t xml:space="preserve">${esc(v.b)}</t></is></c>`; return; }
          if (typeof v === 'number' && isFinite(v)) { x += `<c r="${ref}" s="${hs ? 1 : 0}"><v>${v}</v></c>`; return; }
          x += `<c r="${ref}" s="${hs ? 1 : 0}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
        });
        x += '</row>';
      });
      x += '</sheetData>';
      if (s.head && rows.length > 1) x += `<autoFilter ref="A1:${colName(ncol - 1)}${rows.length}"/>`;
      x += '<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>';
      x += '<pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>';
      x += '</worksheet>';
      z.file(`xl/worksheets/sheet${i + 1}.xml`, x);
    });
    return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', compression: 'DEFLATE' });
  };

  /* Чтение: возвращает [{name, rows:[[...]]}]. Даты -> {d:'YYYY-MM-DD'} */
  X.read = async function (buf) {
    const z = await JSZip.loadAsync(buf);
    const P = new DOMParser();
    const xml = async p => { const f = z.file(p); return f ? P.parseFromString(await f.async('string'), 'application/xml') : null; };
    const byTag = (d, t) => Array.from(d.getElementsByTagNameNS('*', t));
    const txt = el => byTag(el, 't').map(t => t.textContent).join('');
    const wb = await xml('xl/workbook.xml');
    if (!wb) throw new Error('Это не файл Excel');
    const rels = await xml('xl/_rels/workbook.xml.rels');
    const relMap = {};
    if (rels) byTag(rels, 'Relationship').forEach(r => relMap[r.getAttribute('Id')] = r.getAttribute('Target'));
    const ss = await xml('xl/sharedStrings.xml');
    const strings = ss ? byTag(ss, 'si').map(txt) : [];
    const st = await xml('xl/styles.xml');
    const dateStyles = new Set();
    if (st) {
      const custom = {};
      byTag(st, 'numFmt').forEach(n => custom[n.getAttribute('numFmtId')] = n.getAttribute('formatCode') || '');
      const cx = byTag(st, 'cellXfs')[0];
      if (cx) Array.from(cx.children).forEach((xf, i) => {
        const id = +xf.getAttribute('numFmtId');
        const code = (custom[id] || '').replace(/"[^"]*"|\[[^\]]*\]/g, '').toLowerCase();
        if ((id >= 14 && id <= 22) || (id >= 45 && id <= 47) || (code && /[dy]/.test(code) && !/^[#0.,%]+$/.test(code))) dateStyles.add(i);
      });
    }
    const out = [];
    for (const s of byTag(wb, 'sheet')) {
      const rid = s.getAttribute('r:id') || s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
      let target = relMap[rid] || '';
      target = target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '');
      const sh = await xml(target);
      if (!sh) continue;
      const rows = [];
      byTag(sh, 'row').forEach(r => {
        const ri = (+r.getAttribute('r') || rows.length + 1) - 1;
        const row = rows[ri] = rows[ri] || [];
        Array.from(r.children).filter(c => c.localName === 'c').forEach((c, k) => {
          const ref = c.getAttribute('r');
          const ci = ref ? colNum(ref.replace(/\d+/g, '')) : k;
          const t = c.getAttribute('t'), s2 = +c.getAttribute('s');
          const vEl = byTag(c, 'v')[0];
          let v = null;
          if (t === 's') v = strings[+(vEl && vEl.textContent)] ?? '';
          else if (t === 'inlineStr') v = txt(c);
          else if (t === 'str' || t === 'e') v = vEl ? vEl.textContent : '';
          else if (t === 'b') v = vEl ? vEl.textContent === '1' : '';
          else if (vEl) { const n = parseFloat(vEl.textContent); v = isNaN(n) ? vEl.textContent : (dateStyles.has(s2) && n > 1 && n < 100000 ? { d: serialToIso(n) } : n); }
          row[ci] = v;
        });
      });
      for (let i = 0; i < rows.length; i++) rows[i] = rows[i] || [];
      out.push({ name: s.getAttribute('name'), rows, hidden: /hidden/i.test(s.getAttribute('state') || '') });
    }
    return out;
  };

  X.readCsv = function (text) {
    text = text.replace(/^﻿/, '');
    const first = text.split(/\r?\n/)[0] || '';
    const sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : (first.includes('\t') ? '\t' : ',');
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === sep || (sep === ';' && ch === '\t')) { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += ch;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return [{ name: 'CSV', rows }];
  };
  window.XL = X;
})();
