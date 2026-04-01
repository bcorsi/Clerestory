'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

function fmt(n) { return n != null ? Number(n).toLocaleString() : '—'; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const CATEGORY_COLORS = {
  'BESS':            { bg: 'rgba(88,56,160,0.08)', color: 'var(--purple)', border: 'rgba(88,56,160,0.2)' },
  'Sale Prediction': { bg: 'rgba(78,110,150,0.08)', color: 'var(--blue)', border: 'rgba(78,110,150,0.2)' },
  'Disposition':     { bg: 'rgba(168,112,16,0.08)', color: 'var(--amber)', border: 'rgba(168,112,16,0.2)' },
  'EV Charging':     { bg: 'rgba(24,112,66,0.08)', color: 'var(--green)', border: 'rgba(24,112,66,0.2)' },
  'OTHER':           { bg: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)', border: 'rgba(0,0,0,0.1)' },
};

function CategoryBadge({ category }) {
  const s = CATEGORY_COLORS[category] || CATEGORY_COLORS['OTHER'];
  return (
    <span style={{
      padding: '3px 9px', borderRadius: 5, fontSize: 10,
      fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {category || 'OTHER'}
    </span>
  );
}

const STATUS_OPTIONS = ['Active', 'Paused', 'Completed'];
const CATEGORY_OPTIONS = ['BESS', 'Sale Prediction', 'Disposition', 'EV Charging', 'Owner Outreach', 'OTHER'];

export default function ResearchCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('Active');
  const [selected, setSelected]   = useState(null);
  const [showNew, setShowNew]     = useState(false);

  useEffect(() => { loadCampaigns(); }, []);

  async function loadCampaigns() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('research_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCampaigns(data || []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === 'All'
    ? campaigns
    : campaigns.filter(c => c.status === filter);

  return (
    <div>
      {/* Header */}
      <div className="cl-page-header">
        <div>
          <h1 className="cl-page-title">Research Campaigns</h1>
          <p className="cl-page-subtitle">
            {loading ? 'Loading…' : `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="cl-page-actions">
          <button className="cl-btn cl-btn-primary cl-btn-sm" onClick={() => setShowNew(true)}>
            + New Campaign
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="cl-tabs" style={{ marginBottom: 20 }}>
        {['Active', 'Paused', 'Completed', 'All'].map(f => (
          <button key={f} className={`cl-tab ${filter === f ? 'cl-tab--active' : ''}`}
            onClick={() => setFilter(f)}>
            {f}
            {f !== 'All' && (
              <span style={{ marginLeft: 5, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)' }}>
                {campaigns.filter(c => c.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Campaign grid */}
      {loading ? (
        <div className="cl-loading" style={{ padding: 60 }}><div className="cl-spinner" />Loading campaigns…</div>
      ) : filtered.length === 0 ? (
        <div className="cl-empty" style={{ padding: 60 }}>
          <div className="cl-empty-label">No campaigns yet</div>
          <div className="cl-empty-sub">Create a campaign to start tracking targeted outreach</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
          {filtered.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onClick={() => setSelected(campaign)}
            />
          ))}
        </div>
      )}

      {/* Campaign Detail Drawer */}
      {selected && (
        <CampaignDetail
          campaign={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => {
            setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
            setSelected(updated);
          }}
          onFullPage={() => router.push(`/research/${selected.id}`)}
        />
      )}

      {/* New Campaign Modal */}
      {showNew && (
        <NewCampaignModal
          onClose={() => setShowNew(false)}
          onSuccess={(newCampaign) => {
            setCampaigns(prev => [newCampaign, ...prev]);
            setShowNew(false);
            setSelected(newCampaign);
          }}
        />
      )}
    </div>
  );
}

// ── CAMPAIGN CARD ─────────────────────────────────────────────
function CampaignCard({ campaign, onClick }) {
  const progress = campaign.target_count > 0
    ? Math.round((campaign.converted_count / campaign.target_count) * 100)
    : 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
        borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        boxShadow: 'var(--card-shadow)', transition: 'box-shadow 120ms',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--card-shadow)'}
    >
      {/* Card header */}
      <div style={{ background: '#EDE8E0', padding: '12px 16px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <CategoryBadge category={campaign.category} />
        <span className={`cl-badge cl-badge-${campaign.status === 'Active' ? 'green' : campaign.status === 'Paused' ? 'amber' : 'gray'}`} style={{ fontSize: 10 }}>
          {campaign.status}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>
          {campaign.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
          {campaign.market}{campaign.submarkets?.length ? ` · ${JSON.parse(campaign.submarkets || '[]').slice(0,2).join(', ')}` : ''}
        </div>
        {campaign.thesis && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 12,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {campaign.thesis}
          </p>
        )}

        {/* Progress */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Outreach Progress
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
              {fmt(campaign.converted_count)} / {fmt(campaign.target_count)} contacted
            </span>
          </div>
          <div style={{ height: 4, background: 'rgba(0,0,0,0.07)', borderRadius: 99 }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--blue)', borderRadius: 99, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>
          Created {fmtDate(campaign.created_at)}
        </span>
        <span style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 500 }}>
          View Detail →
        </span>
      </div>
    </div>
  );
}

// ── CAMPAIGN DETAIL (slide panel) ────────────────────────────
function CampaignDetail({ campaign, onClose, onUpdate, onFullPage }) {
  const [tab, setTab]         = useState('Overview');
  const [targets, setTargets] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    title:    campaign.title || '',
    thesis:   campaign.thesis || '',
    category: campaign.category || '',
    status:   campaign.status || 'Active',
    market:   campaign.market || '',
    notes:    campaign.notes || '',
  });

  useEffect(() => {
    if (tab === 'Targets') loadTargets();
  }, [tab]);

  async function loadTargets() {
    setLoadingTargets(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('campaign_targets')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: true });
      setTargets(data || []);
    } catch(e) { console.error(e); }
    finally { setLoadingTargets(false); }
  }

  async function saveEdit() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('research_campaigns')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', campaign.id)
        .select()
        .single();
      if (error) throw error;
      onUpdate(data);
      setEditing(false);
    } catch(e) { alert('Save failed: ' + e.message); }
    finally { setSaving(false); }
  }

  async function createLeadFromTarget(target) {
    try {
      const supabase = createClient();
      const { data: lead, error } = await supabase.from('leads').insert({
        lead_name:  target.owner,
        company:    target.owner,
        address:    target.address || null,
        city:       target.city || null,
        stage:      'New',
        priority:   target.priority || 'High',
        notes:      [
          target.business_type && `Business: ${target.business_type}`,
          target.apn && `APN: ${target.apn}`,
          target.acreage && `Acreage: ${target.acreage} AC`,
          target.notes,
        ].filter(Boolean).join('\n'),
        phone:      target.phone || null,
        email:      target.email || null,
      }).select('id').single();
      if (error) throw error;

      await supabase.from('campaign_targets')
        .update({ converted_lead_id: lead.id, converted_at: new Date().toISOString(), outreach_status: 'Converted' })
        .eq('id', target.id);

      setTargets(prev => prev.map(t => t.id === target.id ? { ...t, converted_lead_id: lead.id, outreach_status: 'Converted' } : t));
      alert(`Lead created for ${target.owner}!`);
    } catch(e) { alert('Error: ' + e.message); }
  }

  async function updateTargetStatus(targetId, status) {
    const supabase = createClient();
    await supabase.from('campaign_targets').update({ outreach_status: status }).eq('id', targetId);
    setTargets(prev => prev.map(t => t.id === targetId ? { ...t, outreach_status: status } : t));
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    background: 'rgba(0,0,0,0.025)', border: '1px solid var(--card-border)',
    borderRadius: 8, fontFamily: 'var(--font-ui)', fontSize: 13,
    color: 'var(--text-primary)', outline: 'none',
  };
  const labelStyle = {
    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
    color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4, display: 'block',
  };

  const submarkets = (() => {
    try { return JSON.parse(campaign.submarkets || '[]'); } catch { return []; }
  })();

  const contactedCount = targets.filter(t => t.outreach_status && t.outreach_status !== 'New').length;
  const convertedCount = targets.filter(t => t.converted_lead_id).length;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', justifyContent: 'flex-end',
    }}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} onClick={onClose} />

      {/* Panel */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '65%', maxWidth: 900,
        background: 'var(--bg)', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        {/* Drawer header */}
        <div style={{ background: '#EDE8E0', borderBottom: '1px solid var(--card-border)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onClose} style={{ fontSize: 18, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>Campaign</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{campaign.title}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {editing ? (
              <>
                <button className="cl-btn cl-btn-secondary cl-btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                <button className="cl-btn cl-btn-primary cl-btn-sm" onClick={saveEdit} disabled={saving}>
                  {saving ? 'Saving…' : '✓ Save'}
                </button>
              </>
            ) : (
              <>
                <button className="cl-btn cl-btn-secondary cl-btn-sm" onClick={() => setEditing(true)}>✏️ Edit</button>
                <button className="cl-btn cl-btn-secondary cl-btn-sm" onClick={onFullPage}>⛶ Full Page</button>
              </>
            )}
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--card-border)', flexShrink: 0 }}>
          {[
            { label: 'STATUS',    value: campaign.status },
            { label: 'TARGETS',  value: fmt(campaign.target_count) },
            { label: 'CONTACTED', value: fmt(contactedCount || campaign.converted_count) },
            { label: 'CONVERTED', value: fmt(convertedCount) },
          ].map((kpi, i) => (
            <div key={kpi.label} style={{ padding: '12px 16px', borderRight: i < 3 ? '1px solid var(--card-border)' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="cl-tabs" style={{ margin: '0 20px', flexShrink: 0 }}>
          {['Overview', 'Targets', 'Criteria', 'Documents'].map(t => (
            <button key={t} className={`cl-tab ${tab === t ? 'cl-tab--active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: '20px', flex: 1 }}>

          {tab === 'Overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {editing ? (
                <>
                  <div>
                    <label style={labelStyle}>Campaign Title</label>
                    <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Category</label>
                      <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                        {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Status</label>
                      <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                        {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Market</label>
                    <input style={inputStyle} value={form.market} onChange={e => setForm(f => ({ ...f, market: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Thesis</label>
                    <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                      value={form.thesis} onChange={e => setForm(f => ({ ...f, thesis: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Notes</label>
                    <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                      value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </>
              ) : (
                <>
                  {campaign.thesis && (
                    <div className="cl-card" style={{ padding: '14px 16px' }}>
                      <div className="cl-card-title" style={{ marginBottom: 8 }}>CAMPAIGN THESIS</div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{campaign.thesis}</p>
                    </div>
                  )}
                  <div className="cl-card" style={{ padding: '14px 16px' }}>
                    <div className="cl-card-title" style={{ marginBottom: 10 }}>DETAILS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'Category',    value: campaign.category },
                        { label: 'Market',      value: campaign.market },
                        { label: 'Submarkets',  value: submarkets.join(', ') || '—' },
                        { label: 'Source Type', value: campaign.source_type || '—' },
                        { label: 'Catalyst',    value: campaign.catalyst_tag || '—' },
                        { label: 'Created',     value: fmtDate(campaign.created_at) },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', gap: 12 }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', width: 110, flexShrink: 0 }}>{row.label.toUpperCase()}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{row.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {campaign.notes && (
                    <div className="cl-card" style={{ padding: '14px 16px' }}>
                      <div className="cl-card-title" style={{ marginBottom: 8 }}>NOTES</div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{campaign.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'Targets' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {fmt(targets.length)} target{targets.length !== 1 ? 's' : ''}
                </span>
                <button className="cl-btn cl-btn-secondary cl-btn-sm" onClick={() => {
                  const csv = ['Owner,Address,APN,Acreage,Status,Phone,Email,Notes']
                    .concat(targets.map(t => [t.owner, t.address, t.apn, t.acreage, t.outreach_status, t.phone, t.email, t.notes].map(v => `"${v || ''}"`).join(',')))
                    .join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `${campaign.title}_targets.csv`; a.click();
                }}>
                  ↓ Export CSV
                </button>
              </div>

              {loadingTargets ? (
                <div className="cl-loading" style={{ padding: 40 }}><div className="cl-spinner" /></div>
              ) : targets.length === 0 ? (
                <div className="cl-empty" style={{ padding: 40 }}>
                  <div className="cl-empty-label">No targets yet</div>
                  <div className="cl-empty-sub">Targets will appear here once imported</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {targets.map(target => (
                    <div key={target.id} style={{
                      background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                      borderRadius: 10, padding: '12px 14px',
                      borderLeft: `3px solid ${target.converted_lead_id ? 'var(--green)' : target.outreach_status === 'Contacted' ? 'var(--blue)' : target.outreach_status === 'Dead' ? 'rgba(0,0,0,0.1)' : 'var(--card-border)'}`,
                      opacity: target.outreach_status === 'Dead' ? 0.5 : 1,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                            {target.owner}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                            {[target.address, target.city].filter(Boolean).join(', ')}
                            {target.acreage ? ` · ${target.acreage} AC` : ''}
                            {target.apn ? ` · APN: ${target.apn}` : ''}
                          </div>
                          {target.business_type && (
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{target.business_type}</div>
                          )}
                          {(target.phone || target.email) && (
                            <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 4, display: 'flex', gap: 10 }}>
                              {target.phone && <span>📞 {target.phone}</span>}
                              {target.email && <span>✉️ {target.email}</span>}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'flex-start' }}>
                          <select
                            value={target.outreach_status || 'New'}
                            onChange={e => updateTargetStatus(target.id, e.target.value)}
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--card-bg)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                          >
                            {['New', 'Contacted', 'Responded', 'Converted', 'Dead'].map(s => <option key={s}>{s}</option>)}
                          </select>
                          {!target.converted_lead_id && (
                            <button
                              className="cl-btn cl-btn-primary cl-btn-sm"
                              onClick={() => createLeadFromTarget(target)}
                              style={{ fontSize: 11 }}
                            >
                              + Lead
                            </button>
                          )}
                          {target.converted_lead_id && (
                            <span className="cl-badge cl-badge-green" style={{ fontSize: 10 }}>✓ Lead</span>
                          )}
                        </div>
                      </div>
                      {target.notes && (
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.5, borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: 6 }}>
                          {target.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'Criteria' && (
            <div className="cl-card" style={{ padding: '16px 18px' }}>
              <div className="cl-card-title" style={{ marginBottom: 10 }}>CAMPAIGN CRITERIA</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {campaign.notes || 'No criteria documented yet.'}
              </p>
            </div>
          )}

          {tab === 'Documents' && (
            <div className="cl-empty" style={{ padding: 40 }}>
              <div className="cl-empty-label">No documents</div>
              <div className="cl-empty-sub">Upload campaign documents, maps, or reports</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── NEW CAMPAIGN MODAL ────────────────────────────────────────
function NewCampaignModal({ onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title:    '',
    thesis:   '',
    category: 'OTHER',
    status:   'Active',
    market:   '',
    notes:    '',
  });

  async function handleCreate() {
    if (!form.title.trim()) { alert('Campaign title is required.'); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('research_campaigns')
        .insert({
          title:         form.title,
          thesis:        form.thesis || null,
          category:      form.category,
          status:        form.status,
          market:        form.market || null,
          notes:         form.notes || null,
          target_count:  0,
          converted_count: 0,
        })
        .select()
        .single();
      if (error) throw error;
      onSuccess(data);
    } catch(e) {
      alert('Error creating campaign: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    background: 'rgba(0,0,0,0.025)', border: '1px solid var(--card-border)',
    borderRadius: 8, fontFamily: 'var(--font-ui)', fontSize: 14,
    color: 'var(--text-primary)', outline: 'none',
  };
  const labelStyle = {
    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
    color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4, display: 'block',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--bg)', borderRadius: 16,
        width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          background: '#EDE8E0', borderBottom: '1px solid rgba(0,0,0,0.08)',
          padding: '18px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', borderRadius: '16px 16px 0 0',
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>New Research Campaign</div>
          <button onClick={onClose} style={{ fontSize: 22, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Campaign Title *</label>
            <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Long Beach BESS Prospecting" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Market</label>
            <input style={inputStyle} value={form.market} onChange={e => setForm(f => ({ ...f, market: e.target.value }))} placeholder="e.g. SGV, IE West, Long Beach" />
          </div>
          <div>
            <label style={labelStyle}>Thesis</label>
            <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
              value={form.thesis} onChange={e => setForm(f => ({ ...f, thesis: e.target.value }))}
              placeholder="What is the investment thesis or targeting rationale?" />
          </div>
          <div>
            <label style={labelStyle}>Notes / Criteria</label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Targeting criteria, filters, source data..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <button className="cl-btn cl-btn-secondary" onClick={onClose}>Cancel</button>
            <button className="cl-btn cl-btn-primary" onClick={handleCreate} disabled={saving} style={{ minWidth: 160 }}>
              {saving ? 'Creating…' : '+ Create Campaign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
