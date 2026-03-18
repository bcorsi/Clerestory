'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { STAGE_COLORS, LEAD_STAGE_COLORS, CATALYST_TAGS, catalystTagClass, fmt } from '../lib/constants';

const GOOGLE_MAPS_EMBED = 'https://www.google.com/maps/search/?api=1&query=';

export default function MapView({
  properties, leads, deals,
  onPropertyClick, onLeadClick, onDealClick
}) {
  const [showLayer, setShowLayer] = useState({ properties: true, leads: true, deals: true });
  const [catalystFilter, setCatalystFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);

  // Build pins from all records with addresses
  const pins = useMemo(() => {
    const all = [];
    if (showLayer.properties) {
      (properties || []).forEach(p => {
        if (!p.address) return;
        if (catalystFilter && !(p.catalyst_tags || []).includes(catalystFilter)) return;
        if (searchTerm && !`${p.address} ${p.city} ${p.owner} ${p.tenant}`.toLowerCase().includes(searchTerm.toLowerCase())) return;
        all.push({ type: 'property', id: p.id, label: p.address, sub: `${p.city || p.submarket || ''} · ${(p.total_sf || p.building_sf) ? Number(p.total_sf || p.building_sf).toLocaleString() + ' SF' : ''}`, color: '#3b82f6', record: p, address: `${p.address}, ${p.city || ''}, CA` });
      });
    }
    if (showLayer.leads) {
      (leads || []).filter(l => !['Converted', 'Dead'].includes(l.stage)).forEach(l => {
        if (!l.address) return;
        if (catalystFilter && !(l.catalyst_tags || []).includes(catalystFilter)) return;
        if (searchTerm && !`${l.address} ${l.lead_name} ${l.owner} ${l.company}`.toLowerCase().includes(searchTerm.toLowerCase())) return;
        all.push({ type: 'lead', id: l.id, label: l.lead_name, sub: `${l.address} · ${l.stage}`, color: '#8b5cf6', record: l, address: `${l.address}, CA` });
      });
    }
    if (showLayer.deals) {
      (deals || []).filter(d => !['Closed', 'Dead'].includes(d.stage)).forEach(d => {
        if (!d.address) return;
        if (searchTerm && !`${d.address} ${d.deal_name} ${d.buyer} ${d.seller}`.toLowerCase().includes(searchTerm.toLowerCase())) return;
        all.push({ type: 'deal', id: d.id, label: d.deal_name, sub: `${d.address} · ${d.stage}`, color: STAGE_COLORS[d.stage] || '#f59e0b', record: d, address: `${d.address}, CA` });
      });
    }
    return all;
  }, [properties, leads, deals, showLayer, catalystFilter, searchTerm]);

  const handleClick = (pin) => {
    setSelected(pin);
  };

  const handleNavigate = (pin) => {
    if (pin.type === 'property') onPropertyClick?.(pin.record);
    else if (pin.type === 'lead') onLeadClick?.(pin.record);
    else if (pin.type === 'deal') onDealClick?.(pin.record);
  };

  const typeCounts = useMemo(() => ({
    properties: pins.filter(p => p.type === 'property').length,
    leads: pins.filter(p => p.type === 'lead').length,
    deals: pins.filter(p => p.type === 'deal').length,
  }), [pins]);

  return (
    <div>
      {/* Filters */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Layer toggles */}
          {[
            ['properties', '⌂ Properties', '#3b82f6', typeCounts.properties],
            ['leads', '◎ Leads', '#8b5cf6', typeCounts.leads],
            ['deals', '◈ Deals', '#f59e0b', typeCounts.deals],
          ].map(([key, label, color, count]) => (
            <button key={key} onClick={() => setShowLayer(prev => ({ ...prev, [key]: !prev[key] }))}
              style={{
                padding: '4px 12px', borderRadius: '4px', border: '1px solid',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                background: showLayer[key] ? color + '22' : 'transparent',
                borderColor: showLayer[key] ? color : 'var(--border)',
                color: showLayer[key] ? color : 'var(--text-muted)',
              }}>
              {label} ({count})
            </button>
          ))}
          {/* Catalyst filter */}
          <select className="select" style={{ fontSize: '13px', maxWidth: '200px' }} value={catalystFilter} onChange={e => setCatalystFilter(e.target.value)}>
            <option value="">All catalysts</option>
            {CATALYST_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {/* Search */}
          <input className="input" style={{ flex: 1, minWidth: '150px', fontSize: '13px' }} placeholder="Search address, owner, company..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Map + List split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', height: '600px' }}>
        {/* Map iframe - Google Maps with all pins as markers */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          {pins.length > 0 ? (
            <iframe
              style={{ width: '100%', height: '100%', border: 'none' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                pins.length === 1
                  ? pins[0].address
                  : pins.length <= 5
                    ? pins.map(p => p.record?.address).filter(Boolean).join('|')
                    : 'industrial properties SGV Inland Empire California'
              )}&zoom=${pins.length === 1 ? 16 : 10}`}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '14px' }}>
              No records with addresses to display
            </div>
          )}
        </div>

        {/* Record list */}
        <div className="card" style={{ overflow: 'auto', padding: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>{pins.length} records on map</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {pins.slice(0, 100).map(pin => {
              const isSelected = selected?.id === pin.id;
              return (
                <div key={`${pin.type}-${pin.id}`}
                  onClick={() => handleClick(pin)}
                  style={{
                    padding: '10px 12px', borderRadius: '6px', cursor: 'pointer',
                    background: isSelected ? pin.color + '11' : 'var(--bg-input)',
                    border: `1px solid ${isSelected ? pin.color : 'var(--border-subtle)'}`,
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: pin.color, flexShrink: 0 }} />
                    <div style={{ fontSize: '14px', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pin.label}</div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{pin.type}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '16px' }}>{pin.sub}</div>
                  {isSelected && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', paddingLeft: '16px' }}>
                      <button className="btn btn-primary btn-sm" style={{ fontSize: '11px' }} onClick={(e) => { e.stopPropagation(); handleNavigate(pin); }}>Open →</button>
                      <a href={`${GOOGLE_MAPS_EMBED}${encodeURIComponent(pin.address)}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: '11px', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>📍 Maps</a>
                    </div>
                  )}
                </div>
              );
            })}
            {pins.length > 100 && <div style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Showing 100 of {pins.length}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
