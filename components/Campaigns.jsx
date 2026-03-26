'use client';
import { useState } from 'react';

const MOCK_CAMPAIGNS = [
  { id: 1, name: 'SGV Owner-User SLB Targets Q1', status: 'Active', type: 'Off-Market Outreach', targets: 34, contacted: 22, responses: 8, meetings: 2, created: 'Feb 3', lastActivity: 'Mar 24', color: 'green' },
  { id: 2, name: 'IE West WARN Displacement Leads', status: 'Active', type: 'WARN Intel Follow-Up', targets: 18, contacted: 11, responses: 4, meetings: 1, created: 'Mar 14', lastActivity: 'Mar 23', color: 'rust' },
  { id: 3, name: 'Institutional Buyer — 150K+ SF Pipeline', status: 'Active', type: 'Buyer Matching', targets: 12, contacted: 9, responses: 5, meetings: 3, created: 'Jan 20', lastActivity: 'Mar 22', color: 'blue' },
  { id: 4, name: 'Baldwin Park Lease Expiry 2025–2026', status: 'Draft', type: 'Lease Expiry Outreach', targets: 27, contacted: 0, responses: 0, meetings: 0, created: 'Mar 18', lastActivity: 'Mar 18', color: 'amber' },
  { id: 5, name: 'SGV Private Family Trusts — Long Hold', status: 'Draft', type: 'Off-Market Outreach', targets: 41, contacted: 0, responses: 0, meetings: 0, created: 'Mar 10', lastActivity: 'Mar 10', color: 'amber' },
  { id: 6, name: 'Q4 2024 — Fontana Vacancy Cold Outreach', status: 'Completed', type: 'Off-Market Outreach', targets: 29, contacted: 29, responses: 11, meetings: 4, created: 'Nov 5', lastActivity: 'Jan 15', color: 'blue' },
];

const STATUS_STYLE = {
  Active:    { bg: 'var(--green-bg)',  bdr: 'var(--green-bdr)',  color: 'var(--green)' },
  Draft:     { bg: 'var(--amber-bg)', bdr: 'var(--amber-bdr)', color: 'var(--amber)' },
  Completed: { bg: 'var(--bg2)',      bdr: 'var(--line)',       color: 'var(--ink4)' },
};

const FILTERS = ['All', 'Active', 'Draft', 'Completed'];

