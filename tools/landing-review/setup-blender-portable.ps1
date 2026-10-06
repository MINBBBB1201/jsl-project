param(
    [string]$InstallRoot = 'C:/Users/mimin/.codex/tools/blender',
    [switch]$CheckOnly
)
$ErrorActionPreference = 'Stop'
$spec = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'blender-portable.manifest.json') | ConvertFrom-Json
$resolvedRoot = [System.IO.Path]::GetFullPath($InstallRoot)
$versionPath = Join-Path $resolvedRoot $spec.versionDirectory
$archivePath = Join-Path $versionPath $spec.archiveName
$binaryPath = Join-Path $versionPath $spec.binaryRelativePath
$volumeRoot = [System.IO.Path]::GetPathRoot($resolvedRoot)
$volume = [System.IO.DriveInfo]::new($volumeRoot)
if (-not $volume.IsReady) { throw "Target volume is not ready: $volumeRoot" }
$officialChecksum = Invoke-WebRequest -UseBasicParsing -Uri $spec.checksumUrl -TimeoutSec 30
$expectedLine = ($officialChecksum.Content -split "`n" | Where-Object {
    $_ -match ('^[a-fA-F0-9]{64}\s+\*?' + [regex]::Escape($spec.archiveName) + '\s*$')
} | Select-Object -First 1)
if (-not $expectedLine) { throw 'Pinned archive is absent from the official checksum list.' }
$publishedHash = ($expectedLine.Trim() -split '\s+')[0].ToLowerInvariant()
if ($publishedHash -ne $spec.sha256) { throw 'Official checksum differs from the pinned manifest; stop and review the source.' }
$ready = $volume.AvailableFreeSpace -ge $spec.minimumFreeBytes
$state = [ordered]@{
    version = $spec.version
    officialChecksumMatches = $true
    installPath = $versionPath
    binaryPath = $binaryPath
    alreadyInstalled = (Test-Path -LiteralPath $binaryPath)
    freeBytes = $volume.AvailableFreeSpace
    minimumFreeBytes = $spec.minimumFreeBytes
    readyForInstall = $ready
}
if ($CheckOnly) { $state | ConvertTo-Json; exit 0 }
if (Test-Path -LiteralPath $versionPath) {
    throw "Version directory already exists. It will not be overwritten: $versionPath"
}
if (-not $ready) {
    throw "Insufficient space. Require 3 GiB free before downloading; available $($volume.AvailableFreeSpace) bytes. No files downloaded."
}
New-Item -ItemType Directory -Path $versionPath | Out-Null
try {
    Invoke-WebRequest -UseBasicParsing -Uri $spec.archiveUrl -OutFile $archivePath -TimeoutSec 300
    $archiveFile = Get-Item -LiteralPath $archivePath
    if ($archiveFile.Length -ne $spec.archiveBytes) { throw 'Downloaded archive size differs from the pinned manifest.' }
    $downloadedHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($downloadedHash -ne $spec.sha256) { throw 'Downloaded SHA-256 differs from the official checksum. Extraction stopped.' }
    Expand-Archive -LiteralPath $archivePath -DestinationPath $versionPath
    if (-not (Test-Path -LiteralPath $binaryPath)) { throw 'Expected portable binary is missing after extraction.' }
    $versionOutput = & $binaryPath --background --factory-startup --version 2>&1
    if ($LASTEXITCODE -ne 0 -or ($versionOutput -join "`n") -notmatch ('Blender ' + [regex]::Escape($spec.version))) {
        throw 'Installed binary did not report the pinned Blender version.'
    }
    [ordered]@{
        installedAt = [DateTime]::UtcNow.ToString('o')
        version = $spec.version
        archiveUrl = $spec.archiveUrl
        checksumUrl = $spec.checksumUrl
        sha256 = $downloadedHash
        archiveBytes = $archiveFile.Length
        binaryPath = $binaryPath
        versionOutput = ($versionOutput -join "`n")
        status = 'installed-version-verified'
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $versionPath 'installation.json') -Encoding UTF8
    Write-Output "Portable Blender verified: $binaryPath"
    Write-Output 'Run node blender-smoke.mjs for render/export/validator verification.'
} catch {
    Write-Error "Official portable setup failed. Partial files are preserved for inspection; no fallback source was used. $($_.Exception.Message)"
    exit 1
}
