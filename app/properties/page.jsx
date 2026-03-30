'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import SlideDrawer from '@/components/SlideDrawer';
import PropertyDetail from '@/components/PropertyDetail';

// ─── CONSTANTS ────────────────────────────────────────────
const SCORE_COLOR = (s) => {
  if (s >= 75) return 'var(--rust)';
  if (s >= 50) return 'var(--amber)';
  if (s >= 25) return 'var(--blue)';
  return 'var(--text-tertiary)';
};

const CATALYST_COLORS = {
  owner:    'rust',
  occupier: 'amber',
  asset:    'blue',
  market:   'purple',
};

const STATUS_COLORS = {
  active:   'green',
  vacant:   'rust',
  expiring: 'amber',
  tracking: 'blue',
  sold:     'gray',
};

const COLUMNS = [
  { key: 'ai_score',        label: 'Score',      width: 80,  sortable: true },
  { key: 'address',         label: 'Address',    width: null, sortable: true },
  { key: 'city',            label: 'City',       width: 130, sortable: true },
  { key: 'prop_type',       label: 'Type',       width: 110, sortable: true },
  { key: 'building_sf',     label: 'Bldg SF',    width: 100, sortable: true },
  { key: 'land_acres',      label: 'Acres',      width: 72,  sortable: true },
  { key: 'clear_height',    label: 'Clear Ht',   width: 80,  sortable: true },
  { key: 'year_built',      label: 'Year',       width: 70,  sortable: true },
  { key: 'tenant',          label: 'Tenant',     width: 170, sortable: true },
  { key: 'lease_expiration',label: 'Exp.',       width: 88,  sortable: true },
  { key: 'in_place_rent',   label: '$/SF',       width: 72,  sortable: true },
  { key: 'vacancy_status',  label: 'Status',     width: 110, sortable: false },
  { key: 'catalyst_tags',   label: 'Catalysts',  width: 180, sortable: false },
];

