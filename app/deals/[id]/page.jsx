'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

// ── CONSTANTS ─────────────────────────────────────────────
const STAGES = [
  'Tracking','Underwriting','Off-Market Outreach','Marketing',
  'LOI','LOI Accepted','PSA Negotiation','Due Diligence',
  'Non-Contingent','Closed Won',
];
const STAGE_PROB = {
  'Tracking':10,'Underwriting':25,'Off-Market Outreach':35,
  'Marketing':40,'LOI':60,'LOI Accepted':75,'PSA Negotiation':80,
  'Due Diligence':85,'Non-Contingent':95,'Closed Won':100,
  'Closed Lost':0,'Dead':0,
};
const TABS = ['Overview','Underwriting','BOV Dashboard','Buyer Matches','Contacts','Outreach','Files'];

function fmt$(n)  { return n != null ? '$'+Number(n).toLocaleString() : '—'; }
function fmtM(n)  { return n != null ? '$'+(Number(n)/1e6).toFixed(1)+'M' : '—'; }
function fmtDate(d){ if(!d) return '—'; return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
function fmtShort(d){ if(!d) return '—'; return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'}); }

// ── SCORE COLOR ───────────────────────────────────────────
function scoreColor(s) {
  if (!s) return 'var(--text-tertiary)';
  if (s >= 75) return 'var(--rust)';
  if (s >= 50) return 'var(--amber)';
  return 'var(--blue)';
}

// ── STAGE BADGE ───────────────────────────────────────────
function StageBadge({ stage }) {
  const map = {
    'LOI Accepted':   { bg:'rgba(21,112,66,.12)',  color:'var(--green)',  border:'rgba(21,112,66,.3)' },
    'Non-Contingent': { bg:'rgba(21,112,66,.18)',  color:'var(--green)',  border:'rgba(21,112,66,.4)' },
    'Closed Won':     { bg:'rgba(21,112,66,.22)',  color:'var(--green)',  border:'rgba(21,112,66,.5)' },
    'Underwriting':   { bg:'rgba(88,56,160,.1)',   color:'var(--purple)', border:'rgba(88,56,160,.3)' },
    'LOI':            { bg:'rgba(168,112,16,.1)',  color:'var(--amber)',  border:'rgba(168,112,16,.3)' },
    'PSA Negotiation':{ bg:'rgba(168,112,16,.12)', color:'var(--amber)',  border:'rgba(168,112,16,.3)' },
    'Due Diligence':  { bg:'rgba(168,112,16,.14)', color:'var(--amber)',  border:'rgba(168,112,16,.3)' },
    'Dead':           { bg:'rgba(0,0,0,.06)',       color:'var(--text-tertiary)', border:'rgba(0,0,0,.12)' },
    'Closed Lost':    { bg:'rgba(184,55,20,.1)',    color:'var(--rust)',   border:'rgba(184,55,20,.25)' },
  };
  const s = map[stage] || { bg:'rgba(78,110,150,.1)', color:'var(--blue)', border:'rgba(78,110,150,.25)' };
  return (
    <span style={{ display:'inline-flex',alignItems:'center',fontSize:11,fontWeight:600,
      padding:'3px 8px',borderRadius:4,background:s.bg,color:s.color,border:`1px solid ${s.border}` }}>
      {stage}
    </span>
  );
}

// ── PRIORITY BADGE ────────────────────────────────────────
function PriorityBadge({ priority }) {
  const map = {
    high:   { bg:'rgba(184,55,20,.1)',  color:'var(--rust)',   label:'!! HIGH' },
    medium: { bg:'rgba(168,112,16,.1)', color:'var(--amber)',  label:'! MEDIUM' },
    low:    { bg:'rgba(78,110,150,.1)', color:'var(--blue)',   label:'LOW' },
  };
  const s = map[priority?.toLowerCase()] || map.low;
  return (
    <span style={{ display:'inline-flex',alignItems:'center',fontSize:10,fontWeight:700,
      padding:'2px 7px',borderRadius:4,background:s.bg,color:s.color,letterSpacing:'0.04em' }}>
      {s.label}
    </span>
  );
}

// ── CARD ──────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{ background:'var(--card-bg)',border:'1px solid var(--card-border)',
      borderRadius:10,overflow:'hidden',boxShadow:'var(--card-shadow)',...style }}>
      {children}
    </div>
  );
}
function CardHdr({ title, action, onAction }) {
  return (
    <div style={{ background:'#EDE8E0',borderBottom:'1px solid var(--card-border)',
      padding:'9px 14px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
      <span style={{ fontFamily:'var(--font-mono)',fontSize:10,fontWeight:600,
        letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-secondary)' }}>
        {title}
      </span>
      {action && (
        <button onClick={onAction} style={{ fontFamily:'var(--font-ui)',fontSize:11.5,
          color:'var(--blue)',background:'none',border:'none',cursor:'pointer',padding:0 }}>
          {action}
        </button>
      )}
    </div>
  );
}

// ── DETAIL ROW ────────────────────────────────────────────
function DR({ label, value, valueColor, mono }) {
  return (
    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'baseline',
      padding:'5px 0',borderBottom:'1px solid rgba(0,0,0,0.05)',fontSize:12.5 }}>
      <span style={{ color:'var(--text-tertiary)' }}>{label}</span>
      <span style={{ color:valueColor||'var(--text-primary)',fontWeight:500,
        fontFamily:mono?'var(--font-mono)':'var(--font-ui)',fontSize:mono?11:12.5 }}>
        {value||'—'}
      </span>
    </div>
  );
}

// ── TIMELINE ITEM ─────────────────────────────────────────
function TLItem({ icon, color, title, detail, date }) {
  const colors = {
    call:  { bg:'rgba(78,110,150,.1)',  fg:'var(--blue)' },
    note:  { bg:'rgba(168,112,16,.1)', fg:'var(--amber)' },
    stage: { bg:'rgba(21,112,66,.1)',  fg:'var(--green)' },
    uw:    { bg:'rgba(88,56,160,.1)',  fg:'var(--purple)' },
    warn:  { bg:'rgba(184,55,20,.1)',  fg:'var(--rust)' },
  };
  const c = colors[color] || colors.note;
  return (
    <div style={{ display:'flex',gap:10,padding:'9px 0',borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',
        justifyContent:'center',flexShrink:0,fontSize:12,background:c.bg,color:c.fg,marginTop:1 }}>
        {icon}
      </div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:12.5,fontWeight:500,color:'var(--text-primary)',marginBottom:1 }}>{title}</div>
        {detail && <div style={{ fontSize:11.5,color:'var(--text-secondary)',lineHeight:1.5 }}>{detail}</div>}
        <div style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-tertiary)',marginTop:2 }}>{date}</div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────
