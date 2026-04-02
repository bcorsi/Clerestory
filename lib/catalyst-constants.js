// ══════════════════════════════════════════════════════════════════
// CLERESTORY — lib/catalyst-constants.js
// 30-tag taxonomy — Field Guide v4 + Location/Demographics additions
// April 2, 2026
// ══════════════════════════════════════════════════════════════════

// ── CATEGORY STYLES ──────────────────────────────────────────────
export const CATEGORY_STYLES = {
  owner:    { bg:'rgba(184,55,20,0.08)',  bdr:'rgba(184,55,20,0.28)',  color:'#B83714', label:'Owner Signal' },
  occupier: { bg:'rgba(140,90,4,0.08)',   bdr:'rgba(140,90,4,0.28)',   color:'#8C5A04', label:'Occupier Signal' },
  asset:    { bg:'rgba(78,110,150,0.08)', bdr:'rgba(78,110,150,0.28)', color:'#4E6E96', label:'Asset Signal' },
  market:   { bg:'rgba(88,56,160,0.08)', bdr:'rgba(88,56,160,0.28)',  color:'#5838A0', label:'Market Signal' },
  location: { bg:'rgba(21,102,54,0.08)', bdr:'rgba(21,102,54,0.28)',  color:'#156636', label:'Location Signal' },
};

// ── SCORE RING GRADES ─────────────────────────────────────────────
export function getScoreRing(score) {
  if (score >= 85) return { grade:'A+', color:'#156636' };
  if (score >= 70) return { grade:'A',  color:'#156636' };
  if (score >= 55) return { grade:'B+', color:'#4E6E96' };
  if (score >= 40) return { grade:'B',  color:'#8C5A04' };
  return                  { grade:'C',  color:'#B83714' };
}

// ── CATALYST STYLE LOOKUP ─────────────────────────────────────────
export function getCatalystStyle(tagName) {
  const tag = CATALYST_TAGS.find(t => t.tag === tagName);
  const cat = tag?.category || 'asset';
  return CATEGORY_STYLES[cat] || CATEGORY_STYLES.asset;
}

