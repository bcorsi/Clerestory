'use client';
import { useState } from 'react';

const DEFAULT_COMP = {
  address: '14250 Monte Vista Ave', city: 'Chino', market: 'IE West', submarket: 'Chino',
  sf: 48200, leasedSF: 48200, suite: 'Full Building',
  rate: 1.22, grossEquiv: 1.58, type: 'NNN', term: 36,
  startDate: 'Jan 2026', endDate: 'Jan 2029',
  freeRent: 2, ti: 18, bumps: '3%/yr', options: '1 × 3yr',
  tenant: 'Tenant A', landlord: 'Private Owner LLC',
  listingBroker: 'CBRE', tenantRep: 'JLL',
  source: 'Broker',
};

export default function LeaseCompDetail({ comp, onBack }) {
  const c = { ...DEFAULT_COMP, ...comp };
  const [notes, setNotes] = useState('');

  const SGV_AVG = 1.38;
  const IE_WEST_AVG = 1.18;
  const sgvSpread = (c.rate - SGV_AVG).toFixed(2);
  const ieSpread = (c.rate - IE_WEST_AVG).toFixed(2);

  // Net effective rent: base minus amortized TI and free rent
  const tiAmortized = c.ti / (c.term * 12 * c.rate) * c.rate;
  const freeRentAdj = (c.freeRent / c.term) * c.rate;
  const netEffective = (c.rate - tiAmortized - freeRentAdj).toFixed(2);

  const spread = (val, fmt) => {
    const n = parseFloat(val);
    const color = n > 0 ? 'var(--rust)' : 'var(--green)';
    return <span style={{ color, fontWeight: 600 }}>{n > 0 ? '+' : ''}{fmt ? fmt(val) : val}</span>;
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ cursor: 'pointer', color: 'var(--ink4)' }} onClick={onBack}>Lease Comps</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>{c.address}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={S.btnGhost} onClick={() => alert('Edit — coming soon')}>Edit</button>
          <button style={S.btnGhost} onClick={() => alert('Export — coming soon')}>Export</button>
          <button style={S.btnGhost} onClick={() => alert('Copy — coming soon')}>Copy</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={S.pageWrap}>
          {/* HEADER */}
          <div style={{ padding: '22px 0 16px' }}>
            <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>{c.address}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={S.badge}>{c.market}</span>
              <span style={S.badge}>{c.sf.toLocaleString()} SF</span>
              <span style={S.badge}>{c.date ?? c.startDate}</span>
              <span style={{ ...S.badge, background: 'var(--blue-bg)', borderColor: 'var(--blue-bdr)', color: 'var(--blue)' }}>${c.rate.toFixed(2)} NNN</span>
            </div>
          </div>

          {/* BODY 2-COL */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
            {/* LEFT — Lease Details */}
            <div style={S.card}>
              <div style={S.cardHdr}><span style={S.cardTitle}>Lease Details</span></div>
              {[
                { lbl: 'Address', val: c.address },
                { lbl: 'City', val: c.city },
                { lbl: 'Market', val: c.market },
                { lbl: 'Submarket', val: c.submarket },
                { lbl: 'Building SF', val: c.sf.toLocaleString() + ' SF' },
                { lbl: 'Leased SF', val: c.leasedSF.toLocaleString() + ' SF' },
                { lbl: 'Suite / Unit', val: c.suite },
                { lbl: 'Base Rate (NNN/SF/Mo)', val: '$' + c.rate.toFixed(2) },
                { lbl: 'Gross Equivalent Rate', val: '$' + c.grossEquiv.toFixed(2) },
                { lbl: 'Lease Type', val: c.type },
                { lbl: 'Term (months)', val: c.term + ' mo' },
                { lbl: 'Start Date', val: c.startDate },
                { lbl: 'End Date', val: c.endDate },
                { lbl: 'Free Rent (months)', val: c.freeRent + ' mo' },
                { lbl: 'TI Allowance ($/SF)', val: '$' + c.ti + '/SF' },
                { lbl: 'Annual Bumps %', val: c.bumps },
                { lbl: 'Options', val: c.options },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '1px solid var(--line2)', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--ink4)' }}>{r.lbl}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 500, fontFamily: r.lbl.includes('Rate') || r.lbl.includes('Term') || r.lbl.includes('SF') || r.lbl.includes('Date') || r.lbl.includes('months') || r.lbl.includes('Bumps') || r.lbl.includes('TI') ? "'DM Mono',monospace" : 'inherit' }}>{r.val ?? '—'}</span>
                </div>
              ))}
            </div>

            {/* RIGHT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Parties */}
              <div style={S.card}>
                <div style={S.cardHdr}><span style={S.cardTitle}>Parties</span></div>
                {[
                  { lbl: 'Tenant', val: c.tenant },
                  { lbl: 'Landlord', val: c.landlord },
                  { lbl: 'Listing Broker', val: c.listingBroker },
                  { lbl: 'Tenant Rep', val: c.tenantRep },
                  { lbl: 'Source', val: c.source },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '1px solid var(--line2)' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink4)' }}>{r.lbl}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 500 }}>{r.val ?? '—'}</span>
                  </div>
                ))}
              </div>

              {/* Analysis */}
              <div style={S.card}>
                <div style={S.cardHdr}><span style={S.cardTitle}>Analysis</span></div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink4)' }}>Net Effective Rent</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>${netEffective}/SF/Mo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink4)' }}>vs SGV avg ($1.38)</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13 }}>{spread(sgvSpread)}/SF/Mo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink4)' }}>vs IE West avg ($1.18)</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13 }}>{spread(ieSpread)}/SF/Mo</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes</div>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Add analysis notes…"
                      style={{ width: '100%', minHeight: 80, padding: '8px 10px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--bg)', fontSize: 13, fontFamily: 'inherit', color: 'var(--ink2)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <button style={{ ...S.btnBlue, marginTop: 8, width: '100%', justifyContent: 'center' }} onClick={() => alert('Note saved')}>Save Note</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  topbar: { height: 48, background: 'var(--card)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 10, position: 'sticky', top: 0, zIndex: 5 },
  pageWrap: { maxWidth: 1400, minWidth: 900, margin: '0 auto', padding: '0 28px 60px' },
  card: { background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--line)' },
  cardTitle: { fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink3)' },
  badge: { display: 'inline-flex', padding: '3px 9px', borderRadius: 5, fontSize: 12, border: '1px solid var(--line)', background: 'var(--bg2)', color: 'var(--ink3)' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink3)', fontFamily: 'inherit' },
  btnBlue: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--blue)', background: 'var(--blue)', color: '#fff', fontFamily: 'inherit' },
};
