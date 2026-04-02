'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STAGES = [
  'Tracking','Underwriting','Off-Market Outreach','Marketing',
  'LOI','LOI Accepted','PSA Negotiation','Due Diligence','Non-Contingent','Closed Won',
];

const STAGE_COLOR = {
  'Tracking':'#9CA3AF','Underwriting':'#7C3AED','Off-Market Outreach':'#0891B2',
  'Marketing':'#D97706','LOI':'#DC2626','LOI Accepted':'#059669',
  'PSA Negotiation':'#BE185D','Due Diligence':'#1D4ED8',
  'Non-Contingent':'#059669','Closed Won':'#059669',
};

const COMMISSION_STAGES = new Set(['LOI Accepted','PSA Negotiation','Due Diligence','Non-Contingent','Closed Won']);
const BOV_STAGES        = new Set(['Underwriting','Off-Market Outreach','Marketing','LOI','LOI Accepted','PSA Negotiation','Due Diligence','Non-Contingent','Closed Won']);

const ACT_ICON  = { call:'📞', email:'✉️', note:'📝', meeting:'🤝', task:'✅', system:'⚙️' };
const ACT_BG    = { call:'rgba(78,110,150,0.09)', email:'rgba(88,56,160,0.08)', note:'rgba(140,90,4,0.09)', meeting:'rgba(21,102,54,0.08)', system:'rgba(0,0,0,0.04)' };
const ACT_COLOR = { call:'#4E6E96', email:'#5838A0', note:'#8C5A04', meeting:'#156636', system:'#6E6860' };

const CATALYST_STYLE = {
  owner:    { color:'#92280F', bg:'rgba(184,55,20,0.08)', dot:'#C0392B' },
  occupier: { color:'#713F00', bg:'rgba(180,83,9,0.08)',  dot:'#B45309' },
  asset:    { color:'#1E3A5F', bg:'rgba(29,78,216,0.08)', dot:'#1D4ED8' },
  market:   { color:'#3B0764', bg:'rgba(124,58,237,0.08)',dot:'#7C3AED' },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmtM  = n => !n ? '—' : n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : `$${(n/1e3).toFixed(0)}K`;
const fmtDate= d => !d ? '—' : new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const fmtSh = d => !d ? '—' : new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'});
const fmtN  = n => n != null ? Number(n).toLocaleString() : '—';

// ─── CATALYST TAG ─────────────────────────────────────────────────────────────

function parseCatalysts(raw) {
  if (!raw) return [];
  try {
    const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(p)) return [];
    return p.flatMap(c => {
      if (typeof c === 'string') { try { return [JSON.parse(c)]; } catch { return [{ tag: c, category: 'asset' }]; } }
      return [c];
    }).filter(c => c && (c.tag || typeof c === 'string'));
  } catch { return []; }
}

function CatalystTag({ tag }) {
  const label = typeof tag === 'string' ? tag : (tag?.tag || '');
  const cat   = (typeof tag === 'object' ? tag?.category : null) || 'asset';
  const st    = CATALYST_STYLE[cat] || CATALYST_STYLE.asset;
  if (!label) return null;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:500, padding:'2px 7px', borderRadius:4, background:st.bg, color:st.color, whiteSpace:'nowrap', border:`1px solid ${st.dot}30` }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:st.dot, display:'inline-block', flexShrink:0 }} />
      {label}
    </span>
  );
}

// ─── STAGE CHEVRON TRACK ─────────────────────────────────────────────────────

