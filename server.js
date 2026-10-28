'use strict';
/* DiskVerdict — sürücüyü tarar, klasörleri "gerekli / gereksiz" diye sınıflar, güvenle temizler.
   Bağımlılık yok: sadece Node.js stdlib + Windows shell32. */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { spawn, execSync } = require('child_process');

const PORT_START = 8777;
const MB = 1024 * 1024;

// Tek dosya (Node SEA) exe'de __dirname yoktur; dosyalar gömülü varlıklardan okunur.
const SEA = (() => { try { return require('node:sea'); } catch { return null; } })();
const IS_SEA = !!(SEA && SEA.isSea());
const BASE = IS_SEA ? path.dirname(process.execPath) : __dirname;
const DEV_FILES = {
  'index.html': 'public/index.html', 'style.css': 'public/style.css',
  'app.js': 'public/app.js', 'recycle.ps1': 'tools/recycle.ps1',
};
function asset(name) {
  return IS_SEA ? Buffer.from(SEA.getAsset(name)) : fs.readFileSync(path.join(BASE, DEV_FILES[name]));
}

/* ------------------------------------------------------------------ */
/* 1. SINIFLANDIRMA KURALLARI                                          */
/*    verdict: ok | move | warn | bad | unknown                        */
/* ------------------------------------------------------------------ */
// w = Türkçe açıklama, e = English explanation. Aynı kural iki dilde tek yerde durur.
const RULES = [
  /* --- net atık / önbellek --- */
  { m: /\\windows\\temp$/, v: 'bad', c: 'Sistem', w: 'Windows geçici dosyaları. Silinebilir, Windows yeniden oluşturur.', e: 'Windows temporary files. Safe to delete; Windows recreates them.' },
  { m: /\\appdata\\local\\temp$/, v: 'bad', c: 'Önbellek', w: 'Geçici dosyalar. Uygulamalar kapalıyken güvenle silinir.', e: 'Temporary files. Safe to delete while apps are closed.' },
  { m: /\\windows\\softwaredistribution\\download$/, v: 'bad', c: 'Sistem', w: 'Windows Update indirme önbelleği. Yeniden indirilir.', e: 'Windows Update download cache. Downloaded again when needed.' },
  { m: /\\npm-cache$|\\_cacache$/, v: 'bad', c: 'Önbellek', w: 'npm paket önbelleği. Gerekirse yeniden indirilir.', e: 'npm package cache. Downloaded again when needed.' },
  { m: /\\appdata\\local\\yarn$/, v: 'bad', c: 'Önbellek', w: 'Yarn önbelleği. Yeniden indirilir.', e: 'Yarn cache. Downloaded again when needed.' },
  { m: /\\appdata\\local\\uv$/, v: 'bad', c: 'Önbellek', w: 'uv (Python) önbelleği. Yeniden indirilir.', e: 'uv (Python) cache. Downloaded again when needed.' },
  { m: /\\pip\\cache$/, v: 'bad', c: 'Önbellek', w: 'pip önbelleği. Yeniden indirilir.', e: 'pip cache. Downloaded again when needed.' },
  { m: /openvino-model-cache$/, v: 'bad', c: 'Önbellek', w: 'Audacity AI (OpenVINO) model önbelleği. Yeniden oluşturulur.', e: 'Audacity AI (OpenVINO) model cache. Regenerated on demand.' },
  { m: /\\comfyui-cache$/, v: 'bad', c: 'Önbellek', w: 'ComfyUI geçici önbelleği. Yeniden oluşturulur.', e: 'ComfyUI temporary cache. Regenerated on demand.' },
  { m: /\\\$recycle\.bin$/, v: 'bad', c: 'Sistem', w: 'Geri dönüşüm kutusu. Boşaltılınca yer açılır.', e: 'Recycle Bin. Empty it to reclaim the space.' },
  { m: /\\crashdumps?$/, v: 'bad', c: 'Sistem', w: 'Çökme dökümleri. Hata ayıklamıyorsan gerekmez.', e: 'Crash dumps. Not needed unless you are debugging.' },
  { m: /^[a-z]:\\rtr[0-9a-f]+\.tmp$/, v: 'bad', c: 'Sistem', w: 'Kurulum artığı geçici dosya.', e: 'Leftover installer temporary file.' },
  // Kurulu uygulamaların kendi paketleri: silinirse uygulama/eklenti bozulur (genel kuraldan önce gelir)
  { m: /(\\program files|\\appdata\\local\\programs|\\extensions\\|\\.qwen|\\resources\\app|\\appdata\\roaming\\npm).*\\node_modules$/, v: 'warn', c: 'Program', w: 'Kurulu uygulama/eklenti paketleri. Silinirse o uygulama veya eklenti bozulur.', e: 'Bundled packages of an installed app or extension. Deleting them breaks it.' },
  { m: /\\node_modules$/, v: 'bad', c: 'Geliştirici', w: 'Bağımlılık klasörü. `npm install` ile yeniden kurulur.', e: 'Dependency folder. Reinstalled with `npm install`.' },
  // Derleme çıktısı yalnızca kullanıcı projelerinde "yeniden derlenebilir" sayılır, kurulu uygulamalarda değil
  { m: /^(?!.*(\\program files|\\appdata\\local\\programs|\\windows\\)).*\\(build|\.next|dist)$/, v: 'warn', c: 'Geliştirici', w: 'Derleme çıktısı. Yeniden derlenebilir (proje kaynağı değil).', e: 'Build output. Can be rebuilt (it is not the project source).' },

  /* --- koşullu / kısmen --- */
  { m: /^[a-z]:\\hiberfil\.sys$/, v: 'warn', c: 'Sistem', w: 'Hibernate / Fast Startup dosyası. Kullanmıyorsan `powercfg /h off` ile yer açılır.', e: 'Hibernate / Fast Startup file. Free it with `powercfg /h off` if you do not use it.' },
  { m: /\\programdata\\nvidia\\ngx$/, v: 'warn', c: 'Sürücü', w: 'DLSS/AI model deposu. Sürücü yönetir; elle silme önerilmez, NVIDIA App ile temizlenir.', e: 'DLSS/AI model store. Managed by the driver; do not delete by hand, clean it via NVIDIA App.' },
  { m: /\\programdata\\nvidia corporation$/, v: 'warn', c: 'Sürücü', w: 'Sürücü kurulum artıkları. Yeniden indirilebilir.', e: 'Driver installer leftovers. Can be downloaded again.' },
  { m: /\\pagefile\.sys$/, v: 'ok', c: 'Sistem', w: 'Sanal bellek dosyası. Silinmez; başka sürücüye taşınabilir.', e: 'Virtual memory file. Cannot be deleted; can be moved to another drive.' },
  { m: /\\.android\\avd$/, v: 'warn', c: 'Android', w: 'Emülatör disk imajları. Kullanılmayan AVD silinebilir, yeniden oluşturulur.', e: 'Emulator disk images. Unused AVDs can be deleted and recreated.' },
  { m: /\\google\\play games$/, v: 'warn', c: 'Oyun', w: 'Play Games PC sanal diski. Kullanmıyorsan tamamen atık olabilir (tek dosya onlarca GB).', e: 'Play Games PC virtual disk. If you do not use it, this can be tens of GB of pure waste.' },
  { m: /\\program files\\unity$|\\program files\\unity [0-9]/, v: 'warn', c: 'Program', w: 'Birden fazla Unity sürümü kurulu. Kullanmadığın sürümleri kaldır.', e: 'Multiple Unity versions installed. Uninstall the ones you do not use.' },
  { m: /\\local\\docker\\wsl$/, v: 'warn', c: 'Geliştirici', w: 'Docker sanal diski. `docker system prune -a` ile küçültülür.', e: 'Docker virtual disk. Shrink it with `docker system prune -a`.' },
  { m: /\\appdata\\local\\wsl$/, v: 'warn', c: 'Geliştirici', w: 'WSL dağıtım diski. Kullanılmayan dağıtım kaldırılabilir.', e: 'WSL distribution disk. Unused distributions can be removed.' },
  { m: /^[a-z]:\\wsl\$\\|\\\\wsl\$\\/, v: 'warn', c: 'Geliştirici', w: 'WSL dağıtım diski. Kullanılmayan dağıtım kaldırılabilir.', e: 'WSL distribution disk. Unused distributions can be removed.' },
  { m: /\\android\\sdk$/, v: 'warn', c: 'Android', w: 'Android SDK. Kullanılmayan API seviyeleri ve sistem imajları silinebilir.', e: 'Android SDK. Unused API levels and system images can be deleted.' },
  { m: /\\program files\\android$/, v: 'ok', c: 'Program', w: 'Android Studio / araçları.', e: 'Android Studio and its tooling.' },
  { m: /\\\.gradle$/, v: 'warn', c: 'Geliştirici', w: 'Gradle önbelleği. Silinirse ilk derleme yavaşlar, sonra yeniden oluşur.', e: 'Gradle cache. The first build gets slower, then it rebuilds itself.' },
  { m: /\\\.nuget$/, v: 'warn', c: 'Geliştirici', w: 'NuGet paket önbelleği. Yeniden indirilir.', e: 'NuGet package cache. Downloaded again when needed.' },
  { m: /\\appdata\\local\\(hermes|cursor|code|trae|antigravity)/, v: 'warn', c: 'Geliştirici', w: 'Editör/agent verisi ve önbelleği. Kullanmadığın aracı kaldır.', e: 'Editor/agent data and cache. Remove the tools you no longer use.' },
  { m: /\\xboxgames$/, v: 'warn', c: 'Oyun', w: 'Xbox oyun kurulumları. Oynamıyorsan kaldır.', e: 'Xbox game installs. Uninstall the ones you do not play.' },
  { m: /cinebench/, v: 'warn', c: 'Program', w: 'Tek seferlik benchmark. Ölçüm bittiyse gerekmez.', e: 'One-off benchmark. Not needed once you have your numbers.' },
  { m: /^[a-z]:\\msocache$/, v: 'warn', c: 'Sistem', w: 'Office kurulum önbelleği. Onarım için gerekebilir; yer sorunu yoksa bırak.', e: 'Office install cache. May be needed for repair; keep it if you have the space.' },
  { m: /\\system volume information$/, v: 'warn', c: 'Sistem', w: 'Geri yükleme noktaları / gölge kopyalar. Yönetici izni gerekir; Disk Temizleme ile yönetilir.', e: 'Restore points / shadow copies. Needs admin; manage them with Disk Cleanup.' },
  { m: /\\pixonic$/, v: 'warn', c: 'Oyun', w: 'Oyun verisi/önbelleği. Oyunu oynamıyorsan silinebilir.', e: 'Game data/cache. Safe to delete if you do not play it.' },

  /* --- taşınabilir veri --- */
  { m: /\\videos$/, v: 'move', c: 'Medya', w: 'Büyük medya dosyaları. Başka sürücüye (D:) taşınmalı.', e: 'Large media files. Move them to another drive.' },
  { m: /\\\.ollama\\models$/, v: 'move', c: 'AI/Model', w: 'LLM modelleri. OLLAMA_MODELS ortam değişkeniyle başka sürücüye taşınır.', e: 'LLM models. Move them with the OLLAMA_MODELS environment variable.' },
  { m: /comfyui-shared$|comfyui.*models$/, v: 'move', c: 'AI/Model', w: 'AI model dosyaları. Taşınabilir veya yeniden indirilebilir.', e: 'AI model files. Can be moved or downloaded again.' },
  { m: /\\\.lmstudio$/, v: 'move', c: 'AI/Model', w: 'LM Studio modelleri. Taşınabilir.', e: 'LM Studio models. Can be moved.' },
  { m: /\\steam\\steamapps$|\\steam\\common$/, v: 'move', c: 'Oyun', w: 'Oyun kurulumları. Steam Kütüphanesi başka sürücüye taşınabilir.', e: 'Game installs. The Steam library can be moved to another drive.' },
  { m: /\\downloads$/, v: 'move', c: 'Kullanıcı verisi', w: 'İndirilenler. Çoğu kurulum dosyası; büyükleri sil veya taşı.', e: 'Downloads. Mostly installers; delete or move the big ones.' },
  { m: /\\desktop$/, v: 'move', c: 'Kullanıcı verisi', w: 'Masaüstü. Büyük arşivleri başka sürücüye taşı.', e: 'Desktop. Move large archives to another drive.' },
  { m: /\\androidstudioprojects$/, v: 'move', c: 'Geliştirici', w: 'Projeler. Arşivleri başka sürücüye taşıyabilirsin.', e: 'Projects. Move the archives to another drive.' },

  /* --- gerekli --- */
  { m: /\\winsxs$/, v: 'ok', c: 'Sistem', w: 'Windows bileşen deposu. Hardlink nedeniyle görünen boyut gerçek maliyetten büyüktür; silinemez.', e: 'Windows component store. Hardlinks make the apparent size larger than the real cost; cannot be deleted.' },
  { m: /\\windows\\installer$/, v: 'ok', c: 'Sistem', w: 'MSI onarım/kaldırma önbelleği. Silinirse programlar kaldırılamaz.', e: 'MSI repair/uninstall cache. Deleting it makes programs impossible to remove.' },
  { m: /^[a-z]:\\swapfile\.sys$/, v: 'ok', c: 'Sistem', w: 'UWP uygulamaları için takas dosyası. Gerekli.', e: 'Swap file for UWP apps. Required.' },
  { m: /\\windows$/, v: 'ok', c: 'Sistem', w: 'İşletim sistemi.', e: 'The operating system.' },
  { m: /\\program files( \(x86\))?$/, v: 'ok', c: 'Program', w: 'Kurulu programlar. Karar için alt klasörlerine in.', e: 'Installed programs. Drill into the subfolders to decide.' },
  { m: /\\programdata$/, v: 'ok', c: 'Sistem', w: 'Programların ortak verisi.', e: 'Shared program data.' },
  { m: /^[a-z]:\\users$/, v: 'ok', c: 'Kullanıcı verisi', w: 'Kullanıcı profilleri.', e: 'User profiles.' },
  { m: /\\users\\[^\\]+$/, v: 'ok', c: 'Kullanıcı verisi', w: 'Kullanıcı profili.', e: 'User profile.' },
  { m: /\\\.git$/, v: 'ok', c: 'Geliştirici', w: 'Sürüm geçmişi. Silinirse proje geçmişi kaybolur.', e: 'Version history. Deleting it loses the project history.' },
  { m: /\\documents$/, v: 'ok', c: 'Kullanıcı verisi', w: 'Belgeler. Değerli veri.', e: 'Documents. Precious data.' },
];

