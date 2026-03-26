'use client';
import { useState, useMemo } from 'react';

const LEASE_DATA = [
  { id: 1, address: '14600 Slover Ave', city: 'Fontana', submarket: 'Fontana', tenant: 'XPO Logistics', rsf: 332000, rate: 0.88, leaseType: 'NNN', term: 60, startDate: '2024-06', clearHt: 36, dockDoors: 64 },
  { id: 2, address: '4800 Azusa Canyon Rd', city: 'Irwindale', submarket: 'City of Industry', tenant: 'Rexford (vacant)', rsf: 186400, rate: 1.05, leaseType: 'NNN', term: 36, startDate: '2024-09', clearHt: 32, dockDoors: 24 },
  { id: 3, address: '1900 S Azusa Ave', city: 'City of Industry', submarket: 'City of Industry', tenant: 'Global Freight Solutions', rsf: 245000, rate: 0.96, leaseType: 'NNN', term: 72, startDate: '2024-04', clearHt: 34, dockDoors: 40 },
  { id: 4, address: '3800 Jurupa St', city: 'Ontario', submarket: 'Ontario Airport', tenant: 'Amazon', rsf: 490000, rate: 0.82, leaseType: 'NNN', term: 120, startDate: '2024-01', clearHt: 40, dockDoors: 98 },
  { id: 5, address: '780 Nogales St', city: 'City of Industry', submarket: 'City of Industry', tenant: 'Tarhong Industry', rsf: 165000, rate: 1.12, leaseType: 'NNN', term: 60, startDate: '2024-11', clearHt: 30, dockDoors: 18 },
  { id: 6, address: '9500 Archibald Ave', city: 'Rancho Cucamonga', submarket: 'Rancho Cucamonga', tenant: 'Niagara Water', rsf: 620000, rate: 0.74, leaseType: 'NNN', term: 84, startDate: '2023-08', clearHt: 40, dockDoors: 112 },
  { id: 7, address: '2100 S Vineyard Ave', city: 'Ontario', submarket: 'Ontario Airport', tenant: 'Sysco Corporation', rsf: 344000, rate: 0.79, leaseType: 'NNN', term: 60, startDate: '2023-11', clearHt: 36, dockDoors: 58 },
  { id: 8, address: '16150 Stephens St', city: 'City of Industry', submarket: 'City of Industry', tenant: 'Snak King Corp', rsf: 212000, rate: 0.91, leaseType: 'NNN', term: 48, startDate: '2024-03', clearHt: 28, dockDoors: 22 },
];

const SALE_DATA = [
  { id: 1, address: '4900 Workman Mill Rd', city: 'Whittier', submarket: 'City of Industry', buyer: 'Pacific Mfg Group', seller: 'RJ Neu Properties', sf: 312000, price: 47500000, psf: 152, capRate: 4.8, saleType: 'SLB', saleDate: '2024-10', dockDoors: 52 },
  { id: 2, address: '14022 Nelson Ave E', city: 'Baldwin Park', submarket: 'City of Industry', buyer: 'Rexford Industrial', seller: 'Leegin Creative Leather', sf: 186400, price: 48000000, psf: 258, capRate: 5.1, saleType: 'SLB', saleDate: '2024-12', dockDoors: 24 },
  { id: 3, address: '16830 Chestnut St', city: 'Fontana', submarket: 'Fontana', buyer: 'Cabot Industrial', seller: 'Teledyne Technologies', sf: 212000, price: 38200000, psf: 180, capRate: 5.4, saleType: 'Investment', saleDate: '2025-01', dockDoors: 28 },
  { id: 4, address: '3200 E Guasti Rd', city: 'Ontario', submarket: 'Ontario Airport', buyer: 'Blackstone RE', seller: 'Local Family Trust', sf: 445000, price: 104000000, psf: 234, capRate: 4.6, saleType: 'Portfolio', saleDate: '2024-08', dockDoors: 88 },
  { id: 5, address: '18421 Railroad St', city: 'City of Industry', submarket: 'City of Industry', buyer: 'Rexford Industrial', seller: 'Acromill LLC', sf: 98500, price: 22000000, psf: 223, capRate: 5.2, saleType: 'Owner-User', saleDate: '2024-07', dockDoors: 14 },
  { id: 6, address: '12345 Arrow Hwy', city: 'Rancho Cucamonga', submarket: 'Rancho Cucamonga', buyer: 'EQT Exeter', seller: 'Private Seller', sf: 280000, price: 58000000, psf: 207, capRate: 5.0, saleType: 'Investment', saleDate: '2024-05', dockDoors: 46 },
  { id: 7, address: '800 N Haven Ave', city: 'Ontario', submarket: 'Ontario Airport', buyer: 'LBA Realty', seller: 'CBRE IM', sf: 196000, price: 41500000, psf: 212, capRate: 4.9, saleType: 'Investment', saleDate: '2025-02', dockDoors: 30 },
];

