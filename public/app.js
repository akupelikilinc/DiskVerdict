'use strict';

/* ---------------- dil / i18n ---------------- */
const I18N = {
  tr: {
    sub: 'Diski ne dolduruyor? Tara, gör, güvenle temizle.',
    scan: 'Taramayı Başlat', close: 'Kapat', closeTip: 'Uygulamayı kapat',
    kScanned: 'Taranan', kBad: 'Gereksiz', kWarn: 'Kısmen', kMove: 'Taşınabilir', kOk: 'Gerekli',
    items: '{0} öğe',
    tabBrowse: 'Gezgin', tabOpps: 'Temizlik Fırsatları',
    searchBrowse: 'Bu görünümde ara…', oppsNote: 'Tüm sürücüde 50 MB üzeri, temizlenebilir / koşullu öğeler',
    searchOpps: 'Fırsatlarda ara…',
    thName: 'Ad', thSize: 'Boyut', thFiles: 'Dosya', thVerdict: 'Karar', thWhy: 'Açıklama', thPath: 'Yol',
    selAll: 'Görünen tümünü seç',
    emptyBrowse: 'Taramayı başlatın ya da başka bir klasöre gidin.',
    emptyOpps: 'Henüz fırsat yok — önce tarama yapın.',
    selUnit: 'öğe', selPicked: 'seçili',
    modeRecycle: 'Geri Dönüşüm Kutusuna Taşı (güvenli)', modeDelete: 'Kalıcı Sil',
    modeAria: 'Temizleme yöntemi', clean: 'Temizle',
    mTitle: 'Emin misiniz?', mCancel: 'Vazgeç', mOk: 'Onayla',
    walk: 'Dizinler taranıyor…', sizing: 'Boyutlar hesaplanıyor…', done: 'Tamamlandı',
    dirs: '{0} dizin', dirsOf: '{0} / {1} dizin', secs: '{0} sn',
    scanSummary: '{0} · {1} dosya · {2} sn', linksSkipped: ' · {0} bağlantı atlandı',
    'v.ok': 'Gerekli', 'v.move': 'Taşınabilir', 'v.warn': 'Kısmen', 'v.bad': 'Gereksiz', 'v.unknown': 'Bilinmiyor',
    all: 'Tümü',
    select: 'Seç: {0}',
    denied: 'Kilitli dosya: boyut okunamadı (yönetici izni gerekir)',
    linkWhy: 'Bağlantı: taranmadı (çift sayımı önlemek için)',
    linkTitle: 'Bağlantı (atlandı)',
    confirmRecycle: 'Geri dönüşüm kutusuna taşı', confirmDelete: 'Kalıcı silme onayı',
    confirmBody: '{0} öğe · {1}',
    warnDelete: 'Bu öğeler <b>kalıcı olarak</b> silinecek, geri alınamaz.',
    warnRecycle: 'Öğeler Geri Dönüşüm Kutusuna taşınacak; yer açmak için kutuyu da boşaltmanız gerekir.',
    andMore: '… ve {0} öğe daha',
    toastScanErr: 'Tarama hatası: {0}', toastRead: 'Klasör okunamadı: {0}',
    toastCleanErr: 'Temizlik hatası: {0}', toastOpps: 'Fırsatlar yüklenemedi: {0}',
    toastOffline: 'Sunucuya bağlanılamadı: {0}',
    cleaned: '{0} öğe temizlendi · {1}',
    cleanedRecycle: ' — yer açmak için Geri Dönüşüm Kutusunu boşaltın.',
    cleanedPartial: '{0} öğe temizlendi, {1} öğe başarısız: {2}',
    closed: 'Kapatıldı.', unknown: 'bilinmiyor',
  },
  en: {
    sub: "What's filling your disk? Scan, see, clean with confidence.",
    scan: 'Start scan', close: 'Close', closeTip: 'Quit the app',
    kScanned: 'Scanned', kBad: 'Junk', kWarn: 'Partial', kMove: 'Relocatable', kOk: 'Needed',
    items: '{0} items',
    tabBrowse: 'Explorer', tabOpps: 'Cleanup opportunities',
    searchBrowse: 'Search this view…', oppsNote: 'Whole drive — items over 50 MB marked junk or partial',
    searchOpps: 'Search opportunities…',
    thName: 'Name', thSize: 'Size', thFiles: 'Files', thVerdict: 'Verdict', thWhy: 'Reason', thPath: 'Path',
    selAll: 'Select all visible',
    emptyBrowse: 'Start a scan or open another folder.',
    emptyOpps: 'No opportunities yet — run a scan first.',
    selUnit: 'items', selPicked: 'selected',
    modeRecycle: 'Move to Recycle Bin (safe)', modeDelete: 'Delete permanently',
    modeAria: 'Cleaning method', clean: 'Clean',
    mTitle: 'Are you sure?', mCancel: 'Cancel', mOk: 'Confirm',
    walk: 'Walking directories…', sizing: 'Sizing folders…', done: 'Done',
    dirs: '{0} folders', dirsOf: '{0} / {1} folders', secs: '{0}s',
    scanSummary: '{0} · {1} files · {2}s', linksSkipped: ' · {0} links skipped',
    'v.ok': 'Needed', 'v.move': 'Relocatable', 'v.warn': 'Partial', 'v.bad': 'Junk', 'v.unknown': 'Unknown',
    all: 'All',
    select: 'Select: {0}',
    denied: 'Locked file: size unavailable (needs admin rights)',
    linkWhy: 'Link: not scanned (avoids double counting)',
    linkTitle: 'Link (skipped)',
    confirmRecycle: 'Move to Recycle Bin', confirmDelete: 'Confirm permanent delete',
    confirmBody: '{0} items · {1}',
    warnDelete: 'These items will be <b>permanently</b> deleted. This cannot be undone.',
    warnRecycle: 'Items go to the Recycle Bin; empty it afterwards to actually free the space.',
    andMore: '… and {0} more',
    toastScanErr: 'Scan error: {0}', toastRead: 'Cannot read folder: {0}',
    toastCleanErr: 'Cleanup error: {0}', toastOpps: 'Could not load opportunities: {0}',
    toastOffline: 'Cannot reach the server: {0}',
    cleaned: '{0} items cleaned · {1}',
    cleanedRecycle: ' — empty the Recycle Bin to free the space.',
    cleanedPartial: '{0} cleaned, {1} failed: {2}',
    closed: 'Closed.', unknown: 'unknown',
  },
};