function classify(p, isDir, lang) {
  const low = p.toLowerCase();
  for (let i = 0; i < RULES.length; i++) {
    if (RULES[i].m.test(low)) return { verdict: RULES[i].v, cat: RULES[i].c, why: lang === 'en' ? (RULES[i].e || RULES[i].w) : RULES[i].w };
  }
  return {
    verdict: 'unknown', cat: 'Diğer',
    why: lang === 'en'
      ? (isDir ? 'No rule matches — inspect and decide.' : 'Single file — inspect and decide.')
      : (isDir ? 'Kural tanımlı değil — inceleyip karar ver.' : 'Tek dosya — inceleyip karar ver.'),
  };
}

/* ------------------------------------------------------------------ */
/* 2. TARAMA                                                           */
/* ------------------------------------------------------------------ */
// Tarama event loop'u meşgul etmesin: her ~200 dizinde bir nefes ver,
// böylece /api/status ilerlemeyi canlı bildirebilir.
const pause = () => new Promise((r) => setImmediate(r));

// Tek geçiş: her dizin kendi dosya boyutunu toplar, post-order'da ebeveyne eklenir.
// path -> [bayt, dosya, ebeveynYolu]
async function aggregate(root, onTick) {
  const agg = new Map();
  const order = [];
  const stack = [root];
  let dirs = 0, skipped = 0, n = 0;

  agg.set(root, [0, 0, null]);

  while (stack.length) {
    const p = stack.pop();
    order.push(p);
    dirs++;
    const cur = agg.get(p);
    let ents;
    try { ents = fs.readdirSync(p, { withFileTypes: true }); }
    catch {
      if (onTick && (dirs & 255) === 0) onTick('walk', dirs, 0);
      if (++n % 200 === 0) await pause();
      continue;
    }
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.isSymbolicLink()) { skipped++; continue; }   // junction/symlink: döngü ve çift sayım koruması
      const full = path.join(p, e.name);
      if (e.isDirectory()) { agg.set(full, [0, 0, p]); stack.push(full); }
      else {
        try { cur[0] += fs.lstatSync(full).size; cur[1]++; } catch { /* erişilemedi */ }
      }
    }
    if (onTick && (dirs & 255) === 0) onTick('walk', dirs, 0);
    if (++n % 200 === 0) await pause();
  }

  const total = order.length;
  for (let i = total - 1; i >= 0; i--) {
    const v = agg.get(order[i]);
    if (v[2]) {
      const pv = agg.get(v[2]);
      if (pv) { pv[0] += v[0]; pv[1] += v[1]; }
    }
    if (onTick && (i & 2047) === 0) onTick('size', total - i, total);
    if (++n % 4000 === 0) await pause();
  }
  return { sub: agg, dirs, skipped };
}

