'use client';
import SaleComps from './SaleComps.js';

const MOCK_SALE_COMPS = [
  { id: 1, address: '4900 Workman Mill Rd', city: 'Whittier', submarket: 'City of Industry', buyer: 'Pacific Mfg Group', seller: 'RJ Neu Properties', sf: 312000, price: 47500000, price_psf: 152, cap_rate: 4.8, sale_type: 'SLB', sale_date: '2024-10-15', clear_height: 34, dock_doors: 52, notes: 'Leaseback to Pacific Mfg. 12-yr NNN @ $0.89/SF.' },
  { id: 2, address: '14022 Nelson Ave E', city: 'Baldwin Park', submarket: 'City of Industry', buyer: 'Rexford Industrial', seller: 'Leegin Creative Leather', sf: 186400, price: 48000000, price_psf: 258, cap_rate: 5.1, sale_type: 'SLB', sale_date: '2024-12-01', clear_height: 32, dock_doors: 24, notes: 'SLB deal — Leegin leaseback 10yr NNN. Rexford core IE.' },
  { id: 3, address: '16830 Chestnut St', city: 'Fontana', submarket: 'Fontana', buyer: 'Cabot Industrial', seller: 'Teledyne Technologies', sf: 212000, price: 38200000, price_psf: 180, cap_rate: 5.4, sale_type: 'Investment', sale_date: '2025-01-20', clear_height: 30, dock_doors: 28, notes: 'Manufacturing sale. Teledyne consolidating to San Diego.' },
  { id: 4, address: '3200 E Guasti Rd', city: 'Ontario', submarket: 'Ontario Airport', buyer: 'Blackstone RE', seller: 'Local Family Trust', sf: 445000, price: 104000000, price_psf: 234, cap_rate: 4.6, sale_type: 'Portfolio', sale_date: '2024-08-10', clear_height: 40, dock_doors: 88, notes: 'Portfolio acquisition — 3 buildings. Blackstone value-add.' },
  { id: 5, address: '18421 Railroad St', city: 'City of Industry', submarket: 'City of Industry', buyer: 'Rexford Industrial', seller: 'Acromill LLC', sf: 98500, price: 22000000, price_psf: 223, cap_rate: 5.2, sale_type: 'Owner-User', sale_date: '2024-07-05', clear_height: 26, dock_doors: 14, notes: 'NOD-triggered sale. Acromill distress disposition.' },
  { id: 6, address: '12345 Arrow Hwy', city: 'Rancho Cucamonga', submarket: 'Rancho Cucamonga', buyer: 'EQT Exeter', seller: 'Private Seller', sf: 280000, price: 58000000, price_psf: 207, cap_rate: 5.0, sale_type: 'Investment', sale_date: '2024-05-22', clear_height: 36, dock_doors: 46, notes: 'Class A industrial park. Long-term tenant in place.' },
  { id: 7, address: '800 N Haven Ave', city: 'Ontario', submarket: 'Ontario Airport', buyer: 'LBA Realty', seller: 'CBRE IM', sf: 196000, price: 41500000, price_psf: 212, cap_rate: 4.9, sale_type: 'Investment', sale_date: '2025-02-10', clear_height: 32, dock_doors: 30, notes: 'CBRE IM fund rebalancing. All-cash buyer, fast close.' },
  { id: 8, address: '2500 S Milliken Ave', city: 'Ontario', submarket: 'Ontario Airport', buyer: 'Prologis', seller: 'Venture Steel', sf: 168000, price: 32500000, price_psf: 193, cap_rate: 5.3, sale_type: 'SLB', sale_date: '2024-09-14', clear_height: 28, dock_doors: 20, notes: 'Venture Steel SLB — 7yr leaseback. Prologis portfolio add.' },
];

export default function SaleCompsPage({ onNavigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <span style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 500 }}>Sale Comps</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={S.btnGhost} onClick={() => alert('Add Sale Comp — coming soon')}>+ Add Comp</button>
          <button style={S.btnGhost} onClick={() => alert('Export — coming soon')}>↓ Export</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={S.pageWrap}>
          {/* PAGE HEADER */}
          <div style={S.pageHeader}>
            <div>
              <div style={S.pageTitle}>Sale <em style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', color: 'var(--blue2)', fontSize: 36, fontWeight: 400 }}>Comps</em></div>
              <div style={S.pageSub}>SGV · IE · SoCal Industrial — {MOCK_SALE_COMPS.length} comps · Avg ${Math.round(MOCK_SALE_COMPS.reduce((s, c) => s + c.price_psf, 0) / MOCK_SALE_COMPS.length)}/SF</div>
            </div>
          </div>
          <SaleComps comps={MOCK_SALE_COMPS} onCompClick={c => alert(`${c.address} — sale comp detail`)} />
        </div>
      </div>
    </div>
  );
}

const S = {
  topbar: { height: 48, background: 'var(--card)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 10, position: 'sticky', top: 0, zIndex: 5 },
  pageWrap: { maxWidth: 1700, minWidth: 1000, margin: '0 auto', padding: '0 28px 60px' },
  pageHeader: { padding: '22px 0 16px' },
  pageTitle: { fontSize: 28, fontWeight: 300, color: 'var(--ink)', letterSpacing: '-0.02em' },
  pageSub: { fontFamily: "'Cormorant Garamond',serif", fontSize: 14, fontStyle: 'italic', color: 'var(--ink4)', marginTop: 4 },
  btnGhost: { display: 'inline-flex', alignItems: 'center', padding: '7px 13px', borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink3)', fontFamily: 'inherit' },
};
