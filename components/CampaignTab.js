'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchAll } from '../lib/db';

// ─── HELPERS ─────────────────────────────────────────────────
const CITY_COORDS = {
  'city of industry':[34.0198,-117.9587],'vernon':[33.9925,-118.2301],
  'el monte':[34.0686,-118.0276],'irwindale':[34.1070,-117.9354],
  'ontario':[34.0633,-117.6509],'fontana':[34.0922,-117.4350],
  'rancho cucamonga':[34.1064,-117.5931],'chino':[34.0122,-117.6889],
  'rialto':[34.1064,-117.3703],'santa fe springs':[33.9472,-118.0854],
  'commerce':[33.9967,-118.1598],'downey':[33.9401,-118.1332],
  'long beach':[33.7701,-118.1937],'los angeles':[34.0522,-118.2437],
  'riverside':[33.9533,-117.3962],'jurupa valley':[33.9994,-117.4706],
  'moreno valley':[33.9425,-117.2297],'perris':[33.7825,-117.2286],
};

function guessCoords(record) {
  if (record.latitude && record.longitude) return [parseFloat(record.latitude), parseFloat(record.longitude)];
  const city = (record.city || record.submarket || '').toLowerCase().trim();
  return CITY_COORDS[city] || [34.0, -117.8];
}

function safeCoords(l) {
  const lat = parseFloat(l.latitude), lng = parseFloat(l.longitude);
  if (isNaN(lat) || isNaN(lng)) return null;
  return [lat, lng];
}

function distMiles(lat1, lng1, lat2, lng2) {
  const dLat = (lat2 - lat1) * 111000;
  const dLng = (lng2 - lng1) * 111000 * Math.cos(lat1 * Math.PI / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng) / 1609;
}

const TYPE_COLORS = {
  substation: '#BB88FF', project: '#4ADE80',
  zone: '#60A5FA', parcel: '#F59E0B', custom: '#94A3B8',
};

const catColor = (cat) => ({
  'BESS': '#BB88FF', 'Disposition': 'var(--amber)', 'Sale Prediction': 'var(--blue)',
  'SLB': 'var(--green)', 'Market Intel': 'var(--blue)', 'Lease Expiry': 'var(--amber)',
  'WARN': 'var(--red)', 'Custom': 'var(--ink3)',
}[cat] || 'var(--ink3)');

