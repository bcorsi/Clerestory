'use client';

import { useState, useMemo, useEffect } from 'react';
import { updateRow, deleteRow, insertRow, fetchAll, convertLeadToDeal } from '../lib/db';
import FilePanel from './FilePanel';
import CampaignMap from './CampaignMap';

const CATEGORIES = ['BESS', 'Disposition', 'Sale Prediction', 'SLB', 'Market Intel', 'Lease Expiry', 'WARN', 'Custom'];
const STATUSES = ['Active', 'Paused', 'Completed'];
const MARKETS_LIST = ['SGV', 'IE', 'LA', 'OC', 'Ventura', 'Multi'];

const catColor = (cat) => ({
  'BESS': { bg: 'rgba(187,136,255,0.12)', color: '#BB88FF', border: 'rgba(187,136,255,0.3)' },
  'Disposition': { bg: 'rgba(232,160,32,0.12)', color: 'var(--amber)', border: 'rgba(232,160,32,0.3)' },
  'Sale Prediction': { bg: 'rgba(85,119,160,0.12)', color: 'var(--blue)', border: 'rgba(85,119,160,0.3)' },
  'SLB': { bg: 'rgba(26,122,72,0.12)', color: 'var(--green)', border: 'rgba(26,122,72,0.3)' },
  'Market Intel': { bg: 'rgba(85,119,160,0.12)', color: 'var(--blue)', border: 'rgba(85,119,160,0.3)' },
  'Lease Expiry': { bg: 'rgba(232,160,32,0.12)', color: 'var(--amber)', border: 'rgba(232,160,32,0.3)' },
  'WARN': { bg: 'rgba(192,60,24,0.12)', color: 'var(--red)', border: 'rgba(192,60,24,0.3)' },
  'Custom': { bg: 'var(--bg-input)', color: 'var(--text-muted)', border: 'var(--border)' },
}[cat] || { bg: 'var(--bg-input)', color: 'var(--text-muted)', border: 'var(--border)' });

const statusColor = (s) => ({
  'Active': { bg: 'rgba(26,122,72,0.12)', color: 'var(--green)' },
  'Paused': { bg: 'rgba(232,160,32,0.12)', color: 'var(--amber)' },
  'Completed': { bg: 'var(--bg-input)', color: 'var(--text-muted)' },
}[s] || { bg: 'var(--bg-input)', color: 'var(--text-muted)' });