let S = { state: 'idle' };

function scanDrive(letter, lang) {
  const root = letter.toUpperCase() + ':\\';
  if (!fs.existsSync(root)) { S = { state: 'error', error: L(lang, 'Sürücü bulunamadı: ', 'Drive not found: ') + root }; return; }

  const job = {
    state: 'scanning', root, sub: new Map(), dirs: 0, sized: 0, total: 0,
    totalBytes: 0, totalFiles: 0, skipped: 0,
    phase: 'walk', startedAt: Date.now(), elapsed: 0, error: null,
  };
  S = job;

  setImmediate(async () => {
    try {
      const r = await aggregate(root, (kind, a, b) => {
        if (kind === 'walk') job.dirs = a;
        else { job.sized = a; job.total = b; job.phase = 'size'; }
        job.elapsed = Date.now() - job.startedAt;
      });
      job.sub = r.sub;
      job.dirs = r.dirs;
      job.skipped = r.skipped;
      const t = r.sub.get(root) || [0, 0];
      job.totalBytes = t[0];
      job.totalFiles = t[1];
      job.phase = '';
      job.elapsed = Date.now() - job.startedAt;
      job.state = 'done';
    } catch (err) {
      job.state = 'error';
      job.error = String((err && err.message) || err);
    }
  });
}

