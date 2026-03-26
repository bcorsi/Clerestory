'use client';
import { useState } from 'react';

const TABS = ['Timeline', 'Deals', 'Properties', 'Activity'];

export default function ContactDetailPage({ contact, onBack, onNavigate }) {
  const [activeTab, setActiveTab] = useState('Timeline');
  const c = contact ?? {};

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ cursor: 'pointer', color: 'var(--ink4)' }} onClick={onBack}>Contacts</span>
          <span style={{ opacity: .4, margin: '0 2px' }}>›</span>
          <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>{c.name}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={S.btnGhost} onClick={() => alert('Log Call — coming soon')}>📞 Log Call</button>
          <button style={S.btnGhost} onClick={() => alert('Send Email — coming soon')}>✉ Email</button>
          <button style={S.btnGhost} onClick={() => alert('Edit Contact — coming soon')}>⚙ Edit</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={S.pageWrap}>
          {/* HERO */}
          <div style={S.pageHeader}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: c.color ?? '#4E6E96', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {c.initials ?? '??'}
              </div>
              <div>
                <div style={S.pageTitle}>{c.name ?? 'Unknown Contact'}</div>
                <div style={S.pageSub}>{c.title ?? '—'} · {c.company ?? '—'}</div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                  {c.phone && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: 'var(--ink3)' }}>📞 {c.phone}</span>}
                  {c.email && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: 'var(--ink3)' }}>✉ {c.email}</span>}
                  <span style={{ fontSize: 12, color: 'var(--ink4)' }}>Last contact: {c.lastContact ?? 'Never'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
            {TABS.map(t => (
              <div key={t} style={{ ...S.tab, ...(activeTab === t ? S.tabActive : {}) }} onClick={() => setActiveTab(t)}>{t}</div>
            ))}
          </div>

          {activeTab === 'Timeline' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
              <div>
                {/* Timeline placeholder */}
                {c.linkedTo && c.linkedTo.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardHdr}>Linked Records</div>
                    {c.linkedTo.map((l, i) => (
                      <div key={i} style={{ ...S.detailRow, cursor: 'pointer' }} onClick={() => alert(`${l.label} — coming soon`)}>
                        <span style={{ fontSize: 13, color: l.color }}>{l.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--ink4)' }}>→</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ ...S.card, marginTop: c.linkedTo ? 12 : 0 }}>
                  <div style={S.cardHdr}>Activity Timeline</div>
                  <div style={{ padding: '16px', fontFamily: "'Cormorant Garamond',serif", fontSize: 14, fontStyle: 'italic', color: 'var(--ink4)' }}>
                    No activity logged yet. Use Log Call / Email / Note to add activity.
                  </div>
                </div>
              </div>
              <div style={S.card}>
                <div style={S.cardHdr}>Contact Info</div>
                {[
                  { lbl: 'Type', val: c.type },
                  { lbl: 'Company', val: c.company },
                  { lbl: 'Phone', val: c.phone },
                  { lbl: 'Email', val: c.email ?? 'Not on file' },
                  { lbl: 'Last Contact', val: c.lastContact ?? 'Never' },
                ].map((r, i) => (
                  <div key={i} style={S.detailRow}>
                    <span style={S.detailLbl}>{r.lbl}</span>
                    <span style={{ fontSize: 13, color: r.val === 'Not on file' ? 'var(--ink4)' : 'var(--ink2)', fontStyle: r.val === 'Not on file' ? 'italic' : 'normal' }}>{r.val ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab !== 'Timeline' && (
            <div style={{ background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: 'italic', color: 'var(--ink4)' }}>{activeTab} — coming soon</div>
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
  pageTitle: { fontSize: 26, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em' },
  pageSub: { fontFamily: "'Cormorant Garamond',serif", fontSize: 14, fontStyle: 'italic', color: 'var(--ink4)', marginTop: 4 },
  btnGhost: { display: 'inline-flex', alignItems: 'center', padding: '7px 13px', borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink3)', fontFamily: 'inherit' },
  tab: { padding: '9px 14px', fontSize: 13.5, color: 'var(--ink4)', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap' },
  tabActive: { color: 'var(--blue)', borderBottomColor: 'var(--blue)', fontWeight: 500 },
  card: { background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '0 0 4px' },
  cardHdr: { padding: '11px 16px', borderBottom: '1px solid var(--line)', fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 4 },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--line2)' },
  detailLbl: { fontSize: 12, color: 'var(--ink4)' },
};
