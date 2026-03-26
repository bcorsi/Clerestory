'use client';
import { useState } from 'react';

const TABS = ['Overview', 'Contacts', 'Deals', 'Properties', 'Activity'];

export default function AccountDetailPage({ account, onBack, onNavigate }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const a = account ?? {};

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ cursor: 'pointer', color: 'var(--ink4)' }} onClick={onBack}>Accounts</span>
          <span style={{ opacity: .4, margin: '0 2px' }}>›</span>
          <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>{a.name}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={S.btnGhost} onClick={() => alert('Edit Account — coming soon')}>⚙ Edit</button>
          <button style={S.btnBlue} onClick={() => alert('Add Contact — coming soon')}>+ Add Contact</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={S.pageWrap}>
          {/* HERO */}
          <div style={S.pageHeader}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, background: 'var(--bg2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--ink3)', fontFamily: "'Playfair Display',serif", flexShrink: 0 }}>
                {a.initial ?? '?'}
              </div>
              <div>
                <div style={S.pageTitle}>{a.name ?? 'Unknown Account'}</div>
                <div style={S.pageSub}>{a.type ?? '—'} · {a.location ?? '—'}</div>
                {a.tags && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {a.tags.map((t, i) => (
                      <span key={i} style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 500, background: `var(--${t.color}-bg)`, border: `1px solid var(--${t.color}-bdr)`, color: `var(--${t.color})` }}>{t.label}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
            {TABS.map(t => (
              <div key={t} style={{ ...S.tab, ...(activeTab === t ? S.tabActive : {}) }} onClick={() => setActiveTab(t)}>{t}</div>
            ))}
          </div>

          {activeTab === 'Overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={S.card}>
                <div style={S.cardHdr}>Account Summary</div>
                {[
                  { lbl: 'Account Type', val: a.type },
                  { lbl: 'Location', val: a.location },
                  { lbl: 'Properties', val: a.props },
                  { lbl: 'Active Deals', val: a.deals },
                  { lbl: a.statLabel, val: a.statVal },
                  { lbl: 'Key Contacts', val: a.contacts },
                ].map((r, i) => (
                  <div key={i} style={S.detailRow}>
                    <span style={S.detailLbl}>{r.lbl}</span>
                    <span style={S.detailVal}>{r.val ?? '—'}</span>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={S.cardHdr}>Notes</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, fontStyle: 'italic', color: 'var(--ink4)', padding: '0 4px' }}>No notes yet — add a note to start tracking this account.</div>
                <button style={{ ...S.btnGhost, marginTop: 12 }} onClick={() => alert('Add Note — coming soon')}>+ Add Note</button>
              </div>
            </div>
          )}

          {activeTab !== 'Overview' && (
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
  btnBlue: { display: 'inline-flex', alignItems: 'center', padding: '7px 13px', borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--blue)', background: 'var(--blue)', color: '#fff', fontFamily: 'inherit' },
  tab: { padding: '9px 14px', fontSize: 13.5, color: 'var(--ink4)', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap' },
  tabActive: { color: 'var(--blue)', borderBottomColor: 'var(--blue)', fontWeight: 500 },
  card: { background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '0 0 4px' },
  cardHdr: { padding: '11px 16px', borderBottom: '1px solid var(--line)', fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 4 },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--line2)' },
  detailLbl: { fontSize: 12, color: 'var(--ink4)' },
  detailVal: { fontSize: 13, color: 'var(--ink2)', fontWeight: 500 },
};
