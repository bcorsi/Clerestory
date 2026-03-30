'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import SlideDrawer from '@/components/SlideDrawer';

function fmt(n) { return n != null ? Number(n).toLocaleString() : '—'; }
function fmtM(n) { return n != null && n > 0 ? `$${(Number(n)/1000000).toFixed(2)}M` : '—'; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function SaleCompsPage() {
  const [comps, setComps]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedComp, setSelectedComp] = useState(null);

  const [search, setSearch]         = useState('');
  const [sortBy, setSortBy]         = useState('sale_date');
  const [sortDir, setSortDir]       = useState('desc');
  const [page, setPage]             = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => { loadComps(); }, [search, sortBy, sortDir, page]);

  async function loadComps() {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from('sale_comps')
        .select('id, address, city, submarket, building_sf, land_acres, year_built, clear_height, sale_price, price_psf, cap_rate, sale_date, buyer, seller, sale_type, notes', { count: 'exact' })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .order(sortBy, { ascending: sortDir === 'asc', nullsFirst: false });

      if (search) query = query.or(`address.ilike.%${search}%,buyer.ilike.%${search}%,seller.ilike.%${search}%,city.ilike.%${search}%`);

      const { data, error, count } = await query;
      if (error) throw error;
      setComps(data || []);
      setTotal(count || 0);
    } catch(e) {
      console.error(e);
      setComps([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSort(key) {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('desc'); }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const SORTABLE = { 'Address': 'address', 'City': 'city', 'SF': 'building_sf', 'Sale Price': 'sale_price', '$/SF': 'price_psf', 'Cap Rate': 'cap_rate', 'Sale Date': 'sale_date' };

  return (
    <div>
      <div className="cl-page-header">
        <div>
          <h1 className="cl-page-title">Sale Comps</h1>
          <p className="cl-page-subtitle">
            {loading ? 'Loading…' : `${fmt(total)} comp${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="cl-page-actions">
          <button className="cl-btn cl-btn-secondary cl-btn-sm">Import CSV</button>
          <button className="cl-btn cl-btn-primary cl-btn-sm">+ Add Comp</button>
        </div>
      </div>

      <div className="cl-filter-bar">
        <input className="cl-search-input" placeholder="Search address, buyer, seller, city…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }} style={{ maxWidth: 360 }} />
        <select className="cl-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="sale_date">Sort: Date</option>
          <option value="sale_price">Sort: Price</option>
          <option value="price_psf">Sort: $/SF</option>
          <option value="building_sf">Sort: Size</option>
          <option value="cap_rate">Sort: Cap Rate</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card-bg)', fontSize: 14, minWidth: 1200 }}>
          <thead>
            <tr>
              {[
                { label: 'Address',    width: null },
                { label: 'City',       width: 130 },
                { label: 'SF',         width: 100 },
                { label: 'Acres',      width: 72 },
                { label: 'Year',       width: 70 },
                { label: 'Clear Ht',   width: 80 },
                { label: 'Sale Price', width: 120 },
                { label: '$/SF',       width: 90 },
                { label: 'Cap Rate',   width: 90 },
                { label: 'Sale Date',  width: 100 },
                { label: 'Sale Type',  width: 110 },
                { label: 'Buyer',      width: 180 },
                { label: 'Seller',     width: 180 },
              ].map(col => (
                <th key={col.label}
                  onClick={() => SORTABLE[col.label] && handleSort(SORTABLE[col.label])}
                  style={{
                    width: col.width || undefined,
                    background: 'rgba(0,0,0,0.025)',
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
                    letterSpacing: '0.1em', color: 'var(--text-tertiary)',
                    textTransform: 'uppercase', padding: '12px 14px',
                    textAlign: 'left', borderBottom: '1px solid var(--card-border)',
                    whiteSpace: 'nowrap', cursor: SORTABLE[col.label] ? 'pointer' : 'default',
                  }}>
                  {col.label}
                  {sortBy === SORTABLE[col.label] && <span style={{ marginLeft: 4, opacity: 0.6 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={13}><div className="cl-loading" style={{ padding: 40 }}><div className="cl-spinner" /></div></td></tr>
            ) : comps.length === 0 ? (
              <tr><td colSpan={13}>
                <div className="cl-empty" style={{ padding: 48 }}>
                  <div className="cl-empty-label">No sale comps found</div>
                  <div className="cl-empty-sub">Import from CoStar or add manually</div>
                </div>
              </td></tr>
            ) : comps.map(comp => (
              <tr key={comp.id}
                onClick={() => { setSelectedId(comp.id); setSelectedComp(comp); }}
                style={{
                  background: selectedId === comp.id ? 'rgba(78,110,150,0.06)' : undefined,
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  cursor: 'pointer', transition: 'background 120ms',
                }}
                onMouseEnter={e => { if (selectedId !== comp.id) e.currentTarget.style.background = 'rgba(78,110,150,0.03)'; }}
                onMouseLeave={e => { if (selectedId !== comp.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, color: 'var(--blue)' }}>{comp.address}</td>
                <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{comp.city || '—'}</td>
                <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{comp.building_sf ? fmt(comp.building_sf) : '—'}</td>
                <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{comp.land_acres ? Number(comp.land_acres).toFixed(2) : '—'}</td>
                <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{comp.year_built || '—'}</td>
                <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{comp.clear_height ? `${comp.clear_height}'` : '—'}</td>
                <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fmtM(comp.sale_price)}</td>
                <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>
                  {comp.price_psf ? `$${Number(comp.price_psf).toFixed(0)}` : '—'}
                </td>
                <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: comp.cap_rate ? 'var(--green)' : 'var(--text-tertiary)' }}>
                  {comp.cap_rate ? `${Number(comp.cap_rate).toFixed(2)}%` : '—'}
                </td>
                <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDate(comp.sale_date)}</td>
                <td style={{ padding: '11px 14px' }}>
                  {comp.sale_type ? <span className="cl-badge cl-badge-blue" style={{ fontSize: 10 }}>{comp.sale_type}</span> : '—'}
                </td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comp.buyer || '—'}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comp.seller || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {fmt(total)}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="cl-btn cl-btn-secondary cl-btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <button className="cl-btn cl-btn-secondary cl-btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}

      <SlideDrawer
        open={!!selectedId}
        onClose={() => { setSelectedId(null); setSelectedComp(null); }}
        title={selectedComp?.address || 'Sale Comp'}
        subtitle={[selectedComp?.city, selectedComp?.sale_date ? fmtDate(selectedComp.sale_date) : null].filter(Boolean).join(' · ')}
        badge={{ label: 'Sale Comp', color: 'green' }}
      >
        {selectedComp && <SaleCompDetail comp={selectedComp} />}
      </SlideDrawer>
    </div>
  );
}

