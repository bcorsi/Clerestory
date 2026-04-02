'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// ─── HELPERS ──────────────────────────────────────────────────
function fmt(n) { return n != null ? Number(n).toLocaleString() : '—'; }
function fmtMoney(n) { if (!n) return '—'; const m = Number(n); return m >= 1_000_000 ? `$${(m/1_000_000).toFixed(2)}M` : `$${m.toLocaleString()}`; }
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); }
function monthsUntil(d) { if (!d) return null; return Math.round((new Date(d) - Date.now()) / (1000 * 60 * 60 * 24 * 30)); }

// ─── BUILDING SCORE (§01 from clerestory_scores_v4) ───────────
function calculateBuildingScore(p) {
  if (!p) return { score: null, grade: null, breakdown: {} };
  let score = 0;
  const bd = {};

  // Clear Height (25 pts)
  const ch = Number(p.clear_height || 0);
  bd.clearHeight = ch >= 40 ? 25 : ch >= 36 ? 20 : ch >= 32 ? 15 : ch >= 28 ? 10 : ch >= 24 ? 5 : ch > 0 ? 2 : 0;
  score += bd.clearHeight;

  // DH Ratio (20 pts) — dock doors per 10k SF
  const dhr = p.building_sf && p.dock_high_doors ? (Number(p.dock_high_doors) / (Number(p.building_sf) / 10000)) : (p.dock_doors && p.building_sf ? Number(p.dock_doors) / (Number(p.building_sf) / 10000) : 0);
  bd.dhRatio = dhr >= 1.2 ? 20 : dhr >= 1.0 ? 16 : dhr >= 0.8 ? 12 : dhr >= 0.6 ? 8 : dhr > 0 ? 4 : 0;
  score += bd.dhRatio;

  // Truck Court (20 pts)
  const tc = Number(p.truck_court || 0);
  bd.truckCourt = tc >= 185 ? 20 : tc >= 135 ? 16 : tc >= 120 ? 12 : tc >= 100 ? 8 : tc > 0 ? 4 : 0;
  score += bd.truckCourt;

  // Office % (15 pts, lower = better)
  const op = Number(p.office_pct || p.office_percent || 0);
  bd.officePct = op <= 5 ? 15 : op <= 10 ? 12 : op <= 15 ? 9 : op <= 25 ? 6 : 3;
  score += bd.officePct;

  // Power (10 pts)
  const amps = Number(p.power_amps || (p.power ? parseInt(String(p.power)) : 0) || 0);
  bd.power = amps >= 2000 ? 10 : amps >= 1200 ? 8 : amps >= 800 ? 6 : amps >= 400 ? 4 : amps > 0 ? 2 : 0;
  score += bd.power;

  // Vintage (10 pts)
  const age = p.year_built ? new Date().getFullYear() - Number(p.year_built) : 999;
  bd.vintage = age <= 5 ? 10 : age <= 10 ? 8 : age <= 20 ? 6 : age <= 30 ? 4 : 2;
  score += bd.vintage;

  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'A-' : score >= 60 ? 'B+' : score >= 50 ? 'B' : score >= 40 ? 'B-' : 'C';
  return { score, grade, breakdown: bd, dhRatio: Math.round(dhr * 100) / 100 };
}