function safePath(p) {
  if (S.state !== 'done' || !p) return null;
  const norm = path.resolve(p);
  const root = path.resolve(S.root);
  if (norm.toLowerCase() === root.toLowerCase()) return norm;
  if (!norm.toLowerCase().startsWith(root.toLowerCase())) return null;
  return norm;
}

function forget(p, override) {
  const agg = S.sub.get(p) || override;   // tekil dosyalar tarama haritasında yok
  if (!agg) return;
  const [b, f] = agg;
  for (const k of S.sub.keys()) {
    if (k.toLowerCase().startsWith(p.toLowerCase() + path.sep)) S.sub.delete(k);
  }
  S.sub.delete(p);
  let cur = path.dirname(p);
  for (;;) {
    const v = S.sub.get(cur);
    if (v) S.sub.set(cur, [Math.max(0, v[0] - b), Math.max(0, v[1] - f)]);
    const up = path.dirname(cur);
    if (up === cur) break;
    cur = up;
  }
  S.totalBytes = Math.max(0, S.totalBytes - b);
  S.totalFiles = Math.max(0, S.totalFiles - f);
}

/* ------------------------------------------------------------------ */
/* 3. TEMİZLİK                                                         */
/* ------------------------------------------------------------------ */
// exe'de recycle.ps1 gömülüdür: her çağrıda temp'e yazılıp çalıştırılır.
function recyclePath() {
  if (!IS_SEA) return path.join(BASE, DEV_FILES['recycle.ps1']);
  const f = path.join(os.tmpdir(), 'diskverdict-recycle.ps1');
  fs.writeFileSync(f, asset('recycle.ps1'));
  return f;
}

