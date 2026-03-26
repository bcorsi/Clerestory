'use client';
import OwnerSearch from './OwnerSearch.js';

const MOCK_PROPERTIES = [
  { id: 1, address: '14022 Nelson Ave E', city: 'Baldwin Park', owner: 'Leegin Creative Leather Inc.', tenant: 'Leegin Creative Leather' },
  { id: 2, address: '4900 Workman Mill Rd', city: 'Whittier', owner: 'RJ Neu Properties', tenant: 'Pacific Mfg Group' },
  { id: 3, address: '16830 Chestnut St', city: 'Fontana', owner: 'Teledyne Technologies', tenant: 'Teledyne' },
  { id: 4, address: '18421 Railroad St', city: 'City of Industry', owner: 'Acromill LLC', tenant: 'Acromill' },
  { id: 5, address: '16150 Stephens St', city: 'City of Industry', owner: 'Snak King Corp', tenant: 'Snak King Corp' },
];

const MOCK_LEADS = [
  { id: 1, lead_name: 'Leegin SLB Target', company: 'Leegin Creative Leather Products', city: 'Baldwin Park' },
  { id: 2, lead_name: 'Snak King CapEx', company: 'Snak King Corp', city: 'City of Industry' },
  { id: 3, lead_name: 'Teledyne Disposition', company: 'Teledyne Technologies', city: 'Fontana' },
];

export default function OwnerSearchPage({ onNavigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <div style={{ height: 48, background: 'var(--card)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 10, position: 'sticky', top: 0, zIndex: 5 }}>
        <span style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 500 }}>Owner Search</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        <OwnerSearch
          properties={MOCK_PROPERTIES}
          leads={MOCK_LEADS}
          onPropertyClick={() => {}}
          onLeadClick={() => {}}
          showToast={() => {}}
        />
      </div>
    </div>
  );
}
