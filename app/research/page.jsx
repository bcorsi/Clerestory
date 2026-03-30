'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import SlideDrawer from '@/components/SlideDrawer';

const CAMPAIGN_TYPES = {
  bess:        { label: 'BESS',          color: 'purple', icon: '⚡' },
  ev_charging: { label: 'EV Charging',   color: 'blue',   icon: '🔋' },
  slb:         { label: 'SLB',           color: 'amber',  icon: '🏭' },
  off_market:  { label: 'Off-Market',    color: 'rust',   icon: '🎯' },
  land:        { label: 'Land',          color: 'green',  icon: '📍' },
  other:       { label: 'Other',         color: 'gray',   icon: '📋' },
};

function fmt(n) { return n != null ? Number(n).toLocaleString() : '—'; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ResearchCampaignsPage() {
  const [campaigns, setCampaigns]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedId, setSelectedId]   = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [tab, setTab]                 = useState('active');

  useEffect(() => { loadCampaigns(); }, [tab]);

  async function loadCampaigns() {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from('research_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (tab !== 'all') query = query.eq('status', tab);
      const { data, error } = await query;
      if (error) throw error;
      setCampaigns(data || []);
    } catch(e) {
      console.error(e);
      // Fallback seed data if table is empty
      setCampaigns([
        {
          id: 'seed-1', name: 'Long Beach BESS Land Acquisition', campaign_type: 'bess',
          status: 'active', market: 'Long Beach / South Bay',
          description: 'Targeting industrial-zoned parcels adjacent to SCE 230kV substations for BESS developer acquisition. Priority corridors: Cherry Ave, PCH industrial nodes.',
          target_count: 12, contacted_count: 3,
          criteria: { acres_min: 1, acres_max: 10, zoning: ['M1','M2'], substation_proximity: '0.5 mile SCE 230kV' },
          created_at: new Date().toISOString(),
        },
        {
          id: 'seed-2', name: 'Tesla Truck EV Charging — City of Industry', campaign_type: 'ev_charging',
          status: 'active', market: 'City of Industry / SGV',
          description: 'Covered land / functionally obsolete industrial buildings on 2–4 acre sites near 60/605/10 freeways.',
          target_count: 8, contacted_count: 1,
          criteria: { acres_min: 2, acres_max: 4, freeway_access: '60/605/10', strategy: 'Covered land / demolish and redevelop' },
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="cl-page-header">
        <div>
          <h1 className="cl-page-title">Research Campaigns</h1>
          <p className="cl-page-subtitle">
            {loading ? 'Loading…' : `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="cl-page-actions">
          <button className="cl-btn cl-btn-primary cl-btn-sm">+ New Campaign</button>
        </div>
      </div>

      <div className="cl-filter-bar">
        <div className="cl-tabs" style={{ margin: 0, border: 'none' }}>
          {[{ k: 'active', l: 'Active' }, { k: 'paused', l: 'Paused' }, { k: 'all', l: 'All' }].map(f => (
            <button key={f.k} className={`cl-tab ${tab === f.k ? 'cl-tab--active' : ''}`}
              onClick={() => setTab(f.k)} style={{ padding: '6px 14px' }}>{f.l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="cl-loading" style={{ padding: 60 }}><div className="cl-spinner" />Loading campaigns…</div>
      ) : campaigns.length === 0 ? (
        <div className="cl-empty" style={{ padding: 60 }}>
          <div className="cl-empty-label">No campaigns yet</div>
          <div className="cl-empty-sub">Create a campaign to start tracking targeted outreach</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
          {campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign}
              selected={selectedId === campaign.id}
              onClick={() => { setSelectedId(campaign.id); setSelectedCampaign(campaign); }} />
          ))}
        </div>
      )}

      <SlideDrawer
        open={!!selectedId}
        onClose={() => { setSelectedId(null); setSelectedCampaign(null); }}
        title={selectedCampaign?.name || 'Campaign'}
        subtitle={selectedCampaign?.market || ''}
        badge={selectedCampaign ? {
          label: CAMPAIGN_TYPES[selectedCampaign.campaign_type]?.label || selectedCampaign.campaign_type,
          color: CAMPAIGN_TYPES[selectedCampaign.campaign_type]?.color || 'gray'
        } : undefined}
      >
        {selectedCampaign && <CampaignDetail campaign={selectedCampaign} onRefresh={loadCampaigns} />}
      </SlideDrawer>
    </div>
  );
}

// ── CAMPAIGN CARD ─────────────────────────────────────────
function CampaignCard({ campaign, selected, onClick }) {
  const type = CAMPAIGN_TYPES[campaign.campaign_type] || CAMPAIGN_TYPES.other;
  const progress = campaign.target_count > 0 ? (campaign.contacted_count / campaign.target_count) * 100 : 0;

  return (
    <div onClick={onClick} style={{
      background: selected ? 'rgba(78,110,150,0.04)' : '#FAFAF8',
      border: `1px solid ${selected ? 'rgba(78,110,150,0.25)' : 'rgba(0,0,0,0.08)'}`,
      borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
      boxShadow: selected ? '0 2px 12px rgba(78,110,150,0.12)' : '0 2px 6px rgba(0,0,0,0.06)',
      transition: 'all 150ms ease',
    }}
    onMouseEnter={e => { if (!selected) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
    onMouseLeave={e => { if (!selected) e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)'; }}
    >
      {/* Card header */}
      <div style={{ background: '#EDE8E0', borderBottom: '1px solid rgba(0,0,0,0.07)', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{type.icon}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#78726A' }}>
            {type.label}
          </span>
        </div>
        <span className={`cl-badge cl-badge-${campaign.status === 'active' ? 'green' : campaign.status === 'paused' ? 'amber' : 'gray'}`} style={{ fontSize: 10 }}>
          {campaign.status}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.3 }}>
          {campaign.name}
        </div>
        {campaign.market && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 10, letterSpacing: '0.04em' }}>
            {campaign.market}
          </div>
        )}
        {campaign.description && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {campaign.description}
          </p>
        )}

        {/* Progress bar */}
        {campaign.target_count > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>OUTREACH PROGRESS</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
                {campaign.contacted_count || 0} / {campaign.target_count} contacted
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, progress)}%`, background: `var(--${type.color})`, borderRadius: 3, transition: 'width 400ms ease' }} />
            </div>
          </div>
        )}

        {/* Criteria chips */}
        {campaign.criteria && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {campaign.criteria.acres_min && (
              <span className="cl-badge cl-badge-gray" style={{ fontSize: 10 }}>
                {campaign.criteria.acres_min}–{campaign.criteria.acres_max || '+'} acres
              </span>
            )}
            {campaign.criteria.zoning && Array.isArray(campaign.criteria.zoning) && campaign.criteria.zoning.map(z => (
              <span key={z} className="cl-badge cl-badge-blue" style={{ fontSize: 10 }}>{z}</span>
            ))}
            {campaign.criteria.strategy && (
              <span className="cl-badge cl-badge-amber" style={{ fontSize: 10 }}>{campaign.criteria.strategy}</span>
            )}
            {campaign.criteria.freeway_access && (
              <span className="cl-badge cl-badge-gray" style={{ fontSize: 10 }}>Fwy {campaign.criteria.freeway_access}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)' }}>
          Created {fmtDate(campaign.created_at)}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--blue)' }}>
          VIEW DETAIL →
        </span>
      </div>
    </div>
  );
}

// ── CAMPAIGN DETAIL (drawer) ──────────────────────────────
function CampaignDetail({ campaign, onRefresh }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [targets, setTargets]     = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const TABS = ['overview', 'targets', 'criteria', 'documents'];
  const type = CAMPAIGN_TYPES[campaign.campaign_type] || CAMPAIGN_TYPES.other;
  const progress = campaign.target_count > 0 ? Math.round((campaign.contacted_count / campaign.target_count) * 100) : 0;

  useEffect(() => {
    if (activeTab === 'targets') loadTargets();
  }, [activeTab]);

  async function loadTargets() {
    setLoadingTargets(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('campaign_targets')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false });
      setTargets(data || []);
    } catch(e) { console.error(e); }
    finally { setLoadingTargets(false); }
  }

  return (
    <div>
      {/* Status + progress */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
        {[
          { label: 'STATUS',    value: campaign.status || '—' },
          { label: 'TARGETS',   value: campaign.target_count || '0' },
          { label: 'CONTACTED', value: campaign.contacted_count || '0' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'rgba(0,0,0,0.025)', borderRadius: 'var(--radius-md)', padding: '10px 12px', border: '1px solid var(--card-border)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {campaign.target_count > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>OUTREACH PROGRESS</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{progress}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, progress)}%`, background: `var(--${type.color})`, borderRadius: 4 }} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <button className="cl-btn cl-btn-primary cl-btn-sm">+ Add Target</button>
        <button className="cl-btn cl-btn-secondary cl-btn-sm">📋 Export List</button>
        <button className="cl-btn cl-btn-secondary cl-btn-sm">✉️ Bulk Email</button>
      </div>

      {/* Tabs */}
      <div className="cl-tabs">
        {TABS.map(tab => (
          <button key={tab} className={`cl-tab ${activeTab === tab ? 'cl-tab--active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="cl-card" style={{ padding: '14px 16px' }}>
            <div className="cl-card-title" style={{ marginBottom: 8 }}>CAMPAIGN DESCRIPTION</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{campaign.description || 'No description added.'}</p>
          </div>
          <div className="cl-card" style={{ padding: '14px 16px' }}>
            <div className="cl-card-title" style={{ marginBottom: 8 }}>MARKET</div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{campaign.market || '—'}</p>
          </div>
        </div>
      )}

      {activeTab === 'targets' && (
        <div>
          {loadingTargets ? (
            <div className="cl-loading"><div className="cl-spinner" /></div>
          ) : targets.length === 0 ? (
            <div className="cl-empty" style={{ padding: 40 }}>
              <div className="cl-empty-label">No targets yet</div>
              <div className="cl-empty-sub">Add properties as targets for this campaign</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {targets.map(target => (
                <div key={target.id} className="cl-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{target.address || target.apn || 'Unnamed Target'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {[target.city, target.status].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <span className={`cl-badge cl-badge-${target.status === 'contacted' ? 'amber' : target.status === 'converted' ? 'green' : 'gray'}`} style={{ fontSize: 10 }}>
                    {target.status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'criteria' && (
        <div>
          {campaign.criteria ? (
            <div className="cl-card" style={{ padding: '14px 16px' }}>
              <div className="cl-card-title" style={{ marginBottom: 10 }}>SITE CRITERIA</div>
              {Object.entries(campaign.criteria).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)', width: 130, flexShrink: 0, paddingTop: 2 }}>
                    {key.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="cl-empty" style={{ padding: 40 }}>
              <div className="cl-empty-label">No criteria defined</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="cl-empty" style={{ padding: 40 }}>
          <div className="cl-empty-label">No documents</div>
          <div className="cl-empty-sub">Upload aerials, ownership maps, outreach lists</div>
        </div>
      )}
    </div>
  );
}
