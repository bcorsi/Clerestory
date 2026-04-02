'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STAGES = [
  'Tracking','Underwriting','Off-Market Outreach','Marketing','LOI',
  'LOI Accepted','PSA Negotiation','Due Diligence','Non-Contingent',
  'Closed Won','Closed Lost','Dead',
];

const ACTIVE_STAGES = STAGES.filter(s => !['Closed Won','Closed Lost','Dead'].includes(s));

const COMMISSION_STAGES = new Set([
  'LOI Accepted','PSA Negotiation','Due Diligence','Non-Contingent','Closed Won',
]);

// Clerestory badge colors: blue | rust | green | amber | purple | gray
const STAGE_BADGE = (s) => {
  if (s === 'Closed Won')                                                    return 'green';
  if (s === 'Closed Lost' || s === 'Dead')                                   return 'rust';
  if (['LOI Accepted','PSA Negotiation','Non-Contingent'].includes(s))       return 'amber';
  if (s === 'Due Diligence')                                                 return 'purple';
  if (s === 'LOI')                                                           return 'blue';
  return 'gray';
};

const TYPE_BADGE = {
  Disposition: 'blue', Acquisition: 'amber', Lease: 'green', 'Buyer Rep': 'purple',
};

function fmtM(n) {
  if (!n) return null;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}
