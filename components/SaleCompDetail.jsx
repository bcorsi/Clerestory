'use client';
import { useState } from 'react';

const DEFAULT_COMP = {
  address: '14500 Nelson Ave', city: 'Baldwin Park', market: 'SGV', submarket: 'Mid Valley',
  sf: 186400, landSF: 357000, landAC: 8.2,
  price: 48200000, psf: 258, psfLand: 135,
  capRate: 5.2, noi: 2506400, occupancy: 100, tenants: 1,
  buyer: 'Rexford Industrial REIT', buyerType: 'Institutional REIT',
  seller: 'Private Owner LLC', sellerType: 'Private',
  closeDate: 'Feb 2026', marketingPeriod: '45 days',
  financing: 'New Debt (DSCR 1.28)',
  source: 'Broker', verifiedBy: 'B. Corso', dateAdded: 'Mar 2026',
};

export default function SaleCompDetail({ comp, onBack }) {
  const c = { ...DEFAULT_COMP, ...comp };
  const [notes, setNotes] = useState('');

  const IE_REPLACEMENT = 295;
  const SGV_REPLACEMENT = 320;
  const replacementCost = c.market === 'SGV' ? SGV_REPLACEMENT : IE_REPLACEMENT;
  const replacementSpread = c.psf - replacementCost;
  const AVG_CAP = 5.4;
  const capSpread = (c.capRate - AVG_CAP).toFixed(2);
  const coverage = c.sf && c.landSF ? (c.sf / c.landSF * 100).toFixed(1) : '—';

  const fmt = {
    price: n => n >= 1000000 ? '$' + (n / 1000000).toFixed(2) + 'M' : '$' + n.toLocaleString(),
    sf: n => n.toLocaleString() + ' SF',
    pct: n => n + '%',
  };

  const spreadLabel = (val) => {
    const n = parseFloat(val);
    const color = n > 0 ? 'var(--rust)' : 'var(--green)';
    const sign = n > 0 ? '+' : '';
    return <span style={{ color, fontWeight: 600 }}>{sign}{val}</span>;
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ cursor: 'pointer', color: 'var(--ink4)' }} onClick={onBack}>Sale Comps</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>{c.address}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={S.btnGhost} onClick={() => alert('Edit — coming soon')}>Edit</button>
          <button style={S.btnGhost} onClick={() => alert('Export — coming soon')}>Export</button>
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
              <span style={S.badge}>{c.closeDate}</span>
              <span style={{ ...S.badge, background: 'var(--green-bg)', borderColor: 'var(--green-bdr)', color: 'var(--green)' }}>{fmt.price(c.price)}</span>
              <span style={{ ...S.badge, background: 'var(--blue-bg)', borderColor: 'var(--blue-bdr)', color: 'var(--blue)' }}>${c.psf}/SF</span>
              <span style={{ ...S.badge, background: 'var(--amber-bg)', borderColor: 'var(--amber-bdr)', color: 'var(--amber)' }}>{c.capRate}% Cap</span>
            </div>
          </div>

          {/* BODY 2-COL */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
            {/* LEFT — Sale Details */}
            <div style={S.card}>
              <div style={S.cardHdr}><span style={S.cardTitle}>Sale Details</span></div>
              {[
                { lbl: 'Address', val: c.address },
                { lbl: 'City', val: c.city },
                { lbl: 'Market', val: c.market },
                { lbl: 'Submarket', val: c.submarket },
                { lbl: 'Building SF', val: fmt.sf(c.sf) },
                { lbl: 'Land SF', val: fmt.sf(c.landSF) },
                { lbl: 'Land AC', val: c.landAC + ' AC' },
                { lbl: 'Sale Price', val: fmt.price(c.price) },
                { lbl: '$/SF', val: '$' + c.psf + '/SF' },
                { lbl: '$/Land SF', val: '$' + c.psfLand + '/Land SF' },
                { lbl: 'Cap Rate', val: c.capRate + '%' },
                { lbl: 'NOI at Sale', val: fmt.price(c.noi) + '/yr' },
                { lbl: 'Occupancy at Sale', val: c.occupancy + '%' },
                { lbl: '# Tenants', val: c.tenants },
                { lbl: 'Buyer Name', val: c.buyer },
                { lbl: 'Buyer Type', val: c.buyerType },
                { lbl: 'Seller Name', val: c.seller },
                { lbl: 'Seller Type', val: c.sellerType },
                { lbl: 'Close Date', val: c.closeDate },
                { lbl: 'Marketing Period', val: c.marketingPeriod },
                { lbl: 'Financing Type', val: c.financing },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '1px solid var(--line2)', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--ink4)' }}>{r.lbl}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 500 }}>{r.val ?? '—'}</span>
                </div>
              ))}
            </div>

            {/* RIGHT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Analysis */}
              <div style={S.card}>
                <div style={S.cardHdr}><span style={S.cardTitle}>Analysis</span></div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink4)' }}>Coverage Ratio</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 600 }}>{coverage}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink4)' }}>vs Replacement Cost</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13 }}>
                      {spreadLabel(replacementSpread > 0 ? '+$' + replacementSpread : '-$' + Math.abs(replacementSpread))}
                      /SF<br /><span style={{ fontSize: 10, color: 'var(--ink4)' }}>(~${replacementCost}/SF est.)</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink4)' }}>vs Avg Cap (5.4%)</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13 }}>{spreadLabel(capSpread)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink4)' }}>$/SF vs Market Avg</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13 }}>
                      {c.psf > 268 ? <span style={{ color: 'var(--rust)', fontWeight: 600 }}>+${c.psf - 268} above avg</span> : <span style={{ color: 'var(--green)', fontWeight: 600 }}>${268 - c.psf} below avg</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div style={S.card}>
                <div style={S.cardHdr}><span style={S.cardTitle}>Notes</span></div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add notes…"
                    style={{ width: '100%', minHeight: 80, padding: '8px 10px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--bg)', fontSize: 13, fontFamily: 'inherit', color: 'var(--ink2)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                  />
                  {[
                    { lbl: 'Source', val: c.source },
                    { lbl: 'Verified by', val: c.verifiedBy },
                    { lbl: 'Date Added', val: c.dateAdded },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--ink4)' }}>{r.lbl}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{r.val ?? '—'}</span>
                    </div>
                  ))}
                  <button style={{ ...S.btnBlue, marginTop: 4, width: '100%', justifyContent: 'center' }} onClick={() => alert('Saved')}>Save Note</button>
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
