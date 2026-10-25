param([string]$JsonFile)

# Yolları JSON'dan oku, Windows Shell API ile Geri Dönüşüm Kutusuna taşı.
# Hiçbir onay penceresi göstermez (FOF_NOCONFIRMATION | FOF_SILENT | FOF_NOERRORUI).

$paths = @()
if (Test-Path -LiteralPath $JsonFile) {
    $raw = Get-Content -LiteralPath $JsonFile -Raw -Encoding UTF8
    if ($raw -and $raw.Trim()) { $paths = @($raw | ConvertFrom-Json) }
}

if ($paths.Count -eq 0) { return }

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class ShellDel {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct SHFILEOPSTRUCT {
        public IntPtr hwnd;
        public uint wFunc;
        [MarshalAs(UnmanagedType.LPWStr)] public string pFrom;
        [MarshalAs(UnmanagedType.LPWStr)] public string pTo;
        public ushort fFlags;
        public bool fAnyOperationsAborted;
        public IntPtr hNameMappings;
        [MarshalAs(UnmanagedType.LPWStr)] public string lpszProgressTitle;
    }

    [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
    private static extern int SHFileOperation(ref SHFILEOPSTRUCT op);

    public static int Delete(string p) {
        SHFILEOPSTRUCT op = new SHFILEOPSTRUCT();
        op.wFunc = 3;                                   // FO_DELETE
        op.pFrom = p + "\0\0";                          // çift null ile sonlanır
        op.fFlags = (ushort)(0x0040 | 0x0010 | 0x0004 | 0x0400);
        //           ALLOWUNDO | NOCONFIRMATION | SILENT | NOERRORUI
        return SHFileOperation(ref op);
    }
}
'@

foreach ($p in $paths) {
    try {
        if (-not (Test-Path -LiteralPath $p)) {
            [Console]::Out.WriteLine("ERR`t$p`tbulunamadi")
            continue
        }
        $code = [ShellDel]::Delete($p)
        if ($code -eq 0) {
            [Console]::Out.WriteLine("OK`t$p")
        } else {
            [Console]::Out.WriteLine("ERR`t$p`tSHFileOperation=$code")
        }
    } catch {
        $msg = $_.Exception.Message -replace "`r|`n", ' '
        [Console]::Out.WriteLine("ERR`t$p`t$msg")
    }
}
