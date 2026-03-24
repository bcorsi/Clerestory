'use client';

import { useState, useMemo, useEffect } from 'react';
import { fetchParcelGeometry } from '../lib/db';

// Bright cyan — clearly visible on satellite imagery
const PARCEL_COLOR = '#00C2FF';
const PARCEL_WEIGHT = 3;
const PARCEL_FILL_OPACITY = 0.2;

const CITY_COORDS = {
  'city of industry': [34.0198,-117.9587], 'vernon': [33.9925,-118.2301],
  'el monte': [34.0686,-118.0276], 'south el monte': [34.0519,-118.0465],
  'irwindale': [34.1070,-117.9354], 'azusa': [34.1336,-117.9076],
  'baldwin park': [34.0853,-117.9609], 'ontario': [34.0633,-117.6509],
  'fontana': [34.0922,-117.4350], 'rancho cucamonga': [34.1064,-117.5931],
  'chino': [34.0122,-117.6889], 'rialto': [34.1064,-117.3703],
  'pomona': [34.0551,-117.7500], 'west covina': [34.0686,-117.9390],
  'santa fe springs': [33.9472,-118.0854], 'commerce': [33.9967,-118.1598],
  'downey': [33.9401,-118.1332], 'carson': [33.8314,-118.2620],
  'compton': [33.8958,-118.2201], 'torrance': [33.8358,-118.3406],
  'anaheim': [33.8366,-117.9143], 'irvine': [33.6846,-117.8265],
  'los angeles': [34.0522,-118.2437], 'riverside': [33.9533,-117.3962],
  'san bernardino': [34.1083,-117.2898], 'colton': [34.0739,-117.3136],
  'upland': [34.0975,-117.6484], 'montclair': [34.0775,-117.6898],
  'la puente': [34.0200,-117.9495], 'whittier': [33.9792,-118.0328],
  'long beach': [33.7701,-118.1937], 'hacienda heights': [33.9930,-117.9684],
  'jurupa valley': [33.9994,-117.4706], 'moreno valley': [33.9425,-117.2297],
};

export default function AerialThumbnail({
  propertyId, address, city, apns,
  parcelGeometry: initialGeometry,
  latitude: initLat, longitude: initLng,
  height = 280, zoom = 17
}) {
  if (!address) return null;

  const [parcelGeometry, setParcelGeometry] = useState(initialGeometry || null);
  const [latitude, setLatitude] = useState(initLat || null);
  const [longitude, setLongitude] = useState(initLng || null);
  const [fetching, setFetching] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // If no stored geometry, try to fetch it once automatically
  useEffect(() => {
    if (parcelGeometry || fetchAttempted || !propertyId) return;
    setFetchAttempted(true);
    setFetching(true);
    const apnList = (apns || []).map(a => typeof a === 'string' ? a : a.apn).filter(Boolean);
    fetchParcelGeometry(propertyId, apnList, address, city)
      .then(geo => {
        if (geo) setParcelGeometry(geo);
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [propertyId]);

  const apnList = (apns || []).map(a => typeof a === 'string' ? a : a.apn).filter(Boolean);

  const c = (city || '').toLowerCase().trim();
  const fallbackCenter = CITY_COORDS[c] || [34.0, -117.8];
  const center = (latitude && longitude)
    ? [parseFloat(latitude), parseFloat(longitude)]
    : fallbackCenter;

  const hasGeo = parcelGeometry?.features?.length > 0;

  // Safely serialize geometry for inline JS — avoid quote/escape issues
  const geoDataAttr = hasGeo ? JSON.stringify(parcelGeometry) : null;

  const mapHtml = useMemo(() => {
    const safeAddr = (address || '').replace(/"/g, '&quot;');
    const parcelStyle = `{color:'${PARCEL_COLOR}',weight:${PARCEL_WEIGHT},fillColor:'${PARCEL_COLOR}',fillOpacity:${PARCEL_FILL_OPACITY},opacity:1}`;

    // Pass geo data via a hidden div to avoid escaping nightmares
    const geoDiv = hasGeo
      ? `<div id="geodata" style="display:none">${geoDataAttr.replace(/</g, '\\u003c')}</div>`
      : '';

    return `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"><\/script>
<style>
body{margin:0}
#map{width:100%;height:${height}px}
.lbl{position:absolute;bottom:8px;left:8px;z-index:1000;background:rgba(18,24,36,0.85);border-radius:5px;padding:4px 10px;font-family:'Instrument Sans',sans-serif;font-size:11px;color:rgba(240,235,225,0.9);backdrop-filter:blur(4px);pointer-events:none;max-width:80%}
</style>
</head><body>
${geoDiv}
<div id="map"></div>
<div class="lbl" id="lbl">${hasGeo ? safeAddr : 'Loading...'}</div>
<script>
try {
  var map = L.map('map', {zoomControl:false, attributionControl:false}).setView([${center[0]},${center[1]}], ${zoom});
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {maxZoom:19}).addTo(map);

  ${hasGeo ? `
  // Render stored geometry instantly — no network request needed
  (function() {
    try {
      var raw = document.getElementById('geodata').textContent;
      var data = JSON.parse(raw);
      var group = L.geoJSON(data, {style: ${parcelStyle}}).addTo(map);
      map.fitBounds(group.getBounds(), {padding:[20,20], maxZoom:18});
      var n = data.features.length;
      document.getElementById('lbl').textContent = n + ' parcel' + (n>1?'s':'') + ' \u00B7 ${safeAddr}';
    } catch(e) {
      document.getElementById('lbl').textContent = '${safeAddr}';
    }
  })();
  ` : `
  // No stored geometry — just show the satellite at city center
  document.getElementById('lbl').textContent = '${safeAddr}';
  `}
} catch(e) {
  document.body.innerHTML = '<div style="color:#fff;padding:12px;font-size:12px">Map error: ' + e.message + '<\/div>';
}
<\/script></body></html>`;
  }, [address, city, parcelGeometry, latitude, longitude, height, zoom]);

  const handleFetchParcel = async () => {
    if (fetching || !propertyId) return;
    setFetching(true);
    try {
      const geo = await fetchParcelGeometry(propertyId, apnList, address, city);
      if (geo) setParcelGeometry(geo);
    } catch (e) { console.error(e); }
    finally { setFetching(false); }
  };

  return (
    <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--line)', position: 'relative' }}>
      <iframe
        srcDoc={mapHtml}
        style={{ width: '100%', height: `${height}px`, border: 'none', display: 'block' }}
        sandbox="allow-scripts"
      />
      {/* Show fetch button only if no geometry and not currently fetching */}
      {!hasGeo && !fetching && propertyId && (
        <button
          onClick={handleFetchParcel}
          style={{
            position: 'absolute', bottom: '8px', right: '8px',
            fontSize: '11px', fontWeight: 600, padding: '4px 10px',
            background: 'rgba(18,24,36,0.85)', border: '1px solid rgba(0,194,255,0.4)',
            borderRadius: '5px', color: '#00C2FF', cursor: 'pointer',
            backdropFilter: 'blur(4px)', zIndex: 10,
          }}>
          Load Parcel
        </button>
      )}
      {fetching && (
        <div style={{
          position: 'absolute', bottom: '8px', right: '8px',
          fontSize: '11px', padding: '4px 10px',
          background: 'rgba(18,24,36,0.85)', borderRadius: '5px',
          color: 'rgba(240,235,225,0.6)', zIndex: 10,
        }}>
          Loading parcel...
        </div>
      )}
    </div>
  );
}