let lang = localStorage.getItem('dv.lang') || (String(navigator.language).toLowerCase().startsWith('tr') ? 'tr' : 'en');

function t(key, ...args) {
  const s = (I18N[lang] && I18N[lang][key]) || I18N.tr[key] || key;
  return s.replace(/\{(\d+)\}/g, (m, i) => (args[i] == null ? m : args[i]));
}
const LOC = () => (lang === 'tr' ? 'tr-TR' : 'en-US');

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

const VERDICT = { ok: '✓', move: '↗', warn: '!', bad: '✕', unknown: '?' };
const vkey = (v) => (VERDICT[v] ? v : 'unknown');

const $ = (id) => document.getElementById(id);

/* ---------------- yardımcılar ---------------- */
function fmt(n) {
  if (!n) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  const v = n >= 100 || i === 0 ? Math.round(n) : n;
  return new Intl.NumberFormat(LOC(), { maximumFractionDigits: 1 }).format(v) + ' ' + u[i];
}
function fmtNum(n) {
  return new Intl.NumberFormat(LOC()).format(n || 0);
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function lowerTr(s) {
  return s.toLocaleLowerCase(LOC());
}
async function api(url, opts) {
  const r = await fetch(url, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
  return j;
}
function toast(msg, kind) {
  const el = $('toast');
  el.textContent = msg;
  el.className = 'toast' + (kind ? ' ' + kind : '');
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.hidden = true), kind === 'err' ? 7000 : 4200);
}

/* ---------------- dil değiştirme ---------------- */
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-label]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nLabel)); });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
  $('pStats').textContent = t('dirs', 0);
  renderRows();
  renderOpps();
  renderStats();
  renderChips();
  updateSel();
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
  $('pPhase').textContent = t('walk');
  $('pStats').textContent = t('dirs', 0);
  $('scanBtn').disabled = true;

  try {
    await api('/api/scan?drive=' + encodeURIComponent(state.drive.replace(':', '')) + '&lang=' + lang);
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
      const pct = s.phase === 'size' && s.total
        ? 35 + Math.round((s.sized / s.total) * 63)
        : Math.min(34, Math.round((s.dirs / 90000) * 34));
      $('pFill').style.width = Math.max(3, pct) + '%';
      $('pPhase').textContent = s.phase === 'size' ? t('sizing') : t('walk');
      $('pStats').textContent = s.phase === 'size'
        ? t('dirsOf', fmtNum(s.sized), fmtNum(s.total))
        : t('dirs', fmtNum(s.dirs)) + ' · ' + t('secs', (s.elapsed / 1000).toFixed(0));
      return;
    }

    clearInterval(state.timer);
    state.scanning = false;
    $('scanBtn').disabled = false;

    if (s.state === 'error') {
      $('progress').hidden = true;
      toast(t('toastScanErr', s.error || t('unknown')), 'err');
      return;
    }

    $('pFill').style.width = '100%';
    $('pPhase').textContent = t('done');
    $('pStats').textContent = t('scanSummary', fmt(s.totalBytes), fmtNum(s.totalFiles), (s.elapsed / 1000).toFixed(1)) +
      (s.skipped ? t('linksSkipped', fmtNum(s.skipped)) : '');
    setTimeout(() => { $('progress').hidden = true; }, 1400);

    await goTo(s.root);
    await loadOpps();
  }, 420);
}