function recycle(paths) {
  return new Promise((resolve) => {
    const json = path.join(os.tmpdir(), 'dd-paths-' + process.pid + '.json');
    fs.writeFileSync(json, JSON.stringify(paths), 'utf8');
    const ps = recyclePath();
    const child = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps, '-JsonFile', json],
      { windowsHide: true });
    let out = '', err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('close', () => {
      try { fs.unlinkSync(json); } catch { /* yok */ }
      const ok = [], fail = [];
      out.split(/\r?\n/).forEach((line) => {
        if (!line.trim()) return;
        const parts = line.split('\t');
        if (parts[0] === 'OK') ok.push(parts[1]);
        else if (parts[0] === 'ERR') fail.push({ path: parts[1], error: parts[2] || err || 'bilinmeyen hata' });
      });
      resolve({ ok, fail });
    });
  });
}

/* ------------------------------------------------------------------ */
/* 4. HTTP                                                             */
/* ------------------------------------------------------------------ */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const L = (lang, tr, en) => (lang === 'en' ? en : tr);

function send(res, code, body, type) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8');
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(buf);
}

function drives() {
  const out = [];
  for (const L of 'CDEFGHIJKLMNOPQRSTUVWXYZ') {
    try { if (fs.existsSync(L + ':\\')) out.push(L + ':'); } catch { /* yok */ }
  }
  return out;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', (d) => { b += d; if (b.length > 5e6) reject(new Error('gövde çok büyük')); });
    req.on('end', () => resolve(b));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const p = url.pathname;
  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'tr';

  try {
    if (p === '/' || p === '/index.html') return send(res, 200, asset('index.html'), MIME['.html']);
    if (p === '/style.css') return send(res, 200, asset('style.css'), MIME['.css']);
    if (p === '/app.js') return send(res, 200, asset('app.js'), MIME['.js']);

    if (p === '/api/drives') return send(res, 200, JSON.stringify({ drives: drives() }));

    if (p === '/api/scan') {
      const d = (url.searchParams.get('drive') || 'C').replace(/[^A-Za-z]/g, '').toUpperCase();
      if (!d) return send(res, 400, JSON.stringify({ error: L(lang, 'geçersiz sürücü', 'invalid drive') }));
      if (S.state === 'scanning') return send(res, 409, JSON.stringify({ error: L(lang, 'tarama zaten sürüyor', 'a scan is already running') }));
      scanDrive(d, lang);
      return send(res, 200, JSON.stringify({ ok: true, root: d + ':\\' }));
    }

    if (p === '/api/status') {
      return send(res, 200, JSON.stringify({
        app: 'diskverdict',
        state: S.state, phase: S.phase, dirs: S.dirs, sized: S.sized, total: S.total,
        skipped: S.skipped, elapsed: S.elapsed, root: S.root,
        totalBytes: S.totalBytes, totalFiles: S.totalFiles, error: S.error,
      }));
    }

    if (p === '/api/tree') {
      const target = safePath(url.searchParams.get('path'));
      if (!target) return send(res, 400, JSON.stringify({ error: L(lang, 'geçersiz yol', 'invalid path') }));
      let ents;
      try { ents = fs.readdirSync(target, { withFileTypes: true }); }
      catch (e) { return send(res, 500, JSON.stringify({ error: L(lang, 'okunamadı: ', 'cannot read: ') + e.message })); }

      const rows = [];
      for (const e of ents) {
        const full = path.join(target, e.name);
        const isLink = e.isSymbolicLink();
        const isDir = e.isDirectory() && !isLink;
        let bytes = 0, files = 0, denied = false;
        if (isDir) {
          const v = S.sub.get(full);
          if (v) { bytes = v[0]; files = v[1]; }
        } else if (!isLink) {
          try { bytes = fs.lstatSync(full).size; files = 1; }
          catch { denied = true; }        // kilitli sistem dosyası (pagefile.sys gibi)
        }
        const cl = classify(full, isDir, lang);
        rows.push({ name: e.name, path: full, dir: isDir, link: isLink, bytes, files, denied, verdict: cl.verdict, cat: cl.cat, why: cl.why });
      }
      rows.sort((a, b) => b.bytes - a.bytes);
      return send(res, 200, JSON.stringify({ path: target, rows }));
    }

    if (p === '/api/opportunities') {
      if (S.state !== 'done') return send(res, 200, JSON.stringify({ rows: [] }));
      const items = [];
      for (const [full, v] of S.sub) {
        if (v[0] < 50 * MB) continue;
        const cl = classify(full, true, lang);
        if (cl.verdict !== 'bad' && cl.verdict !== 'warn') continue;
        items.push({ name: path.basename(full), path: full, dir: true, bytes: v[0], files: v[1], verdict: cl.verdict, cat: cl.cat, why: cl.why });
      }
      // Aynı boyutta ebeveyn/çocuk varsa ebeveyn (daha kısa yol) önce gelsin ki çocuk elensin.
      items.sort((a, b) => b.bytes - a.bytes || a.path.length - b.path.length);
      const kept = [], keptSet = new Set();
      for (const it of items) {
        let anc = path.dirname(it.path), skip = false;
        for (;;) {
          if (keptSet.has(anc)) { skip = true; break; }
          const up = path.dirname(anc);
          if (up === anc) break;
          anc = up;
        }
        if (skip) continue;
        kept.push(it); keptSet.add(it.path);
        if (kept.length >= 150) break;
      }
      return send(res, 200, JSON.stringify({ rows: kept }));
    }

    if (p === '/api/clean' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)) || '{}');
      const mode = body.mode === 'delete' ? 'delete' : 'recycle';
      const list = [...new Set((body.paths || []).map(safePath).filter((x) => x && path.resolve(x).toLowerCase() !== path.resolve(S.root).toLowerCase()))];
      if (!list.length) return send(res, 400, JSON.stringify({ error: L(lang, 'silinecek geçerli yol yok', 'no valid path to delete') }));

      // Tekil dosyalar taranan haritada yok: boyutlarını silmeden önce ölç ki üst klasör toplamı güncellensin.
      const pre = new Map();
      for (const f of list) {
        if (S.sub.has(f)) continue;
        try { const st = fs.lstatSync(f); pre.set(f, [st.size, 1]); } catch { /* ölçülemedi */ }
      }

      let result;
      if (mode === 'recycle') {
        result = await recycle(list);
      } else {
        const ok = [], fail = [];
        for (const f of list) {
          try { fs.rmSync(f, { recursive: true, force: true }); ok.push(f); }
          catch (e) { fail.push({ path: f, error: e.message }); }
        }
        result = { ok, fail };
      }
      let freed = 0;
      for (const f of result.ok) {
        const v = S.sub.get(f) || pre.get(f);
        if (v) freed += v[0];
        forget(f, pre.get(f));
      }
      return send(res, 200, JSON.stringify({ ok: result.ok.length, failed: result.fail, freed, mode }));
    }

    if (p === '/api/shutdown' && req.method === 'POST') { send(res, 200, JSON.stringify({ ok: true })); setTimeout(() => process.exit(0), 150); return; }

    return send(res, 404, JSON.stringify({ error: L(lang, 'bulunamadı', 'not found') }));
  } catch (err) {
    return send(res, 500, JSON.stringify({ error: String((err && err.message) || err) }));
  }
});

