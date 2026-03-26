'use client';
import LeaseComps from './LeaseComps.js';

const MOCK_LEASE_COMPS = [
  { id: 1, address: '14600 Slover Ave', city: 'Fontana', submarket: 'Fontana', tenant: 'XPO Logistics', rsf: 332000, rate: 0.88, gross_equiv: 1.02, lease_type: 'NNN', term_months: 60, start_date: '2024-06-01', clear_height: 36, dock_doors: 64, notes: 'Build-to-suit 2019 vintage. Premium logistics asset.' },
  { id: 2, address: '4800 Azusa Canyon Rd', city: 'Irwindale', submarket: 'City of Industry', tenant: 'Rexford (vacant)', rsf: 186400, rate: 1.05, gross_equiv: 1.20, lease_type: 'NNN', term_months: 36, start_date: '2024-09-01', clear_height: 32, dock_doors: 24, notes: 'Former Leegin facility. Now vacant, marketed by Rexford.' },
  { id: 3, address: '1900 S Azusa Ave', city: 'City of Industry', submarket: 'City of Industry', tenant: 'Global Freight Solutions', rsf: 245000, rate: 0.96, gross_equiv: 1.10, lease_type: 'NNN', term_months: 72, start_date: '2024-04-01', clear_height: 34, dock_doors: 40, notes: 'Multi-tenant park expansion. 3% annual bumps.' },
  { id: 4, address: '3800 Jurupa St', city: 'Ontario', submarket: 'Ontario Airport', tenant: 'Amazon', rsf: 490000, rate: 0.82, gross_equiv: 0.96, lease_type: 'NNN', term_months: 120, start_date: '2024-01-01', clear_height: 40, dock_doors: 98, notes: 'Institutional deal. Amazon last-mile FC, Class A.' },
  { id: 5, address: '780 Nogales St', city: 'City of Industry', submarket: 'City of Industry', tenant: 'Tarhong Industry', rsf: 165000, rate: 1.12, gross_equiv: 1.28, lease_type: 'NNN', term_months: 60, start_date: '2024-11-01', clear_height: 30, dock_doors: 18, notes: 'Owner-user building, new lease structure post-SLB.' },
  { id: 6, address: '9500 Archibald Ave', city: 'Rancho Cucamonga', submarket: 'Rancho Cucamonga', tenant: 'Niagara Water', rsf: 620000, rate: 0.74, gross_equiv: 0.88, lease_type: 'NNN', term_months: 84, start_date: '2023-08-01', clear_height: 40, dock_doors: 112, notes: 'Mega-distribution. Below-market rate, renewal coming.' },
  { id: 7, address: '2100 S Vineyard Ave', city: 'Ontario', submarket: 'Ontario Airport', tenant: 'Sysco Corporation', rsf: 344000, rate: 0.79, gross_equiv: 0.93, lease_type: 'NNN', term_months: 60, start_date: '2023-11-01', clear_height: 36, dock_doors: 58, notes: 'Food distribution, cold clear. Net rent below market.' },
  { id: 8, address: '16150 Stephens St', city: 'City of Industry', submarket: 'City of Industry', tenant: 'Snak King Corp', rsf: 212000, rate: 0.91, gross_equiv: 1.05, lease_type: 'NNN', term_months: 48, start_date: '2024-03-01', clear_height: 28, dock_doors: 22, notes: 'SLB candidate — CapEx permits filed Feb 2025.' },
  { id: 9, address: '1200 Azusa Ave', city: 'Baldwin Park', submarket: 'City of Industry', tenant: 'Pacific Supply Inc.', rsf: 142000, rate: 1.08, gross_equiv: 1.22, lease_type: 'NNN', term_months: 36, start_date: '2024-07-01', clear_height: 26, dock_doors: 16, notes: 'WARN-flagged tenant. Lease expiry risk.' },
  { id: 10, address: '4200 E Mission Blvd', city: 'Pomona', submarket: 'City of Industry', tenant: 'Western Cargo LLC', rsf: 98000, rate: 0.99, gross_equiv: 1.14, lease_type: 'NNN', term_months: 24, start_date: '2024-10-01', clear_height: 24, dock_doors: 12, notes: 'Short-term deal. Submarket pressure driving renewals.' },
];

export default function LeaseCompsPage({ onNavigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <span style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 500 }}>Lease Comps</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={S.btnGhost} onClick={() => alert('Add Lease Comp — coming soon')}>+ Add Comp</button>
          <button style={S.btnGhost} onClick={() => alert('Export — coming soon')}>↓ Export</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={S.pageWrap}>
          {/* PAGE HEADER */}
          <div style={S.pageHeader}>
            <div>
              <div style={S.pageTitle}>Lease <em style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', color: 'var(--blue2)', fontSize: 36, fontWeight: 400 }}>Comps</em></div>
              <div style={S.pageSub}>SGV · IE · SoCal Industrial — {MOCK_LEASE_COMPS.length} comps</div>
            </div>
          </div>
          <LeaseComps comps={MOCK_LEASE_COMPS} onCompClick={c => alert(`${c.address} — lease comp detail`)} />
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