function StageTrack({ currentStage, onStageClick }) {
  const idx = STAGES.indexOf(currentStage);
  return (
    <div style={{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', overflowX:'auto', display:'flex' }}>
      {STAGES.map((s, i) => {
        const done   = i < idx;
        const active = s === currentStage;
        const col    = STAGE_COLOR[s] || '#9CA3AF';
        return (
          <button key={s} onClick={() => onStageClick(s)}
            style={{
              display:'flex', alignItems:'center', padding:'0 16px 0 12px',
              height:38, cursor:'pointer', border:'none',
              background: active ? col : done ? `${col}18` : 'transparent',
              color: active ? '#fff' : done ? col : '#9CA3AF',
              fontSize:11.5, fontWeight: active ? 700 : done ? 500 : 400,
              fontFamily:'inherit', whiteSpace:'nowrap', transition:'all .12s',
              position:'relative', zIndex: active ? 2 : 1,
              clipPath: i < STAGES.length-1 ? 'polygon(0 0,calc(100% - 9px) 0,100% 50%,calc(100% - 9px) 100%,0 100%,9px 50%)' : 'none',
              marginRight: i < STAGES.length-1 ? -1 : 0,
            }}>
            {active && <span style={{ width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.7)', marginRight:6, flexShrink:0, animation:'blink 1.4s infinite' }}/>}
            {s}
          </button>
        );
      })}
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function Card({ title, children, action, onAction, accent }) {
  return (
    <div style={{ background:'#fff', borderRadius:9, border:`1px solid ${accent ? accent+'40' : 'rgba(0,0,0,0.07)'}`, overflow:'hidden' }}>
      {title && (
        <div style={{ padding:'9px 14px', borderBottom:'1px solid rgba(0,0,0,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', background: accent ? `${accent}10` : 'transparent' }}>
          <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.09em', textTransform:'uppercase', color: accent || '#524D46' }}>{title}</span>
          {action && <button onClick={onAction} style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, fontStyle:'italic', color:'#4E6E96', background:'none', border:'none', cursor:'pointer' }}>{action}</button>}
        </div>
      )}
      <div style={{ padding:'12px 14px' }}>{children}</div>
    </div>
  );
}

function FieldRow({ label, value, color, mono }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'6px 0', borderBottom:'1px solid rgba(0,0,0,0.04)' }}>
      <span style={{ fontSize:12, color:'#6E6860', flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:12.5, color:color||'#2C2822', fontWeight:500, textAlign:'right', maxWidth:200, fontFamily:mono?'var(--font-mono)':'inherit' }}>{value}</span>
    </div>
  );
}

// ─── BOV GENERATOR (condensed) ────────────────────────────────────────────────

function BOVGenerator({ deal }) {
  const iframeRef = useRef(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [thesis, setThesis]   = useState('');
  const [strengths, setStrengths] = useState([
    { text:'Infill SGV location — no new supply possible', tag:'green' },
    { text:'Mark-to-market rent upside at rollover', tag:'green' },
    { text:'Long-term owner — no distress', tag:'blue' },
  ]);
  const [risks, setRisks] = useState([
    { text:'Near-term lease expiration — re-tenanting cost', tag:'red' },
    { text:'Older vintage — buyer CapEx expectations', tag:'amber' },
  ]);
  const [capExp, setCapExp]   = useState(0.055);
  const [capBase, setCapBase] = useState(0.060);
  const [capOut, setCapOut]   = useState(0.050);
  const [mktRent, setMktRent] = useState(1.22);
  const [generated, setGenerated] = useState(false);
  const uw = deal?.underwriting_inputs || {};
  const sf = Number(uw.building_sf) || 0;

  async function runAI() {
    setAiLoading(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:700,
          messages:[{role:'user',content:`Senior industrial CRE broker at Colliers. Write BOV analysis for: ${deal.deal_name}, ${deal.address}, ${sf.toLocaleString()} SF, ${deal.market||'SGV'}. Market rent $${mktRent}/SF NNN. Return ONLY valid JSON no markdown: {"strengths":[{"text":"...","tag":"green or blue"}],"risks":[{"text":"...","tag":"red, amber, or blue"}],"thesis":"2-3 sentence investment thesis"}`}]
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse((data.content?.[0]?.text||'{}').replace(/```json|```/g,'').trim());
      if (parsed.strengths) setStrengths(parsed.strengths);
      if (parsed.risks)     setRisks(parsed.risks);
      if (parsed.thesis)    setThesis(parsed.thesis);
    } catch(e) { console.error(e); }
    finally { setAiLoading(false); }
  }

  function generate() {
    if (!sf) { alert('Building SF required in underwriting_inputs to generate BOV.'); return; }
    const SOCC=0.95, MGMT=0.04, RTX=1.43, INS=0.18, CAM=0.25, RM=0.12;
    const gpr=sf*mktRent*12, egr=gpr*SOCC, reimb=sf*SOCC*(RTX+CAM+INS);
    const egrev=egr+reimb, opex=sf*(RTX+INS+CAM+RM), mgmt=egrev*MGMT, noi=egrev-opex-mgmt;
    const vB=noi/capBase, vE=noi/capExp, vO=noi/capOut;
    const fD=x=>x>=1e6?'$'+(x/1e6).toFixed(1)+'M':'$'+Math.round(x/1e3)+'K';
    const fC=x=>'$'+Math.round(x).toLocaleString();
    const xe=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const strRows=strengths.filter(s=>s.text).map(s=>`<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;border-bottom:.5px solid #e0dbd4"><span>${xe(s.text)}</span><span style="font-size:9px;padding:1px 7px;border-radius:20px;font-weight:700;text-transform:uppercase;${s.tag==='green'?'background:#e8f5e9;color:#16803c':'background:#e8f0fe;color:#2E75B6'}">${s.tag==='green'?'Strong':'Good'}</span></div>`).join('');
    const riskRows=risks.filter(r=>r.text).map(r=>`<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;border-bottom:.5px solid #e0dbd4"><span>${xe(r.text)}</span><span style="font-size:9px;padding:1px 7px;border-radius:20px;font-weight:700;text-transform:uppercase;${r.tag==='red'?'background:#fce4ec;color:#cc2200':r.tag==='amber'?'background:#fff8e1;color:#b8860b':'background:#e8f0fe;color:#2E75B6'}">${r.tag==='red'?'High':r.tag==='amber'?'Med':'Low'}</span></div>`).join('');
    let h=`<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{font-family:"DM Sans",sans-serif;background:#f6f5f2;color:#1a1a1a;margin:0;padding:20px}.wrap{max-width:860px;margin:0 auto}.sec{font-size:10px;font-weight:700;color:#2E75B6;text-transform:uppercase;letter-spacing:.08em;margin:18px 0 7px;padding-bottom:4px;border-bottom:1px solid #ddd8d0}.card{background:#fff;border:1px solid #ddd8d0;border-radius:8px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.05);margin-bottom:10px}.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.row{display:flex;justify-content:space-between;padding:5px 0;font-size:12px;border-bottom:.5px solid #e0dbd4}.row:last-child{border-bottom:none}.lbl{color:#5a5a5a}.v{font-weight:600;font-family:"JetBrains Mono",monospace;font-size:11px}.hl{background:#e8f5e9;margin:0 -10px;padding:6px 10px;border-radius:5px}.kv{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}.kn{font-size:17px;font-weight:700;font-family:"JetBrains Mono",monospace}.ks{font-size:10px;color:#999;font-family:"JetBrains Mono",monospace}.pbtn{font-family:inherit;font-size:11px;font-weight:600;padding:5px 12px;border-radius:5px;border:1px solid #ddd8d0;background:#fff;cursor:pointer}footer{margin-top:18px;font-size:9px;color:#999;text-align:center;padding-top:10px;border-top:1px solid #ddd8d0}@media print{.pbtn{display:none}}</style></head><body><div class="wrap">`;
    h+=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px"><div><h1 style="font-size:19px;font-weight:700;margin:0 0 3px">${xe(deal.deal_name||deal.address)}</h1><div style="font-size:12px;color:#5a5a5a">${xe(deal.address||'')}${deal.submarket?' · '+xe(deal.submarket):''}</div></div><button class="pbtn" onclick="window.print()">Print/PDF</button></div>`;
    h+=`<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px">`;
    [[fD(vE),'Expected','#2E75B6'],[sf.toLocaleString()+' SF','Building','#1a1a1a'],[uw.land_acres?uw.land_acres+' AC':'—','Land','#1a1a1a'],[uw.clear_height?uw.clear_height+' ft':'—','Clear Ht','#1a1a1a'],['$'+mktRent.toFixed(2),'Mkt Rent NNN','#b8860b']].forEach(([v,l,c])=>{
      h+=`<div class="card"><div class="kv">${l}</div><div class="kn" style="color:${c}">${v}</div></div>`;
    });
    h+=`</div>`;
    h+=`<div class="sec">Pricing Matrix</div><div class="card"><div class="g3" style="text-align:center">`;
    [[capBase,'Base','#b8860b',Math.round(vB/sf),vB],[capExp,'Expected','#2E75B6',Math.round(vE/sf),vE],[capOut,'Outlier','#16803c',Math.round(vO/sf),vO]].forEach(([cap,lbl,col,psf,v])=>{
      h+=`<div><div class="kn" style="color:${col}">${fD(v)}</div><div class="ks">$${psf}/SF</div><div style="font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#999;margin-top:2px">${lbl} — ${(cap*100).toFixed(1)}% cap</div></div>`;
    });
    h+=`</div></div>`;
    h+=`<div class="sec">NOI Build — Stabilized 95% Occ.</div><div class="card"><div class="row"><span class="lbl">Gross Potential Rent</span><span class="v">${fC(gpr)}</span></div><div class="row"><span class="lbl">Less: Vacancy (5%)</span><span class="v" style="color:#cc2200">(${fC(gpr-egr)})</span></div><div class="row"><span class="lbl">NNN Reimbursements</span><span class="v">${fC(reimb)}</span></div><div class="row"><span class="lbl">Less: OpEx + Mgmt</span><span class="v" style="color:#cc2200">(${fC(opex+mgmt)})</span></div><div class="row hl"><span class="lbl" style="font-weight:700;color:#16803c">Stabilized NOI</span><span class="v" style="font-size:14px;color:#16803c">${fC(noi)}</span></div></div>`;
    h+=`<div class="sec">Risk / Reward</div><div class="g2"><div><div style="font-size:11px;font-weight:700;color:#16803c;margin-bottom:6px">Strengths</div>${strRows}</div><div><div style="font-size:11px;font-weight:700;color:#cc2200;margin-bottom:6px">Risks</div>${riskRows}</div></div>`;
    if (thesis) h+=`<div style="display:flex;align-items:flex-start;gap:12px;padding:13px;border-radius:8px;background:#e8f0fe;border:1px solid #2E75B6;margin-top:12px"><div style="font-size:30px;font-weight:700;font-family:monospace;color:#2E75B6;flex-shrink:0">B+</div><div><div style="font-weight:700;font-size:13px;color:#2E75B6;margin-bottom:3px">Investment Thesis</div><div style="font-size:12px;color:#2E75B6;opacity:.85;line-height:1.5">${xe(thesis)}</div></div></div>`;
    h+=`<footer>${xe(deal.deal_name||'')} — BOV · Briana Corso, Colliers · ${new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'})} · Confidential</footer></div></body></html>`;
    if (iframeRef.current) { iframeRef.current.srcdoc=h; iframeRef.current.style.height='1500px'; }
    setGenerated(true);
    window._bovHTML=h;
  }

  const inp={width:'100%',fontFamily:'inherit',fontSize:13,padding:'7px 10px',border:'1px solid rgba(0,0,0,0.08)',borderRadius:7,background:'#F4F1EC',color:'#0F0D09',outline:'none'};
  return (
    <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:14,alignItems:'start'}}>
      <div>
        <Card title="Pricing Assumptions">
          {[{l:'Market Rent ($/SF/Mo)',v:mktRent,s:setMktRent,step:0.01},{l:'Base Cap',v:capBase,s:setCapBase,step:0.001},{l:'Expected Cap',v:capExp,s:setCapExp,step:0.001},{l:'Outlier Cap',v:capOut,s:setCapOut,step:0.001}].map(f=>(
            <div key={f.l} style={{marginBottom:9}}>
              <label style={{display:'block',fontSize:9,fontWeight:600,color:'#524D46',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:3}}>{f.l}</label>
              <input type="number" step={f.step} value={f.v} onChange={e=>f.s(parseFloat(e.target.value)||0)} style={inp}/>
            </div>
          ))}
        </Card>
        <div style={{marginTop:10}}>
          <Card title="AI Narrative">
            <button onClick={runAI} disabled={aiLoading} style={{width:'100%',padding:'7px 0',borderRadius:7,border:'none',background:'#5838A0',color:'#fff',fontFamily:'inherit',fontSize:12,fontWeight:700,cursor:'pointer',opacity:aiLoading?0.7:1,marginBottom:8}}>
              {aiLoading?'✦ Analyzing…':'✦ Generate with AI'}
            </button>
            <label style={{display:'block',fontSize:9,fontWeight:600,color:'#524D46',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:3}}>Thesis</label>
            <textarea value={thesis} onChange={e=>setThesis(e.target.value)} placeholder="AI or manual…" rows={3} style={{...inp,resize:'vertical'}}/>
          </Card>
        </div>
        <button onClick={generate} style={{width:'100%',padding:'9px 0',borderRadius:7,border:'none',background:'#156636',color:'#fff',fontFamily:'inherit',fontSize:13,fontWeight:700,cursor:'pointer',marginTop:10,marginBottom:6}}>↻ Generate Dashboard</button>
        <button onClick={()=>{if(window._bovHTML){const w=window.open('','_blank');w.document.write(window._bovHTML);w.document.close();setTimeout(()=>w.print(),500);}}} style={{width:'100%',padding:'7px 0',borderRadius:7,border:'1px solid rgba(0,0,0,0.08)',background:'#fff',color:'#524D46',fontFamily:'inherit',fontSize:12,fontWeight:600,cursor:'pointer'}}>Print / Save PDF</button>
      </div>
      <div style={{background:'#fff',borderRadius:9,border:'1px solid rgba(0,0,0,0.07)',overflow:'hidden'}}>
        <div style={{padding:'9px 14px',borderBottom:'1px solid rgba(0,0,0,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#EAE6DF'}}>
          <span style={{fontSize:11,fontWeight:600,color:'#524D46'}}>{generated?'BOV Preview':'Click Generate Dashboard to preview'}</span>
          <button onClick={generate} style={{fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:5,border:'none',background:'#4E6E96',color:'#fff',cursor:'pointer',fontFamily:'inherit'}}>↻ Generate</button>
        </div>
        <iframe ref={iframeRef} style={{width:'100%',border:'none',minHeight:300,background:'#f6f5f2'}} title="BOV Preview"/>
      </div>
    </div>
  );
}

// ─── BUYER MATCHING ───────────────────────────────────────────────────────────

