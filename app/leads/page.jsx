'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import SlideDrawer from '@/components/SlideDrawer';
import LeadDetail from '@/components/LeadDetail';
import { getCatalystStyle, getScoreRing, CATALYST_TAGS, STAGE_COLORS, PRIORITY_COLORS } from '@/lib/catalyst-constants';

// ── PARSE CATALYSTS ───────────────────────────────────────────────────────────
function parseCatalysts(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap(c => {
      if (typeof c === 'string') {
        try {
          const p = JSON.parse(c);
          if (Array.isArray(p)) return p.map(x => typeof x === 'object' && x.tag ? x : { tag: String(x) });
          return typeof p === 'object' && p.tag ? [p] : [{ tag: c }];
        } catch { return [{ tag: c }]; }
      }
      return typeof c === 'object' && c !== null && c.tag ? [c] : [{ tag: String(c) }];
    });
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    try {
      const p = JSON.parse(trimmed);
      if (Array.isArray(p)) {
        return p.flatMap(c => {
          if (typeof c === 'string') {
            try {
              const inner = JSON.parse(c);
              if (Array.isArray(inner)) return inner.map(x => typeof x === 'object' && x.tag ? x : { tag: String(x) });
              return typeof inner === 'object' && inner.tag ? [inner] : [{ tag: c }];
            } catch { return [{ tag: c }]; }
          }
          return typeof c === 'object' && c !== null && c.tag ? [c] : [{ tag: String(c) }];
        });
      }
      if (typeof p === 'object' && p !== null && p.tag) return [p];
      if (typeof p === 'string') return [{ tag: p }];
    } catch { return [{ tag: trimmed }]; }
  }
  if (typeof raw === 'object' && raw !== null && raw.tag) return [raw];
  return [];
}

function normalizeStage(stage) {
  if (!stage || stage === 'Lead') return 'New';
  return stage;
}

