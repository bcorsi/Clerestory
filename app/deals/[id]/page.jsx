'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STAGES = ['Tracking','Underwriting','Off-Market Outreach','Marketing','LOI','LOI Accepted','PSA Negotiation','Due Diligence','Non-Contingent','Closed Won'];
const COMMISSION_STAGES = new Set(['LOI Accepted','PSA Negotiation','Due Diligence','Non-Contingent','Closed Won']);
const BOV_STAGES = new Set(['Underwriting','Off-Market Outreach','Marketing','LOI','LOI Accepted','PSA Negotiation','Due Diligence','Non-Contingent','Closed Won']);

const TABS = [
  { key: 'timeline',    label: 'Timeline' },
  { key: 'uw',         label: 'Underwriting' },
  { key: 'bov',        label: 'BOV Dashboard' },
  { key: 'contacts',   label: 'Contacts' },
  { key: 'tasks',      label: 'Tasks' },
  { key: 'files',      label: 'Files' },
];

const ACT_ICON = { call: '📞', email: '✉️', note: '📝', meeting: '🤝', task: '✅', system: '⚙️' };
const ACT_BG   = { call: 'rgba(78,110,150,0.09)', email: 'rgba(88,56,160,0.08)', note: 'rgba(140,90,4,0.09)', meeting: 'rgba(21,102,54,0.08)', task: 'rgba(21,102,54,0.08)', system: 'rgba(0,0,0,0.05)' };
const ACT_COLOR= { call: '#4E6E96', email: '#5838A0', note: '#8C5A04', meeting: '#156636', task: '#156636', system: '#6E6860' };

