const STORAGE_KEY    = 'clerestory_warn_filings';
const LAST_SYNC_KEY  = 'clerestory_warn_last_sync';
const NEW_COUNT_KEY  = 'clerestory_warn_new_count';

export function getWarnFilings() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function saveWarnFilings(filings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filings));
  } catch (e) { console.error('WARN store error', e); }
}

export function getNewWarnCount() {
  try {
    return parseInt(localStorage.getItem(NEW_COUNT_KEY) || '0');
  } catch { return 0; }
}

export function clearNewWarnCount() {
  try {
    localStorage.setItem(NEW_COUNT_KEY, '0');
  } catch { /* noop */ }
}

export function getLastSyncTime() {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch { return null; }
}

export function mergeNewFilings(existingFilings, newFilings) {
  // Deduplicate by company + city + notice_date
  const existingKeys = new Set(
    existingFilings.map(f => `${f.company}|${f.city}|${f.notice_date}`)
  );

  const brandNew = newFilings.filter(f =>
    !existingKeys.has(`${f.company}|${f.city}|${f.notice_date}`)
  );

  return {
    merged: [...brandNew, ...existingFilings],
    newCount: brandNew.length,
    newFilings: brandNew,
  };
}