/* ------------------------------------------------------------------ */
/* 5. BAŞLAT                                                           */
/* ------------------------------------------------------------------ */
function openWindow(url) {
  const cands = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const c of cands) {
    if (fs.existsSync(c)) {
      try {
        spawn(c, ['--app=' + url, '--window-size=1440,900', '--user-data-dir=' + path.join(os.tmpdir(), 'diskverdict-app')],
          { detached: true, stdio: 'ignore' }).unref();
        return true;
      } catch { /* sıradaki */ }
    }
  }
  try { spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore', windowsHide: true }).unref(); return true; }
  catch { return false; }
}

function listen(port, triesLeft) {
  server.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && triesLeft > 0) return listen(port + 1, triesLeft - 1);
    console.error('Server failed to start:', e.message);
    process.exit(1);
  });
  server.listen(port, '127.0.0.1', () => {
    const url = 'http://127.0.0.1:' + port;
    console.log('');
    console.log('  DiskVerdict is running: ' + url);
    console.log('  Stop it with the "Close" button in the UI, or by closing this window.');
    console.log('');
    if (!process.argv.includes('--no-open')) openWindow(url);
  });
}

async function selfTest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-test-'));
  try {
    fs.mkdirSync(path.join(tmp, 'a', 'b'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'a', 'x.bin'), Buffer.alloc(1000));
    fs.writeFileSync(path.join(tmp, 'a', 'b', 'y.bin'), Buffer.alloc(2000));
    fs.writeFileSync(path.join(tmp, 'c.bin'), Buffer.alloc(500));

    const r = await aggregate(tmp);
    assert.deepStrictEqual(r.sub.get(path.join(tmp, 'a')).slice(0, 2), [3000, 2], 'a toplamı');
    assert.deepStrictEqual(r.sub.get(path.join(tmp, 'a', 'b')).slice(0, 2), [2000, 1], 'b toplamı');
    assert.deepStrictEqual(r.sub.get(tmp).slice(0, 2), [3500, 3], 'kök toplamı');
    assert.strictEqual(r.dirs, 3, 'dizin sayısı');

    // junction döngü/çift sayım koruması
    try {
      execSync(`cmd /c mklink /J "${path.join(tmp, 'link')}" "${path.join(tmp, 'a')}"`, { stdio: 'ignore' });
      const r2 = await aggregate(tmp);
      assert.strictEqual(r2.sub.has(path.join(tmp, 'link')), false, 'junction taranmamalı');
      assert.strictEqual(r2.skipped, 1, 'junction atlandı olarak sayılmalı');
      assert.deepStrictEqual(r2.sub.get(tmp).slice(0, 2), [3500, 3], 'junction çift sayılmamalı');
    } catch (e) {
      console.warn('junction test skipped:', e.message);
    }

    const cases = [
      ['C:\\Users\\Root\\AppData\\Local\\Temp', true, 'bad'],
      ['C:\\hiberfil.sys', false, 'warn'],
      ['C:\\pagefile.sys', false, 'ok'],
      ['C:\\Windows\\WinSxS', true, 'ok'],
      ['C:\\Users\\Root\\.ollama\\models', true, 'move'],
      ['D:\\Program Files\\Unity', true, 'warn'],
      ['C:\\Users\\Root\\Videos', true, 'move'],
      ['C:\\Windows\\Installer', true, 'ok'],
      ['C:\\Users\\Root\\Projects\\app\\node_modules', true, 'bad'],
      ['C:\\Users\\Root\\AppData\\Local\\Programs\\VS Code\\resources\\app\\node_modules', true, 'warn'],
      ['C:\\Program Files\\Microsoft Visual Studio\\18\\Community\\x\\dist', true, 'unknown'],
      ['C:\\Users\\Root\\Projects\\web\\dist', true, 'warn'],
      ['C:\\Program Files\\WSL', true, 'unknown'],
      ['C:\\Program Files\\Unity 6000.6.3f1', true, 'warn'],
    ];
    for (const [p, d, want] of cases) {
      const got = classify(p, d).verdict;
      assert.strictEqual(got, want, p + ' -> ' + got + ' (beklenen ' + want + ')');
    }
    // Aynı kural iki dilde farklı açıklama döndürmeli
    const trWhy = classify('C:\\Users\\Root\\AppData\\Local\\Temp', true, 'tr').why;
    const enWhy = classify('C:\\Users\\Root\\AppData\\Local\\Temp', true, 'en').why;
    assert.ok(trWhy.startsWith('Geçici'), 'tr açıklama: ' + trWhy);
    assert.ok(enWhy.startsWith('Temporary'), 'en açıklama: ' + enWhy);
    assert.strictEqual(classify('C:\\Windows\\WinSxS', true, 'en').why.slice(0, 7), 'Windows');
    console.log('SELFTEST OK');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// İkinci kez .bat'a basılırsa: yeni boş sunucu açmak yerine var olanın penceresini aç.
async function alreadyRunning() {
  for (let port = PORT_START; port < PORT_START + 6; port++) {
    try {
      const r = await fetch('http://127.0.0.1:' + port + '/api/status', { signal: AbortSignal.timeout(600) });
      if (!r.ok) continue;
      const j = await r.json();
      if (j.app === 'diskverdict') return port;
    } catch { /* port boş */ }
  }
  return 0;
}

if (process.argv.includes('--selftest')) { selfTest().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); }); }
else {
  alreadyRunning().then((port) => {
    if (!port) return listen(PORT_START, 20);
    console.log('  DiskVerdict is already running: http://127.0.0.1:' + port);
    if (!process.argv.includes('--no-open')) openWindow('http://127.0.0.1:' + port);
    setTimeout(() => process.exit(0), 700);
  });
}
