'use client';
import { useState, useEffect, useRef } from 'react';

const MOCK_MARKERS = [
  { id: 'p1', type: 'property', lat: 34.0887, lng: -117.9712, name: 'Leegin Creative Leather', address: '14022 Nelson Ave E, Baldwin Park', sf: '186,400 SF', color: '#3B5F8A' },
  { id: 'p2', type: 'property', lat: 33.9750, lng: -117.9897, name: '4900 Workman Mill Rd', address: '4900 Workman Mill Rd, Whittier', sf: '312,000 SF', color: '#3B5F8A' },
  { id: 'p3', type: 'property', lat: 34.1008, lng: -117.4329, name: 'Teledyne Technologies', address: '16830 Chestnut St, Fontana', sf: '212,000 SF', color: '#3B5F8A' },
  { id: 'p4', type: 'property', lat: 34.0190, lng: -117.9368, name: 'Acromill LLC', address: '18421 Railroad St, City of Industry', sf: '98,500 SF', color: '#3B5F8A' },
  { id: 'p5', type: 'property', lat: 34.0232, lng: -117.9180, name: 'Snak King Corp', address: '16150 Stephens St, City of Industry', sf: '18.84 AC', color: '#3B5F8A' },
  { id: 'p6', type: 'property', lat: 34.0550, lng: -117.6500, name: 'Ontario Airport Industrial', address: '3800 Jurupa St, Ontario', sf: '490,000 SF', color: '#3B5F8A' },
  { id: 'l1', type: 'lead', lat: 34.0920, lng: -117.9680, name: 'Leegin SLB Target', address: 'Baldwin Park, SGV', sf: '186K SF', color: '#8C5A04' },
  { id: 'l2', type: 'lead', lat: 34.0210, lng: -117.9155, name: 'Snak King CapEx', address: 'City of Industry, SGV', sf: '18.84 AC', color: '#8C5A04' },
  { id: 'l3', type: 'lead', lat: 34.1020, lng: -117.4350, name: 'Teledyne Disposition', address: 'Fontana, IE West', sf: '212K SF', color: '#8C5A04' },
  { id: 'l4', type: 'lead', lat: 34.0480, lng: -117.9820, name: 'Tarhong Industry LLC', address: '780 Nogales St, City of Industry', sf: '96K SF', color: '#8C5A04' },
  { id: 'd1', type: 'deal', lat: 33.9760, lng: -117.9890, name: 'RJ Neu SLB', address: '4900 Workman Mill Rd, Whittier', sf: '$47.5M', color: '#156636' },
  { id: 'd2', type: 'deal', lat: 34.0880, lng: -117.9720, name: 'Leegin SLB', address: '14022 Nelson Ave E, Baldwin Park', sf: '$48M', color: '#156636' },
  { id: 'd3', type: 'deal', lat: 34.0200, lng: -117.9372, name: 'Tarhong Sale', address: '780 Nogales St, City of Industry', sf: '$24M', color: '#156636' },
];

const LAYER_COLORS = {
  property: '#3B5F8A',
  lead: '#8C5A04',
  deal: '#156636',
  warn: '#8B2500',
};

const TYPE_LABELS = { property: 'Properties', lead: 'Leads', deal: 'Deals', warn: 'WARN' };

export default function MapViewPage({ onNavigate, onSelectProperty, onSelectLead, properties, leads }) {
  const [layers, setLayers] = useState({ property: true, lead: true, deal: true, warn: false });
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [activeMarket, setActiveMarket] = useState('All');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const toggleLayer = (type) => setLayers(l => ({ ...l, [type]: !l[type] }));

  const allItems = MOCK_MARKERS;
  const visibleMarkers = allItems.filter(m => layers[m.type] && (activeMarket === 'All' || (m.address || '').includes(activeMarket) || (m.name || '').includes(activeMarket)));

  useEffect(() => {
    if (typeof window === 'undefined' || mapInstanceRef.current) return;
    import('leaflet').then(L => {
      L = L.default;
      if (!mapRef.current || mapInstanceRef.current) return;

      // Add Leaflet CSS
      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current, {
        center: [34.055, -117.90],
        zoom: 11,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      // Esri satellite
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        maxZoom: 19,
      }).addTo(map);

      // Add markers
      MOCK_MARKERS.forEach(m => {
        const color = LAYER_COLORS[m.type];
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;borderRadius:50%;background:${color};border:2px solid #fff;boxShadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const marker = L.marker([m.lat, m.lng], { icon });
        marker.addTo(map);
        marker.bindPopup(`
          <div style="font-family:system-ui;min-width:180px">
            <div style="font-weight:600;font-size:13px;margin-bottom:4px">${m.name}</div>
            <div style="font-size:11px;color:#6E6860;margin-bottom:4px">${m.address}</div>
            <div style="font-size:12px;font-weight:500;color:${color}">${m.sf}</div>
            <a href="#" style="font-size:11px;color:#3B5F8A;text-decoration:none;display:block;margin-top:6px">Open →</a>
          </div>
        `);
        markersRef.current.push({ marker, data: m });
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* LEFT PANEL */}
      <div style={{ width: 280, flexShrink: 0, background: 'var(--card)', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Panel Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink2)', marginBottom: 2 }}>Map View</div>
          <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic' }}>SGV · IE Industrial</div>
        </div>

        {/* Layer Toggles */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink4)', marginBottom: 10 }}>Layers</div>
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleLayer(type)}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: layers[type] ? LAYER_COLORS[type] : 'var(--line)', border: '2px solid #fff', boxShadow: '0 1px 2px rgba(0,0,0,0.2)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: layers[type] ? 'var(--ink2)' : 'var(--ink4)', fontWeight: layers[type] ? 500 : 400 }}>{label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink4)', fontFamily: "'DM Mono',monospace" }}>
                {MOCK_MARKERS.filter(m => m.type === type).length}
              </span>
            </div>
          ))}
        </div>

        {/* Filter Chips */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink4)', marginBottom: 8 }}>Market</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['All', 'SGV', 'IE West', 'IE East'].map(m => (
              <button key={m} onClick={() => setActiveMarket(m)} style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, border: '1px solid var(--line)', background: activeMarket === m ? 'var(--blue)' : 'var(--card)', color: activeMarket === m ? '#fff' : 'var(--ink3)', cursor: 'pointer', fontFamily: 'inherit' }}>{m}</button>
            ))}
          </div>
        </div>

        {/* Marker List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink4)', padding: '4px 16px 8px' }}>
            Visible ({visibleMarkers.length})
          </div>
          {visibleMarkers.map(m => (
            <div key={m.id} style={{ padding: '8px 16px', cursor: 'pointer', borderBottom: '1px solid var(--line2)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
              onClick={() => {
                if (m.type === 'property') onSelectProperty?.({ address: m.name, buildingSF: parseInt(m.sf) });
                else if (m.type === 'lead') onSelectLead?.({ name: m.name, addr: m.address });
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: LAYER_COLORS[m.type], flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink2)', lineHeight: 1.3 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 1 }}>{m.sf}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAP AREA */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
