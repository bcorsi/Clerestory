'use client';
import { useState } from 'react';

function ClerestoryIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="3" y="20" width="30" height="13" rx="1" fill="#4E6E96" opacity="0.6"/>
      <rect x="3" y="14" width="6" height="5" rx="0.5" fill="#89A8C6"/>
      <rect x="11" y="14" width="6" height="5" rx="0.5" fill="#89A8C6" opacity="0.8"/>
      <rect x="19" y="14" width="6" height="5" rx="0.5" fill="#89A8C6" opacity="0.6"/>
      <rect x="27" y="14" width="6" height="5" rx="0.5" fill="#89A8C6" opacity="0.4"/>
      <path d="M1 14 L18 4 L35 14" stroke="#89A8C6" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <line x1="6" y1="19" x2="6" y2="33" stroke="rgba(137,168,198,0.3)" strokeWidth="1"/>
      <line x1="14" y1="19" x2="14" y2="33" stroke="rgba(137,168,198,0.25)" strokeWidth="1"/>
      <line x1="22" y1="19" x2="22" y2="33" stroke="rgba(137,168,198,0.2)" strokeWidth="1"/>
    </svg>
  );
}

const NAV = [
  { section: 'Portfolio' },
  { page: 'dashboard', label: 'Command Center', icon: '⌘' },
  { page: 'properties', label: 'Properties', icon: '▣', count: 'properties' },
  { page: 'map', label: 'Map View', icon: '◎' },
  { section: 'Deal Flow' },
  { page: 'leads', label: 'Lead Gen', icon: '⚡', count: 'leads' },
  { page: 'deals', label: 'Deal Pipeline', icon: '◈', count: 'deals' },
  { page: 'warn', label: 'WARN Intel', icon: '◉', count: 'warn', hot: true },
  { section: 'Market Intel' },
  { page: 'lease-comps', label: 'Lease Comps', icon: '≡', count: 'leaseComps' },
  { page: 'sale-comps', label: 'Sale Comps', icon: '◇', count: 'saleComps' },
  { page: 'comp-analytics', label: 'Comp Analytics', icon: '▲' },
  { page: 'news', label: 'News Feed', icon: '◫' },
  { section: 'Relationships' },
  { page: 'accounts', label: 'Accounts', icon: '◫', count: 'accounts' },
  { page: 'contacts', label: 'Contacts', icon: '○', count: 'contacts' },
  { page: 'owner-search', label: 'Owner Search', icon: '◎' },
  { section: 'Operations' },
  { page: 'tasks', label: 'Tasks', icon: '□', count: 'tasks' },
  { page: 'campaigns', label: 'Campaigns', icon: '◑' },
];

export default function Sidebar({ currentPage, onNavigate, counts = {}, onCollapseChange }) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapseChange?.(next);
  };

  const bg = 'linear-gradient(180deg, #1F2840 0%, #1A2130 55%, #15192A 100%)';
  const w = collapsed ? 64 : 242;

  return (
    <div style={{ width: w, minHeight: '100vh', background: bg, position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, transition: 'width 0.25s ease', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Top accent line */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #6480A2, #89A8C6, transparent)', flexShrink: 0 }} />

      {/* Logo zone */}
      <div style={{ height: 68, display: 'flex', alignItems: 'center', padding: '0 14px', borderBottom: '1px solid rgba(200,220,255,0.13)', flexShrink: 0, gap: 12, overflow: 'hidden' }}>
        <div style={{ flexShrink: 0 }}><ClerestoryIcon /></div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'rgba(245,240,232,0.96)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', fontFamily: "'Instrument Sans', sans-serif" }}>Clerestory</div>
            <div style={{ fontSize: 12, color: 'rgba(100,128,162,0.72)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', whiteSpace: 'nowrap', marginTop: 1 }}>See the deal before it&apos;s a deal.</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
        {NAV.map((item, i) => {
          if (item.section) {
            if (collapsed) return null;
            return (
              <div key={i} style={{ fontSize: 11, fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(240,235,225,0.38)', padding: '14px 18px 4px', letterSpacing: '0.03em' }}>
                {item.section}
              </div>
            );
          }
          const isActive = currentPage === item.page;
          const count = item.count ? (counts[item.count] || 0) : null;
          const isHot = item.hot && count > 0;
          return (
            <div
              key={item.page}
              onClick={() => onNavigate(item.page)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 0' : '8px 18px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                cursor: 'pointer',
                background: isActive ? 'rgba(100,128,162,0.16)' : 'transparent',
                borderLeft: isActive ? '2px solid #89A8C6' : '2px solid transparent',
                marginBottom: 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(100,128,162,0.08)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 15, opacity: isActive ? 1 : 0.55, color: '#89A8C6', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && (
                <>
                  <span style={{ fontSize: 13.5, fontFamily: "'Instrument Sans', sans-serif", color: isActive ? 'rgba(245,240,232,0.96)' : 'rgba(240,235,225,0.62)', flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
                  {count != null && count > 0 && (
                    <span style={{
                      fontSize: 11, fontFamily: "'DM Mono', monospace",
                      background: isHot ? 'rgba(220,100,88,0.20)' : 'rgba(255,255,255,0.07)',
                      color: isHot ? '#F08880' : 'rgba(200,215,235,0.38)',
                      padding: '1px 6px', borderRadius: 10, flexShrink: 0,
                    }}>{count}</span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Collapse toggle */}
      <div
        onClick={toggleCollapse}
        style={{ position: 'absolute', right: -11, top: '50%', transform: 'translateY(-50%)', width: 22, height: 44, background: '#FFFFFF', borderRadius: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11, color: '#524D46', zIndex: 101 }}
      >
        {collapsed ? '›' : '‹'}
      </div>
    </div>
  );
}