function BuyerMatches({ deal, property }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [minScore, setMinScore] = useState(40);
  const [filterType, setFilterType] = useState('All');

  useEffect(() => { loadAccounts(); }, []);

  async function loadAccounts() {
    try {
      const supabase = createClient();
      const { data } = await supabase.from('accounts')
        .select('id,name,buyer_type,preferred_markets,deal_type_preference,product_preference,min_sf,max_sf,min_price,max_price,min_price_psf,max_price_psf,min_clear_height,slb_candidate,acquisition_timing,buyer_activity_score,buyer_velocity_score')
        .not('buyer_type','is',null)
        .order('buyer_activity_score',{ascending:false,nullsFirst:false})
        .limit(300);
      setAccounts(data||[]);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  function score(acct) {
    let s=0; const reasons=[];
    const uw    = deal?.underwriting_inputs||{};
    const sf    = Number(uw.building_sf||property?.building_sf)||0;
    const price = deal?.deal_value||0;
    const mkt   = (deal?.market||deal?.submarket||'').toLowerCase();
    const dtype = (deal?.deal_type||'').toLowerCase();
    const ch    = Number(uw.clear_height||property?.clear_height)||0;
    const isSLB = dtype.includes('slb')||dtype.includes('leaseback');

    const mkts = acct.preferred_markets||[];
    if (mkts.length===0) s+=10;
    else if (mkts.some(m=>(m||'').toLowerCase().includes('sgv')||mkt.includes((m||'').toLowerCase().slice(0,4)))) { s+=20; reasons.push('Market ✓'); }

    const dtypes = acct.deal_type_preference||[];
    if (dtypes.length===0) s+=10;
    else if (isSLB&&acct.slb_candidate) { s+=20; reasons.push('SLB buyer ✓'); }
    else if (dtypes.some(d=>(d||'').toLowerCase().includes(dtype.slice(0,4)))) { s+=20; reasons.push('Deal type ✓'); }

    if (sf>0&&acct.min_sf&&acct.max_sf) {
      if (sf>=acct.min_sf&&sf<=acct.max_sf) { s+=15; reasons.push('SF fits ✓'); }
      else if (sf>=acct.min_sf*0.75&&sf<=acct.max_sf*1.25) { s+=7; reasons.push('SF near range'); }
    } else { s+=8; }

    if (price>0&&acct.min_price&&acct.max_price) {
      if (price>=acct.min_price&&price<=acct.max_price) { s+=15; reasons.push('Price fits ✓'); }
      else if (price>=acct.min_price*0.8&&price<=acct.max_price*1.2) { s+=7; reasons.push('Price near range'); }
    } else { s+=8; }

    if (ch>0&&acct.min_clear_height) {
      if (ch>=acct.min_clear_height) { s+=10; reasons.push('Clear ht ✓'); }
    } else { s+=5; }

    if ((acct.buyer_activity_score||0)>=80) s+=5;
    else if ((acct.buyer_activity_score||0)>=60) s+=3;

    return { score:Math.min(100,s), reasons };
  }

  const scored = accounts
    .map(a=>({...a,...score(a)}))
    .filter(a=>a.score>=minScore&&(filterType==='All'||a.buyer_type===filterType))
    .sort((a,b)=>b.score-a.score)
    .slice(0,50);

  const TIER = s=>s>=80?{label:'A',color:'#DC2626',bg:'#FEE2E2'}:s>=60?{label:'B',color:'#D97706',bg:'#FEF3C7'}:{label:'C',color:'#4E6E96',bg:'#EFF6FF'};
  const buyerTypes = ['All',...new Set(accounts.map(a=>a.buyer_type).filter(Boolean))].slice(0,10);

  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:11,color:'#6E6860'}}>Min Score:</span>
          <input type="range" min={0} max={80} step={10} value={minScore} onChange={e=>setMinScore(+e.target.value)} style={{width:80}}/>
          <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'#4E6E96',minWidth:24}}>{minScore}+</span>
        </div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {buyerTypes.map(t=>(
            <button key={t} onClick={()=>setFilterType(t)} style={{fontFamily:'inherit',fontSize:10,padding:'3px 8px',borderRadius:20,border:`1px solid ${filterType===t?'rgba(78,110,150,0.4)':'rgba(0,0,0,0.1)'}`,background:filterType===t?'rgba(78,110,150,0.09)':'transparent',color:filterType===t?'#4E6E96':'#6E6860',cursor:'pointer'}}>{t}</button>
          ))}
        </div>
        <span style={{marginLeft:'auto',fontSize:11,color:'#6E6860',fontFamily:'var(--font-mono)'}}>{scored.length} matches</span>
      </div>
      {loading?<div style={{padding:30,textAlign:'center',color:'#6E6860'}}>Loading buyers…</div>
      :scored.length===0?<div style={{padding:30,textAlign:'center',color:'#AFA89E',fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontStyle:'italic'}}>No buyers match current criteria.</div>
      :scored.map(acct=>{
        const tier=TIER(acct.score);
        return (
          <div key={acct.id} style={{background:'#fff',borderRadius:8,border:'1px solid rgba(0,0,0,0.07)',padding:'10px 13px',marginBottom:6,display:'flex',gap:11,alignItems:'flex-start'}}>
            <div style={{width:30,height:30,borderRadius:6,background:tier.bg,color:tier.color,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,flexShrink:0,fontFamily:"'Playfair Display',serif"}}>{tier.label}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                <span style={{fontSize:13,fontWeight:600,color:'#2C2822'}}>{acct.name}</span>
                <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',padding:'1px 5px',borderRadius:20,background:'rgba(78,110,150,0.09)',color:'#4E6E96'}}>{acct.buyer_type}</span>
              </div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:3}}>
                {acct.reasons?.map((r,i)=><span key={i} style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'rgba(21,102,54,0.07)',color:'#156636',border:'1px solid rgba(21,102,54,0.18)'}}>{r}</span>)}
              </div>
              <div style={{fontSize:10,color:'#6E6860',fontFamily:'var(--font-mono)'}}>
                {acct.min_sf&&acct.max_sf?`${Math.round(acct.min_sf/1000)}K–${Math.round(acct.max_sf/1000)}K SF`:''}{acct.min_price&&acct.max_price?` · $${(acct.min_price/1e6).toFixed(0)}M–$${(acct.max_price/1e6).toFixed(0)}M`:''}
                {acct.acquisition_timing?` · ${acct.acquisition_timing}`:''}
              </div>
            </div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:15,fontWeight:700,color:tier.color,flexShrink:0}}>{acct.score}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── BUYER OUTREACH LOG ───────────────────────────────────────────────────────

