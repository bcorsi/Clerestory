'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

// ── HELPERS ───────────────────────────────────────────────
const fmtD  = d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';
const fmtSh = d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—';
const fmtMo = d => { if(!d) return '—'; const dt=new Date(d); return dt.toLocaleDateString('en-US',{month:'short',year:'numeric'}); };
const fmt$  = n => n!=null ? '$'+Number(n).toLocaleString() : '—';
const fmtSF = n => n!=null ? Number(n).toLocaleString()+' SF' : '—';

function parseCatalysts(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return p;
    const p2 = JSON.parse(p);
    return Array.isArray(p2) ? p2 : [];
  } catch { return []; }
}

function monthsUntil(d) {
  if (!d) return null;
  return Math.round((new Date(d) - new Date()) / (1000*60*60*24*30));
}

// ── SCORE RING ────────────────────────────────────────────
function ScoreRing({ score, maxScore=100, size=52, strokeWidth=4, color, label, sublabel, onClick }) {
  const r = (size/2) - strokeWidth;
  const circ = 2*Math.PI*r;
  const pct = Math.min((score||0)/maxScore, 1);
  const filled = pct * circ;
  return (
    <div onClick={onClick} style={{display:'flex',flexDirection:'column',alignItems:'center',cursor:onClick?'pointer':undefined}}>
      <div style={{position:'relative',width:size,height:size}}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:'rotate(-90deg)'}}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={strokeWidth}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={`${filled} ${circ-filled}`} strokeLinecap="round"
            style={{transition:'stroke-dasharray 1.2s ease'}}/>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontFamily:'var(--font-mono)',fontSize:size>46?15:13,fontWeight:500,color:'#fff',lineHeight:1}}>{score??'—'}</span>
          {sublabel&&<span style={{fontSize:8,fontWeight:600,color,marginTop:1}}>{sublabel}</span>}
        </div>
      </div>
      {label&&<div style={{fontSize:9,color:'rgba(255,255,255,.45)',textAlign:'center',marginTop:3,letterSpacing:'0.03em',textTransform:'uppercase'}}>{label}</div>}
    </div>
  );
}

// ── SIGNAL BAR ────────────────────────────────────────────
function SignalBar({ label, pts, pct, color }) {
  return (
    <div style={{marginBottom:7}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
        <span style={{fontSize:11,color:'var(--text-secondary)'}}>{label}</span>
        <span style={{fontSize:11,fontFamily:'var(--font-mono)',fontWeight:500,color}}>{pts>0?`+${pts}`:pts}</span>
      </div>
      <div style={{height:3,background:'rgba(0,0,0,.06)',borderRadius:2,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:2,transition:'width 1.2s ease'}}/>
      </div>
    </div>
  );
}

// ── CARD ──────────────────────────────────────────────────
function Card({children,style,accent}){
  return <div style={{background:'var(--card-bg)',border:`1px solid ${accent||'var(--card-border)'}`,borderRadius:10,overflow:'hidden',boxShadow:'var(--card-shadow)',...style}}>{children}</div>;
}
function CardHdr({title,badge,action,onAction,right}){
  return (
    <div style={{background:'#EDE8E0',borderBottom:'1px solid var(--card-border)',padding:'8px 13px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:6}}>
        {title}
        {badge&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:9,background:'rgba(78,110,150,.1)',color:'var(--blue)',border:'1px solid rgba(78,110,150,.2)'}}>{badge}</span>}
      </span>
      {right||( action&&<button onClick={onAction} style={{fontSize:11,color:'var(--blue)',background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:'var(--font-editorial)',fontStyle:'italic'}}>{action}</button> )}
    </div>
  );
}
function DR({label,value,valueColor,mono}){
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',padding:'5px 0',borderBottom:'1px solid rgba(0,0,0,.05)',fontSize:12}}>
      <span style={{color:'var(--text-tertiary)'}}>{label}</span>
      <span style={{color:valueColor||'var(--text-primary)',fontWeight:500,fontFamily:mono?'var(--font-mono)':'var(--font-ui)',fontSize:mono?11:12}}>{value||'—'}</span>
    </div>
  );
}

// ── BUILDING SCORE CALC ───────────────────────────────────
function calcBuildingScore(lead) {
  let score = 0;
  const ch = parseFloat(lead.clear_height)||0;
  if (ch>=36) score+=25; else if (ch>=32) score+=22; else if (ch>=28) score+=18; else if (ch>=24) score+=12; else if (ch>=20) score+=7; else if (ch>0) score+=2;
  const sf = parseFloat(lead.building_sf)||0;
  const dh = parseInt(lead.dock_doors)||0;
  const ratio = sf>0 ? dh/(sf/10000) : 0;
  if (ratio>=1.0) score+=20; else if (ratio>=0.8) score+=17; else if (ratio>=0.6) score+=13; else if (ratio>=0.4) score+=9; else if (ratio>0) score+=4;
  const tc = parseFloat(lead.truck_court_depth)||0;
  if (tc>=185) score+=20; else if (tc>=135) score+=17; else if (tc>=100) score+=13; else if (tc>=65) score+=8; else if (tc>0) score+=3;
  const offPct = parseFloat(lead.office_pct)||0;
  if (offPct<=5) score+=15; else if (offPct<=10) score+=13; else if (offPct<=15) score+=10; else if (offPct<=20) score+=7; else if (offPct<=30) score+=3;
  const power = parseFloat(lead.power)||0;
  if (power>=3000) score+=10; else if (power>=2000) score+=9; else if (power>=1200) score+=7; else if (power>=800) score+=5; else if (power>0) score+=2;
  const yr = parseInt(lead.year_built)||0;
  const age = yr>0?new Date().getFullYear()-yr:99;
  if (age<=5) score+=10; else if (age<=10) score+=9; else if (age<=15) score+=8; else if (age<=20) score+=7; else if (age<=30) score+=5; else if (age<=40) score+=3; else score+=1;
  const grade = score>=85?'A+':score>=70?'A':score>=55?'B+':score>=40?'B':'C';
  return {score,grade};
}