function fmtM(n)   { if (!n) return '—'; return n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : `$${(n/1e3).toFixed(0)}K`; }
function fmtDate(d){ if (!d) return '—'; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function fmtShort(d){ if (!d) return '—'; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

// ─── BOV GENERATOR ────────────────────────────────────────────────────────────

function BOVGenerator({ deal }) {
  const iframeRef = useRef(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone]       = useState(false);
  const [thesis, setThesis]       = useState('');
  const [strengths, setStrengths] = useState([
    { text: 'Infill SGV location with no new supply', tag: 'green' },
    { text: 'Mark-to-market rent upside at rollover', tag: 'green' },
    { text: 'Long-term owner — no distress or forced sale', tag: 'blue' },
  ]);
  const [risks, setRisks] = useState([
    { text: 'Near-term lease expiration — re-tenanting cost', tag: 'red' },
    { text: 'Older vintage — CapEx expectations from buyers', tag: 'amber' },
  ]);
  const [capExp, setCapExp]   = useState(0.055);
  const [capBase, setCapBase] = useState(0.060);
  const [capOut, setCapOut]   = useState(0.050);
  const [mktRent, setMktRent] = useState(1.22);
  const [generated, setGenerated] = useState(false);

  const uw = deal?.underwriting_inputs || {};
  const sf = uw.building_sf || 0;

  async function runAI() {
    setAiLoading(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{ role: 'user', content: `You are a senior industrial CRE broker at Colliers. Write a BOV analysis for this deal. Return ONLY valid JSON.
Deal: ${deal.deal_name}, Address: ${deal.address}, Stage: ${deal.stage}, Value: $${deal.deal_value?.toLocaleString()}, SF: ${sf?.toLocaleString()}, Market: ${deal.market || 'SGV'}, Type: ${deal.deal_type}. Market rent: $${mktRent}/SF NNN.
Return: { "strengths": [{"text": "...", "tag": "green or blue"},...5 items], "risks": [{"text":"...","tag":"red,amber,blue"},...4 items], "thesis": "2-3 sentence BOV thesis" }` }],
        }),
      });
      const data = await res.json();
      const raw  = data.content?.[0]?.text || '';
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      if (parsed.strengths) setStrengths(parsed.strengths);
      if (parsed.risks)     setRisks(parsed.risks);
      if (parsed.thesis)    setThesis(parsed.thesis);
      setAiDone(true);
    } catch(e) { console.error(e); }
    finally { setAiLoading(false); }
  }

  function generate() {
    if (!sf) { alert('Building SF required in underwriting_inputs to generate BOV.'); return; }
    const SOCC = 0.95, MGMT = 0.04;
    const RTX = 1.43, INS = 0.18, CAM = 0.25, RM = 0.12;
    const gpr = sf * mktRent * 12;
    const egr = gpr * SOCC;
    const reimb = sf * SOCC * (RTX + CAM + INS);
    const egrev = egr + reimb;
    const opex  = sf * (RTX + INS + CAM + RM);
    const mgmt  = egrev * MGMT;
    const noi   = egrev - opex - mgmt;
    const vBase = noi / capBase, vExp = noi / capExp, vOut = noi / capOut;
    const pBase = Math.round(vBase/sf), pExp = Math.round(vExp/sf), pOut = Math.round(vOut/sf);
    function fD(x) { return x >= 1e6 ? '$'+(x/1e6).toFixed(1)+'M' : '$'+Math.round(x/1e3)+'K'; }
    function fC(x) { return '$'+Math.round(x).toLocaleString(); }
    function xe(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    const strRows = strengths.filter(s=>s.text).map(s=>`<div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:.5px solid #ddd8d0"><span style="color:#5a5a5a">${xe(s.text)}</span><span style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;text-transform:uppercase;${s.tag==='green'?'background:#e8f5e9;color:#16803c':'background:#e8f0fe;color:#2E75B6'}">${s.tag==='green'?'Strong':'Good'}</span></div>`).join('');
    const riskRows = risks.filter(r=>r.text).map(r=>`<div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:.5px solid #ddd8d0"><span style="color:#5a5a5a">${xe(r.text)}</span><span style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;text-transform:uppercase;${r.tag==='red'?'background:#fce4ec;color:#cc2200':r.tag==='amber'?'background:#fff8e1;color:#b8860b':'background:#e8f0fe;color:#2E75B6'}">${r.tag==='red'?'High':r.tag==='amber'?'Med':'Low'}</span></div>`).join('');
    var h = '<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"><style>body{font-family:"DM Sans",sans-serif;background:#f6f5f2;color:#1a1a1a;margin:0;padding:24px;}.wrap{max-width:900px;margin:0 auto}.sec{font-size:11px;font-weight:700;color:#2E75B6;text-transform:uppercase;letter-spacing:.08em;margin:24px 0 10px;padding-bottom:5px;border-bottom:1px solid #ddd8d0}.card{background:#fff;border:1px solid #ddd8d0;border-radius:10px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06);margin-bottom:12px}.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}.row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:.5px solid #ddd8d0}.row:last-child{border-bottom:none}.lbl{color:#5a5a5a}.v{font-weight:600;font-family:"JetBrains Mono",monospace;font-size:12px}.hl{background:#e8f5e9;margin:0 -12px;padding:7px 12px;border-radius:8px}.kv{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}.kn{font-size:20px;font-weight:700;font-family:"JetBrains Mono",monospace}.ks{font-size:11px;color:#999;font-family:"JetBrains Mono",monospace}.pbtn{font-family:inherit;font-size:12px;font-weight:600;padding:6px 14px;border-radius:6px;border:1px solid #ddd8d0;background:#fff;cursor:pointer}footer{margin-top:24px;font-size:10px;color:#999;text-align:center;padding-top:12px;border-top:1px solid #ddd8d0}@media print{.pbtn{display:none}}</style></head><body><div class="wrap">';
    h += `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px"><div><h1 style="font-size:22px;font-weight:700;margin:0 0 4px">${xe(deal.deal_name||deal.address)}</h1><div style="font-size:13px;color:#5a5a5a">${xe(deal.address||'')}${deal.submarket?' · '+xe(deal.submarket):''}</div></div><button class="pbtn" onclick="window.print()">Print / PDF</button></div>`;
    h += `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px">`;
    h += `<div class="card"><div class="kv">Expected Value</div><div class="kn" style="color:#2E75B6">${fD(vExp)}</div><div class="ks">$${pExp}/SF</div></div>`;
    h += `<div class="card"><div class="kv">Building SF</div><div class="kn">${sf.toLocaleString()}</div><div class="ks">${xe(String(uw.year_built||''))}</div></div>`;
    h += `<div class="card"><div class="kv">Land AC</div><div class="kn">${xe(String(uw.land_acres||'—'))}</div><div class="ks">&nbsp;</div></div>`;
    h += `<div class="card"><div class="kv">Clear Height</div><div class="kn">${xe(String(uw.clear_height||'—'))} ft</div><div class="ks">&nbsp;</div></div>`;
    h += `<div class="card"><div class="kv">Market Rent NNN</div><div class="kn" style="color:#b8860b">$${mktRent.toFixed(2)}</div><div class="ks">/SF/Mo</div></div>`;
    h += `</div>`;
    h += `<div class="sec">Pricing Matrix</div><div class="card"><div class="g3" style="margin-bottom:14px">`;
    [[capBase,'Base','#b8860b',pBase,vBase],[capExp,'Expected','#2E75B6',pExp,vExp],[capOut,'Outlier','#16803c',pOut,vOut]].forEach(([cap,lbl,col,psf,v])=>{
      h+=`<div style="text-align:center"><div class="kn" style="color:${col}">${fD(v)}</div><div class="ks">$${psf}/SF</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#999;margin-top:2px">${lbl} — ${(cap*100).toFixed(1)}% cap</div></div>`;
    });
    h += `</div></div>`;
    h += `<div class="sec">NOI Build — Stabilized 95% Occ.</div><div class="card">`;
    h += `<div class="row"><span class="lbl">Gross Potential Rent</span><span class="v">${fC(gpr)}</span></div>`;
    h += `<div class="row"><span class="lbl">Less: Vacancy (5%)</span><span class="v" style="color:#cc2200">(${fC(gpr-egr)})</span></div>`;
    h += `<div class="row"><span class="lbl">NNN Reimbursements</span><span class="v">${fC(reimb)}</span></div>`;
    h += `<div class="row"><span class="lbl">Less: OpEx + Mgmt</span><span class="v" style="color:#cc2200">(${fC(opex+mgmt)})</span></div>`;
    h += `<div class="row hl"><span class="lbl" style="font-weight:700;color:#16803c">Stabilized NOI</span><span class="v" style="font-size:15px;color:#16803c">${fC(noi)}</span></div></div>`;
    h += `<div class="sec">Risk / Reward Scorecard</div><div class="g2">`;
    h += `<div><div style="font-size:12px;font-weight:700;color:#16803c;margin-bottom:8px">Strengths</div>${strRows}</div>`;
    h += `<div><div style="font-size:12px;font-weight:700;color:#cc2200;margin-bottom:8px">Risks</div>${riskRows}</div></div>`;
    if (thesis) h += `<div style="display:flex;align-items:flex-start;gap:16px;padding:16px;border-radius:10px;background:#e8f0fe;border:1px solid #2E75B6;margin-top:16px"><div style="font-size:36px;font-weight:700;font-family:monospace;color:#2E75B6;flex-shrink:0">B+</div><div><div style="font-weight:700;font-size:14px;color:#2E75B6;margin-bottom:4px">Investment Thesis</div><div style="font-size:13px;color:#2E75B6;opacity:.85;line-height:1.5">${xe(thesis)}</div></div></div>`;
    h += `<footer>${xe(deal.deal_name||'')} — BOV · Briana Corso, Colliers · ${new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'})} · Confidential</footer></div></body></html>`;
    if (iframeRef.current) { iframeRef.current.srcdoc = h; iframeRef.current.style.height = '1600px'; }
    setGenerated(true);
    window._bovHTML = h;
  }

  const inp = { width: '100%', fontFamily: 'inherit', fontSize: 13, padding: '7px 10px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 7, background: '#F4F1EC', color: '#0F0D09', outline: 'none' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>
      <div>
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.055)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#4E6E96', marginBottom: 12 }}>Pricing Assumptions</div>
          {[{l:'Market Rent NNN ($/SF/Mo)',v:mktRent,s:setMktRent,step:0.01},{l:'Base Cap Rate',v:capBase,s:setCapBase,step:0.001},{l:'Expected Cap Rate',v:capExp,s:setCapExp,step:0.001},{l:'Outlier Cap Rate',v:capOut,s:setCapOut,step:0.001}].map(f=>(
            <div key={f.l} style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#524D46', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>{f.l}</label>
              <input type="number" step={f.step} value={f.v} onChange={e=>f.s(parseFloat(e.target.value)||0)} style={inp} />
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.055)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#4E6E96', marginBottom: 8 }}>AI Narrative</div>
          <button onClick={runAI} disabled={aiLoading} style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: 'none', background: '#5838A0', color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: aiLoading ? 'default' : 'pointer', opacity: aiLoading ? 0.7 : 1, marginBottom: 8 }}>
            {aiLoading ? '✦ Analyzing…' : '✦ Generate with AI'}
          </button>
          {aiDone && <div style={{ fontSize: 11, padding: '5px 8px', borderRadius: 6, background: 'rgba(21,102,54,0.08)', color: '#156636', marginBottom: 8 }}>✓ AI complete — review below</div>}
          <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#524D46', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>Thesis</label>
          <textarea value={thesis} onChange={e=>setThesis(e.target.value)} placeholder="AI will fill this…" rows={4} style={{ ...inp, resize: 'vertical' }} />
        </div>
        <button onClick={generate} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#156636', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>
          ↻ Generate Dashboard
        </button>
        <button onClick={()=>{ if(window._bovHTML){const w=window.open('','_blank');w.document.write(window._bovHTML);w.document.close();setTimeout(()=>w.print(),500);}}} style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', color: '#524D46', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Print / Save PDF
        </button>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.055)', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#EAE6DF' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#524D46' }}>{generated ? 'BOV Preview' : 'Click Generate to preview'}</span>
          <button onClick={generate} style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 6, border: 'none', background: '#4E6E96', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>↻ Generate</button>
        </div>
        <iframe ref={iframeRef} style={{ width: '100%', border: 'none', minHeight: 400, background: '#f6f5f2' }} title="BOV Preview" />
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function DealDetail() {
  const { id }    = useParams();
  const router    = useRouter();
  const [deal, setDeal]           = useState(null);
  const [activities, setActivities] = useState([]);
  const [contacts, setContacts]   = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');
  const [logType, setLogType]     = useState('call');
  const [logNote, setLogNote]     = useState('');
  const [saving, setSaving]       = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: d, error } = await supabase.from('deals').select('*').eq('id', id).single();
      if (error) throw error;
      setDeal(d);
      const [actsR, tasksR, filesR] = await Promise.all([
        supabase.from('activities').select('*').eq('deal_id', id).order('activity_date', { ascending: false }).limit(30),
        supabase.from('tasks').select('*').eq('deal_id', id).order('due_date', { ascending: true }).limit(20),
        supabase.from('file_attachments').select('*').eq('deal_id', id).order('created_at', { ascending: false }).limit(20),
      ]);
      setActivities(actsR.data || []);
      setTasks(tasksR.data || []);
      setFiles(filesR.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function updateStage(newStage) {
    const supabase = createClient();
    await supabase.from('deals').update({ stage: newStage, updated_at: new Date().toISOString() }).eq('id', id);
    setDeal(d => ({ ...d, stage: newStage }));
    await supabase.from('activities').insert({ deal_id: id, activity_type: 'system', subject: `Stage → ${newStage}`, activity_date: new Date().toISOString().split('T')[0] });
    setActivities(prev => [{ activity_type: 'system', subject: `Stage → ${newStage}`, activity_date: new Date().toISOString().split('T')[0] }, ...prev]);
  }

  async function logActivity() {
    if (!logNote.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const act = { deal_id: id, activity_type: logType, subject: `${logType.charAt(0).toUpperCase()+logType.slice(1)} logged`, notes: logNote, activity_date: new Date().toISOString().split('T')[0] };
      const { data } = await supabase.from('activities').insert(act).select().single();
      setActivities(prev => [data || act, ...prev]);
      setLogNote('');
    } catch(err) { console.error(err); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: 40, color: '#6E6860', fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: 'italic' }}>Loading deal…</div>;
  if (!deal)   return <div style={{ padding: 40 }}><Link href="/deals" style={{ color: '#4E6E96' }}>← Back to Pipeline</Link></div>;

  const showComm = COMMISSION_STAGES.has(deal.stage);
  const showBOV  = BOV_STAGES.has(deal.stage);
  const stageIdx = STAGES.indexOf(deal.stage);
  const uw = deal.underwriting_inputs || {};

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Instrument Sans', sans-serif", background: '#F4F1EC', minHeight: '100vh' }}>

      {/* ── HERO MAP ── */}
      <div style={{ height: 260, position: 'relative', overflow: 'hidden', background: '#1A2130' }}>
        {/* Static satellite placeholder — replace with Leaflet if lat/lng available */}
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1A2130 0%, #2a3850 50%, #1A2130 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', opacity: 0.3 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📍</div>
            <div style={{ fontSize: 12, color: '#89A8C6', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>SATELLITE VIEW</div>
          </div>
        </div>
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,5,0.88) 0%, rgba(10,8,5,0.2) 50%, transparent 100%)', pointerEvents: 'none' }} />
        {/* Hero content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 28px', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 8 }}>
                {deal.deal_name || deal.address}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {deal.deal_type && <span style={{ padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 500, border: '1px solid rgba(137,168,198,0.45)', background: 'rgba(78,110,150,0.30)', color: '#C8E0F8', backdropFilter: 'blur(6px)' }}>{deal.deal_type}</span>}
                {deal.stage && <span style={{ padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 500, border: '1px solid rgba(220,160,50,0.45)', background: 'rgba(140,90,4,0.30)', color: '#FFE0A0', backdropFilter: 'blur(6px)' }}>{deal.stage}</span>}
                {deal.priority && <span style={{ padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 500, border: '1px solid rgba(60,180,110,0.45)', background: 'rgba(21,102,54,0.30)', color: '#B8F0D0', backdropFilter: 'blur(6px)' }}>{deal.priority}</span>}
              </div>
            </div>
            {/* Back link */}
            <Link href="/deals" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textDecoration: 'none', padding: '6px 12px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, backdropFilter: 'blur(6px)' }}>
              ← Pipeline
            </Link>
          </div>
        </div>
      </div>

      {/* ── ACTION BAR ── */}
      <div style={{ background: '#EAE6DF', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setActiveTab('timeline')} style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, padding: '7px 13px', borderRadius: 7, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', color: '#524D46', cursor: 'pointer' }}>+ Log Activity</button>
        <button onClick={() => setActiveTab('tasks')} style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, padding: '7px 13px', borderRadius: 7, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', color: '#524D46', cursor: 'pointer' }}>+ Task</button>
        <div style={{ width: 1, height: 22, background: 'rgba(0,0,0,0.08)', margin: '0 4px' }} />
        {showBOV && (
          <button onClick={() => setActiveTab('bov')} style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, padding: '7px 13px', borderRadius: 7, border: '1px solid rgba(88,56,160,0.3)', background: 'rgba(88,56,160,0.08)', color: '#5838A0', cursor: 'pointer' }}>✦ BOV Dashboard</button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {deal.onedrive_url && <a href={deal.onedrive_url} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: '#4E6E96', padding: '7px 10px', textDecoration: 'underline', textDecorationColor: 'rgba(78,110,150,0.3)', fontFamily: 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}>OneDrive →</a>}
        </div>
      </div>

      {/* ── STAGE BREADCRUMB ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 28px', overflowX: 'auto' }}>
        <div style={{ display: 'flex' }}>
          {STAGES.filter(s => !['Closed Lost','Dead'].includes(s)).map((s, i) => {
            const isDone   = STAGES.indexOf(s) < stageIdx;
            const isActive = s === deal.stage;
            return (
              <button key={s} onClick={() => updateStage(s)}
                style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: isActive ? 600 : 400, color: isActive ? '#4E6E96' : isDone ? '#524D46' : '#6E6860', cursor: 'pointer', background: 'none', border: 'none', borderBottom: isActive ? '2px solid #6480A2' : '2px solid transparent', whiteSpace: 'nowrap', marginBottom: -1, transition: 'all .1s', position: 'relative' }}>
                {s}
                {i < 8 && <span style={{ position: 'absolute', right: -3, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,0,0,0.18)', fontSize: 14, pointerEvents: 'none' }}>›</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── INNER CONTENT ── */}
      <div style={{ padding: '18px 28px 0' }}>

        {/* ── KPI STRIP ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 0, background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.055)', overflow: 'hidden', marginBottom: 16 }}>
          {[
            { lbl: 'Deal Value',       val: fmtM(deal.deal_value),    color: '#0F0D09', sub: deal.strategy || deal.deal_type },
            { lbl: 'Commission Est.',  val: showComm ? fmtM(deal.commission_est) : '—', color: showComm ? '#156636' : '#AFA89E', sub: deal.commission_rate ? `${deal.commission_rate}%` : '' },
            { lbl: 'Close Probability',val: deal.probability != null ? `${deal.probability}%` : '—', color: deal.probability >= 70 ? '#156636' : deal.probability >= 40 ? '#8C5A04' : '#0F0D09', sub: 'Current estimate' },
            { lbl: 'Deal Type',        val: deal.deal_type || '—',    color: '#524D46', valSm: true, sub: deal.strategy },
            { lbl: 'Target Close',     val: deal.close_date ? new Date(deal.close_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—', color: '#8C5A04', valSm: true, sub: deal.close_date ? `~${Math.max(0,Math.ceil((new Date(deal.close_date)-Date.now())/864e5))} days` : '' },
          ].map((k, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRight: i < 4 ? '1px solid rgba(0,0,0,0.055)' : 'none' }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#6E6860', marginBottom: 6 }}>{k.lbl}</div>
              <div style={{ fontFamily: k.valSm ? "'Instrument Sans',sans-serif" : "'Playfair Display',serif", fontSize: k.valSm ? 18 : 26, fontWeight: k.valSm ? 400 : 700, color: k.color, lineHeight: 1, letterSpacing: k.valSm ? 0 : '-0.02em' }}>{k.val}</div>
              {k.sub && <div style={{ fontSize: 11.5, color: '#6E6860', marginTop: 3 }}>{k.sub}</div>}
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 16 }}>
          {TABS.filter(t => t.key !== 'bov' || showBOV).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding: '10px 15px', fontSize: 13.5, color: activeTab === t.key ? '#4E6E96' : '#6E6860', cursor: 'pointer', background: 'none', border: 'none', borderBottom: activeTab === t.key ? '2px solid #4E6E96' : '2px solid transparent', marginBottom: -1, fontWeight: activeTab === t.key ? 500 : 400, fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all .1s' }}>
              {t.label}
              {t.key === 'bov' && <span style={{ marginLeft: 5, fontSize: 9, background: '#5838A0', color: '#fff', borderRadius: 4, padding: '1px 5px' }}>AI</span>}
              {t.key === 'timeline' && activities.length > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: '#EAE6DF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 20, padding: '1px 6px', marginLeft: 4, color: '#6E6860' }}>{activities.length}</span>}
            </button>
          ))}
        </div>

        {/* ── TIMELINE TAB ── */}
        {activeTab === 'timeline' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 16, paddingBottom: 40 }}>
            {/* Activity feed */}
            <div>
              {/* Log activity */}
              <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.055)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 16 }}>
                <div style={{ padding: '11px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#524D46', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#B83714', animation: 'blink 1.4s infinite', display: 'inline-block' }} />
                    Activity Timeline
                  </div>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13.5, fontStyle: 'italic', color: '#6480A2', cursor: 'pointer' }} onClick={() => {}}>+ Log Activity</span>
                </div>
                {/* Log form */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    {['call','email','note','meeting'].map(t => (
                      <button key={t} onClick={() => setLogType(t)}
                        style={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 6, border: `1px solid ${logType===t?'rgba(78,110,150,0.3)':'rgba(0,0,0,0.08)'}`, background: logType===t?'rgba(78,110,150,0.09)':'transparent', color: logType===t?'#4E6E96':'#6E6860', cursor: 'pointer', textTransform: 'capitalize' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <textarea placeholder={`Log a ${logType}…`} value={logNote} onChange={e=>setLogNote(e.target.value)} rows={2}
                    style={{ width:'100%',fontFamily:'inherit',fontSize:13,padding:'8px 10px',border:'1px solid rgba(0,0,0,0.08)',borderRadius:7,background:'#F4F1EC',color:'#0F0D09',resize:'vertical',marginBottom:8,outline:'none' }} />
                  <button onClick={logActivity} disabled={saving||!logNote.trim()}
                    style={{ padding:'7px 14px',background:'#4E6E96',color:'#fff',border:'none',borderRadius:7,fontFamily:'inherit',fontSize:12.5,fontWeight:500,cursor:'pointer',opacity:(!logNote.trim()||saving)?0.5:1 }}>
                    {saving?'Saving…':'Log Activity'}
                  </button>
                </div>
                {/* Activities */}
                {activities.length === 0 ? (
                  <div style={{ padding:'24px 16px',textAlign:'center',fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontStyle:'italic',color:'#AFA89E' }}>No activity yet</div>
                ) : activities.map((a,i) => {
                  const type = a.activity_type || 'note';
                  return (
                    <div key={i} style={{ display:'flex',gap:12,padding:'11px 16px',borderBottom:'1px solid rgba(0,0,0,0.04)' }}>
                      <div style={{ width:28,height:28,borderRadius:'50%',background:ACT_BG[type]||ACT_BG.note,color:ACT_COLOR[type]||ACT_COLOR.note,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11.5,flexShrink:0,marginTop:1 }}>
                        {ACT_ICON[type]||'📌'}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13.5,color:'#2C2822',lineHeight:1.4 }}>
                          <strong style={{ fontWeight:500 }}>{a.subject}</strong>
                          {a.notes && <span style={{ color:'#524D46' }}> — {a.notes}</span>}
                        </div>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:12,fontStyle:'italic',color:'#6E6860',marginTop:2 }}>Briana Corso</div>
                      </div>
                      <div style={{ fontFamily:'var(--font-mono)',fontSize:10.5,color:'#6E6860',flexShrink:0,paddingTop:2 }}>
                        {a.activity_date ? new Date(a.activity_date).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : ''}
                      </div>
                    </div>
                  );
                })}
                {activities.length >= 5 && (
                  <div style={{ padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'center',background:'#F4F1EC',borderTop:'1px solid rgba(0,0,0,0.06)',cursor:'pointer' }}>
                    <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:13.5,fontStyle:'italic',color:'#6480A2' }}>View all {activities.length} activities →</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              {/* Probability card */}
              <div style={{ background:'#fff',borderRadius:10,boxShadow:'0 1px 4px rgba(0,0,0,0.08)',border:'1px solid rgba(21,102,54,0.28)',overflow:'hidden' }}>
                <div style={{ padding:'16px 18px' }}>
                  <div style={{ fontSize:10,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#156636',marginBottom:8 }}>Close Probability</div>
                  <div style={{ fontFamily:"'Playfair Display',serif",fontSize:52,fontWeight:700,color:'#156636',lineHeight:1,letterSpacing:'-0.03em' }}>
                    {deal.probability != null ? `${deal.probability}%` : '—'}
                  </div>
                  <div style={{ height:5,background:'#EAE6DF',borderRadius:3,overflow:'hidden',margin:'10px 0' }}>
                    <div style={{ height:'100%',width:`${deal.probability||0}%`,background:'linear-gradient(90deg,#6480A2,#156636)',borderRadius:3 }} />
                  </div>
                  <div style={{ fontSize:12.5,color:'#524D46',lineHeight:1.55 }}>{deal.notes || 'No notes recorded yet.'}</div>
                </div>
              </div>

              {/* Deal details */}
              <div style={{ background:'#fff',borderRadius:10,boxShadow:'0 1px 4px rgba(0,0,0,0.08)',border:'1px solid rgba(0,0,0,0.055)',overflow:'hidden' }}>
                <div style={{ padding:'10px 16px',borderBottom:'1px solid rgba(0,0,0,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <span style={{ fontSize:11,fontWeight:500,letterSpacing:'0.09em',textTransform:'uppercase',color:'#524D46' }}>Deal Details</span>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:13.5,fontStyle:'italic',color:'#6480A2',cursor:'pointer' }}>Edit</span>
                </div>
                {[
                  { k:'Deal Type', v:deal.deal_type },
                  { k:'Stage',     v:deal.stage,    color:'#4E6E96' },
                  { k:'Priority',  v:deal.priority, color: deal.priority==='High'?'#B83714':deal.priority==='Critical'?'#5838A0':'#8C5A04' },
                  { k:'Seller',    v:deal.seller },
                  { k:'Tenant',    v:deal.tenant_name },
                  { k:'Market',    v:deal.market },
                  { k:'Submarket', v:deal.submarket },
                  ...(uw.building_sf ? [{ k:'Building SF', v:Number(uw.building_sf).toLocaleString()+' SF' }] : []),
                  ...(uw.year_built  ? [{ k:'Year Built',  v:String(uw.year_built) }] : []),
                  ...(uw.clear_height? [{ k:'Clear Height', v:uw.clear_height+' ft' }] : []),
                ].filter(r => r.v).map((r,i) => (
                  <div key={i} style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'8px 16px',borderBottom:'1px solid rgba(0,0,0,0.04)' }}>
                    <span style={{ fontSize:12.5,color:'#6E6860' }}>{r.k}</span>
                    <span style={{ fontSize:13,color:r.color||'#2C2822',textAlign:'right',maxWidth:170 }}>{r.v}</span>
                  </div>
                ))}
              </div>

              {/* Opportunity memo */}
              {deal.ai_synthesis && (
                <div style={{ background:'rgba(78,110,150,0.09)',border:'1px solid rgba(78,110,150,0.30)',borderRadius:10,overflow:'hidden' }}>
                  <div style={{ padding:'10px 16px',background:'rgba(78,110,150,0.12)',borderBottom:'1px solid rgba(78,110,150,0.20)',fontSize:11,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#4E6E96' }}>AI Synthesis</div>
                  <div style={{ padding:'13px 16px',fontSize:13.5,lineHeight:1.72,color:'#2C2822' }}>{deal.ai_synthesis}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── UNDERWRITING TAB ── */}
        {activeTab === 'uw' && (
          <div style={{ paddingBottom: 40 }}>
            <div style={{ background:'#fff',borderRadius:10,border:'1px solid rgba(78,110,150,0.30)',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',overflow:'hidden',marginBottom:16,position:'relative' }}>
              <div style={{ position:'absolute',left:0,top:0,bottom:0,width:3,background:'#6480A2' }} />
              <div style={{ padding:'12px 18px 12px 22px',borderBottom:'1px solid rgba(0,0,0,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:13.5,fontWeight:500,color:'#2C2822' }}>Quick Underwrite</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:13,fontStyle:'italic',color:'#6E6860' }}>Values from underwriting_inputs · adjust and run</div>
                </div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,padding:'16px 22px' }}>
                {[
                  { l:'Asking Price', v:fmtM(deal.deal_value) },
                  { l:'In-Place Rent NNN', v:uw.gross_rent_monthly ? `$${(uw.gross_rent_monthly/(uw.building_sf||1)).toFixed(2)}/SF/mo` : '—' },
                  { l:'Market Rent NNN', v:uw.market_rent_nnn ? `$${uw.market_rent_nnn}/SF/mo` : '—' },
                  { l:'Cap Rate (Expected)', v:uw.cap_rate_expected ? `${(uw.cap_rate_expected*100).toFixed(1)}%` : '—' },
                  { l:'Building SF', v:uw.building_sf ? Number(uw.building_sf).toLocaleString()+' SF' : '—' },
                  { l:'Occupancy', v:uw.occupancy_pct ? `${uw.occupancy_pct}%` : '—' },
                ].map((f,i) => (
                  <div key={i}>
                    <label style={{ fontSize:10,fontWeight:600,letterSpacing:'0.09em',textTransform:'uppercase',color:'#524D46',display:'block',marginBottom:5 }}>{f.l}</label>
                    <div style={{ padding:'8px 11px',border:'1px solid rgba(0,0,0,0.08)',borderRadius:7,fontFamily:'inherit',fontSize:14,color:'#2C2822',background:'#F4F1EC' }}>{f.v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign:'center',padding:'20px 0',color:'#6E6860',fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontStyle:'italic' }}>
              Switch to the <button onClick={()=>setActiveTab('bov')} style={{ background:'none',border:'none',color:'#4E6E96',fontFamily:'inherit',fontSize:15,fontStyle:'italic',cursor:'pointer',textDecoration:'underline',textDecorationColor:'rgba(78,110,150,0.3)' }}>BOV Dashboard tab</button> to generate full pricing scenarios with AI.
            </div>
          </div>
        )}

        {/* ── BOV TAB ── */}
        {activeTab === 'bov' && showBOV && (
          <div style={{ paddingBottom: 40 }}>
            <BOVGenerator deal={deal} />
          </div>
        )}

        {/* ── CONTACTS TAB ── */}
        {activeTab === 'contacts' && (
          <div style={{ paddingBottom: 40, color: '#6E6860', fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
            No contacts linked to this deal yet.
          </div>
        )}

        {/* ── TASKS TAB ── */}
        {activeTab === 'tasks' && (
          <div style={{ paddingBottom: 40 }}>
            {tasks.length === 0 ? (
              <div style={{ color:'#6E6860',fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontStyle:'italic',textAlign:'center',padding:'40px 0' }}>No tasks for this deal.</div>
            ) : (
              <div style={{ background:'#fff',borderRadius:10,border:'1px solid rgba(0,0,0,0.055)',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',overflow:'hidden' }}>
                {tasks.map((t,i) => (
                  <div key={t.id||i} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ width:8,height:8,borderRadius:'50%',background:t.status==='Done'?'#156636':'#8C5A04',flexShrink:0 }} />
                    <div style={{ flex:1,fontSize:13,color:'#2C2822' }}>{t.title}</div>
                    <div style={{ fontFamily:'var(--font-mono)',fontSize:11,color:'#6E6860' }}>{t.due_date ? fmtShort(t.due_date) : '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FILES TAB ── */}
        {activeTab === 'files' && (
          <div style={{ paddingBottom: 40, color: '#6E6860', fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
            No files attached. BOV dashboards you save will appear here.
          </div>
        )}

      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.1}}`}</style>
    </div>
  );
}
