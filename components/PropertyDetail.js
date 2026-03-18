'use client';

import { useState, useMemo } from 'react';
import { fmt, CATALYST_URGENCY, STAGE_COLORS, LEAD_STAGE_COLORS } from '../lib/constants';
import { updateRow, insertRow, addApn, removeApn } from '../lib/db';
import EditPropertyModal from './EditPropertyModal';
import BuyerMatching from './BuyerMatching';

const NOTE_TYPES = ['Note', 'Intel', 'Call Log', 'Meeting Note', 'Status Update'];

export default function PropertyDetail({
  property: p, deals, leads, contacts, leaseComps, saleComps,
  activities, tasks, accounts, notes: allNotes, followUps: allFollowUps,
  onLeaseCompClick, onSaleCompClick,
  onDealClick, onLeadClick, onContactClick, onAddActivity, onAddTask,
  showToast, onRefresh
}) {
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('Note');
  const [savingNote, setSavingNote] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [fuReason, setFuReason] = useState('');
  const [fuDate, setFuDate] = useState('');
  const [savingFu, setSavingFu] = useState(false);
  const [showFuForm, setShowFuForm] = useState(false);
  const [showApnForm, setShowApnForm] = useState(false);
  const [newApn, setNewApn] = useState('');
  const [newApnAcres, setNewApnAcres] = useState('');
  const [savingApn, setSavingApn] = useState(false);
  // Sort state per tab
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  // Filter state
  const [filterText, setFilterText] = useState('');

  // ─── LINKED RECORDS ────────────────────────────────────────
  const linkedLeads       = (leads || []).filter(l => l.property_id === p.id || l.address === p.address);
  const linkedDeals       = (deals || []).filter(d => d.property_id === p.id || d.address === p.address);
  const linkedContacts    = (contacts || []).filter(c => c.property_id === p.id || c.company === p.owner || c.company === p.tenant);
  const displayLeaseComps = (leaseComps || []).filter(c => c.property_id === p.id || c.address === p.address);
  const displaySaleComps  = (saleComps || []).filter(c => c.property_id === p.id || c.address === p.address);
  const linkedActivities  = (activities || []).filter(a => a.property_id === p.id);
  const linkedTasks       = (tasks || []).filter(t => t.property_id === p.id);
  const linkedNotes       = (allNotes || []).filter(n => n.property_id === p.id);
  const linkedFollowUps   = (allFollowUps || []).filter(f => f.property_id === p.id);

  const avgLeaseRate = displayLeaseComps.length ? (displayLeaseComps.reduce((s, c) => s + (c.rate || 0), 0) / displayLeaseComps.length).toFixed(2) : null;
  const avgSalePsf = displaySaleComps.filter(c => c.price_psf).length ? Math.round(displaySaleComps.filter(c => c.price_psf).reduce((s, c) => s + c.price_psf, 0) / displaySaleComps.filter(c => c.price_psf).length) : null;
  const pendingTasks = linkedTasks.filter(t => !t.completed).length;

  // ─── TIMELINE ──────────────────────────────────────────────
  const timeline = [
    ...linkedActivities.map(a => ({ kind: 'activity', id: a.id, date: a.activity_date || a.created_at, icon: a.activity_type === 'Call' ? '📞' : a.activity_type === 'Email' ? '✉️' : a.activity_type === 'Meeting' ? '🤝' : '✓', label: a.activity_type, subject: a.subject, detail: a.notes, outcome: a.outcome })),
    ...linkedNotes.map(n => ({ kind: 'note', id: n.id, date: n.created_at, icon: n.note_type === 'Intel' ? '🔍' : n.note_type === 'Call Log' ? '📞' : n.note_type === 'Meeting Note' ? '🤝' : n.note_type === 'Status Update' ? '📌' : '📝', label: n.note_type || 'Note', subject: null, detail: n.content, pinned: n.pinned })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // ─── SORT + FILTER HELPERS ─────────────────────────────────
  const toggleSort = (key) => {
    if (sortKey === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortKey(key); setSortDir('asc'); }
  };
  const sortIndicator = (key) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  function sortAndFilter(rows, textFields) {
    let r = rows;
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      r = r.filter(row => textFields.some(f => {
        const v = row[f];
        return v && String(v).toLowerCase().includes(q);
      }));
    }
    if (sortKey) {
      r = [...r].sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey];
        if (va == null) return 1; if (vb == null) return -1;
        if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
        va = String(va).toLowerCase(); vb = String(vb).toLowerCase();
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return r;
  }

  // Reset sort/filter when tab changes
  const changeTab = (tab) => { setActiveTab(tab); setSortKey(null); setSortDir('asc'); setFilterText(''); };

  // ─── HELPERS ───────────────────────────────────────────────
  const urgencyBadge = (tag) => {
    const level = CATALYST_URGENCY?.[tag];
    if (level === 'immediate') return 'tag-red';
    if (level === 'high') return 'tag-amber';
    if (level === 'medium') return 'tag-blue';
    return 'tag-ghost';
  };
  const probColor = (v) => v >= 75 ? '#22c55e' : v >= 50 ? '#f59e0b' : '#6b7280';
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
    if (diff === 0) return 'Today'; if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`; if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ─── ACTIONS ───────────────────────────────────────────────
  const handleAddNote = async () => {
    if (!noteText.trim()) return; setSavingNote(true);
    try { await insertRow('notes', { content: noteText.trim(), note_type: noteType, property_id: p.id }); setNoteText(''); setNoteType('Note'); setShowNoteForm(false); onRefresh?.(); showToast?.('Note added'); }
    catch (err) { console.error(err); } finally { setSavingNote(false); }
  };
  const handleAddFollowUp = async () => {
    if (!fuReason.trim() || !fuDate) return; setSavingFu(true);
    try { await insertRow('follow_ups', { reason: fuReason.trim(), due_date: fuDate, property_id: p.id }); setFuReason(''); setFuDate(''); setShowFuForm(false); onRefresh?.(); showToast?.('Follow-up set'); }
    catch (err) { console.error(err); } finally { setSavingFu(false); }
  };
  const handleCompleteFu = async (fu) => {
    try { await updateRow('follow_ups', fu.id, { completed: true, completed_at: new Date().toISOString() }); onRefresh?.(); showToast?.('Follow-up done'); }
    catch (err) { console.error(err); }
  };
  const handleAddApn = async () => {
    if (!newApn.trim()) return; setSavingApn(true);
    try { await addApn(p.id, newApn.trim(), newApnAcres ? parseFloat(newApnAcres) : null); setNewApn(''); setNewApnAcres(''); setShowApnForm(false); onRefresh?.(); showToast?.('APN added'); }
    catch (err) { console.error(err); } finally { setSavingApn(false); }
  };
  const handleRemoveApn = async (apnObj) => {
    if (!confirm(`Remove APN ${apnObj.apn}?`)) return;
    try { await removeApn(apnObj.id); onRefresh?.(); showToast?.('APN removed'); }
    catch (err) { console.error(err); }
  };

  // ─── REUSABLE PIECES ──────────────────────────────────────
  const Field = ({ label, value, mono, accent }) => value ? (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: accent ? 'var(--accent)' : 'var(--text-primary)', fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontWeight: accent ? 600 : 400 }}>{value}</div>
    </div>
  ) : null;

  const SectionHeader = ({ title, count, onAdd, addLabel }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</h3>
        {count != null && <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '1px 6px', borderRadius: '10px' }}>{count}</span>}
      </div>
      {onAdd && <button className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }} onClick={onAdd}>{addLabel || '+ Add'}</button>}
    </div>
  );

  // Sortable table header
  const Th = ({ field, children, align }) => (
    <th onClick={() => toggleSort(field)} style={{ padding: '6px 10px', textAlign: align || 'left', fontSize: '12px', fontWeight: 600, color: sortKey === field ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {children}{sortIndicator(field)}
    </th>
  );

  // Filter bar for tab content
  const FilterBar = ({ placeholder }) => (
    <div style={{ marginBottom: '12px' }}>
      <input className="input" value={filterText} onChange={e => setFilterText(e.target.value)} placeholder={placeholder || 'Filter...'} style={{ fontSize: '13px', maxWidth: '300px' }} />
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'leads', label: `Leads${linkedLeads.length ? ` (${linkedLeads.length})` : ''}` },
    { id: 'deals', label: `Deals${linkedDeals.length ? ` (${linkedDeals.length})` : ''}` },
    { id: 'contacts', label: `Contacts${linkedContacts.length ? ` (${linkedContacts.length})` : ''}` },
    { id: 'comps', label: `Comps${displayLeaseComps.length + displaySaleComps.length ? ` (${displayLeaseComps.length + displaySaleComps.length})` : ''}` },
    { id: 'buyers', label: 'Buyer Matches' },
    { id: 'tasks', label: `Tasks${pendingTasks ? ` (${pendingTasks})` : ''}` },
  ];

  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ maxWidth: '1000px' }}>

      {/* ─── 1. HEADER ──────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>{p.address}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{[p.city, p.submarket, p.zip].filter(Boolean).join(' · ')}</span>
              {p.prop_type && <span className="tag tag-ghost" style={{ fontSize: '12px' }}>{p.prop_type}</span>}
              {p.vacancy_status && <span className={`tag ${p.vacancy_status === 'Vacant' ? 'tag-red' : p.vacancy_status === 'Partial' ? 'tag-amber' : 'tag-blue'}`} style={{ fontSize: '12px' }}>{p.vacancy_status}</span>}
              {p.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address+', '+(p.city||'')+', CA')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)' }}>Maps ↗</a>}
              {p.onedrive_url && <a href={p.onedrive_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)' }}>📁 OneDrive ↗</a>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {onAddActivity && <button className="btn btn-ghost btn-sm" onClick={() => onAddActivity(p.id)}>+ Activity</button>}
            {onAddTask && <button className="btn btn-ghost btn-sm" onClick={() => onAddTask(p.id)}>+ Task</button>}
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
          </div>
        </div>
        {p.catalyst_tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
            {p.catalyst_tags.map(tag => <span key={tag} className={`tag ${urgencyBadge(tag)}`} style={{ fontSize: '12px' }}>{tag}</span>)}
          </div>
        )}
        {(p.ai_score != null || p.probability != null || avgLeaseRate || avgSalePsf) && (
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
            {p.ai_score != null && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI Score</span><span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{p.ai_score}</span></div>}
            {p.probability != null && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Probability</span><span style={{ fontSize: '15px', fontWeight: 700, color: probColor(p.probability), fontFamily: 'var(--font-mono)' }}>{p.probability}%</span></div>}
            {avgLeaseRate && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Lease</span><span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>${avgLeaseRate}/SF</span></div>}
            {avgSalePsf && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Sale</span><span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>${avgSalePsf}/SF</span></div>}
          </div>
        )}
      </div>

      {/* ─── 2. TIMELINE ────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timeline</h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }} onClick={() => { setShowNoteForm(!showNoteForm); setShowFuForm(false); }}>{showNoteForm ? 'Cancel' : '+ Note'}</button>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }} onClick={() => { setShowFuForm(!showFuForm); setShowNoteForm(false); }}>{showFuForm ? 'Cancel' : '+ Follow-Up'}</button>
            {onAddActivity && <button className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }} onClick={() => onAddActivity(p.id)}>+ Activity</button>}
          </div>
        </div>

        {showNoteForm && (
          <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '6px', marginBottom: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {NOTE_TYPES.map(t => <button key={t} onClick={() => setNoteType(t)} style={{ padding: '3px 10px', borderRadius: '4px', border: '1px solid', fontSize: '12px', cursor: 'pointer', borderColor: noteType === t ? 'var(--accent)' : 'var(--border)', background: noteType === t ? 'var(--accent-soft)' : 'transparent', color: noteType === t ? 'var(--accent)' : 'var(--text-muted)' }}>{t}</button>)}
            </div>
            <textarea className="textarea" rows={3} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note, intel, or call log..." style={{ marginBottom: '8px', fontSize: '14px' }} />
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNoteForm(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleAddNote} disabled={savingNote || !noteText.trim()}>{savingNote ? 'Saving...' : 'Save Note'}</button>
            </div>
          </div>
        )}

        {showFuForm && (
          <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '6px', marginBottom: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input className="input" style={{ flex: 1, fontSize: '14px' }} placeholder="Follow-up reason..." value={fuReason} onChange={e => setFuReason(e.target.value)} />
              <input className="input" type="date" style={{ width: '160px', fontSize: '14px' }} value={fuDate} onChange={e => setFuDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowFuForm(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleAddFollowUp} disabled={savingFu || !fuReason.trim() || !fuDate}>{savingFu ? 'Saving...' : 'Set Follow-Up'}</button>
            </div>
          </div>
        )}

        {linkedFollowUps.filter(f => !f.completed).length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            {linkedFollowUps.filter(f => !f.completed).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).map(fu => {
              const overdue = new Date(fu.due_date) < new Date(new Date().toDateString());
              return (
                <div key={fu.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '4px', borderRadius: '6px', background: overdue ? 'var(--red-soft)' : 'var(--amber-soft)', border: `1px solid ${overdue ? 'var(--red)' : 'var(--amber)'}33` }}>
                  <span style={{ fontSize: '14px' }}>{overdue ? '⚠' : '🔔'}</span>
                  <div style={{ flex: 1 }}><span style={{ fontSize: '14px', fontWeight: 500, color: overdue ? 'var(--red)' : 'var(--amber)' }}>{fu.reason}</span><span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px', fontFamily: 'var(--font-mono)' }}>{overdue ? 'OVERDUE · ' : ''}{fu.due_date}</span></div>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => handleCompleteFu(fu)}>✓ Done</button>
                </div>
              );
            })}
          </div>
        )}

        {timeline.length === 0 && !p.notes ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No activity yet — add a note or log an activity</div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '24px' }}>
            <div style={{ position: 'absolute', left: '7px', top: '4px', bottom: '4px', width: '2px', background: 'var(--border)', borderRadius: '1px' }} />
            {p.notes && linkedNotes.length === 0 && (
              <div style={{ position: 'relative', paddingBottom: '14px' }}>
                <div style={{ position: 'absolute', left: '-24px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>📝</div>
                <div style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{p.notes}</div>
                </div>
              </div>
            )}
            {timeline.map(item => (
              <div key={item.id} style={{ position: 'relative', paddingBottom: '14px' }}>
                <div style={{ position: 'absolute', left: '-24px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>{item.icon}</div>
                <div style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: item.detail ? '4px' : 0, flexWrap: 'wrap' }}>
                    <span className={`tag ${item.kind === 'note' ? 'tag-purple' : 'tag-blue'}`} style={{ fontSize: '11px' }}>{item.label}</span>
                    {item.subject && <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.subject}</span>}
                    {item.outcome && <span className="tag tag-ghost" style={{ fontSize: '11px' }}>{item.outcome}</span>}
                    {item.pinned && <span style={{ fontSize: '11px', color: 'var(--amber)' }}>📌</span>}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{formatTimeAgo(item.date)}</span>
                  </div>
                  {item.detail && <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── 3. PROPERTY DETAILS + OWNER & TENANT ───────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="card">
          <SectionHeader title="Property Details" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Record Type" value={p.record_type} />
            <Field label="Property Type" value={p.prop_type} />
            <Field label="Building SF" value={p.building_sf ? Number(p.building_sf).toLocaleString() + ' SF' : null} mono accent />
            <Field label="Land" value={p.land_acres ? p.land_acres + ' acres' : null} mono />
            <Field label="Year Built" value={p.year_built} mono />
            <Field label="Clear Height" value={p.clear_height ? p.clear_height + "'" : null} mono />
            <Field label="Dock Doors" value={p.dock_doors != null && p.dock_doors !== '' ? String(p.dock_doors) : null} mono />
            <Field label="Grade Doors" value={p.grade_doors != null && p.grade_doors !== '' ? String(p.grade_doors) : null} mono />
            <Field label="Market" value={p.market} />
            <Field label="Submarket" value={p.submarket} />
          </div>
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>APNs {p.apns?.length > 0 && <span style={{ fontFamily: 'var(--font-mono)' }}>({p.apns.length})</span>}</div>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px' }} onClick={() => setShowApnForm(!showApnForm)}>{showApnForm ? 'Cancel' : '+ APN'}</button>
            </div>
            {showApnForm && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
                <input className="input" placeholder="XXXX-XXX-XXX" value={newApn} onChange={e => setNewApn(e.target.value)} style={{ flex: 2, fontSize: '13px' }} />
                <input className="input" placeholder="Acres" type="number" step="0.01" value={newApnAcres} onChange={e => setNewApnAcres(e.target.value)} style={{ flex: 1, fontSize: '13px' }} />
                <button className="btn btn-primary btn-sm" style={{ fontSize: '11px', flexShrink: 0 }} onClick={handleAddApn} disabled={savingApn || !newApn.trim()}>{savingApn ? '...' : 'Add'}</button>
              </div>
            )}
            {p.apns?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {p.apns.map((a, i) => (
                  <div key={a.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: 'var(--bg-input)', borderRadius: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{a.apn}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {a.acres && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.acres} ac</span>}
                      {a.id && <button onClick={() => handleRemoveApn(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', padding: '0 2px', lineHeight: 1 }} title="Remove">×</button>}
                    </div>
                  </div>
                ))}
              </div>
            ) : !showApnForm && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No APNs recorded</div>}
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Owner & Tenant" />
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid var(--border-subtle)' }}>Owner</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Owner" value={p.owner} />
              <Field label="Owner Type" value={p.owner_type} />
              <Field label="Last Transfer" value={p.last_transfer_date ? fmt.date(p.last_transfer_date) : null} mono />
              <Field label="Last Sale Price" value={p.last_sale_price ? fmt.price(p.last_sale_price) : null} mono accent />
              <Field label="Last Sale $/SF" value={p.price_psf ? '$' + Number(p.price_psf).toLocaleString() + '/SF' : null} mono />
            </div>
            {!p.owner && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>No owner details recorded</div>}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid var(--border-subtle)' }}>Tenant</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Tenant" value={p.tenant} />
              <Field label="Vacancy" value={p.vacancy_status} />
              <Field label="Lease Type" value={p.lease_type} />
              <Field label="In-Place Rent" value={p.in_place_rent ? '$' + Number(p.in_place_rent).toFixed(2) + '/SF/Mo' : null} mono accent />
              <Field label="Market Rent" value={p.market_rent ? '$' + Number(p.market_rent).toFixed(2) + '/SF/Mo' : null} mono />
              <Field label="Lease Expiration" value={p.lease_expiration ? fmt.date(p.lease_expiration) : null} mono />
            </div>
            {!p.tenant && !p.lease_expiration && p.vacancy_status !== 'Vacant' && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>No tenant details recorded</div>}
          </div>
        </div>
      </div>

      {/* ─── 4. TABS ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border)', marginBottom: '16px', overflowX: 'auto' }}>
        {tabs.map(tab => <button key={tab.id} onClick={() => changeTab(tab.id)} style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', background: 'transparent', color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)', borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent', transition: 'all 0.15s' }}>{tab.label}</button>)}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="card">
          <SectionHeader title="Linked Records" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
            {[['Leads', linkedLeads.length, 'leads', '#8b5cf6'], ['Deals', linkedDeals.length, 'deals', '#f97316'], ['Contacts', linkedContacts.length, 'contacts', '#3b82f6'], ['Lease Comps', displayLeaseComps.length, 'comps', '#10b981'], ['Sale Comps', displaySaleComps.length, 'comps', '#22c55e'], ['Tasks', pendingTasks, 'tasks', '#ef4444']].map(([label, count, tab, color]) => (
              <div key={label} onClick={() => changeTab(tab)} style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '6px', cursor: 'pointer', textAlign: 'center', border: '1px solid transparent', transition: 'border-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.borderColor = color} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: count > 0 ? color : 'var(--text-muted)' }}>{count}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEADS — sortable table */}
      {activeTab === 'leads' && (() => {
        const rows = sortAndFilter(linkedLeads, ['lead_name', 'address', 'decision_maker', 'owner', 'tier', 'stage']);
        return (
          <div className="card">
            <SectionHeader title="Leads" count={linkedLeads.length} />
            <FilterBar placeholder="Filter leads..." />
            {rows.length === 0 ? <div style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '16px 0' }}>No leads found</div> : (
              <div className="table-container" style={{ overflowX: 'auto' }}>
                <table><thead><tr>
                  <Th field="lead_name">Lead</Th><Th field="stage">Stage</Th><Th field="tier">Tier</Th>
                  <Th field="score" align="right">Score</Th><Th field="decision_maker">Decision Maker</Th><Th field="next_action">Next Action</Th>
                </tr></thead><tbody>
                  {rows.map(l => (
                    <tr key={l.id} onClick={() => onLeadClick?.(l)} style={{ cursor: 'pointer' }}>
                      <td><div style={{ fontWeight: 500, fontSize: '14px' }}>{l.lead_name}</div>{l.address && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.address}</div>}</td>
                      <td><span style={{ fontSize: '12px', padding: '2px 7px', borderRadius: '4px', background: (LEAD_STAGE_COLORS?.[l.stage]||'#6b7280')+'22', color: LEAD_STAGE_COLORS?.[l.stage]||'#6b7280', fontWeight: 600 }}>{l.stage}</span></td>
                      <td>{l.tier && <span style={{ fontWeight: 700, color: {'A+':'#22c55e',A:'#3b82f6',B:'#f59e0b',C:'#6b7280'}[l.tier]||'#6b7280' }}>{l.tier}</span>}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent)' }}>{l.score ?? '—'}</td>
                      <td style={{ fontSize: '13px' }}>{l.decision_maker || '—'}</td>
                      <td style={{ fontSize: '13px', color: 'var(--amber)' }}>{l.next_action || '—'}</td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            )}
          </div>
        );
      })()}

      {/* DEALS — sortable table */}
      {activeTab === 'deals' && (() => {
        const rows = sortAndFilter(linkedDeals, ['deal_name', 'address', 'deal_type', 'buyer', 'seller', 'stage']);
        return (
          <div className="card">
            <SectionHeader title="Deals" count={linkedDeals.length} />
            <FilterBar placeholder="Filter deals..." />
            {rows.length === 0 ? <div style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '16px 0' }}>No deals found</div> : (
              <div className="table-container" style={{ overflowX: 'auto' }}>
                <table><thead><tr>
                  <Th field="deal_name">Deal</Th><Th field="stage">Stage</Th><Th field="deal_type">Type</Th>
                  <Th field="deal_value" align="right">Value</Th><Th field="commission_est" align="right">Commission</Th><Th field="probability" align="right">Prob</Th>
                </tr></thead><tbody>
                  {rows.map(d => (
                    <tr key={d.id} onClick={() => onDealClick?.(d)} style={{ cursor: 'pointer' }}>
                      <td><div style={{ fontWeight: 500, fontSize: '14px' }}>{d.deal_name}</div>{d.buyer && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.buyer}</div>}</td>
                      <td><span style={{ fontSize: '12px', padding: '2px 7px', borderRadius: '4px', background: (STAGE_COLORS?.[d.stage]||'#6b7280')+'22', color: STAGE_COLORS?.[d.stage]||'#6b7280', fontWeight: 600 }}>{d.stage}</span></td>
                      <td style={{ fontSize: '13px' }}>{d.deal_type || '—'}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>{d.deal_value ? fmt.price(d.deal_value) : '—'}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#22c55e' }}>{d.commission_est ? fmt.price(d.commission_est) : '—'}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{d.probability != null ? d.probability + '%' : '—'}</td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            )}
          </div>
        );
      })()}

      {/* CONTACTS — sortable table */}
      {activeTab === 'contacts' && (() => {
        const rows = sortAndFilter(linkedContacts, ['name', 'company', 'title', 'contact_type', 'phone', 'email']);
        return (
          <div className="card">
            <SectionHeader title="Contacts" count={linkedContacts.length} />
            <FilterBar placeholder="Filter contacts..." />
            {rows.length === 0 ? <div style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '16px 0' }}>No contacts found</div> : (
              <div className="table-container" style={{ overflowX: 'auto' }}>
                <table><thead><tr>
                  <Th field="name">Name</Th><Th field="company">Company</Th><Th field="title">Title</Th>
                  <Th field="contact_type">Type</Th><Th field="phone">Phone</Th><Th field="email">Email</Th>
                </tr></thead><tbody>
                  {rows.map(c => (
                    <tr key={c.id} onClick={() => onContactClick?.(c)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 500, fontSize: '14px' }}>{c.name}</td>
                      <td style={{ fontSize: '13px' }}>{c.company || '—'}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{c.title || '—'}</td>
                      <td>{c.contact_type && <span className="tag tag-blue" style={{ fontSize: '11px' }}>{c.contact_type}</span>}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{c.phone || '—'}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{c.email || '—'}</td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            )}
          </div>
        );
      })()}

      {/* COMPS — sortable tables */}
      {activeTab === 'comps' && (() => {
        const leaseRows = sortAndFilter(displayLeaseComps, ['address', 'tenant', 'lease_type']);
        const saleRows = sortAndFilter(displaySaleComps, ['address', 'buyer', 'sale_type']);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <SectionHeader title="Lease Comps" count={displayLeaseComps.length} />
              <FilterBar placeholder="Filter comps..." />
              {leaseRows.length === 0 ? <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No lease comps linked</div> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>
                    <Th field="address">Address</Th><Th field="tenant">Tenant</Th><Th field="rsf" align="right">SF</Th>
                    <Th field="rate" align="right">Rate</Th><Th field="lease_type">Type</Th><Th field="term_months" align="right">Term</Th>
                    <Th field="start_date">Start</Th><Th field="free_rent_months" align="right">Free Rent</Th><Th field="ti_psf" align="right">TIs</Th>
                  </tr></thead><tbody>
                    {leaseRows.map(c => (
                      <tr key={c.id} onClick={() => onLeaseCompClick?.(c)} style={{ borderBottom: '1px solid var(--border-subtle)', cursor: onLeaseCompClick ? 'pointer' : 'default' }}>
                        <td style={{ padding: '8px 10px', fontSize: '14px', fontWeight: 500 }}>{c.address}</td>
                        <td style={{ padding: '8px 10px', fontSize: '13px', color: 'var(--text-muted)' }}>{c.tenant||'—'}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '13px', textAlign: 'right' }}>{c.rsf ? c.rsf.toLocaleString() : '—'}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '13px', textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>${c.rate}/SF</td>
                        <td style={{ padding: '8px 10px', fontSize: '13px' }}>{c.lease_type||'—'}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '13px', textAlign: 'right' }}>{c.term_months ? c.term_months+'mo' : '—'}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{c.start_date?.slice(0,7)||'—'}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '13px', textAlign: 'right' }}>{c.free_rent_months ? c.free_rent_months+'mo' : '—'}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '13px', textAlign: 'right' }}>{c.ti_psf ? '$'+c.ti_psf : '—'}</td>
                      </tr>
                    ))}
                  </tbody></table>
                  {avgLeaseRate && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'right' }}>Avg rate: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>${avgLeaseRate}/SF NNN</span></div>}
                </div>
              )}
            </div>
            <div className="card">
              <SectionHeader title="Sale Comps" count={displaySaleComps.length} />
              {saleRows.length === 0 ? <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No sale comps linked</div> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>
                    <Th field="address">Address</Th><Th field="building_sf" align="right">SF</Th><Th field="sale_price" align="right">Price</Th>
                    <Th field="price_psf" align="right">$/SF</Th><Th field="cap_rate" align="right">Cap Rate</Th><Th field="sale_date">Date</Th>
                    <Th field="buyer">Buyer</Th><Th field="sale_type">Type</Th>
                  </tr></thead><tbody>
                    {saleRows.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 10px', fontSize: '14px', fontWeight: 500 }}>{c.address}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '13px', textAlign: 'right' }}>{c.building_sf ? c.building_sf.toLocaleString() : '—'}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '13px', textAlign: 'right' }}>{c.sale_price ? fmt.price(c.sale_price) : '—'}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '13px', textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>{c.price_psf ? '$'+Math.round(c.price_psf) : '—'}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '13px', textAlign: 'right' }}>{c.cap_rate ? parseFloat(c.cap_rate).toFixed(2)+'%' : '—'}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{c.sale_date?.slice(0,7)||'—'}</td>
                        <td style={{ padding: '8px 10px', fontSize: '13px' }}>{c.buyer||'—'}</td>
                        <td style={{ padding: '8px 10px', fontSize: '13px' }}>{c.sale_type||'—'}</td>
                      </tr>
                    ))}
                  </tbody></table>
                  {avgSalePsf && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'right' }}>Avg $/SF: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>${avgSalePsf}/SF</span></div>}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* BUYER MATCHES */}
      {activeTab === 'buyers' && <div className="card"><BuyerMatching property={p} accounts={accounts || []} /></div>}

      {/* TASKS — sortable */}
      {activeTab === 'tasks' && (() => {
        const rows = sortAndFilter(linkedTasks, ['title', 'priority', 'due_date']);
        return (
          <div className="card">
            <SectionHeader title="Tasks" count={pendingTasks} onAdd={() => onAddTask?.(p.id)} addLabel="+ Task" />
            <FilterBar placeholder="Filter tasks..." />
            {rows.length === 0 ? <div style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '16px 0' }}>No tasks found</div> : (
              <div className="table-container" style={{ overflowX: 'auto' }}>
                <table><thead><tr>
                  <Th field="completed">Done</Th><Th field="title">Task</Th><Th field="priority">Priority</Th><Th field="due_date">Due</Th>
                </tr></thead><tbody>
                  {rows.map(t => {
                    const pc = {High:'#ef4444',Medium:'#f59e0b',Low:'#6b7280'}[t.priority]||'#6b7280';
                    const overdue = !t.completed && t.due_date && new Date(t.due_date) < new Date();
                    return (
                      <tr key={t.id} style={{ opacity: t.completed ? 0.6 : 1 }}>
                        <td style={{ width: '40px', textAlign: 'center' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '3px', margin: '0 auto', border: '2px solid', borderColor: t.completed ? 'var(--accent)' : pc, background: t.completed ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px' }}>{t.completed ? '✓' : ''}</div>
                        </td>
                        <td style={{ fontSize: '14px', fontWeight: 500, textDecoration: t.completed ? 'line-through' : 'none' }}>{t.title}</td>
                        <td><span style={{ fontSize: '12px', padding: '1px 6px', borderRadius: '3px', background: pc+'22', color: pc, fontWeight: 600 }}>{t.priority}</span></td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: overdue ? 'var(--red)' : 'var(--text-muted)' }}>{overdue ? '⚠ ' : ''}{t.due_date || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody></table>
              </div>
            )}
          </div>
        );
      })()}

      {editing && <EditPropertyModal property={p} onClose={() => setEditing(false)} onSave={() => { setEditing(false); showToast?.('Property updated'); onRefresh?.(); }} />}
    </div>
  );
}