export default function ResearchCampaigns({ campaigns, leads, onRefresh, showToast, onLeadClick, onCampaignClick, selectedCampaign }) {
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('Active');
  const [search, setSearch] = useState('');
  const [showViewer, setShowViewer] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // If a campaign is selected, show detail view
  // Guard: ensure campaign has minimum required fields before rendering detail
  // ALL hooks must be called before any conditional return (Rules of Hooks)
  const filtered = useMemo(() => {
    let list = [...(campaigns || [])];
    if (filterStatus) list = list.filter(c => c.status === filterStatus);
    if (filterCat) list = list.filter(c => c.category === filterCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => [c.title, c.thesis, c.category, c.notes].some(f => f && f.toLowerCase().includes(q)));
    }
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [campaigns, filterCat, filterStatus, search]);

  const stats = useMemo(() => {
    const all = campaigns || [];
    return {
      active: all.filter(c => c.status === 'Active').length,
      targets: all.reduce((s, c) => s + (c.target_count || 0), 0),
      converted: all.reduce((s, c) => s + (c.converted_count || 0), 0),
    };
  }, [campaigns]);

  // Now safe to conditionally render — hooks already called above
  if (selectedCampaign && selectedCampaign.id) {
    return <CampaignDetail campaign={selectedCampaign} leads={leads} onRefresh={onRefresh} showToast={showToast} onLeadClick={onLeadClick} onBack={() => onCampaignClick(null)} />;
  }

  return (
    <div>
      {/* Stats strip */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
        {[
          ['Active Campaigns', stats.active, 'var(--green)'],
          ['Total Targets', stats.targets.toLocaleString(), 'var(--accent)'],
          ['Converted', stats.converted, 'var(--amber)'],
          ['Conversion Rate', stats.targets > 0 ? ((stats.converted / stats.targets) * 100).toFixed(1) + '%' : '—', 'var(--text-primary)'],
        ].map(([label, val, color]) => (
          <div key={label} className="card" style={{ flex: 1, padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-display)', color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ New Campaign</button>
        <input className="input" placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '220px' }} />
        <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: '130px' }}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="select" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ maxWidth: '160px' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {filtered.length} campaign{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Campaign cards */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '40px' }}>
          <div className="empty-state-icon">✦</div>
          <div className="empty-state-title">No Research Campaigns</div>
          <div className="empty-state-sub">Research campaigns track intelligence projects — BESS prospecting, disposition analysis, sale predictions — and link targets directly to Lead Gen.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(c => {
            const cc = catColor(c.category);
            const sc = statusColor(c.status);
            const linkedLeads = (leads || []).filter(l => l.campaign_id === c.id);
            const convRate = c.target_count > 0 ? ((c.converted_count || 0) / c.target_count * 100).toFixed(0) : 0;
            return (
              <div key={c.id} className="card" style={{ padding: '18px 20px', cursor: 'pointer', borderLeft: `4px solid ${cc.color}` }}
                onClick={() => onCampaignClick(c)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{c.title}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: cc.bg, color: cc.color, border: `1px solid ${cc.border}`, fontWeight: 600 }}>{c.category}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: sc.bg, color: sc.color, fontWeight: 600 }}>{c.status}</span>
                    </div>
                    {c.thesis && (
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>
                        {c.thesis.length > 200 ? c.thesis.slice(0, 200) + '...' : c.thesis}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>{(c.target_count || 0).toLocaleString()}</span>
                      <span style={{ color: 'var(--text-muted)' }}>targets</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)', fontWeight: 600 }}>{c.converted_count || 0}</span>
                      <span style={{ color: 'var(--text-muted)' }}>converted</span>
                      {convRate > 0 && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>{convRate}%</span>}
                      {linkedLeads.length > 0 && (
                        <span style={{ color: 'var(--accent)' }}>{linkedLeads.length} active leads</span>
                      )}
                    </div>
                  </div>
                  {/* Submarkets */}
                  {c.submarkets?.length > 0 && (
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', maxWidth: '180px', justifyContent: 'flex-end' }}>
                      {c.submarkets.slice(0, 4).map(s => (
                        <span key={s} style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: 'var(--bg-input)', color: 'var(--text-muted)' }}>{s}</span>
                      ))}
                      {c.submarkets.length > 4 && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{c.submarkets.length - 4}</span>}
                    </div>
                  )}
                </div>
                {/* Progress bar */}
                {c.target_count > 0 && (
                  <div style={{ height: '4px', background: 'var(--bg-input)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, convRate)}%`, background: cc.color, borderRadius: '2px', transition: 'width 0.3s' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Campaign Modal */}
      {showAddModal && (
        <AddCampaignModal
          onClose={() => setShowAddModal(false)}
          onSave={() => { setShowAddModal(false); onRefresh(); showToast('Campaign created'); }}
        />
      )}
    </div>
  );
}

// ─── ADD CAMPAIGN MODAL ────────────────────────────────────

function AddCampaignModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    title: '', thesis: '', category: '', status: 'Active',
    catalyst_tag: '', market: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await insertRow('research_campaigns', {
        title: form.title, thesis: form.thesis || null,
        category: form.category || null, status: form.status,
        catalyst_tag: form.catalyst_tag || null,
        market: form.market || null, notes: form.notes || null,
      });
      onSave();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Research Campaign</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Campaign Title *</label>
            <input className="input" placeholder="e.g., SoCal BESS Substation Prospecting" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Thesis / Hypothesis</label>
            <textarea className="textarea" rows={2} placeholder="What's the deal thesis? Why will this generate leads?" value={form.thesis} onChange={e => set('thesis', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Market</label>
              <select className="select" value={form.market} onChange={e => set('market', e.target.value)}>
                <option value="">Select</option>
                {MARKETS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Catalyst Tag (auto-applied to leads from this campaign)</label>
            <input className="input" placeholder="e.g., BESS / Energy Storage" value={form.catalyst_tag} onChange={e => set('catalyst_tag', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="textarea" rows={3} placeholder="Key findings, methodology, data sources..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CAMPAIGN DETAIL VIEW ───────────────────────────────────

function CampaignDetail({ campaign, leads, onRefresh, showToast, onLeadClick, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...campaign });
  const [saving, setSaving] = useState(false);

  // Safety guard — if campaign is malformed, bail gracefully
  if (!campaign || !campaign.id) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink4)' }}>
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>Campaign not found</div>
        <button className="btn" onClick={onBack}>← Back to Campaigns</button>
      </div>
    );
  }

  const cc = catColor(campaign.category);
  const sc = statusColor(campaign.status);
  const linkedLeads = useMemo(() => (leads || []).filter(l => l.campaign_id === campaign.id), [leads, campaign.id]);

  const leadsByStage = useMemo(() => {
    const stages = {};
    linkedLeads.forEach(l => {
      const s = l.stage || 'Lead';
      stages[s] = (stages[s] || 0) + 1;
    });
    return stages;
  }, [linkedLeads]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRow('research_campaigns', campaign.id, {
        title: form.title, thesis: form.thesis, category: form.category,
        status: form.status, catalyst_tag: form.catalyst_tag,
        market: form.market, notes: form.notes,
      });
      onRefresh(); setEditing(false); showToast('Campaign updated');
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'targets', label: 'Targets' },
    { id: 'leads', label: `Leads (${linkedLeads.length})` },
    { id: 'map', label: '🗺 Campaign Map' },
    { id: 'files', label: '📁 Files' },
  ];

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Back + Header */}
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: '10px' }}>← Back to Campaigns</button>

      <div className="card" style={{ marginBottom: '16px', borderLeft: `4px solid ${cc.color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{campaign.title}</h2>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: cc.bg, color: cc.color, border: `1px solid ${cc.border}`, fontWeight: 600 }}>{campaign.category}</span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: sc.bg, color: sc.color, fontWeight: 600 }}>{campaign.status}</span>
            </div>
            {campaign.thesis && (
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '700px' }}>{campaign.thesis}</div>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</button>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
          {[
            ['Targets', campaign.target_count || 0, cc.color],
            ['Active Leads', linkedLeads.filter(l => !['Dead', 'Converted'].includes(l.stage)).length, 'var(--accent)'],
            ['Converted', campaign.converted_count || 0, 'var(--green)'],
            ['Catalyst', campaign.catalyst_tag || '—', 'var(--text-secondary)'],
            ['Market', campaign.market || '—', 'var(--text-secondary)'],
          ].map(([label, val, color]) => (
            <div key={label}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>{label}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: typeof val === 'number' ? 'var(--font-mono)' : 'inherit', color }}>{typeof val === 'number' ? val.toLocaleString() : val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group"><label className="form-label">Title</label><input className="input" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Category</label><select className="select" value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}><option value="">Select</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Status</label><select className="select" value={form.status || ''} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Catalyst Tag</label><input className="input" value={form.catalyst_tag || ''} onChange={e => setForm(f => ({ ...f, catalyst_tag: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Market</label><input className="input" value={form.market || ''} onChange={e => setForm(f => ({ ...f, market: e.target.value }))} /></div>
          </div>
          <div className="form-group" style={{ marginTop: '10px' }}><label className="form-label">Thesis</label><textarea className="textarea" rows={2} value={form.thesis || ''} onChange={e => setForm(f => ({ ...f, thesis: e.target.value }))} /></div>
          <div className="form-group" style={{ marginTop: '10px' }}><label className="form-label">Notes</label><textarea className="textarea" rows={3} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
        {TABS.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, background: 'transparent', color: activeTab === t.id ? 'var(--accent)' : 'var(--text-muted)', borderBottom: activeTab === t.id ? '2px solid var(--accent)' : '2px solid transparent' }}>{t.label}</button>)}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Lead funnel */}
          <div className="card">
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '14px' }}>Lead Funnel</div>
            {Object.keys(leadsByStage).length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No leads linked yet. Import targets or create leads with this campaign selected.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Object.entries(leadsByStage).sort((a, b) => b[1] - a[1]).map(([stage, count]) => (
                  <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', width: '120px' }}>{stage}</span>
                    <div style={{ flex: 1, height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${(count / linkedLeads.length) * 100}%`, height: '100%', background: cc.color, borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', width: '30px', textAlign: 'right' }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campaign notes */}
          <div className="card">
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '14px' }}>Intelligence Notes</div>
            <div style={{ fontSize: '14px', color: campaign.notes ? 'var(--text-secondary)' : 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {campaign.notes || 'No notes — click Edit to add.'}
            </div>
          </div>

          {/* Submarkets */}
          {campaign.submarkets?.length > 0 && (
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>Coverage</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {campaign.submarkets.map(s => (
                  <span key={s} className="tag tag-blue" style={{ fontSize: '12px' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Targets tab */}
      {activeTab === 'targets' && (
        <TargetsTab campaign={campaign} onRefresh={onRefresh} showToast={showToast} onLeadClick={onLeadClick} />
      )}

      {/* Leads tab */}
      {activeTab === 'leads' && (
        <div>
          {linkedLeads.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No leads linked to this campaign yet. When importing targets or creating leads, select this campaign as the source.
            </div>
          ) : (
            <div className="table-container" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 340px)' }}>
              <table>
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Address</th>
                    <th>Stage</th>
                    <th>Priority</th>
                    <th>Score</th>
                    <th>Next Action</th>
                  </tr>
                </thead>
                <tbody>
                  {linkedLeads.map(l => (
                    <tr key={l.id} onClick={() => onLeadClick?.(l)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 600 }}>{l.lead_name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{l.address || '—'}</td>
                      <td><span className="tag tag-ghost" style={{ fontSize: '11px' }}>{l.stage}</span></td>
                      <td><span style={{ color: l.priority === 'High' ? 'var(--red)' : l.priority === 'Medium' ? 'var(--amber)' : 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>{l.priority || '—'}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{l.score || '—'}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{l.next_action || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Campaign Map tab */}
      {activeTab === 'map' && (
        <CampaignMap campaignId={campaign.id} campaignTitle={campaign.title} />
      )}

      {/* Files tab */}
      {activeTab === 'files' && (
        <FilePanel recordType="campaign" recordId={campaign.id} showToast={showToast} />
      )}
    </div>
  );
}

// ─── TARGETS TAB ─────────────────────────────────────────────
// Lightweight prospects imported via CSV. Convert to Lead when ready.

const TARGET_STATUSES = ['New', 'Reviewing', 'Converted', 'Rejected'];
const STATUS_COLORS = {
  New: 'var(--ink3)', Reviewing: 'var(--amber)',
  Converted: 'var(--green)', Rejected: 'var(--rust)',
};

function TargetsTab({ campaign, onRefresh, showToast, onLeadClick }) {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('New');
  const [converting, setConverting] = useState(null);
  const [importing, setImporting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState('');

  const loadTargets = () => {
    setLoading(true);
    fetchAll('campaign_targets', { order: 'created_at' })
      .then(all => {
        setTargets((all || []).filter(t => t.campaign_id === campaign.id));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadTargets(); }, [campaign.id]);

  const filtered = useMemo(() => {
    if (!filterStatus) return targets;
    return targets.filter(t => t.status === filterStatus);
  }, [targets, filterStatus]);

  const counts = useMemo(() => {
    const c = {};
    TARGET_STATUSES.forEach(s => { c[s] = targets.filter(t => t.status === s).length; });
    return c;
  }, [targets]);

  // CSV import — expects columns: name/address/owner/apn/building_sf/notes (flexible)
  const handleImport = async () => {
    if (!csvText.trim()) return;
    setImporting(true);
    try {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, '_'));
      const rows = lines.slice(1).filter(l => l.trim());
      let count = 0;
      for (const row of rows) {
        const vals = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || null; });
        await insertRow('campaign_targets', {
          campaign_id: campaign.id,
          name: obj.name || obj.company || obj.owner || null,
          address: obj.address || null,
          city: obj.city || null,
          submarket: obj.submarket || null,
          apn: obj.apn || null,
          building_sf: obj.building_sf ? parseInt(obj.building_sf) : null,
          land_acres: obj.land_acres ? parseFloat(obj.land_acres) : null,
          owner: obj.owner || obj.name || null,
          owner_type: obj.owner_type || null,
          notes: obj.notes || null,
          priority: obj.priority || 'Medium',
          status: 'New',
        });
        count++;
      }
      showToast?.(`Imported ${count} targets`);
      setCsvText('');
      setShowImport(false);
      loadTargets();
    } catch (e) {
      console.error(e);
      showToast?.('Import error — check CSV format');
    } finally { setImporting(false); }
  };

  // Convert target → Lead
  const handleConvert = async (target) => {
    if (!confirm(`Convert "${target.name || target.address}" to a Lead?`)) return;
    setConverting(target.id);
    try {
      const lead = await insertRow('leads', {
        lead_name: target.name || target.address || 'Unnamed',
        address: target.address,
        city: target.city,
        submarket: target.submarket,
        owner: target.owner,
        owner_type: target.owner_type,
        building_sf: target.building_sf,
        land_acres: target.land_acres,
        notes: target.notes,
        stage: 'Lead',
        priority: target.priority || 'Medium',
        campaign_id: campaign.id,
        catalyst_tags: campaign.catalyst_tag ? [campaign.catalyst_tag] : [],
      });
      await updateRow('campaign_targets', target.id, {
        status: 'Converted',
        converted_lead_id: lead.id,
        converted_at: new Date().toISOString(),
      });
      showToast?.(`Converted to Lead: ${lead.lead_name}`);
      loadTargets();
      onRefresh?.();
    } catch (e) {
      console.error(e);
      showToast?.('Conversion failed');
    } finally { setConverting(null); }
  };

  const handleStatusChange = async (target, status) => {
    try {
      await updateRow('campaign_targets', target.id, { status });
      loadTargets();
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {TARGET_STATUSES.map(s => (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              style={{ fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', background: filterStatus === s ? STATUS_COLORS[s] + '18' : 'transparent', borderColor: filterStatus === s ? STATUS_COLORS[s] : 'var(--line)', color: filterStatus === s ? STATUS_COLORS[s] : 'var(--ink4)' }}>
              {s} {counts[s] > 0 ? `(${counts[s]})` : ''}
            </button>
          ))}
        </div>
        <button onClick={() => setShowImport(!showImport)}
          style={{ fontSize: '12px', fontWeight: 600, padding: '6px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {showImport ? '✕ Cancel' : '↑ Import CSV'}
        </button>
      </div>

      {/* CSV Import panel */}
      {showImport && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--ink3)', marginBottom: '8px', lineHeight: 1.6 }}>
            Paste CSV with headers. Recognized columns: <code style={{ background: 'var(--bg2)', padding: '1px 5px', borderRadius: '3px', fontSize: '11px' }}>name, address, city, submarket, apn, building_sf, land_acres, owner, owner_type, notes, priority</code>
          </div>
          <textarea
            value={csvText} onChange={e => setCsvText(e.target.value)}
            placeholder={'name,address,city,apn,building_sf\n"Acme Corp","123 Main St","Ontario","8234-001-012","45000"'}
            rows={6}
            style={{ width: '100%', fontSize: '12px', padding: '8px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '6px', color: 'var(--ink2)', fontFamily: "'DM Mono',monospace", resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button onClick={handleImport} disabled={importing || !csvText.trim()}
              style={{ fontSize: '12px', fontWeight: 600, padding: '7px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              {importing ? 'Importing...' : `Import ${csvText.trim().split('\n').length - 1} rows`}
            </button>
          </div>
        </div>
      )}

      {/* Targets table */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink4)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink4)', background: 'var(--bg)', borderRadius: '8px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>No {filterStatus || ''} targets</div>
          <div style={{ fontSize: '13px' }}>Import a CSV to populate this campaign with prospects.</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name / Company</th>
                <th>Address</th>
                <th style={{ textAlign: 'right' }}>SF</th>
                <th>APN</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.name || '—'}</td>
                  <td style={{ color: 'var(--ink3)' }}>{[t.address, t.city].filter(Boolean).join(', ') || '—'}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: 'var(--ink3)' }}>
                    {t.building_sf ? Number(t.building_sf).toLocaleString() : '—'}
                  </td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: '12px', color: 'var(--ink4)' }}>{t.apn || '—'}</td>
                  <td>
                    <select value={t.priority || 'Medium'} onChange={e => handleStatusChange(t, t.status)}
                      style={{ fontSize: '11px', padding: '2px 6px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: t.priority === 'High' ? 'var(--rust)' : t.priority === 'Low' ? 'var(--ink4)' : 'var(--amber)', cursor: 'pointer' }}>
                      <option>High</option><option>Medium</option><option>Low</option>
                    </select>
                  </td>
                  <td>
                    <select value={t.status || 'New'} onChange={e => handleStatusChange(t, e.target.value)}
                      style={{ fontSize: '11px', padding: '2px 6px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: STATUS_COLORS[t.status] || 'var(--ink3)', cursor: 'pointer' }}>
                      {TARGET_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    {t.status !== 'Converted' ? (
                      <button onClick={() => handleConvert(t)} disabled={converting === t.id}
                        style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', background: 'var(--green-bg)', border: '1px solid rgba(26,122,72,0.3)', borderRadius: '5px', color: 'var(--green)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {converting === t.id ? '...' : '⚡ To Lead'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>✓ Converted</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
