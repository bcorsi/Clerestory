'use client';

import { useState, useMemo, useEffect } from 'react';
import { fetchAll } from '../lib/db';

const TYPE_CONFIG = {
  zone:       { label: 'Prospect Zones', defaultOn: true },
  substation: { label: 'Substations', defaultOn: true },
  project:    { label: 'BESS Projects', defaultOn: true },
  parcel:     { label: 'Parcels', defaultOn: true },
  property:   { label: 'Properties', defaultOn: true },
  custom:     { label: 'Custom', defaultOn: true },
};

const DEFAULT_CENTER = [33.95, -117.75]; // IE/SGV midpoint

function safeCoords(l) {
  const lat = parseFloat(l.latitude);
  const lng = parseFloat(l.longitude);
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < 25 || lat > 50 || lng < -130 || lng > -60) return null; // outside CONUS
  return [lat, lng];
}

export default function CampaignMap({ campaignId, campaignTitle }) {
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleTypes, setVisibleTypes] = useState(
    Object.fromEntries(Object.entries(TYPE_CONFIG).map(([k, v]) => [k, v.defaultOn]))
  );
  const [selectedGroup, setSelectedGroup] = useState('');

  useEffect(() => {
    if (!campaignId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetchAll('campaign_layers', { order: 'created_at' })
      .then(all => {
        const rows = Array.isArray(all) ? all : [];
        const filtered = rows.filter(l => l.campaign_id === campaignId && safeCoords(l));
        setLayers(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.warn('CampaignMap fetch error:', err);
        setError('Could not load map data. The campaign_layers table may not be set up yet.');
        setLayers([]);
        setLoading(false);
      });
  }, [campaignId]);

  const featureTypes = useMemo(() => {
    const types = {};
    layers.forEach(l => { types[l.feature_type] = (types[l.feature_type] || 0) + 1; });
    return types;
  }, [layers]);

  const groups = useMemo(() => {
    const g = {};
    layers.forEach(l => {
      const grp = l.group_name || l.feature_type;
      if (!g[grp]) g[grp] = [];
      g[grp].push(l);
    });
    return g;
  }, [layers]);

  const visibleLayers = useMemo(() => {
    let filtered = layers.filter(l => visibleTypes[l.feature_type]);
    if (selectedGroup) filtered = filtered.filter(l => (l.group_name || l.feature_type) === selectedGroup);
    return filtered;
  }, [layers, visibleTypes, selectedGroup]);

  const toggleType = (type) => setVisibleTypes(prev => ({ ...prev, [type]: !prev[type] }));

  const mapHtml = useMemo(() => {
    try {
      if (visibleLayers.length === 0) return '';

      const validCoords = visibleLayers.map(l => safeCoords(l)).filter(Boolean);
      const centerLat = validCoords.reduce((s, c) => s + c[0], 0) / validCoords.length || DEFAULT_CENTER[0];
      const centerLng = validCoords.reduce((s, c) => s + c[1], 0) / validCoords.length || DEFAULT_CENTER[1];
      const center = `[${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}]`;

      const features = visibleLayers.map(l => {
        const coords = safeCoords(l);
        if (!coords) return '';
        const [lat, lng] = coords;
        const c = l.color || '#5577A0';
        const name = (l.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;').slice(0, 100);
        const meta = (l.metadata && typeof l.metadata === 'object') ? l.metadata : {};

        if (l.feature_type === 'zone' && l.radius_meters) {
          return `L.circle([${lat},${lng}],{radius:${l.radius_meters},color:'${c}',weight:1.5,dashArray:'7 4',fillColor:'${c}',fillOpacity:0.07}).bindTooltip('${name}',{sticky:true,direction:'top'}).addTo(map);`;
        }

        if (l.feature_type === 'substation') {
          const st = l.status || 'taken';
          const bg = st==='gap'?'rgba(204,51,51,0.3)':st==='opportunity'?'rgba(26,122,84,0.3)':'rgba(232,160,32,0.25)';
          const bw = (st==='gap'||st==='opportunity')?'3px':'2px';
          const noteStr = meta.note ? String(meta.note).replace(/\\/g,'\\\\').replace(/'/g,"\\'").slice(0,150) : '';
          return `L.marker([${lat},${lng}],{icon:L.divIcon({html:'<div style="width:18px;height:18px;transform:rotate(45deg);background:${bg};border:${bw} solid ${c};box-shadow:0 0 8px ${c}88"></div>',className:'',iconSize:[22,22],iconAnchor:[11,11]})}).bindPopup('<div style="font-size:13px;font-weight:700;color:#fff;padding:6px">${name}<br/><span style="font-size:11px;color:${c}">${st.toUpperCase()}</span>${noteStr ? '<br/><span style="font-size:10px;color:#99AABB;margin-top:4px;display:block">'+noteStr+'</span>' : ''}</div>').addTo(map);
L.marker([${lat},${lng}],{icon:L.divIcon({html:'<div style="font-size:9px;color:${c};font-weight:700;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,0.9);margin-top:14px;margin-left:14px">${name}</div>',className:'',iconSize:[0,0],iconAnchor:[0,0]})}).addTo(map);`;
        }

        if (l.feature_type === 'project') {
          const mw = parseFloat(l.size_value) || 0;
          const r = Math.max(10, Math.min(22, 10 + Math.log(Math.max(1, mw / 40)) * 3.5));
          const dev = meta.developer ? String(meta.developer).replace(/'/g,"\\'").slice(0,60) : '';
          const sub = meta.substation ? String(meta.substation).replace(/'/g,"\\'").slice(0,60) : '';
          return `L.marker([${lat},${lng}],{icon:L.divIcon({html:'<div style="width:${r*2}px;height:${r*2}px;border-radius:50%;background:${c};border:2.5px solid rgba(255,255,255,0.5);box-shadow:0 2px 8px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center">${mw>=100?'<span style="font-size:8px;font-weight:700;color:#fff">'+mw+'</span>':''}</div>',className:'',iconSize:[${r*2},${r*2}],iconAnchor:[${r},${r}]})}).bindPopup('<div style="padding:8px;font-size:12px;color:#fff"><div style="font-weight:700;font-size:13px;margin-bottom:2px">${name}</div><div style="color:#99AABB">${dev} · ${mw}MW</div>${sub?'<div style="color:#667788;margin-top:2px">Sub: '+sub+'</div>':''}</div>').addTo(map);`;
        }

        // parcel / property / custom
        const r = l.feature_type === 'parcel' ? Math.max(4, Math.min(11, 4 + (parseFloat(l.acres) || 5) / 20)) : 7;
        const popup = [
          name,
          l.apn ? 'APN: ' + l.apn : '',
          l.acres ? l.acres + ' ac' : '',
          l.distance_miles ? l.distance_miles + ' mi to sub' : '',
          l.group_name || '',
        ].filter(Boolean).join('<br/>');
        return `L.circleMarker([${lat},${lng}],{radius:${r},fillColor:'${c}',color:'${c}',weight:2,fillOpacity:0.75}).bindPopup('<div style="font-size:11px;color:#fff;padding:4px;line-height:1.5">${popup}</div>').addTo(map);`;
      }).filter(Boolean).join('\n');

      const bounds = visibleLayers
        .map(l => safeCoords(l)).filter(Boolean)
        .map(c => `[${c[0]},${c[1]}]`).join(',');

      return `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"><\/script>
<style>
body{margin:0;background:#0D1117}
#map{width:100%;height:100vh}
.leaflet-popup-content-wrapper{background:rgba(18,28,44,0.97)!important;border:1px solid rgba(70,100,140,0.5)!important;border-radius:8px!important;box-shadow:0 4px 20px rgba(0,0,0,0.6)!important}
.leaflet-popup-tip{background:rgba(18,28,44,0.97)!important}
.leaflet-popup-content{margin:0!important}
</style>
</head><body><div id="map"></div>
<script>
try {
  var map=L.map('map',{zoomControl:true,attributionControl:false}).setView(${center},11);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}).addTo(map);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}).addTo(map);
  ${features}
  ${bounds ? `try { map.fitBounds([${bounds}],{padding:[40,40]}); } catch(e) {}` : ''}
} catch(e) { document.body.innerHTML='<div style="color:#fff;padding:20px">Map error: '+e.message+'</div>'; }
<\/script></body></html>`;
    } catch (e) {
      console.error('mapHtml build error:', e);
      return '';
    }
  }, [visibleLayers]);

  // ─── STATES ─────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink4)' }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>⟳</div>
      Loading map layers...
    </div>
  );

  if (error) return (
    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ink4)', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--line)' }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>🗺</div>
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: 'var(--amber)' }}>Map Unavailable</div>
      <div style={{ fontSize: '13px' }}>{error}</div>
    </div>
  );

  if (layers.length === 0) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink4)', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--line)' }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺</div>
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>No Map Layers Yet</div>
      <div style={{ fontSize: '13px' }}>Import geospatial data or seed BESS layers via the SQL script to visualize this campaign.</div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '12px' }}>
      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '620px', overflow: 'auto' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink4)', marginBottom: '8px' }}>Layers</div>
          {Object.entries(featureTypes).map(([type, count]) => (
            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer', fontSize: '12px' }}>
              <input type="checkbox" checked={visibleTypes[type] || false} onChange={() => toggleType(type)} style={{ accentColor: 'var(--accent)' }} />
              <span style={{ color: 'var(--ink3)', flex: 1 }}>{TYPE_CONFIG[type]?.label || type}</span>
              <span style={{ fontSize: '10px', color: 'var(--ink4)', background: 'var(--bg)', padding: '1px 5px', borderRadius: '8px', border: '1px solid var(--line3)' }}>{count}</span>
            </label>
          ))}
        </div>

        {Object.keys(groups).length > 1 && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink4)', marginBottom: '8px' }}>Groups</div>
            <div onClick={() => setSelectedGroup('')}
              style={{ padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: !selectedGroup ? 'var(--accent)' : 'var(--ink4)', fontWeight: !selectedGroup ? 600 : 400 }}>
              All ({layers.length})
            </div>
            {Object.entries(groups).map(([grp, items]) => (
              <div key={grp} onClick={() => setSelectedGroup(selectedGroup === grp ? '' : grp)}
                style={{ padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: selectedGroup === grp ? 'var(--accent)' : 'var(--ink3)', fontWeight: selectedGroup === grp ? 600 : 400 }}>
                {grp} ({items.length})
              </div>
            ))}
          </div>
        )}

        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink4)', marginBottom: '4px' }}>Showing</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>{visibleLayers.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--ink4)' }}>of {layers.length} features</div>
        </div>
      </div>

      {/* Map */}
      <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--line)', height: '620px', background: '#0D1117' }}>
        {mapHtml ? (
          <iframe srcDoc={mapHtml} style={{ width: '100%', height: '100%', border: 'none' }} sandbox="allow-scripts" />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink4)', fontSize: '13px' }}>
            No visible features — enable layers in the sidebar.
          </div>
        )}
      </div>
    </div>
  );
}
