'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmtSF(n)  { return n ? Number(n).toLocaleString() + ' SF' : '—'; }
function fmtM(n)   { if (!n) return '—'; return n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : `$${(n/1e3).toFixed(0)}K`; }
function fmtDate(d){ if (!d) return '—'; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function fmtRent(r){ return r ? `$${parseFloat(r).toFixed(2)}/SF/Mo` : '—'; }

const TABS = [
  { key: 'overview',  label: 'Overview' },
  { key: 'buildings', label: 'Buildings' },
  { key: 'leases',    label: 'Leases & Comps' },
  { key: 'contacts',  label: 'Contacts' },
  { key: 'deals',     label: 'Deals' },
  { key: 'timeline',  label: 'Timeline' },
  { key: 'files',     label: 'Files' },
];

const CATALYST_STYLE = {
  owner:    { bg: 'var(--rust-bg)',   color: 'var(--rust)' },
  occupier: { bg: 'var(--amber-bg)',  color: 'var(--amber)' },
  asset:    { bg: 'var(--blue-bg)',   color: 'var(--blue2)' },
  market:   { bg: 'var(--purple-bg)', color: 'var(--purple)' },
};

function CatalystTag({ tag }) {
  const cat = tag?.category || 'asset';
  const style = CATALYST_STYLE[cat] || CATALYST_STYLE.asset;
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 20,
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em',
      background: style.bg, color: style.color, margin: '2px 3px 2px 0',
    }}>
      {tag?.label || tag}
    </span>
  );
}

function ScoreRing({ score, size = 44 }) {
  if (!score && score !== 0) return <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>—</div>;
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(100, Math.max(0, score)) / 100;
  const color = score >= 75 ? 'var(--rust)' : score >= 50 ? 'var(--amber)' : score >= 25 ? 'var(--blue2)' : 'var(--text-tertiary)';
  return (
    <div className="cl-score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={3} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <div className="cl-score-ring-value" style={{ fontSize: size > 36 ? 13 : 10, fontWeight: 700, color }}>{score}</div>
    </div>
  );
}

function SpecRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '.5px solid var(--border-subtle)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{value}</span>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function PropertyDetailPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const [prop, setProp]             = useState(null);
  const [buildings, setBuildings]   = useState([]);
  const [activities, setActivities] = useState([]);
  const [contacts, setContacts]     = useState([]);
  const [deals, setDeals]           = useState([]);
  const [leaseComps, setLeaseComps] = useState([]);
  const [warnNotice, setWarnNotice] = useState(null);
  const [apns, setApns]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('overview');
  const [logNote, setLogNote]       = useState('');
  const [logType, setLogType]       = useState('note');
  const [saving, setSaving]         = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: p, error } = await supabase.from('properties').select('*').eq('id', id).single();
      if (error) throw error;
      setProp(p);

      const [actsR, bldgR, ctctsR, dealsR, apnsR] = await Promise.all([
        supabase.from('activities').select('*').eq('property_id', id).order('created_at', { ascending: false }).limit(30),
        supabase.from('property_buildings').select('*').eq('property_id', id).order('address'),
        supabase.from('contacts').select('id, first_name, last_name, title, company, phone, email').eq('property_id', id).limit(10),
        supabase.from('deals').select('id, deal_name, stage, deal_value, commission_est, probability, close_date, updated_at').eq('property_id', id).order('updated_at', { ascending: false }).limit(10),
        supabase.from('property_apns').select('*').eq('property_id', id),
      ]);
      setActivities(actsR.data || []);
      setBuildings(bldgR.data || []);
      setContacts(ctctsR.data || []);
      setDeals(dealsR.data || []);
      setApns(apnsR.data || []);

      // Lease comps nearby
      if (p?.city) {
        const { data: comps } = await supabase.from('lease_comps')
          .select('id, address, tenant, lease_date, lease_rate, lease_rate_gross, size_sf, lease_type, term_months')
          .eq('city', p.city)
          .order('lease_date', { ascending: false })
          .limit(8);
        setLeaseComps(comps || []);
      }

      // WARN match
      const { data: warn } = await supabase.from('warn_notices')
        .select('id, company, notice_date, effective_date, employees, address')
        .eq('matched_property_id', id)
        .limit(1)
        .maybeSingle();
      if (warn) setWarnNotice(warn);

    } catch (err) {
      console.error('load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function logActivity() {
    if (!logNote.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const act = {
        property_id: id,
        activity_type: logType,
        title: `${logType.charAt(0).toUpperCase() + logType.slice(1)} logged`,
        body: logNote,
        created_at: new Date().toISOString(),
      };
      const { data } = await supabase.from('activities').insert(act).select().single();
      setActivities(prev => [data || act, ...prev]);
      setLogNote('');
    } catch (err) {
      console.error('logActivity error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function createDeal() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('deals').insert({
        deal_name: prop.address || 'New Deal',
        address: prop.address,
        city: prop.city,
        building_sf: prop.building_sf,
        land_acres: prop.land_acres,
        clear_height: prop.clear_height,
        year_built: prop.year_built,
        property_id: id,
        stage: 'Tracking',
        deal_type: 'Disposition',
        owner: prop.owner,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      router.push(`/deals/${data.id}`);
    } catch (err) {
      console.error('createDeal error:', err);
      alert('Error creating deal: ' + err.message);
    }
  }

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-tertiary)' }}>Loading property…</div>;
  }

  if (!prop) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{ color: 'var(--rust)', marginBottom: 12 }}>Property not found.</div>
        <Link href="/properties" className="cl-btn">← Back to Properties</Link>
      </div>
    );
  }

  // Parse catalyst tags
  let catalystTags = [];
  if (prop.catalyst_tags) {
    try {
      catalystTags = Array.isArray(prop.catalyst_tags) ? prop.catalyst_tags : JSON.parse(prop.catalyst_tags);
    } catch { catalystTags = []; }
  }

  return (
    <div className="cl-page">

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Link href="/properties" style={{ fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'none' }}>Properties</Link>
              <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>›</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ScoreRing score={prop.ai_score} size={40} />
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {prop.address}
                </h1>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 50 }}>
              {prop.city && <span>{prop.city}</span>}
              {prop.zip && <span style={{ color: 'var(--text-tertiary)' }}>, {prop.zip}</span>}
              {prop.submarket && <span style={{ color: 'var(--text-tertiary)' }}> · {prop.submarket}</span>}
              {prop.prop_type && <span style={{ color: 'var(--text-tertiary)' }}> · {prop.prop_type}</span>}
            </div>
            {/* Catalyst tags */}
            {catalystTags.length > 0 && (
              <div style={{ paddingLeft: 50, marginTop: 6 }}>
                {catalystTags.map((tag, i) => <CatalystTag key={i} tag={tag} />)}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {warnNotice && (
              <Link href={`/warn-intel/${warnNotice.id}`} className="cl-btn cl-btn--sm" style={{ background: 'var(--rust-bg)', color: 'var(--rust)', borderColor: 'var(--rust)' }}>
                ⚡ WARN Match
              </Link>
            )}
            <button onClick={createDeal} className="cl-btn cl-btn--sm cl-btn--primary">
              + Create Deal
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div className="cl-kpi-strip" style={{ marginBottom: 16 }}>
        <div className="cl-kpi">
          <div className="cl-kpi-label">Building SF</div>
          <div className="cl-kpi-value">{fmtSF(prop.building_sf)}</div>
        </div>
        <div className="cl-kpi">
          <div className="cl-kpi-label">Land Area</div>
          <div className="cl-kpi-value">{prop.land_acres ? `${prop.land_acres} AC` : '—'}</div>
        </div>
        <div className="cl-kpi">
          <div className="cl-kpi-label">In-Place Rent</div>
          <div className="cl-kpi-value" style={{ color: 'var(--blue2)' }}>{fmtRent(prop.in_place_rent)}</div>
        </div>
        <div className="cl-kpi">
          <div className="cl-kpi-label">Lease Expiration</div>
          <div className="cl-kpi-value" style={{ fontSize: 15 }}>{fmtDate(prop.lease_expiration)}</div>
        </div>
        <div className="cl-kpi">
          <div className="cl-kpi-label">Owner Readiness</div>
          <div className="cl-kpi-value">{prop.ai_score ?? '—'}</div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="cl-tabs" style={{ marginBottom: 16 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`cl-tab ${activeTab === t.key ? 'cl-tab--active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            {t.key === 'deals' && deals.length > 0 && (
              <span style={{ marginLeft: 5, fontSize: 9, background: 'var(--blue2)', color: '#fff', borderRadius: 4, padding: '1px 5px' }}>{deals.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Ownership */}
          <div className="cl-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Ownership</div>
            <SpecRow label="Owner"         value={prop.owner} />
            <SpecRow label="Owner Type"    value={prop.owner_type} />
            <SpecRow label="Mail Address"  value={prop.mail_address} />
            <SpecRow label="Mail City"     value={prop.mail_city} />
            <SpecRow label="APN(s)"        value={apns.map(a => a.apn).join(' | ') || prop.apn} />
            <SpecRow label="Zoning"        value={prop.zoning} />
            <SpecRow label="Hold Period"   value={prop.hold_period_yrs ? `${prop.hold_period_yrs} yrs` : null} />
            <SpecRow label="Last Sale"     value={prop.last_sale_date ? fmtDate(prop.last_sale_date) : null} />
            <SpecRow label="Last Sale $"   value={prop.last_sale_price ? fmtM(prop.last_sale_price) : null} />
          </div>

          {/* Building Specs */}
          <div className="cl-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Building Specs</div>
            <SpecRow label="Building SF"   value={fmtSF(prop.building_sf)} />
            <SpecRow label="Land AC"       value={prop.land_acres ? `${prop.land_acres} AC` : null} />
            <SpecRow label="Year Built"    value={prop.year_built} />
            <SpecRow label="Construction"  value={prop.construction_type} />
            <SpecRow label="Clear Height"  value={prop.clear_height ? `${prop.clear_height} ft` : null} />
            <SpecRow label="Dock Doors"    value={prop.dock_doors} />
            <SpecRow label="GL Doors"      value={prop.grade_level_doors} />
            <SpecRow label="Truck Court"   value={prop.truck_court_depth ? `${prop.truck_court_depth} ft` : null} />
            <SpecRow label="Power"         value={prop.power_amps ? `${prop.power_amps} amps` : null} />
            <SpecRow label="Sprinklers"    value={prop.sprinkler_type} />
            <SpecRow label="Office %"      value={prop.office_pct != null ? `${prop.office_pct}%` : null} />
            <SpecRow label="Rail"          value={prop.rail_served ? 'Yes' : null} />
          </div>

          {/* Tenant / Lease */}
          <div className="cl-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Tenant & Lease</div>
            <SpecRow label="Tenant"        value={prop.tenant} />
            <SpecRow label="Lease Type"    value={prop.lease_type} />
            <SpecRow label="In-Place Rent" value={fmtRent(prop.in_place_rent)} />
            <SpecRow label="Market Rent"   value={prop.market_rent ? fmtRent(prop.market_rent) : null} />
            <SpecRow label="Lease Start"   value={fmtDate(prop.lease_start)} />
            <SpecRow label="Lease Exp."    value={fmtDate(prop.lease_expiration)} />
            <SpecRow label="Lease Term"    value={prop.lease_term_yrs ? `${prop.lease_term_yrs} yrs` : null} />
            <SpecRow label="Options"       value={prop.lease_options} />
            <SpecRow label="Vacancy"       value={prop.vacancy_status} />
          </div>

          {/* Location */}
          <div className="cl-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Location</div>
            <SpecRow label="Address"       value={prop.address} />
            <SpecRow label="City"          value={prop.city} />
            <SpecRow label="Zip"           value={prop.zip} />
            <SpecRow label="County"        value={prop.county} />
            <SpecRow label="Submarket"     value={prop.submarket} />
            <SpecRow label="Freeway"       value={prop.freeway_access} />
            <SpecRow label="Cross Streets" value={prop.cross_streets} />
            {/* Map placeholder */}
            {prop.lat && prop.lng && (
              <div style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden', height: 160, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                Map · {prop.lat.toFixed(4)}, {prop.lng.toFixed(4)}
              </div>
            )}
          </div>

          {/* WARN notice */}
          {warnNotice && (
            <div className="cl-card" style={{ padding: 16, borderLeft: '3px solid var(--rust)', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--rust)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>⚡ WARN Notice Match</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div><div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Company</div><div style={{ fontWeight: 600, fontSize: 13 }}>{warnNotice.company}</div></div>
                <div><div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Notice Date</div><div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDate(warnNotice.notice_date)}</div></div>
                <div><div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Effective Date</div><div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDate(warnNotice.effective_date)}</div></div>
                <div><div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Employees</div><div style={{ fontWeight: 600, fontSize: 13 }}>{warnNotice.employees?.toLocaleString()}</div></div>
              </div>
              <Link href={`/warn-intel/${warnNotice.id}`} style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: 'var(--rust)', textDecoration: 'none', fontWeight: 600 }}>
                → View Full WARN Record
              </Link>
            </div>
          )}

        </div>
      )}

      {/* ── BUILDINGS TAB ── */}
      {activeTab === 'buildings' && (
        <div>
          {buildings.length === 0 ? (
            <div className="cl-card" style={{ padding: 24, color: 'var(--text-tertiary)', fontSize: 13 }}>
              No buildings recorded yet. Buildings are added via Lead Gen specs.
            </div>
          ) : (
            <div className="cl-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="cl-table">
                <thead>
                  <tr>
                    <th>Address / Suite</th>
                    <th style={{ textAlign: 'right' }}>SF</th>
                    <th>Year</th>
                    <th>Clear Ht</th>
                    <th>Dock</th>
                    <th>GL</th>
                    <th>Power</th>
                    <th>Tenant</th>
                    <th>Lease Exp.</th>
                  </tr>
                </thead>
                <tbody>
                  {buildings.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{b.address || b.suite || '—'}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{b.building_sf ? Number(b.building_sf).toLocaleString() : '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{b.year_built || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{b.clear_height ? b.clear_height + " ft" : '—'}</td>
                      <td style={{ textAlign: 'center', fontSize: 12 }}>{b.dock_doors ?? '—'}</td>
                      <td style={{ textAlign: 'center', fontSize: 12 }}>{b.grade_level_doors ?? '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{b.power_amps ? b.power_amps + 'A' : '—'}</td>
                      <td style={{ fontSize: 12 }}>{b.tenant || <span style={{ color: 'var(--text-tertiary)' }}>Vacant</span>}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDate(b.lease_expiration)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── LEASES & COMPS TAB ── */}
      {activeTab === 'leases' && (
        <div>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Nearby lease comps in {prop.city}
            </div>
          </div>
          {leaseComps.length === 0 ? (
            <div className="cl-card" style={{ padding: 24, color: 'var(--text-tertiary)', fontSize: 13 }}>No lease comps found for {prop.city}.</div>
          ) : (
            <div className="cl-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="cl-table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Tenant</th>
                    <th style={{ textAlign: 'right' }}>SF</th>
                    <th style={{ textAlign: 'right' }}>Rate NNN</th>
                    <th style={{ textAlign: 'right' }}>Rate Gross</th>
                    <th>Type</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leaseComps.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, fontSize: 12 }}>{c.address}</td>
                      <td style={{ fontSize: 12 }}>{c.tenant || '—'}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{c.size_sf ? Number(c.size_sf).toLocaleString() : '—'}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {c.lease_rate ? <span style={{ color: 'var(--blue2)' }}>${parseFloat(c.lease_rate).toFixed(2)}</span> : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {c.lease_rate_gross ? `$${parseFloat(c.lease_rate_gross).toFixed(2)}` : '—'}
                      </td>
                      <td><span className="cl-badge cl-badge-blue" style={{ fontSize: 9 }}>{c.lease_type || '—'}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {c.lease_date ? new Date(c.lease_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CONTACTS TAB ── */}
      {activeTab === 'contacts' && (
        <div className="cl-card" style={{ padding: 0, overflow: 'hidden' }}>
          {contacts.length === 0 ? (
            <div style={{ padding: 24, color: 'var(--text-tertiary)', fontSize: 13 }}>No contacts linked.</div>
          ) : (
            <table className="cl-table">
              <thead><tr><th>Name</th><th>Title</th><th>Company</th><th>Phone</th><th>Email</th></tr></thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.first_name} {c.last_name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{c.title || '—'}</td>
                    <td style={{ fontSize: 12 }}>{c.company || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{c.phone || '—'}</td>
                    <td style={{ fontSize: 12 }}>{c.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── DEALS TAB ── */}
      {activeTab === 'deals' && (
        <div>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{deals.length} deal{deals.length !== 1 ? 's' : ''} on this property</span>
            <button onClick={createDeal} className="cl-btn cl-btn--sm cl-btn--primary">+ Create Deal</button>
          </div>
          {deals.length === 0 ? (
            <div className="cl-card" style={{ padding: 24, color: 'var(--text-tertiary)', fontSize: 13 }}>
              No deals yet. Click + Create Deal to start a disposition or acquisition.
            </div>
          ) : (
            <div className="cl-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="cl-table">
                <thead><tr><th>Deal Name</th><th>Stage</th><th>Value</th><th>Commission</th><th>Close Date</th><th>Updated</th></tr></thead>
                <tbody>
                  {deals.map(d => {
                    const showComm = ['LOI Accepted','PSA Negotiation','Due Diligence','Non-Contingent','Closed Won'].includes(d.stage);
                    return (
                      <tr key={d.id}>
                        <td>
                          <Link href={`/deals/${d.id}`} className="cl-table-link" style={{ fontWeight: 600 }}>
                            {d.deal_name || '(untitled)'}
                          </Link>
                        </td>
                        <td><span className="cl-badge cl-badge-blue" style={{ fontSize: 10 }}>{d.stage}</span></td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{fmtM(d.deal_value)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {showComm && d.commission_est ? <span className="cl-commission">{fmtM(d.commission_est)}</span> : '—'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDate(d.close_date)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
                          {d.updated_at ? Math.floor((Date.now() - new Date(d.updated_at)) / 864e5) + 'd ago' : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TIMELINE TAB ── */}
      {activeTab === 'timeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
          <div>
            <div className="cl-card" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {['note','call','email','meeting'].map(t => (
                  <button key={t} onClick={() => setLogType(t)}
                    style={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 6, border: `1px solid ${logType === t ? 'var(--blue2)' : 'var(--border)'}`, background: logType === t ? 'var(--blue-bg)' : 'transparent', color: logType === t ? 'var(--blue2)' : 'var(--text-secondary)', cursor: 'pointer', textTransform: 'capitalize' }}>
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                placeholder={`Log a ${logType}…`}
                value={logNote}
                onChange={e => setLogNote(e.target.value)}
                rows={3}
                style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-card)', color: 'var(--text-primary)', resize: 'vertical', marginBottom: 8 }}
              />
              <button onClick={logActivity} disabled={saving || !logNote.trim()} className="cl-btn cl-btn--primary cl-btn--sm">
                {saving ? 'Saving…' : 'Log Activity'}
              </button>
            </div>
            <div className="cl-card" style={{ padding: '4px 16px' }}>
              {activities.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No activity yet</div>
              ) : activities.map((a, i) => {
                const ICON = { call: '📞', email: '✉️', note: '📝', meeting: '🤝', task: '✅', system: '⚙️' };
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{ICON[a.activity_type] || '📌'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</div>
                      {a.body && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{a.body}</div>}
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                        {a.created_at ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick stats */}
          <div className="cl-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Quick Info</div>
            <SpecRow label="Owner"          value={prop.owner} />
            <SpecRow label="Follow-Up"      value={prop.follow_up_cadence} />
            <SpecRow label="Stage"          value={prop.vacancy_status} />
            <SpecRow label="AI Score"       value={prop.ai_score} />
            <SpecRow label="Building Grade" value={prop.building_grade} />
            <SpecRow label="Submarket"      value={prop.submarket} />
            <SpecRow label="Last Activity"  value={activities[0]?.created_at ? fmtDate(activities[0].created_at) : null} />
            <div style={{ marginTop: 16 }}>
              <button onClick={createDeal} className="cl-btn cl-btn--primary" style={{ width: '100%', fontSize: 12 }}>
                + Create Deal from Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FILES TAB ── */}
      {activeTab === 'files' && (
        <div className="cl-card" style={{ padding: 24, color: 'var(--text-tertiary)', fontSize: 13 }}>
          File attachment coming soon.
        </div>
      )}

    </div>
  );
}
