'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { CATALYST_TAGS, getCatalystStyle } from '@/lib/catalyst-constants';

const MARKETS = ['SGV East', 'SGV West', 'IE West'];
const OWNER_TYPES = ['Owner-User', 'Private LLC', 'Family Trust', 'Corp', 'Individual', 'REIT', 'Institutional'];
const PROP_TYPES = ['Warehouse / Distribution', 'Manufacturing', 'Flex / R&D', 'Food Processing', 'Cold Storage', 'Truck Terminal', 'IOS', 'Other'];
const STAGES = ['New', 'Researching', 'Decision Maker Identified', 'Contacted'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const SOURCES = ['CoStar', 'WARN Database', 'Cold Outreach', 'Referral', 'Owner Search', 'Driving for Dollars', 'County Records', 'News / Press', 'Other'];

function parseCatalysts(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

export default function NewLeadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    lead_name: '', company: '', address: '', city: '', market: '',
    stage: 'New', priority: 'Medium', source: '', owner_type: '',
    decision_maker: '', phone: '', email: '',
    building_sf: '', land_acres: '', clear_height: '', dock_doors: '',
    grade_doors: '', year_built: '', zoning: '', power_amps: '',
    parking_spaces: '', prop_type: '', notes: '', lat: '', lng: '',
  });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function toggleTag(tag) {
    setSelectedTags(prev =>
      prev.some(t => t.tag === tag.tag)
        ? prev.filter(t => t.tag !== tag.tag)
        : [...prev, { tag: tag.tag, category: tag.category, priority: tag.priority }]
    );
  }

  async function handleSave() {
    if (!form.lead_name && !form.company) {
      setError('Lead name or company is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const sb = createClient();
      const { data, error: err } = await sb.from('leads').insert({
        lead_name: form.lead_name || form.company,
        company: form.company || null,
        address: form.address || null,
        city: form.city || null,
        market: form.market || null,
        stage: form.stage,
        priority: form.priority,
        source: form.source || null,
        owner_type: form.owner_type || null,
        decision_maker: form.decision_maker || null,
        phone: form.phone || null,
        email: form.email || null,
        building_sf: form.building_sf ? parseInt(String(form.building_sf).replace(/,/g, '')) : null,
        land_acres: form.land_acres ? parseFloat(form.land_acres) : null,
        clear_height: form.clear_height ? parseFloat(form.clear_height) : null,
        dock_doors: form.dock_doors ? parseInt(form.dock_doors) : null,
        grade_doors: form.grade_doors ? parseInt(form.grade_doors) : null,
        year_built: form.year_built ? parseInt(form.year_built) : null,
        zoning: form.zoning || null,
        power_amps: form.power_amps || null,
        parking_spaces: form.parking_spaces ? parseInt(form.parking_spaces) : null,
        prop_type: form.prop_type || null,
        notes: form.notes || null,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        catalyst_tags: selectedTags.length ? JSON.stringify(selectedTags) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).select('id').single();

      if (err) throw err;
      router.push(`/leads/${data.id}`);
    } catch (e) {
      setError('Error saving lead: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  const iS = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.02)', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' };
  const lS = { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-tertiary)', marginBottom: 5, display: 'block', fontFamily: 'var(--font-mono)' };
  const card = { background: 'var(--card-bg)', borderRadius: 10, border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', padding: '20px 22px', marginBottom: 16 };
  const sectionTitle = { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--card-border)' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 80 }}>
      {/* HEADER */}
      <div className="cl-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ cursor: 'pointer', fontSize: 13, color: 'var(--blue)' }} onClick={() => router.push('/leads')}>← Lead Gen</span>
            <span style={{ opacity: 0.4, fontSize: 13 }}>›</span>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>New Lead</span>
          </div>
          <h1 className="cl-page-title">Add New Lead</h1>
        </div>
        <div className="cl-page-actions">
          <button className="cl-btn cl-btn-secondary" onClick={() => router.push('/leads')}>Cancel</button>
          <button className="cl-btn cl-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : '✓ Save Lead'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 16px', background: 'rgba(184,55,20,0.08)', border: '1px solid rgba(184,55,20,0.2)', borderRadius: 8, color: 'var(--rust)', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* IDENTITY */}
      <div style={card}>
        <div style={sectionTitle}>Lead Identity</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={lS}>Lead Name *</label>
            <input style={iS} value={form.lead_name} onChange={e => set('lead_name', e.target.value)} placeholder="e.g. Acme Corp — Vernon" />
          </div>
          <div>
            <label style={lS}>Company</label>
            <input style={iS} value={form.company} onChange={e => set('company', e.target.value)} placeholder="Legal entity name" />
          </div>
          <div>
            <label style={lS}>Address</label>
            <input style={iS} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" />
          </div>
          <div>
            <label style={lS}>City</label>
            <input style={iS} value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" />
          </div>
          <div>
            <label style={lS}>Market</label>
            <select style={iS} value={form.market} onChange={e => set('market', e.target.value)}>
              <option value="">Select market…</option>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={lS}>Owner Type</label>
            <select style={iS} value={form.owner_type} onChange={e => set('owner_type', e.target.value)}>
              <option value="">Select…</option>
              {OWNER_TYPES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={lS}>Stage</label>
            <select style={iS} value={form.stage} onChange={e => set('stage', e.target.value)}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lS}>Priority</label>
            <select style={iS} value={form.priority} onChange={e => set('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={lS}>Source</label>
            <select style={iS} value={form.source} onChange={e => set('source', e.target.value)}>
              <option value="">Select source…</option>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* CONTACT */}
      <div style={card}>
        <div style={sectionTitle}>Decision Maker / Contact</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div>
            <label style={lS}>Decision Maker Name</label>
            <input style={iS} value={form.decision_maker} onChange={e => set('decision_maker', e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <label style={lS}>Phone</label>
            <input style={iS} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(xxx) xxx-xxxx" />
          </div>
          <div>
            <label style={lS}>Email</label>
            <input style={iS} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@company.com" />
          </div>
        </div>
      </div>

      {/* BUILDING SPECS */}
      <div style={card}>
        <div style={sectionTitle}>Building Specs</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[
            ['building_sf', 'Building SF'], ['land_acres', 'Land (AC)'],
            ['clear_height', "Clear Height (ft)"], ['dock_doors', 'Dock Doors'],
            ['grade_doors', 'Grade Doors'], ['year_built', 'Year Built'],
            ['zoning', 'Zoning'], ['power_amps', 'Power (A)'],
            ['parking_spaces', 'Parking'],
          ].map(([k, label]) => (
            <div key={k}>
              <label style={lS}>{label}</label>
              <input style={iS} value={form[k] || ''} onChange={e => set(k, e.target.value)} placeholder="—" />
            </div>
          ))}
          <div>
            <label style={lS}>Property Type</label>
            <select style={iS} value={form.prop_type} onChange={e => set('prop_type', e.target.value)}>
              <option value="">Select…</option>
              {PROP_TYPES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* CATALYST TAGS */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={sectionTitle}>Catalyst Tags</div>
          <button
            onClick={() => setShowTagPicker(p => !p)}
            style={{ fontSize: 12, color: 'var(--blue)', background: 'none', border: '1px solid rgba(78,110,150,0.25)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
          >
            {showTagPicker ? '✕ Close' : '+ Add Tags'}
          </button>
        </div>

        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {selectedTags.map(t => {
              const cs = getCatalystStyle(t.tag);
              return (
                <span key={t.tag} onClick={() => toggleTag(t)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 500, border: `1px solid ${cs.bdr}`, background: cs.bg, color: cs.color, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                  {t.tag} <span style={{ opacity: 0.5 }}>×</span>
                </span>
              );
            })}
          </div>
        )}

        {selectedTags.length === 0 && !showTagPicker && (
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No catalyst tags added yet — click "+ Add Tags" to tag this lead</div>
        )}

        {/* Tag picker — grouped by category */}
        {showTagPicker && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
            {[
              { cat: 'owner',    label: 'Owner Signal' },
              { cat: 'occupier', label: 'Occupier Signal' },
              { cat: 'asset',    label: 'Asset Signal' },
              { cat: 'market',   label: 'Market Signal' },
            ].map(({ cat, label }) => {
              const tags = CATALYST_TAGS.filter(t => t.category === cat);
              const catColor = getCatalystStyle(tags[0]?.tag);
              return (
                <div key={cat}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: catColor.color, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>{label}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {tags.map(t => {
                      const cs = getCatalystStyle(t.tag);
                      const isSelected = selectedTags.some(s => s.tag === t.tag);
                      return (
                        <button key={t.tag} onClick={() => toggleTag(t)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 5, fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', border: `1px solid ${isSelected ? cs.color : cs.bdr}`, background: isSelected ? cs.bg : 'transparent', color: cs.color, transition: 'all 120ms ease' }}
                        >
                          <span>{t.tag}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.6 }}>+{t.boost}pts {isSelected ? '✓' : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LOCATION */}
      <div style={card}>
        <div style={sectionTitle}>Location Coordinates (optional)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={lS}>Latitude</label>
            <input style={iS} value={form.lat} onChange={e => set('lat', e.target.value)} placeholder="e.g. 34.0195" />
          </div>
          <div>
            <label style={lS}>Longitude</label>
            <input style={iS} value={form.lng} onChange={e => set('lng', e.target.value)} placeholder="e.g. -117.9310" />
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
          Used for the satellite map. Find coordinates at <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)' }}>Google Maps</a> — right-click any location.
        </div>
      </div>

      {/* NOTES */}
      <div style={card}>
        <div style={sectionTitle}>Notes</div>
        <textarea
          style={{ ...iS, minHeight: 100, resize: 'vertical' }}
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Initial research notes, context, how you found this lead…"
        />
      </div>

      {/* SAVE BAR */}
      <div style={{ position: 'fixed', bottom: 0, left: 220, right: 0, background: 'var(--card-bg)', borderTop: '1px solid var(--card-border)', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50, boxShadow: '0 -2px 12px rgba(0,0,0,0.06)' }}>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
          {selectedTags.length > 0 ? `${selectedTags.length} catalyst tag${selectedTags.length !== 1 ? 's' : ''} added` : 'Fill in lead details above'}
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="cl-btn cl-btn-secondary" onClick={() => router.push('/leads')}>Cancel</button>
          <button className="cl-btn cl-btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 120 }}>
            {saving ? 'Saving…' : '✓ Save Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}
