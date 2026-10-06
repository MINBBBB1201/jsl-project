# Blender portable preparation

Blender 5.2.2 LTS Windows x64 is pinned to the official September 15, 2026 release, supported until July 2028. No account, administrator installation, PATH change, global setting or MCP registration is required. See [official LTS](https://www.blender.org/download/LTS/), [release](https://www.blender.org/releases/5-2/) and [license](https://www.blender.org/about/license/).

## Current status: not installed

On October 6, 2026 the official HTTPS directory and checksum file were read successfully. The Windows ZIP is 404,453,484 bytes. Expected SHA-256 is `3849d17a682cba006075aaa3f3597ecb5c9c30ec31035b2e092c53e40679b535`. Only 1.22 GiB free was observed on C:, and no other data drive was detected. Download/extraction, Blender execution, rendering and GLB export were not attempted. The archive hash has therefore not been verified against downloaded bytes.

- [Official ZIP](https://download.blender.org/release/Blender5.2/blender-5.2.2-windows-x64.zip)
- [Official checksum list](https://download.blender.org/release/Blender5.2/blender-5.2.2.sha256)
- Manifest: `blender-portable.manifest.json`

## Explicit setup when sufficient space is available

The setup requires at least 3 GiB free as a conservative reserve for both preserved ZIP and extracted files. It never deletes files, overwrites an existing version folder, falls back to an unofficial download or modifies production files.

```powershell
Set-Location 'C:/Users/mimin/Desktop/jsl-project/tools/landing-review'
./setup-blender-portable.ps1 -CheckOnly
./setup-blender-portable.ps1
node ./blender-smoke.mjs
```

Default binary after installation:
`C:/Users/mimin/.codex/tools/blender/5.2.2-windows-x64/blender-5.2.2-windows-x64/blender.exe`

For an explicitly chosen tool directory on another data volume:

```powershell
./setup-blender-portable.ps1 -InstallRoot 'D:/Codex-tools/blender' -CheckOnly
./setup-blender-portable.ps1 -InstallRoot 'D:/Codex-tools/blender'
node ./blender-smoke.mjs --binary 'D:/Codex-tools/blender/5.2.2-windows-x64/blender-5.2.2-windows-x64/blender.exe'
```

This is an example path, not a detected or installed drive.

## Verification scope

The smoke script runs the pinned local binary headlessly, creates a small CPU render and GLB from a synthetic box fixture, then calls the existing Sharp decoder and Khronos glTF Validator through `asset-check.mjs`. Every run saves to a new `artifacts/blender-smoke-<timestamp>` folder. It does not create approved landing assets, test equipment contact or demonstrate production motion quality. The fixture is only a check that local rendering and export work.
