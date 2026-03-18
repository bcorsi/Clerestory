'use client';

import { useState } from 'react';
import { DEAL_STAGES, STAGE_COLORS, fmt } from '../lib/constants';
import { updateRow } from '../lib/db';

export default function DealPipeline({ deals, onRefresh, showToast, onDealClick }) {
  const [view, setView] = useState('kanban');
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const dealsByStage = {};
  DEAL_STAGES.forEach((s) => {
    dealsByStage[s] = deals.filter((d) => d.stage === s);
  });

  const onDragStart = (e, deal) => {
    setDragging(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, stage) => {
    e.preventDefault();
    setDragOver(stage);
  };

  const onDragLeave = () => setDragOver(null);

  const onDrop = async (e, newStage) => {
    e.preventDefault();
    setDragOver(null);
    if (dragging && dragging.stage !== newStage) {
      try {
        await updateRow('deals', dragging.id, { stage: newStage });
        showToast(`Moved to ${newStage}`);
        onRefresh();
      } catch (err) {
        console.error('Move error:', err);
      }
    }
    setDragging(null);
  };

  const priorityDot = (priority) => {
    const colors = { Urgent: 'var(--red)', High: 'var(--amber)', Medium: 'var(--accent)', Low: 'var(--text-muted)' };
    return colors[priority] || 'var(--text-muted)';
  };

  const toggleExpand = (e, dealId) => {
    e.stopPropagation();
    setExpanded(expanded === dealId ? null : dealId);
  };

  const totalValue = deals.filter(d => !['Closed','Dead'].includes(d.stage) && d.deal_value).reduce((s, d) => s + d.deal_value, 0);

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Pipeline value: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>
            {totalValue > 0 ? `$${(totalValue / 1000000).toFixed(1)}M` : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-input)', borderRadius: '6px', padding: '2px' }}>
          {[['kanban', '⊞'], ['list', '☰']].map(([v, icon]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '14px', background: view === v ? 'var(--bg-card)' : 'transparent', color: view === v ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'all 0.15s' }}>{icon}</button>
          ))}
        </div>
      </div>

      {view === 'list' ? (
        <div className="table-container" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
          <table>
            <thead>
              <tr><th>Deal</th><th>Stage</th><th>Type</th><th>Value</th><th>Commission</th><th>Probability</th><th>Close Date</th><th>Buyer/Tenant</th></tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} onClick={() => onDealClick?.(d)} style={{ cursor: 'pointer' }}>
                  <td><div style={{ fontWeight: 500 }}>{d.deal_name}</div>{d.address && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.address}</div>}</td>
                  <td><span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '4px', background: (STAGE_COLORS[d.stage] || '#6b7280') + '22', color: STAGE_COLORS[d.stage] || '#6b7280', fontWeight: 600 }}>{d.stage}</span></td>
                  <td style={{ fontSize: '12px' }}>{d.deal_type || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)' }}>{d.deal_value ? fmt.price(d.deal_value) : '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#22c55e' }}>{d.commission_est ? fmt.price(d.commission_est) : '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{d.probability != null ? `${d.probability}%` : '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{d.close_date || '—'}</td>
                  <td style={{ fontSize: '12px' }}>{d.buyer || d.tenant_name || '—'}</td>
                </tr>
              ))}
              {deals.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No deals</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
    <div className="kanban-board">
      {DEAL_STAGES.map((stage) => {
        const stageDeals = dealsByStage[stage] || [];
        const isOver = dragOver === stage;
        return (
          <div
            key={stage}
            className="kanban-col"
            onDragOver={(e) => onDragOver(e, stage)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, stage)}
          >
            <div className="kanban-col-header">
              <div className="kanban-col-dot" style={{ background: STAGE_COLORS[stage] }} />
              {stage}
              <span className="kanban-col-count">{stageDeals.length}</span>
            </div>

            <div
              className="kanban-col-cards"
              style={{
                background: isOver ? 'var(--accent-soft)' : 'transparent',
                borderRadius: '8px', padding: '4px',
                transition: 'background 0.15s', minHeight: '100px',
              }}
            >
              {stageDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="kanban-card"
                  draggable
                  onDragStart={(e) => onDragStart(e, deal)}
                  onClick={(e) => toggleExpand(e, deal.id)}
                  onDoubleClick={() => onDealClick?.(deal)}
                  style={{
                    borderLeft: `3px solid ${STAGE_COLORS[stage]}`,
                    opacity: dragging?.id === deal.id ? 0.4 : 1,
                  }}
                >
                  <div className="kanban-card-title">{deal.deal_name}</div>
                  <div className="kanban-card-sub">{deal.address || deal.submarket || ''}</div>
                  <div className="kanban-card-meta">
                    {deal.deal_value && (
                      <span className="kanban-card-value">{fmt.price(deal.deal_value)}</span>
                    )}
                    {deal.commission_est && (
                      <span style={{ color: 'var(--green)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                        {fmt.price(deal.commission_est)} comm
                      </span>
                    )}
                    {deal.priority && (
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: priorityDot(deal.priority) }} />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{deal.priority}</span>
                      </span>
                    )}
                  </div>
                  {deal.probability != null && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${deal.probability}%`, height: '100%', borderRadius: '2px',
                          background: deal.probability >= 70 ? 'var(--green)' : deal.probability >= 40 ? 'var(--amber)' : 'var(--text-muted)',
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Expanded detail */}
                  {expanded === deal.id && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                        {[
                          ['Type', deal.deal_type],
                          ['Strategy', deal.strategy],
                          ['Buyer', deal.buyer],
                          ['Seller', deal.seller],
                          ['Deal Value', deal.deal_value ? fmt.price(deal.deal_value) : null],
                          ['Commission', deal.commission_est ? fmt.price(deal.commission_est) : null],
                          ['Rate', deal.commission_rate ? `${deal.commission_rate}%` : null],
                          ['Probability', deal.probability != null ? `${deal.probability}%` : null],
                          ['Close Date', deal.close_date ? fmt.date(deal.close_date) : null],
                          ['Priority', deal.priority],
                        ].filter(([, v]) => v).map(([label, val]) => (
                          <div key={label}>
                            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{val}</div>
                          </div>
                        ))}
                      </div>
                      {deal.notes && (
                        <div style={{ marginTop: '10px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '2px' }}>Notes</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{deal.notes}</div>
                        </div>
                      )}
                      {deal.onedrive_url && (
                        <div style={{ marginTop: '10px' }}>
                          <a
                            href={deal.onedrive_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              fontSize: '12px', color: 'var(--accent)', textDecoration: 'none',
                              padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)', background: 'var(--bg-input)',
                            }}
                          >
                            📁 OneDrive ↗
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {stageDeals.length === 0 && !isOver && (
                <div style={{
                  padding: '20px 12px', textAlign: 'center', fontSize: '12px',
                  color: 'var(--text-muted)', fontStyle: 'italic',
                  border: '1px dashed var(--border)', borderRadius: '6px',
                }}>
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
      )}
    </div>
  );
}