const STAGE_TABS = ['All', 'New', 'Researching', 'Decision Maker Identified', 'Contacted', 'Converted'];

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [total, setTotal]               = useState(0);
  const [selectedId, setSelectedId]     = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [kpis, setKpis]                 = useState({ total: 0, hot: 0, pipeline: 0 });
  const [stageTab, setStageTab]         = useState('All');
  const [search, setSearch]             = useState('');
  const [activeCatalystFilter, setActiveCatalystFilter] = useState(null);
  const [sortBy, setSortBy]             = useState('score');
  const [sortDir, setSortDir]           = useState('desc');
  const [page, setPage]                 = useState(0);
  const [showImport, setShowImport]     = useState(false);
  const PAGE_SIZE = 50;

  useEffect(() => { loadLeads(); }, [stageTab, search, activeCatalystFilter, sortBy, sortDir, page]);
  useEffect(() => { loadKpis(); }, []);

  async function loadKpis() {
    try {
      const sb = createClient();
      const [{ count: t }, { count: h }, { count: p }] = await Promise.all([
        sb.from('leads').select('*', { count: 'exact', head: true })
          .neq('stage', 'Converted').neq('stage', 'Killed'),
        sb.from('leads').select('*', { count: 'exact', head: true })
          .gte('score', 70).neq('stage', 'Converted').neq('stage', 'Killed'),
        sb.from('leads').select('*', { count: 'exact', head: true })
          .in('stage', ['Decision Maker Identified', 'Contacted']),
      ]);
      setKpis({ total: t || 0, hot: h || 0, pipeline: p || 0 });
    } catch {}
  }

  async function loadLeads() {
    setLoading(true);
    try {
      const sb = createClient();
      let q = sb.from('leads')
        .select('id, lead_name, company, address, city, market, stage, priority, score, catalyst_tags, building_sf, land_acres, clear_height, dock_doors, year_built, owner_type, decision_maker, phone, created_at, follow_up_date', { count: 'exact' })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (stageTab !== 'All') q = q.eq('stage', stageTab);
      if (search) q = q.or(`lead_name.ilike.%${search}%,company.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%`);
      q = q.order(sortBy, { ascending: sortDir === 'asc', nullsFirst: false });

      const { data, error, count } = await q;
      if (error) throw error;

      let filtered = data || [];
      if (activeCatalystFilter) {
        filtered = filtered.filter(lead => {
          const cats = parseCatalysts(lead.catalyst_tags);
          return cats.some(c => (c?.tag || '').toLowerCase() === activeCatalystFilter.toLowerCase());
        });
      }

      setLeads(filtered);
      setTotal(activeCatalystFilter ? filtered.length : (count || 0));
    } catch (e) {
      console.error('Leads load error:', e);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  function handleCatalystClick(tagName) {
    setActiveCatalystFilter(prev => prev === tagName ? null : tagName);
    setPage(0);
  }

  function handleSelectLead(lead) {
    setSelectedId(lead.id);
    setSelectedLead(lead);
  }

  function handleClose() {
    setSelectedId(null);
    setSelectedLead(null);
  }

  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
    setPage(0);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="cl-page-header">
        <div>
          <h1 className="cl-page-title">Lead Gen</h1>
          <p className="cl-page-subtitle">
            {loading ? 'Loading\u2026' : `${total.toLocaleString()} lead${total !== 1 ? 's' : ''}${activeCatalystFilter ? ` \u00b7 filtered: "${activeCatalystFilter}"` : ''}`}
          </p>
        </div>
        <div className="cl-page-actions">
          <button className="cl-btn cl-btn-secondary cl-btn-sm" onClick={() => setShowImport(true)}>Import CSV</button>
          <button className="cl-btn cl-btn-primary cl-btn-sm" onClick={() => router.push('/leads/new')}>+ New Lead</button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Active Leads',    value: kpis.total,    color: 'var(--text-primary)', sub: 'Excluding converted' },
          { label: 'Hot (Score \u226570)', value: kpis.hot, color: '#DC2626',             sub: 'High catalyst signal' },
          { label: 'In Pipeline',     value: kpis.pipeline, color: '#4E6E96',             sub: 'DM found or contacted' },
          { label: 'Showing',         value: leads.length,  color: 'var(--text-primary)', sub: activeCatalystFilter ? `"${activeCatalystFilter}"` : stageTab === 'All' ? 'All stages' : stageTab },
        ].map(kpi => (
          <div key={kpi.label} className="cl-kpi">
            <div className="cl-kpi-label">{kpi.label}</div>
            <div className="cl-kpi-value" style={{ color: kpi.color, fontSize: 28 }}>{kpi.value}</div>
            <div className="cl-kpi-delta" style={{ marginTop: 2 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* CATALYST FILTER BANNER */}
      {activeCatalystFilter && (() => {
        const cs = getCatalystStyle(activeCatalystFilter);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', marginBottom: 12, background: cs.bg, border: `1px solid ${cs.bdr}`, borderRadius: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: cs.color, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Catalyst Filter:</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: cs.color, fontFamily: 'var(--font-mono)' }}>{activeCatalystFilter}</span>
            <span style={{ fontSize: 12, color: cs.color, opacity: 0.65 }}>&mdash; {leads.length} lead{leads.length !== 1 ? 's' : ''} matched</span>
            <button onClick={() => setActiveCatalystFilter(null)} style={{ marginLeft: 'auto', fontSize: 11, color: cs.color, background: 'none', border: `1px solid ${cs.bdr}`, borderRadius: 5, padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>&times; Clear</button>
          </div>
        );
      })()}

      {/* STAGE TABS */}
      <div className="cl-tabs" style={{ marginBottom: 12 }}>
        {STAGE_TABS.map(tab => {
          const isActive = stageTab === tab;
          const st = tab !== 'All' ? STAGE_COLORS[tab] : null;
          return (
            <button key={tab} onClick={() => { setStageTab(tab); setPage(0); }}
              style={{ padding: '8px 14px', fontSize: 13, fontWeight: isActive ? 600 : 400, fontFamily: 'var(--font-ui)', cursor: 'pointer', background: 'none', border: 'none', borderBottom: isActive ? `2px solid ${st ? st.color : 'var(--blue)'}` : '2px solid transparent', color: isActive ? (st ? st.color : 'var(--blue)') : 'var(--text-tertiary)', marginBottom: -1, whiteSpace: 'nowrap', transition: 'color 120ms ease, border-color 120ms ease' }}>
              {tab}
            </button>
          );
        })}
      </div>

      {/* SEARCH */}
      <div className="cl-filter-bar">
        <input className="cl-search-input" placeholder="Search name, company, address, city\u2026" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        {(search || activeCatalystFilter) && (
          <button className="cl-btn cl-btn-ghost cl-btn-sm" onClick={() => { setSearch(''); setActiveCatalystFilter(null); setPage(0); }}>Clear all</button>
        )}
      </div>

      {/* TABLE */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card-bg)', fontSize: 13, minWidth: 1100 }}>
          <thead>
            <tr>
              {[
                { key: 'score',          label: 'Score',    width: 72  },
                { key: 'lead_name',      label: 'Lead',     width: null },
                { key: 'city',           label: 'City',     width: 110 },
                { key: 'stage',          label: 'Stage',    width: 200 },
                { key: 'building_sf',    label: 'Bldg SF',  width: 90  },
                { key: 'land_acres',     label: 'Land AC',  width: 76  },
                { key: 'clear_height',   label: 'Clear Ht', width: 74  },
                { key: 'dock_doors',     label: 'DH Doors', width: 74  },
                { key: 'priority',       label: 'Priority', width: 100 },
                { key: 'catalyst_tags',  label: 'Catalysts',width: 220 },
                { key: 'follow_up_date', label: 'Next F/U', width: 88  },
              ].map(col => (
                <th key={col.key}
                  style={{ width: col.width || undefined, cursor: col.key !== 'catalyst_tags' && col.key !== 'priority' ? 'pointer' : 'default', background: 'rgba(0,0,0,0.02)', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase', padding: '11px 14px', textAlign: 'left', borderBottom: '1px solid var(--card-border)', whiteSpace: 'nowrap', userSelect: 'none' }}
                  onClick={() => col.key !== 'catalyst_tags' && col.key !== 'priority' && handleSort(col.key)}
                >
                  {col.label}{sortBy === col.key && <span style={{ marginLeft: 4, opacity: 0.5 }}>{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11}><div className="cl-loading" style={{ padding: 40 }}><div className="cl-spinner" />Loading leads\u2026</div></td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={11}><div className="cl-empty" style={{ padding: 48 }}>
                <div className="cl-empty-label">No leads found</div>
                <div className="cl-empty-sub">{activeCatalystFilter ? `No leads tagged "${activeCatalystFilter}"` : 'Try adjusting your filters'}</div>
              </div></td></tr>
            ) : leads.map(lead => (
              <LeadRow key={lead.id} lead={lead} selected={selectedId === lead.id}
                activeCatalystFilter={activeCatalystFilter}
                onClick={() => handleSelectLead(lead)}
                onCatalystClick={handleCatalystClick}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>
            {page * PAGE_SIZE + 1}&ndash;{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="cl-btn cl-btn-secondary cl-btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>&larr; Prev</button>
            <button className="cl-btn cl-btn-secondary cl-btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next &rarr;</button>
          </div>
        </div>
      )}

      {/* SLIDE DRAWER */}
      <SlideDrawer
        open={!!selectedId}
        onClose={handleClose}
        fullPageHref={selectedId ? `/leads/${selectedId}` : undefined}
        title={selectedLead?.lead_name || selectedLead?.company || ''}
        subtitle={selectedLead ? [selectedLead.city, selectedLead.building_sf ? `${Number(selectedLead.building_sf).toLocaleString()} SF` : null].filter(Boolean).join(' \u00b7 ') : ''}
        badge={selectedLead?.stage ? { label: normalizeStage(selectedLead.stage), color: 'blue' } : undefined}
      >
        {selectedId && selectedLead && (
          <LeadDetail
            lead={{ ...selectedLead, stage: normalizeStage(selectedLead.stage) }}
            onClose={handleClose}
            onRefresh={() => { loadLeads(); loadKpis(); }}
          />
        )}
      </SlideDrawer>

      {showImport && <ImportCSVModal onClose={() => setShowImport(false)} onImported={() => { loadLeads(); loadKpis(); }} />}
    </div>
  );
}

// ── LEAD ROW ─────────────────────────────────────────────────────────────────
function LeadRow({ lead, selected, activeCatalystFilter, onClick, onCatalystClick }) {
  const catalysts = parseCatalysts(lead.catalyst_tags);
  const { color: scoreColor, grade } = getScoreRing(lead.score || 0);
  const score = lead.score || 0;
  const stage = normalizeStage(lead.stage);
  const isOverdue = lead.follow_up_date && new Date(lead.follow_up_date) < new Date();

  // System 3: outlined pill from STAGE_COLORS
  const stageStyle = STAGE_COLORS[stage] || STAGE_COLORS['New'];

  // System 2: square chip + left border from PRIORITY_COLORS
  const priStyle = PRIORITY_COLORS[lead.priority] || PRIORITY_COLORS['Medium'];

  return (
    <tr onClick={onClick}
      style={{ background: selected ? 'rgba(78,110,150,0.05)' : undefined, borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'background 120ms ease' }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(78,110,150,0.025)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Score — System 1: circular ring, heat scale */}
      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
        {score > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <ScoreRing score={score} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: scoreColor }}>{grade}</span>
          </div>
        ) : <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>&mdash;</span>}
      </td>

      {/* Lead name */}
      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>{lead.lead_name || lead.company || '\u2014'}</div>
        {lead.address && <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 1 }}>{lead.address}</div>}
        {lead.owner_type && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1, fontStyle: 'italic' }}>{lead.owner_type}</div>}
      </td>

      {/* City */}
      <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontSize: 12.5, color: 'var(--text-secondary)' }}>
        {lead.city || '\u2014'}
        {lead.market && <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1, fontFamily: 'var(--font-mono)' }}>{lead.market}</div>}
      </td>

      {/* Stage — System 3: outlined pill */}
      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 500, whiteSpace: 'nowrap', ...stageStyle }}>
          {stage}
        </span>
      </td>

      {/* Bldg SF */}
      <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
        {lead.building_sf ? Number(lead.building_sf).toLocaleString() : '\u2014'}
      </td>

      {/* Land AC */}
      <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
        {lead.land_acres ? Number(lead.land_acres).toFixed(2) : '\u2014'}
      </td>

      {/* Clear Ht */}
      <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
        {lead.clear_height ? `${lead.clear_height}'` : '\u2014'}
      </td>

      {/* DH Doors */}
      <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
        {lead.dock_doors || '\u2014'}
      </td>

      {/* Priority — System 2: square chip + left border */}
      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
        {lead.priority && (
          <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', ...priStyle }}>
            {lead.priority}
          </span>
        )}
      </td>

      {/* Catalysts — System 4: square chip + colored dot */}
      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {catalysts.slice(0, 3).map((c, i) => {
            const tagName = (c?.tag || String(c)).trim();
            if (!tagName || tagName.startsWith('{') || tagName.startsWith('[')) return null;
            const cs = getCatalystStyle(tagName);
            const isActive = activeCatalystFilter === tagName;
            return (
              <span key={i}
                onClick={() => onCatalystClick(tagName)}
                title={`Filter by "${tagName}"`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 7px', borderRadius: 4,
                  fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono)', cursor: 'pointer',
                  transition: 'all 120ms ease',
                  border: `1px solid ${cs.bdr}`,
                  background: isActive ? cs.color : cs.bg,
                  color: isActive ? '#fff' : cs.color,
                }}
              >
                {/* Dot prefix — System 4 identifier */}
                <span style={{
                  width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                  background: isActive ? 'rgba(255,255,255,0.8)' : cs.dot,
                  display: 'inline-block',
                }} />
                {tagName}
              </span>
            );
          })}
          {catalysts.length > 3 && (
            <span style={{ display: 'inline-flex', padding: '2px 6px', borderRadius: 4, fontSize: 10, background: 'rgba(0,0,0,0.05)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              +{catalysts.length - 3}
            </span>
          )}
          {catalysts.length === 0 && <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>\u2014</span>}
        </div>
      </td>

      {/* Next F/U */}
      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
        {lead.follow_up_date ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: isOverdue ? '#C0392B' : 'var(--text-secondary)', fontWeight: isOverdue ? 600 : 400 }}>
            {isOverdue && '\u26a0 '}{new Date(lead.follow_up_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ) : <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>\u2014</span>}
      </td>
    </tr>
  );
}

