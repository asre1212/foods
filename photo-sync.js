// Photo sync package for The Taste Gazette.
// Keeps photo transfer separate from the core backup so the main JSON stays small:
// the core backup carries rankings only, and photos travel in their own "photo pack"
// file keyed by entry id, merged back onto matching entries on import.
(function () {
  const PACK_KIND = "taste-gazette-photos";
  const PACK_VERSION = 1;

  function isPhotoDataUrl(value) {
    return typeof value === "string" && value.startsWith("data:image/");
  }

  // Clone of state with photos blanked, for the lean core backup.
  function stripPhotos(state) {
    const copy = structuredClone(state);
    copy.categories.forEach((category) => {
      category.items.forEach((item) => { item.photo = ""; });
    });
    return copy;
  }

  // Photos-only export, keyed by entry id.
  function buildPhotoPack(state) {
    const photos = {};
    let count = 0;
    state.categories.forEach((category) => {
      category.items.forEach((item) => {
        if (isPhotoDataUrl(item.photo)) {
          photos[item.id] = item.photo;
          count += 1;
        }
      });
    });
    return { kind: PACK_KIND, version: PACK_VERSION, exportedAt: new Date().toISOString(), photos, count };
  }

  function isPhotoPack(raw) {
    return !!raw && raw.kind === PACK_KIND && raw.photos && typeof raw.photos === "object";
  }

  // Attach pack photos to entries with matching ids. Returns how many were applied.
  function applyPhotoPack(state, pack) {
    let applied = 0;
    state.categories.forEach((category) => {
      category.items.forEach((item) => {
        const photo = pack.photos[item.id];
        if (isPhotoDataUrl(photo)) {
          item.photo = photo;
          applied += 1;
        }
      });
    });
    return applied;
  }

  // When importing a photo-less core backup, keep photos already on this device
  // for entries with matching ids so a transfer doesn't drop them.
  function carryOverPhotos(nextState, prevState) {
    const existing = {};
    prevState.categories.forEach((category) => {
      category.items.forEach((item) => {
        if (isPhotoDataUrl(item.photo)) existing[item.id] = item.photo;
      });
    });
    let carried = 0;
    nextState.categories.forEach((category) => {
      category.items.forEach((item) => {
        if (!item.photo && existing[item.id]) {
          item.photo = existing[item.id];
          carried += 1;
        }
      });
    });
    return carried;
  }

  window.PhotoSync = { stripPhotos, buildPhotoPack, isPhotoPack, applyPhotoPack, carryOverPhotos };
})();