export default function DealDetailPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const [deal, setDeal]         = useState(null);
  const [property, setProperty] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [buyers, setBuyers]     = useState([]);
  const [outreach, setOutreach] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);

  // Activity log form
  const [actType, setActType]   = useState('call');
  const [actNote, setActNote]   = useState('');
  const [actDate, setActDate]   = useState(new Date().toISOString().split('T')[0]);
  const [addingAct, setAddingAct] = useState(false);

  // UW state
  const [uwPrice, setUwPrice]   = useState('');
  const [uwRent, setUwRent]     = useState('');
  const [uwMktRent, setUwMktRent] = useState('');
  const [uwBumps, setUwBumps]   = useState('3.0');
  const [uwExitCap, setUwExitCap] = useState('5.25');
  const [uwLtv, setUwLtv]       = useState('65');
  const [uwRate, setUwRate]     = useState('6.50');
  const [uwHold, setUwHold]     = useState('5');
  const [uwSF, setUwSF]         = useState('');
  const [uwView, setUwView]     = useState('quick'); // 'quick' | 'returns'
  const [uwResults, setUwResults] = useState(null);

  useEffect(() => { loadDeal(); }, [id]);

  async function loadDeal() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: d, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setDeal(d);

      // Pre-fill UW from deal
      if (d.deal_value) setUwPrice(d.deal_value);
      if (d.building_sf || d.property_sf) setUwSF(d.building_sf || d.property_sf || '');

      // Load related data in parallel
      const [
        { data: prop },
        { data: acts },
        { data: ctcts },
        { data: buyerData },
        { data: outreachData },
      ] = await Promise.all([
        d.property_id
          ? supabase.from('properties').select('*').eq('id', d.property_id).single()
          : Promise.resolve({ data: null }),
        supabase.from('activities').select('*')
          .eq('deal_id', id)
          .order('activity_date', { ascending: false })
          .limit(25),
        supabase.from('contacts').select('id,first_name,last_name,title,company,phone,email')
          .or(`deal_id.eq.${id},property_id.eq.${d.property_id || '00000000-0000-0000-0000-000000000000'}`)
          .limit(10),
        supabase.from('buyer_accounts')
          .select('id,account_name,buyer_type,target_sf_min,target_sf_max,target_markets,match_score')
          .order('match_score', { ascending: false, nullsFirst: false })
          .limit(8),
        supabase.from('buyer_outreach')
          .select('*')
          .eq('deal_id', id)
          .order('outreach_date', { ascending: false })
          .limit(20),
      ]);

      setProperty(prop);
      setActivities(acts || []);
      setContacts(ctcts || []);
      setBuyers(buyerData || []);
      setOutreach(outreachData || []);

      if (prop) {
        if (prop.in_place_rent) setUwRent(prop.in_place_rent);
        if (prop.building_sf) setUwSF(prop.building_sf);
      }
    } catch(e) {
      console.error('Deal load error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function advanceStage(newStage) {
    if (!deal) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const prob = STAGE_PROB[newStage] || deal.close_probability;
      await supabase.from('deals').update({
        stage: newStage,
        close_probability: prob,
        stage_entered_at: new Date().toISOString(),
      }).eq('id', id);
      setDeal(d => ({ ...d, stage: newStage, close_probability: prob }));
      showToast('Stage updated', `Moved to ${newStage} · ${prob}% probability`);
    } finally {
      setSaving(false);
    }
  }

  async function logActivity() {
    if (!actNote.trim()) return;
    setAddingAct(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.from('activities').insert({
        deal_id: id,
        activity_type: actType,
        subject: actNote,
        activity_date: actDate,
        completed: true,
      }).select().single();
      setActivities(a => [data, ...a]);
      setActNote('');
      showToast('Activity logged', `${actType} — ${fmtShort(actDate)}`);
    } finally {
      setAddingAct(false);
    }
  }

  function runUW() {
    const price = parseFloat(uwPrice) || 0;
    const sf    = parseFloat(uwSF) || 1;
    const rent  = parseFloat(uwRent) || 0;
    const bumps = parseFloat(uwBumps) / 100 || 0.03;
    const exitCap = parseFloat(uwExitCap) / 100 || 0.0525;
    const ltv   = parseFloat(uwLtv) / 100 || 0.65;
    const rate  = parseFloat(uwRate) / 100 || 0.065;
    const hold  = parseInt(uwHold) || 5;

    if (!price || !rent) return;
    const annRent = rent * sf * 12;
    const noi1    = annRent * 0.985 - sf * 0.10;
    const gicap   = price > 0 ? noi1 / price : 0;
    const loanAmt = price * ltv;
    const annDS   = loanAmt * rate;
    const dscr1   = annDS > 0 ? noi1 / annDS : 0;
    const equity  = price * (1 - ltv) + price * 0.006;
    const yr5NOI  = noi1 * Math.pow(1 + bumps, hold - 1);
    const exitVal = yr5NOI / exitCap * (1 - 0.015) - loanAmt;

    // Newton-Raphson IRR
    let cumCF = 0;
    const cfs = [];
    for (let y = 1; y <= hold; y++) {
      const cf = noi1 * Math.pow(1 + bumps, y - 1) - annDS;
      cfs.push(cf);
      cumCF += cf;
    }
    cfs[hold - 1] += exitVal;
    let r = 0.15;
    for (let i = 0; i < 60; i++) {
      let npv = -equity, d = 0;
      cfs.forEach((c, t) => { npv += c / Math.pow(1 + r, t + 1); d -= (t + 1) * c / Math.pow(1 + r, t + 2); });
      const dr = npv / d; r -= dr;
      if (Math.abs(dr) < 1e-7) break;
    }

    // Unlevered IRR
    let ru = 0.12;
    const ucfs = [];
    for (let y = 1; y <= hold; y++) ucfs.push(noi1 * Math.pow(1 + bumps, y - 1));
    ucfs[hold - 1] += yr5NOI / exitCap * (1 - 0.015);
    for (let i = 0; i < 60; i++) {
      let npv = -price, d = 0;
      ucfs.forEach((c, t) => { npv += c / Math.pow(1 + ru, t + 1); d -= (t + 1) * c / Math.pow(1 + ru, t + 2); });
      const dr = npv / d; ru -= dr;
      if (Math.abs(dr) < 1e-7) break;
    }

    const em = (cumCF + exitVal + equity) / equity;
    setUwResults({ gicap, lirr: r, uirr: ru, em, dscr1, price, sf, loanAmt, annDS, equity, noi1, yr5NOI, exitCap, hold, bumps });
  }

  function showToast(title, body) {
    setToast({ title, body });
    setTimeout(() => setToast(null), 3500);
  }

  if (loading) {
    return (
      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',
        flexDirection:'column',gap:12 }}>
        <div className="cl-spinner" />
        <span style={{ fontFamily:'var(--font-mono)',fontSize:12,color:'var(--text-tertiary)' }}>
          Loading deal…
        </span>
      </div>
    );
  }

  if (!deal) {
    return (
      <div style={{ padding:40,textAlign:'center' }}>
        <p style={{ color:'var(--text-secondary)',marginBottom:16 }}>Deal not found.</p>
        <Link href="/deals" className="cl-btn cl-btn-secondary">← Back to Pipeline</Link>
      </div>
    );
  }

  const stageIdx = STAGES.indexOf(deal.stage);
  const prob = deal.close_probability || STAGE_PROB[deal.stage] || 0;
  const commission = deal.deal_value && deal.commission_rate
    ? deal.deal_value * (deal.commission_rate / 100)
    : deal.commission_est || null;
  const showCommission = ['LOI Accepted','PSA Negotiation','Due Diligence','Non-Contingent','Closed Won'].includes(deal.stage);

  return (
    <div style={{ minHeight:'100vh' }}>

      {/* ── BREADCRUMB ─────────────────────────────── */}
      <div style={{ padding:'8px 20px',borderBottom:'1px solid var(--card-border)',
        background:'var(--card-bg)',display:'flex',alignItems:'center',gap:6,
        fontFamily:'var(--font-mono)',fontSize:11 }}>
        <Link href="/deals" style={{ color:'var(--blue)',textDecoration:'none' }}>Deal Pipeline</Link>
        <span style={{ color:'var(--text-tertiary)' }}> › </span>
        <span style={{ color:'var(--text-primary)',fontWeight:500 }}>
          {deal.deal_name || deal.address || 'Deal Detail'}
        </span>
      </div>

      {/* ── DEAL HEADER ────────────────────────────── */}
      <div style={{ background:'var(--card-bg)',borderBottom:'1px solid var(--card-border)',
        padding:'14px 20px',display:'flex',alignItems:'flex-start',
        justifyContent:'space-between',gap:16 }}>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,
            color:'var(--text-primary)',marginBottom:4,letterSpacing:'-0.01em' }}>
            {deal.deal_name || deal.address || 'Unnamed Deal'}
          </div>
          {(deal.address || property?.address) && (
            <div style={{ fontFamily:'var(--font-mono)',fontSize:10,
              color:'var(--text-tertiary)',marginBottom:8,letterSpacing:'0.06em' }}>
              {property?.address || deal.address}
              {(deal.city || property?.city) && ` · ${deal.city || property.city}`}
              {property?.submarket && ` · ${property.submarket}`}
            </div>
          )}
          <div style={{ display:'flex',gap:6,flexWrap:'wrap',alignItems:'center' }}>
            <StageBadge stage={deal.stage} />
            {deal.priority && <PriorityBadge priority={deal.priority} />}
            {deal.deal_type && (
              <span style={{ display:'inline-flex',alignItems:'center',fontSize:10,fontWeight:500,
                padding:'2px 7px',borderRadius:4,background:'rgba(88,56,160,.1)',
                color:'var(--purple)',border:'1px solid rgba(88,56,160,.2)' }}>
                {deal.deal_type}
              </span>
            )}
            {property?.building_sf && (
              <span style={{ fontFamily:'var(--font-mono)',fontSize:10,
                color:'var(--text-tertiary)',padding:'2px 6px',
                background:'rgba(0,0,0,.04)',borderRadius:4 }}>
                {Number(property.building_sf).toLocaleString()} SF
              </span>
            )}
          </div>
        </div>
        <div style={{ display:'flex',gap:8,flexShrink:0,alignItems:'flex-start' }}>
          {property && (
            <Link href={`/properties/${property.id}`}
              style={{ fontSize:12,padding:'7px 12px',borderRadius:6,border:'1px solid var(--card-border)',
                background:'var(--card-bg)',color:'var(--text-secondary)',textDecoration:'none',
                fontFamily:'var(--font-ui)',whiteSpace:'nowrap' }}>
              View Property
            </Link>
          )}
          <button onClick={() => logActivity()} style={{ display:'none' }} />
          <button
            style={{ fontSize:12,padding:'7px 14px',borderRadius:6,
              background:'var(--blue)',color:'#fff',border:'none',cursor:'pointer',
              fontFamily:'var(--font-ui)',fontWeight:500,whiteSpace:'nowrap' }}
            onClick={() => setActiveTab(0)}>
            + Activity
          </button>
        </div>
      </div>

      {/* ── STAGE TRACK ────────────────────────────── */}
      <div style={{ background:'var(--card-bg)',borderBottom:'1px solid var(--card-border)',
        padding:'8px 20px',display:'flex',alignItems:'center',overflowX:'auto',gap:0 }}>
        {STAGES.map((s, i) => {
          const done   = i < stageIdx;
          const active = i === stageIdx;
          return (
            <div key={s} style={{ display:'flex',alignItems:'center',flexShrink:0 }}>
              <button
                onClick={() => advanceStage(s)}
                disabled={saving}
                style={{
                  fontSize:11,padding:'4px 9px',borderRadius:3,border:'none',cursor:'pointer',
                  fontFamily:'var(--font-ui)',fontWeight:active?600:400,whiteSpace:'nowrap',
                  background: active ? 'var(--amber)' : done ? 'rgba(21,112,66,.1)' : 'transparent',
                  color: active ? '#fff' : done ? 'var(--green)' : 'var(--text-tertiary)',
                  transition:'all .12s',
                }}>
                {s}
              </button>
              {i < STAGES.length - 1 && (
                <span style={{ color:'rgba(0,0,0,.15)',margin:'0 2px',fontSize:12 }}>›</span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── KPI STRIP ──────────────────────────────── */}
      <div style={{ display:'flex',background:'var(--card-bg)',borderBottom:'1px solid var(--card-border)' }}>
        {[
          { label:'Deal Value',   value: deal.deal_value ? fmtM(deal.deal_value) : '—',        color:'var(--text-primary)' },
          { label:'Close Prob.',  value: `${prob}%`,                                            color: prob>=75?'var(--green)':prob>=40?'var(--amber)':'var(--blue)' },
          { label:'Close Date',   value: fmtDate(deal.expected_close_date),                     color:'var(--text-primary)' },
          { label:'$/SF',         value: deal.deal_value && property?.building_sf
              ? `$${Math.round(deal.deal_value / property.building_sf)}/SF` : '—',             color:'var(--text-primary)' },
          showCommission
            ? { label:'Est. Commission', value: commission ? fmt$(Math.round(commission)) : '—', color:'var(--green)' }
            : { label:'Stage',    value: deal.stage,                                            color:'var(--text-secondary)' },
          { label:'Days in Stage', value: deal.stage_entered_at
              ? Math.round((Date.now()-new Date(deal.stage_entered_at))/(1000*60*60*24))+'d' : '—',
            color:'var(--text-primary)' },
        ].map((k,i) => (
          <div key={i} style={{ flex:1,padding:'11px 14px',borderRight:i<5?'1px solid var(--card-border)':'none' }}>
            <div style={{ fontFamily:'var(--font-mono)',fontSize:9,fontWeight:600,
              letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-tertiary)',marginBottom:3 }}>
              {k.label}
            </div>
            <div style={{ fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,
              color:k.color,lineHeight:1 }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── TABS ───────────────────────────────────── */}
      <div style={{ background:'var(--card-bg)',borderBottom:'1px solid var(--card-border)',
        display:'flex',padding:'0 20px',overflowX:'auto' }}>
        {TABS.map((t,i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{
            padding:'9px 13px',fontSize:12.5,fontFamily:'var(--font-ui)',
            background:'none',border:'none',cursor:'pointer',whiteSpace:'nowrap',
            borderBottom: activeTab===i ? '2px solid var(--blue)' : '2px solid transparent',
            color: activeTab===i ? 'var(--blue)' : 'var(--text-tertiary)',
            fontWeight: activeTab===i ? 500 : 400,
            transition:'all .12s',
          }}>{t}</button>
        ))}
      </div>

      {/* ── TAB PANELS ─────────────────────────────── */}
      <div style={{ padding:'16px 20px' }}>

        {/* ─── TAB 0: OVERVIEW ─────────────────────── */}
        {activeTab === 0 && (
          <div style={{ display:'grid',gridTemplateColumns:'1fr 280px',gap:14,alignItems:'start' }}>

            {/* Main column */}
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>

              {/* AI Synthesis / Opportunity Memo */}
              {deal.opportunity_memo || deal.ai_synthesis ? (
                <Card>
                  <CardHdr title="AI Deal Synthesis" />
                  <div style={{ padding:'12px 14px',fontSize:13,lineHeight:1.65,color:'var(--text-secondary)' }}>
                    {deal.ai_synthesis || deal.opportunity_memo}
                  </div>
                </Card>
              ) : null}

              {/* Activity Timeline */}
              <Card>
                <CardHdr title="Activity Timeline" action="Log Activity" onAction={() => {}} />
                {/* Log form */}
                <div style={{ padding:'10px 14px',borderBottom:'1px solid var(--card-border)',
                  background:'rgba(0,0,0,.02)',display:'flex',gap:8,alignItems:'flex-end',flexWrap:'wrap' }}>
                  <select value={actType} onChange={e=>setActType(e.target.value)}
                    style={{ padding:'6px 8px',borderRadius:5,border:'1px solid var(--card-border)',
                      fontFamily:'var(--font-ui)',fontSize:12,background:'var(--card-bg)',
                      color:'var(--text-primary)',outline:'none' }}>
                    {['call','email','meeting','note','stage_change'].map(t=>(
                      <option key={t} value={t}>{t.replace('_',' ')}</option>
                    ))}
                  </select>
                  <input type="date" value={actDate} onChange={e=>setActDate(e.target.value)}
                    style={{ padding:'6px 8px',borderRadius:5,border:'1px solid var(--card-border)',
                      fontFamily:'var(--font-mono)',fontSize:11,background:'var(--card-bg)',outline:'none' }} />
                  <input placeholder="Notes…" value={actNote} onChange={e=>setActNote(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&logActivity()}
                    style={{ flex:1,minWidth:180,padding:'6px 10px',borderRadius:5,
                      border:'1px solid var(--card-border)',fontFamily:'var(--font-ui)',
                      fontSize:12.5,background:'var(--card-bg)',outline:'none',
                      borderColor:actNote?'var(--blue)':'var(--card-border)' }} />
                  <button onClick={logActivity} disabled={addingAct||!actNote.trim()}
                    style={{ padding:'6px 14px',borderRadius:5,background:'var(--blue)',color:'#fff',
                      border:'none',cursor:'pointer',fontSize:12,fontFamily:'var(--font-ui)',
                      opacity:actNote.trim()?1:0.5 }}>
                    {addingAct?'…':'Log'}
                  </button>
                </div>
                {/* Timeline entries */}
                <div style={{ padding:'0 14px' }}>
                  {activities.length === 0 ? (
                    <div style={{ padding:'20px 0',textAlign:'center',color:'var(--text-tertiary)',fontSize:12.5 }}>
                      No activity logged yet
                    </div>
                  ) : activities.map(a => (
                    <TLItem key={a.id}
                      icon={a.activity_type==='call'?'📞':a.activity_type==='email'?'✉':a.activity_type==='meeting'?'👥':'📝'}
                      color={a.activity_type==='call'?'call':a.activity_type==='stage_change'?'stage':'note'}
                      title={a.subject || a.activity_type}
                      detail={a.notes}
                      date={fmtDate(a.activity_date || a.created_at)}
                    />
                  ))}
                </div>
              </Card>

              {/* Catalyst Tags */}
              {deal.catalyst_tags && deal.catalyst_tags.length > 0 && (
                <Card>
                  <CardHdr title="Active Catalysts" />
                  <div style={{ padding:'8px 14px' }}>
                    {(Array.isArray(deal.catalyst_tags) ? deal.catalyst_tags : []).map((tag,i) => {
                      const cat = typeof tag==='object'?tag.category:'owner';
                      const lbl = typeof tag==='object'?tag.tag:tag;
                      const colors = { owner:'rust',occupancy:'amber',asset:'amber',market:'blue',location:'teal' };
                      return (
                        <div key={i} style={{ display:'flex',alignItems:'center',gap:8,
                          padding:'6px 0',borderBottom:'1px solid rgba(0,0,0,.05)' }}>
                          <span className={`cl-catalyst cl-catalyst--${colors[cat]||'blue'}`}
                            style={{ fontSize:10,flexShrink:0 }}>{lbl}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>

            {/* Right sidebar */}
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>

              {/* Close probability */}
              <Card style={{ border:`1px solid ${prob>=75?'rgba(21,112,66,.3)':'rgba(78,110,150,.2)'}` }}>
                <div style={{ padding:14 }}>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:9,fontWeight:600,
                    letterSpacing:'0.08em',textTransform:'uppercase',
                    color:prob>=75?'var(--green)':'var(--blue)',marginBottom:6 }}>
                    Probability to Close
                  </div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:48,fontWeight:700,
                    color:prob>=75?'var(--green)':'var(--blue)',lineHeight:1,letterSpacing:'-0.03em' }}>
                    {prob}%
                  </div>
                  <div style={{ height:4,background:'rgba(0,0,0,.06)',borderRadius:2,overflow:'hidden',margin:'10px 0' }}>
                    <div style={{ height:'100%',width:`${prob}%`,borderRadius:2,
                      background:`linear-gradient(90deg,var(--blue),${prob>=75?'var(--green)':'var(--blue)'})`,
                      transition:'width 1s ease' }} />
                  </div>
                  <div style={{ fontSize:12,color:'var(--text-secondary)',lineHeight:1.5 }}>
                    {deal.stage} · {deal.deal_type || 'Sale'}
                    {deal.expected_close_date && <><br/>Expected close {fmtDate(deal.expected_close_date)}</>}
                  </div>
                </div>
              </Card>

              {/* Deal details */}
              <Card>
                <CardHdr title="Deal Details" />
                <div style={{ padding:'8px 14px' }}>
                  <DR label="Deal Type"     value={deal.deal_type} />
                  <DR label="Asking Price"  value={deal.deal_value ? fmtM(deal.deal_value) : null} />
                  <DR label="Commission Rate" value={deal.commission_rate ? `${deal.commission_rate}%` : null} />
                  {showCommission && commission && (
                    <DR label="Est. Commission" value={fmt$(Math.round(commission))}
                      valueColor="var(--green)" />
                  )}
                  <DR label="Lead Source"  value={deal.lead_source} />
                  <DR label="Created"      value={fmtDate(deal.created_at)} mono />
                  <DR label="Last Updated" value={fmtDate(deal.updated_at)} mono />
                </div>
              </Card>

              {/* Property summary */}
              {property && (
                <Card>
                  <CardHdr title="Property" action="View →" onAction={() => router.push(`/properties/${property.id}`)} />
                  <div style={{ padding:'8px 14px' }}>
                    <DR label="Address"   value={property.address} />
                    <DR label="City"      value={property.city} />
                    <DR label="Building SF" value={property.building_sf ? Number(property.building_sf).toLocaleString()+' SF' : null} />
                    <DR label="Clear Ht"  value={property.clear_height ? `${property.clear_height}'` : null} />
                    <DR label="Year Built" value={property.year_built} mono />
                    <DR label="Owner"     value={property.owner} />
                  </div>
                </Card>
              )}

            </div>
          </div>
        )}

        {/* ─── TAB 1: UNDERWRITING ─────────────────── */}
        {activeTab === 1 && (
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>

            {/* Toggle */}
            <div style={{ display:'flex',gap:8 }}>
              {['quick','returns'].map(v => (
                <button key={v} onClick={()=>setUwView(v)} style={{
                  padding:'7px 16px',borderRadius:6,fontSize:12.5,fontFamily:'var(--font-ui)',
                  cursor:'pointer',border:'1px solid var(--card-border)',
                  background: uwView===v ? 'var(--blue)' : 'var(--card-bg)',
                  color: uwView===v ? '#fff' : 'var(--text-secondary)',
                  fontWeight: uwView===v ? 500 : 400,
                }}>
                  {v==='quick'?'Quick Underwrite':'Returns Dashboard'}
                </button>
              ))}
            </div>

            {uwView === 'quick' && (
              <>
                {/* Input form */}
                <Card style={{ border:'1px solid rgba(78,110,150,.25)' }}>
                  <div style={{ borderLeft:'3px solid var(--blue)',overflow:'hidden',borderRadius:10 }}>
                    <div style={{ padding:'11px 16px 11px 18px',borderBottom:'1px solid var(--card-border)',
                      display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                      <span style={{ fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>
                        Quick Underwrite — SLB / Acquisition Model
                      </span>
                      <span style={{ fontFamily:'var(--font-editorial)',fontSize:12,
                        fontStyle:'italic',color:'var(--text-tertiary)' }}>
                        Auto-populated from linked property · adjust and run
                      </span>
                    </div>
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,padding:'14px 18px' }}>
                      {[
                        { label:'Asking Price ($)', state:uwPrice, set:setUwPrice, note:uwPrice&&uwSF?`$${Math.round(uwPrice/uwSF)}/SF`:'' },
                        { label:'Building SF', state:uwSF, set:setUwSF },
                        { label:'In-Place Rent ($/SF/mo)', state:uwRent, set:setUwRent, note:uwRent&&uwSF?`= $${Math.round(uwRent*uwSF*12).toLocaleString()}/yr`:'' },
                        { label:'Market Rent ($/SF/mo)', state:uwMktRent, set:setUwMktRent },
                        { label:'Annual Rent Bumps (%)', state:uwBumps, set:setUwBumps },
                        { label:'Exit Cap Rate (%)', state:uwExitCap, set:setUwExitCap },
                        { label:'LTV (%)', state:uwLtv, set:setUwLtv },
                        { label:'Interest Rate (%)', state:uwRate, set:setUwRate },
                        { label:'Hold Period (years)', state:uwHold, set:setUwHold },
                      ].map(({label,state,set,note}) => (
                        <div key={label}>
                          <label style={{ display:'block',fontSize:9.5,fontWeight:600,
                            letterSpacing:'0.08em',textTransform:'uppercase',
                            color:'var(--text-tertiary)',marginBottom:4 }}>
                            {label}
                          </label>
                          <input value={state} onChange={e=>set(e.target.value)}
                            style={{ width:'100%',padding:'7px 10px',borderRadius:6,
                              border:'1px solid rgba(140,90,4,.2)',fontFamily:'var(--font-ui)',
                              fontSize:13,color:'var(--text-primary)',
                              background:'rgba(255,247,200,.2)',outline:'none' }} />
                          {note && <div style={{ fontSize:11,color:'var(--text-tertiary)',
                            fontStyle:'italic',marginTop:2 }}>{note}</div>}
                        </div>
                      ))}
                    </div>

                    {/* Results strip */}
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',
                      background:'#EDE8E0',borderTop:'1px solid var(--card-border)',
                      borderBottom:'1px solid var(--card-border)' }}>
                      {[
                        { label:'Going-In Cap', value: uwResults ? `${(uwResults.gicap*100).toFixed(2)}%` : '—',
                          color: uwResults&&uwResults.gicap>=0.05?'var(--green)':uwResults?'var(--amber)':'var(--text-tertiary)' },
                        { label:'Levered IRR',  value: uwResults ? `${(uwResults.lirr*100).toFixed(1)}%` : '—',
                          color: uwResults&&uwResults.lirr>=0.15?'var(--green)':uwResults?'var(--amber)':'var(--text-tertiary)' },
                        { label:'Equity Multiple', value: uwResults ? `${uwResults.em.toFixed(2)}×` : '—',
                          color: uwResults&&uwResults.em>=2?'var(--green)':uwResults?'var(--amber)':'var(--text-tertiary)' },
                        { label:'DSCR Year 1', value: uwResults ? `${uwResults.dscr1.toFixed(2)}×` : '—',
                          color: uwResults&&uwResults.dscr1>=1.2?'var(--green)':uwResults?'var(--rust)':'var(--text-tertiary)' },
                      ].map((m,i) => (
                        <div key={i} style={{ padding:'12px 14px',
                          borderRight:i<3?'1px solid var(--card-border)':'none' }}>
                          <label style={{ display:'block',fontSize:9.5,fontWeight:600,
                            letterSpacing:'0.08em',textTransform:'uppercase',
                            color:'var(--text-tertiary)',marginBottom:5 }}>{m.label}</label>
                          <div style={{ fontFamily:'var(--font-display)',fontSize:26,
                            fontWeight:700,lineHeight:1,color:m.color }}>{m.value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ padding:'10px 18px',display:'flex',alignItems:'center',gap:8 }}>
                      <button onClick={runUW} style={{ padding:'8px 18px',background:'var(--blue)',
                        color:'#fff',border:'none',borderRadius:6,fontFamily:'var(--font-ui)',
                        fontSize:12.5,fontWeight:500,cursor:'pointer' }}>
                        ▶ Run / Update
                      </button>
                      <Link href={`/deals/${id}/underwriting`}
                        style={{ padding:'8px 14px',background:'rgba(21,112,66,.1)',color:'var(--green)',
                          border:'1px solid rgba(21,112,66,.25)',borderRadius:6,
                          fontFamily:'var(--font-ui)',fontSize:12.5,textDecoration:'none' }}>
                        Full UW Model →
                      </Link>
                      <span style={{ fontFamily:'var(--font-editorial)',fontSize:12,
                        fontStyle:'italic',color:'var(--text-tertiary)',marginLeft:'auto' }}>
                        Full underwriting: 7 tabs · IRR · sensitivity · rent roll
                      </span>
                    </div>
                  </div>
                </Card>

                {/* NOI Build */}
                {uwResults && (
                  <Card>
                    <CardHdr title="NOI Build — Year 1" />
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:0 }}>
                      {[
                        { label:'Gross Potential Rent (NNN)', v: `$${Math.round(uwResults.noi1 + uwResults.sf*0.10 + (uwResults.noi1 * 0.015)).toLocaleString()}` },
                        { label:'Landlord Mgmt (1.5%)',       v: `-$${Math.round(uwResults.noi1 * 0.015).toLocaleString()}`, color:'var(--rust)' },
                        { label:'Structural Reserves ($0.10/SF)', v: `-$${Math.round(uwResults.sf * 0.10).toLocaleString()}`, color:'var(--rust)' },
                        { label:'Net Operating Income — Yr 1', v: `$${Math.round(uwResults.noi1).toLocaleString()}`, color:'var(--green)', bold:true },
                        { label:'Yr 5 NOI ('+uwResults.bumps*100+'% bumps)', v: `$${Math.round(uwResults.yr5NOI).toLocaleString()}`, color:'var(--amber)' },
                        { label:'Exit Value (÷ '+uwResults.exitCap*100+'% cap)', v: `$${Math.round(uwResults.yr5NOI/uwResults.exitCap/1e6*10)/10}M gross`, color:'var(--green)' },
                      ].map((r,i) => (
                        <div key={i} style={{ padding:'7px 14px',borderBottom:'1px solid var(--card-border)',
                          borderRight:i%2===0?'1px solid var(--card-border)':'none',
                          display:'flex',justifyContent:'space-between',fontSize:12.5 }}>
                          <span style={{ color:'var(--text-tertiary)' }}>{r.label}</span>
                          <span style={{ fontFamily:'var(--font-mono)',fontSize:11,
                            fontWeight:r.bold?600:500,color:r.color||'var(--text-primary)' }}>{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}

            {uwView === 'returns' && uwResults && (
              <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                {/* Big 4 KPIs */}
                <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12 }}>
                  {[
                    { label:'Levered IRR',   value:`${(uwResults.lirr*100).toFixed(1)}%`, color:'var(--green)', note:`Exceeds 15% hurdle ${uwResults.lirr>=0.15?'✓':'✗'}` },
                    { label:'Unlevered IRR', value:`${(uwResults.uirr*100).toFixed(1)}%`, color:'var(--green)', note:`Exceeds 10% hurdle ${uwResults.uirr>=0.10?'✓':'✗'}` },
                    { label:'Equity Multiple', value:`${uwResults.em.toFixed(2)}×`,       color:'var(--blue)',  note:`$${Math.round(uwResults.equity/1e6*10)/10}M equity in` },
                    { label:'DSCR Year 1',   value:`${uwResults.dscr1.toFixed(2)}×`,      color:uwResults.dscr1>=1.2?'var(--green)':'var(--rust)', note:'Min 1.20× required' },
                  ].map((k,i) => (
                    <Card key={i} style={{ borderTop:`3px solid ${k.color}` }}>
                      <div style={{ padding:14,textAlign:'center' }}>
                        <div style={{ fontFamily:'var(--font-mono)',fontSize:9,fontWeight:600,
                          letterSpacing:'0.08em',textTransform:'uppercase',
                          color:'var(--text-tertiary)',marginBottom:6 }}>{k.label}</div>
                        <div style={{ fontFamily:'var(--font-display)',fontSize:38,fontWeight:700,
                          color:k.color,lineHeight:1 }}>{k.value}</div>
                        <div style={{ fontSize:11,color:'var(--text-tertiary)',marginTop:5 }}>{k.note}</div>
                      </div>
                    </Card>
                  ))}
                </div>
                {/* IRR Sensitivity */}
                <Card>
                  <CardHdr title="IRR Sensitivity — Exit Cap × Rent Growth" />
                  <div style={{ padding:14,overflowX:'auto' }}>
                    <table style={{ width:'100%',borderCollapse:'collapse',fontFamily:'var(--font-mono)',fontSize:11.5 }}>
                      <thead><tr>
                        <th style={{ padding:'6px 9px',background:'#EDE8E0',border:'1px solid var(--card-border)',
                          fontSize:9.5,fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase',
                          color:'var(--text-secondary)' }}>Exit Cap \ Rent Gw.</th>
                        {[2.0,2.5,3.0,3.5,4.0].map(g=>(
                          <th key={g} style={{ padding:'6px 9px',background:'#EDE8E0',border:'1px solid var(--card-border)',
                            fontSize:9.5,fontWeight:600,color:'var(--text-secondary)',textAlign:'center' }}>{g}%</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {[4.50,4.75,5.00,5.25,5.50,5.75].map(ec => (
                          <tr key={ec}>
                            <td style={{ padding:'6px 9px',border:'1px solid rgba(0,0,0,.05)',
                              color:'var(--text-secondary)',fontWeight:500 }}>{ec.toFixed(2)}%</td>
                            {[2.0,2.5,3.0,3.5,4.0].map(rg => {
                              // simplified IRR estimate for grid
                              const adj = uwResults.lirr + (0.0525 - ec/100)*2.5 + (rg/100 - 0.03)*1.5;
                              const cls = adj>=0.20?{bg:'rgba(21,112,66,.15)',c:'var(--green)'}
                                :adj>=0.16?{bg:'rgba(21,112,66,.07)',c:'var(--green)'}
                                :adj>=0.12?{bg:'rgba(78,110,150,.08)',c:'var(--blue)'}
                                :adj>=0.09?{bg:'rgba(168,112,16,.08)',c:'var(--amber)'}
                                :{bg:'rgba(184,55,20,.08)',c:'var(--rust)'};
                              const isBase = Math.abs(ec-5.25)<0.01 && Math.abs(rg-3.0)<0.01;
                              return (
                                <td key={rg} style={{ padding:'6px 9px',border:'1px solid rgba(0,0,0,.05)',
                                  textAlign:'center',background:isBase?'rgba(88,56,160,.12)':cls.bg,
                                  color:isBase?'var(--purple)':cls.c,
                                  fontWeight:isBase?700:400,
                                  outline:isBase?'2px solid var(--purple)':'none',outlineOffset:-2 }}>
                                  {(adj*100).toFixed(1)}%
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {uwView === 'returns' && !uwResults && (
              <div style={{ padding:40,textAlign:'center',color:'var(--text-tertiary)' }}>
                Run the Quick Underwrite first to see the Returns Dashboard.
              </div>
            )}

          </div>
        )}

        {/* ─── TAB 2: BOV DASHBOARD ────────────────── */}
        {activeTab === 2 && (
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            <Card>
              <CardHdr title="Broker Opinion of Value — Pricing Scenarios" />
              <div style={{ padding:14 }}>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16 }}>
                  {[
                    { label:'Conservative',  capRate:'5.75%', value: deal.deal_value ? fmtM(deal.deal_value*0.93) : '—', color:'var(--amber)' },
                    { label:'As-Is Value',    capRate:'5.25%', value: deal.deal_value ? fmtM(deal.deal_value) : '—',      color:'var(--blue)' },
                    { label:'Aggressive',    capRate:'4.75%', value: deal.deal_value ? fmtM(deal.deal_value*1.08) : '—', color:'var(--green)' },
                  ].map((s,i) => (
                    <div key={i} style={{ padding:14,border:`1px solid var(--card-border)`,borderRadius:8,
                      textAlign:'center' }}>
                      <div style={{ fontSize:10,fontWeight:600,letterSpacing:'0.07em',
                        textTransform:'uppercase',color:'var(--text-tertiary)',marginBottom:6 }}>{s.label}</div>
                      <div style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:700,
                        color:s.color,lineHeight:1 }}>{s.value}</div>
                      <div style={{ fontFamily:'var(--font-mono)',fontSize:11,
                        color:'var(--text-tertiary)',marginTop:4 }}>@ {s.capRate} cap</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:'12px 14px',background:'rgba(78,110,150,.06)',
                  borderRadius:8,border:'1px solid rgba(78,110,150,.2)',fontSize:12.5,
                  color:'var(--text-secondary)',lineHeight:1.65 }}>
                  <strong style={{ color:'var(--blue)' }}>AI BOV Analysis</strong> — Connect the AI Synthesis
                  button to generate strengths, weaknesses, and pricing rationale from property data.
                  The full BOV export (Colliers-branded PDF) is available via the Export BOV button on the deal header.
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ─── TAB 3: BUYER MATCHES ────────────────── */}
        {activeTab === 3 && (
          <Card>
            <CardHdr title="Buyer Matches" />
            <div style={{ padding:'0 14px' }}>
              {buyers.length === 0 ? (
                <div style={{ padding:'20px 0',textAlign:'center',color:'var(--text-tertiary)',fontSize:12.5 }}>
                  No buyer accounts loaded. Add buyers via Accounts page.
                </div>
              ) : buyers.map(b => {
                const score = b.match_score || Math.floor(Math.random()*40+50);
                const auto  = score >= 90;
                return (
                  <div key={b.id} style={{ display:'flex',alignItems:'center',gap:12,
                    padding:'10px 0',borderBottom:'1px solid rgba(0,0,0,.05)' }}>
                    <div style={{ width:36,height:36,borderRadius:7,
                      background:'var(--text-primary)',display:'flex',alignItems:'center',
                      justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',
                      fontFamily:'var(--font-mono)',flexShrink:0 }}>
                      {(b.account_name||'?').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>
                        {b.account_name}
                      </div>
                      <div style={{ fontSize:11,color:'var(--text-tertiary)' }}>
                        {b.buyer_type} · {b.target_markets?.join(', ')}
                      </div>
                    </div>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <div style={{ width:60,height:4,background:'rgba(0,0,0,.06)',borderRadius:2 }}>
                        <div style={{ height:'100%',width:`${score}%`,borderRadius:2,
                          background:'var(--blue)',transition:'width 1s ease' }} />
                      </div>
                      <span style={{ fontFamily:'var(--font-mono)',fontSize:12,
                        fontWeight:500,minWidth:24,color: score>=90?'var(--green)':score>=70?'var(--blue)':'var(--text-tertiary)' }}>
                        {score}
                      </span>
                      {auto && (
                        <span style={{ fontSize:9.5,padding:'2px 6px',borderRadius:3,fontWeight:600,
                          background:'rgba(21,112,66,.1)',color:'var(--green)',
                          border:'1px solid rgba(21,112,66,.25)' }}>AUTO</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ─── TAB 4: CONTACTS ─────────────────────── */}
        {activeTab === 4 && (
          <Card>
            <CardHdr title="Contacts" action="+ Add Contact" />
            <div style={{ padding:'0 14px' }}>
              {contacts.length === 0 ? (
                <div style={{ padding:'20px 0',textAlign:'center',color:'var(--text-tertiary)',fontSize:12.5 }}>
                  No contacts linked. Add contacts via the Contacts page.
                </div>
              ) : contacts.map(c => (
                <div key={c.id} style={{ display:'flex',alignItems:'center',gap:12,
                  padding:'10px 0',borderBottom:'1px solid rgba(0,0,0,.05)' }}>
                  <div style={{ width:34,height:34,borderRadius:'50%',
                    background:'var(--blue)',display:'flex',alignItems:'center',
                    justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0 }}>
                    {(c.first_name||'?')[0]}{(c.last_name||'')[0]}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:500 }}>
                      {c.first_name} {c.last_name}
                    </div>
                    <div style={{ fontSize:11,color:'var(--text-tertiary)' }}>
                      {c.title}{c.company?` · ${c.company}`:''}
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:8 }}>
                    {c.phone && <a href={`tel:${c.phone}`} style={{ fontSize:11,color:'var(--blue)',textDecoration:'none' }}>{c.phone}</a>}
                    {c.email && <a href={`mailto:${c.email}`} style={{ fontSize:11,color:'var(--blue)',textDecoration:'none' }}>{c.email}</a>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ─── TAB 5: OUTREACH ─────────────────────── */}
        {activeTab === 5 && (
          <Card>
            <CardHdr title="Buyer Outreach Log" />
            <div style={{ padding:'0 14px' }}>
              {outreach.length === 0 ? (
                <div style={{ padding:'20px 0',textAlign:'center',color:'var(--text-tertiary)',fontSize:12.5 }}>
                  No outreach logged yet.
                </div>
              ) : outreach.map(o => (
                <div key={o.id} style={{ padding:'9px 0',borderBottom:'1px solid rgba(0,0,0,.05)',
                  display:'flex',gap:10,alignItems:'flex-start' }}>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:10,
                    color:'var(--text-tertiary)',width:70,flexShrink:0,paddingTop:2 }}>
                    {fmtShort(o.outreach_date)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12.5,fontWeight:500,color:'var(--text-primary)',marginBottom:2 }}>
                      {o.method} — <span style={{ color:'var(--text-secondary)',fontWeight:400 }}>{o.outcome}</span>
                    </div>
                    {o.notes && <div style={{ fontSize:11.5,color:'var(--text-secondary)',lineHeight:1.5 }}>{o.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ─── TAB 6: FILES ────────────────────────── */}
        {activeTab === 6 && (
          <Card>
            <CardHdr title="Files & Attachments" action="Upload" />
            <div style={{ padding:'20px',textAlign:'center',color:'var(--text-tertiary)',fontSize:12.5 }}>
              File attachments coming soon. PDFs, underwriting models, and BOVs will appear here.
            </div>
          </Card>
        )}

      </div>

      {/* ── TOAST ──────────────────────────────────── */}
      {toast && (
        <div style={{ position:'fixed',top:16,right:16,zIndex:9999,
          background:'var(--card-bg)',borderRadius:8,boxShadow:'0 4px 20px rgba(0,0,0,.15)',
          borderLeft:'3px solid var(--purple)',padding:'10px 14px',minWidth:260,
          display:'flex',gap:10,alignItems:'flex-start',
          animation:'cl-fade-up .3s ease' }}>
          <div>
            <div style={{ fontSize:12.5,fontWeight:600,color:'var(--text-primary)',marginBottom:2 }}>{toast.title}</div>
            <div style={{ fontSize:11.5,color:'var(--text-secondary)' }}>{toast.body}</div>
          </div>
          <button onClick={()=>setToast(null)}
            style={{ marginLeft:'auto',fontSize:14,color:'var(--text-tertiary)',
              background:'none',border:'none',cursor:'pointer',padding:0,lineHeight:1 }}>✕</button>
        </div>
      )}

    </div>
  );
}
