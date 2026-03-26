'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  getWarnFilings, saveWarnFilings, mergeNewFilings,
  getNewWarnCount, getLastSyncTime,
} from './warnStore';

export function useWarnSync() {
  const [filings, setFilings]   = useState([]);
  const [newCount, setNewCount] = useState(0);
  const [syncing, setSyncing]   = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError]       = useState(null);
  const [syncFailed, setSyncFailed] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = getWarnFilings();
    if (stored.length > 0) setFilings(stored);
    setNewCount(getNewWarnCount());
    setLastSync(getLastSyncTime());
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    setSyncFailed(false);
    try {
      const res = await fetch('/api/warn-sync');
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Sync failed');

      const existing = getWarnFilings();
      const { merged, newCount: nc, newFilings } = mergeNewFilings(existing, data.filings);

      saveWarnFilings(merged);
      localStorage.setItem('clerestory_warn_last_sync', new Date().toISOString());
      localStorage.setItem('clerestory_warn_new_count', String(nc));

      setFilings(merged);
      setNewCount(nc);
      setLastSync(new Date().toISOString());

      // Auto-create draft leads for new filings
      if (newFilings.length > 0) {
        createDraftLeads(newFilings);
      }

      return { success: true, newCount: nc, total: merged.length };
    } catch (err) {
      setError(err.message);
      setSyncFailed(true);
      return { success: false, error: err.message };
    } finally {
      setSyncing(false);
    }
  }, []);

  return { filings, newCount, syncing, lastSync, error, syncFailed, sync };
}

// Auto-create draft leads from new WARN filings
function createDraftLeads(newFilings) {
  try {
    const existingLeads = JSON.parse(localStorage.getItem('clerestory_leads') || '[]');
    const existingKeys = new Set(
      existingLeads.map(l => `${l.company}|${l.city}`)
    );

    const newLeads = newFilings
      .filter(f => !existingKeys.has(`${f.company}|${f.city}`))
      .map(f => ({
        id: `warn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: f.company,
        address: f.address,
        city: f.city,
        market: f.market,
        sf: null,
        propType: 'Industrial',
        score: f.is_closure ? 82 : 65,
        grade: f.is_closure ? 'A' : 'B+',
        warn: true,
        warnDate: f.notice_date,
        warnType: f.type,
        workers: f.workers,
        stage: 'New',
        source: 'WARN Intel',
        catalysts: ['warn_notice'],
        createdAt: new Date().toISOString(),
        status: 'draft',
      }));

    if (newLeads.length > 0) {
      const updated = [...newLeads, ...existingLeads];
      localStorage.setItem('clerestory_leads', JSON.stringify(updated));
    }

    return newLeads;
  } catch (e) {
    console.error('createDraftLeads error', e);
    return [];
  }
}
