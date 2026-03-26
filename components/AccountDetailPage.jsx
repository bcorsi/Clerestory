'use client';
import { useState } from 'react';

const DEFAULT_ACCOUNT = {
  name: 'Leegin Creative Leather Products', type: 'Owner-User', location: 'Baldwin Park, CA',
  initial: 'L', tags: [{ label: 'SLB Target', color: 'green' }, { label: 'Lease Expiry 2027', color: 'amber' }],
  owner: 'Private', market: 'SGV · Mid Valley', primaryContact: 'Bob Rosenthall',
  relationshipSince: '2021', portfolioSF: '186,400 SF',
  notes: 'Key target — 10-yr lease expiry in 2027. Owner-user SLB candidate. Multiple CapEx permits filed Q1 2025.',
};

const MOCK_CONTACTS = [
  { id: 1, name: 'Bob Rosenthall', title: 'VP Real Estate', phone: '(626) 555-0142', email: 'bob.r@leegin.com', lastContact: 'Mar 18' },
  { id: 2, name: 'Sandra Kim', title: 'CFO', phone: '(626) 555-0198', email: 's.kim@leegin.com', lastContact: 'Feb 12' },
];

const MOCK_PROPERTIES = [
  { id: 1, address: '14022 Nelson Ave E', city: 'Baldwin Park', sf: '186,400 SF', estValue: '$48M', status: 'Occupied' },
];

const MOCK_DEALS = [
  { id: 1, name: 'Leegin SLB', stage: 'LOI', value: '$48M', type: 'Sale-Leaseback', color: 'blue' },
];

const MOCK_ACTIVITIES = [
  { id: 1, type: 'call', text: 'Called Bob Rosenthall — discussed SLB interest, requested BOV', date: 'Mar 18', user: 'BC' },
  { id: 2, type: 'email', text: 'Sent BOV summary and market comparables to Bob', date: 'Mar 15', user: 'BC' },
  { id: 3, type: 'note', text: 'Confirmed Leegin owns building free and clear — no debt. Key insight.', date: 'Mar 10', user: 'BC' },
  { id: 4, type: 'call', text: 'Initial outreach to CFO Sandra Kim — referred to Bob for RE decisions', date: 'Feb 12', user: 'BC' },
  { id: 5, type: 'note', text: 'CapEx permit pulled — $18M equipment expansion signals long-term occupancy intent', date: 'Feb 8', user: 'AI' },
];

const ACT_ICONS = { call: '📞', email: '✉', note: '📝', meeting: '🤝' };

const TABS = ['Overview', 'Contacts', 'Properties', 'Deals', 'Files'];

