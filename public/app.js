'use strict';

const state = {
  drives: [],
  drive: null,
  path: null,
  rows: [],
  opps: [],
  tab: 'browse',
  filter: 'all',
  q: '',
  q2: '',
  sel: new Set(),
  bytes: new Map(),
  scanning: false,
  timer: null,
};

const VERDICT = {
  ok:      { label: 'Gerekli',     icon: '✓' },
  move:    { label: 'Taşınabilir', icon: '↗' },
  warn:    { label: 'Kısmen',      icon: '!' },
  bad:     { label: 'Gereksiz',    icon: '✕' },
  unknown: { label: 'Bilinmiyor',  icon: '?' },
};

const $ = (id) => document.getElementById(id);

/* ---------------- yardımcılar ---------------- */
function fmt(n) {
  if (!n) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  const v = n >= 100 || i === 0 ? Math.round(n) : n.toFixed(1);
  return String(v).replace('.', ',') + ' ' + u[i];
}
function fmtNum(n) {
  return new Intl.NumberFormat('tr-TR').format(n || 0);
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function lowerTr(s) {
  return s.toLocaleLowerCase('tr-TR');
}
async function api(url, opts) {
  const r = await fetch(url, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
  return j;
}
function toast(msg, kind) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast' + (kind ? ' ' + kind : '');
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.hidden = true), kind === 'err' ? 7000 : 4200);
}

/* ---------------- sürücüler ---------------- */
async function loadDrives() {
  const { drives } = await api('/api/drives');
  state.drives = drives;
  state.drive = drives[0] || 'C:';
  renderDrives();
}
function renderDrives() {
  $('drives').innerHTML = state.drives
    .map((d) => `<button class="drive${d === state.drive ? ' active' : ''}" data-drive="${esc(d)}">${esc(d)}</button>`)
    .join('');
}

/* ---------------- tarama ---------------- */
async function startScan() {
  if (state.scanning) return;
  state.scanning = true;
  state.sel.clear();
  state.rows = [];
  state.opps = [];
  state.bytes.clear();
  renderRows();
  renderOpps();
  updateSel();
  $('stats').hidden = true;
  $('progress').hidden = false;
  $('pFill').style.width = '2%';
  $('pPhase').textContent = 'Dizinler taranıyor…';
  $('pStats').textContent = '0 dizin';
  $('scanBtn').disabled = true;

  try {
    await api('/api/scan?drive=' + encodeURIComponent(state.drive.replace(':', '')));
    poll();
  } catch (e) {
    state.scanning = false;
    $('scanBtn').disabled = false;
    $('progress').hidden = true;
    toast(e.message, 'err');
  }
}

function poll() {
  clearInterval(state.timer);
  state.timer = setInterval(async () => {
    let s;
    try { s = await api('/api/status'); }
    catch { return; }

    if (s.state === 'scanning') {
      const pct = s.phase === 'Boyutlar hesaplanıyor' && s.total
        ? 35 + Math.round((s.sized / s.total) * 63)
        : Math.min(34, Math.round((s.dirs / 90000) * 34));
      $('pFill').style.width = Math.max(3, pct) + '%';
      $('pPhase').textContent = s.phase === 'Boyutlar hesaplanıyor'
        ? 'Boyutlar hesaplanıyor…'
        : 'Dizinler taranıyor…';
      $('pStats').textContent = s.phase === 'Boyutlar hesaplanıyor'
        ? fmtNum(s.sized) + ' / ' + fmtNum(s.total) + ' dizin'
        : fmtNum(s.dirs) + ' dizin · ' + (s.elapsed / 1000).toFixed(0) + ' sn';
      return;
    }

    clearInterval(state.timer);
    state.scanning = false;
    $('scanBtn').disabled = false;

    if (s.state === 'error') {
      $('progress').hidden = true;
      toast('Tarama hatası: ' + (s.error || 'bilinmiyor'), 'err');
      return;
    }

    $('pFill').style.width = '100%';
    $('pPhase').textContent = 'Tamamlandı';
    $('pStats').textContent = fmt(s.totalBytes) + ' · ' + fmtNum(s.totalFiles) + ' dosya · ' +
      (s.elapsed / 1000).toFixed(1) + ' sn' + (s.skipped ? ' · ' + fmtNum(s.skipped) + ' bağlantı atlandı' : '');
    setTimeout(() => { $('progress').hidden = true; }, 1400);

    await goTo(s.root);
    await loadOpps();
  }, 420);
}