// ─── MINI MAP ─────────────────────────────────────────────────
function buildMiniMap(subLat, subLng, layers, height = 340) {
  if (!layers.length) return '';

  const RADIUS = 8 * 1609; // 8 miles
  const nearby = layers.filter(l => {
    const c = safeCoords(l);
    if (!c) return false;
    return distMiles(subLat, subLng, c[0], c[1]) <= 8;
  });

  const allPts = [[subLat, subLng], ...nearby.map(l => safeCoords(l)).filter(Boolean)];
  const cLat = allPts.reduce((s, p) => s + p[0], 0) / allPts.length;
  const cLng = allPts.reduce((s, p) => s + p[1], 0) / allPts.length;

  const features = nearby.map(l => {
    const c = safeCoords(l);
    if (!c) return '';
    const [lat, lng] = c;
    const col = l.color || TYPE_COLORS[l.feature_type] || '#5577A0';
    const name = (l.name || '').replace(/'/g, "\\'").slice(0, 80);
    const meta = (l.metadata && typeof l.metadata === 'object') ? l.metadata : {};

    if (l.feature_type === 'zone' && l.radius_meters)
      return `L.circle([${lat},${lng}],{radius:${l.radius_meters},color:'${col}',weight:1.5,dashArray:'6 3',fillColor:'${col}',fillOpacity:0.06}).bindTooltip('${name}').addTo(map);`;

    if (l.feature_type === 'substation') {
      const st = l.status || 'taken';
      const bg = st==='gap'?'rgba(204,51,51,0.35)':st==='opportunity'?'rgba(26,170,84,0.35)':'rgba(232,160,32,0.25)';
      return `L.marker([${lat},${lng}],{icon:L.divIcon({html:'<div style="width:16px;height:16px;transform:rotate(45deg);background:${bg};border:2.5px solid ${col};box-shadow:0 0 6px ${col}88"></div>',className:'',iconSize:[20,20],iconAnchor:[10,10]})}).bindPopup('<b style="color:#fff">${name}</b><br/><span style="color:${col};font-size:11px">${st.toUpperCase()}</span>').addTo(map);`;
    }

    if (l.feature_type === 'project') {
      const mw = parseFloat(l.size_value) || 0;
      const r = Math.max(8, Math.min(16, 8 + Math.log(Math.max(1, mw / 40)) * 2.5));
      return `L.marker([${lat},${lng}],{icon:L.divIcon({html:'<div style="width:${r*2}px;height:${r*2}px;border-radius:50%;background:${col};border:2px solid rgba(255,255,255,0.4);box-shadow:0 1px 6px rgba(0,0,0,0.5)"></div>',className:'',iconSize:[${r*2},${r*2}],iconAnchor:[${r},${r}]})}).bindPopup('<b style="color:#fff">${name}</b><br/><span style="color:${col};font-size:11px">BESS · ${mw}MW</span>').addTo(map);`;
    }

    const r = l.feature_type === 'parcel' ? 5 : 6;
    return `L.circleMarker([${lat},${lng}],{radius:${r},fillColor:'${col}',color:'${col}',weight:1.5,fillOpacity:0.8}).bindPopup('<b style="color:#fff">${name}</b>').addTo(map);`;
  }).filter(Boolean).join('\n');

  const bounds = allPts.map(p => `[${p[0]},${p[1]}]`).join(',');

  return `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"><\/script>
<style>body{margin:0;background:#0D1117}#map{width:100%;height:${height}px}
.leaflet-popup-content-wrapper{background:rgba(18,28,44,0.96)!important;border:1px solid rgba(70,100,140,0.5)!important;border-radius:7px!important}
.leaflet-popup-tip{background:rgba(18,28,44,0.96)!important}.leaflet-popup-content{margin:8px 12px!important}</style>
</head><body><div id="map"></div>
<script>
try {
  var map=L.map('map',{zoomControl:true,attributionControl:false}).setView([${cLat.toFixed(6)},${cLng.toFixed(6)}],12);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}).addTo(map);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}).addTo(map);
  L.marker([${subLat},${subLng}],{icon:L.divIcon({html:'<div style="width:14px;height:14px;background:#EE3124;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(238,49,36,0.7)"></div>',className:'',iconSize:[14,14],iconAnchor:[7,7]})}).bindPopup('<b style="color:#EE3124">Subject Property</b>').addTo(map);
  ${features}
  try { map.fitBounds([${bounds}],{padding:[30,30],maxZoom:14}); } catch(e) {}
} catch(e) { document.body.innerHTML='<div style="color:#fff;padding:16px">'+e.message+'<\/div>'; }
<\/script></body></html>`;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function CampaignTab({ record, onCampaignClick }) {
  const [campaigns, setCampaigns] = useState([]);
  const [allLayers, setAllLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCampaign, setActiveCampaign] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchAll('research_campaigns', { order: 'created_at' }).catch(() => []),
      fetchAll('campaign_layers', { order: 'created_at' }).catch(() => []),
    ]).then(([camps, lyrs]) => {
      setCampaigns(camps || []);
      setAllLayers((lyrs || []).filter(l => safeCoords(l)));
      if (camps?.length > 0) setActiveCampaign(camps[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const coords = guessCoords(record);

  const nearbyByCampaign = useMemo(() => {
    const map = {};
    campaigns.forEach(c => {
      const layers = allLayers.filter(l => l.campaign_id === c.id);
      const nearby = layers.filter(l => {
        const co = safeCoords(l);
        return co && distMiles(coords[0], coords[1], co[0], co[1]) <= 8;
      }).sort((a, b) => {
        const ca = safeCoords(a), cb = safeCoords(b);
        if (!ca || !cb) return 0;
        return distMiles(coords[0], coords[1], ca[0], ca[1]) - distMiles(coords[0], coords[1], cb[0], cb[1]);
      });
      map[c.id] = nearby;
    });
    return map;
  }, [campaigns, allLayers, coords]);

  const activeLayers = activeCampaign ? (nearbyByCampaign[activeCampaign] || []) : [];
  const activeCamp = campaigns.find(c => c.id === activeCampaign);

  const mapHtml = useMemo(() => {
    if (!activeCampaign) return '';
    const layers = allLayers.filter(l => l.campaign_id === activeCampaign);
    return buildMiniMap(coords[0], coords[1], layers, 300);
  }, [activeCampaign, allLayers, coords]);

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink4)' }}>Loading campaign data...</div>
  );

  if (campaigns.length === 0) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink4)' }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>No Research Campaigns</div>
      <div style={{ fontSize: '13px' }}>Create a campaign in the Research Campaigns section to start tracking prospects.</div>
    </div>
  );

  return (
    <div>
      {/* Campaign selector */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {campaigns.map(c => {
          const nearby = nearbyByCampaign[c.id] || [];
          const col = catColor(c.category);
          const isActive = activeCampaign === c.id;
          return (
            <button key={c.id} onClick={() => setActiveCampaign(c.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', border: `1px solid ${isActive ? col : 'var(--line)'}`, background: isActive ? `${col}14` : 'var(--card)', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: isActive ? col : 'var(--ink2)', textAlign: 'left' }}>{c.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--ink4)', textAlign: 'left' }}>{nearby.length} nearby feature{nearby.length !== 1 ? 's' : ''}</div>
              </div>
              {nearby.length > 0 && (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col, flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </div>

      {activeCamp && (
        <>
          {/* Campaign context */}
          {activeCamp.thesis && (
            <div style={{ fontSize: '13px', color: 'var(--ink3)', lineHeight: 1.65, padding: '10px 14px', background: 'var(--bg)', borderRadius: '7px', borderLeft: `3px solid ${catColor(activeCamp.category)}`, marginBottom: '16px' }}>
              {activeCamp.thesis}
            </div>
          )}

          {/* Nearby features */}
          {activeLayers.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                {Object.entries(
                  activeLayers.reduce((acc, l) => { acc[l.feature_type] = (acc[l.feature_type] || []); acc[l.feature_type].push(l); return acc; }, {})
                ).map(([type, items]) => {
                  const col = TYPE_COLORS[type] || '#5577A0';
                  const closest = items[0];
                  const cc = safeCoords(closest);
                  const dist = cc ? distMiles(coords[0], coords[1], cc[0], cc[1]).toFixed(1) : null;
                  return (
                    <div key={type} style={{ background: `${col}10`, border: `1px solid ${col}30`, borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: col, marginBottom: '4px' }}>{type}</div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', fontWeight: 700, color: 'var(--ink2)', lineHeight: 1 }}>{items.length}</div>
                      {dist && <div style={{ fontSize: '10px', color: 'var(--ink4)', marginTop: '3px' }}>nearest {dist} mi</div>}
                    </div>
                  );
                })}
              </div>

              {/* Nearest features list */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink4)', marginBottom: '8px' }}>Nearest Features</div>
                {activeLayers.slice(0, 6).map((l, i) => {
                  const c = safeCoords(l);
                  const col = l.color || TYPE_COLORS[l.feature_type] || '#5577A0';
                  const dist = c ? distMiles(coords[0], coords[1], c[0], c[1]).toFixed(1) : '?';
                  return (
                    <div key={l.id || i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid var(--line3)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: l.feature_type === 'substation' ? '2px' : '50%', background: col, flexShrink: 0, transform: l.feature_type === 'substation' ? 'rotate(45deg)' : 'none' }} />
                      <div style={{ flex: 1, fontSize: '13px', color: 'var(--ink2)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name || '—'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ink4)', fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>{dist} mi</div>
                      {l.status && (
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: `${col}18`, color: col, border: `1px solid ${col}30`, flexShrink: 0 }}>
                          {l.status}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mini map */}
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--line)', marginBottom: '16px' }}>
                {mapHtml ? (
                  <iframe srcDoc={mapHtml} style={{ width: '100%', height: '300px', border: 'none', display: 'block' }} sandbox="allow-scripts" />
                ) : (
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D1117', color: 'var(--ink4)' }}>No map data</div>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink4)', background: 'var(--bg)', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>📍</div>
              <div style={{ fontSize: '13px' }}>No campaign features within 8 miles of this location.</div>
            </div>
          )}

          {/* Link to campaign */}
          {onCampaignClick && (
            <button onClick={() => onCampaignClick(activeCamp)}
              style={{ fontSize: '12px', fontWeight: 600, padding: '8px 16px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '7px', color: 'var(--ink3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Open {activeCamp.title} →
            </button>
          )}
        </>
      )}
    </div>
  );
}
