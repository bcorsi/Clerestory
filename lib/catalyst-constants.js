// ============================================================
// CLERESTORY — CATALYST CONSTANTS
// Four completely distinct visual systems.
// Shape + color both differ per system so you never confuse them.
// ============================================================

// ── SYSTEM 1: SCORE RINGS ────────────────────────────────────
// Shape: circular SVG ring — color applied inline via JS
// Colors: heat scale red→orange→gold→lime→cyan→gray
export function getScoreRing(score) {
  if (score >= 90) return { color: '#DC2626', grade: 'A+' };
  if (score >= 80) return { color: '#EA580C', grade: 'A'  };
  if (score >= 70) return { color: '#CA8A04', grade: 'B+' };
  if (score >= 60) return { color: '#65A30D', grade: 'B'  };
  if (score >= 50) return { color: '#0891B2', grade: 'C+' };
  return               { color: '#94A3B8', grade: 'C'  };
}

// ── SYSTEM 2: PRIORITY BADGES ────────────────────────────────
// Shape: square rect (6px radius) + 3px bold left border
// Colors: deep jewel tones — violet/magenta/ocean/emerald
export const PRIORITY_COLORS = {
  Critical: {
    background:   '#EDE9FE',
    color:        '#6D28D9',
    borderLeft:   '3px solid #7C3AED',
    borderRadius: '6px',
    padding:      '3px 8px 3px 6px',
  },
  High: {
    background:   '#FCE7F3',
    color:        '#BE185D',
    borderLeft:   '3px solid #DB2777',
    borderRadius: '6px',
    padding:      '3px 8px 3px 6px',
  },
  Medium: {
    background:   '#E0F2FE',
    color:        '#0369A1',
    borderLeft:   '3px solid #0284C7',
    borderRadius: '6px',
    padding:      '3px 8px 3px 6px',
  },
  Low: {
    background:   '#D1FAE5',
    color:        '#065F46',
    borderLeft:   '3px solid #059669',
    borderRadius: '6px',
    padding:      '3px 8px 3px 6px',
  },
};

// ── SYSTEM 3: LEAD STAGE BADGES ──────────────────────────────
// Shape: outlined pill — border only, light tint, NOT solid fill
// Colors: muted earth/cool tones — completely different family from priority
export const STAGE_COLORS = {
  'New': {
    color:        '#6B7280',
    background:   'rgba(107,114,128,0.07)',
    border:       '1.5px solid rgba(107,114,128,0.35)',
    borderRadius: '999px',
    padding:      '2px 10px',
  },
  'Researching': {
    color:        '#7C3AED',
    background:   'rgba(124,58,237,0.07)',
    border:       '1.5px solid rgba(124,58,237,0.35)',
    borderRadius: '999px',
    padding:      '2px 10px',
  },
  'Decision Maker Identified': {
    color:        '#0F766E',
    background:   'rgba(15,118,110,0.07)',
    border:       '1.5px solid rgba(15,118,110,0.35)',
    borderRadius: '999px',
    padding:      '2px 10px',
  },
  'Contacted': {
    color:        '#C2410C',
    background:   'rgba(194,65,12,0.07)',
    border:       '1.5px solid rgba(194,65,12,0.35)',
    borderRadius: '999px',
    padding:      '2px 10px',
  },
  'Converted': {
    color:        '#166534',
    background:   'rgba(22,101,52,0.07)',
    border:       '1.5px solid rgba(22,101,52,0.35)',
    borderRadius: '999px',
    padding:      '2px 10px',
  },
};

// ── SYSTEM 4: CATALYST TAGS ───────────────────────────────────
// Shape: square chip (4px radius) + colored dot prefix span
// Colors: rich earth tones — sienna/dark gold/deep navy/deep plum
// dot: use as background on a 5×5px inline <span> before the tag text

const CATEGORY_STYLES = {
  owner: {
    color: '#92280F',
    bg:    '#FEF2EE',
    bdr:   'rgba(146,40,15,0.25)',
    dot:   '#C0392B',
  },
  occupier: {
    color: '#713F00',
    bg:    '#FEFCE8',
    bdr:   'rgba(113,63,0,0.25)',
    dot:   '#B45309',
  },
  asset: {
    color: '#1E3A5F',
    bg:    '#EFF6FF',
    bdr:   'rgba(30,58,95,0.2)',
    dot:   '#1D4ED8',
  },
  market: {
    color: '#3B0764',
    bg:    '#F5F3FF',
    bdr:   'rgba(59,7,100,0.2)',
    dot:   '#7C3AED',
  },
};