export default function PropertiesPage() {
  const [properties, setProperties]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [total, setTotal]             = useState(0);
  const [selectedId, setSelectedId]   = useState(null);
  const [selectedProp, setSelectedProp] = useState(null);

  // Filters
  const [search, setSearch]     = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [sortBy, setSortBy]         = useState('ai_score');
  const [sortDir, setSortDir]       = useState('desc');

  // Pagination
  const [page, setPage]   = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    loadProperties();
  }, [search, cityFilter, statusFilter, sortBy, sortDir, page]);

  async function loadProperties() {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from('properties')
        .select('id, address, city, zip, building_sf, land_acres, tenant, lease_expiration, in_place_rent, vacancy_status, ai_score, building_grade, catalyst_tags, year_built, clear_height, zoning, owner, prop_type', { count: 'exact' })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search) {
        query = query.or(`address.ilike.%${search}%,tenant.ilike.%${search}%,city.ilike.%${search}%`);
      }
      if (cityFilter) query = query.eq('city', cityFilter);
      if (statusFilter) query = query.eq('vacancy_status', statusFilter);

      // Sort
      query = query.order(sortBy, { ascending: sortDir === 'asc', nullsFirst: false });

      const { data, error, count } = await query;
      if (error) throw error;
      setProperties(data || []);
      setTotal(count || 0);
    } catch (e) {
      console.error('Properties load error:', e);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSort(col) {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
    setPage(0);
  }

  function handleSelectProperty(prop) {
    setSelectedId(prop.id);
    setSelectedProp(prop);
  }

  function handleClose() {
    setSelectedId(null);
    setSelectedProp(null);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* Header */}
      <div className="cl-page-header">
        <div>
          <h1 className="cl-page-title">Properties</h1>
          <p className="cl-page-subtitle">
            {loading ? 'Loading…' : `${total.toLocaleString()} properties tracked`}
          </p>
        </div>
        <div className="cl-page-actions">
          <button className="cl-btn cl-btn-secondary cl-btn-sm">Import CSV</button>
          <button className="cl-btn cl-btn-primary cl-btn-sm">+ Add Property</button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="cl-filter-bar">
        <input
          className="cl-search-input"
          placeholder="Search address, tenant, city…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
        />
        <select className="cl-select" value={cityFilter} onChange={e => { setCityFilter(e.target.value); setPage(0); }}>
          <option value="">All Cities</option>
          <option value="City of Industry">City of Industry</option>
          <option value="Baldwin Park">Baldwin Park</option>
          <option value="El Monte">El Monte</option>
          <option value="Irwindale">Irwindale</option>
          <option value="Long Beach">Long Beach</option>
          <option value="Pomona">Pomona</option>
          <option value="Ontario">Ontario</option>
          <option value="Fontana">Fontana</option>
          <option value="Rancho Cucamonga">Rancho Cucamonga</option>
        </select>
        <select className="cl-select" value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(0); }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="vacant">Vacant</option>
          <option value="expiring">Expiring</option>
          <option value="tracking">Tracking</option>
        </select>
        {(search || cityFilter || statusFilter) && (
          <button className="cl-btn cl-btn-ghost cl-btn-sm" onClick={() => { setSearch(''); setCityFilter(''); setStatus(''); setPage(0); }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card-bg)', fontSize: 14, minWidth: 1400 }}>
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  style={{
                    width: col.width || undefined,
                    cursor: col.sortable ? 'pointer' : 'default',
                    background: 'rgba(0,0,0,0.025)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    padding: '12px 14px',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--card-border)',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.label}
                  {col.sortable && sortBy === col.key && (
                    <span style={{ marginLeft: 4, opacity: 0.6 }}>
                      {sortDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COLUMNS.length}>
                  <div className="cl-loading"><div className="cl-spinner" />Loading properties…</div>
                </td>
              </tr>
            ) : properties.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length}>
                  <div className="cl-empty">
                    <div className="cl-empty-label">No properties found</div>
                    <div className="cl-empty-sub">Try adjusting your filters or import from CoStar</div>
                  </div>
                </td>
              </tr>
            ) : (
              properties.map(prop => (
                <PropertyRow
                  key={prop.id}
                  prop={prop}
                  selected={selectedId === prop.id}
                  onClick={() => handleSelectProperty(prop)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 14, padding: '0 2px',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="cl-btn cl-btn-secondary cl-btn-sm"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >← Prev</button>
            <button
              className="cl-btn cl-btn-secondary cl-btn-sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >Next →</button>
          </div>
        </div>
      )}

      {/* Slide Drawer */}
      <SlideDrawer
        open={!!selectedId}
        onClose={handleClose}
        fullPageHref={selectedId ? `/properties/${selectedId}` : undefined}
        title={selectedProp?.address || ''}
        subtitle={selectedProp ? `${selectedProp.city}${selectedProp.building_sf ? ` · ${Number(selectedProp.building_sf).toLocaleString()} SF` : ''}` : ''}
        badge={selectedProp?.vacancy_status ? { label: selectedProp.vacancy_status, color: STATUS_COLORS[selectedProp.vacancy_status] || 'gray' } : undefined}
      >
        {selectedId && <PropertyDetail id={selectedId} inline />}
      </SlideDrawer>
    </div>
  );
}

// ─── PROPERTY ROW ─────────────────────────────────────────
function PropertyRow({ prop, selected, onClick }) {
  const tags = Array.isArray(prop.catalyst_tags) ? prop.catalyst_tags : [];

  const leaseExpiry = prop.lease_expiration ? new Date(prop.lease_expiration) : null;
  const monthsToExpiry = leaseExpiry ? Math.round((leaseExpiry - new Date()) / (1000 * 60 * 60 * 24 * 30)) : null;
  const expiryUrgent = monthsToExpiry !== null && monthsToExpiry <= 18;

  return (
    <tr onClick={onClick} style={{
      background: selected ? 'rgba(78, 110, 150, 0.06)' : undefined,
      outline: selected ? '1px solid rgba(78, 110, 150, 0.2)' : undefined,
      outlineOffset: -1,
      borderBottom: '1px solid rgba(0,0,0,0.04)',
      transition: 'background 120ms ease',
      cursor: 'pointer',
    }}
    onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(78,110,150,0.03)'; }}
    onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Score + Grade */}
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <ScoreRing score={prop.ai_score} />
          {prop.building_grade && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: SCORE_COLOR(prop.ai_score || 0) }}>
              {prop.building_grade}
            </span>
          )}
        </div>
      </td>

      {/* Address */}
      <td>
        <span className="cl-table-link" style={{ fontSize: 14, fontWeight: 500 }}>
          {prop.address || '—'}
        </span>
      </td>

      {/* City */}
      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
        {prop.city || '—'}
      </td>

      {/* Type */}
      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        {prop.prop_type || '—'}
      </td>

      {/* Bldg SF */}
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
        {prop.building_sf ? Number(prop.building_sf).toLocaleString() : '—'}
      </td>

      {/* Acres */}
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
        {prop.land_acres ? Number(prop.land_acres).toFixed(2) : '—'}
      </td>

      {/* Clear Height */}
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
        {prop.clear_height ? `${prop.clear_height}'` : '—'}
      </td>

      {/* Year Built */}
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
        {prop.year_built || '—'}
      </td>

      {/* Tenant */}
      <td style={{ fontSize: 13, color: 'var(--text-primary)', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {prop.tenant || <span style={{ color: 'var(--text-tertiary)' }}>Vacant</span>}
      </td>

      {/* Lease expiry */}
      <td>
        {leaseExpiry ? (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: expiryUrgent ? 'var(--rust)' : 'var(--text-secondary)',
            fontWeight: expiryUrgent ? 600 : 400,
          }}>
            {leaseExpiry.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
            {expiryUrgent && monthsToExpiry <= 6 && <span style={{ marginLeft: 3 }}>⚠</span>}
          </span>
        ) : <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>}
      </td>

      {/* Rent */}
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
        {prop.in_place_rent ? `$${Number(prop.in_place_rent).toFixed(2)}` : '—'}
      </td>

      {/* Status */}
      <td>
        {prop.vacancy_status ? (
          <span className={`cl-badge cl-badge-${STATUS_COLORS[prop.vacancy_status] || 'gray'}`} style={{ fontSize: 11 }}>
            {prop.vacancy_status}
          </span>
        ) : '—'}
      </td>

      {/* Catalysts */}
      <td>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {tags.slice(0, 3).map((tag, i) => {
            const cat = typeof tag === 'object' ? tag.category : 'asset';
            const lbl = typeof tag === 'object' ? tag.tag : tag;
            return (
              <span key={i} className={`cl-catalyst cl-catalyst--${cat || 'asset'}`} style={{ fontSize: 10 }}>
                {lbl}
              </span>
            );
          })}
          {tags.length > 3 && (
            <span className="cl-badge cl-badge-gray" style={{ fontSize: 10 }}>+{tags.length - 3}</span>
          )}
        </div>
      </td>
    </tr>
  );
}
// ─── SCORE RING ───────────────────────────────────────────
function ScoreRing({ score }) {
  if (score == null) return <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>—</span>;
  const r = 14;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = SCORE_COLOR(score);

  return (
    <div className="cl-score-ring" style={{ width: 36, height: 36 }}>
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span className="cl-score-ring-value" style={{ fontSize: 10, color }}>{score}</span>
    </div>
  );
}
