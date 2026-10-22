# Multimodal journey assets

Copied unchanged from `jsl-design-prototypes` (`build-app-module.mjs` output). Provenance follows that repository's `docs/TEMP-ASSETS.md` and `production/sea-render/ASSETS.md`.

| File | Provenance | Before public release |
| --- | --- | --- |
| `sea-environment.hdr` | Poly Haven "Kloofendal 48d Partly Cloudy" 1k, Greg Zaal, CC0 | None |
| `sea-coating.jpg` | Packed luminance/roughness tile from Poly Haven "Metal Plate 02", Rob Tuytel, CC0 | None |
| `roof-quality.avif` | JSL-painted roof render from the earlier cargo quality pass | Verify editable source and asset policy |
| `truck-preview.avif` | Approved JSL industrial truck cutout | Confirm original source and rights |
| `port.webp`, `warehouse.webp` | MagicPath visual candidates inherited by the base sequence | Confirm origin or replace with cleared JSL imagery |
| `truck-top.webp` | United Carriers top-truck reference, resized | Replace or obtain usage permission |
| `plane.avif`, `cloud-left.avif`, `cloud-right.avif` | United Carriers reference images (same files as `../journey/`) | Replace or obtain usage permission |
| `GeneralSans-400.woff2`, `GeneralSans-700.woff2` | Prototype font files | Confirm source and license |
| `vessel-hold-photographic.jpg`, `vessel-fallback-mobile.jpg` | Internal Cycles renders at progress 65, used when WebGL is unavailable | Inherited model and asset clearance applies |

The live vessel and water are Three.js geometry and shaders in `src/app/landing/multimodal/jsl-multimodal.mjs`, not images.