/* ---------------- gezinme ---------------- */
async function goTo(p) {
  try {
    const r = await api('/api/tree?path=' + encodeURIComponent(p) + '&lang=' + lang);
    state.path = r.path;
    state.rows = r.rows;
    for (const row of r.rows) state.bytes.set(row.path, row.bytes);
    renderCrumbs();
    renderRows();
    renderStats();
    $('stats').hidden = false;
    $('browseEmpty').hidden = r.rows.length > 0;
  } catch (e) {
    toast(t('toastRead', e.message), 'err');
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
    return `<div class="sizecell"><span class="sizeval muted" title="${esc(row.denied ? t('denied') : t('linkWhy'))}">—</span></div>`;
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
    const v = vkey(r.verdict);
    const checked = state.sel.has(r.path) ? ' checked' : '';
    const selCls = state.sel.has(r.path) ? ' class="selected"' : '';
    const ico = r.dir ? '▸' : '·';
    const nameCls = r.dir ? 'dir' : (r.link ? 'link' : '');
    return `<tr data-path="${esc(r.path)}"${selCls}>
      <td class="c"><input type="checkbox" data-pick="${esc(r.path)}"${checked} aria-label="${esc(t('select', r.name))}"></td>
      <td><div class="name ${nameCls}">
        <span class="ico">${ico}</span>
        <span class="txt${r.link ? ' link' : ''}" data-nav="${esc(r.path)}" ${r.link ? `title="${esc(t('linkTitle'))}"` : ''}>${esc(r.name)}</span>
      </div></td>
      <td class="r">${sizeCell(r, max)}</td>
      <td class="r files">${r.files ? fmtNum(r.files) : ''}</td>
      <td><span class="badge ${r.verdict}">${VERDICT[v]} ${t('v.' + v)}</span></td>
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
    const v = vkey(r.verdict);
    const checked = state.sel.has(r.path) ? ' checked' : '';
    const selCls = state.sel.has(r.path) ? ' class="selected"' : '';
    return `<tr data-path="${esc(r.path)}"${selCls}>
      <td class="c"><input type="checkbox" data-pick="${esc(r.path)}"${checked} aria-label="${esc(t('select', r.name))}"></td>
      <td><div class="path" title="${esc(r.path)}"><b>${esc(r.name)}</b> <span>${esc(r.path.slice(0, Math.max(0, r.path.length - r.name.length - 1)))}</span></div></td>
      <td class="r">${sizeCell(r, max)}</td>
      <td class="r files">${r.files ? fmtNum(r.files) : ''}</td>
      <td><span class="badge ${r.verdict}">${VERDICT[v]} ${t('v.' + v)}</span></td>
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
  $('sTotalSub').textContent = t('items', fmtNum(rows.length));

  for (const [key, id] of [['bad', 'sBad'], ['warn', 'sWarn'], ['move', 'sMove'], ['ok', 'sOk']]) {
    const b = bucket(key);
    $(id).textContent = fmt(sum(b));
    $(id + 'Sub').textContent = t('items', fmtNum(b.length));
  }
}

function renderChips() {
  const counts = { all: state.rows.length, bad: 0, warn: 0, move: 0, ok: 0, unknown: 0 };
  for (const r of state.rows) counts[r.verdict] = (counts[r.verdict] || 0) + 1;
  const defs = [
    ['all', t('all')], ['bad', t('v.bad')], ['warn', t('v.warn')],
    ['move', t('v.move')], ['ok', t('v.ok')], ['unknown', t('v.unknown')],
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

  $('mTitle').textContent = mode === 'delete' ? t('confirmDelete') : t('confirmRecycle');
  $('mBody').innerHTML =
    t('confirmBody', '<b>' + paths.length + '</b>', '<b>' + fmt(total) + '</b>') + '<br>' +
    (mode === 'delete' ? t('warnDelete') : t('warnRecycle')) +
    `<div class="list">${paths.slice(0, 25).map((p) => `<div title="${esc(p)}">${esc(p)}</div>`).join('')}` +
    (paths.length > 25 ? `<div>${esc(t('andMore', paths.length - 25))}</div>` : '') + '</div>';

  $('modal').hidden = false;
}

async function doClean() {
  $('modal').hidden = true;
  const paths = [...state.sel];
  const mode = $('mode').value;
  $('cleanBtn').disabled = true;
  try {
    const r = await api('/api/clean?lang=' + lang, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths, mode }),
    });
    if (r.failed && r.failed.length) {
      toast(t('cleanedPartial', r.ok, r.failed.length, r.failed[0].error), 'err');
    } else {
      const extra = mode === 'recycle' ? t('cleanedRecycle') : '';
      toast(t('cleaned', r.ok, fmt(r.freed)) + extra, 'ok');
    }
    state.sel.clear();
    if (state.path) await goTo(state.path);
    await loadOpps();
    updateSel();
  } catch (e) {
    toast(t('toastCleanErr', e.message), 'err');
    updateSel();
  }
}