export default function Campaigns({ onNavigate }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  const filtered = activeFilter === 'All' ? MOCK_CAMPAIGNS : MOCK_CAMPAIGNS.filter(c => c.status === activeFilter);

  if (selected) {
    return <CampaignDetail campaign={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <span style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 500 }}>Campaigns</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={S.btnBlue} onClick={() => alert('New Campaign — coming soon')}>+ New Campaign</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={S.pageWrap}>
          {/* PAGE HEADER */}
          <div style={S.pageHeader}>
            <div>
              <div style={S.pageTitle}>Cam<em style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', color: 'var(--blue2)', fontSize: 36, fontWeight: 400 }}>paigns</em></div>
              <div style={S.pageSub}>Research & outreach campaigns — {MOCK_CAMPAIGNS.filter(c => c.status === 'Active').length} active · {MOCK_CAMPAIGNS.filter(c => c.status === 'Draft').length} draft</div>
            </div>
          </div>

          {/* KPI STRIP */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Active Campaigns', val: MOCK_CAMPAIGNS.filter(c => c.status === 'Active').length, color: 'var(--green)' },
              { label: 'Total Targets', val: MOCK_CAMPAIGNS.reduce((s, c) => s + c.targets, 0), color: 'var(--ink)' },
              { label: 'Contacts Made', val: MOCK_CAMPAIGNS.reduce((s, c) => s + c.contacted, 0), color: 'var(--blue)' },
              { label: 'Meetings Scheduled', val: MOCK_CAMPAIGNS.reduce((s, c) => s + c.meetings, 0), color: 'var(--amber)' },
            ].map((k, i) => (
              <div key={i} style={S.kpiCard}>
                <div style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* FILTER TABS */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 16 }}>
            {FILTERS.map(f => (
              <div key={f} style={{ ...S.tab, ...(activeFilter === f ? S.tabActive : {}) }} onClick={() => setActiveFilter(f)}>{f}</div>
            ))}
          </div>

          {/* CAMPAIGN LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(c => {
              const ss = STATUS_STYLE[c.status];
              const pct = c.targets > 0 ? Math.round(c.contacted / c.targets * 100) : 0;
              return (
                <div key={c.id} style={S.card} onClick={() => setSelected(c)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 600, border: `1px solid ${ss.bdr}`, background: ss.bg, color: ss.color }}>{c.status}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--ink4)' }}>{c.type}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink2)', marginBottom: 8 }}>{c.name}</div>
                      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        {[
                          { lbl: 'Targets', val: c.targets },
                          { lbl: 'Contacted', val: `${c.contacted} (${pct}%)` },
                          { lbl: 'Responses', val: c.responses },
                          { lbl: 'Meetings', val: c.meetings },
                          { lbl: 'Created', val: c.created },
                          { lbl: 'Last Activity', val: c.lastActivity },
                        ].map((m, i) => (
                          <div key={i}>
                            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: 2 }}>{m.lbl}</div>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: 'var(--ink2)' }}>{m.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: 120, flexShrink: 0 }}>
                      <div style={{ fontSize: 10, color: 'var(--ink4)', marginBottom: 4, textAlign: 'right' }}>{pct}% contacted</div>
                      <div style={{ height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: `var(--${c.color})`, borderRadius: 3, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignDetail({ campaign: c, onBack }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const TABS = ['Overview', 'Targets', 'Activity'];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={S.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ cursor: 'pointer', color: 'var(--ink4)' }} onClick={onBack}>Campaigns</span>
          <span style={{ opacity: .4 }}>›</span>
          <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>{c.name}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={S.btnGhost} onClick={() => alert('Edit Campaign — coming soon')}>⚙ Edit</button>
          <button style={S.btnBlue} onClick={() => alert('Add Targets — coming soon')}>+ Add Targets</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={S.pageWrap}>
          <div style={S.pageHeader}>
            <div style={S.pageTitle}>{c.name}</div>
            <div style={S.pageSub}>{c.type} · Created {c.created}</div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
            {TABS.map(t => (
              <div key={t} style={{ ...S.tab, ...(activeTab === t ? S.tabActive : {}) }} onClick={() => setActiveTab(t)}>{t}</div>
            ))}
          </div>
          {activeTab === 'Overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[
                { lbl: 'Targets', val: c.targets },
                { lbl: 'Contacted', val: c.contacted },
                { lbl: 'Responses', val: c.responses },
                { lbl: 'Meetings', val: c.meetings },
              ].map((k, i) => (
                <div key={i} style={S.kpiCard}>
                  <div style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{k.lbl}</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{k.val}</div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'Targets' && (
            <div style={{ background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', padding: '20px', textAlign: 'center', fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: 'italic', color: 'var(--ink4)' }}>
              {c.targets} targets — target list view coming soon
            </div>
          )}
          {activeTab === 'Activity' && (
            <div style={{ background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', padding: '20px', textAlign: 'center', fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: 'italic', color: 'var(--ink4)' }}>
              Activity timeline — coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  topbar: { height: 48, background: 'var(--card)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 10, position: 'sticky', top: 0, zIndex: 5 },
  pageWrap: { maxWidth: 1400, minWidth: 900, margin: '0 auto', padding: '0 28px 60px' },
  pageHeader: { padding: '22px 0 12px' },
  pageTitle: { fontSize: 28, fontWeight: 300, color: 'var(--ink)', letterSpacing: '-0.02em' },
  pageSub: { fontFamily: "'Cormorant Garamond',serif", fontSize: 14, fontStyle: 'italic', color: 'var(--ink4)', marginTop: 4 },
  btnGhost: { display: 'inline-flex', alignItems: 'center', padding: '7px 13px', borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink3)', fontFamily: 'inherit' },
  btnBlue: { display: 'inline-flex', alignItems: 'center', padding: '7px 13px', borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--blue)', background: 'var(--blue)', color: '#fff', fontFamily: 'inherit' },
  kpiCard: { background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', padding: '16px 18px' },
  tab: { padding: '9px 14px', fontSize: 13.5, color: 'var(--ink4)', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap' },
  tabActive: { color: 'var(--blue)', borderBottomColor: 'var(--blue)', fontWeight: 500 },
  card: { background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', padding: '18px 20px', cursor: 'pointer', transition: 'box-shadow 0.12s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
};
