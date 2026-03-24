'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchAll } from '../lib/db';

// ─── HELPERS ──────────────────────────────────────────────────
const DEFAULT_CENTER = [33.95, -117.75];

function safeCoords(l) {
  const lat = parseFloat(l.latitude);
  const lng = parseFloat(l.longitude);
  if (isNaN(lat) || isNaN(lng)) return null;
  return [lat, lng];
}

const TYPE_COLORS = {
  substation: '#BB88FF',
  project:    '#4ADE80',
  zone:       '#60A5FA',
  parcel:     '#F59E0B',
  property:   '#5577A0',
  custom:     '#94A3B8',
};

// ─── MINI MAP ─────────────────────────────────────────────────
// Builds a focused Leaflet iframe showing subject pin + campaign layers
function buildMiniMapHtml(subjectLat, subjectLng, campaignLayers, radiusMiles = 5) {
  const radiusMeters = radiusMiles * 1609;

  // Filter to layers within radius of subject
  const nearby = campaignLayers.filter(l => {
    const c = safeCoords(l);
    if (!c) return false;
    const dLat = (c[0] - subjectLat) * 111000;
    const dLng = (c[1] - subjectLng) * 111000 * Math.cos(subjectLat * Math.PI / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng) <= radiusMeters;
  });

  const allPoints = [{ lat: subjectLat, lng: subjectLng }, ...nearby.map(l => { const c = safeCoords(l); return c ? { lat: c[0], lng: c[1] } : null; }).filter(Boolean)];
  const centerLat = allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length;
  const centerLng = allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length;

  const features = nearby.map(l => {
    const c = safeCoords(l);
    if (!c) return '';
    const [lat, lng] = c;
    const col = l.color || TYPE_COLORS[l.feature_type] || '#5577A0';
    const name = (l.name || '').replace(/'/g, "\\'").slice(0, 80);
    const mw = parseFloat(l.size_value) || 0;

    if (l.feature_type === 'zone' && l.radius_meters) {
      return `L.circle([${lat},${lng}],{radius:${l.radius_meters},color:'${col}',weight:1.5,dashArray:'6 3',fillColor:'${col}',fillOpacity:0.06}).bindTooltip('${name}',{sticky:true}).addTo(map);`;
    }
    if (l.feature_type === 'substation') {
      const st = l.status || 'taken';
      const bg = st==='gap'?'rgba(204,51,51,0.35)':st==='opportunity'?'rgba(26,170,84,0.35)':'rgba(232,160,32,0.25)';
      return `L.marker([${lat},${lng}],{icon:L.divIcon({html:'<div style="width:16px;height:16px;transform:rotate(45deg);background:${bg};border:2.5px solid ${col};box-shadow:0 0 6px ${col}88"></div>',className:'',iconSize:[20,20],iconAnchor:[10,10]})}).bindPopup('<b style="color:#fff">${name}</b><br/><span style="color:${col};font-size:11px">${st.toUpperCase()} · SUBSTATION</span>').addTo(map);`;
    }
    if (l.feature_type === 'project') {
      const r = Math.max(8, Math.min(18, 8 + Math.log(Math.max(1, mw / 40)) * 3));
      return `L.marker([${lat},${lng}],{icon:L.divIcon({html:'<div style="width:${r*2}px;height:${r*2}px;border-radius:50%;background:${col};border:2px solid rgba(255,255,255,0.4);box-shadow:0 1px 6px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center"><span style="font-size:7px;font-weight:700;color:#000">${mw>=50?mw:''}${mw>=50?'':''}</span></div>',className:'',iconSize:[${r*2},${r*2}],iconAnchor:[${r},${r}]})}).bindPopup('<b style="color:#fff">${name}</b><br/><span style="color:${col};font-size:11px">BESS PROJECT · ${mw}MW</span>').addTo(map);`;
    }
    const radius = l.feature_type === 'parcel' ? 5 : 6;
    return `L.circleMarker([${lat},${lng}],{radius:${radius},fillColor:'${col}',color:'${col}',weight:1.5,fillOpacity:0.8}).bindPopup('<b style="color:#fff">${name}</b>').addTo(map);`;
  }).filter(Boolean).join('\n');

  return `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"><\/script>
<style>body{margin:0;background:#0D1117}#map{width:100%;height:100vh}
.leaflet-popup-content-wrapper{background:rgba(18,28,44,0.96)!important;border:1px solid rgba(70,100,140,0.5)!important;border-radius:7px!important}
.leaflet-popup-tip{background:rgba(18,28,44,0.96)!important}.leaflet-popup-content{margin:8px 12px!important}
</style>
</head><body><div id="map"></div>
<script>
try {
  var map=L.map('map',{zoomControl:true,attributionControl:false}).setView([${centerLat.toFixed(6)},${centerLng.toFixed(6)}],12);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}).addTo(map);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}).addTo(map);
  // Subject property marker
  L.marker([${subjectLat},${subjectLng}],{icon:L.divIcon({html:'<div style="width:14px;height:14px;background:#EE3124;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(238,49,36,0.6)"></div>',className:'',iconSize:[14,14],iconAnchor:[7,7]})}).bindPopup('<b style="color:#EE3124">Subject Property</b>').addTo(map);
  // Campaign layers
  ${features}
  // Fit bounds
  var allCoords = [[${subjectLat},${subjectLng}]${nearby.map(l => { const c = safeCoords(l); return c ? `,[${c[0]},${c[1]}]` : ''; }).filter(Boolean).join('')}];
  if(allCoords.length > 1) { try { map.fitBounds(allCoords, {padding:[30,30], maxZoom:14}); } catch(e) {} }
} catch(e) { document.body.innerHTML='<div style="color:#fff;padding:16px">'+e.message+'</div>'; }
<\/script></body></html>`;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function CampaignLayersPanel({ record, recordType = 'properties' }) {
  const [campaigns, setCampaigns] = useState([]);
  const [allLayers, setAllLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState(null); // null = show all

  // Guess coords from city if no lat/lng stored on record
  const CITY_COORDS = {
    'city of industry': [34.0198,-117.9587], 'irwindale': [34.107,-117.9354],
    'el monte': [34.0686,-118.0276], 'ontario': [34.0633,-117.6509],
    'fontana': [34.0922,-117.435], 'rancho cucamonga': [34.1064,-117.5931],
    'chino': [34.0122,-117.6889], 'rialto': [34.1064,-117.3703],
    'colton': [34.0739,-117.3136], 'san bernardino': [34.1083,-117.2898],
    'riverside': [33.9533,-117.3962], 'moreno valley': [33.9425,-117.2297],
    'jurupa valley': [33.9994,-117.4706], 'perris': [33.7825,-117.2286],
    'commerce': [33.9967,-118.1598], 'vernon': [33.9925,-118.2301],
    'carson': [33.8314,-118.262], 'santa fe springs': [33.9472,-118.0854],
    'downey': [33.9401,-118.1332], 'compton': [33.8958,-118.2201],
    'gardena': [33.8883,-118.309], 'long beach': [33.7701,-118.1937],
  };
  const guessCoords = (rec) => {
    if (rec.latitude && rec.longitude) return [parseFloat(rec.latitude), parseFloat(rec.longitude)];
    const city = (rec.city || rec.submarket || '').toLowerCase().trim();
    return CITY_COORDS[city] || DEFAULT_CENTER;
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAll('research_campaigns', { order: 'created_at' }).catch(() => []),
      fetchAll('campaign_layers', { order: 'created_at' }).catch(() => []),
    ]).then(([camps, lyrs]) => {
      const validLayers = (lyrs || []).filter(l => safeCoords(l));
      setCampaigns(camps || []);
      setAllLayers(validLayers);
      if (camps?.length > 0) setActiveCampaign(camps[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const subjectCoords = guessCoords(record);

  // Filter layers to active campaign and nearby
  const displayLayers = useMemo(() => {
    const RADIUS_MILES = 8;
    const radiusMeters = RADIUS_MILES * 1609;
    return allLayers.filter(l => {
      if (activeCampaign && l.campaign_id !== activeCampaign) return false;
      const c = safeCoords(l);
      if (!c) return false;
      const dLat = (c[0] - subjectCoords[0]) * 111000;
      const dLng = (c[1] - subjectCoords[1]) * 111000 * Math.cos(subjectCoords[0] * Math.PI / 180);
      return Math.sqrt(dLat * dLat + dLng * dLng) <= radiusMeters;
    });
  }, [allLayers, activeCampaign, subjectCoords]);

  const nearbyByType = useMemo(() => {
    const byType = {};
    displayLayers.forEach(l => {
      const t = l.feature_type;
      if (!byType[t]) byType[t] = [];
      byType[t].push(l);
    });
    return byType;
  }, [displayLayers]);

  const mapHtml = useMemo(() => {
    if (!expanded) return '';
    return buildMiniMapHtml(subjectCoords[0], subjectCoords[1], displayLayers, 8);
  }, [expanded, subjectCoords, displayLayers]);

  const totalNearby = displayLayers.length;
  const activeCampaignRecord = campaigns.find(c => c.id === activeCampaign);

  if (loading) return null; // Don't show anything while loading
  if (campaigns.length === 0) return null; // No campaigns, no widget

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: 'var(--bg)', borderBottom: expanded ? '1px solid var(--line)' : 'none', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: totalNearby > 0 ? '#BB88FF' : 'var(--ink3)', letterSpacing: '0.04em' }}>
            🗺 Campaign Intel
          </span>
          {totalNearby > 0 && (
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {Object.entries(nearbyByType).map(([type, items]) => (
                <span key={type} style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '3px', background: `${TYPE_COLORS[type] || '#5577A0'}18`, color: TYPE_COLORS[type] || '#5577A0', border: `1px solid ${TYPE_COLORS[type] || '#5577A0'}30` }}>
                  {items.length} {type}{items.length > 1 ? 's' : ''}
                </span>
              ))}
            </div>
          )}
          {totalNearby === 0 && (
            <span style={{ fontSize: '11px', color: 'var(--ink4)' }}>No campaign features within 8 mi</span>
          )}
        </div>
        <span style={{ fontSize: '11px', color: 'var(--ink4)' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '12px 16px' }}>
          {/* Campaign selector */}
          {campaigns.length > 1 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button onClick={() => setActiveCampaign(null)}
                style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '5px', border: '1px solid var(--line)', background: !activeCampaign ? 'var(--accent)' : 'transparent', color: !activeCampaign ? '#fff' : 'var(--ink4)', cursor: 'pointer', fontWeight: 600 }}>
                All
              </button>
              {campaigns.map(c => (
                <button key={c.id} onClick={() => setActiveCampaign(c.id)}
                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '5px', border: '1px solid var(--line)', background: activeCampaign === c.id ? 'var(--accent)' : 'transparent', color: activeCampaign === c.id ? '#fff' : 'var(--ink4)', cursor: 'pointer', fontWeight: 500 }}>
                  {c.title}
                </button>
              ))}
            </div>
          )}

          {/* Context note */}
          {activeCampaignRecord?.thesis && (
            <div style={{ fontSize: '12px', color: 'var(--ink3)', lineHeight: 1.6, marginBottom: '12px', padding: '8px 12px', background: 'var(--bg)', borderRadius: '6px', borderLeft: '3px solid #BB88FF' }}>
              {activeCampaignRecord.thesis}
            </div>
          )}

          {/* Feature summary */}
          {totalNearby > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', marginBottom: '12px' }}>
              {Object.entries(nearbyByType).map(([type, items]) => {
                const col = TYPE_COLORS[type] || '#5577A0';
                const closest = items.sort((a, b) => {
                  const ca = safeCoords(a), cb = safeCoords(b);
                  if (!ca || !cb) return 0;
                  const da = Math.sqrt(Math.pow(ca[0] - subjectCoords[0], 2) + Math.pow(ca[1] - subjectCoords[1], 2));
                  const db = Math.sqrt(Math.pow(cb[0] - subjectCoords[0], 2) + Math.pow(cb[1] - subjectCoords[1], 2));
                  return da - db;
                })[0];
                const closestCoords = safeCoords(closest);
                const distMiles = closestCoords ? (Math.sqrt(
                  Math.pow((closestCoords[0] - subjectCoords[0]) * 111000, 2) +
                  Math.pow((closestCoords[1] - subjectCoords[1]) * 111000 * Math.cos(subjectCoords[0] * Math.PI / 180), 2)
                ) / 1609).toFixed(1) : null;

                return (
                  <div key={type} style={{ background: `${col}10`, border: `1px solid ${col}30`, borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: col, marginBottom: '4px' }}>{type}</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', fontWeight: 700, color: 'var(--ink2)', lineHeight: 1 }}>{items.length}</div>
                    {distMiles && <div style={{ fontSize: '10px', color: 'var(--ink4)', marginTop: '3px' }}>nearest: {distMiles} mi</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Closest features list */}
          {totalNearby > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink4)', marginBottom: '6px' }}>Nearest Features</div>
              {displayLayers.slice(0, 5).map((l, i) => {
                const c = safeCoords(l);
                const col = l.color || TYPE_COLORS[l.feature_type] || '#5577A0';
                const distMiles = c ? (Math.sqrt(
                  Math.pow((c[0] - subjectCoords[0]) * 111000, 2) +
                  Math.pow((c[1] - subjectCoords[1]) * 111000 * Math.cos(subjectCoords[0] * Math.PI / 180), 2)
                ) / 1609).toFixed(1) : '?';
                return (
                  <div key={l.id || i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: '1px solid var(--line3)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: l.feature_type === 'substation' ? '2px' : '50%', background: col, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: '12px', color: 'var(--ink2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name || '—'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink4)', fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>{distMiles} mi</div>
                    {l.status && <div style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: `${col}20`, color: col, border: `1px solid ${col}30`, flexShrink: 0 }}>{l.status}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Mini map */}
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--line)', height: '320px', background: '#0D1117' }}>
            {mapHtml ? (
              <iframe srcDoc={mapHtml} style={{ width: '100%', height: '100%', border: 'none' }} sandbox="allow-scripts" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink4)', fontSize: '13px' }}>
                {totalNearby === 0 ? 'No nearby campaign features to map.' : 'Loading map...'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
