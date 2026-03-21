'use client';

import { fmt } from '../lib/constants';

export default function SaleCompDetail({ comp: c, properties }) {
  const linkedProperty = properties?.find((p) => p.id === c.property_id) || null;

  const saleTypeColor = (type) => {
    const map = { 'Investment': 'tag-blue', 'Owner-User': 'tag-green', 'SLB': 'tag-amber', 'Portfolio': 'tag-purple', 'Distress': 'tag-red' };
    return map[type] || 'tag-ghost';
  };

  return (
    <div>
      {/* Header Card */}
      <div className="card mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>{c.address}</h2>
          <div style={{ color: 'var(--text-secondary)' }}>
            {c.city}{c.submarket ? ` · ${c.submarket}` : ''}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            {c.sale_type && <span className={`tag ${saleTypeColor(c.sale_type)}`}>{c.sale_type}</span>}
            {c.building_sf && <span className="tag tag-ghost">{fmt.sf(c.building_sf)}</span>}
            {c.sale_date && <span className="tag tag-ghost">{c.sale_date}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {c.sale_price && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px', fontSize: '11px' }}>Sale Price</div>
              <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: "'Playfair Display',serif", color: 'var(--blue)', letterSpacing: '-0.02em' }}>
                {fmt.price(c.sale_price)}
              </div>
            </div>
          )}
          {c.price_psf && (
            <div>
              <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px', fontSize: '11px' }}>Price / SF</div>
              <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                ${parseFloat(c.price_psf).toFixed(0)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="card mb-6">
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Transaction Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            ['Sale Date', c.sale_date],
            ['Sale Type', c.sale_type],
            ['Cap Rate', c.cap_rate ? `${parseFloat(c.cap_rate).toFixed(2)}%` : null],
            ['Building SF', c.building_sf ? fmt.sf(c.building_sf) : null],
            ['Land Acres', c.land_acres ? `${c.land_acres} ac` : null],
            ['Year Built', c.year_built],
            ['Clear Height', c.clear_height ? `${c.clear_height}'` : null],
            ['Zoning', c.zoning],
            ['Buyer', c.buyer],
            ['Seller', c.seller],
            ['Submarket', c.submarket],
            ['Market', c.market],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '14px', color: val ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 500 }}>{val || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Financials */}
      {(c.noi || c.in_place_rent_psf || c.occupancy) && (
        <div className="card mb-6">
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Financials at Sale</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              ['NOI', c.noi ? fmt.price(c.noi) : null],
              ['In-Place Rent', c.in_place_rent_psf ? `$${parseFloat(c.in_place_rent_psf).toFixed(2)}/SF` : null],
              ['Occupancy', c.occupancy ? `${c.occupancy}%` : null],
              ['GRM', c.grm ? c.grm.toFixed(1) + 'x' : null],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: val ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 500 }}>{val || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {c.notes && (
        <div className="card mb-6">
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Notes</h3>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.notes}</div>
        </div>
      )}
    </div>
  );
}