// ─── TABS ─────────────────────────────────────────────────────
const TABS = [
  { key: 'timeline',   label: 'Timeline' },
  { key: 'buildings',  label: 'Buildings' },
  { key: 'apns',       label: 'APNs' },
  { key: 'leasecomps', label: 'Lease Comps' },
  { key: 'salecomps',  label: 'Sale Comps' },
  { key: 'contacts',   label: 'Contacts' },
  { key: 'deals',      label: 'Deals' },
  { key: 'leads',      label: 'Leads' },
  { key: 'files',      label: 'Files' },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function PropertyDetail({ id, inline = false }) {
  const router = useRouter();
  const [property, setProperty]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('timeline');
  const [activities, setActivities] = useState([]);
  const [contacts, setContacts]     = useState([]);
  const [deals, setDeals]           = useState([]);
  const [leads, setLeads]           = useState([]);
  const [leaseComps, setLeaseComps] = useState([]);
  const [saleComps, setSaleComps]   = useState([]);
  const [warnNotice, setWarnNotice] = useState(null);
  const [synthOpen, setSynthOpen]   = useState(true);
  const [specsOpen, setSpecsOpen]   = useState(false);
  const [logType, setLogType]       = useState('call');
  const [logText, setLogText]       = useState('');
  const [logSaving, setLogSaving]   = useState(false);

  useEffect(() => { if (id) load(id); }, [id]);

  async function load(propId) {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: prop, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propId)
        .single();
      if (error) throw error;
      setProperty(prop);

      const [actsRes, ctctsRes, dlsRes, ldsRes, lcRes, scRes, warnRes] = await Promise.all([
        supabase.from('activities').select('*').eq('property_id', propId).order('created_at', { ascending: false }).limit(20),
        supabase.from('contacts').select('id, first_name, last_name, title, company, phone, email').eq('property_id', propId).limit(10),
        supabase.from('deals').select('id, name, stage, asking_price, commission_est, deal_type, created_at').eq('property_id', propId).order('created_at', { ascending: false }).limit(5),
        supabase.from('leads').select('id, lead_name, company, stage, score, catalyst_tags').eq('property_id', propId).limit(5),
        prop?.city ? supabase.from('lease_comps').select('id, address, tenant, lease_date, lease_rate, size_sf, lease_type, lease_term').eq('city', prop.city).order('lease_date', { ascending: false }).limit(8) : { data: [] },
        prop?.city ? supabase.from('sale_comps').select('id, address, sale_date, sale_price, size_sf, price_per_sf, buyer, seller').eq('city', prop.city).order('sale_date', { ascending: false }).limit(6) : { data: [] },
        supabase.from('warn_notices').select('id, company, notice_date, effective_date, employees').eq('matched_property_id', propId).limit(1).single().catch(() => ({ data: null })),
      ]);

      setActivities(actsRes.data || []);
      setContacts(ctctsRes.data || []);
      setDeals(dlsRes.data || []);
      setLeads(ldsRes.data || []);
      setLeaseComps(lcRes.data || []);
      setSaleComps(scRes.data || []);
      if (warnRes.data) setWarnNotice(warnRes.data);

    } catch (e) {
      console.error('PropertyDetail load error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function logActivity() {
    if (!logText.trim()) return;
    setLogSaving(true);
    try {
      const supabase = createClient();
      const { data: newAct } = await supabase
        .from('activities')
        .insert({ property_id: id, activity_type: logType, subject: logText, body: logText, created_by: 'Briana Corso' })
        .select().single();
      if (newAct) setActivities(prev => [newAct, ...prev]);
      setLogText('');
    } catch (e) { console.error(e); }
    finally { setLogSaving(false); }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-tertiary)', fontFamily: 'var(--font-ui)', fontSize: 14 }}>
      <div className="cl-spinner" style={{ marginRight: 10 }} />Loading property…
    </div>
  );
  if (!property) return (
    <div className="cl-empty">
      <div className="cl-empty-label">Property not found</div>
    </div>
  );

  const { score, grade, breakdown, dhRatio } = calculateBuildingScore(property);
  const tags = Array.isArray(property.catalyst_tags) ? property.catalyst_tags
    : (typeof property.catalyst_tags === 'string' ? (() => { try { return JSON.parse(property.catalyst_tags); } catch { return []; } })() : []);

  const mo = monthsUntil(property.lease_expiration);
  const leaseUrgent = mo !== null && mo <= 18;
  const leaseColor = mo !== null && mo <= 6 ? 'var(--rust)' : mo !== null && mo <= 18 ? 'var(--amber)' : 'var(--text-secondary)';

  // Derived metrics
  const coverageRatio = property.building_sf && property.lot_sf ? Math.round(Number(property.building_sf) / Number(property.lot_sf) * 100) : null;
  const officeSF = property.building_sf && (property.office_pct || property.office_percent)
    ? Math.round(Number(property.building_sf) * Number(property.office_pct || property.office_percent) / 100)
    : null;

  // AI score — use calculated if DB doesn't have one
  const displayScore = property.ai_score ?? score;
  const displayGrade = property.building_grade ?? grade;

  const TAB_COUNTS = {
    timeline: activities.length, buildings: 1, apns: 0,
    leasecomps: leaseComps.length, salecomps: saleComps.length,
    contacts: contacts.length, deals: deals.length, leads: leads.length, files: 0,
  };

  return (
    <div style={{ fontFamily: 'var(--font-ui)', background: 'var(--bg)' }}>

      {/* ── ACTION BAR ── */}
      <div style={{ background: '#EDE8E0', borderBottom: '1px solid var(--card-border)', padding: '11px 28px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Building score chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, marginRight: 6, flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 1 }}>Bldg Score</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue)', fontWeight: 600 }}>{displayGrade || '—'}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--blue)', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {displayScore ?? '—'}
          </div>
        </div>

        <div style={{ width: 1, height: 22, background: 'rgba(0,0,0,0.1)', margin: '0 3px' }} />

        {/* Log actions */}
        <ActionBtn icon="📞">Log Call</ActionBtn>
        <ActionBtn icon="✉️">Log Email</ActionBtn>
        <ActionBtn icon="📝">Add Note</ActionBtn>
        <ActionBtn icon="✓">+ Task</ActionBtn>

        <div style={{ width: 1, height: 22, background: 'rgba(0,0,0,0.1)', margin: '0 3px' }} />

        {/* Links */}
        <LinkBtn href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([property.address, property.city, property.state].filter(Boolean).join(', '))}`}>📍 Google Maps</LinkBtn>
        <LinkBtn href="https://www.costar.com/">🏢 CoStar</LinkBtn>
        <LinkBtn href="https://portal.assessor.lacounty.gov/">🗺 LA County GIS</LinkBtn>

        <div style={{ width: 1, height: 22, background: 'rgba(0,0,0,0.1)', margin: '0 3px' }} />

        <ActionBtn icon="⚙">Edit</ActionBtn>
        <ActionBtn icon="↓">Export Memo</ActionBtn>
        <ActionBtn icon="⊕">Campaign</ActionBtn>

        <div style={{ marginLeft: 'auto' }} />
        <button
          onClick={() => router.push(`/leads/new?property_id=${property.id}`)}
          style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--green)', color: '#fff', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(24,112,66,0.25)' }}
        >
          ◈ Convert to Deal
        </button>
      </div>

      <div style={{ padding: inline ? '16px 0 0' : '20px 28px 0' }}>

        {/* ── 7-COL STAT ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--card-shadow)', overflow: 'hidden', marginBottom: 16 }}>
          {[
            { lbl: 'Building SF',  val: fmt(property.building_sf),   sub: '1 building' },
            { lbl: 'Land',         val: property.land_acres ? `${property.land_acres} ac` : '—', sub: property.apn_count ? `${property.apn_count} APNs` : '' },
            { lbl: 'In-Place Rent',val: property.in_place_rent ? `$${Number(property.in_place_rent).toFixed(2)}/SF` : '—', sub: 'NNN / mo', color: 'var(--rust)' },
            { lbl: 'Market Rent',  val: property.market_rent_low && property.market_rent_high ? `$${Number(property.market_rent_low).toFixed(2)}–${Number(property.market_rent_high).toFixed(2)}` : property.market_rent ? `$${Number(property.market_rent).toFixed(2)}/SF` : '—', sub: 'NNN est.', color: 'var(--green)' },
            { lbl: 'Lease Expiry', val: fmtDate(property.lease_expiration), sub: mo !== null ? `${mo} months` : '', color: leaseColor },
            { lbl: 'Est. Value',   val: fmtMoney(property.estimated_value), sub: property.building_sf && property.estimated_value ? `~$${Math.round(Number(property.estimated_value)/Number(property.building_sf))}/SF` : '' },
            { lbl: 'Year Built',   val: property.year_built || '—', sub: property.zoning ? `${property.zoning} Zoning` : '' },
          ].map((c, i) => (
            <div key={c.lbl} style={{ padding: '13px 14px', borderRight: i < 6 ? '1px solid var(--card-border)' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 5 }}>{c.lbl}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: c.color || 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.01em' }}>{c.val}</div>
              {c.sub && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{c.sub}</div>}
            </div>
          ))}
        </div>

        {/* ── BUILDING SCORE CARD ── */}
        {displayScore != null && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--card-shadow)', overflow: 'hidden', marginBottom: 16 }}>
            {/* Header row — always visible */}
            <div
              onClick={() => setSpecsOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: specsOpen ? '1px solid var(--card-border)' : 'none', cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', border: '2.5px solid rgba(78,110,150,0.32)', background: 'var(--blue-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 700, color: 'var(--blue)', lineHeight: 1 }}>{displayScore}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--blue)', marginTop: 1 }}>{displayGrade}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>
                    Building Score — {displayGrade} · {displayScore >= 80 ? 'Top-tier distribution asset' : displayScore >= 65 ? 'Strong industrial asset' : displayScore >= 50 ? 'Functional industrial asset' : 'Below-average specs'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {property.clear_height ? `${property.clear_height}' clear` : ''}
                    {(property.dock_high_doors || property.dock_doors) ? ` · ${property.dock_high_doors || property.dock_doors} dock-high` : ''}
                    {property.truck_court ? ` · ${property.truck_court}' truck court` : ''}
                    {property.sprinklers ? ` · ${property.sprinklers} sprinklers` : ''}
                    {property.power ? ` · ${property.power} power` : ''}
                  </div>
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-editorial)', fontSize: 13, fontStyle: 'italic', color: 'var(--blue)', cursor: 'pointer' }}>
                {specsOpen ? 'Hide specs ▴' : 'Show all specs ▾'}
              </span>
            </div>

            {/* Spec summary strip — always visible */}
            <div style={{ display: 'flex', borderBottom: specsOpen ? '1px solid var(--card-border)' : 'none' }}>
              {[
                { lbl: 'Clear HT',    val: property.clear_height ? `${property.clear_height}'` : '—', hi: Number(property.clear_height) >= 32 },
                { lbl: 'Dock Doors',  val: [property.dock_high_doors ? `${property.dock_high_doors} DH` : null, property.grade_level_doors ? `${property.grade_level_doors} GL` : null].filter(Boolean).join(' · ') || (property.dock_doors ? `${property.dock_doors}` : '—'), hi: true },
                { lbl: 'Truck Court', val: property.truck_court ? `${property.truck_court}'` : '—' },
                { lbl: 'Office %',    val: property.office_pct != null ? `${property.office_pct}%` : property.office_percent != null ? `${property.office_percent}%` : '—' },
                { lbl: 'Power',       val: property.power || (property.power_amps ? `${property.power_amps}A` : '—'), hi: true },
                { lbl: 'Sprinklers',  val: property.sprinklers || '—', hi: property.sprinklers?.includes('ESFR') },
                { lbl: 'DH Ratio',    val: dhRatio ? `${dhRatio}/10kSF` : '—', hi: dhRatio >= 1.0 },
                { lbl: 'Coverage',    val: coverageRatio ? `${coverageRatio}%` : '—' },
              ].map((c, i) => (
                <div key={c.lbl} style={{ flex: 1, padding: '9px 12px', borderRight: i < 7 ? '1px solid var(--card-border)' : 'none', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>{c.lbl}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: c.hi ? 'var(--blue)' : 'var(--text-primary)', fontWeight: c.hi ? 500 : 400 }}>{c.val}</div>
                </div>
              ))}
            </div>

            {/* Expanded spec grid */}
            {specsOpen && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {/* Left: full specs */}
                <div style={{ padding: '14px 18px', borderRight: '1px solid var(--card-border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-tertiary)', paddingBottom: 6, borderBottom: '1px solid var(--card-border)', marginBottom: 6 }}>Building Specs</div>
                  {[
                    ['Address', [property.address, property.city, property.state].filter(Boolean).join(', ')],
                    ['Zoning', property.zoning],
                    ['Building SF', fmt(property.building_sf)],
                    ['Land SF', property.lot_sf ? fmt(property.lot_sf) : null],
                    ['Land Acres', property.land_acres ? `${property.land_acres} ac` : null],
                    ['Year Built', property.year_built],
                    ['Clear Height', property.clear_height ? `${property.clear_height}'` : null],
                    ['Dock High Doors', property.dock_high_doors],
                    ['Grade Level Doors', property.grade_level_doors],
                    ['Truck Court', property.truck_court ? `${property.truck_court}'` : null],
                    ['Office %', property.office_pct != null ? `${property.office_pct}%` : null],
                    ['Office SF', officeSF ? fmt(officeSF) : null],
                    ['Warehouse SF', officeSF && property.building_sf ? fmt(Number(property.building_sf) - officeSF) : null],
                    ['Power', property.power || (property.power_amps ? `${property.power_amps}A` : null)],
                    ['Sprinklers', property.sprinklers],
                    ['Parking', property.parking_spaces ? `${property.parking_spaces} stalls` : null],
                    ['DH Ratio', dhRatio ? `${dhRatio} per 10kSF` : null],
                    ['Coverage', coverageRatio ? `${coverageRatio}%` : null],
                  ].filter(([,v]) => v != null).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5.5px 0', borderBottom: '1px solid rgba(0,0,0,0.035)' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>{k}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-primary)' }}>{v}</span>
                    </div>
                  ))}
                </div>
                {/* Right: score breakdown */}
                <div style={{ padding: '14px 18px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-tertiary)', paddingBottom: 6, borderBottom: '1px solid var(--card-border)', marginBottom: 10 }}>Score Breakdown</div>
                  {[
                    { label: 'Clear Height', pts: breakdown.clearHeight, max: 25 },
                    { label: 'DH Ratio', pts: breakdown.dhRatio, max: 20 },
                    { label: 'Truck Court', pts: breakdown.truckCourt, max: 20 },
                    { label: 'Office %', pts: breakdown.officePct, max: 15 },
                    { label: 'Power', pts: breakdown.power, max: 10 },
                    { label: 'Vintage', pts: breakdown.vintage, max: 10 },
                  ].map(f => (
                    <div key={f.label} style={{ marginBottom: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>{f.label.toUpperCase()}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)' }}>{f.pts ?? 0}/{f.max}</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(0,0,0,0.07)', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${Math.min(((f.pts ?? 0) / f.max) * 100, 100)}%`, background: 'var(--blue)', borderRadius: 99 }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 7, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--blue)' }}>{displayScore}/100 · {displayGrade}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI SYNTHESIS ── */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(88,56,160,0.18)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--card-shadow)', overflow: 'hidden', marginBottom: 16, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(180deg, #8B6FCC, var(--purple))' }} />
          <div onClick={() => setSynthOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px 11px 20px', borderBottom: synthOpen ? '1px solid rgba(88,56,160,0.12)' : 'none', cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--purple)' }}>✦</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--purple)' }}>AI Synthesis</span>
              <span style={{ fontFamily: 'var(--font-editorial)', fontSize: 12.5, fontStyle: 'italic', color: 'var(--text-tertiary)' }}>
                Property Status Report · {property.address}
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-editorial)', fontSize: 13, fontStyle: 'italic', color: 'var(--purple)' }}>
              {synthOpen ? 'Hide ▴' : 'Show ▾'}
            </span>
          </div>
          {synthOpen && (
            <div>
              {property.ai_synthesis ? (
                <div style={{ padding: '18px 22px 20px' }}>
                  <div style={{ fontSize: 13.5, lineHeight: 1.72, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{property.ai_synthesis}</div>
                  {property.ai_critical_note && (
                    <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--rust-bg)', border: '1px solid rgba(184,55,20,0.18)', borderRadius: 7, fontSize: 13.5, lineHeight: 1.65 }}>
                      <strong style={{ color: 'var(--rust)' }}>Critical: </strong>{property.ai_critical_note}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '18px 22px' }}>
                  {/* Auto-generate basic synthesis from data */}
                  <SynthItem>
                    {fmt(property.building_sf)} SF {property.prop_type || 'industrial'}{property.zoning ? ` (${property.zoning} zoning)` : ''} — {property.clear_height ? `${property.clear_height}' clear` : ''}{property.dock_high_doors ? `, ${property.dock_high_doors} dock-high` : ''}{property.truck_court ? `, ${property.truck_court}' truck court` : ''}{property.sprinklers ? `, ${property.sprinklers} sprinklers` : ''}{property.power ? `, ${property.power} power` : ''}.
                  </SynthItem>
                  {property.tenant && (
                    <SynthItem>
                      {property.vacancy_status === 'owner-user' ? 'Owner-user' : 'Tenant'}: {property.tenant}{property.lease_expiration ? ` — lease expiring ${fmtDate(property.lease_expiration)}${mo !== null ? `, ${mo} months remaining` : ''}${leaseUrgent ? ' ⚡ urgent window' : ''}` : ''}.
                    </SynthItem>
                  )}
                  {property.in_place_rent && property.market_rent ? (
                    <SynthItem>
                      In-place rent ${Number(property.in_place_rent).toFixed(2)}/SF vs. market ${Number(property.market_rent).toFixed(2)}/SF NNN — {Number(property.in_place_rent) < Number(property.market_rent) ? `${Math.round((Number(property.market_rent) - Number(property.in_place_rent)) / Number(property.market_rent) * 100)}% below market, meaningful NOI upside at renewal.` : 'at or above market.'}
                    </SynthItem>
                  ) : null}
                  {warnNotice && <SynthItem>⚡ Active WARN filing matched: {warnNotice.company} — {fmt(warnNotice.employees)} workers affected. Permanent closure signal — contact owner immediately.</SynthItem>}
                  <div style={{ marginTop: 14, textAlign: 'right' }}>
                    <button className="cl-btn cl-btn-ghost cl-btn-sm" style={{ color: 'var(--purple)', borderColor: 'rgba(88,56,160,0.22)', border: '1px solid', fontSize: 11 }}>✦ Generate Full Synthesis</button>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 22px', borderTop: '1px solid rgba(88,56,160,0.10)', background: 'rgba(88,56,160,0.02)' }}>
                <button className="cl-btn cl-btn-ghost cl-btn-sm" style={{ color: 'var(--purple)', border: '1px solid rgba(88,56,160,0.22)', fontSize: 11 }}>↺ Regenerate</button>
                <button className="cl-btn cl-btn-ghost cl-btn-sm" style={{ color: 'var(--purple)', border: '1px solid rgba(88,56,160,0.22)', fontSize: 11 }}>⎘ Copy</button>
                {property.ai_generated_at && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>Generated {fmtDate(property.ai_generated_at)}</span>}
              </div>
            </div>
          )}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', marginBottom: 16, overflowX: 'auto' }}>
          {TABS.map(tab => {
            const count = TAB_COUNTS[tab.key];
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '10px 15px', fontSize: 13.5, color: activeTab === tab.key ? 'var(--blue)' : 'var(--text-secondary)', background: 'none', border: 'none', borderBottom: activeTab === tab.key ? '2px solid var(--blue)' : '2px solid transparent', marginBottom: -1, fontFamily: 'var(--font-ui)', fontWeight: activeTab === tab.key ? 500 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {tab.label}
                {count > 0 && <span style={{ marginLeft: 4, fontFamily: 'var(--font-mono)', fontSize: 10, background: 'rgba(0,0,0,0.05)', border: '1px solid var(--card-border)', borderRadius: 20, padding: '1px 6px', color: 'var(--text-tertiary)' }}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* ══ TAB CONTENT ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 16 }}>
          {/* LEFT: Main content */}
          <div>
            {/* TIMELINE TAB */}
            {activeTab === 'timeline' && (
              <div className="cl-card" style={{ overflow: 'hidden', padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--rust)', animation: 'cl-pulse 1.4s infinite', display: 'inline-block' }} />
                    Activity Timeline
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-tertiary)' }}>{activities.length} entries</span>
                </div>

                {/* Inline log */}
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--card-border)', background: 'var(--bg)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['call','email','note','meeting'].map(t => (
                      <button key={t} onClick={() => setLogType(t)} style={{ padding: '5px 11px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-ui)', background: logType === t ? 'var(--blue)' : 'var(--card-bg)', color: logType === t ? '#fff' : 'var(--text-secondary)', border: logType === t ? '1px solid var(--blue)' : '1px solid var(--card-border)', cursor: 'pointer' }}>
                        {{'call':'📞 Call','email':'✉ Email','note':'📝 Note','meeting':'🤝 Meeting'}[t]}
                      </button>
                    ))}
                  </div>
                  <input value={logText} onChange={e => setLogText(e.target.value)} onKeyDown={e => e.key === 'Enter' && logActivity()} placeholder={`Log a ${logType}...`} style={{ flex: 1, padding: '7px 12px', borderRadius: 6, fontSize: 13, border: '1px solid var(--card-border)', background: 'var(--card-bg)', fontFamily: 'var(--font-ui)', color: 'var(--text-primary)', outline: 'none', minWidth: 140 }} />
                  <button onClick={logActivity} disabled={logSaving || !logText.trim()} style={{ padding: '7px 14px', borderRadius: 6, fontSize: 12.5, fontWeight: 500, background: 'var(--blue)', color: '#fff', border: 'none', fontFamily: 'var(--font-ui)', cursor: 'pointer', opacity: logSaving ? 0.6 : 1 }}>{logSaving ? '…' : 'Log'}</button>
                </div>

                {activities.length === 0 ? (
                  <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-editorial)', fontSize: 14, fontStyle: 'italic' }}>No activity yet — log a call or note to start the timeline</div>
                ) : activities.map(act => (
                  <div key={act.id} style={{ display: 'flex', gap: 12, padding: '11px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, flexShrink: 0, background: act.activity_type === 'call' ? 'var(--blue-bg)' : act.activity_type === 'email' ? 'var(--purple-bg)' : act.activity_type === 'note' ? 'var(--amber-bg)' : 'var(--green-bg)' }}>
                      {{'call':'📞','email':'✉️','note':'📝','meeting':'🤝'}[act.activity_type] || '·'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.45 }}>{act.subject || act.body || act.activity_type}</div>
                      {act.body && act.body !== act.subject && <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>{act.body}</div>}
                      <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 12, fontStyle: 'italic', color: 'var(--text-tertiary)', marginTop: 2 }}>{act.created_by || 'Briana Corso'}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-tertiary)', flexShrink: 0, paddingTop: 2 }}>{fmtDate(act.created_at)}</div>
                  </div>
                ))}
                {activities.length > 0 && <div style={{ padding: '10px 16px', background: 'var(--bg)', borderTop: '1px solid var(--card-border)', textAlign: 'center', cursor: 'pointer' }}><span style={{ fontFamily: 'var(--font-editorial)', fontSize: 13.5, fontStyle: 'italic', color: 'var(--blue)' }}>View all {activities.length} activities & notes →</span></div>}
              </div>
            )}

            {/* LEASE COMPS TAB */}
            {activeTab === 'leasecomps' && (
              leaseComps.length === 0 ? <EmptyState title="No nearby lease comps" sub="Comps in the same city will appear here" /> : (
                <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card-bg)', fontSize: 13 }}>
                    <thead><tr style={{ background: 'rgba(0,0,0,0.025)' }}>
                      {['Address','Tenant','SF','Rate/SF','Type','Term','Date'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--card-border)', whiteSpace: 'nowrap' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>{leaseComps.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <td style={{ padding: '9px 14px', fontSize: 12 }}>{c.address}</td>
                        <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.tenant || '—'}</td>
                        <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{c.size_sf ? fmt(c.size_sf) : '—'}</td>
                        <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue)' }}>{c.lease_rate ? `$${Number(c.lease_rate).toFixed(2)}` : '—'}</td>
                        <td style={{ padding: '9px 14px' }}><span className="cl-badge cl-badge-gray" style={{ fontSize: 9 }}>{c.lease_type || 'NNN'}</span></td>
                        <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{c.lease_term || '—'}</td>
                        <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>{c.lease_date ? new Date(c.lease_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : '—'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )
            )}

            {/* SALE COMPS TAB */}
            {activeTab === 'salecomps' && (
              saleComps.length === 0 ? <EmptyState title="No nearby sale comps" sub="Sale comps in the same city will appear here" /> : (
                <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card-bg)', fontSize: 13 }}>
                    <thead><tr style={{ background: 'rgba(0,0,0,0.025)' }}>
                      {['Address','SF','Sale Price','$/SF','Buyer','Date'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--card-border)', whiteSpace: 'nowrap' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>{saleComps.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <td style={{ padding: '9px 14px', fontSize: 12 }}>{c.address}</td>
                        <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{c.size_sf ? fmt(c.size_sf) : '—'}</td>
                        <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green)' }}>{c.sale_price ? fmtMoney(c.sale_price) : '—'}</td>
                        <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue)' }}>{c.price_per_sf ? `$${Number(c.price_per_sf).toFixed(0)}/SF` : (c.sale_price && c.size_sf ? `$${Math.round(c.sale_price / c.size_sf)}/SF` : '—')}</td>
                        <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.buyer || '—'}</td>
                        <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>{c.sale_date ? new Date(c.sale_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : '—'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )
            )}

            {/* CONTACTS TAB */}
            {activeTab === 'contacts' && (
              contacts.length === 0 ? <EmptyState title="No contacts linked" sub="Add contacts associated with this property" /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {contacts.map(c => (
                    <div key={c.id} className="cl-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue-bg)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                        {(c.first_name?.[0] || '') + (c.last_name?.[0] || '')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{c.first_name} {c.last_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.title}{c.company ? ` · ${c.company}` : ''}</div>
                      </div>
                      {c.phone && <a href={`tel:${c.phone}`} className="cl-btn cl-btn-ghost cl-btn-sm">📞</a>}
                      {c.email && <a href={`mailto:${c.email}`} className="cl-btn cl-btn-ghost cl-btn-sm">✉️</a>}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* DEALS TAB */}
            {activeTab === 'deals' && (
              deals.length === 0 ? <EmptyState title="No deals" sub="Convert a lead or create a deal from this property" /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {deals.map(d => (
                    <div key={d.id} className="cl-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => router.push(`/deals/${d.id}`)}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>{d.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{d.deal_type || ''}{d.asking_price ? ` · ${fmtMoney(d.asking_price)}` : ''}</div>
                      </div>
                      <span className={`cl-badge cl-badge-${d.stage?.includes('Closed Won') ? 'green' : d.stage?.includes('LOI') ? 'amber' : d.stage?.includes('Closed Lost') || d.stage === 'Dead' ? 'rust' : 'blue'}`}>{d.stage}</span>
                      {d.commission_est && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green)' }}>{fmtMoney(d.commission_est)}</span>}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* LEADS TAB */}
            {activeTab === 'leads' && (
              leads.length === 0 ? <EmptyState title="No leads" sub="Create a lead from this property to start tracking" /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {leads.map(l => (
                    <div key={l.id} className="cl-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => router.push(`/leads/${l.id}`)}>
                      <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{l.lead_name || l.company || 'Unnamed Lead'}</span>
                      <span className={`cl-badge cl-badge-${l.stage === 'Converted' ? 'green' : 'blue'}`}>{l.stage || '—'}</span>
                      {l.score != null && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>{l.score}</span>}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* BUILDINGS, APNS, FILES tabs — placeholders */}
            {(activeTab === 'buildings' || activeTab === 'apns' || activeTab === 'files') && (
              <EmptyState title={`No ${activeTab} data`} sub="This section will be populated as data is added" />
            )}
          </div>

          {/* RIGHT COLUMN — persistent across all tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* WARN NOTICE */}
            {warnNotice && (
              <div style={{ background: 'var(--rust-bg)', border: '1px solid rgba(184,55,20,0.28)', borderRadius: 'var(--radius-md)', padding: '12px 14px', borderLeft: '3px solid var(--rust)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--rust)', marginBottom: 6 }}>⚡ WARN Filing Matched</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{warnNotice.company}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 8 }}>{warnNotice.employees ? `${fmt(warnNotice.employees)} workers` : ''}{warnNotice.notice_date ? ` · ${fmtDate(warnNotice.notice_date)}` : ''}</div>
                <a href={`/warn-intel/${warnNotice.id}`} style={{ fontSize: 12, color: 'var(--rust)', fontWeight: 500 }}>View Filing →</a>
              </div>
            )}

            {/* ACTIVE CATALYSTS */}
            {tags.length > 0 && (
              <div className="cl-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--card-border)', background: 'var(--bg)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Active Catalysts</span>
                  <span style={{ fontFamily: 'var(--font-editorial)', fontSize: 13, fontStyle: 'italic', color: 'var(--blue)', cursor: 'pointer' }}>+ Add</span>
                </div>
                {tags.map((tag, i) => {
                  const lbl = typeof tag === 'object' ? (tag.tag || tag.label || tag.name) : tag;
                  const cat = typeof tag === 'object' ? (tag.category || 'asset') : 'asset';
                  const date = typeof tag === 'object' ? tag.date : '';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: i < tags.length - 1 ? '1px solid var(--card-border)' : 'none', cursor: 'pointer' }}>
                      <span className={`cl-catalyst cl-catalyst--${cat}`} style={{ fontSize: 10.5, flexShrink: 0 }}>{lbl}</span>
                      {date && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{date}</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI PROPERTY SIGNAL */}
            <div style={{ background: 'var(--blue-bg)', border: '1px solid rgba(78,110,150,0.28)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', background: 'rgba(78,110,150,0.12)', borderBottom: '1px solid rgba(78,110,150,0.22)', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>✦</span> AI Property Signal
              </div>
              <div style={{ padding: '13px 14px', fontSize: 13.5, lineHeight: 1.75, color: 'var(--text-primary)' }}>
                {property.ai_signal || (
                  <>
                    {displayScore >= 75 && <><strong style={{ color: 'var(--blue)' }}>Top-quartile SGV asset.</strong> </>}
                    {property.clear_height && property.building_sf ? `${property.clear_height}' clear and ${dhRatio} DH ratio` : ''}
                    {leaseUrgent ? <> — lease expiry in <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{mo} months</span> creates outreach urgency.</> : ' — monitor for lease events.'}
                    {property.in_place_rent && property.market_rent && Number(property.in_place_rent) < Number(property.market_rent) ? <> In-place rent <span style={{ color: 'var(--green)', fontWeight: 600 }}>{Math.round((Number(property.market_rent) - Number(property.in_place_rent)) / Number(property.market_rent) * 100)}% below market</span> — meaningful NOI upside at renewal.</> : null}
                  </>
                )}
              </div>
            </div>

            {/* OWNER CARD */}
            {(property.owner || property.owner_name) && (
              <div className="cl-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--card-border)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Owner</span>
                  <span style={{ fontFamily: 'var(--font-editorial)', fontSize: 13, fontStyle: 'italic', color: 'var(--blue)', cursor: 'pointer' }}>View Record →</span>
                </div>
                {[
                  ['Company', property.owner || property.owner_name],
                  ['Owner Type', property.vacancy_status === 'owner-user' ? 'Owner-User' : 'Investment Owner'],
                  ['APN', property.apn],
                ].filter(([,v]) => v).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 14px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>{k}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', textAlign: 'right', maxWidth: 160 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* TENANT CARD */}
            {property.tenant && (
              <div className="cl-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--card-border)', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Tenant</div>
                <div style={{ padding: '14px 14px 10px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>Tenant</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{property.tenant}</div>
                  {property.lease_expiration && <>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: leaseColor, lineHeight: 1, marginTop: 4, letterSpacing: '-0.02em' }}>{fmtDate(property.lease_expiration)}</div>
                    <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 13, fontStyle: 'italic', color: leaseColor, marginTop: 2 }}>{mo !== null ? `${mo} months remaining` : ''}</div>
                  </>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--card-border)' }}>
                  {[
                    { lbl: 'Current Rate', val: property.in_place_rent ? `$${Number(property.in_place_rent).toFixed(2)}/SF` : '—', color: 'var(--rust)' },
                    { lbl: 'Market Rate', val: property.market_rent ? `$${Number(property.market_rent).toFixed(2)}` : (property.market_rent_low ? `$${Number(property.market_rent_low).toFixed(2)}–${Number(property.market_rent_high).toFixed(2)}` : '—'), color: 'var(--green)' },
                    { lbl: 'Type', val: property.lease_type || 'NNN', color: 'var(--blue)' },
                    { lbl: 'Spread', val: property.in_place_rent && property.market_rent ? `+${Math.round((Number(property.market_rent) - Number(property.in_place_rent)) / Number(property.in_place_rent) * 100)}%` : '—', color: 'var(--green)' },
                  ].map((c, i) => (
                    <div key={c.lbl} style={{ padding: '9px 12px', borderRight: i % 2 === 0 ? '1px solid var(--card-border)' : 'none', borderTop: i >= 2 ? '1px solid var(--card-border)' : 'none' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 4 }}>{c.lbl}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: c.color }}>{c.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>{/* /right col */}
        </div>{/* /grid */}
      </div>{/* /inner */}
    </div>
  );
}

// ─── SMALL HELPERS ─────────────────────────────────────────────
function ActionBtn({ icon, children, onClick }) {
  return (
    <button onClick={onClick} className="cl-btn cl-btn-secondary cl-btn-sm" style={{ gap: 5 }}>
      {icon && <span>{icon}</span>}{children}
    </button>
  );
}
function LinkBtn({ children, href }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 12.5, padding: '6px 10px', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(78,110,150,0.3)', fontFamily: 'var(--font-ui)' }}>{children}</a>;
}
function EmptyState({ title, sub }) {
  return <div className="cl-empty"><div className="cl-empty-label">{title}</div>{sub && <div className="cl-empty-sub">{sub}</div>}</div>;
}
function SynthItem({ children }) {
  return <div style={{ fontSize: 13.5, lineHeight: 1.72, color: 'var(--text-primary)', display: 'flex', gap: 8, marginBottom: 3 }}><span style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>–</span><span>{children}</span></div>;
}
