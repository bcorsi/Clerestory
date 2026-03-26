'use client';
import { useState } from 'react';

const DEFAULT_CONTACT = {
  name: 'Bob Rosenthall', title: 'VP Real Estate', company: 'Leegin Creative Leather',
  type: 'Decision Maker', phone: '(626) 555-0142', email: 'bob.r@leegin.com',
  linkedin: 'linkedin.com/in/bobrosenthall', lastContact: 'Mar 18', contactSince: '2021',
};

const MOCK_ACTIVITIES = [
  { id: 1, type: 'call', text: 'Called Bob — discussed SLB interest, he requested BOV to share with CFO', date: 'Mar 18', user: 'BC' },
  { id: 2, type: 'email', text: 'Sent BOV summary and market comparables (14 pages)', date: 'Mar 15', user: 'BC' },
  { id: 3, type: 'note', text: 'Confirmed Leegin owns building free and clear. Motivated seller if price is right.', date: 'Mar 10', user: 'BC' },
  { id: 4, type: 'meeting', text: 'Initial meeting at Leegin office — toured facility, intro to ops team', date: 'Feb 28', user: 'BC' },
  { id: 5, type: 'call', text: 'Warm intro call via broker network. Bob open to conversation.', date: 'Feb 12', user: 'BC' },
];

const LINKED_DEALS = [
  { id: 1, name: 'Leegin SLB', stage: 'LOI', color: 'var(--green)' },
];
const LINKED_PROPERTIES = [
  { id: 1, name: '14022 Nelson Ave E, Baldwin Park', color: 'var(--blue)' },
];
const LINKED_LEADS = [
  { id: 1, name: 'Leegin Creative Leather — SLB Target', color: 'var(--amber)' },
];

const ACT_ICONS = { call: '📞', email: '✉', note: '📝', meeting: '🤝' };
const TABS = ['Timeline', 'Deals', 'Properties', 'Leads', 'Files'];