// ── SCORE RING ────────────────────────────────────────────────────────────────
// System 1: circular SVG ring, heat-scale colors
function ScoreRing({ score }) {
  const { color } = getScoreRing(score);
  const r = 13, circ = 2 * Math.PI * r, filled = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34 }}>
      <svg width="34" height="34" viewBox="0 0 34 34">
        <circle cx="17" cy="17" r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="2.5" />
        <circle cx="17" cy="17" r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round" transform="rotate(-90 17 17)" />
      </svg>
      <span style={{ position: 'absolute', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color }}>{score}</span>
    </div>
  );
}

// ── IMPORT CSV MODAL ──────────────────────────────────────────────────────────
function ImportCSVModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState('');

  const FIELD_MAP = {
    'lead_name': 'lead_name', 'name': 'lead_name', 'lead name': 'lead_name',
    'company': 'company', 'company name': 'company',
    'address': 'address', 'street': 'address',
    'city': 'city', 'market': 'market',
    'building_sf': 'building_sf', 'building sf': 'building_sf', 'sf': 'building_sf', 'sq ft': 'building_sf',
    'land_acres': 'land_acres', 'land acres': 'land_acres', 'acres': 'land_acres',
    'clear_height': 'clear_height', 'clear height': 'clear_height', 'clear ht': 'clear_height',
    'dock_doors': 'dock_doors', 'dock doors': 'dock_doors', 'docks': 'dock_doors',
    'year_built': 'year_built', 'year built': 'year_built',
    'zoning': 'zoning', 'owner_type': 'owner_type', 'owner type': 'owner_type',
    'stage': 'stage', 'priority': 'priority', 'notes': 'notes',
    'phone': 'phone', 'email': 'email',
    'decision_maker': 'decision_maker', 'decision maker': 'decision_maker', 'contact': 'decision_maker',
  };

  function parseCSV(text) {
    const lines = text.trim().split('\n');
    const hdrs = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj = {};
      hdrs.forEach((h, i) => { obj[h] = vals[i] || ''; });
      return obj;
    }).filter(r => Object.values(r).some(v => v));
    return { hdrs, rows };
  }

  function handleFile(f) {
    setFile(f); setError('');
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const { hdrs, rows } = parseCSV(e.target.result);
        setHeaders(hdrs); setPreview(rows.slice(0, 5));
      } catch { setError('Could not parse CSV \u2014 check format and try again.'); }
    };
    reader.readAsText(f);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true); setDone(0);
    try {
      const sb = createClient();
      const reader = new FileReader();
      reader.onload = async e => {
        const { rows } = parseCSV(e.target.result);
        let count = 0;
        for (const row of rows) {
          const record = { stage: 'New', priority: 'Medium', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
          Object.entries(row).forEach(([k, v]) => {
            const mapped = FIELD_MAP[k.toLowerCase()];
            if (mapped && v) {
              if (['building_sf', 'dock_doors', 'year_built'].includes(mapped)) record[mapped] = parseInt(v.replace(/,/g, '')) || null;
              else if (['land_acres', 'clear_height'].includes(mapped)) record[mapped] = parseFloat(v) || null;
              else record[mapped] = v;
            }
          });
          if (!record.lead_name && !record.company) continue;
          if (!record.lead_name) record.lead_name = record.company;
          await sb.from('leads').insert(record);
          count++; setDone(count);
        }
        onImported?.(); onClose();
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Import failed: ' + err.message); setImporting(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--card-border)', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', width: '100%', maxWidth: 640, maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--card-border)' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Import Leads from CSV</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Columns: lead_name, company, address, city, market, building_sf, clear_height, dock_doors, stage, priority, notes</div>
          </div>
          <button onClick={onClose} style={{ fontSize: 20, color: 'var(--text-tertiary)', lineHeight: 1 }}>&times;</button>
        </div>
        <div style={{ padding: 20 }}>
          <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => document.getElementById('csv-file-input').click()}
            style={{ border: '2px dashed var(--card-border)', borderRadius: 8, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: file ? 'rgba(78,110,150,0.04)' : 'transparent', marginBottom: 16 }}>
            <input id="csv-file-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
            {file ? (
              <div><div style={{ fontSize: 24, marginBottom: 6 }}>📄</div><div style={{ fontSize: 14, fontWeight: 500 }}>{file.name}</div><div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{preview.length}+ rows \u00b7 click to change</div></div>
            ) : (
              <div><div style={{ fontSize: 28, marginBottom: 8 }}>📂</div><div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Drop CSV file here or click to browse</div></div>
            )}
          </div>
          {error && <div style={{ padding: '8px 12px', background: 'rgba(184,55,20,0.08)', border: '1px solid rgba(184,55,20,0.2)', borderRadius: 6, color: 'var(--rust)', fontSize: 12, marginBottom: 12 }}>{error}</div>}
          {preview.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>Preview (first 5 rows)</div>
              <div style={{ overflowX: 'auto', borderRadius: 6, border: '1px solid var(--card-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr>{headers.map(h => <th key={h} style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--card-border)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: FIELD_MAP[h] ? 'var(--blue)' : 'var(--text-tertiary)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}{FIELD_MAP[h] ? ' \u2713' : ' \u2014'}</th>)}</tr></thead>
                  <tbody>{preview.map((row, i) => <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{headers.map(h => <td key={h} style={{ padding: '5px 10px', color: 'var(--text-secondary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[h] || '\u2014'}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
          {importing && <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', color: 'var(--blue)', fontSize: 13 }}><div className="cl-spinner" />Importing\u2026 {done} lead{done !== 1 ? 's' : ''} added</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.01)' }}>
          <button className="cl-btn cl-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="cl-btn cl-btn-primary" onClick={handleImport} disabled={!file || importing}>
            {importing ? `Importing ${done}\u2026` : `Import ${preview.length > 0 ? preview.length + '+' : ''} Leads`}
          </button>
        </div>
      </div>
    </div>
  );
}