function SaleCompDetail({ comp }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
        {[
          { label: 'SALE PRICE', value: fmtM(comp.sale_price) },
          { label: '$/SF',       value: comp.price_psf ? `$${Number(comp.price_psf).toFixed(0)}/SF` : '—' },
          { label: 'CAP RATE',   value: comp.cap_rate ? `${Number(comp.cap_rate).toFixed(2)}%` : '—' },
          { label: 'BLDG SF',    value: comp.building_sf ? `${fmt(comp.building_sf)} SF` : '—' },
          { label: 'SALE DATE',  value: fmtDate(comp.sale_date) },
          { label: 'SALE TYPE',  value: comp.sale_type || '—' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'rgba(0,0,0,0.025)', borderRadius: 'var(--radius-md)', padding: '10px 12px', border: '1px solid var(--card-border)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="cl-card" style={{ padding: '14px 16px', marginBottom: 12 }}>
        <div className="cl-card-title" style={{ marginBottom: 10 }}>PROPERTY DETAILS</div>
        {[
          { label: 'Address',    value: comp.address },
          { label: 'City',       value: comp.city },
          { label: 'Submarket',  value: comp.submarket },
          { label: 'Land Acres', value: comp.land_acres ? `${Number(comp.land_acres).toFixed(2)} ac` : null },
          { label: 'Year Built', value: comp.year_built },
          { label: 'Clear Ht',   value: comp.clear_height ? `${comp.clear_height}'` : null },
        ].filter(r => r.value).map(row => (
          <div key={row.label} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)', width: 90, flexShrink: 0, paddingTop: 2 }}>
              {row.label.toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{row.value}</span>
          </div>
        ))}
      </div>

      <div className="cl-card" style={{ padding: '14px 16px', marginBottom: 12 }}>
        <div className="cl-card-title" style={{ marginBottom: 10 }}>PARTIES</div>
        {[
          { label: 'Buyer',  value: comp.buyer },
          { label: 'Seller', value: comp.seller },
        ].filter(r => r.value).map(row => (
          <div key={row.label} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)', width: 90, flexShrink: 0, paddingTop: 2 }}>
              {row.label.toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{row.value}</span>
          </div>
        ))}
      </div>

      {comp.notes && (
        <div className="cl-card" style={{ padding: '14px 16px' }}>
          <div className="cl-card-title" style={{ marginBottom: 8 }}>NOTES</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{comp.notes}</p>
        </div>
      )}
    </div>
  );
}
