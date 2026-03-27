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
          <button style={S.btnBlue} onClick={() => {}}>+ New Campaign</button>
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

function CampaignDetail({ campaign, onBack, onNavigate }) {
  const [tab, setTab] = useState('overview');
  const c = campaign;
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--line)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--ink4)', cursor: 'pointer', fontSize: 13 }}>← Campaigns</button>
          <span style={{ color: 'var(--ink4)' }}>›</span>
          <span style={{ fontSize: 13, color: 'var(--ink3)' }}>{c.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '6px 14px', border: '1px solid var(--line)', borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 13 }}>Edit</button>
          <button style={{ padding: '6px 14px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>+ Add Targets</button>
        </div>
      </div>
      <div style={{ padding: '32px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{c.name}</h1>
        <div style={{ fontFamily:"'DM Mono', monospace", fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--rust)', opacity:0.65, marginTop:2 }}>THE EDGE IS IN THE DATA</div>
        <div style={{ color: 'var(--ink4)', fontSize: 13, marginTop: 4, fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>{c.type} · Created {c.created}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '24px 0' }}>
          {[['TARGETS', c.targets], ['CONTACTED', c.contacted], ['RESPONSES', c.responses], ['RESPONSE RATE', c.contacted > 0 ? Math.round(c.responses / c.contacted * 100) + '%' : '—']].map(([label, value]) => (
            <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 10, padding: '20px 24px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: 'var(--ink)' }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', marginBottom: 24 }}>
          {['overview', 'targets', 'activity'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--blue)' : '2px solid transparent', cursor: 'pointer', fontSize: 13.5, fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--blue)' : 'var(--ink3)', textTransform: 'capitalize', marginBottom: -1 }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 10, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'var(--ink2)' }}>Campaign Details</h3>
              {[['Type', c.type], ['Market', c.market || 'SGV · IE West'], ['Status', c.status], ['Goal', c.goal || 'Generate qualified leads for industrial displacement deals']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line2)', fontSize: 13 }}>
                  <span style={{ color: 'var(--ink4)' }}>{k}</span>
                  <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 10, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'var(--ink2)' }}>Progress</h3>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink4)', marginBottom: 6 }}><span>Contacted</span><span>{c.contacted} / {c.targets}</span></div>
                <div style={{ height: 8, background: 'var(--bg2)', borderRadius: 4, overflow: 'hidden' }}><div style={{ height: '100%', background: 'var(--blue)', borderRadius: 4, width: `${Math.round(c.contacted / c.targets * 100)}%` }} /></div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink4)', marginBottom: 6 }}><span>Response Rate</span><span>{c.contacted > 0 ? Math.round(c.responses / c.contacted * 100) : 0}%</span></div>
                <div style={{ height: 8, background: 'var(--bg2)', borderRadius: 4, overflow: 'hidden' }}><div style={{ height: '100%', background: 'var(--green)', borderRadius: 4, width: `${c.contacted > 0 ? Math.round(c.responses / c.contacted * 100) : 0}%` }} /></div>
              </div>
            </div>
          </div>
        )}
        {tab === 'targets' && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg2)' }}>
                  {['Company / Address', 'Market', 'Last Contacted', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink4)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(c.targetList || [{ company: 'Sample Target Inc', market: 'IE West', lastContacted: 'Mar 10', status: 'Responded' }, { company: 'Pacific Logistics Co', market: 'SGV', lastContacted: 'Mar 12', status: 'No Response' }, { company: 'Western Mfg Group', market: 'IE East', lastContacted: '—', status: 'Not Contacted' }]).map((t, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--line2)', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--ink2)' }}>{t.company}</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ background: 'var(--blue-bg)', color: 'var(--blue)', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>{t.market}</span></td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink4)' }}>{t.lastContacted}</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: t.status === 'Responded' ? 'var(--green-bg)' : t.status === 'No Response' ? 'var(--rust-bg)' : 'var(--bg2)', color: t.status === 'Responded' ? 'var(--green)' : t.status === 'No Response' ? 'var(--rust)' : 'var(--ink4)' }}>{t.status}</span></td>
                    <td style={{ padding: '12px 16px' }}><div style={{ display: 'flex', gap: 6 }}>{['Call', 'Email', 'Note'].map(a => <button key={a} onClick={e => e.stopPropagation()} style={{ padding: '3px 8px', border: '1px solid var(--line)', borderRadius: 4, background: 'transparent', fontSize: 11, cursor: 'pointer', color: 'var(--ink3)' }}>{a}</button>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'activity' && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 10, padding: 24 }}>
            {[{ date: 'Mar 14', action: 'Campaign created', detail: '18 targets added from WARN Intel feed' }, { date: 'Mar 15', action: 'First outreach batch sent', detail: '11 contacts reached via email' }, { date: 'Mar 17', action: 'Response received', detail: 'Pacific Logistics Co — interested in relocation options' }, { date: 'Mar 20', action: 'Meeting scheduled', detail: 'Western Mfg Group — site tour Fri Mar 22' }].map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'var(--ink4)', whiteSpace: 'nowrap', paddingTop: 2, minWidth: 48 }}>{e.date}</div>
                <div style={{ flex: 1, paddingLeft: 16, borderLeft: '2px solid var(--line)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)', marginBottom: 2 }}>{e.action}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink4)' }}>{e.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
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