function fmtSF(n) { return n ? Number(n).toLocaleString() + ' SF' : null; }
function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}
function daysAgo(d) {
  return d ? Math.floor((Date.now() - new Date(d)) / 864e5) : null;
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function DealsPage() {
  const [deals, setDeals]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [stageFilter, setStage] = useState('active');
  const [search, setSearch]     = useState('');
  const [sortBy, setSortBy]     = useState('updated_at');
  const [sortDir, setSortDir]   = useState('desc');
  const [kpis, setKpis]         = useState(null);

  useEffect(() => { loadDeals(); }, [stageFilter, search, sortBy, sortDir]);

  async function loadDeals() {
    setLoading(true);
    try {
      const supabase = createClient();

      const [{ count: totalActive }, { data: valueRows }, { data: commRows }] = await Promise.all([
        supabase.from('deals').select('*', { count: 'exact', head: true })
          .neq('stage','Closed Won').neq('stage','Closed Lost').neq('stage','Dead'),
        supabase.from('deals').select('deal_value')
          .neq('stage','Closed Won').neq('stage','Closed Lost').neq('stage','Dead'),
        supabase.from('deals').select('commission_est').in('stage',[...COMMISSION_STAGES]),
      ]);

      setKpis({
        totalActive:          totalActive || 0,
        pipeline_value:       (valueRows || []).reduce((a,d) => a + (d.deal_value    || 0), 0),
        commission_pipeline:  (commRows  || []).reduce((a,d) => a + (d.commission_est|| 0), 0),
      });

      let query = supabase
        .from('deals')
        .select('id,deal_name,stage,deal_type,priority,deal_value,commission_est,probability,close_date,updated_at,address,city,building_sf')
        .order(sortBy, { ascending: sortDir === 'asc' });

      if (stageFilter === 'active') {
        query = query.neq('stage','Closed Won').neq('stage','Closed Lost').neq('stage','Dead');
      } else if (stageFilter !== 'all') {
        query = query.eq('stage', stageFilter);
      }

      if (search) {
        query = query.or(`deal_name.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      setDeals(data || []);
    } catch (err) {
      console.error('loadDeals:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  }

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s] = deals.filter(d => d.stage === s).length;
    return acc;
  }, {});
  const activeCount = deals.filter(d => !['Closed Won','Closed Lost','Dead'].includes(d.stage)).length;

  return (
    <div className="cl-page">

      {/* HEADER */}
      <div className="cl-page-header">
        <div>
          <h1 className="cl-page-title">Deal Pipeline</h1>
          <p className="cl-page-subtitle">
            {loading ? 'Loading…' : `${kpis?.totalActive ?? 0} active · ${fmtM(kpis?.pipeline_value) ?? '$0'} pipeline value`}
          </p>
        </div>
        <div className="cl-page-actions">
          <input
            className="cl-search-input"
            placeholder="Search deals…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 220 }}
          />
          <Link href="/deals/new" className="cl-btn cl-btn-primary cl-btn-sm">+ New Deal</Link>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="cl-kpi-strip">
        <div className="cl-kpi">
          <div className="cl-kpi-label">Active Deals</div>
          <div className="cl-kpi-value">{loading ? '—' : kpis?.totalActive ?? 0}</div>
        </div>
        <div className="cl-kpi">
          <div className="cl-kpi-label">Pipeline Value</div>
          <div className="cl-kpi-value" style={{ color: 'var(--blue)' }}>
            {loading ? '—' : fmtM(kpis?.pipeline_value) ?? '—'}
          </div>
        </div>
        <div className="cl-kpi">
          <div className="cl-kpi-label">Commission Pipeline</div>
          <div className="cl-kpi-value" style={{ color: 'var(--green)' }}>
            {loading ? '—' : fmtM(kpis?.commission_pipeline) ?? '—'}
          </div>
          <div className="cl-kpi-delta">LOI Accepted +</div>
        </div>
        <div className="cl-kpi">
          <div className="cl-kpi-label">Avg Deal Size</div>
          <div className="cl-kpi-value">
            {loading || !kpis?.totalActive ? '—'
              : fmtM(Math.round((kpis.pipeline_value || 0) / kpis.totalActive)) ?? '—'}
          </div>
        </div>
      </div>

      {/* STAGE PIPELINE TRACK */}
      <div className="cl-stage-track">
        {ACTIVE_STAGES.map((s, i) => {
          const count    = stageCounts[s] || 0;
          const isActive = stageFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStage(isActive ? 'active' : s)}
              className={`cl-stage-step ${isActive ? 'cl-stage-step--active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
            >
              <div className="cl-stage-label">
                {s}&nbsp;
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: isActive ? 'white' : count > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                }}>
                  {count}
                </span>
              </div>
              {i < ACTIVE_STAGES.length - 1 && <div className="cl-stage-arrow" />}
            </button>
          );
        })}
      </div>

      {/* FILTER TABS */}
      <div className="cl-tabs">
        {[
          { key: 'active',      label: `Active (${loading ? '…' : activeCount})` },
          { key: 'all',         label: 'All Deals' },
          { key: 'Closed Won',  label: `Closed Won (${stageCounts['Closed Won']  || 0})` },
          { key: 'Closed Lost', label: `Closed Lost (${stageCounts['Closed Lost']|| 0})` },
          { key: 'Dead',        label: `Dead (${stageCounts['Dead']              || 0})` },
        ].map(t => (
          <button
            key={t.key}
            className={`cl-tab ${stageFilter === t.key ? 'cl-tab--active' : ''}`}
            onClick={() => setStage(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="cl-table-wrap">
        <table className="cl-table">
          <thead>
            <tr>
              {[
                { key: 'deal_name',      label: 'Deal Name' },
                { key: 'stage',          label: 'Stage' },
                { key: 'deal_value',     label: 'Value' },
                { key: 'commission_est', label: 'Commission' },
                { key: 'probability',    label: 'Prob.' },
                { key: 'address',        label: 'Address' },
                { key: 'building_sf',    label: 'SF' },
                { key: 'close_date',     label: 'Close' },
                { key: 'updated_at',     label: 'Updated' },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                >
                  {col.label}
                  {sortBy === col.key && (
                    <span style={{ marginLeft: 3, opacity: 0.4, fontFamily: 'var(--font-mono)', fontSize: 9 }}>
                      {sortDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9}>
                <div className="cl-loading"><div className="cl-spinner" />Loading deals…</div>
              </td></tr>
            ) : deals.length === 0 ? (
              <tr><td colSpan={9}>
                <div className="cl-empty">
                  <div className="cl-empty-label">No deals found</div>
                  <div className="cl-empty-sub">
                    {stageFilter === 'active' ? 'No active deals in the pipeline.' : 'Try a different filter.'}
                  </div>
                </div>
              </td></tr>
            ) : deals.map(deal => {
              const showComm = COMMISSION_STAGES.has(deal.stage);
              const stale    = daysAgo(deal.updated_at);
              return (
                <tr key={deal.id}>

                  {/* Deal name + type badge + priority flag */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Link href={`/deals/${deal.id}`} className="cl-table-link" style={{ fontWeight: 600 }}>
                        {deal.deal_name || deal.address || '(untitled)'}
                      </Link>
                      {deal.priority === 'High' && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--rust)', fontWeight: 700, letterSpacing: '0.05em' }}>!!</span>
                      )}
                      {deal.deal_type && (
                        <span className={`cl-badge cl-badge-${TYPE_BADGE[deal.deal_type] || 'gray'}`}>
                          {deal.deal_type}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Stage */}
                  <td>
                    <span className={`cl-badge cl-badge-${STAGE_BADGE(deal.stage)}`}>
                      {deal.stage}
                    </span>
                  </td>

                  {/* Value */}
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {fmtM(deal.deal_value)
                      ?? <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                  </td>

                  {/* Commission chip — only at LOI Accepted+ */}
                  <td>
                    {showComm && deal.commission_est
                      ? <span className="cl-commission">{fmtM(deal.commission_est)}</span>
                      : <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>—</span>
                    }
                  </td>

                  {/* Probability */}
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {deal.probability != null ? (
                      <span style={{
                        color: deal.probability >= 70 ? 'var(--green)'
                             : deal.probability >= 40 ? 'var(--amber)'
                             : 'var(--text-tertiary)',
                      }}>
                        {deal.probability}%
                      </span>
                    ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                  </td>

                  {/* Address */}
                  <td style={{ fontSize: 12 }}>
                    {deal.address
                      ? <>
                          <span style={{ color: 'var(--text-secondary)' }}>{deal.address}</span>
                          {deal.city && <span style={{ color: 'var(--text-tertiary)' }}> · {deal.city}</span>}
                        </>
                      : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                    }
                  </td>

                  {/* SF */}
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {fmtSF(deal.building_sf) ?? <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                  </td>

                  {/* Close date */}
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
                    {fmtDate(deal.close_date) ?? <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                  </td>

                  {/* Staleness */}
                  <td>
                    {stale != null ? (
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11,
                        color: stale > 14 ? 'var(--amber)' : 'var(--text-tertiary)',
                      }}>
                        {stale}d ago
                      </span>
                    ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