// ── 30 CATALYST TAGS ──────────────────────────────────────────────
// Original 28 from Field Guide v4 + 2 new Location tags
export const CATALYST_TAGS = [

  // ── OWNER SIGNALS (rust) ─────────────────────────────────────
  {
    tag: 'Long Hold',
    category: 'owner',
    priority: 'HIGH',
    boost: 25,
    urgency: 'medium',
    description: 'Owner held 7+ years — approaching prime sell window',
  },
  {
    tag: 'Absentee Owner',
    category: 'owner',
    priority: 'HIGH',
    boost: 18,
    urgency: 'medium',
    description: 'Owner address differs from property — less emotional attachment',
  },
  {
    tag: 'Family Trust',
    category: 'owner',
    priority: 'HIGH',
    boost: 20,
    urgency: 'medium',
    description: 'Trust ownership often signals estate/succession planning',
  },
  {
    tag: 'Individual Owner',
    category: 'owner',
    priority: 'MED',
    boost: 15,
    urgency: 'low',
    description: 'Single individual owner — more emotionally tied, but motivated by personal triggers',
  },
  {
    tag: 'Succession Signal',
    category: 'owner',
    priority: 'HIGH',
    boost: 22,
    urgency: 'high',
    description: 'Owner 55+ or business transition underway — estate/succession window',
  },
  {
    tag: 'No Refi in 5+ Years',
    category: 'owner',
    priority: 'MED',
    boost: 12,
    urgency: 'low',
    description: 'No refinance signals no debt — cleaner disposition path',
  },
  {
    tag: 'SLB Potential',
    category: 'owner',
    priority: 'HIGH',
    boost: 20,
    urgency: 'medium',
    description: 'Owner-user who could monetize real estate and stay as tenant',
  },
  {
    tag: 'M&A / Corporate Restructuring',
    category: 'owner',
    priority: 'CRIT',
    boost: 28,
    urgency: 'high',
    description: 'Parent company acquisition, divestiture, or restructuring — real estate rationalization likely',
  },
  {
    tag: 'Repeat Seller',
    category: 'owner',
    priority: 'MED',
    boost: 15,
    urgency: 'low',
    description: 'Owner has sold industrial property before — knows the process, less friction',
  },

  // ── OCCUPIER SIGNALS (amber) ─────────────────────────────────
  {
    tag: 'WARN Filing',
    category: 'occupier',
    priority: 'CRIT',
    boost: 30,
    urgency: 'high',
    description: 'Permanent layoff/closure filed — space coming vacant within 60-90 days',
  },
  {
    tag: 'Bankruptcy Filing',
    category: 'occupier',
    priority: 'CRIT',
    boost: 28,
    urgency: 'high',
    description: 'Chapter 11/7 filing — lease rejection possible, space at risk',
  },
  {
    tag: 'Distress Signal',
    category: 'occupier',
    priority: 'HIGH',
    boost: 22,
    urgency: 'high',
    description: 'Pre-WARN stress — headcount cuts, credit issues, closure rumors',
  },
  {
    tag: 'Lease Expiry < 12 Mo',
    category: 'occupier',
    priority: 'CRIT',
    boost: 30,
    urgency: 'high',
    description: 'Lease expiring within 12 months — owner decision window open now',
  },
  {
    tag: 'Expiring Lease < 24 Mo',
    category: 'occupier',
    priority: 'HIGH',
    boost: 20,
    urgency: 'medium',
    description: 'Lease expiring 12-24 months out — ideal outreach window',
  },
  {
    tag: 'Headcount Shrinking',
    category: 'occupier',
    priority: 'HIGH',
    boost: 18,
    urgency: 'medium',
    description: 'Tenant reducing staff — space surplus signal',
  },
  {
    tag: 'Tenant Renewal Risk',
    category: 'occupier',
    priority: 'HIGH',
    boost: 18,
    urgency: 'medium',
    description: 'Tenant has not committed to renewal — vacancy risk for owner',
  },
  {
    tag: 'Below Market Rent',
    category: 'occupier',
    priority: 'MED',
    boost: 12,
    urgency: 'low',
    description: 'In-place rent significantly below market — owner motivated to re-set',
  },

  // ── ASSET SIGNALS (blue) ─────────────────────────────────────
  {
    tag: 'Functional Obsolescence',
    category: 'asset',
    priority: 'MED',
    boost: 12,
    urgency: 'low',
    description: 'Low clear height, no dock-high, or outdated systems — repositioning opportunity',
  },
  {
    tag: 'Deferred Capex',
    category: 'asset',
    priority: 'MED',
    boost: 10,
    urgency: 'low',
    description: 'Visible deferred maintenance — owner may prefer to sell rather than reinvest',
  },
  {
    tag: 'Excess Land',
    category: 'asset',
    priority: 'HIGH',
    boost: 18,
    urgency: 'medium',
    description: 'Land coverage <35% — expansion or redevelopment premium',
  },
  {
    tag: 'Capex Permit Pulled',
    category: 'asset',
    priority: 'MED',
    boost: 12,
    urgency: 'medium',
    description: 'Recent permit signals either major reinvestment OR pre-sale improvement',
  },
  {
    tag: 'BESS / Energy Storage',
    category: 'asset',
    priority: 'HIGH',
    boost: 20,
    urgency: 'medium',
    description: 'Site identified for battery energy storage development — land premium',
  },
  {
    tag: 'Infrastructure',
    category: 'asset',
    priority: 'MED',
    boost: 14,
    urgency: 'low',
    description: 'Proximity to substation, port, rail, or highway interchange — premium use case',
  },

  // ── MARKET SIGNALS (purple) ──────────────────────────────────
  {
    tag: 'Sub-5% Vacancy Market',
    category: 'market',
    priority: 'HIGH',
    boost: 16,
    urgency: 'medium',
    description: 'Submarket vacancy ≤5% — seller\'s market, optimal exit pricing',
  },
  {
    tag: 'Rising Rents',
    category: 'market',
    priority: 'MED',
    boost: 10,
    urgency: 'low',
    description: 'Submarket rents trending up — mark-to-market opportunity on renewal',
  },
  {
    tag: 'Institutional Buyer Interest',
    category: 'market',
    priority: 'MED',
    boost: 12,
    urgency: 'low',
    description: 'REIT or fund activity in submarket — comp-setting buyers present',
  },
  {
    tag: 'Competing Listing Nearby',
    category: 'market',
    priority: 'MED',
    boost: 10,
    urgency: 'medium',
    description: 'Similar property listed nearby — comp evidence + time pressure',
  },

  // ── LOCATION SIGNALS (green) — NEW ───────────────────────────
  {
    tag: 'SLB Corridor',
    category: 'location',
    priority: 'HIGH',
    boost: 18,
    urgency: 'medium',
    description: 'Submarket with high SLB activity: Chino, COI, Vernon, Rancho, Anaheim, Kearny Mesa. Owners frequently monetize real estate while staying as tenants.',
  },
  {
    tag: 'Succession Market',
    category: 'location',
    priority: 'HIGH',
    boost: 16,
    urgency: 'medium',
    description: 'Submarket with high owner-user concentration and aging ownership base. Owners 55+ running businesses in buildings bought 10-20 years ago. Estate planning window.',
  },
  {
    tag: 'Owner Proximity',
    category: 'location',
    priority: 'HIGH',
    boost: 18,
    urgency: 'medium',
    description: 'Owner lives within 10 miles of property. High personal attachment + wealth concentration in the building. Chino Hills/Diamond Bar owners with Chino buildings = prime example.',
  },
];

// ── HELPER: Get tags by category ─────────────────────────────────
export function getTagsByCategory(category) {
  return CATALYST_TAGS.filter(t => t.category === category);
}

// ── HELPER: Format functions ──────────────────────────────────────
export function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString();
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

// ── SUBMARKET CONSTANTS (from constants.js — mirrors DB) ──────────
export const SLB_CORRIDORS = [
  'City of Industry', 'Vernon', 'Commerce / Vernon',
  'Chino / Chino Hills', 'Rancho Cucamonga',
  'Anaheim / Fullerton', 'Orange / Tustin', 'Kearny Mesa',
  'San Fernando Valley', 'El Monte / South El Monte',
  'Oxnard / Port Hueneme', 'Camarillo', 'Corona',
];

export const SUCCESSION_MARKETS = [
  'City of Industry', 'Vernon', 'Commerce / Vernon',
  'El Monte / South El Monte', 'Irwindale / Duarte',
  'Chino / Chino Hills', 'Redlands / Loma Linda',
  'San Fernando Valley', 'Gardena / Hawthorne',
  'Compton / Lynwood', 'Anaheim / Fullerton',
  'Santa Ana / Garden Grove', 'Orange / Tustin',
  'Oxnard / Port Hueneme', 'Camarillo', 'Thousand Oaks',
  'Temecula / Murrieta', 'Kearny Mesa',
];
