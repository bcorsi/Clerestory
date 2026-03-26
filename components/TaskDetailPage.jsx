'use client';
import { useState } from 'react';

export default function TaskDetailPage({ task, onBack, onNavigate }) {
  const [done, setDone] = useState(false);
  const t = task ?? {};

  const dueColor = t.daysAgo ? 'var(--rust)' : 'var(--amber)';
  const dueLabel = t.daysAgo ?? t.due ?? 'Today';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ cursor: 'pointer', color: 'var(--ink4)' }} onClick={onBack}>Tasks</span>
          <span style={{ opacity: .4, margin: '0 2px' }}>›</span>
          <span style={{ color: 'var(--ink2)', fontWeight: 500, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.text ?? 'Task'}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={S.btnGhost} onClick={() => alert('Edit Task — coming soon')}>⚙ Edit</button>
          <button style={{ ...S.btnGhost, ...(done ? { borderColor: 'var(--green)', color: 'var(--green)', background: 'var(--green-bg)' } : {}) }}
            onClick={() => setDone(!done)}>
            {done ? '✓ Completed' : '○ Mark Complete'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={S.pageWrap}>
          <div style={S.pageHeader}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              {/* Checkbox */}
              <div style={{ width: 24, height: 24, borderRadius: 6, border: done ? 'none' : '2px solid var(--line)', flexShrink: 0, marginTop: 6, cursor: 'pointer', background: done ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setDone(!done)}>
                {done && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
              </div>
              <div>
                <div style={{ ...S.pageTitle, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.5 : 1 }}>{t.text ?? 'Untitled Task'}</div>
                <div style={S.pageSub}>{t.detail ?? '—'}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {t.meta?.linkLabel && (
                    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: 'var(--blue-bg)', border: '1px solid var(--blue-bdr)', color: t.meta.linkColor ?? 'var(--blue)' }}>
                      {t.meta.linkLabel}
                    </span>
                  )}
                  <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 20, fontFamily: "'DM Mono',monospace", fontSize: 11, color: dueColor, background: t.daysAgo ? 'var(--rust-bg)' : 'var(--amber-bg)', border: `1px solid ${t.daysAgo ? 'var(--rust-bdr)' : 'var(--amber-bdr)'}` }}>
                    {dueLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
            <div style={S.card}>
              <div style={S.cardHdr}>Notes</div>
              <textarea placeholder="Add notes for this task..."
                style={{ width: '100%', padding: '12px 14px', border: 'none', outline: 'none', fontFamily: "'Cormorant Garamond',serif", fontSize: 14, color: 'var(--ink2)', background: 'transparent', resize: 'vertical', minHeight: 120, boxSizing: 'border-box' }} />
            </div>
            <div>
              <div style={S.card}>
                <div style={S.cardHdr}>Task Details</div>
                {[
                  { lbl: 'Status', val: done ? 'Completed' : (t.daysAgo ? 'Overdue' : 'Open') },
                  { lbl: 'Due', val: dueLabel },
                  { lbl: 'Linked To', val: t.meta?.linkLabel ?? '—' },
                  { lbl: 'Record', val: t.detail ?? '—' },
                ].map((r, i) => (
                  <div key={i} style={S.detailRow}>
                    <span style={S.detailLbl}>{r.lbl}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--ink2)' }}>{r.val}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <button style={S.btnGhost} onClick={() => alert('Log Activity — coming soon')}>+ Log Activity</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  topbar: { height: 48, background: 'var(--card)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 10, position: 'sticky', top: 0, zIndex: 5 },
  pageWrap: { maxWidth: 1200, minWidth: 900, margin: '0 auto', padding: '0 28px 60px' },
  pageHeader: { padding: '22px 0 20px' },
  pageTitle: { fontSize: 20, fontWeight: 500, color: 'var(--ink2)', lineHeight: 1.4 },
  pageSub: { fontFamily: "'Cormorant Garamond',serif", fontSize: 14, fontStyle: 'italic', color: 'var(--ink4)', marginTop: 4 },
  btnGhost: { display: 'inline-flex', alignItems: 'center', padding: '7px 13px', borderRadius: 7, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink3)', fontFamily: 'inherit' },
  card: { background: 'var(--card)', borderRadius: 10, border: '1px solid var(--line2)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '0 0 4px' },
  cardHdr: { padding: '11px 16px', borderBottom: '1px solid var(--line)', fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 4 },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--line2)' },
  detailLbl: { fontSize: 12, color: 'var(--ink4)' },
};
