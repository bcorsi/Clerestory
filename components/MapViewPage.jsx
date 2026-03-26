'use client';
import MapView from './MapView.js';

const MOCK_PROPERTIES = [
  { id: 1, address: '14022 Nelson Ave E', city: 'Baldwin Park', submarket: 'City of Industry', building_sf: 186400, owner: 'Leegin Creative Leather Inc.', tenant: 'Leegin Creative Leather', catalyst_tags: ['SLB Potential', 'Expiring Lease < 12 Mo'], ai_score: 95, vacancy_status: 'Occupied' },
  { id: 2, address: '4900 Workman Mill Rd', city: 'Whittier', submarket: 'City of Industry', building_sf: 312000, owner: 'RJ Neu Properties', tenant: 'Pacific Mfg Group', catalyst_tags: ['SLB Potential'], ai_score: 82, vacancy_status: 'Occupied' },
  { id: 3, address: '16830 Chestnut St', city: 'Fontana', submarket: 'Fontana', building_sf: 212000, owner: 'Teledyne Technologies', tenant: 'Teledyne', catalyst_tags: ['WARN Notice', 'Vacancy'], ai_score: 78, vacancy_status: 'Occupied' },
  { id: 4, address: '18421 Railroad St', city: 'City of Industry', submarket: 'City of Industry', building_sf: 98500, owner: 'Acromill LLC', tenant: 'Acromill', catalyst_tags: ['NOD Filed', 'Tax Delinquent'], ai_score: 88, vacancy_status: 'Occupied' },
];

const MOCK_LEADS = [
  { id: 1, lead_name: 'Leegin SLB Target', company: 'Leegin Creative Leather Products', city: 'Baldwin Park', ai_score: 95, catalyst_tags: ['SLB Potential', 'WARN Notice'] },
  { id: 2, lead_name: 'Snak King CapEx', company: 'Snak King Corp', city: 'City of Industry', ai_score: 72, catalyst_tags: ['Major CapEx Permit'] },
  { id: 3, lead_name: 'Teledyne Disposition', company: 'Teledyne Technologies', city: 'Fontana', ai_score: 78, catalyst_tags: ['WARN Notice'] },
];

const MOCK_DEALS = [
  { id: 1, name: 'RJ Neu SLB', address: '4900 Workman Mill Rd', city: 'Whittier', stage: 'LOI Accepted', price: 47500000 },
  { id: 2, name: 'Leegin SLB', address: '14022 Nelson Ave E', city: 'Baldwin Park', stage: 'LOI', price: 48000000 },
  { id: 3, name: 'Tarhong Sale', address: '780 Nogales St', city: 'City of Industry', stage: 'Underwriting', price: 24000000 },
];

export default function MapViewPage({ onNavigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <div style={{ height: 48, background: 'var(--card)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 10, position: 'sticky', top: 0, zIndex: 5 }}>
        <span style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 500 }}>Map View</span>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MapView
          properties={MOCK_PROPERTIES}
          leads={MOCK_LEADS}
          deals={MOCK_DEALS}
          onPropertyClick={() => {}}
          onLeadClick={() => {}}
          onDealClick={() => {}}
        />
      </div>
    </div>
  );
}