export const CATALYST_TAGS = [
  // Owner Signal — burnt sienna
  { tag: 'SLB Potential',               category: 'owner',    boost: 20, priority: 'HIGH'   },
  { tag: 'Distress / Special Servicer', category: 'owner',    boost: 20, priority: 'HIGH'   },
  { tag: 'Tax Delinquency',             category: 'owner',    boost: 18, priority: 'HIGH'   },
  { tag: 'NOD Filed',                   category: 'owner',    boost: 18, priority: 'HIGH'   },
  { tag: 'Probate / Estate Sale',       category: 'owner',    boost: 15, priority: 'HIGH'   },
  { tag: 'Absentee Owner',              category: 'owner',    boost: 12, priority: 'MEDIUM' },
  { tag: 'Long Hold Period',            category: 'owner',    boost: 15, priority: 'HIGH'   },
  { tag: 'UCC / Lien Activity',         category: 'owner',    boost: 14, priority: 'HIGH'   },
  { tag: 'SBA Loan Maturity',           category: 'owner',    boost: 12, priority: 'MEDIUM' },
  { tag: 'Short Hold Period',           category: 'owner',    boost: 10, priority: 'MEDIUM' },
  { tag: 'Owner-User',                  category: 'owner',    boost: 8,  priority: 'MEDIUM' },
  // Occupier Signal — dark gold
  { tag: 'WARN Notice',                 category: 'occupier', boost: 18, priority: 'HIGH'   },
  { tag: 'WARN Act Filing',             category: 'occupier', boost: 18, priority: 'HIGH'   },
  { tag: 'M&A — Acquisition',           category: 'occupier', boost: 15, priority: 'HIGH'   },
  { tag: 'M&A — Consolidation',         category: 'occupier', boost: 14, priority: 'HIGH'   },
  { tag: 'Corporate Restructuring',     category: 'occupier', boost: 14, priority: 'HIGH'   },
  { tag: 'Relocation Risk',             category: 'occupier', boost: 12, priority: 'MEDIUM' },
  { tag: 'Expansion Potential',         category: 'occupier', boost: 10, priority: 'MEDIUM' },
  { tag: 'Hiring Signal',               category: 'occupier', boost: 8,  priority: 'LOW'    },
  // Asset Signal — deep navy
  { tag: 'Lease Exp < 12 Mo',           category: 'asset',    boost: 18, priority: 'HIGH'   },
  { tag: 'Expiring Lease < 12 Mo',      category: 'asset',    boost: 18, priority: 'HIGH'   },
  { tag: 'Lease Exp 12-24 Mo',          category: 'asset',    boost: 12, priority: 'MEDIUM' },
  { tag: 'Vacancy',                     category: 'asset',    boost: 15, priority: 'HIGH'   },
  { tag: 'Functionally Challenged',     category: 'asset',    boost: 8,  priority: 'MEDIUM' },
  { tag: 'Major CapEx Permit',          category: 'asset',    boost: 10, priority: 'MEDIUM' },
  { tag: 'Under-Market Rent',           category: 'asset',    boost: 12, priority: 'MEDIUM' },
  // Market Signal — deep plum
  { tag: 'Zoning Change',               category: 'market',   boost: 12, priority: 'MEDIUM' },
  { tag: 'Opportunity Zone',            category: 'market',   boost: 8,  priority: 'LOW'    },
  { tag: 'Market Pressure',             category: 'market',   boost: 6,  priority: 'LOW'    },
  { tag: 'Infrastructure Project',      category: 'market',   boost: 8,  priority: 'LOW'    },
];

const TAG_LOOKUP = new Map(
  CATALYST_TAGS.map(t => [t.tag.toLowerCase(), { ...CATEGORY_STYLES[t.category], ...t }])
);

export function getCatalystStyle(tagName) {
  if (!tagName) return CATEGORY_STYLES.owner;
  return TAG_LOOKUP.get(tagName.toLowerCase()) || CATEGORY_STYLES.owner;
}

export function getCatalystCategory(tagName) {
  if (!tagName) return 'owner';
  const found = CATALYST_TAGS.find(t => t.tag.toLowerCase() === tagName.toLowerCase());
  return found?.category || 'owner';
}
