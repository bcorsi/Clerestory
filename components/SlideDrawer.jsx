'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * SlideDrawer — universal record detail panel
 *
 * Usage:
 *   <SlideDrawer
 *     open={!!selectedId}
 *     onClose={() => setSelectedId(null)}
 *     fullPageHref={`/properties/${selectedId}`}
 *     title="14022 Nelson Ave E"
 *     subtitle="Baldwin Park · 186,400 SF"
 *   >
 *     <PropertyDetail id={selectedId} inline />
 *   </SlideDrawer>
 */
export default function SlideDrawer({
  open,
  onClose,
  fullPageHref,
  title,
  subtitle,
  badge,
  children,
}) {
  const router = useRouter();

  // ESC to close
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape' && open) onClose();
  }, [open, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop — dimming overlay behind drawer */}
      <div
        className={`cl-drawer-backdrop ${open ? 'cl-drawer-backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`cl-drawer ${open ? 'cl-drawer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Record detail'}
      >
        {/* Drawer header */}
        <div className="cl-drawer-header">
          <div className="cl-drawer-header-left">
            <button
              className="cl-drawer-close"
              onClick={onClose}
              title="Close (Esc)"
            >
              <CloseIcon />
            </button>
            <div className="cl-drawer-title-wrap">
              {title && <span className="cl-drawer-title">{title}</span>}
              {badge && <span className={`cl-badge cl-badge-${badge.color || 'blue'}`}>{badge.label}</span>}
              {subtitle && <span className="cl-drawer-subtitle">{subtitle}</span>}
            </div>
          </div>

          <div className="cl-drawer-header-right">
            {fullPageHref && (
              <button
                className="cl-btn cl-btn-secondary cl-btn-sm"
                onClick={() => router.push(fullPageHref)}
                title="Open full page"
              >
                <PopOutIcon />
                Full Page
              </button>
            )}
          </div>
        </div>

        {/* Drawer body — scrollable */}
        <div className="cl-drawer-body">
          {open && children}
        </div>
      </div>
    </>
  );
}

// ─── ICONS ────────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function PopOutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ marginRight: 3 }}>
      <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M8 1h4v4M12 1L7 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