// ── MAIN COMPONENT ────────────────────────────────────────
export default function LeadDetail({ id, inline=false, fullPage=false }) {
  const router = useRouter();
  const [lead, setLead]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState(0);
  const [activities, setActivities] = useState([]);
  const [contacts, setContacts]     = useState([]);
  const [deals, setDeals]           = useState([]);
  const [leaseComps, setLeaseComps] = useState([]);
  const [saleComps, setSaleComps]   = useState([]);
  const [files, setFiles]           = useState([]);
  const [benchmark, setBenchmark]   = useState(null);
  const [warnMatch, setWarnMatch]   = useState(null);

  // Activity log
  const [actType, setActType] = useState('call');
  const [actNote, setActNote] = useState('');
  const [actDate, setActDate] = useState(new Date().toISOString().split('T')[0]);
  const [addingAct, setAddingAct] = useState(false);

  // AI Synthesis
  const [synthesis, setSynthesis]   = useState('');
  const [genSynth, setGenSynth]     = useState(false);
  const [synthSaved, setSynthSaved] = useState(false);

  // Opportunity stage
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState(null);

  const STAGES = ['New Lead','Researching','Decision Maker ID\'d','Contact Info Found','Owner Contacted','Converted'];

  useEffect(() => { if(id) loadLead(); }, [id]);

  async function loadLead() {
    setLoading(true);
    try {
      const sb = createClient();
      const {data:l,error} = await sb.from('leads').select('*').eq('id',id).single();
      if(error) throw error;
      setLead(l);
      if(l.ai_synthesis) setSynthesis(l.ai_synthesis);

      const subm = l.submarket||l.city;
      const [
        {data:acts},
        {data:ctcts},
        {data:dls},
        {data:lc},
        {data:sc},
        {data:fls},
        {data:bm},
        {data:warn},
      ] = await Promise.all([
        sb.from('activities').select('*').eq('lead_id',id).order('activity_date',{ascending:false}).limit(30),
        sb.from('contacts').select('id,first_name,last_name,title,company,phone,email,is_decision_maker').eq('lead_id',id).limit(10),
        sb.from('deals').select('id,deal_name,stage,deal_value,close_probability,created_at').eq('lead_id',id).limit(5),
        subm ? sb.from('lease_comps').select('id,address,city,rsf,rate,lease_type,start_date,tenant_name,gross_equivalent').eq('city',l.city||'').order('start_date',{ascending:false}).limit(8) : Promise.resolve({data:[]}),
        subm ? sb.from('sale_comps').select('id,address,city,building_sf,sale_price,sale_date,buyer_type,is_off_market').ilike('city',`%${l.city||''}%`).order('sale_date',{ascending:false}).limit(6) : Promise.resolve({data:[]}),
        sb.from('file_attachments').select('*').eq('lead_id',id).order('created_at',{ascending:false}).limit(10),
        subm ? sb.from('submarket_benchmarks').select('*').eq('submarket',subm).single() : Promise.resolve({data:null}),
        sb.from('warn_notices').select('id,company,notice_date,employees').eq('matched_property_id',l.property_id||'00000000-0000-0000-0000-000000000000').limit(1).single(),
      ]);

      setActivities(acts||[]);
      setContacts(ctcts||[]);
      setDeals(dls||[]);
      setLeaseComps(lc||[]);
      setSaleComps(sc||[]);
      setFiles(fls||[]);
      setBenchmark(bm||null);
      setWarnMatch(warn||null);
    } catch(e) {
      console.error('LeadDetail load error:',e);
    } finally { setLoading(false); }
  }

  async function updateStage(newStage) {
    if(!lead||saving) return;
    setSaving(true);
    try {
      const sb = createClient();
      await sb.from('leads').update({stage:newStage}).eq('id',id);
      setLead(l=>({...l,stage:newStage}));
      showToast('Stage updated',`→ ${newStage}`,'green');
    } finally { setSaving(false); }
  }

  async function logActivity() {
    if(!actNote.trim()) return;
    setAddingAct(true);
    try {
      const sb = createClient();
      const {data:a} = await sb.from('activities').insert({lead_id:id,activity_type:actType,subject:actNote,activity_date:actDate,completed:true}).select().single();
      if(a) setActivities(prev=>[a,...prev]);
      setActNote('');
      showToast('Logged',`${actType} · ${fmtSh(actDate)}`,'blue');
    } finally { setAddingAct(false); }
  }

  async function generateSynthesis() {
    setGenSynth(true);
    setSynthesis('');
    try {
      const bs = calcBuildingScore(lead||{});
      const tags = parseCatalysts(lead?.catalyst_tags);
      const mo = monthsUntil(lead?.lease_expiration);
      const prompt = `You are a senior industrial real estate broker at Colliers International analyzing a lead in the SGV/IE market.

Lead: ${lead?.lead_name||lead?.company||'Industrial property'}
Address: ${lead?.address||'Unknown'}, ${lead?.city||''} CA
Company: ${lead?.company||'Unknown'}
Stage: ${lead?.stage||'New Lead'}
Building SF: ${lead?.building_sf?Number(lead.building_sf).toLocaleString()+' SF':'Unknown'}
Clear Height: ${lead?.clear_height?lead.clear_height+"'":'Unknown'}
Year Built: ${lead?.year_built||'Unknown'}
In-Place Rent: ${lead?.in_place_rent?'$'+lead.in_place_rent+'/SF/mo':'Unknown'}
Lease Expiration: ${lead?.lease_expiration?fmtMo(lead.lease_expiration)+` (${mo} months)`:'Unknown'}
Owner: ${lead?.owner||'Unknown'}
Submarket: ${lead?.submarket||lead?.city||'SGV/IE'}
Building Score: ${bs.score}/100 (${bs.grade})
ORS Score: ${lead?.readiness_score||'Not scored'}
Catalyst Tags: ${tags.map(t=>typeof t==='object'?t.tag:t).join(', ')||'None'}
${benchmark?`Submarket: ${benchmark.readiness_multiplier?'×'+benchmark.readiness_multiplier+' ORS mult':''} · ${benchmark.vacancy_rate_pct?benchmark.vacancy_rate_pct+'% vacancy':''} · ${benchmark.avg_rent_nnn?'$'+benchmark.avg_rent_nnn+'/SF avg NNN':''}`:''}
${activities.length>0?`Recent Activity: ${activities.slice(0,3).map(a=>a.subject).join(' | ')}`:''}
${warnMatch?`WARN Filing: ${warnMatch.company} — ${warnMatch.employees} employees`:''}

Write a concise 3-4 sentence deal intelligence brief. Cover: (1) what makes this owner a target right now and what the key urgency signal is, (2) what deal type makes most sense (SLB, disposition, covered land) and why, (3) the single most important next action. Professional broker voice. No headers. No fluff.`;

      const res = await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:prompt}]})});
      const json = await res.json();
      const text = json?.content?.[0]?.text||json?.text||'';
      setSynthesis(text);
      const sb = createClient();
      await sb.from('leads').update({ai_synthesis:text}).eq('id',id);
      setSynthSaved(true);
      showToast('Synthesis generated','Saved to lead record','purple');
    } catch(e) {
      setSynthesis('Unable to generate. Check /api/ai route.');
    } finally { setGenSynth(false); }
  }

  function showToast(title,body,type='blue') {
    const c={blue:'var(--blue)',green:'var(--green)',purple:'var(--purple)',amber:'var(--amber)',rust:'var(--rust)'};
    setToast({title,body,c:c[type]||c.blue});
    setTimeout(()=>setToast(null),4000);
  }

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:fullPage?'60vh':'300px',gap:12,flexDirection:'column'}}>
      <div className="cl-spinner"/>
      <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-tertiary)'}}>Loading lead…</span>
    </div>
  );
  if(!lead) return <div style={{padding:40,textAlign:'center',color:'var(--text-tertiary)'}}>Lead not found.</div>;

  const tags = parseCatalysts(lead.catalyst_tags);
  const bs = calcBuildingScore(lead);
  const mo = monthsUntil(lead.lease_expiration);
  const stageIdx = STAGES.indexOf(lead.stage);
  const bsColor = bs.score>=75?'#6fcf97':bs.score>=55?'#89A8C6':'#f4a080';
  const orsScore = lead.readiness_score||0;
  const orsColor = orsScore>=80?'#f4a080':orsScore>=60?'#f2c94c':'#89A8C6';
  const orsGrade = orsScore>=80?'HIGH':orsScore>=60?'MED':'LOW';
  const signals = lead.readiness_signals ? (typeof lead.readiness_signals==='string'?JSON.parse(lead.readiness_signals):lead.readiness_signals) : {};

  // Calculate DH ratio and coverage
  const sf = parseFloat(lead.building_sf)||0;
  const dh = parseInt(lead.dock_doors)||0;
  const dhRatio = sf>0&&dh>0 ? (dh/(sf/10000)).toFixed(2) : '—';
  const landAcres = parseFloat(lead.land_acres)||0;
  const landSF = landAcres*43560;
  const coverage = sf>0&&landSF>0 ? ((sf/landSF)*100).toFixed(1)+'%' : '—';

  const TABS_LIST = [
    {l:'Overview'},
    {l:'Timeline',ct:activities.length},
    {l:'Buildings'},
    {l:'Lease Comps',ct:leaseComps.length},
    {l:'Sale Comps',ct:saleComps.length},
    {l:'Contacts',ct:contacts.length},
    {l:'Deals',ct:deals.length},
    {l:'Files',ct:files.length},
  ];

  return (
    <div style={{fontFamily:'var(--font-ui)',background:'var(--bg)',minHeight:fullPage?'100vh':undefined}}>

      {/* ── BREADCRUMB ─────────────────────────── */}
      {fullPage&&(
        <div style={{padding:'8px 20px',borderBottom:'1px solid var(--card-border)',background:'var(--card-bg)',display:'flex',alignItems:'center',gap:8,fontSize:11,fontFamily:'var(--font-mono)'}}>
          <Link href="/leads" style={{color:'var(--blue)',textDecoration:'none'}}>Lead Gen</Link>
          <span style={{opacity:.4}}> › </span>
          <span style={{color:'var(--text-primary)',fontWeight:500}}>{lead.lead_name||lead.company||lead.address}</span>
          <div style={{marginLeft:'auto',display:'flex',gap:6}}>
            {[
              {l:'Edit',href:`/leads/${id}/edit`},
              {l:'+ Activity',action:()=>setActiveTab(1)},
              {l:'+ Task',action:()=>{}},
              {l:'Google Maps',href:`https://maps.google.com/?q=${encodeURIComponent((lead.address||'')+' '+(lead.city||'')+' CA')}`,ext:true},
              {l:'CoStar',href:'https://www.costar.com',ext:true},
            ].map((b,i)=>(
              b.href ? (
                <a key={i} href={b.href} target={b.ext?'_blank':undefined} rel={b.ext?'noopener noreferrer':undefined}
                  style={{fontSize:11.5,padding:'5px 10px',borderRadius:5,border:'1px solid var(--card-border)',background:'var(--card-bg)',color:'var(--text-secondary)',textDecoration:'none'}}>
                  {b.l}
                </a>
              ) : (
                <button key={i} onClick={b.action}
                  style={{fontSize:11.5,padding:'5px 10px',borderRadius:5,border:'1px solid var(--card-border)',background:'var(--card-bg)',color:'var(--text-secondary)',cursor:'pointer'}}>
                  {b.l}
                </button>
              )
            ))}
            <button onClick={()=>router.push(`/leads/${id}/convert`)}
              style={{fontSize:12,padding:'5px 14px',borderRadius:5,background:'var(--green)',color:'#fff',border:'none',cursor:'pointer',fontWeight:600}}>
              ◆ Convert to Deal
            </button>
          </div>
        </div>
      )}

      {/* ── HERO (180px aerial) ─────────────────── */}
      <div style={{height:180,position:'relative',overflow:'hidden',background:'#0d1a10',flexShrink:0}}>
        {/* Satellite map placeholder — scan effect */}
        <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 35% 45%, rgba(40,80,40,.6) 0%, transparent 55%), radial-gradient(circle at 65% 60%, rgba(30,60,30,.5) 0%, transparent 45%), linear-gradient(160deg,#1a2a1a 0%,#0d1a0d 100%)'}}/>
        <div style={{position:'absolute',inset:0,opacity:.12,backgroundImage:'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)',backgroundSize:'40px 40px'}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(14,21,32,.9) 0%,rgba(14,21,32,.15) 55%,transparent 100%)'}}/>
        {/* Scan line */}
        <div style={{position:'absolute',left:0,right:0,height:4,background:'linear-gradient(transparent,rgba(62,207,107,.05),transparent)',animation:'cl-scan 3s linear infinite'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'12px 20px',display:'flex',alignItems:'flex-end',justifyContent:'space-between',zIndex:10}}>
          <div>
            <div style={{fontFamily:'var(--font-display)',fontSize:19,fontWeight:700,color:'#fff',letterSpacing:'-0.02em',marginBottom:5}}>
              {lead.address||lead.lead_name||lead.company}
            </div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
              {[
                {l:lead.vacancy_status||'Occupied',c:'green'},
                mo!=null&&{l:`Lease Exp. ${fmtMo(lead.lease_expiration)}`,c:'amber'},
                lead.building_sf&&{l:`${Number(lead.building_sf).toLocaleString()} SF · ${lead.prop_type||'Industrial'}`,c:'blue'},
                lead.owner_type&&{l:lead.owner_type,c:'blue'},
                lead.zoning&&{l:lead.zoning,c:'blue'},
              ].filter(Boolean).map((b,i)=>(
                <span key={i} style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10,fontWeight:500,padding:'3px 8px',borderRadius:4,backdropFilter:'blur(4px)',
                  background:b.c==='green'?'rgba(21,102,54,.45)':b.c==='amber'?'rgba(140,90,4,.45)':'rgba(78,110,150,.45)',
                  color:b.c==='green'?'#6fcf97':b.c==='amber'?'#f2c94c':'#89A8C6',
                  border:`1px solid ${b.c==='green'?'rgba(21,102,54,.5)':b.c==='amber'?'rgba(140,90,4,.5)':'rgba(78,110,150,.5)'}`}}>
                  {b.l}
                </span>
              ))}
            </div>
          </div>
          {/* Score rings */}
          <div style={{display:'flex',gap:14,alignItems:'flex-end'}}>
            <ScoreRing score={bs.score} color={bsColor} label="Bldg Score" sublabel={bs.grade}/>
            <ScoreRing score={orsScore} color={orsColor} label="Readiness" sublabel={orsGrade}/>
          </div>
        </div>
      </div>

      {/* ── MARKET STRIP ───────────────────────── */}
      <div style={{background:'#1A2130',height:34,display:'flex',alignItems:'center',borderBottom:'1px solid rgba(255,255,255,.06)',overflow:'hidden',flexShrink:0}}>
        <div style={{flexShrink:0,display:'flex',alignItems:'center',gap:6,padding:'0 14px',borderRight:'1px solid rgba(255,255,255,.08)',height:'100%'}}>
          <div style={{width:5,height:5,borderRadius:'50%',background:'#3ecf6b',animation:'cl-pulse 2s infinite'}}/>
          <span style={{fontFamily:'var(--font-mono)',fontSize:9,color:'#3ecf6b',fontWeight:600,letterSpacing:'0.1em'}}>{lead.submarket||lead.city||'SGV/IE'}</span>
        </div>
        {[
          {l:'Vacancy',   v:benchmark?.vacancy_rate_pct?benchmark.vacancy_rate_pct+'%':'—',     up:benchmark?.vacancy_rate_pct<5},
          {l:'Avg Rent',  v:benchmark?.avg_rent_nnn?'$'+benchmark.avg_rent_nnn+'/SF':'—',         up:true},
          {l:'Avg $/SF',  v:benchmark?.avg_sale_psf?'$'+benchmark.avg_sale_psf:'—'},
          {l:'ORS Mult',  v:benchmark?.readiness_multiplier?'×'+benchmark.readiness_multiplier:'—', teal:true},
          {l:'Med Hold',  v:benchmark?.median_hold_years?benchmark.median_hold_years+' yr':'—'},
          {l:'SLB Corridor', v:benchmark?.is_slb_corridor?'✓ Yes':'—', up:benchmark?.is_slb_corridor},
        ].map((s,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:5,padding:'0 12px',borderRight:'1px solid rgba(255,255,255,.05)',height:'100%'}}>
            <span style={{fontSize:9,color:'rgba(255,255,255,.35)',letterSpacing:'0.05em',textTransform:'uppercase'}}>{s.l}</span>
            <span style={{fontFamily:'var(--font-mono)',fontSize:11,fontWeight:500,color:s.teal?'#5dcaa5':s.up?'#6fcf97':'rgba(255,255,255,.75)'}}>{s.v}</span>
          </div>
        ))}
      </div>

      {/* ── STAT ROW ────────────────────────────── */}
      <div style={{display:'flex',background:'var(--card-bg)',borderBottom:'1px solid var(--card-border)',flexShrink:0}}>
        {[
          {l:'Building SF',   v:lead.building_sf?Number(lead.building_sf).toLocaleString():null,   sub:lead.land_acres?`${lead.land_acres} ac land`:''},
          {l:'Land',          v:lead.land_acres?lead.land_acres+' ac':null,                         sub:sf&&landAcres?`${((sf/landAcres/43560)).toFixed(2)}× bldg ratio`:''},
          {l:'In-Place Rent', v:lead.in_place_rent?'$'+Number(lead.in_place_rent).toFixed(2)+'/SF':null, sub:'NNN / mo', mono:true, color:'var(--blue)'},
          {l:'Market Rent',   v:benchmark?.avg_rent_nnn?'$'+benchmark.avg_rent_nnn+'/SF':null,     sub:'NNN est.', mono:true, color:'var(--blue)'},
          {l:'Lease Expiry',  v:lead.lease_expiration?fmtMo(lead.lease_expiration):null,            sub:mo!=null?`${mo} months`:null, color:mo!=null&&mo<18?'var(--amber)':'var(--text-primary)'},
          {l:'Est. Value',    v:lead.building_sf&&benchmark?.avg_sale_psf?'$'+Math.round(lead.building_sf*benchmark.avg_sale_psf/1e6*10)/10+'M':null, sub:benchmark?.avg_sale_psf?`~$${benchmark.avg_sale_psf}/SF`:null, color:'var(--green)'},
          {l:'Year Built',    v:lead.year_built||null,                                              sub:lead.zoning||null},
        ].map((s,i)=>(
          <div key={i} style={{flex:1,padding:'10px 14px',borderRight:i<6?'1px solid var(--card-border)':'none'}}>
            <div style={{fontFamily:'var(--font-mono)',fontSize:9,fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'var(--text-tertiary)',marginBottom:3}}>{s.l}</div>
            <div style={{fontSize:16,fontWeight:500,color:s.color||'var(--text-primary)',lineHeight:1,fontFamily:s.mono?'var(--font-mono)':'var(--font-ui)'}}>{s.v||'—'}</div>
            {s.sub&&<div style={{fontSize:10,color:'var(--text-tertiary)',marginTop:2}}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── BUILDING SCORE STRIP ────────────────── */}
      <div style={{background:'var(--card-bg)',borderBottom:'1px solid var(--card-border)',padding:'11px 20px',display:'flex',alignItems:'center',gap:14,flexShrink:0}}>
        {/* Ring */}
        <div style={{position:'relative',width:46,height:46,flexShrink:0}}>
          <svg width="46" height="46" viewBox="0 0 46 46" style={{transform:'rotate(-90deg)'}}>
            <circle cx="23" cy="23" r="18" fill="none" stroke="rgba(0,0,0,.06)" strokeWidth="4"/>
            <circle cx="23" cy="23" r="18" fill="none" stroke="var(--blue)" strokeWidth="4"
              strokeDasharray={`${(bs.score/100)*113} ${113-(bs.score/100)*113}`} strokeLinecap="round"/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontFamily:'var(--font-mono)',fontSize:14,fontWeight:500,color:'var(--text-primary)',lineHeight:1}}>{bs.score}</span>
            <span style={{fontSize:8,fontWeight:600,color:'var(--blue)'}}>{bs.grade}</span>
          </div>
        </div>
        <div>
          <div style={{fontSize:12.5,fontWeight:600,color:'var(--text-primary)',marginBottom:1}}>
            Building Score — {bs.grade} · {bs.score>=85?'Top-tier':bs.score>=70?'Quality':bs.score>=55?'Functional':'Value-add'} asset
            <span style={{fontSize:9,padding:'1px 5px',borderRadius:9,background:'rgba(78,110,150,.1)',color:'var(--blue)',border:'1px solid rgba(78,110,150,.2)',marginLeft:6}}>§01</span>
          </div>
          <div style={{fontSize:11,color:'var(--text-tertiary)'}}>
            {[lead.clear_height&&`${lead.clear_height}' clear`, lead.dock_doors&&`${lead.dock_doors} dock-high`, lead.truck_court_depth&&`${lead.truck_court_depth}' truck court`, lead.sprinklers&&lead.sprinklers, lead.power&&`${lead.power}A power`].filter(Boolean).join(' · ')||'Specs not yet entered'}
          </div>
        </div>
        {/* Spec chips */}
        <div style={{display:'flex',gap:0,flex:1,marginLeft:8}}>
          {[
            {l:'Clear Ht',  v:lead.clear_height?`${lead.clear_height}'`:'—'},
            {l:'Dock Doors',v:lead.dock_doors?`${lead.dock_doors} DH`+(lead.grade_level_doors?` · ${lead.grade_level_doors} GL`:''):'—', blue:true},
            {l:'Truck Court',v:lead.truck_court_depth?`${lead.truck_court_depth}'`:'—'},
            {l:'Office %',  v:lead.office_pct!=null?`${lead.office_pct}%`:'—'},
            {l:'Power',     v:lead.power?`${lead.power}A`:'—'},
            {l:'DH Ratio',  v:dhRatio!=='—'?`${dhRatio}/10kSF`:'—', blue:true},
            {l:'Coverage',  v:coverage},
          ].map((s,i)=>(
            <div key={i} style={{flex:1,padding:'0 8px',borderLeft:'1px solid var(--card-border)',textAlign:'center'}}>
              <div style={{fontSize:8.5,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--text-tertiary)',marginBottom:2}}>{s.l}</div>
              <div style={{fontFamily:'var(--font-mono)',fontSize:11.5,color:s.blue?'var(--blue)':'var(--text-primary)'}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ────────────────────────────────── */}
      <div style={{background:'var(--card-bg)',borderBottom:'1px solid var(--card-border)',display:'flex',padding:'0 20px',overflowX:'auto',flexShrink:0}}>
        {TABS_LIST.map((t,i)=>(
          <button key={t.l} onClick={()=>setActiveTab(i)} style={{padding:'9px 12px',fontSize:12.5,fontFamily:'var(--font-ui)',background:'none',border:'none',cursor:'pointer',whiteSpace:'nowrap',borderBottom:activeTab===i?'2px solid var(--blue)':'2px solid transparent',color:activeTab===i?'var(--blue)':'var(--text-tertiary)',fontWeight:activeTab===i?500:400,transition:'all .12s'}}>
            {t.l}
            {t.ct>0&&<span style={{fontFamily:'var(--font-mono)',fontSize:9,background:'rgba(0,0,0,.06)',borderRadius:7,padding:'1px 4px',marginLeft:3}}>{t.ct}</span>}
          </button>
        ))}
      </div>

      {/* ══ TAB PANELS ══════════════════════════════════════ */}
      <div style={{padding:'14px 20px'}}>

        {/* ── TAB 0: OVERVIEW ─────────────────────────────── */}
        {activeTab===0&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 242px',gap:14,alignItems:'start'}}>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>

              {/* AI SYNTHESIS */}
              <Card accent="rgba(88,56,160,.2)">
                <div style={{background:'linear-gradient(135deg,rgba(88,56,160,.07),rgba(78,110,150,.05))',borderBottom:'1px solid var(--card-border)',padding:'8px 13px',display:'flex',alignItems:'center',gap:7}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:'var(--purple)',animation:'cl-pulse 2s infinite'}}/>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'var(--purple)'}}>AI Synthesis</span>
                  <span style={{fontSize:9,padding:'1px 5px',borderRadius:9,background:'rgba(88,56,160,.1)',color:'var(--purple)',border:'1px solid rgba(88,56,160,.2)',marginLeft:2}}>§AI</span>
                  <span style={{fontFamily:'var(--font-editorial)',fontSize:11,fontStyle:'italic',color:'var(--text-tertiary)',marginLeft:4}}>Lead Intelligence Report · {lead.lead_name||lead.company}</span>
                  <div style={{marginLeft:'auto',display:'flex',gap:5}}>
                    <button onClick={generateSynthesis} disabled={genSynth} style={{fontSize:10.5,color:genSynth?'var(--text-tertiary)':'var(--text-secondary)',background:'none',border:'1px solid var(--card-border)',padding:'3px 8px',borderRadius:4,cursor:'pointer',fontFamily:'var(--font-ui)'}}>
                      {genSynth?'Generating…':'↺ Generate'}
                    </button>
                  </div>
                </div>
                <div style={{padding:'12px 13px',minHeight:60}}>
                  {genSynth?(
                    <div style={{display:'flex',alignItems:'center',gap:10,color:'var(--text-tertiary)',fontSize:12.5}}>
                      <div className="cl-spinner" style={{width:14,height:14}}/>
                      Analyzing signals…
                    </div>
                  ):synthesis?(
                    <p style={{fontSize:12.5,lineHeight:1.7,color:'var(--text-secondary)',fontFamily:'var(--font-editorial)',fontStyle:'italic'}}>{synthesis}</p>
                  ):(
                    <div style={{textAlign:'center',padding:'8px 0'}}>
                      <p style={{fontSize:12,color:'var(--text-tertiary)',marginBottom:10}}>No synthesis yet. Generate an AI lead intelligence brief from live signals.</p>
                      <button onClick={generateSynthesis} style={{padding:'7px 18px',background:'var(--purple)',color:'#fff',border:'none',borderRadius:6,fontSize:12.5,fontWeight:500,cursor:'pointer'}}>+ Generate</button>
                    </div>
                  )}
                </div>
                {synthesis&&(
                  <div style={{padding:'6px 13px',borderTop:'1px solid var(--card-border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-tertiary)'}}>Generated · saved to record</span>
                    <button onClick={()=>router.push(`/leads/${id}/convert`)} style={{fontSize:10.5,color:'var(--blue)',background:'none',border:'1px solid var(--card-border)',padding:'3px 8px',borderRadius:4,cursor:'pointer'}}>Convert to Deal →</button>
                  </div>
                )}
              </Card>

              {/* P(TRANSACT) + MOTIVATION */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <Card>
                  <CardHdr title="Deal Temperature" badge="§03"/>
                  <div style={{padding:'12px 13px',display:'flex',gap:14,alignItems:'center'}}>
                    <div style={{flexShrink:0}}>
                      <svg width="120" height="80" viewBox="0 0 120 80">
                        <path d="M12,72 A52,52 0 0,1 108,72" fill="none" stroke="#EDE8E0" strokeWidth="10" strokeLinecap="round"/>
                        <path d="M12,72 A52,52 0 0,1 32,28" fill="none" stroke="rgba(78,110,150,.35)" strokeWidth="10" strokeLinecap="round"/>
                        <path d="M32,28 A52,52 0 0,1 60,16" fill="none" stroke="rgba(140,90,4,.45)" strokeWidth="10" strokeLinecap="round"/>
                        <path d="M60,16 A52,52 0 0,1 108,72" fill="none" stroke="rgba(184,55,20,.55)" strokeWidth="10" strokeLinecap="round"/>
                        {/* Needle based on ORS score */}
                        <line x1="60" y1="72" x2={60+Math.cos((Math.PI-(orsScore/100)*Math.PI))*48} y2={72-Math.sin((orsScore/100)*Math.PI)*48}
                          stroke="#1A2130" strokeWidth="2.5" strokeLinecap="round"
                          style={{transformOrigin:'60px 72px',transition:'all 1s ease'}}/>
                        <circle cx="60" cy="72" r="5" fill="#1A2130"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:700,color:orsScore>=60?'var(--rust)':orsScore>=40?'var(--amber)':'var(--blue)'}}>
                        {orsScore>=70?'HOT':orsScore>=50?'WARM':orsScore>=30?'WATCH':'COLD'}
                      </div>
                      <div style={{fontSize:9,fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'var(--text-tertiary)',marginTop:1}}>Deal Temperature</div>
                      <div style={{marginTop:8,fontSize:11,color:'var(--text-secondary)',lineHeight:1.6}}>
                        {orsScore>=60?'Active signal stack — transacting zone':`ORS ${orsScore} · ${mo!=null?`${mo}mo lease window · `:''}building signals`}
                      </div>
                    </div>
                  </div>
                </Card>
                <Card>
                  <CardHdr title="P(Transact) + Motivation" badge="§03 §04"/>
                  <div style={{padding:'10px 13px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                      <div style={{textAlign:'center',padding:'10px',background:'rgba(78,110,150,.06)',borderRadius:6,border:'1px solid rgba(78,110,150,.12)'}}>
                        <div style={{fontSize:9,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--text-tertiary)',marginBottom:3}}>P(Transact)</div>
                        <div style={{fontFamily:'var(--font-mono)',fontSize:22,fontWeight:500,color:'var(--blue)'}}>{Math.min(Math.round(orsScore*0.9+Math.random()*5),95)}%</div>
                      </div>
                      <div style={{textAlign:'center',padding:'10px',background:`rgba(${orsScore>=60?'184,55,20':'140,90,4'},.05)`,borderRadius:6,border:`1px solid rgba(${orsScore>=60?'184,55,20':'140,90,4'},.12)`}}>
                        <div style={{fontSize:9,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--text-tertiary)',marginBottom:3}}>Motivation</div>
                        <div style={{fontSize:17,fontWeight:600,color:orsScore>=60?'var(--rust)':'var(--amber)'}}>{orsScore>=60?'HIGH':'MEDIUM'}</div>
                      </div>
                    </div>
                    {[
                      mo!=null&&mo<=24&&{l:`Lease expiry ${mo} months`,pts:mo<=12?25:15,c:'var(--amber)'},
                      lead.hold_period&&parseInt(lead.hold_period)>=7&&{l:`Hold period ${lead.hold_period} yrs`,pts:20,c:'var(--amber)'},
                      warnMatch&&{l:`WARN: ${warnMatch.company}`,pts:20,c:'var(--rust)'},
                      benchmark?.is_slb_corridor&&{l:'SLB corridor submarket',pts:7,c:'var(--teal)'},
                    ].filter(Boolean).map((s,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0',borderBottom:'1px solid rgba(0,0,0,.05)',fontSize:11.5}}>
                        <span style={{color:'var(--text-secondary)'}}>{s.l}</span>
                        <span style={{fontFamily:'var(--font-mono)',fontSize:11,fontWeight:500,color:s.c}}>+{s.pts}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* WARN ALERT */}
              {warnMatch&&(
                <Card accent="rgba(184,55,20,.25)">
                  <div style={{padding:'10px 13px',borderLeft:'3px solid var(--rust)',display:'flex',gap:12,alignItems:'flex-start'}}>
                    <span style={{fontSize:16,flexShrink:0}}>⚡</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12.5,fontWeight:600,color:'var(--rust)',marginBottom:2}}>WARN Filing — {warnMatch.company}</div>
                      <div style={{fontSize:11.5,color:'var(--text-secondary)'}}>{warnMatch.employees&&`${Number(warnMatch.employees).toLocaleString()} employees affected`} · Filed {fmtD(warnMatch.notice_date)}</div>
                    </div>
                    <Link href={`/warn-intel/${warnMatch.id}`} style={{fontSize:11,color:'var(--blue)',textDecoration:'none',flexShrink:0}}>View Filing →</Link>
                  </div>
                </Card>
              )}

              {/* SUBMARKET CONTEXT */}
              {benchmark&&(
                <Card>
                  <CardHdr title={`Submarket Context — ${lead.submarket||lead.city}`}/>
                  <div style={{padding:'0 13px'}}>
                    {[
                      {l:'Vacancy Rate',        v:benchmark.vacancy_rate_pct?benchmark.vacancy_rate_pct+'%':'—'},
                      {l:'Avg NNN Rent',         v:benchmark.avg_rent_nnn?'$'+benchmark.avg_rent_nnn+'/SF/mo':'—', up:true},
                      {l:'Avg Sale $/SF',        v:benchmark.avg_sale_psf?'$'+benchmark.avg_sale_psf+'/SF':'—'},
                      {l:'Median Hold Period',   v:benchmark.median_hold_years?benchmark.median_hold_years+' yrs':'—'},
                      {l:'ORS Readiness Mult.',  v:benchmark.readiness_multiplier?'×'+benchmark.readiness_multiplier:'—', teal:true},
                      {l:'SLB Corridor',         v:benchmark.is_slb_corridor?'✓ Active':'—', up:benchmark.is_slb_corridor},
                      {l:'Succession Market',    v:benchmark.is_succession_market?'✓ Yes':'—', up:benchmark.is_succession_market},
                      {l:'Owner-User %',         v:benchmark.owner_user_pct?benchmark.owner_user_pct+'%':'—'},
                    ].map((r,i)=>(
                      <DR key={i} label={r.l} value={r.v} valueColor={r.teal?'var(--teal)':r.up?'var(--green)':'var(--text-primary)'} mono/>
                    ))}
                    {lead.in_place_rent&&benchmark.avg_rent_nnn&&(
                      <div style={{padding:'8px 0',background:'rgba(21,107,107,.04)',borderTop:'1px solid var(--card-border)',fontSize:11,color:'var(--teal)',fontWeight:600}}>
                        In-place ${lead.in_place_rent}/SF · market ${benchmark.avg_rent_nnn}/SF NNN · spread {Math.round((benchmark.avg_rent_nnn/lead.in_place_rent-1)*100)}%
                      </div>
                    )}
                  </div>
                </Card>
              )}

            </div>

            {/* ── RIGHT SIDEBAR ──────────────────── */}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>

              {/* ORS RING + SIGNALS */}
              <Card>
                <CardHdr title="Owner Readiness" badge="§02"/>
                <div style={{padding:'12px 13px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                    <div style={{position:'relative',width:62,height:62,flexShrink:0}}>
                      <svg width="62" height="62" viewBox="0 0 62 62" style={{transform:'rotate(-90deg)'}}>
                        <circle cx="31" cy="31" r="25" fill="none" stroke="rgba(0,0,0,.06)" strokeWidth="5"/>
                        <circle cx="31" cy="31" r="25" fill="none" stroke={orsColor} strokeWidth="5"
                          strokeDasharray={`${(orsScore/100)*157} ${157-(orsScore/100)*157}`} strokeLinecap="round"/>
                      </svg>
                      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                        <span style={{fontFamily:'var(--font-display)',fontSize:21,fontWeight:700,color:orsColor,lineHeight:1}}>{orsScore}</span>
                        <span style={{fontSize:8,color:'var(--text-tertiary)',textTransform:'uppercase',letterSpacing:'0.06em',marginTop:1}}>/ 100</span>
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:orsColor,marginBottom:2}}>{orsGrade} · {lead.readiness_tier?.toUpperCase()||'MONITOR'}</div>
                      <div style={{fontSize:11,color:'var(--text-tertiary)',lineHeight:1.4}}>{mo!=null?`${mo}mo lease window`:''}{benchmark?.is_slb_corridor?' · SLB signal':''}</div>
                      {benchmark?.readiness_multiplier&&<div style={{fontSize:10,color:'var(--teal)',marginTop:4,fontFamily:'var(--font-mono)'}}>×{benchmark.readiness_multiplier} submarket mult.</div>}
                    </div>
                  </div>
                  {/* Signal bars */}
                  {[
                    {l:'Lease expiry',      pts:signals.lease_pts||0,  max:25, c:'var(--rust)'},
                    {l:'Hold period',       pts:signals.hold_pts||0,   max:20, c:'var(--amber)'},
                    {l:'WARN match',        pts:signals.warn_pts||0,   max:20, c:'var(--rust)'},
                    {l:'Contact gap',       pts:signals.contact_pts||0,max:15, c:'var(--blue)'},
                    {l:'Enrich. signals',   pts:signals.enrichment_pts||0, max:20, c:'var(--amber)'},
                    {l:'Location signals',  pts:signals.location_pts||0,  max:15, c:'var(--teal)'},
                  ].map((s,i)=>(
                    <SignalBar key={i} label={s.l} pts={s.pts} pct={s.max>0?(s.pts/s.max)*100:0} color={s.c}/>
                  ))}
                  <div style={{marginTop:9,paddingTop:7,borderTop:'1px solid var(--card-border)',fontSize:11,display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:'var(--text-tertiary)'}}>Tap ring for tier breakdown</span>
                    {benchmark?.readiness_multiplier&&<span style={{fontFamily:'var(--font-mono)',color:'var(--teal)'}}>×{benchmark.readiness_multiplier}</span>}
                  </div>
                </div>
              </Card>

              {/* CATALYST TAGS */}
              <Card>
                <CardHdr title="Active Catalysts" badge="§06" action="+ Add"/>
                <div style={{padding:'5px 13px'}}>
                  {tags.length>0?(
                    tags.map((tag,i)=>{
                      const cat=typeof tag==='object'?tag.category:'owner';
                      const lbl=typeof tag==='object'?tag.tag:tag;
                      const colors={owner:'rust',occupancy:'amber',asset:'amber',market:'blue',location:'teal'};
                      return (
                        <div key={i} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 0',borderBottom:'1px solid rgba(0,0,0,.05)'}}>
                          <span className={`cl-catalyst cl-catalyst--${colors[cat]||'blue'}`} style={{fontSize:9.5,flexShrink:0,padding:'2px 6px'}}>{lbl}</span>
                          <span style={{flex:1,fontSize:11,color:'var(--text-secondary)'}}>{typeof tag==='object'?tag.note||'':''}</span>
                        </div>
                      );
                    })
                  ):(
                    <div style={{padding:'10px 0',fontSize:12,color:'var(--text-tertiary)',textAlign:'center'}}>No catalysts tagged</div>
                  )}
                </div>
              </Card>

              {/* OPPORTUNITY STAGE */}
              <Card>
                <CardHdr title="Opportunity Stage"/>
                <div style={{padding:'8px 13px'}}>
                  {STAGES.map((s,i)=>{
                    const active=lead.stage===s;
                    const done=stageIdx>i;
                    return (
                      <button key={s} onClick={()=>updateStage(s)} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'6px 0',background:'none',border:'none',cursor:'pointer',borderBottom:'1px solid rgba(0,0,0,.05)',textAlign:'left'}}>
                        <div style={{width:6,height:6,borderRadius:'50%',flexShrink:0,background:active?'var(--blue)':done?'var(--green)':'rgba(0,0,0,.1)',border:active?'2px solid var(--blue)':done?'none':'2px solid rgba(0,0,0,.15)'}}/>
                        <span style={{fontSize:12,fontWeight:active?600:400,color:active?'var(--blue)':done?'var(--green)':'var(--text-tertiary)'}}>{s}</span>
                        {active&&<span style={{marginLeft:'auto',fontSize:9,padding:'1px 5px',borderRadius:9,background:'rgba(78,110,150,.1)',color:'var(--blue)',border:'1px solid rgba(78,110,150,.2)'}}>CURRENT</span>}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* LEAD DETAILS */}
              <Card>
                <CardHdr title="Lead Details" action="Edit"/>
                <div style={{padding:'8px 13px'}}>
                  <DR label="Stage"      value={lead.stage}/>
                  <DR label="Priority"   value={lead.priority} valueColor={lead.priority==='high'?'var(--rust)':lead.priority==='medium'?'var(--amber)':'var(--blue)'}/>
                  <DR label="Owner"      value={lead.owner}/>
                  <DR label="Owner Type" value={lead.owner_type}/>
                  <DR label="Market"     value={lead.market}/>
                  <DR label="Submarket"  value={lead.submarket||lead.city}/>
                  {lead.follow_up_date&&<DR label="Follow-up" value={fmtD(lead.follow_up_date)} valueColor="var(--amber)"/>}
                  {lead.lead_source&&<DR label="Source" value={lead.lead_source}/>}
                </div>
              </Card>

            </div>
          </div>
        )}

        {/* ── TAB 1: TIMELINE ─────────────────────────────── */}
        {activeTab===1&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 240px',gap:14,alignItems:'start'}}>
            <Card>
              <CardHdr title="Activity Log" action="+ Log Activity"/>
              {/* Log form */}
              <div style={{padding:'10px 13px',borderBottom:'1px solid var(--card-border)',background:'rgba(0,0,0,.02)',display:'flex',gap:7,flexWrap:'wrap',alignItems:'flex-end'}}>
                <select value={actType} onChange={e=>setActType(e.target.value)} style={{padding:'6px 8px',borderRadius:5,border:'1px solid var(--card-border)',fontFamily:'var(--font-ui)',fontSize:12,background:'var(--card-bg)',outline:'none'}}>
                  {['call','email','meeting','note','stage_change'].map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
                </select>
                <input type="date" value={actDate} onChange={e=>setActDate(e.target.value)} style={{padding:'6px 8px',borderRadius:5,border:'1px solid var(--card-border)',fontFamily:'var(--font-mono)',fontSize:11,background:'var(--card-bg)',outline:'none'}}/>
                <input placeholder="Notes…" value={actNote} onChange={e=>setActNote(e.target.value)} onKeyDown={e=>e.key==='Enter'&&logActivity()} style={{flex:1,minWidth:160,padding:'6px 10px',borderRadius:5,border:'1px solid var(--card-border)',fontFamily:'var(--font-ui)',fontSize:12.5,background:'var(--card-bg)',outline:'none'}}/>
                <button onClick={logActivity} disabled={addingAct||!actNote.trim()} style={{padding:'6px 14px',borderRadius:5,background:'var(--blue)',color:'#fff',border:'none',cursor:'pointer',fontSize:12,opacity:actNote.trim()?1:0.5}}>{addingAct?'…':'Log'}</button>
              </div>
              <div style={{padding:'0 13px'}}>
                {activities.length===0?(
                  <div style={{padding:'20px 0',textAlign:'center',color:'var(--text-tertiary)',fontSize:12.5}}>No activity logged yet</div>
                ):activities.map(a=>{
                  const ic={call:'☏',email:'✉',meeting:'👥',note:'📝',stage_change:'↑'};
                  const bc={call:'rgba(78,110,150,.1)',email:'rgba(88,56,160,.1)',meeting:'rgba(21,112,66,.1)',note:'rgba(140,90,4,.1)',stage_change:'rgba(21,112,66,.1)'};
                  const fc={call:'var(--blue)',email:'var(--purple)',meeting:'var(--green)',note:'var(--amber)',stage_change:'var(--green)'};
                  const t=a.activity_type||'note';
                  return (
                    <div key={a.id} style={{display:'flex',gap:9,padding:'9px 0',borderBottom:'1px solid rgba(0,0,0,.05)'}}>
                      <div style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:10,background:bc[t]||'rgba(0,0,0,.05)',color:fc[t]||'var(--text-tertiary)',marginTop:1}}>{ic[t]||'·'}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:500,color:'var(--text-primary)',marginBottom:1}}>{a.subject||a.activity_type}</div>
                        {a.notes&&<div style={{fontSize:11.5,color:'var(--text-secondary)',lineHeight:1.5}}>{a.notes}</div>}
                        <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-tertiary)',marginTop:2}}>{fmtD(a.activity_date||a.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <Card>
                <CardHdr title="Watchlist" />
                <div style={{padding:'8px 13px',fontSize:12,color:'var(--text-tertiary)'}}>Other leads with score ≥60 in this submarket appear here.</div>
              </Card>
            </div>
          </div>
        )}

        {/* ── TAB 2: BUILDINGS ────────────────────────────── */}
        {activeTab===2&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 240px',gap:14,alignItems:'start'}}>
            <Card>
              <CardHdr title={`Building — ${lead.address||lead.lead_name}`} right={<span style={{fontFamily:'var(--font-display)',fontSize:16,fontWeight:700,color:'var(--blue)'}}>{bs.score} / {bs.grade}</span>}/>
              <div style={{padding:'12px 13px'}}>
                {/* Spec grid */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
                  {[
                    {l:'Building SF',  v:lead.building_sf?Number(lead.building_sf).toLocaleString():null},
                    {l:'Land AC',      v:lead.land_acres||null},
                    {l:'Year Built',   v:lead.year_built||null},
                    {l:'Clear Height', v:lead.clear_height?`${lead.clear_height}'`:null},
                    {l:'Dock-High',    v:lead.dock_doors||null},
                    {l:'Grade Level',  v:lead.grade_level_doors||null},
                    {l:'Truck Court',  v:lead.truck_court_depth?`${lead.truck_court_depth}'`:null},
                    {l:'Office %',     v:lead.office_pct!=null?`${lead.office_pct}%`:null},
                    {l:'Power',        v:lead.power?`${lead.power}A`:null},
                    {l:'Sprinklers',   v:lead.sprinklers||null},
                    {l:'DH Ratio',     v:dhRatio!=='—'?`${dhRatio}/10kSF`:null},
                    {l:'Site Coverage',v:coverage!=='—'?coverage:null},
                  ].map((s,i)=>(
                    <div key={i} style={{background:'rgba(0,0,0,.03)',borderRadius:6,padding:'9px 10px',textAlign:'center'}}>
                      <div style={{fontSize:8.5,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-tertiary)',marginBottom:3}}>{s.l}</div>
                      <div style={{fontSize:16,fontWeight:500,color:'var(--text-primary)',fontFamily:'var(--font-mono)'}}>{s.v||'—'}</div>
                    </div>
                  ))}
                </div>
                {/* Score factor bars */}
                <div style={{borderTop:'1px solid var(--card-border)',paddingTop:12}}>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-secondary)',marginBottom:10}}>Building Score Factor Breakdown <span style={{fontSize:9,padding:'1px 5px',borderRadius:9,background:'rgba(78,110,150,.1)',color:'var(--blue)',border:'1px solid rgba(78,110,150,.2)',marginLeft:4}}>§01</span></div>
                  {[
                    {l:'Clear Height (25 pts max)',     val:bs.score>=85?25:bs.score>=70?22:bs.score>=55?18:12, max:25, c:'var(--blue)'},
                    {l:'Dock-High Ratio (20 pts max)',  val:bs.score>=85?20:bs.score>=70?17:13,                max:20, c:'var(--blue)'},
                    {l:'Truck Court (20 pts max)',      val:bs.score>=85?17:bs.score>=70?13:8,                 max:20, c:'var(--teal)'},
                    {l:'Office % (15 pts max)',         val:bs.score>=70?13:bs.score>=55?10:7,                 max:15, c:'var(--amber)'},
                    {l:'Power (10 pts max)',            val:lead.power?9:5,                                    max:10, c:'var(--green)'},
                    {l:'Vintage (10 pts max)',          val:lead.year_built?Math.max(10-Math.floor((new Date().getFullYear()-lead.year_built)/5),1):3, max:10, c:'var(--amber)'},
                  ].map((f,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                      <span style={{fontSize:10,color:'var(--text-tertiary)',width:170,flexShrink:0}}>{f.l}</span>
                      <div style={{flex:1,height:4,background:'rgba(0,0,0,.06)',borderRadius:2,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${(f.val/f.max)*100}%`,background:f.c,borderRadius:2,transition:'width 1.2s ease'}}/>
                      </div>
                      <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-tertiary)',width:30,textAlign:'right'}}>{f.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            {/* APNs sidebar */}
            <Card>
              <CardHdr title="APNs"/>
              <div style={{padding:'8px 13px'}}>
                {lead.apn?(
                  (Array.isArray(lead.apn)?lead.apn:[lead.apn]).map((apn,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',padding:'5px 0',borderBottom:'1px solid rgba(0,0,0,.05)',fontSize:12}}>
                      <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-primary)'}}>{apn}</span>
                      <span style={{fontSize:10,color:'var(--text-tertiary)'}}>LA County</span>
                    </div>
                  ))
                ):(
                  <div style={{padding:'10px 0',fontSize:12,color:'var(--text-tertiary)',textAlign:'center'}}>No APNs on record</div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB 3: LEASE COMPS ──────────────────────────── */}
        {activeTab===3&&(
          <Card>
            <CardHdr title={`Lease Comps — ${lead.submarket||lead.city||'SGV/IE'}`} action="+ Add Comp"/>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontFamily:'var(--font-mono)',fontSize:11.5}}>
                <thead><tr>
                  {['Address','Tenant','SF','Rate','Type','Date','Gross Equiv.'].map(h=>(
                    <th key={h} style={{padding:'7px 12px',background:'#EDE8E0',border:'0.5px solid var(--card-border)',fontSize:9.5,fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase',color:'var(--text-secondary)',textAlign:h==='Address'?'left':'right'}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {leaseComps.length===0?(
                    <tr><td colSpan={7} style={{padding:'20px',textAlign:'center',color:'var(--text-tertiary)',fontSize:12.5}}>No lease comps found in {lead.city||'this submarket'}</td></tr>
                  ):leaseComps.map(c=>(
                    <tr key={c.id} style={{borderBottom:'1px solid rgba(0,0,0,.04)'}}>
                      <td style={{padding:'7px 12px',fontFamily:'var(--font-ui)',fontSize:12,color:'var(--text-primary)'}}>{c.address}</td>
                      <td style={{padding:'7px 12px',textAlign:'right',color:'var(--text-secondary)'}}>{c.tenant_name||c.tenant||'—'}</td>
                      <td style={{padding:'7px 12px',textAlign:'right'}}>{c.rsf?Number(c.rsf).toLocaleString():'—'}</td>
                      <td style={{padding:'7px 12px',textAlign:'right',color:'var(--blue)',fontWeight:500}}>{c.rate?'$'+Number(c.rate).toFixed(2):'—'}</td>
                      <td style={{padding:'7px 12px',textAlign:'right'}}><span className="cl-badge cl-badge-gray" style={{fontSize:9}}>{c.lease_type||'NNN'}</span></td>
                      <td style={{padding:'7px 12px',textAlign:'right',color:'var(--text-tertiary)'}}>{c.start_date?new Date(c.start_date).toLocaleDateString('en-US',{month:'short',year:'2-digit'}):'—'}</td>
                      <td style={{padding:'7px 12px',textAlign:'right',color:'var(--teal)'}}>{c.gross_equivalent?'$'+Number(c.gross_equivalent).toFixed(2):'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {leaseComps.length>0&&lead.in_place_rent&&(
              <div style={{padding:'8px 13px',background:'rgba(26,107,107,.04)',borderTop:'1px solid var(--card-border)',fontSize:11,color:'var(--teal)',fontWeight:600}}>
                In-place ${lead.in_place_rent}/SF · {leaseComps[0]?.rate?`market avg ~$${Number(leaseComps.reduce((a,c)=>a+Number(c.rate||0),0)/leaseComps.filter(c=>c.rate).length).toFixed(2)}/SF NNN`:''}
              </div>
            )}
          </Card>
        )}

        {/* ── TAB 4: SALE COMPS ───────────────────────────── */}
        {activeTab===4&&(
          <Card>
            <CardHdr title={`Sale Comps — ${lead.submarket||lead.city||'SGV/IE'} Industrial`} action="+ Add Comp"/>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontFamily:'var(--font-mono)',fontSize:11.5}}>
                <thead><tr>
                  {['Address','SF','Sale Price','$/SF','Date','Buyer Type','Off-Mkt'].map(h=>(
                    <th key={h} style={{padding:'7px 12px',background:'#EDE8E0',border:'0.5px solid var(--card-border)',fontSize:9.5,fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase',color:'var(--text-secondary)',textAlign:h==='Address'?'left':'right'}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {saleComps.length===0?(
                    <tr><td colSpan={7} style={{padding:'20px',textAlign:'center',color:'var(--text-tertiary)',fontSize:12.5}}>No sale comps found in {lead.city||'this submarket'}</td></tr>
                  ):saleComps.map(c=>{
                    const psf = c.sale_price&&c.building_sf?Math.round(c.sale_price/c.building_sf):null;
                    return (
                      <tr key={c.id} style={{borderBottom:'1px solid rgba(0,0,0,.04)'}}>
                        <td style={{padding:'7px 12px',fontFamily:'var(--font-ui)',fontSize:12,color:'var(--text-primary)'}}>{c.address}</td>
                        <td style={{padding:'7px 12px',textAlign:'right'}}>{c.building_sf?Number(c.building_sf).toLocaleString():'—'}</td>
                        <td style={{padding:'7px 12px',textAlign:'right',color:'var(--green)',fontWeight:500}}>{c.sale_price?'$'+Math.round(c.sale_price/1e6*10)/10+'M':'—'}</td>
                        <td style={{padding:'7px 12px',textAlign:'right',color:'var(--blue)',fontWeight:600}}>{psf?'$'+psf:'—'}</td>
                        <td style={{padding:'7px 12px',textAlign:'right',color:'var(--text-tertiary)'}}>{c.sale_date?new Date(c.sale_date).toLocaleDateString('en-US',{month:'short',year:'2-digit'}):'—'}</td>
                        <td style={{padding:'7px 12px',textAlign:'right',color:'var(--text-secondary)'}}>{c.buyer_type||'—'}</td>
                        <td style={{padding:'7px 12px',textAlign:'center'}}>{c.is_off_market?<span style={{fontSize:9,padding:'2px 6px',borderRadius:3,background:'rgba(184,55,20,.1)',color:'var(--rust)',fontWeight:700}}>●</span>:'—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── TAB 5: CONTACTS ─────────────────────────────── */}
        {activeTab===5&&(
          <Card>
            <CardHdr title="Key Contacts" action="+ Add Contact"/>
            <div style={{padding:'10px 13px',display:'flex',flexDirection:'column',gap:8}}>
              {contacts.length===0?(
                <div style={{padding:'20px 0',textAlign:'center',color:'var(--text-tertiary)',fontSize:12.5}}>No contacts linked. Add via contact search or manual entry.</div>
              ):contacts.map(c=>(
                <div key={c.id} style={{background:'var(--card-bg)',border:'1px solid var(--card-border)',borderRadius:7,padding:'11px 12px',display:'flex',gap:10,alignItems:'center'}}>
                  <div style={{width:38,height:38,borderRadius:'50%',background:'var(--blue)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:600,color:'#fff',flexShrink:0}}>
                    {(c.first_name||'?')[0]}{(c.last_name||'')[0]}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{c.first_name} {c.last_name}</div>
                    <div style={{fontSize:11,color:'var(--text-tertiary)',marginTop:1}}>{c.title}{c.company?` · ${c.company}`:''}</div>
                    {c.is_decision_maker&&<div style={{fontSize:10,color:'var(--green)',marginTop:2,fontWeight:500}}>● Primary Decision Maker</div>}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end'}}>
                    {c.phone&&<a href={`tel:${c.phone}`} style={{fontSize:11,padding:'3px 9px',borderRadius:4,border:'1px solid var(--card-border)',background:'var(--blue)',color:'#fff',textDecoration:'none',fontWeight:600}}>☏ Call</a>}
                    {c.email&&<a href={`mailto:${c.email}`} style={{fontSize:11,padding:'3px 9px',borderRadius:4,border:'1px solid var(--card-border)',background:'none',color:'var(--text-secondary)',textDecoration:'none'}}>✉ Email</a>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── TAB 6: DEALS ────────────────────────────────── */}
        {activeTab===6&&(
          <Card>
            <CardHdr title="Linked Deals" action="+ Create Deal" onAction={()=>router.push(`/leads/${id}/convert`)}/>
            <div style={{padding:'10px 13px',display:'flex',flexDirection:'column',gap:8}}>
              {deals.length===0?(
                <div style={{padding:'20px 0',textAlign:'center',color:'var(--text-tertiary)',fontSize:12.5}}>
                  No deals linked yet. <button onClick={()=>router.push(`/leads/${id}/convert`)} style={{color:'var(--blue)',background:'none',border:'none',cursor:'pointer',fontSize:12.5,textDecoration:'underline'}}>Convert to Deal →</button>
                </div>
              ):deals.map(d=>(
                <div key={d.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:'rgba(78,110,150,.04)',borderRadius:6,border:'1px solid rgba(78,110,150,.12)'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{d.deal_name||'Unnamed Deal'}</div>
                    <div style={{fontSize:11,color:'var(--text-tertiary)',marginTop:2,fontFamily:'var(--font-mono)'}}>{d.stage}{d.deal_value?` · $${(d.deal_value/1e6).toFixed(1)}M`:''}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    {d.close_probability&&<div style={{fontSize:12,fontWeight:600,color:'var(--green)'}}>{d.close_probability}% close prob.</div>}
                    <Link href={`/deals/${d.id}`} style={{fontSize:10.5,padding:'3px 8px',borderRadius:4,background:'var(--blue)',color:'#fff',textDecoration:'none',fontWeight:600,display:'inline-block',marginTop:4}}>Open Deal →</Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── TAB 7: FILES ────────────────────────────────── */}
        {activeTab===7&&(
          <Card>
            <CardHdr title="Attachments" action="+ Upload"/>
            <div style={{padding:'10px 13px',display:'flex',flexDirection:'column',gap:6}}>
              {files.length===0?(
                <div style={{padding:'20px 0',textAlign:'center',color:'var(--text-tertiary)',fontSize:12.5}}>No files attached. Upload BOVs, flyers, and inspection reports here.</div>
              ):files.map(f=>{
                const ext=(f.file_name||'').split('.').pop()?.toUpperCase()||'FILE';
                const c={'PDF':'var(--rust)','XLS':'var(--green)','XLSX':'var(--green)','DOC':'var(--blue)','DOCX':'var(--blue)'}[ext]||'var(--text-secondary)';
                return (
                  <div key={f.id} style={{display:'flex',alignItems:'center',gap:10,padding:9,background:'rgba(0,0,0,.02)',borderRadius:5,border:'1px solid var(--card-border)'}}>
                    <div style={{width:32,height:32,borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:c,background:`${c}15`,flexShrink:0}}>{ext}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.file_name}</div>
                      <div style={{fontFamily:'var(--font-mono)',fontSize:9.5,color:'var(--text-tertiary)',marginTop:1}}>{fmtSh(f.created_at)}</div>
                    </div>
                    {f.file_url&&<a href={f.file_url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:'var(--blue)',textDecoration:'none',flexShrink:0}}>Download</a>}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

      </div>

      {/* ── TOAST ──────────────────────────────── */}
      {toast&&(
        <div style={{position:'fixed',top:16,right:16,zIndex:9999,background:'var(--card-bg)',borderRadius:8,boxShadow:'0 4px 20px rgba(0,0,0,.15)',borderLeft:`3px solid ${toast.c}`,padding:'10px 14px',minWidth:260,display:'flex',gap:10,alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:12.5,fontWeight:600,color:'var(--text-primary)',marginBottom:2}}>{toast.title}</div>
            <div style={{fontSize:11.5,color:'var(--text-secondary)'}}>{toast.body}</div>
          </div>
          <button onClick={()=>setToast(null)} style={{marginLeft:'auto',fontSize:14,color:'var(--text-tertiary)',background:'none',border:'none',cursor:'pointer',lineHeight:1,padding:0}}>✕</button>
        </div>
      )}

      <style>{`
        @keyframes cl-scan { 0%{top:-4px} 100%{top:100%} }
        @keyframes cl-pulse { 0%,100%{opacity:1} 60%{opacity:.3} }
      `}</style>
    </div>
  );
}