/* ---------------- gezinme ---------------- */
async function goTo(p) {
  try {
    const r = await api('/api/tree?path=' + encodeURIComponent(p));
    state.path = r.path;
    state.rows = r.rows;
    for (const row of r.rows) state.bytes.set(row.path, row.bytes);
    renderCrumbs();
    renderRows();
    renderStats();
    $('stats').hidden = false;
    $('browseEmpty').hidden = r.rows.length > 0;
  } catch (e) {
    toast('Klasör okunamadı: ' + e.message, 'err');
  }
}

function crumbs() {
  const parts = state.path.replace(/\\+$/, '').split('\\');
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const target = i === 0 ? parts[0] + '\\' : parts.slice(0, i + 1).join('\\');
    const last = i === parts.length - 1;
    out.push(`<button class="crumb${last ? ' last' : ''}" data-go="${esc(target)}">${esc(parts[i])}</button>`);
    if (!last) out.push('<span class="crumb-sep">›</span>');
  }
  return out.join('');
}
function renderCrumbs() {
  $('crumbs').innerHTML = crumbs();
}

/* ---------------- satırlar ---------------- */
function filteredRows() {
  const q = lowerTr(state.q.trim());
  return state.rows.filter((r) => {
    if (state.filter !== 'all' && r.verdict !== state.filter) return false;
    if (q && !lowerTr(r.name).includes(q)) return false;
    return true;
  });
}

function sizeCell(row, max) {
  if (row.denied || row.link) {
    return `<div class="sizecell"><span class="sizeval muted" title="${row.denied ? 'Kilitli dosya: boyut okunamadı (yönetici izni gerekir)' : 'Bağlantı: taranmadı (çift sayımı önlemek için)'}">—</span></div>`;
  }
  const pct = max > 0 ? Math.max(1.5, (row.bytes / max) * 100) : 0;
  return `<div class="sizecell">
    <div class="sizebar ${row.verdict}"><i style="width:${pct.toFixed(1)}%"></i></div>
    <span class="sizeval">${fmt(row.bytes)}</span>
  </div>`;
}

function renderRows() {
  const rows = filteredRows();
  const max = rows.reduce((m, r) => Math.max(m, r.bytes), 0);
  const tb = $('rows');

  if (!state.path) { tb.innerHTML = ''; $('browseEmpty').hidden = false; renderChips(); return; }

  tb.innerHTML = rows.map((r) => {
    const v = VERDICT[r.verdict] || VERDICT.unknown;
    const checked = state.sel.has(r.path) ? ' checked' : '';
    const selCls = state.sel.has(r.path) ? ' class="selected"' : '';
    const ico = r.dir ? '▸' : '·';
    const nameCls = r.dir ? 'dir' : (r.link ? 'link' : '');
    return `<tr data-path="${esc(r.path)}"${selCls}>
      <td class="c"><input type="checkbox" data-pick="${esc(r.path)}"${checked} aria-label="Seç: ${esc(r.name)}"></td>
      <td><div class="name ${nameCls}">
        <span class="ico">${ico}</span>
        <span class="txt${r.link ? ' link' : ''}" data-nav="${esc(r.path)}" ${r.link ? 'title="Bağlantı (atlandı)"' : ''}>${esc(r.name)}</span>
      </div></td>
      <td class="r">${sizeCell(r, max)}</td>
      <td class="r files">${r.files ? fmtNum(r.files) : ''}</td>
      <td><span class="badge ${r.verdict}">${v.icon} ${v.label}</span></td>
      <td><div class="why" title="${esc(r.why)}">${esc(r.why)}</div></td>
    </tr>`;
  }).join('');

  $('browseEmpty').hidden = rows.length > 0;
  renderChips();
  syncSelAll();
}

function renderOpps() {
  const q = lowerTr(state.q2.trim());
  const rows = state.opps.filter((r) => !q || lowerTr(r.path).includes(q));
  const max = rows.reduce((m, r) => Math.max(m, r.bytes), 0);
  $('oppCount').textContent = state.opps.length;

  $('oppRows').innerHTML = rows.map((r) => {
    const v = VERDICT[r.verdict] || VERDICT.unknown;
    const checked = state.sel.has(r.path) ? ' checked' : '';
    const selCls = state.sel.has(r.path) ? ' class="selected"' : '';
    return `<tr data-path="${esc(r.path)}"${selCls}>
      <td class="c"><input type="checkbox" data-pick="${esc(r.path)}"${checked} aria-label="Seç: ${esc(r.name)}"></td>
      <td><div class="path" title="${esc(r.path)}"><b>${esc(r.name)}</b> <span>${esc(r.path.slice(0, Math.max(0, r.path.length - r.name.length - 1)))}</span></div></td>
      <td class="r">${sizeCell(r, max)}</td>
      <td class="r files">${r.files ? fmtNum(r.files) : ''}</td>
      <td><span class="badge ${r.verdict}">${v.icon} ${v.label}</span></td>
      <td><div class="why" title="${esc(r.why)}">${esc(r.why)}</div></td>
    </tr>`;
  }).join('');

  $('oppEmpty').hidden = rows.length > 0;
  syncSelAll();
}

