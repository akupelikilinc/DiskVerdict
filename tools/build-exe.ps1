# Tek dosya Windows exe: Node.js SEA ile server.js + public dosyaları gömer.
# Gereksinim: Node.js 20+ (build için), postject (npx ile otomatik).
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

$node = (Get-Command node).Source
if ([int]((node -v) -replace '^v(\d+).*', '$1') -lt 20) { throw "Node.js 20+ gerekli, bulunan: $(node -v)" }

New-Item -ItemType Directory -Force build | Out-Null
# cmd /c: Node ve npx stderr'e yazdığında PowerShell hata saymasın, çıkış kodu denetlensin.
cmd /c "node --experimental-sea-config sea-config.json 2>&1"
if ($LASTEXITCODE) { throw 'sea-config üretilemedi' }

Copy-Item $node build/DiskVerdict.exe -Force
cmd /c "npx --yes postject@1.0.0-alpha.6 build\DiskVerdict.exe NODE_SEA_BLOB build\sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 2>&1"
if ($LASTEXITCODE) { throw 'postject başarısız' }

$exe = Get-Item build/DiskVerdict.exe
'{0}  {1:N1} MB' -f $exe.FullName, ($exe.Length / 1MB)