async function loadOpps() {
  try {
    const r = await api('/api/opportunities?lang=' + lang);
    state.opps = r.rows;
    for (const row of r.rows) state.bytes.set(row.path, row.bytes);
    renderOpps();
  } catch (e) {
    toast(t('toastOpps', e.message), 'err');
  }
}

/* ---------------- olaylar ---------------- */
document.addEventListener('click', async (e) => {
  const el = e.target;

  const lb = el.closest('[data-lang]');
  if (lb && lb.dataset.lang !== lang) {
    lang = lb.dataset.lang;
    localStorage.setItem('dv.lang', lang);
    applyLang();
    if (state.path && !state.scanning) await goTo(state.path);
    if (state.opps.length && !state.scanning) await loadOpps();
    return;
  }

  const drive = el.closest('[data-drive]');
  if (drive) {
    state.drive = drive.dataset.drive;
    renderDrives();
    return;
  }

  const go = el.closest('[data-go]');
  if (go) { await goTo(go.dataset.go); return; }

  const nav = el.closest('[data-nav]');
  if (nav) {
    const row = nav.closest('tr');
    if (row && row.querySelector('.name.dir')) { await goTo(nav.dataset.nav); return; }
    if (row) { togglePick(row.dataset.path, !state.sel.has(row.dataset.path)); return; }
    return;
  }

  const pick = el.closest('[data-pick]');
  if (pick) { togglePick(pick.dataset.pick, pick.checked); return; }

  const chip = el.closest('[data-filter]');
  if (chip) { state.filter = chip.dataset.filter; renderRows(); return; }

  const tab = el.closest('[data-tab]');
  if (tab) {
    state.tab = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === tab));
    $('browsePanel').hidden = state.tab !== 'browse';
    $('oppsPanel').hidden = state.tab !== 'opps';
    syncSelAll();
    return;
  }

  const tr = el.closest('#rows tr, #oppRows tr');
  if (tr && !el.closest('input')) { togglePick(tr.dataset.path, !state.sel.has(tr.dataset.path)); }
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
  document.body.innerHTML = `<div style="display:grid;place-items:center;height:100vh;color:#8fa1b6;font:14px system-ui">${esc(t('closed'))}</div>`;
};

/* ---------------- başlat ---------------- */
(async () => {
  applyLang();
  try { await loadDrives(); }
  catch (e) { toast(t('toastOffline', e.message), 'err'); return; }

  // Sayfa yenilendiyse sunucunun mevcut durumuna dön (tarama sürüyorsa ilerlemeyi devral).
  try {
    const s = await api('/api/status');
    if (s.state === 'scanning') {
      state.scanning = true;
      state.drive = s.root.slice(0, 2);
      renderDrives();
      $('scanBtn').disabled = true;
      $('progress').hidden = false;
      $('pPhase').textContent = s.phase === 'size' ? t('sizing') : t('walk');
      poll();
    } else if (s.state === 'done' && s.root) {
      state.drive = s.root.slice(0, 2);
      renderDrives();
      $('pFill').style.width = '100%';
      $('pPhase').textContent = t('done');
      $('pStats').textContent = t('scanSummary', fmt(s.totalBytes), fmtNum(s.totalFiles), (s.elapsed / 1000).toFixed(1));
      $('progress').hidden = false;
      setTimeout(() => { $('progress').hidden = true; }, 1600);
      await goTo(s.root);
      await loadOpps();
    }
  } catch { /* eski sunucu sürümü */ }

  renderChips();
  updateSel();
})();
