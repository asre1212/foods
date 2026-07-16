---
name: verify
description: Build/launch/drive recipe for verifying changes to The Taste Gazette PWA in this repo.
---

# Verifying The Taste Gazette

Static single-page PWA — no build step. `index.html` holds all app code, `photo-sync.js` is the photo transfer module, `sw.js` the service worker.

## Launch

```bash
cd /home/user/foods && python3 -m http.server 8901 --bind 127.0.0.1 &
```

## Drive (headless Chromium via Playwright)

Playwright is installed globally; import it by absolute path and use the pre-installed browser:

```js
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
```

Gotchas:
- `executablePath` must be `/opt/pw-browsers/chromium` (a symlink straight to the binary), not `.../chrome-linux/chrome`.
- ESM ignores NODE_PATH — absolute import path required.
- App state lives in localStorage key `taste-gazette-v2`; `localStorage.clear()` + reload simulates a fresh device (starter data reappears — use Settings → Clear All Data for a truly empty state).
- `confirm`/`alert` are used throughout — register a `page.on('dialog')` handler before clicking.
- Exports are `<a download>` clicks — use `page.waitForEvent('download')`.

## Flows worth driving

- Add/edit entry with photo: click `.item .edit`, `setInputFiles('#photoFile', png)`, wait for `#photoPreview[src^="data:image/jpeg"]`, submit.
- Transfer: Settings → export backup (`#exportData`, photo-less) and photo pack (`#exportPhotos`), wipe, import via `#importFile` (auto-detects backup vs photo pack).