export default function AccountDetailPage({ account, onBack, onNavigate, onSelectContact, onSelectProperty, onSelectDeal }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const a = account ? { ...DEFAULT_ACCOUNT, ...account } : DEFAULT_ACCOUNT;

  const kpis = [
    { lbl: 'Properties', val: MOCK_PROPERTIES.length, color: 'var(--blue)' },
    { lbl: 'Active Deals', val: MOCK_DEALS.length, color: 'var(--green)' },
    { lbl: 'Total Deal Value', val: '$48M', color: 'var(--ink)' },
    { lbl: 'Key Contacts', val: MOCK_CONTACTS.length, color: 'var(--amber)' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ cursor: 'pointer', color: 'var(--ink4)' }} onClick={onBack}>Accounts</span>
          <span style={{ opacity: 0.4, margin: '0 2px' }}>›</span>
          <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>{a.name}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={S.btnGhost} onClick={() => alert('Add Contact — coming soon')}>+ Add Contact</button>
          <button style={S.btnGhost} onClick={() => alert('Add Deal — coming soon')}>+ Add Deal</button>
          <button style={S.btnGhost} onClick={() => alert('Add Note — coming soon')}>+ Note</button>
          <button style={S.btnGhost} onClick={() => alert('Edit — coming soon')}>Edit</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={S.pageWrap}>
          {/* HEADER CARD */}
          <div style={{ ...S.card, marginTop: 20, marginBottom: 16, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--blue-bg)', border: '1px solid var(--blue-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--blue)', fontFamily: "'Playfair Display',serif", flexShrink: 0 }}>
                {a.initial ?? a.name?.[0] ?? '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 4 }}>{a.name}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, fontStyle: 'italic', color: 'var(--ink4)', marginBottom: 8 }}>{a.type} · {a.location}</div>
                {a.tags && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {a.tags.map((t, i) => (
                      <span key={i} style={{ display: 'inline-flex', padding: '2px 9px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: `var(--${t.color}-bg)`, border: `1px solid var(--${t.color}-bdr)`, color: `var(--${t.color})` }}>{t.label}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KPI STRIP */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {kpis.map((k, i) => (
              <div key={i} style={S.kpiCard}>
                <div style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{k.lbl}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
            {TABS.map(t => (
              <div key={t} style={{ ...S.tabItem, ...(activeTab === t ? S.tabActive : {}) }} onClick={() => setActiveTab(t)}>{t}</div>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'Overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
              {/* Timeline */}
              <div style={S.card}>
                <div style={S.cardHdr}><span style={S.cardTitle}>Activity Timeline</span></div>
                <div style={{ padding: '4px 0' }}>
                  {MOCK_ACTIVITIES.map((a, i) => (
                    <div key={a.id} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: i < MOCK_ACTIVITIES.length - 1 ? '1px solid var(--line2)' : 'none' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{ACT_ICONS[a.type] ?? '•'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.4 }}>{a.text}</div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                          <span style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: "'DM Mono',monospace" }}>{a.date}</span>
                          <span style={{ fontSize: 11, color: 'var(--ink4)' }}>· {a.user}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Details Card */}
              <div style={S.card}>
                <div style={S.cardHdr}><span style={S.cardTitle}>Account Details</span></div>
                {[
                  { lbl: 'Owner Type', val: a.type },
                  { lbl: 'Market', val: a.market },
                  { lbl: 'Primary Contact', val: a.primaryContact },
                  { lbl: 'Relationship Since', val: a.relationshipSince },
                  { lbl: 'Portfolio SF', val: a.portfolioSF },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '1px solid var(--line2)' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink4)' }}>{r.lbl}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 500 }}>{r.val ?? '—'}</span>
                  </div>
                ))}
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13.5, fontStyle: 'italic', color: 'var(--ink3)', lineHeight: 1.55 }}>{a.notes}</div>
                </div>
              </div>
            </div>
          )}

          {/* CONTACTS TAB */}
          {activeTab === 'Contacts' && (
            <div style={S.tblWrap}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--line)' }}>
                    {['Name', 'Title', 'Phone', 'Email', 'Last Contact'].map(col => <th key={col} style={S.th}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CONTACTS.map((c, i) => (
                    <ContactRow key={c.id} contact={c} last={i === MOCK_CONTACTS.length - 1} onClick={() => onSelectContact?.(c)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PROPERTIES TAB */}
          {activeTab === 'Properties' && (
            <div style={S.tblWrap}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--line)' }}>
                    {['Address', 'City', 'SF', 'Est. Value', 'Status'].map(col => <th key={col} style={S.th}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PROPERTIES.map((p, i) => (
                    <PropertyRow key={p.id} prop={p} last={i === MOCK_PROPERTIES.length - 1} onClick={() => onSelectProperty?.(p)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DEALS TAB */}
          {activeTab === 'Deals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MOCK_DEALS.map(d => (
                <div key={d.id} style={{ ...S.card, padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => onSelectDeal?.(d)}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink2)', marginBottom: 3 }}>{d.name}</div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ fontSize: 12, color: 'var(--ink4)' }}>{d.type}</span>
                        <span style={{ fontSize: 12, color: 'var(--ink4)' }}>·</span>
                        <span style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 500 }}>{d.stage}</span>
                        <span style={{ fontSize: 12, color: 'var(--ink4)' }}>·</span>
                        <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, fontFamily: "'DM Mono',monospace" }}>{d.value}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FILES TAB */}
          {activeTab === 'Files' && (
            <div style={{ ...S.card, padding: '32px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: 'italic', color: 'var(--ink4)', marginBottom: 12 }}>No files attached yet</div>
              <button style={S.btnGhost} onClick={() => alert('Upload File — coming soon')}>+ Upload File</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactRow({ contact: c, last, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <tr style={{ borderBottom: last ? 'none' : '1px solid var(--line2)', background: hover ? 'var(--bg)' : '', cursor: 'pointer', transition: 'background 0.1s' }}
      onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <td style={S.td}><div style={{ fontWeight: 500, color: 'var(--ink2)' }}>{c.name}</div></td>
      <td style={{ ...S.td, color: 'var(--ink4)' }}>{c.title}</td>
      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{c.phone}</td>
      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{c.email}</td>
      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{c.lastContact}</td>
    </tr>
  );
}

function PropertyRow({ prop: p, last, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <tr style={{ borderBottom: last ? 'none' : '1px solid var(--line2)', background: hover ? 'var(--bg)' : '', cursor: 'pointer', transition: 'background 0.1s' }}
      onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <td style={S.td}><div style={{ fontWeight: 500, color: 'var(--ink2)' }}>{p.address}</div></td>
      <td style={{ ...S.td, color: 'var(--ink4)' }}>{p.city}</td>
      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace" }}>{p.sf}</td>
      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace", color: 'var(--green)', fontWeight: 600 }}>{p.estValue}</td>
      <td style={S.td}><span style={{ display: 'inline-flex', padding: '2px 7px', borderRadius: 4, fontSize: 10.5, background: 'var(--green-bg)', border: '1px solid var(--green-bdr)', color: 'var(--green)' }}>{p.status}</span></td>
    </tr>
  );
}

const S = {
  topbar: { height: 48, background: 'var(--card)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 10, position: 'sticky', top: 0, zIndex: 5 },
  pageWrap: { maxWidth: 1400, minWidth: 900, margin: '0 auto', padding: '0 28px 60px' },
  card: { background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--line)' },
  cardTitle: { fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink3)' },
  kpiCard: { background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  tabItem: { padding: '9px 14px', fontSize: 13.5, color: 'var(--ink4)', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap' },
  tabActive: { color: 'var(--blue)', borderBottomColor: 'var(--blue)', fontWeight: 500 },
  tblWrap: { background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  th: { padding: '9px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink4)', whiteSpace: 'nowrap', background: 'var(--bg2)', borderBottom: '1px solid var(--line)' },
  td: { padding: '10px 14px', fontSize: 13, color: 'var(--ink3)', verticalAlign: 'middle' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink3)', fontFamily: 'inherit' },
};