export default function ContactDetailPage({ contact, onBack, onNavigate, onSelectAccount, onSelectProperty, onSelectDeal }) {
  const [activeTab, setActiveTab] = useState('Timeline');
  const [notes, setNotes] = useState('');
  const c = contact ? { ...DEFAULT_CONTACT, ...contact } : DEFAULT_CONTACT;

  const initials = c.name ? c.name.split(' ').map(n => n[0]).slice(0, 2).join('') : '??';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ cursor: 'pointer', color: 'var(--ink4)' }} onClick={onBack}>Contacts</span>
          <span style={{ opacity: 0.4, margin: '0 2px' }}>›</span>
          <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>{c.name}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={S.btnGhost} onClick={() => alert('Log Call — coming soon')}>📞 Call</button>
          <button style={S.btnGhost} onClick={() => alert('Send Email — coming soon')}>✉ Email</button>
          <button style={S.btnGhost} onClick={() => alert('Add Note — coming soon')}>📝 Add Note</button>
          <button style={S.btnGhost} onClick={() => alert('Add Task — coming soon')}>+ Task</button>
          <button style={S.btnGhost} onClick={() => alert('Edit Contact — coming soon')}>Edit</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={S.pageWrap}>
          {/* HEADER CARD */}
          <div style={{ ...S.card, marginTop: 20, marginBottom: 16, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0, letterSpacing: '0.02em' }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, fontStyle: 'italic', color: 'var(--ink4)', marginBottom: 8 }}>
                  {c.title} ·{' '}
                  <span style={{ color: 'var(--blue)', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => onSelectAccount?.({ name: c.company })}>
                    {c.company}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {c.type && <span style={{ display: 'inline-flex', padding: '2px 9px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: 'var(--blue-bg)', border: '1px solid var(--blue-bdr)', color: 'var(--blue)' }}>{c.type}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
            {TABS.map(t => (
              <div key={t} style={{ ...S.tabItem, ...(activeTab === t ? S.tabActive : {}) }} onClick={() => setActiveTab(t)}>{t}</div>
            ))}
          </div>

          {/* TIMELINE TAB */}
          {activeTab === 'Timeline' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
              {/* LEFT: Activity Timeline */}
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

              {/* RIGHT: 3 stacked cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Contact Info */}
                <div style={S.card}>
                  <div style={S.cardHdr}><span style={S.cardTitle}>Contact Info</span></div>
                  {[
                    { lbl: 'Phone', val: c.phone },
                    { lbl: 'Email', val: c.email },
                    { lbl: 'LinkedIn', val: c.linkedin },
                    { lbl: 'Last Contact', val: c.lastContact },
                    { lbl: 'Contact Since', val: c.contactSince },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--line2)', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--ink4)' }}>{r.lbl}</span>
                      <span style={{ fontSize: 12.5, color: 'var(--ink2)', fontFamily: r.lbl === 'Phone' || r.lbl === 'Email' ? "'DM Mono',monospace" : 'inherit' }}>{r.val ?? '—'}</span>
                    </div>
                  ))}
                </div>

                {/* Linked Records */}
                <div style={S.card}>
                  <div style={S.cardHdr}><span style={S.cardTitle}>Linked Records</span></div>
                  {LINKED_DEALS.map(d => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--line2)', cursor: 'pointer', alignItems: 'center' }}
                      onClick={() => onSelectDeal?.({ name: d.name })}>
                      <span style={{ fontSize: 12.5, color: d.color }}>⬤ {d.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink4)' }}>Deal → {d.stage}</span>
                    </div>
                  ))}
                  {LINKED_PROPERTIES.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--line2)', cursor: 'pointer', alignItems: 'center' }}
                      onClick={() => onSelectProperty?.({ address: p.name })}>
                      <span style={{ fontSize: 12.5, color: p.color }}>⬤ {p.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink4)' }}>Property →</span>
                    </div>
                  ))}
                  {LINKED_LEADS.map(l => (
                    <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', cursor: 'pointer', alignItems: 'center' }}>
                      <span style={{ fontSize: 12.5, color: l.color }}>⬤ {l.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink4)' }}>Lead →</span>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div style={S.card}>
                  <div style={S.cardHdr}><span style={S.cardTitle}>Notes</span></div>
                  <div style={{ padding: '12px 16px' }}>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Add freeform notes about this contact…"
                      style={{ width: '100%', minHeight: 100, padding: '8px 10px', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--bg)', fontSize: 13, fontFamily: 'inherit', color: 'var(--ink2)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <button style={{ ...S.btnBlue, marginTop: 8, width: '100%', justifyContent: 'center' }} onClick={() => alert('Note saved')}>Save Note</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DEALS TAB */}
          {activeTab === 'Deals' && (
            <div style={S.tblWrap}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--line)' }}>
                    {['Deal Name', 'Stage', 'Value', 'Type'].map(col => <th key={col} style={S.th}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {LINKED_DEALS.map((d, i) => (
                    <tr key={d.id} style={{ borderBottom: i < LINKED_DEALS.length - 1 ? '1px solid var(--line2)' : 'none', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                      onClick={() => onSelectDeal?.({ name: d.name })}>
                      <td style={S.td}><div style={{ fontWeight: 500, color: 'var(--ink2)' }}>{d.name}</div></td>
                      <td style={S.td}><span style={{ display: 'inline-flex', padding: '2px 7px', borderRadius: 4, fontSize: 10.5, background: 'var(--blue-bg)', border: '1px solid var(--blue-bdr)', color: 'var(--blue)' }}>{d.stage}</span></td>
                      <td style={{ ...S.td, color: 'var(--green)', fontWeight: 600, fontFamily: "'DM Mono',monospace" }}>$48M</td>
                      <td style={S.td}>Sale-Leaseback</td>
                    </tr>
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
                    {['Property', 'Market', 'SF', 'Status'].map(col => <th key={col} style={S.th}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {LINKED_PROPERTIES.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: i < LINKED_PROPERTIES.length - 1 ? '1px solid var(--line2)' : 'none', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                      onClick={() => onSelectProperty?.({ address: p.name })}>
                      <td style={S.td}><div style={{ fontWeight: 500, color: 'var(--ink2)' }}>{p.name}</div></td>
                      <td style={S.td}>SGV</td>
                      <td style={{ ...S.td, fontFamily: "'DM Mono',monospace" }}>186,400 SF</td>
                      <td style={S.td}><span style={{ display: 'inline-flex', padding: '2px 7px', borderRadius: 4, fontSize: 10.5, background: 'var(--green-bg)', border: '1px solid var(--green-bdr)', color: 'var(--green)' }}>Occupied</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* LEADS TAB */}
          {activeTab === 'Leads' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LINKED_LEADS.map(l => (
                <div key={l.id} style={{ ...S.card, padding: '14px 18px' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--amber)' }}>{l.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 4 }}>Score: 95 · A+ · SGV</div>
                </div>
              ))}
            </div>
          )}

          {/* FILES TAB */}
          {activeTab === 'Files' && (
            <div style={{ ...S.card, padding: '32px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: 'italic', color: 'var(--ink4)', marginBottom: 12 }}>No files attached yet</div>
              <button style={S.btnGhost} onClick={() => alert('Upload — coming soon')}>+ Upload File</button>
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
  card: { background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--line)' },
  cardTitle: { fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink3)' },
  tabItem: { padding: '9px 14px', fontSize: 13.5, color: 'var(--ink4)', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap' },
  tabActive: { color: 'var(--blue)', borderBottomColor: 'var(--blue)', fontWeight: 500 },
  tblWrap: { background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  th: { padding: '9px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink4)', whiteSpace: 'nowrap', background: 'var(--bg2)', borderBottom: '1px solid var(--line)' },
  td: { padding: '10px 14px', fontSize: 13, color: 'var(--ink3)', verticalAlign: 'middle' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink3)', fontFamily: 'inherit' },
  btnBlue: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--blue)', background: 'var(--blue)', color: '#fff', fontFamily: 'inherit' },
};
