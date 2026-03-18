'use client';

import { DEAL_STAGES, STAGE_COLORS, CATALYST_CATEGORIES, fmt } from '../lib/constants';

export default function Dashboard({ properties, deals, contacts, leaseComps, onPropertyClick, onDealClick, setPage }) {
  // Stats
  const totalSF = properties.reduce((s, p) => s + (p.building_sf || 0), 0);
  const activeDeals = deals.filter((d) => !['Closed', 'Dead'].includes(d.stage));
  const totalPipeline = activeDeals.reduce((s, d) => s + (d.deal_value || 0), 0);
  const totalCommission = activeDeals.reduce((s, d) => s + (d.commission_est || 0), 0);
  const weightedComm = activeDeals.reduce((s, d) => s + (d.commission_est || 0) * ((d.probability || 0) / 100), 0);

  // Hot properties (probability > 60, sorted desc)
  const hotProperties = [...properties]
    .filter((p) => p.probability && p.probability >= 60)
    .sort((a, b) => (b.probability || 0) - (a.probability || 0))
    .slice(0, 6);

  // Catalyst breakdown
  const catalystCounts = {};
  properties.forEach((p) => {
    (p.catalyst_tags || []).forEach((tag) => {
      catalystCounts[tag] = (catalystCounts[tag] || 0) + 1;
    });
  });
  const topCatalysts = Object.entries(catalystCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Deals by stage
  const dealsByStage = {};
  DEAL_STAGES.forEach((s) => { dealsByStage[s] = deals.filter((d) => d.stage === s).length; });

  const urgencyColor = (prob) => {
    if (prob >= 80) return 'var(--red)';
    if (prob >= 60) return 'var(--amber)';
    if (prob >= 40) return 'var(--accent)';
    return 'var(--text-muted)';
  };

  return (
    <div>
      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Properties</div>
          <div className="stat-value">{properties.length}</div>
          <div className="stat-sub">{fmt.sf(totalSF)} tracked</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Deals</div>
          <div className="stat-value">{activeDeals.length}</div>
          <div className="stat-sub">{fmt.price(totalPipeline)} pipeline</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Est. Commission</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{fmt.price(Math.round(totalCommission))}</div>
          <div className="stat-sub">{fmt.price(Math.round(weightedComm))} weighted</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Contacts</div>
          <div className="stat-value">{contacts.length}</div>
          <div className="stat-sub">{leaseComps.length} lease comps</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left: Hot Properties + Pipeline */}
        <div>
          {/* Hot Properties */}
          <div className="card mb-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600 }}>🔥 Hot Properties</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage('properties')}>View all →</button>
            </div>
            {hotProperties.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No high-probability properties yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {hotProperties.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onPropertyClick(p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', borderRadius: '6px', cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{p.address}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {p.submarket} · {p.building_sf ? fmt.sf(p.building_sf) : p.land_acres ? fmt.acres(p.land_acres) : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '200px' }}>
                      {(p.catalyst_tags || []).slice(0, 2).map((tag) => (
                        <span key={tag} className="tag tag-amber" style={{ fontSize: '10px' }}>{tag}</span>
                      ))}
                    </div>
                    <div className="prob-bar" style={{ minWidth: '80px' }}>
                      <div className="prob-bar-track">
                        <div
                          className="prob-bar-fill"
                          style={{ width: `${p.probability || 0}%`, background: urgencyColor(p.probability) }}
                        />
                      </div>
                      <span className="prob-bar-label" style={{ color: urgencyColor(p.probability) }}>
                        {p.probability}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pipeline Mini */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Pipeline Snapshot</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage('pipeline')}>View pipeline →</button>
            </div>
            <div style={{ display: 'flex', gap: '4px', height: '28px', borderRadius: '6px', overflow: 'hidden' }}>
              {DEAL_STAGES.filter((s) => dealsByStage[s] > 0).map((stage) => {
                const pct = (dealsByStage[stage] / Math.max(deals.length, 1)) * 100;
                return (
                  <div
                    key={stage}
                    title={`${stage}: ${dealsByStage[stage]}`}
                    style={{
                      width: `${Math.max(pct, 4)}%`,
                      background: STAGE_COLORS[stage],
                      opacity: 0.8,
                      borderRadius: '3px',
                      minWidth: '14px',
                      transition: 'opacity 0.15s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                  />
                );
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
              {DEAL_STAGES.filter((s) => dealsByStage[s] > 0).map((stage) => (
                <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: STAGE_COLORS[stage] }} />
                  {stage} ({dealsByStage[stage]})
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Catalyst Breakdown */}
        <div>
          <div className="card">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Catalyst Breakdown</h3>
            {topCatalysts.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No catalysts tagged yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topCatalysts.map(([tag, count]) => {
                  const maxCount = topCatalysts[0]?.[1] || 1;
                  const pct = (count / maxCount) * 100;
                  const isHigh = ['SLB Potential', 'Distress / Special Servicer', 'WARN Notice', 'Bankruptcy', 'Vacancy'].includes(tag);
                  return (
                    <div key={tag}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tag}</span>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: isHigh ? 'var(--amber)' : 'var(--text-muted)' }}>{count}</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`, height: '100%', borderRadius: '2px',
                          background: isHigh ? 'var(--amber)' : 'var(--accent)',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Market Summary */}
          <div className="card" style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>By Market</h3>
            {['SGV', 'IE', 'LA'].map((mkt) => {
              const count = properties.filter((p) => p.market === mkt).length;
              const mktDeals = deals.filter((d) => {
                const prop = properties.find((p) => p.address === d.address);
                return prop?.market === mkt;
              }).length;
              return (
                <div key={mkt} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{mkt}</span>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>{count} props</span>
                    <span>{mktDeals} deals</span>
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
