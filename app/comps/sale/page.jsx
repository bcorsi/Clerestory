'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

const MARKETS = ['All','SGV','IE West','IE East','IE South','LA North','LA South','OC','San Diego','Ventura'];
const SALE_TYPES = ['All','Investment Sale','SLB','Owner-User','Portfolio','Auction','Note Sale'];
const MARKETING_TYPES = ['All','Off-Market','Limited Marketing','Widely Marketed','Auction'];
const BUYER_TYPES = ['All','REIT','Institutional','Private','Owner-User','Corp','Foreign Investor'];

function fmt$(n) {
  if (!n) return '—';
  if (n >= 1e6) return '$' + (n/1e6).toFixed(1) + 'M';
  return '$' + Number(n).toLocaleString();
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function SaleCompsPage() {
  const [comps, setComps]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [market, setMarket]     = useState('All');
  const [saleType, setSaleType] = useState('All');
  const [mktType, setMktType]   = useState('All');
  const [buyerType, setBuyerType] = useState('All');
  const [showAdd, setShowAdd]   = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving]     = useState(false);

  const [form, setForm] = useState({
    address:'', city:'', market:'SGV', submarket:'', building_sf:'', land_acres:'',
    year_built:'', clear_height:'', dock_doors:'', grade_doors:'', sprinklers:'',
    power_amps:'', sale_price:'', price_psf:'', cap_rate:'', noi_at_sale:'',
    occupancy_at_sale:'', sale_date:'', buyer:'', buyer_type:'', seller:'',
    seller_type:'', sale_type:'Investment Sale', marketing_type:'Widely Marketed',
    is_off_market: false, marketing_period:'', financing_type:'New Debt',
    source:'CoStar', verified: false, notes:'',
  });

  useEffect(() => { loadComps(); }, []);

  async function loadComps() {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb
        .from('sale_comps')
        .select('*')
        .order('sale_date', { ascending: false });
      if (error) throw error;
      setComps(data || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function saveComp() {
    setSaving(true);
    try {
      const sb = createClient();
      const payload = {
        ...form,
        building_sf:        form.building_sf  ? parseInt(String(form.building_sf).replace(/,/g,''))  : null,
        land_acres:         form.land_acres   ? parseFloat(form.land_acres)   : null,
        year_built:         form.year_built   ? parseInt(form.year_built)     : null,
        clear_height:       form.clear_height ? parseFloat(form.clear_height) : null,
        dock_doors:         form.dock_doors   ? parseInt(form.dock_doors)     : null,
        grade_doors:        form.grade_doors  ? parseInt(form.grade_doors)    : null,
        sale_price:         form.sale_price   ? parseFloat(String(form.sale_price).replace(/[$,]/g,'')) : null,
        price_psf:          form.price_psf    ? parseFloat(form.price_psf)    : null,
        cap_rate:           form.cap_rate     ? parseFloat(form.cap_rate)     : null,
        noi_at_sale:        form.noi_at_sale  ? parseFloat(String(form.noi_at_sale).replace(/[$,]/g,'')) : null,
        occupancy_at_sale:  form.occupancy_at_sale ? parseFloat(form.occupancy_at_sale) : null,
        marketing_period:   form.marketing_period  ? parseInt(form.marketing_period)   : null,
        is_off_market:      form.marketing_type === 'Off-Market' || form.is_off_market,
        updated_at:         new Date().toISOString(),
      };

      if (selected) {
        const { error } = await sb.from('sale_comps').update(payload).eq('id', selected.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from('sale_comps').insert(payload);
        if (error) throw error;
      }
      setShowAdd(false); setSelected(null);
      resetForm();
      loadComps();
    } catch(e) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  }

  function resetForm() {
    setForm({
      address:'', city:'', market:'SGV', submarket:'', building_sf:'', land_acres:'',
      year_built:'', clear_height:'', dock_doors:'', grade_doors:'', sprinklers:'',
      power_amps:'', sale_price:'', price_psf:'', cap_rate:'', noi_at_sale:'',
      occupancy_at_sale:'', sale_date:'', buyer:'', buyer_type:'', seller:'',
      seller_type:'', sale_type:'Investment Sale', marketing_type:'Widely Marketed',
      is_off_market: false, marketing_period:'', financing_type:'New Debt',
      source:'CoStar', verified: false, notes:'',
    });
  }

  function openEdit(c) {
    setForm({ ...c, sale_price: c.sale_price || '', price_psf: c.price_psf || '',
      cap_rate: c.cap_rate || '', marketing_period: c.marketing_period || '' });
    setSelected(c);
    setShowAdd(true);
  }

  // Filter
  const filtered = comps.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || (c.address||'').toLowerCase().includes(q) ||
      (c.buyer||'').toLowerCase().includes(q) || (c.seller||'').toLowerCase().includes(q) ||
      (c.city||'').toLowerCase().includes(q);
    const matchMarket  = market   === 'All' || c.market    === market;
    const matchType    = saleType === 'All' || c.sale_type === saleType;
    const matchMkt     = mktType  === 'All' || c.marketing_type === mktType;
    const matchBuyer   = buyerType=== 'All' || c.buyer_type === buyerType;
    return matchSearch && matchMarket && matchType && matchMkt && matchBuyer;
  });

  // KPIs
  const totalComps = filtered.length;
  const avgPsf = filtered.length
    ? Math.round(filtered.filter(c=>c.price_psf).reduce((s,c)=>s+c.price_psf,0) / filtered.filter(c=>c.price_psf).length)
    : 0;
  const avgCap = filtered.filter(c=>c.cap_rate).length
    ? (filtered.filter(c=>c.cap_rate).reduce((s,c)=>s+c.cap_rate,0) / filtered.filter(c=>c.cap_rate).length).toFixed(2)
    : '—';
  const offMktCount = filtered.filter(c=>c.is_off_market || c.marketing_type==='Off-Market').length;
  const offMktPct = totalComps ? Math.round(offMktCount/totalComps*100) : 0;
  const totalVol = filtered.filter(c=>c.sale_price).reduce((s,c)=>s+c.sale_price,0);

  const iS = { width:'100%', padding:'8px 12px', borderRadius:7, border:'1px solid var(--card-border)', background:'rgba(0,0,0,0.025)', fontFamily:'var(--font-ui)', fontSize:13, color:'var(--text-primary)', outline:'none' };
  const lS = { fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-tertiary)', marginBottom:5, display:'block' };
  const btn = { display:'inline-flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:7, fontSize:13, fontWeight:500, cursor:'pointer', border:'1px solid var(--card-border)', background:'var(--card-bg)', color:'var(--text-secondary)', whiteSpace:'nowrap', fontFamily:'var(--font-ui)' };

  return (
    <div style={{ padding:'28px 32px', fontFamily:'var(--font-ui)' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.01em', lineHeight:1.1 }}>Sale Comps</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:15, color:'var(--text-tertiary)', marginTop:4 }}>
            Southern California industrial transactions
          </div>
        </div>
        <button style={{ ...btn, background:'var(--blue)', borderColor:'var(--blue)', color:'#fff', fontWeight:600 }}
          onClick={() => { resetForm(); setSelected(null); setShowAdd(true); }}>
          + Add Comp
        </button>
      </div>

      {/* KPI Strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:10, overflow:'hidden', marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        {[
          { lbl:'Total Comps', val:totalComps, sub:'in current filter' },
          { lbl:'Avg $/SF', val:avgPsf ? '$'+avgPsf : '—', sub:'sale price per SF' },
          { lbl:'Avg Cap Rate', val:avgCap !== '—' ? avgCap+'%' : '—', sub:'at time of sale', blue:true },
          { lbl:'Off-Market', val:offMktCount, sub:`${offMktPct}% of filtered`, rust:true },
          { lbl:'Total Volume', val:totalVol ? fmt$(totalVol) : '—', sub:'filtered comps' },
        ].map((k,i)=>(
          <div key={k.lbl} style={{ padding:'14px 16px', borderRight:i<4?'1px solid var(--card-border)':'none' }}>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.09em', textTransform:'uppercase', color:'var(--text-tertiary)', marginBottom:5, fontFamily:'var(--font-mono)' }}>{k.lbl}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:k.rust?'var(--rust)':k.blue?'var(--blue)':'var(--text-primary)', lineHeight:1 }}>{k.val}</div>
            <div style={{ fontSize:11, color:'var(--text-tertiary)', marginTop:3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Off-market callout */}
      {offMktCount > 0 && (
        <div style={{ background:'rgba(184,55,20,0.06)', border:'1px solid rgba(184,55,20,0.18)', borderLeft:'3px solid var(--rust)', borderRadius:9, padding:'10px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:13, fontWeight:500, color:'var(--rust)' }}>◉ {offMktCount} off-market transaction{offMktCount!==1?'s':''} in this filter</span>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, fontStyle:'italic', color:'var(--text-tertiary)' }}>— {offMktPct}% of comps never hit the market. These are your relationship benchmarks.</span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search address, buyer, seller…"
          style={{ ...iS, width:260 }}
        />
        {[
          { label:'Market', val:market, set:setMarket, opts:MARKETS },
          { label:'Sale Type', val:saleType, set:setSaleType, opts:SALE_TYPES },
          { label:'Marketing', val:mktType, set:setMktType, opts:MARKETING_TYPES },
          { label:'Buyer Type', val:buyerType, set:setBuyerType, opts:BUYER_TYPES },
        ].map(f=>(
          <select key={f.label} value={f.val} onChange={e=>f.set(e.target.value)} style={{ ...iS, width:'auto', minWidth:140 }}>
            {f.opts.map(o=><option key={o}>{o}</option>)}
          </select>
        ))}
        {(search||market!=='All'||saleType!=='All'||mktType!=='All'||buyerType!=='All') && (
          <button style={btn} onClick={()=>{setSearch('');setMarket('All');setSaleType('All');setMktType('All');setBuyerType('All');}}>
            Clear
          </button>
        )}
        <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-tertiary)', marginLeft:'auto' }}>
          {filtered.length} of {comps.length} comps
        </span>
      </div>

      {/* Table */}
      <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'rgba(0,0,0,0.025)', borderBottom:'1px solid var(--card-border)' }}>
              {['Address','Market · Sub','SF','Sale Price','$/SF','Cap Rate','Sale Type','Marketing','Buyer','Date','Source',''].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} style={{ padding:'40px', textAlign:'center', color:'var(--text-tertiary)', fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:15 }}>Loading comps…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={12} style={{ padding:'40px', textAlign:'center', color:'var(--text-tertiary)', fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:15 }}>No comps match — try adjusting your filters</td></tr>
            ) : filtered.map((c,i)=>{
              const isOffMkt = c.is_off_market || c.marketing_type === 'Off-Market';
              return (
                <tr key={c.id} style={{ borderBottom:i<filtered.length-1?'1px solid rgba(0,0,0,0.04)':'none', cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,0.015)'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}
                  onClick={()=>openEdit(c)}>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ fontSize:13.5, fontWeight:500, color:'var(--text-primary)' }}>{c.address||'—'}</div>
                    <div style={{ fontSize:11.5, color:'var(--text-tertiary)', marginTop:1 }}>{c.city||'—'}</div>
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ fontSize:12, color:'var(--blue)' }}>{c.market||'—'}</div>
                    <div style={{ fontSize:11, color:'var(--text-tertiary)', marginTop:1 }}>{c.submarket||'—'}</div>
                  </td>
                  <td style={{ padding:'11px 14px', fontFamily:'var(--font-mono)', fontSize:13 }}>
                    {c.building_sf ? Number(c.building_sf).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding:'11px 14px', fontFamily:'var(--font-mono)', fontSize:13, fontWeight:500 }}>
                    {fmt$(c.sale_price)}
                  </td>
                  <td style={{ padding:'11px 14px', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--blue)', fontWeight:600 }}>
                    {c.price_psf ? '$'+Math.round(c.price_psf) : '—'}
                  </td>
                  <td style={{ padding:'11px 14px', fontFamily:'var(--font-mono)', fontSize:13 }}>
                    {c.cap_rate ? c.cap_rate.toFixed(2)+'%' : '—'}
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    {c.sale_type && (
                      <span style={{ fontSize:11.5, padding:'3px 8px', borderRadius:4, fontWeight:500,
                        background: c.sale_type==='SLB'?'rgba(21,102,54,0.09)':c.sale_type==='Owner-User'?'rgba(140,90,4,0.09)':'rgba(78,110,150,0.09)',
                        color: c.sale_type==='SLB'?'var(--green)':c.sale_type==='Owner-User'?'var(--amber)':'var(--blue)',
                        border: `1px solid ${c.sale_type==='SLB'?'rgba(21,102,54,0.25)':c.sale_type==='Owner-User'?'rgba(140,90,4,0.25)':'rgba(78,110,150,0.25)'}`,
                      }}>{c.sale_type}</span>
                    )}
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    {/* Marketing type chip — off-market in rust, widely marketed in grey */}
                    <span style={{ fontSize:11.5, padding:'3px 8px', borderRadius:4, fontWeight:500,
                      background: isOffMkt?'rgba(184,55,20,0.09)':'rgba(0,0,0,0.04)',
                      color: isOffMkt?'var(--rust)':'var(--text-tertiary)',
                      border: `1px solid ${isOffMkt?'rgba(184,55,20,0.25)':'rgba(0,0,0,0.1)'}`,
                    }}>
                      {isOffMkt ? '◉ Off-Market' : c.marketing_type || 'Widely Marketed'}
                    </span>
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ fontSize:13, color:'var(--text-primary)' }}>{c.buyer||'—'}</div>
                    {c.buyer_type && <div style={{ fontSize:11, color:'var(--text-tertiary)', marginTop:1 }}>{c.buyer_type}</div>}
                  </td>
                  <td style={{ padding:'11px 14px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-tertiary)' }}>
                    {fmtDate(c.sale_date)}
                  </td>
                  <td style={{ padding:'11px 14px', fontSize:11.5, color:'var(--text-tertiary)' }}>
                    {c.source||'—'}
                    {c.verified && <span style={{ marginLeft:4, color:'var(--green)' }}>✓</span>}
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <button style={{ ...btn, padding:'4px 10px', fontSize:11.5 }}
                      onClick={e=>{e.stopPropagation(); openEdit(c);}}>Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={e=>{ if(e.target===e.currentTarget){setShowAdd(false);setSelected(null);} }}>
          <div style={{ background:'var(--bg)', borderRadius:14, width:'100%', maxWidth:860, maxHeight:'90vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>

            {/* Modal header */}
            <div style={{ padding:'20px 28px 16px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'var(--bg)', zIndex:1 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'var(--text-primary)' }}>
                {selected ? 'Edit Sale Comp' : 'Add Sale Comp'}
              </div>
              <button style={btn} onClick={()=>{setShowAdd(false);setSelected(null);}}>✕ Close</button>
            </div>

            <div style={{ padding:'24px 28px 32px' }}>

              {/* ── MARKETING TYPE — most important new field ── */}
              <div style={{ background:'rgba(184,55,20,0.05)', border:'1px solid rgba(184,55,20,0.15)', borderLeft:'3px solid var(--rust)', borderRadius:9, padding:'14px 18px', marginBottom:22 }}>
                <div style={{ fontSize:12, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--rust)', marginBottom:12 }}>Marketing — Required</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, alignItems:'end' }}>
                  <div>
                    <label style={lS}>Marketing Type</label>
                    <select style={iS} value={form.marketing_type}
                      onChange={e=>setForm(f=>({ ...f, marketing_type:e.target.value, is_off_market: e.target.value==='Off-Market' }))}>
                      {['Off-Market','Limited Marketing','Widely Marketed','Auction'].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lS}>Days on Market</label>
                    <input style={iS} value={form.marketing_period||''} onChange={e=>setForm(f=>({...f,marketing_period:e.target.value}))}
                      placeholder={form.marketing_type==='Off-Market'?'N/A — off-market':'Number of days'} type="number"
                      disabled={form.marketing_type==='Off-Market'} />
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:2 }}>
                    <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text-primary)' }}>
                      <input type="checkbox" checked={form.is_off_market}
                        onChange={e=>setForm(f=>({...f, is_off_market:e.target.checked, marketing_type: e.target.checked?'Off-Market':f.marketing_type}))}
                        style={{ width:16, height:16 }} />
                      Flag as Off-Market
                    </label>
                  </div>
                </div>
              </div>

              {/* Property */}
              <div style={{ fontSize:12, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-tertiary)', marginBottom:12 }}>Property</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lS}>Address</label>
                  <input style={iS} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="123 Industrial Blvd" />
                </div>
                <div><label style={lS}>City</label><input style={iS} value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} /></div>
                <div><label style={lS}>Market</label>
                  <select style={iS} value={form.market} onChange={e=>setForm(f=>({...f,market:e.target.value}))}>
                    {['SGV','IE West','IE East','IE South','LA North','LA South','OC','San Diego','Ventura'].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label style={lS}>Submarket</label><input style={iS} value={form.submarket||''} onChange={e=>setForm(f=>({...f,submarket:e.target.value}))} /></div>
                <div><label style={lS}>Building SF</label><input style={iS} value={form.building_sf} onChange={e=>setForm(f=>({...f,building_sf:e.target.value}))} /></div>
                <div><label style={lS}>Land (AC)</label><input style={iS} value={form.land_acres||''} onChange={e=>setForm(f=>({...f,land_acres:e.target.value}))} /></div>
                <div><label style={lS}>Year Built</label><input style={iS} value={form.year_built||''} onChange={e=>setForm(f=>({...f,year_built:e.target.value}))} /></div>
                <div><label style={lS}>Clear Height (ft)</label><input style={iS} value={form.clear_height||''} onChange={e=>setForm(f=>({...f,clear_height:e.target.value}))} /></div>
                <div><label style={lS}>Dock Doors</label><input style={iS} value={form.dock_doors||''} onChange={e=>setForm(f=>({...f,dock_doors:e.target.value}))} /></div>
              </div>

              {/* Sale Details */}
              <div style={{ fontSize:12, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-tertiary)', marginBottom:12 }}>Sale Details</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
                <div><label style={lS}>Sale Price ($)</label><input style={iS} value={form.sale_price} onChange={e=>setForm(f=>({...f,sale_price:e.target.value}))} /></div>
                <div><label style={lS}>Price per SF ($)</label><input style={iS} value={form.price_psf} onChange={e=>setForm(f=>({...f,price_psf:e.target.value}))} /></div>
                <div><label style={lS}>Cap Rate (%)</label><input style={iS} value={form.cap_rate} onChange={e=>setForm(f=>({...f,cap_rate:e.target.value}))} /></div>
                <div><label style={lS}>NOI at Sale ($)</label><input style={iS} value={form.noi_at_sale||''} onChange={e=>setForm(f=>({...f,noi_at_sale:e.target.value}))} /></div>
                <div><label style={lS}>Occupancy at Sale (%)</label><input style={iS} value={form.occupancy_at_sale||''} onChange={e=>setForm(f=>({...f,occupancy_at_sale:e.target.value}))} /></div>
                <div><label style={lS}>Close Date</label><input type="date" style={iS} value={form.sale_date||''} onChange={e=>setForm(f=>({...f,sale_date:e.target.value}))} /></div>
                <div>
                  <label style={lS}>Sale Type</label>
                  <select style={iS} value={form.sale_type} onChange={e=>setForm(f=>({...f,sale_type:e.target.value}))}>
                    {['Investment Sale','SLB','Owner-User','Portfolio','Auction','Note Sale'].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lS}>Financing</label>
                  <select style={iS} value={form.financing_type||''} onChange={e=>setForm(f=>({...f,financing_type:e.target.value}))}>
                    {['All-Cash','New Debt','Assumable','Seller Carry'].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Parties */}
              <div style={{ fontSize:12, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-tertiary)', marginBottom:12 }}>Parties</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
                <div><label style={lS}>Buyer</label><input style={iS} value={form.buyer||''} onChange={e=>setForm(f=>({...f,buyer:e.target.value}))} /></div>
                <div>
                  <label style={lS}>Buyer Type</label>
                  <select style={iS} value={form.buyer_type||''} onChange={e=>setForm(f=>({...f,buyer_type:e.target.value}))}>
                    <option value="">Select…</option>
                    {['REIT','Institutional','Private','Owner-User','Corp','Foreign Investor','Family Office'].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label style={lS}>Seller</label><input style={iS} value={form.seller||''} onChange={e=>setForm(f=>({...f,seller:e.target.value}))} /></div>
                <div>
                  <label style={lS}>Seller Type</label>
                  <select style={iS} value={form.seller_type||''} onChange={e=>setForm(f=>({...f,seller_type:e.target.value}))}>
                    <option value="">Select…</option>
                    {['Private LLC','Family Trust','Owner-User','REIT','Institutional','Corp','Individual','Foreign Investor'].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lS}>Source</label>
                  <select style={iS} value={form.source||''} onChange={e=>setForm(f=>({...f,source:e.target.value}))}>
                    {['CoStar','Broker Intel','Direct','County Records','CompStack','Manual Entry'].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, paddingTop:18 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text-primary)' }}>
                    <input type="checkbox" checked={form.verified||false}
                      onChange={e=>setForm(f=>({...f,verified:e.target.checked}))}
                      style={{ width:16, height:16 }} />
                    Verified ✓
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={lS}>Notes</label>
                <textarea style={{ ...iS, minHeight:80, resize:'vertical' }} value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
                  placeholder="Broker context, deal circumstances, relationship intel…" />
              </div>

              {/* Actions */}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
                <button style={btn} onClick={()=>{setShowAdd(false);setSelected(null);}}>Cancel</button>
                <button style={{ ...btn, background:'var(--blue)', borderColor:'var(--blue)', color:'#fff', fontWeight:600 }}
                  onClick={saveComp} disabled={saving}>
                  {saving ? 'Saving…' : selected ? '✓ Save Changes' : '+ Add Comp'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