/* ---------------- istatistik & filtre ---------------- */
function renderStats() {
  const rows = state.rows;
  const bucket = (v) => rows.filter((r) => r.verdict === v);
  const sum = (a) => a.reduce((s, r) => s + r.bytes, 0);

  const total = sum(rows);
  $('sTotal').textContent = fmt(total);
  $('sTotalSub').textContent = rows.length + ' öğe';

  for (const [key, id] of [['bad', 'sBad'], ['warn', 'sWarn'], ['move', 'sMove'], ['ok', 'sOk']]) {
    const b = bucket(key);
    $(id).textContent = fmt(sum(b));
    $(id + 'Sub').textContent = b.length + ' öğe';
  }
}

function renderChips() {
  const counts = { all: state.rows.length, bad: 0, warn: 0, move: 0, ok: 0, unknown: 0 };
  for (const r of state.rows) counts[r.verdict] = (counts[r.verdict] || 0) + 1;
  const defs = [
    ['all', 'Tümü'], ['bad', 'Gereksiz'], ['warn', 'Kısmen'],
    ['move', 'Taşınabilir'], ['ok', 'Gerekli'], ['unknown', 'Bilinmiyor'],
  ];
  $('chips').innerHTML = defs.map(([k, label]) =>
    `<button class="chip ${k}${state.filter === k ? ' active' : ''}" data-filter="${k}">${label}<span class="n">${counts[k] || 0}</span></button>`
  ).join('');
}

/* ---------------- seçim ---------------- */
function visiblePaths() {
  if (state.tab === 'opps') {
    const q = lowerTr(state.q2.trim());
    return state.opps.filter((r) => !q || lowerTr(r.path).includes(q)).map((r) => r.path);
  }
  return filteredRows().map((r) => r.path);
}

function togglePick(p, on) {
  if (on) state.sel.add(p); else state.sel.delete(p);
  updateSel();
  const tb = state.tab === 'opps' ? $('oppRows') : $('rows');
  for (const tr of tb.querySelectorAll('tr')) {
    if (tr.dataset.path === p) tr.classList.toggle('selected', on);
  }
  syncSelAll();
}

function updateSel() {
  let total = 0;
  for (const p of state.sel) total += state.bytes.get(p) || 0;
  $('selCount').textContent = state.sel.size;
  $('selSize').textContent = fmt(total);
  $('cleanBtn').disabled = state.sel.size === 0;
}

function syncSelAll() {
  const box = state.tab === 'opps' ? $('selAll2') : $('selAll');
  const paths = visiblePaths();
  const n = paths.filter((p) => state.sel.has(p)).length;
  box.checked = n > 0 && n === paths.length;
  box.indeterminate = n > 0 && n < paths.length;
}

/* ---------------- temizlik ---------------- */
function openConfirm() {
  const paths = [...state.sel];
  if (!paths.length) return;
  const mode = $('mode').value;
  let total = 0;
  for (const p of paths) total += state.bytes.get(p) || 0;

  $('mTitle').textContent = mode === 'delete' ? 'Kalıcı silme onayı' : 'Geri dönüşüm kutusuna taşı';
  $('mBody').innerHTML =
    `<b>${paths.length}</b> öğe · <b>${fmt(total)}</b><br>` +
    (mode === 'delete'
      ? 'Bu öğeler <b>kalıcı olarak</b> silinecek, geri alınamaz.'
      : 'Öğeler Geri Dönüşüm Kutusuna taşınacak; yer açmak için kutuyu da boşaltmanız gerekir.') +
    `<div class="list">${paths.slice(0, 25).map((p) => `<div title="${esc(p)}">${esc(p)}</div>`).join('')}` +
    (paths.length > 25 ? `<div>… ve ${paths.length - 25} öğe daha</div>` : '') + '</div>';

  $('modal').hidden = false;
}

async function doClean() {
  $('modal').hidden = true;
  const paths = [...state.sel];
  const mode = $('mode').value;
  $('cleanBtn').disabled = true;
  try {
    const r = await api('/api/clean', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths, mode }),
    });
    if (r.failed && r.failed.length) {
      toast(`${r.ok} öğe temizlendi, ${r.failed.length} öğe başarısız: ${r.failed[0].error}`, 'err');
    } else {
      const extra = mode === 'recycle' ? ' — yer açmak için Geri Dönüşüm Kutusunu boşaltın.' : '';
      toast(`${r.ok} öğe temizlendi · ${fmt(r.freed)}${extra}`, 'ok');
    }
    state.sel.clear();
    if (state.path) await goTo(state.path);
    await loadOpps();
    updateSel();
  } catch (e) {
    toast('Temizlik hatası: ' + e.message, 'err');
    updateSel();
  }
}