const ALL_SUBMARKETS = ['City of Industry', 'Fontana', 'Ontario Airport', 'Rancho Cucamonga', 'IE West'];
const SF_RANGES = [
  { label: 'All Sizes', min: 0, max: Infinity },
  { label: '< 100K SF', min: 0, max: 100000 },
  { label: '100K–250K SF', min: 100000, max: 250000 },
  { label: '250K–500K SF', min: 250000, max: 500000 },
  { label: '500K+ SF', min: 500000, max: Infinity },
];

const fmt = {
  sf: n => n ? n.toLocaleString() + ' SF' : '—',
  price: n => n ? '$' + (n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n.toLocaleString()) : '—',
  psf: n => n ? '$' + n + '/SF' : '—',
  rate: n => n ? '$' + n.toFixed(2) + '/SF/Mo' : '—',
  pct: n => n ? n.toFixed(1) + '%' : '—',
};

export default function CompAnalytics({ onNavigate }) {
  const [mode, setMode] = useState('lease'); // lease | sale
  const [submarket, setSubmarket] = useState('');
  const [sfRange, setSfRange] = useState(0);
  const [sortCol, setSortCol] = useState('');
  const [sortDir, setSortDir] = useState('desc');

  const range = SF_RANGES[sfRange];

  const leaseFiltered = useMemo(() => {
    let list = [...LEASE_DATA];
    if (submarket) list = list.filter(c => c.submarket === submarket);
    list = list.filter(c => c.rsf >= range.min && c.rsf < range.max);
    if (sortCol) list.sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (av == null) return 1; if (bv == null) return -1;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [submarket, sfRange, sortCol, sortDir]);

  const saleFiltered = useMemo(() => {
    let list = [...SALE_DATA];
    if (submarket) list = list.filter(c => c.submarket === submarket);
    list = list.filter(c => c.sf >= range.min && c.sf < range.max);
    if (sortCol) list.sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (av == null) return 1; if (bv == null) return -1;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [submarket, sfRange, sortCol, sortDir]);

  const activeData = mode === 'lease' ? leaseFiltered : saleFiltered;

  // KPIs
  const leaseKPIs = useMemo(() => {
    if (!leaseFiltered.length) return null;
    const avgRate = leaseFiltered.reduce((s, c) => s + c.rate, 0) / leaseFiltered.length;
    const avgSF = leaseFiltered.reduce((s, c) => s + c.rsf, 0) / leaseFiltered.length;
    const avgDH = leaseFiltered.reduce((s, c) => s + c.dockDoors, 0) / leaseFiltered.length;
    return { avgRate: avgRate.toFixed(2), avgSF: Math.round(avgSF), avgDH: Math.round(avgDH), count: leaseFiltered.length };
  }, [leaseFiltered]);

  const saleKPIs = useMemo(() => {
    if (!saleFiltered.length) return null;
    const avgPSF = saleFiltered.reduce((s, c) => s + c.psf, 0) / saleFiltered.length;
    const avgCap = saleFiltered.reduce((s, c) => s + c.capRate, 0) / saleFiltered.length;
    const avgSF = saleFiltered.reduce((s, c) => s + c.sf, 0) / saleFiltered.length;
    return { avgPSF: Math.round(avgPSF), avgCap: avgCap.toFixed(1), avgSF: Math.round(avgSF), count: saleFiltered.length };
  }, [saleFiltered]);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };
  const si = col => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <span style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 500 }}>Comp Analytics</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={S.btnGhost} onClick={() => alert('Export — coming soon')}>↓ Export</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={S.pageWrap}>
          {/* PAGE HEADER */}
          <div style={S.pageHeader}>
            <div>
              <div style={S.pageTitle}>Comp <em style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', color: 'var(--blue2)', fontSize: 36, fontWeight: 400 }}>Analytics</em></div>
              <div style={S.pageSub}>Interactive market comps — SGV · IE Industrial</div>
            </div>
          </div>

          {/* TOGGLE + FILTERS */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Mode toggle */}
            <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)' }}>
              {['lease', 'sale'].map(m => (
                <button key={m} style={{ padding: '7px 16px', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: mode === m ? 'var(--blue)' : 'var(--card)', color: mode === m ? '#fff' : 'var(--ink3)' }}
                  onClick={() => { setMode(m); setSortCol(''); }}>
                  {m === 'lease' ? 'Lease Comps' : 'Sale Comps'}
                </button>
              ))}
            </div>
            <select style={S.select} value={submarket} onChange={e => setSubmarket(e.target.value)}>
              <option value="">All Submarkets</option>
              {ALL_SUBMARKETS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select style={S.select} value={sfRange} onChange={e => setSfRange(Number(e.target.value))}>
              {SF_RANGES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
            </select>
            <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono',monospace", fontSize: 12, color: 'var(--ink4)' }}>{activeData.length} comps</span>
          </div>

          {/* KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {mode === 'lease' && leaseKPIs ? [
              { lbl: 'Avg NNN Rate', val: '$' + leaseKPIs.avgRate + '/SF/Mo', color: 'var(--blue)' },
              { lbl: 'Avg RSF', val: leaseKPIs.avgSF.toLocaleString() + ' SF', color: 'var(--ink)' },
              { lbl: 'Avg DH Doors', val: leaseKPIs.avgDH, color: 'var(--ink)' },
              { lbl: 'Comps Shown', val: leaseKPIs.count, color: 'var(--green)' },
            ].map((k, i) => (
              <div key={i} style={S.kpiCard}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: 6 }}>{k.lbl}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.val}</div>
              </div>
            )) : null}
            {mode === 'sale' && saleKPIs ? [
              { lbl: 'Avg Price/SF', val: '$' + saleKPIs.avgPSF + '/SF', color: 'var(--blue)' },
              { lbl: 'Avg Cap Rate', val: saleKPIs.avgCap + '%', color: 'var(--amber)' },
              { lbl: 'Avg SF', val: saleKPIs.avgSF.toLocaleString() + ' SF', color: 'var(--ink)' },
              { lbl: 'Comps Shown', val: saleKPIs.count, color: 'var(--green)' },
            ].map((k, i) => (
              <div key={i} style={S.kpiCard}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: 6 }}>{k.lbl}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.val}</div>
              </div>
            )) : null}
          </div>

          {/* TABLE */}
          <div style={S.tblWrap}>
            {mode === 'lease' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {[['address','Address'],['submarket','Submarket'],['tenant','Tenant'],['rsf','RSF'],['rate','Rate/SF/Mo'],['leaseType','Type'],['term','Term (Mo)'],['clearHt',"Clear Ht"],['dockDoors','DH Doors'],['startDate','Start']].map(([col, lbl]) => (
                      <th key={col} style={S.th} onClick={() => toggleSort(col)}>{lbl}{si(col)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaseFiltered.map(c => (
                    <tr key={c.id} style={S.tr}>
                      <td style={S.td}><div style={{ fontWeight: 500, color: 'var(--ink2)' }}>{c.address}</div><div style={{ fontSize: 11, color: 'var(--ink4)' }}>{c.city}</div></td>
                      <td style={S.td}><span style={S.subBadge}>{c.submarket}</span></td>
                      <td style={S.td}>{c.tenant}</td>
                      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace" }}>{fmt.sf(c.rsf)}</td>
                      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace", color: 'var(--blue)', fontWeight: 600 }}>{fmt.rate(c.rate)}</td>
                      <td style={S.td}><span style={S.typeBadge}>{c.leaseType}</span></td>
                      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace" }}>{c.term} mo</td>
                      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace" }}>{c.clearHt}'</td>
                      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace" }}>{c.dockDoors}</td>
                      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{c.startDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {[['address','Address'],['submarket','Submarket'],['buyer','Buyer'],['seller','Seller'],['sf','SF'],['price','Price'],['psf','$/SF'],['capRate','Cap Rate'],['saleType','Type'],['saleDate','Date']].map(([col, lbl]) => (
                      <th key={col} style={S.th} onClick={() => toggleSort(col)}>{lbl}{si(col)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {saleFiltered.map(c => (
                    <tr key={c.id} style={S.tr}>
                      <td style={S.td}><div style={{ fontWeight: 500, color: 'var(--ink2)' }}>{c.address}</div><div style={{ fontSize: 11, color: 'var(--ink4)' }}>{c.city}</div></td>
                      <td style={S.td}><span style={S.subBadge}>{c.submarket}</span></td>
                      <td style={S.td}>{c.buyer}</td>
                      <td style={S.td}>{c.seller}</td>
                      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace" }}>{fmt.sf(c.sf)}</td>
                      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace", color: 'var(--green)', fontWeight: 600 }}>{fmt.price(c.price)}</td>
                      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace", color: 'var(--blue)', fontWeight: 600 }}>{fmt.psf(c.psf)}</td>
                      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace" }}>{fmt.pct(c.capRate)}</td>
                      <td style={S.td}><span style={S.typeBadge}>{c.saleType}</span></td>
                      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{c.saleDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  topbar: { height: 48, background: 'var(--card)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 10, position: 'sticky', top: 0, zIndex: 5 },
  pageWrap: { maxWidth: 1700, minWidth: 900, margin: '0 auto', padding: '0 28px 60px' },
  pageHeader: { padding: '22px 0 12px' },
  pageTitle: { fontSize: 28, fontWeight: 300, color: 'var(--ink)', letterSpacing: '-0.02em' },
  pageSub: { fontFamily: "'Cormorant Garamond',serif", fontSize: 14, fontStyle: 'italic', color: 'var(--ink4)', marginTop: 4 },
  btnGhost: { display: 'inline-flex', alignItems: 'center', padding: '7px 13px', borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink3)', fontFamily: 'inherit' },
  select: { padding: '7px 12px', borderRadius: 7, fontSize: 12.5, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink2)', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' },
  kpiCard: { background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  tblWrap: { background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', overflow: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink3)', borderBottom: '1px solid var(--line)', background: 'var(--bg2)', cursor: 'pointer', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid var(--line2)' },
  td: { padding: '11px 12px', fontSize: 13, color: 'var(--ink3)', verticalAlign: 'middle' },
  subBadge: { display: 'inline-flex', padding: '2px 7px', borderRadius: 4, fontSize: 10.5, background: 'var(--blue-bg)', border: '1px solid var(--blue-bdr)', color: 'var(--blue)', fontWeight: 500 },
  typeBadge: { display: 'inline-flex', padding: '2px 7px', borderRadius: 4, fontSize: 10.5, background: 'var(--bg2)', border: '1px solid var(--line)', color: 'var(--ink4)' },
};
