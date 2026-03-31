'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

function fmt(n) { return n != null ? Number(n).toLocaleString() : '—'; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function daysSince(d) {
  if (!d) return null;
  return Math.floor((new Date() - new Date(d)) / (1000 * 60 * 60 * 24));
}

export default function WarnDetailPage() {
  const { id } = useParams();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    supabase
      .from('warn_notices')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setNotice(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="cl-loading" style={{ padding: 80 }}>
      <div className="cl-spinner" />Loading WARN filing…
    </div>
  );

  if (!notice) return (
    <div className="cl-empty" style={{ padding: 80 }}>
      <div className="cl-empty-label">Filing not found</div>
    </div>
  );

  const days = daysSince(notice.notice_date);
  const window60 = notice.effective_date
    ? Math.floor((new Date(notice.effective_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 28px 64px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--rust)', textTransform: 'uppercase', marginBottom: 8 }}>
          WARN Act Filing
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
          {notice.company}
        </h1>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          {[notice.address, notice.city || notice.county].filter(Boolean).join(' · ')}
        </div>
      </div>

      {/* 60-day alert */}
      {window60 !== null && window60 > 0 && (
        <div style={{
          background: window60 <= 30 ? 'rgba(184,55,20,0.08)' : 'rgba(168,112,16,0.08)',
          border: `1px solid ${window60 <= 30 ? 'rgba(184,55,20,0.2)' : 'rgba(168,112,16,0.2)'}`,
          borderRadius: 10, padding: '14px 18px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>⏱</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: window60 <= 30 ? 'var(--rust)' : 'var(--amber)' }}>
              {window60} days until effective date
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
              The 60-day WARN window closes {fmtDate(notice.effective_date)}. Act before vacancy hits the market.
            </div>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'WORKERS',     value: notice.employees ? fmt(notice.employees) : '—' },
          { label: 'NOTICE DATE', value: fmtDate(notice.notice_date) },
          { label: 'EFFECTIVE',   value: fmtDate(notice.effective_date) },
          { label: 'DAYS SINCE',  value: days !== null ? `${days}d ago` : '—' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filing details */}
      <div className="cl-card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div className="cl-card-title" style={{ marginBottom: 14 }}>FILING DETAILS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Company',          value: notice.company },
            { label: 'Address',          value: notice.address || '—' },
            { label: 'County',           value: notice.county || '—' },
            { label: 'Workers Affected', value: notice.employees ? fmt(notice.employees) : '—' },
            { label: 'Notice Date',      value: fmtDate(notice.notice_date) },
            { label: 'Effective Date',   value: fmtDate(notice.effective_date) },
            { label: 'Industrial',       value: notice.is_industrial ? 'Yes' : 'No' },
            { label: 'In Market',        value: notice.is_in_market ? 'Yes' : 'No' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', width: 150, flexShrink: 0, paddingTop: 2 }}>
                {row.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{row.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Research notes */}
      <div className="cl-card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div className="cl-card-title" style={{ marginBottom: 10 }}>RESEARCH NOTES</div>
        <p style={{
          fontSize: 14, lineHeight: 1.65,
          color: notice.research_notes ? 'var(--text-secondary)' : 'var(--text-tertiary)',
          fontStyle: notice.research_notes ? 'normal' : 'italic',
        }}>
          {notice.research_notes || 'No notes yet.'}
        </p>
      </div>

      {/* Lead status */}
      <div className="cl-card" style={{ padding: '18px 20px', borderLeft: '3px solid var(--rust)' }}>
        <div className="cl-card-title" style={{ marginBottom: 10 }}>LEAD STATUS</div>
        {notice.converted_lead_id ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--green)' }}>Lead created</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>This filing has been converted to a lead and is being tracked.</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--rust)' }}>No lead created yet</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Go back to WARN Intel to create a lead from this filing.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