async function loadOpps() {
  try {
    const r = await api('/api/opportunities');
    state.opps = r.rows;
    for (const row of r.rows) state.bytes.set(row.path, row.bytes);
    renderOpps();
  } catch (e) {
    toast('Fırsatlar yüklenemedi: ' + e.message, 'err');
  }
}

/* ---------------- olaylar ---------------- */
document.addEventListener('click', async (e) => {
  const t = e.target;

  const drive = t.closest('[data-drive]');
  if (drive) {
    state.drive = drive.dataset.drive;
    renderDrives();
    return;
  }

  const go = t.closest('[data-go]');
  if (go) { await goTo(go.dataset.go); return; }

  const nav = t.closest('[data-nav]');
  if (nav) {
    const row = nav.closest('tr');
    if (row && row.querySelector('.name.dir')) { await goTo(nav.dataset.nav); return; }
    if (row) { togglePick(row.dataset.path, !state.sel.has(row.dataset.path)); return; }  // dosya adı: seç
    return;
  }

  const pick = t.closest('[data-pick]');
  if (pick) { togglePick(pick.dataset.pick, pick.checked); return; }

  const chip = t.closest('[data-filter]');
  if (chip) { state.filter = chip.dataset.filter; renderRows(); return; }

  const tab = t.closest('[data-tab]');
  if (tab) {
    state.tab = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === tab));
    $('browsePanel').hidden = state.tab !== 'browse';
    $('oppsPanel').hidden = state.tab !== 'opps';
    syncSelAll();
    return;
  }

  const tr = t.closest('#rows tr, #oppRows tr');
  if (tr && !t.closest('input')) { togglePick(tr.dataset.path, !state.sel.has(tr.dataset.path)); }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.id === 'selAll' || t.id === 'selAll2') {
    const on = t.checked;
    for (const p of visiblePaths()) { if (on) state.sel.add(p); else state.sel.delete(p); }
    updateSel();
    renderRows(); renderOpps();
  }
});

document.addEventListener('dblclick', async (e) => {
  const tr = e.target.closest('#rows tr');
  if (!tr) return;
  const row = state.rows.find((r) => r.path === tr.dataset.path);
  if (row && row.dir) await goTo(row.path);
});

$('scanBtn').onclick = startScan;
$('cleanBtn').onclick = openConfirm;
$('mCancel').onclick = () => ($('modal').hidden = true);
$('mOk').onclick = doClean;
$('search').oninput = (e) => { state.q = e.target.value; renderRows(); };
$('search2').oninput = (e) => { state.q2 = e.target.value; renderOpps(); };
$('closeBtn').onclick = async () => {
  try { await api('/api/shutdown', { method: 'POST' }); } catch { /* yok */ }
  window.close();
  document.body.innerHTML = '<div style="display:grid;place-items:center;height:100vh;color:#8fa1b6;font:14px system-ui">Kapatıldı.</div>';
};

/* ---------------- başlat ---------------- */
(async () => {
  try { await loadDrives(); }
  catch (e) { toast('Sunucuya bağlanılamadı: ' + e.message, 'err'); return; }

  // Sayfa yenilendiyse sunucunun mevcut durumuna dön (tarama sürüyorsa ilerlemeyi devral).
  try {
    const s = await api('/api/status');
    if (s.state === 'scanning') {
      state.scanning = true;
      state.drive = s.root.slice(0, 2);
      renderDrives();
      $('scanBtn').disabled = true;
      $('progress').hidden = false;
      $('pPhase').textContent = s.phase === 'Boyutlar hesaplanıyor' ? 'Boyutlar hesaplanıyor…' : 'Dizinler taranıyor…';
      poll();
    } else if (s.state === 'done' && s.root) {
      state.drive = s.root.slice(0, 2);
      renderDrives();
      $('pFill').style.width = '100%';
      $('pPhase').textContent = 'Tamamlandı';
      $('pStats').textContent = fmt(s.totalBytes) + ' · ' + fmtNum(s.totalFiles) + ' dosya · ' + (s.elapsed / 1000).toFixed(1) + ' sn';
      $('progress').hidden = false;
      setTimeout(() => { $('progress').hidden = true; }, 1600);
      await goTo(s.root);
      await loadOpps();
    }
  } catch { /* eski sunucu sürümü */ }

  renderChips();
  updateSel();
})();