function BuyerOutreachLog({ dealId }) {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({
    account_id:'', method:'call', outcome:'', notes:'',
    outreach_date:new Date().toISOString().split('T')[0], follow_up_date:'',
  });

  useEffect(() => { load(); loadAccts(); }, [dealId]);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from('buyer_outreach')
      .select('*,accounts(name,buyer_type)')
      .eq('deal_id',dealId).order('outreach_date',{ascending:false});
    setRows(data||[]); setLoading(false);
  }

  async function loadAccts() {
    const supabase = createClient();
    const { data } = await supabase.from('accounts').select('id,name,buyer_type').order('name').limit(400);
    setAccounts(data||[]);
  }

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data,error } = await supabase.from('buyer_outreach')
        .insert({ deal_id:dealId, ...form, account_id:form.account_id||null })
        .select('*,accounts(name,buyer_type)').single();
      if (error) throw error;
      setRows(prev=>[data,...prev]);
      setShowForm(false);
      setForm({ account_id:'', method:'call', outcome:'', notes:'', outreach_date:new Date().toISOString().split('T')[0], follow_up_date:'' });
    } catch(e){ alert(e.message); }
    finally { setSaving(false); }
  }

  function exportCSV() {
    const csv=[['Date','Account','Method','Outcome','Notes','Follow-Up'].join(','),
      ...rows.map(r=>[r.outreach_date,r.accounts?.name||'',r.method,r.outcome,r.notes,r.follow_up_date]
        .map(v=>`"${(v||'').replace(/"/g,'""')}"`).join(','))].join('\n');
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download='buyer_outreach.csv'; a.click();
  }

  const inp={width:'100%',fontFamily:'inherit',fontSize:13,padding:'7px 10px',border:'1px solid rgba(0,0,0,0.08)',borderRadius:7,background:'#F4F1EC',color:'#0F0D09',outline:'none'};
  const lbl={display:'block',fontSize:9,fontWeight:600,color:'#524D46',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:3};
  const METHOD_COL={ call:'#4E6E96', email:'#5838A0', meeting:'#156636', other:'#6E6860' };
  const OUTCOME_COL={ positive:'#156636', negative:'#B83714', neutral:'#6E6860','no response':'#9CA3AF' };

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <span style={{fontSize:13,color:'#6E6860'}}>{rows.length} log{rows.length!==1?'s':''}</span>
        <div style={{display:'flex',gap:8}}>
          <button onClick={exportCSV} style={{fontFamily:'inherit',fontSize:11,padding:'5px 10px',borderRadius:6,border:'1px solid rgba(0,0,0,0.08)',background:'#fff',color:'#524D46',cursor:'pointer'}}>↓ Export CSV</button>
          <button onClick={()=>setShowForm(v=>!v)} style={{fontFamily:'inherit',fontSize:11,fontWeight:600,padding:'5px 12px',borderRadius:6,border:'none',background:'#4E6E96',color:'#fff',cursor:'pointer'}}>+ Log Outreach</button>
        </div>
      </div>

      {showForm&&(
        <div style={{background:'#fff',borderRadius:9,border:'1px solid rgba(78,110,150,0.25)',padding:16,marginBottom:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><label style={lbl}>Buyer Account</label>
              <select style={inp} value={form.account_id} onChange={e=>setForm(f=>({...f,account_id:e.target.value}))}>
                <option value="">— Select account —</option>
                {accounts.map(a=><option key={a.id} value={a.id}>{a.name} ({a.buyer_type})</option>)}
              </select>
            </div>
            <div><label style={lbl}>Method</label>
              <select style={inp} value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))}>
                {['call','email','meeting','other'].map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><label style={lbl}>Outcome</label>
              <select style={inp} value={form.outcome} onChange={e=>setForm(f=>({...f,outcome:e.target.value}))}>
                <option value="">— Select —</option>
                {['positive','neutral','negative','no response'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Date</label>
              <input type="date" style={inp} value={form.outreach_date} onChange={e=>setForm(f=>({...f,outreach_date:e.target.value}))}/>
            </div>
          </div>
          <div style={{marginBottom:10}}><label style={lbl}>Notes</label>
            <textarea rows={2} style={{...inp,resize:'vertical'}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="What happened?"/>
          </div>
          <div style={{marginBottom:12}}><label style={lbl}>Follow-Up Date</label>
            <input type="date" style={inp} value={form.follow_up_date} onChange={e=>setForm(f=>({...f,follow_up_date:e.target.value}))}/>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button onClick={()=>setShowForm(false)} style={{fontFamily:'inherit',fontSize:12,padding:'6px 14px',borderRadius:6,border:'1px solid rgba(0,0,0,0.08)',background:'#fff',color:'#524D46',cursor:'pointer'}}>Cancel</button>
            <button onClick={save} disabled={saving} style={{fontFamily:'inherit',fontSize:12,fontWeight:600,padding:'6px 14px',borderRadius:6,border:'none',background:'#4E6E96',color:'#fff',cursor:'pointer'}}>{saving?'Saving…':'Save'}</button>
          </div>
        </div>
      )}

      {loading?<div style={{padding:24,textAlign:'center',color:'#6E6860'}}>Loading…</div>
      :rows.length===0?<div style={{padding:24,textAlign:'center',color:'#AFA89E',fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontStyle:'italic'}}>No outreach logged yet.</div>
      :rows.map((r,i)=>(
        <div key={r.id||i} style={{background:'#fff',borderRadius:8,border:'1px solid rgba(0,0,0,0.07)',padding:'10px 14px',marginBottom:6}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10}}>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                <span style={{fontSize:13,fontWeight:600,color:'#2C2822'}}>{r.accounts?.name||'Unknown'}</span>
                <span style={{fontSize:9,padding:'1px 6px',borderRadius:3,background:'rgba(0,0,0,0.05)',color:METHOD_COL[r.method]||'#6E6860',fontWeight:700,textTransform:'uppercase',fontFamily:'var(--font-mono)'}}>{r.method}</span>
                {r.outcome&&<span style={{fontSize:9,padding:'1px 6px',borderRadius:3,background:'rgba(0,0,0,0.04)',color:OUTCOME_COL[r.outcome]||'#6E6860',fontWeight:700,textTransform:'uppercase',fontFamily:'var(--font-mono)'}}>{r.outcome}</span>}
              </div>
              {r.notes&&<div style={{fontSize:12,color:'#524D46',lineHeight:1.5}}>{r.notes}</div>}
              {r.follow_up_date&&<div style={{fontSize:11,color:'#D97706',marginTop:4,fontFamily:'var(--font-mono)'}}>Follow-up: {fmtSh(r.follow_up_date)}</div>}
            </div>
            <div style={{fontSize:11,color:'#AFA89E',fontFamily:'var(--font-mono)',flexShrink:0}}>{fmtSh(r.outreach_date)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function DealDetail() {
  const { id }  = useParams();
  const router  = useRouter();

  const [deal, setDeal]           = useState(null);
  const [property, setProperty]   = useState(null);
  const [lead, setLead]           = useState(null);
  const [activities, setActivities] = useState([]);
  const [contacts, setContacts]   = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [files, setFiles]         = useState([]);
  const [comps, setComps]         = useState([]);
  const [loading, setLoading]     = useState(true);

  const [activeTab, setActiveTab]   = useState('overview');
  const [propSubTab, setPropSubTab] = useState('specs');
  const [uwView, setUwView]         = useState('quick');
  const [logType, setLogType]       = useState('call');
  const [logNote, setLogNote]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiNextStep, setAiNextStep] = useState('');
  const [mapCoords, setMapCoords]   = useState(null);

  const mapRef     = useRef(null);
  const mapInitRef = useRef(false);

  useEffect(() => { if (id) load(); }, [id]);

  // Init Leaflet map once we have coords
  useEffect(() => {
    if (!mapCoords || mapInitRef.current || typeof window==='undefined') return;
    (async () => {
      const L = (await import('leaflet')).default;
      if (mapInitRef.current || !mapRef.current) return;
      mapInitRef.current = true;
      const map = L.map(mapRef.current, { zoomControl:false, scrollWheelZoom:false, dragging:false, doubleClickZoom:false, attributionControl:false });
      map.setView([mapCoords.lat, mapCoords.lng], 16);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20}).addTo(map);
      const icon = L.divIcon({ className:'', html:'<div style="width:12px;height:12px;border-radius:50%;background:#DC2626;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.6)"></div>', iconSize:[12,12], iconAnchor:[6,6] });
      L.marker([mapCoords.lat, mapCoords.lng], {icon}).addTo(map);
    })();
  }, [mapCoords]);

  async function load() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data:d, error } = await supabase.from('deals').select('*').eq('id',id).single();
      if (error) throw error;
      setDeal(d);

      // Geocode address
      if (d?.address) {
        try {
          const geo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(d.address+', California')}&limit=1`,{headers:{'User-Agent':'Clerestory/1.0'}});
          const gd  = await geo.json();
          if (gd?.[0]) setMapCoords({ lat:parseFloat(gd[0].lat), lng:parseFloat(gd[0].lon) });
        } catch {}
      }

      const [actsR, ctctsR, tasksR, filesR] = await Promise.all([
        supabase.from('activities').select('*').eq('deal_id',id).order('activity_date',{ascending:false}).limit(30),
        supabase.from('deal_contacts').select('contact_id,role,contacts(id,first_name,last_name,title,company,phone,email)').eq('deal_id',id),
        supabase.from('tasks').select('*').eq('deal_id',id).order('due_date',{ascending:true}).limit(20),
        supabase.from('file_attachments').select('*').eq('deal_id',id).order('created_at',{ascending:false}).limit(20),
      ]);
      setActivities(actsR.data||[]);
      setContacts((ctctsR.data||[]).map(r=>({...r.contacts,role:r.role})).filter(Boolean));
      setTasks(tasksR.data||[]);
      setFiles(filesR.data||[]);

      if (d?.property_id) {
        const { data:prop } = await supabase.from('properties').select('*').eq('id',d.property_id).single();
        if (prop) {
          setProperty(prop);
          if (prop.city||prop.submarket) {
            const q = prop.city||prop.submarket;
            const { data:c } = await supabase.from('lease_comps').select('*').ilike('city',`%${q}%`).order('lease_date',{ascending:false}).limit(10);
            setComps(c||[]);
          }
        }
      }

      if (d?.lead_id) {
        const { data:l } = await supabase.from('leads').select('id,catalyst_tags,score,stage').eq('id',d.lead_id).single();
        if (l) setLead(l);
      }

    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function updateStage(newStage) {
    const supabase = createClient();
    await supabase.from('deals').update({ stage:newStage, updated_at:new Date().toISOString() }).eq('id',id);
    setDeal(d=>({...d, stage:newStage}));
    const act = { deal_id:id, activity_type:'system', subject:`Stage → ${newStage}`, activity_date:new Date().toISOString().split('T')[0] };
    await supabase.from('activities').insert(act);
    setActivities(prev=>[act,...prev]);
  }

  async function logActivity() {
    if (!logNote.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const act = { deal_id:id, activity_type:logType, subject:`${logType.charAt(0).toUpperCase()+logType.slice(1)} logged`, notes:logNote, activity_date:new Date().toISOString().split('T')[0] };
      const { data } = await supabase.from('activities').insert(act).select().single();
      setActivities(prev=>[data||act,...prev]);
      setLogNote('');
    } catch(e){ console.error(e); }
    finally { setSaving(false); }
  }

  async function runAISynthesize() {
    setAiLoading(true);
    try {
      const recentActs = activities.slice(0,5).map(a=>`${a.activity_type}: ${a.subject}${a.notes?' — '+a.notes:''}`).join('\n');
      const cats = parseCatalysts(lead?.catalyst_tags||property?.catalyst_tags).map(c=>typeof c==='string'?c:(c.tag||'')).filter(Boolean).join(', ');
      const res = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:500,
          messages:[{role:'user',content:`Senior industrial CRE broker at Colliers. Synthesize this deal status and give a specific next step.

Deal: ${deal.deal_name}, Stage: ${deal.stage}, Value: $${deal.deal_value?.toLocaleString()}, Type: ${deal.deal_type}
Address: ${deal.address}, Market: ${deal.market||'SGV'}
Recent activities: ${recentActs||'None yet'}
Catalyst signals: ${cats||'None'}
Notes: ${deal.notes||'None'}

Return ONLY valid JSON no markdown: {"synthesis":"2-3 sentence deal status","next_step":"Specific action with date or timeframe","urgency":"high|medium|low"}`}]
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse((data.content?.[0]?.text||'{}').replace(/```json|```/g,'').trim());
      const supabase = createClient();
      await supabase.from('deals').update({ ai_synthesis:parsed.synthesis, ai_synthesis_at:new Date().toISOString() }).eq('id',id);
      setDeal(prev=>({...prev, ai_synthesis:parsed.synthesis}));
      setAiNextStep(parsed.next_step||'');
    } catch(e){ console.error(e); }
    finally { setAiLoading(false); }
  }

  async function runComps() {
    const supabase = createClient();
    const city = property?.city || deal?.address?.split(',')[1]?.trim() || deal?.submarket;
    if (!city) return;
    const { data } = await supabase.from('lease_comps').select('*').ilike('city',`%${city}%`).order('lease_date',{ascending:false}).limit(12);
    setComps(data||[]);
    setActiveTab('property');
    setPropSubTab('comps');
  }

  function exportMemo() {
    const uw = deal?.underwriting_inputs||{};
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;max-width:760px;margin:40px auto;color:#1a1a1a;line-height:1.6;font-size:14px}h1{font-size:22px;margin-bottom:4px}h2{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#4E6E96;border-bottom:1px solid #ddd;padding-bottom:4px;margin:22px 0 10px}table{width:100%;border-collapse:collapse}td,th{padding:6px 10px;border:1px solid #ddd;font-size:13px}th{background:#f5f5f5;font-weight:600;text-align:left}.footer{margin-top:40px;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:10px}@media print{body{margin:20px}}</style></head><body>
<h1>${deal.deal_name||deal.address}</h1>
<p style="color:#6E6860;font-size:13px">${deal.address||''} · ${deal.submarket||deal.market||'SGV'} · ${deal.deal_type||''}</p>
<h2>Investment Summary</h2><table><tr><th>Metric</th><th>Value</th></tr>
<tr><td>Deal Value</td><td>${fmtM(deal.deal_value)}</td></tr>
<tr><td>Stage</td><td>${deal.stage}</td></tr>
<tr><td>Commission Est.</td><td>${fmtM(deal.commission_est)}</td></tr>
<tr><td>Close Probability</td><td>${deal.probability!=null?deal.probability+'%':'—'}</td></tr>
<tr><td>Target Close</td><td>${fmtDate(deal.close_date)}</td></tr>
<tr><td>Building SF</td><td>${uw.building_sf?fmtN(uw.building_sf)+' SF':'—'}</td></tr>
<tr><td>Clear Height</td><td>${uw.clear_height?uw.clear_height+' ft':'—'}</td></tr>
<tr><td>Year Built</td><td>${uw.year_built||'—'}</td></tr>
</table>
${deal.ai_synthesis?`<h2>Deal Synthesis</h2><p>${deal.ai_synthesis}</p>`:''}
${deal.notes?`<h2>Notes</h2><p>${deal.notes}</p>`:''}
<div class="footer">Briana Corso, Senior Associate — Colliers International SGV/IE · ${new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'})} · Confidential</div>
</body></html>`;
    const w=window.open('','_blank'); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),400);
  }

  async function advanceStage() {
    const idx=STAGES.indexOf(deal.stage);
    if (idx<STAGES.length-1) await updateStage(STAGES[idx+1]);
  }

  if (loading) return <div style={{padding:48,color:'#6E6860',fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontStyle:'italic'}}>Loading deal…</div>;
  if (!deal)   return <div style={{padding:48}}><Link href="/deals" style={{color:'#4E6E96'}}>← Back to Pipeline</Link></div>;

  const showComm  = COMMISSION_STAGES.has(deal.stage);
  const showBOV   = BOV_STAGES.has(deal.stage);
  const uw        = deal.underwriting_inputs||{};
  const stageCol  = STAGE_COLOR[deal.stage]||'#9CA3AF';
  const catalysts = parseCatalysts(lead?.catalyst_tags||property?.catalyst_tags);
  const nextStage = STAGES[STAGES.indexOf(deal.stage)+1];

  const TABS = [
    {key:'overview',  label:'Overview'},
    {key:'uw',        label:'Underwriting'},
    ...(showBOV?[{key:'bov',label:'BOV Dashboard'}]:[]),
    {key:'property',  label:`Property${property?' ✓':''}`},
    {key:'contacts',  label:`Contacts${contacts.length?` (${contacts.length})`:''}`},
    {key:'outreach',  label:'Buyer Outreach'},
    {key:'tasks',     label:`Tasks${tasks.length?` (${tasks.length})`:''}`},
    {key:'files',     label:`Files${files.length?` (${files.length})`:''}`},
  ];

  return (
    <div style={{fontFamily:"'Instrument Sans',sans-serif",background:'#F4F1EC',minHeight:'100vh'}}>

      {/* ── HERO MAP ── */}
      <div style={{height:240,position:'relative',overflow:'hidden',background:'#1A2130'}}>
        <div ref={mapRef} style={{width:'100%',height:'100%'}}/>
        {!mapCoords&&(
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',opacity:0.2}}>
            <div style={{textAlign:'center'}}><div style={{fontSize:28,marginBottom:4}}>📍</div><div style={{fontSize:9,color:'#89A8C6',fontFamily:'var(--font-mono)',letterSpacing:'0.12em'}}>GEOCODING ADDRESS…</div></div>
          </div>
        )}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(10,8,5,0.88) 0%,rgba(10,8,5,0.1) 55%,transparent 100%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'16px 28px',zIndex:2}}>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
            <div>
              <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:25,fontWeight:700,color:'#fff',lineHeight:1,marginBottom:7}}>
                {deal.deal_name||deal.address}
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {deal.deal_type&&<span style={{padding:'3px 9px',borderRadius:4,fontSize:10,fontWeight:500,border:'1px solid rgba(137,168,198,0.45)',background:'rgba(78,110,150,0.28)',color:'#C8E0F8',backdropFilter:'blur(6px)'}}>{deal.deal_type}</span>}
                <span style={{padding:'3px 9px',borderRadius:4,fontSize:10,fontWeight:500,border:`1px solid ${stageCol}50`,background:`${stageCol}28`,color:'#fff',backdropFilter:'blur(6px)'}}>{deal.stage}</span>
                {deal.probability!=null&&<span style={{padding:'3px 9px',borderRadius:4,fontSize:10,fontWeight:500,border:'1px solid rgba(60,180,110,0.45)',background:'rgba(5,150,105,0.28)',color:'#B8F0D0',backdropFilter:'blur(6px)'}}>{deal.probability}% Close Probability</span>}
                {uw.building_sf&&<span style={{padding:'3px 9px',borderRadius:4,fontSize:10,fontWeight:500,border:'1px solid rgba(137,168,198,0.3)',background:'rgba(78,110,150,0.18)',color:'#C8E0F8',backdropFilter:'blur(6px)'}}>{Number(uw.building_sf).toLocaleString()} SF · {deal.market||deal.submarket||'SGV'}</span>}
              </div>
            </div>
            <Link href="/deals" style={{color:'rgba(255,255,255,0.5)',fontSize:11,textDecoration:'none',padding:'5px 10px',border:'1px solid rgba(255,255,255,0.15)',borderRadius:5,backdropFilter:'blur(6px)'}}>← Pipeline</Link>
          </div>
        </div>
      </div>

      {/* ── ACTION BAR ── */}
      <div style={{background:'#EAE6DF',borderBottom:'1px solid rgba(0,0,0,0.08)',padding:'8px 28px',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
        {['call','email','note'].map(t=>(
          <button key={t} onClick={()=>{ setLogType(t); setActiveTab('overview'); setTimeout(()=>document.getElementById('log-textarea')?.focus(),100); }}
            style={{fontFamily:'inherit',fontSize:12,fontWeight:500,padding:'5px 11px',borderRadius:6,border:'1px solid rgba(0,0,0,0.09)',background:'#fff',color:'#524D46',cursor:'pointer'}}>
            {t==='call'?'📞 Log Call':t==='email'?'✉ Log Email':'📝 Add Note'}
          </button>
        ))}
        <div style={{width:1,height:18,background:'rgba(0,0,0,0.1)',margin:'0 2px'}}/>
        {deal.address&&<>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(deal.address)}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:'#4E6E96',textDecoration:'none',padding:'4px 8px',cursor:'pointer'}}>📍 Google Maps</a>
          <a href={`https://portal.assessor.lacounty.gov/`} target="_blank" rel="noreferrer" style={{fontSize:11,color:'#4E6E96',textDecoration:'none',padding:'4px 8px'}}>🗺 LA County GIS</a>
        </>}
        <div style={{width:1,height:18,background:'rgba(0,0,0,0.1)',margin:'0 2px'}}/>
        <button onClick={runAISynthesize} disabled={aiLoading} style={{fontFamily:'inherit',fontSize:12,fontWeight:600,padding:'5px 11px',borderRadius:6,border:'1px solid rgba(88,56,160,0.3)',background:'rgba(88,56,160,0.08)',color:'#5838A0',cursor:'pointer',opacity:aiLoading?0.7:1}}>
          {aiLoading?'✦ Analyzing…':'✦ Synthesize'}
        </button>
        <button onClick={runComps} style={{fontFamily:'inherit',fontSize:12,fontWeight:500,padding:'5px 11px',borderRadius:6,border:'1px solid rgba(0,0,0,0.09)',background:'#fff',color:'#524D46',cursor:'pointer'}}>📊 Run Comps</button>
        <button onClick={exportMemo} style={{fontFamily:'inherit',fontSize:12,fontWeight:500,padding:'5px 11px',borderRadius:6,border:'1px solid rgba(0,0,0,0.09)',background:'#fff',color:'#524D46',cursor:'pointer'}}>↓ Export Memo</button>
        {showBOV&&<button onClick={()=>setActiveTab('bov')} style={{fontFamily:'inherit',fontSize:12,fontWeight:500,padding:'5px 11px',borderRadius:6,border:'1px solid rgba(21,102,54,0.3)',background:'rgba(21,102,54,0.08)',color:'#156636',cursor:'pointer'}}>↓ Export BOV</button>}
        <div style={{marginLeft:'auto'}}/>
        {nextStage&&<button onClick={advanceStage} style={{fontFamily:'inherit',fontSize:12,fontWeight:700,padding:'6px 14px',borderRadius:6,border:'none',background:stageCol,color:'#fff',cursor:'pointer',boxShadow:`0 2px 6px ${stageCol}45`}}>Advance to {nextStage} →</button>}
      </div>

      {/* ── STAGE TRACK ── */}
      <StageTrack currentStage={deal.stage} onStageClick={updateStage}/>

      {/* ── INNER ── */}
      <div style={{padding:'16px 28px 60px'}}>

        {/* KPI STRIP */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',background:'#fff',borderRadius:10,boxShadow:'0 1px 4px rgba(0,0,0,0.07)',border:'1px solid rgba(0,0,0,0.06)',overflow:'hidden',marginBottom:16}}>
          {[
            {lbl:'Deal Value',       val:fmtM(deal.deal_value),   color:'#0F0D09',  sub:deal.deal_type},
            {lbl:'Commission Est.',  val:showComm?fmtM(deal.commission_est):'—', color:showComm?'#156636':'#AFA89E', sub:deal.commission_rate?`${deal.commission_rate}%`:''},
            {lbl:'Close Probability',val:deal.probability!=null?`${deal.probability}%`:'—', color:deal.probability>=70?'#156636':deal.probability>=40?'#D97706':'#0F0D09', sub:'Current estimate'},
            {lbl:'Deal Type',        val:deal.deal_type||'—',     color:'#524D46',  sm:true, sub:deal.strategy},
            {lbl:'Target Close',     val:deal.close_date?new Date(deal.close_date).toLocaleDateString('en-US',{month:'short',year:'numeric'}):'—', color:'#D97706', sm:true, sub:deal.close_date?`~${Math.max(0,Math.ceil((new Date(deal.close_date)-Date.now())/864e5))}d`:''},
          ].map((k,i)=>(
            <div key={i} style={{padding:'13px 15px',borderRight:i<4?'1px solid rgba(0,0,0,0.06)':'none'}}>
              <div style={{fontSize:9,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#6E6860',marginBottom:5,fontFamily:'var(--font-mono)'}}>{k.lbl}</div>
              <div style={{fontFamily:k.sm?"'Instrument Sans',sans-serif":"'Playfair Display',Georgia,serif",fontSize:k.sm?15:22,fontWeight:k.sm?400:700,color:k.color,lineHeight:1,letterSpacing:k.sm?0:'-0.02em'}}>{k.val}</div>
              {k.sub&&<div style={{fontSize:11,color:'#6E6860',marginTop:3}}>{k.sub}</div>}
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{display:'flex',borderBottom:'1px solid rgba(0,0,0,0.08)',marginBottom:16,overflowX:'auto'}}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setActiveTab(t.key)}
              style={{padding:'9px 14px',fontSize:13,color:activeTab===t.key?'#4E6E96':'#6E6860',background:'none',border:'none',borderBottom:activeTab===t.key?'2px solid #4E6E96':'2px solid transparent',marginBottom:-1,fontWeight:activeTab===t.key?500:400,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',transition:'all .1s'}}>
              {t.label}
              {t.key==='bov'&&<span style={{marginLeft:5,fontSize:9,background:'#5838A0',color:'#fff',borderRadius:4,padding:'1px 5px'}}>AI</span>}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab==='overview'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 284px',gap:16,alignItems:'start'}}>
            {/* Left: activity */}
            <div>
              <div style={{background:'#fff',borderRadius:9,border:'1px solid rgba(0,0,0,0.07)',overflow:'hidden'}}>
                <div style={{padding:'9px 14px',borderBottom:'1px solid rgba(0,0,0,0.05)',display:'flex',alignItems:'center',gap:6}}>
                  <span style={{width:5,height:5,borderRadius:'50%',background:'#DC2626',display:'inline-block',animation:'blink 1.4s infinite',flexShrink:0}}/>
                  <span style={{fontSize:10,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#524D46',flex:1}}>Activity Timeline</span>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,fontStyle:'italic',color:'#6E6860'}}>{activities.length} entries</span>
                </div>
                {/* Log form */}
                <div style={{padding:'10px 14px',borderBottom:'1px solid rgba(0,0,0,0.04)',background:'rgba(0,0,0,0.015)'}}>
                  <div style={{display:'flex',gap:5,marginBottom:7}}>
                    {['call','email','note','meeting'].map(t=>(
                      <button key={t} onClick={()=>setLogType(t)} style={{fontFamily:'inherit',fontSize:11,fontWeight:600,padding:'4px 10px',borderRadius:5,border:`1px solid ${logType===t?'rgba(78,110,150,0.3)':'rgba(0,0,0,0.08)'}`,background:logType===t?'rgba(78,110,150,0.09)':'#fff',color:logType===t?'#4E6E96':'#6E6860',cursor:'pointer',textTransform:'capitalize'}}>{t}</button>
                    ))}
                  </div>
                  <textarea id="log-textarea" placeholder={`Log a ${logType}…`} value={logNote} onChange={e=>setLogNote(e.target.value)} rows={2}
                    style={{width:'100%',fontFamily:'inherit',fontSize:13,padding:'7px 10px',border:'1px solid rgba(0,0,0,0.08)',borderRadius:7,background:'#fff',color:'#0F0D09',resize:'none',outline:'none',marginBottom:7}}/>
                  <button onClick={logActivity} disabled={saving||!logNote.trim()} style={{padding:'6px 14px',background:'#4E6E96',color:'#fff',border:'none',borderRadius:6,fontFamily:'inherit',fontSize:12,fontWeight:500,cursor:'pointer',opacity:!logNote.trim()||saving?0.5:1}}>
                    {saving?'Saving…':'Log'}
                  </button>
                </div>
                {/* Feed */}
                {activities.length===0?(
                  <div style={{padding:'20px 14px',textAlign:'center',fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontStyle:'italic',color:'#AFA89E'}}>No activity yet — log your first touchpoint above</div>
                ):activities.map((a,i)=>{
                  const type=a.activity_type||'note';
                  return (
                    <div key={i} style={{display:'flex',gap:10,padding:'10px 14px',borderBottom:'1px solid rgba(0,0,0,0.04)'}}>
                      <div style={{width:26,height:26,borderRadius:'50%',background:ACT_BG[type]||ACT_BG.note,color:ACT_COLOR[type]||ACT_COLOR.note,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,flexShrink:0,marginTop:1}}>{ACT_ICON[type]||'📌'}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,color:'#2C2822',lineHeight:1.4}}><strong style={{fontWeight:500}}>{a.subject}</strong>{a.notes&&<span style={{color:'#524D46'}}> — {a.notes}</span>}</div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:11.5,fontStyle:'italic',color:'#6E6860',marginTop:1}}>Briana Corso · {fmtSh(a.activity_date)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{display:'flex',flexDirection:'column',gap:12}}>

              {/* Probability */}
              <div style={{background:'#fff',borderRadius:9,border:'1px solid rgba(5,150,105,0.25)',overflow:'hidden'}}>
                <div style={{padding:'13px 14px'}}>
                  <div style={{fontSize:9,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#059669',marginBottom:6,fontFamily:'var(--font-mono)'}}>Close Probability</div>
                  <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:44,fontWeight:700,color:'#059669',lineHeight:1,letterSpacing:'-0.03em'}}>{deal.probability!=null?`${deal.probability}%`:'—'}</div>
                  <div style={{height:4,background:'#EAE6DF',borderRadius:2,overflow:'hidden',margin:'9px 0'}}>
                    <div style={{height:'100%',width:`${deal.probability||0}%`,background:'linear-gradient(90deg,#6480A2,#059669)',borderRadius:2}}/>
                  </div>
                  {deal.notes&&<div style={{fontSize:12,color:'#524D46',lineHeight:1.55}}>{deal.notes}</div>}
                </div>
              </div>

              {/* AI Next Step + Synthesis */}
              <div style={{background:'rgba(88,56,160,0.07)',border:'1px solid rgba(88,56,160,0.2)',borderRadius:9,overflow:'hidden'}}>
                <div style={{padding:'8px 14px',borderBottom:'1px solid rgba(88,56,160,0.12)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:10,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#5838A0'}}>✦ AI Next Step</span>
                  <button onClick={runAISynthesize} disabled={aiLoading} style={{fontFamily:'inherit',fontSize:10,color:'#5838A0',background:'none',border:'1px solid rgba(88,56,160,0.25)',borderRadius:4,padding:'2px 7px',cursor:'pointer'}}>
                    {aiLoading?'…':'Refresh'}
                  </button>
                </div>
                <div style={{padding:'11px 14px'}}>
                  {aiNextStep?(
                    <div style={{fontSize:13,fontWeight:600,color:'#5838A0',marginBottom:deal.ai_synthesis?8:0,lineHeight:1.45}}>{aiNextStep}</div>
                  ):(
                    <div style={{fontSize:12,color:'#9E8BC0',fontStyle:'italic',marginBottom:deal.ai_synthesis?8:0}}>
                      {aiLoading?'Analyzing deal…':'Click Synthesize for an AI recommendation'}
                    </div>
                  )}
                  {deal.ai_synthesis&&<div style={{fontSize:12.5,color:'#524D46',lineHeight:1.65,borderTop:aiNextStep?'1px solid rgba(88,56,160,0.1)':'none',paddingTop:aiNextStep?8:0}}>{deal.ai_synthesis}</div>}
                </div>
              </div>

              {/* Catalyst tags */}
              {catalysts.length>0&&(
                <Card title="Catalyst Signals" accent="#B83714">
                  <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                    {catalysts.map((c,i)=><CatalystTag key={i} tag={c}/>)}
                  </div>
                  {lead&&<div style={{marginTop:8,fontSize:11,color:'#6E6860',fontFamily:'var(--font-mono)'}}>Lead score: {lead.score||'—'} · {lead.stage}</div>}
                </Card>
              )}

              {/* Deal details */}
              <Card title="Deal Details" action="Edit" onAction={()=>{}}>
                <FieldRow label="Deal Type"    value={deal.deal_type}/>
                <FieldRow label="Stage"        value={deal.stage} color={stageCol}/>
                <FieldRow label="Priority"     value={deal.priority} color={deal.priority==='High'?'#BE185D':deal.priority==='Critical'?'#7C3AED':undefined}/>
                <FieldRow label="Seller"       value={deal.seller}/>
                <FieldRow label="Tenant"       value={deal.tenant_name}/>
                <FieldRow label="Market"       value={deal.market}/>
                <FieldRow label="Submarket"    value={deal.submarket}/>
                <FieldRow label="Prop Type"    value={uw.prop_type}/>
                <FieldRow label="Prop Subtype" value={uw.prop_subtype}/>
                <FieldRow label="Building SF"  value={uw.building_sf?fmtN(uw.building_sf)+' SF':null} mono/>
                <FieldRow label="Clear Height" value={uw.clear_height?uw.clear_height+' ft':null}/>
                <FieldRow label="Year Built"   value={uw.year_built?String(uw.year_built):null}/>
                <FieldRow label="Close Date"   value={fmtDate(deal.close_date)}/>
                <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:4}}>
                  {deal.property_id&&<Link href={`/properties/${deal.property_id}`} style={{fontSize:12,color:'#4E6E96',textDecoration:'none',fontWeight:500}}>→ Property Record</Link>}
                  {deal.lead_id&&<Link href={`/leads/${deal.lead_id}`} style={{fontSize:12,color:'#4E6E96',textDecoration:'none',fontWeight:500}}>→ Original Lead</Link>}
                </div>
              </Card>

              {/* Opportunity memo — shows if no AI next step yet */}
              {deal.ai_synthesis&&!aiNextStep&&(
                <div style={{background:'rgba(78,110,150,0.09)',border:'1px solid rgba(78,110,150,0.25)',borderRadius:9,overflow:'hidden'}}>
                  <div style={{padding:'8px 14px',background:'rgba(78,110,150,0.12)',borderBottom:'1px solid rgba(78,110,150,0.15)',fontSize:10,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#4E6E96'}}>Opportunity Memo</div>
                  <div style={{padding:'11px 14px',fontSize:13,lineHeight:1.7,color:'#2C2822'}}>{deal.ai_synthesis}</div>
                </div>
              )}

              {/* Synthesize CTA */}
              {!deal.ai_synthesis&&!aiLoading&&(
                <button onClick={runAISynthesize} style={{width:'100%',padding:'10px 0',borderRadius:8,border:'1px solid rgba(88,56,160,0.3)',background:'rgba(88,56,160,0.07)',color:'#5838A0',fontFamily:'inherit',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                  ✦ Synthesize Deal + Get Next Step
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── UNDERWRITING TAB ── */}
        {activeTab==='uw'&&(
          <div style={{paddingBottom:40}}>
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              {[{v:'quick',l:'Quick Underwrite'},{v:'returns',l:'Returns Dashboard'}].map(b=>(
                <button key={b.v} onClick={()=>setUwView(b.v)} style={{fontFamily:'inherit',fontSize:13,padding:'7px 16px',borderRadius:7,border:'1px solid rgba(0,0,0,0.09)',background:uwView===b.v?'#4E6E96':'#fff',color:uwView===b.v?'#fff':'#524D46',cursor:'pointer',fontWeight:uwView===b.v?600:400}}>{b.l}</button>
              ))}
            </div>

            {uwView==='quick'&&(
              <div style={{background:'#fff',borderRadius:9,border:'1px solid rgba(78,110,150,0.25)',overflow:'hidden',position:'relative'}}>
                <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:'#6480A2'}}/>
                <div style={{padding:'11px 20px 11px 24px',borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
                  <div style={{fontSize:13.5,fontWeight:500,color:'#2C2822'}}>Quick Underwrite</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,fontStyle:'italic',color:'#6E6860'}}>Values from underwriting_inputs · link to BOV for full model</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,padding:'16px 24px'}}>
                  {[
                    {l:'Asking Price',        v:fmtM(deal.deal_value)},
                    {l:'In-Place Rent NNN',   v:uw.gross_rent_monthly&&uw.building_sf?`$${(uw.gross_rent_monthly/uw.building_sf).toFixed(2)}/SF/mo`:'—'},
                    {l:'Market Rent NNN',     v:uw.market_rent_nnn?`$${uw.market_rent_nnn}/SF/mo`:'—'},
                    {l:'Cap Rate (Expected)', v:uw.cap_rate_expected?`${(uw.cap_rate_expected*100).toFixed(2)}%`:'—'},
                    {l:'Building SF',         v:uw.building_sf?fmtN(uw.building_sf)+' SF':'—'},
                    {l:'Occupancy',           v:uw.occupancy_pct?`${uw.occupancy_pct}%`:'—'},
                    {l:'Clear Height',        v:uw.clear_height?uw.clear_height+' ft':'—'},
                    {l:'Year Built',          v:uw.year_built?String(uw.year_built):'—'},
                    {l:'Blended NNN Rate',    v:uw.blended_rate_nnn?`$${uw.blended_rate_nnn}/SF/mo`:'—'},
                  ].map((f,i)=>(
                    <div key={i}>
                      <label style={{fontSize:10,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#524D46',display:'block',marginBottom:5}}>{f.l}</label>
                      <div style={{padding:'8px 11px',border:'1px solid rgba(0,0,0,0.08)',borderRadius:7,fontSize:13.5,color:'#2C2822',background:'#F4F1EC',fontFamily:'var(--font-mono)'}}>{f.v}</div>
                    </div>
                  ))}
                </div>
                {/* Quick calc strip */}
                {uw.building_sf&&uw.cap_rate_expected&&deal.deal_value&&(()=>{
                  const sf=Number(uw.building_sf), cap=Number(uw.cap_rate_expected);
                  const mktR=Number(uw.market_rent_nnn||1.22);
                  const noi=sf*mktR*12*0.95-sf*2.00;
                  const impliedVal=noi/cap;
                  const goingInCap=((noi/deal.deal_value)*100).toFixed(2);
                  return (
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',background:'#EAE6DF',borderTop:'1px solid rgba(0,0,0,0.07)'}}>
                      {[{l:'Going-In Cap',v:`${goingInCap}%`},{l:'Stabilized NOI',v:'$'+Math.round(noi).toLocaleString()},{l:'Implied Value',v:fmtM(impliedVal)},{l:'Mkt Rent NOI',v:'$'+(sf*mktR*12*0.95-sf*2.00).toLocaleString().split('.')[0]}].map((r,i)=>(
                        <div key={i} style={{padding:'11px 14px',borderRight:i<3?'1px solid rgba(0,0,0,0.07)':'none'}}>
                          <div style={{fontSize:9,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#6E6860',marginBottom:4,fontFamily:'var(--font-mono)'}}>{r.l}</div>
                          <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:20,fontWeight:700,color:'#4E6E96',lineHeight:1}}>{r.v}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div style={{padding:'10px 24px',display:'flex',alignItems:'center',gap:8}}>
                  {showBOV&&<button onClick={()=>setActiveTab('bov')} style={{fontFamily:'inherit',fontSize:13,fontWeight:500,padding:'7px 14px',background:'rgba(21,102,54,0.08)',color:'#156636',border:'1px solid rgba(21,102,54,0.22)',borderRadius:7,cursor:'pointer'}}>Open BOV Dashboard →</button>}
                  <span style={{marginLeft:'auto',fontFamily:"'Cormorant Garamond',serif",fontSize:12,fontStyle:'italic',color:'#6E6860'}}>Updated {fmtDate(deal.updated_at)}</span>
                </div>
              </div>
            )}

            {uwView==='returns'&&(
              <div>
                <div style={{background:'#fff',borderRadius:9,border:'1px solid rgba(0,0,0,0.07)',overflow:'hidden',marginBottom:14}}>
                  <div style={{padding:'11px 16px',borderBottom:'1px solid rgba(0,0,0,0.06)',fontSize:10,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#524D46'}}>Returns Summary</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)'}}>
                    {[{l:'Unlevered IRR',c:'#059669'},{l:'Levered IRR',c:'#059669'},{l:'Equity Multiple',c:'#4E6E96'},{l:'DSCR Yr 1',c:'#4E6E96'}].map((r,i)=>(
                      <div key={i} style={{padding:'16px',borderRight:i<3?'1px solid rgba(0,0,0,0.06)':'none',textAlign:'center'}}>
                        <div style={{fontSize:9,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#6E6860',marginBottom:7,fontFamily:'var(--font-mono)'}}>{r.l}</div>
                        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:26,fontWeight:700,color:r.c,lineHeight:1}}>—</div>
                        <div style={{fontSize:11,color:'#AFA89E',marginTop:4}}>Run BOV for actuals</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{background:'#fff',borderRadius:9,border:'1px solid rgba(0,0,0,0.07)',overflow:'hidden'}}>
                  <div style={{padding:'11px 16px',borderBottom:'1px solid rgba(0,0,0,0.06)',fontSize:10,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#524D46'}}>IRR Sensitivity — Exit Cap vs. Rent Growth</div>
                  <div style={{padding:14,overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontFamily:'var(--font-mono)',fontSize:11.5}}>
                      <thead><tr>
                        <th style={{padding:'6px 10px',background:'#EAE6DF',border:'1px solid rgba(0,0,0,0.07)',fontSize:9,textAlign:'left',color:'#524D46',fontWeight:600}}>Exit Cap \ Rent Growth</th>
                        {['2.0%','2.5%','3.0% ●','3.5%','4.0%'].map(h=><th key={h} style={{padding:'6px 10px',background:'#EAE6DF',border:'1px solid rgba(0,0,0,0.07)',fontSize:9,color:'#524D46',fontWeight:600}}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {['4.50%','4.75%','5.00%','5.25% ●','5.50%','5.75%'].map((row,ri)=>(
                          <tr key={ri}>{[row,'—','—','—','—','—'].map((cell,ci)=>(
                            <td key={ci} style={{padding:'6px 10px',border:'1px solid rgba(0,0,0,0.06)',textAlign:ci?'center':'left',color:ci===3&&ri===3?'#4E6E96':'#2C2822',fontWeight:ci===3&&ri===3?700:400,background:ci===3&&ri===3?'rgba(78,110,150,0.08)':'transparent'}}>{cell}</td>
                          ))}</tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{fontSize:11,color:'#AFA89E',marginTop:8,fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic'}}>Populate via BOV Dashboard or full Excel model</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BOV TAB ── */}
        {activeTab==='bov'&&showBOV&&(
          <div style={{paddingBottom:40}}><BOVGenerator deal={deal}/></div>
        )}

        {/* ── PROPERTY TAB ── */}
        {activeTab==='property'&&(
          <div style={{paddingBottom:40}}>
            {!property?(
              <div style={{padding:32,textAlign:'center',color:'#AFA89E',fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontStyle:'italic'}}>
                No property record linked to this deal.
                {deal.address&&<div style={{marginTop:12}}><span style={{fontSize:12,color:'#6E6860'}}>Address on file: {deal.address}</span></div>}
              </div>
            ):(
              <>
                <div style={{background:'#fff',borderRadius:9,border:'1px solid rgba(0,0,0,0.07)',padding:'13px 16px',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:'#2C2822',marginBottom:2}}>{property.address}</div>
                    <div style={{fontSize:12,color:'#6E6860'}}>{property.city}{property.zip?', '+property.zip:''}{property.submarket?' · '+property.submarket:''}</div>
                  </div>
                  <Link href={`/properties/${property.id}`} style={{fontSize:12,color:'#4E6E96',textDecoration:'none',fontWeight:500}}>Full Property Record →</Link>
                </div>
                <div style={{display:'flex',gap:5,marginBottom:14}}>
                  {['specs','comps','buyers'].map(t=>(
                    <button key={t} onClick={()=>setPropSubTab(t)} style={{fontFamily:'inherit',fontSize:12,padding:'6px 14px',borderRadius:20,border:`1px solid ${propSubTab===t?'rgba(78,110,150,0.35)':'rgba(0,0,0,0.09)'}`,background:propSubTab===t?'rgba(78,110,150,0.09)':'#fff',color:propSubTab===t?'#4E6E96':'#524D46',cursor:'pointer',fontWeight:propSubTab===t?600:400}}>
                      {t==='specs'?'Specs':t==='comps'?`Comps${comps.length?` (${comps.length})`:''}`:'Buyer Matches'}
                    </button>
                  ))}
                </div>

                {propSubTab==='specs'&&(
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <Card title="Building">
                      <FieldRow label="Building SF"   value={property.building_sf?fmtN(property.building_sf)+' SF':null} mono/>
                      <FieldRow label="Land AC"        value={property.land_acres?property.land_acres+' AC':null}/>
                      <FieldRow label="Year Built"     value={property.year_built?String(property.year_built):null}/>
                      <FieldRow label="Clear Height"   value={property.clear_height?property.clear_height+' ft':null}/>
                      <FieldRow label="Dock Doors"     value={property.dock_doors!=null?String(property.dock_doors):null}/>
                      <FieldRow label="GL Doors"       value={property.grade_level_doors!=null?String(property.grade_level_doors):null}/>
                      <FieldRow label="Power"          value={property.power_amps?property.power_amps+' A':null}/>
                      <FieldRow label="Sprinklers"     value={property.sprinkler_type}/>
                      <FieldRow label="Zoning"         value={property.zoning}/>
                    </Card>
                    <Card title="Tenant / Lease">
                      <FieldRow label="Tenant"       value={property.tenant}/>
                      <FieldRow label="In-Place Rent" value={property.in_place_rent?`$${property.in_place_rent}/SF/mo`:null} mono/>
                      <FieldRow label="Lease Expires" value={fmtDate(property.lease_expiration)}/>
                      <FieldRow label="Lease Type"    value={property.lease_type}/>
                      <FieldRow label="Vacancy"       value={property.vacancy_status}/>
                      <FieldRow label="Owner"         value={property.owner}/>
                    </Card>
                  </div>
                )}

                {propSubTab==='comps'&&(
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                      <span style={{fontSize:13,color:'#6E6860'}}>{comps.length} lease comps · {property.city||deal.submarket}</span>
                      <button onClick={runComps} style={{fontFamily:'inherit',fontSize:11,fontWeight:600,padding:'5px 12px',borderRadius:6,border:'none',background:'#4E6E96',color:'#fff',cursor:'pointer'}}>↻ Run Comps</button>
                    </div>
                    {comps.length===0?(
                      <div style={{padding:32,textAlign:'center',color:'#AFA89E',fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontStyle:'italic'}}>Click Run Comps to load nearby lease comps from the database.</div>
                    ):(
                      <div style={{background:'#fff',borderRadius:9,border:'1px solid rgba(0,0,0,0.07)',overflow:'hidden'}}>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12.5}}>
                          <thead><tr style={{background:'rgba(0,0,0,0.025)'}}>
                            {['Address','Tenant','SF','Rate NNN','Gross Rate','Type','Date'].map(h=>(
                              <th key={h} style={{padding:'8px 12px',fontFamily:'var(--font-mono)',fontSize:9,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#6E6860',textAlign:'left',borderBottom:'1px solid rgba(0,0,0,0.07)',whiteSpace:'nowrap'}}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {comps.map((c,i)=>(
                              <tr key={c.id||i} style={{borderBottom:'1px solid rgba(0,0,0,0.04)'}}>
                                <td style={{padding:'8px 12px',fontWeight:600,color:'#2C2822'}}>{c.address||'—'}</td>
                                <td style={{padding:'8px 12px',color:'#524D46'}}>{c.tenant||'—'}</td>
                                <td style={{padding:'8px 12px',fontFamily:'var(--font-mono)',color:'#524D46'}}>{c.size_sf?fmtN(c.size_sf):'—'}</td>
                                <td style={{padding:'8px 12px',fontFamily:'var(--font-mono)',color:'#4E6E96',fontWeight:600}}>{c.lease_rate?`$${parseFloat(c.lease_rate).toFixed(2)}`:'—'}</td>
                                <td style={{padding:'8px 12px',fontFamily:'var(--font-mono)',color:'#524D46'}}>{c.lease_rate_gross?`$${parseFloat(c.lease_rate_gross).toFixed(2)}`:'—'}</td>
                                <td style={{padding:'8px 12px'}}>{c.lease_type&&<span style={{fontSize:9,padding:'1px 6px',borderRadius:3,background:'rgba(78,110,150,0.09)',color:'#4E6E96',border:'1px solid rgba(78,110,150,0.2)'}}>{c.lease_type}</span>}</td>
                                <td style={{padding:'8px 12px',fontFamily:'var(--font-mono)',fontSize:10,color:'#AFA89E'}}>{c.lease_date?new Date(c.lease_date).toLocaleDateString('en-US',{month:'short',year:'numeric'}):'—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {propSubTab==='buyers'&&<BuyerMatches deal={deal} property={property}/>}
              </>
            )}
          </div>
        )}

        {/* ── CONTACTS TAB ── */}
        {activeTab==='contacts'&&(
          <div style={{paddingBottom:40}}>
            {contacts.length===0?(
              <div style={{padding:32,textAlign:'center',color:'#AFA89E',fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontStyle:'italic'}}>No contacts linked. Add contacts via deal_contacts table.</div>
            ):(
              <div style={{background:'#fff',borderRadius:9,border:'1px solid rgba(0,0,0,0.07)',overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead><tr style={{background:'rgba(0,0,0,0.025)'}}>
                    {['Name','Role','Title','Company','Phone','Email'].map(h=>(
                      <th key={h} style={{padding:'9px 14px',fontFamily:'var(--font-mono)',fontSize:9,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#6E6860',textAlign:'left',borderBottom:'1px solid rgba(0,0,0,0.07)'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {contacts.map((c,i)=>(
                      <tr key={c.id||i} style={{borderBottom:'1px solid rgba(0,0,0,0.04)'}}>
                        <td style={{padding:'10px 14px',fontWeight:600,color:'#2C2822'}}>{c.first_name} {c.last_name}</td>
                        <td style={{padding:'10px 14px'}}><span style={{fontSize:10,padding:'1px 6px',borderRadius:3,background:'rgba(78,110,150,0.09)',color:'#4E6E96'}}>{c.role||'—'}</span></td>
                        <td style={{padding:'10px 14px',color:'#524D46'}}>{c.title||'—'}</td>
                        <td style={{padding:'10px 14px',color:'#524D46'}}>{c.company||'—'}</td>
                        <td style={{padding:'10px 14px',fontFamily:'var(--font-mono)',fontSize:11}}>{c.phone||'—'}</td>
                        <td style={{padding:'10px 14px',fontSize:11,color:'#4E6E96'}}>{c.email||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── BUYER OUTREACH TAB ── */}
        {activeTab==='outreach'&&(
          <div style={{paddingBottom:40}}><BuyerOutreachLog dealId={id}/></div>
        )}

        {/* ── TASKS TAB ── */}
        {activeTab==='tasks'&&(
          <div style={{paddingBottom:40}}>
            {tasks.length===0?(
              <div style={{padding:32,textAlign:'center',color:'#AFA89E',fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontStyle:'italic'}}>No tasks for this deal.</div>
            ):(
              <div style={{background:'#fff',borderRadius:9,border:'1px solid rgba(0,0,0,0.07)',overflow:'hidden'}}>
                {tasks.map((t,i)=>{
                  const overdue=t.due_date&&new Date(t.due_date)<new Date()&&t.status!=='Done';
                  return (
                    <div key={t.id||i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderBottom:'1px solid rgba(0,0,0,0.04)'}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:t.status==='Done'?'#059669':overdue?'#DC2626':'#D97706',flexShrink:0}}/>
                      <div style={{flex:1,fontSize:13,color:'#2C2822'}}>{t.title}</div>
                      <div style={{fontFamily:'var(--font-mono)',fontSize:11,color:overdue?'#DC2626':'#6E6860'}}>{t.due_date?fmtSh(t.due_date):'—'}{overdue&&<span style={{color:'#DC2626',fontWeight:700,marginLeft:4}}>OVERDUE</span>}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FILES TAB ── */}
        {activeTab==='files'&&(
          <div style={{paddingBottom:40}}>
            {files.length===0?(
              <div style={{padding:32,textAlign:'center',color:'#AFA89E',fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontStyle:'italic'}}>No files attached. BOV exports you generate will appear here.</div>
            ):(
              <div style={{background:'#fff',borderRadius:9,border:'1px solid rgba(0,0,0,0.07)',overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead><tr style={{background:'rgba(0,0,0,0.025)'}}>
                    {['File Name','Type','Uploaded',''].map(h=>(
                      <th key={h} style={{padding:'9px 14px',fontFamily:'var(--font-mono)',fontSize:9,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#6E6860',textAlign:'left',borderBottom:'1px solid rgba(0,0,0,0.07)'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {files.map((f,i)=>(
                      <tr key={f.id||i} style={{borderBottom:'1px solid rgba(0,0,0,0.04)'}}>
                        <td style={{padding:'10px 14px',fontWeight:600,color:'#2C2822'}}>{f.file_name||'Untitled'}</td>
                        <td style={{padding:'10px 14px'}}><span style={{fontSize:9,padding:'1px 6px',borderRadius:3,background:'rgba(78,110,150,0.09)',color:'#4E6E96'}}>{f.file_type||'file'}</span></td>
                        <td style={{padding:'10px 14px',fontFamily:'var(--font-mono)',fontSize:11,color:'#AFA89E'}}>{fmtDate(f.created_at)}</td>
                        <td style={{padding:'10px 14px'}}>{f.file_url&&<a href={f.file_url} target="_blank" rel="noreferrer" style={{fontSize:12,color:'#4E6E96',textDecoration:'none',fontWeight:500}}>Download</a>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.15}}`}</style>
    </div>
  );
}
