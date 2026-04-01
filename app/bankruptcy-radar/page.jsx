'use client';

import { useState } from 'react';

const MARKETS = [
  'San Gabriel Valley (SGV)',
  'Inland Empire West',
  'Inland Empire East',
  'Los Angeles / Vernon',
  'Orange County',
  'South Bay / Carson',
  'Southern California (all)',
];

const INDUSTRIES = [
  'Manufacturing',
  'Wholesale Trade',
  'Retail Trade',
  'Transportation & Warehousing',
  'Food & Beverage',
  'Apparel / Garment',
  'Furniture / Home Goods',
  'Electronics / Technology',
  'Auto Parts',
  'Construction Materials',
  'Plastics / Chemicals',
  'All Industrial',
];

const LOADING_STEPS = [
  { label: 'Searching PACER and court filings…' },
  { label: 'Scanning news and press releases…' },
  { label: 'Identifying facility locations…' },
  { label: 'Assessing real estate opportunities…' },
  { label: 'Synthesizing CRE intelligence…' },
];

function UrgencyBadge({ urgency }) {
  const styles = {
    high:   { bg: 'rgba(184,55,20,0.1)',  color: 'var(--rust)',   border: 'rgba(184,55,20,0.25)'  },
    medium: { bg: 'rgba(168,112,16,0.1)', color: 'var(--amber)',  border: 'rgba(168,112,16,0.25)' },
    low:    { bg: 'rgba(78,110,150,0.1)', color: 'var(--blue)',   border: 'rgba(78,110,150,0.25)' },
  };
  const s = styles[urgency] || styles.low;
  return (
    <span style={{
      padding: '3px 8px', borderRadius: 4, fontSize: 10,
      fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {urgency} urgency
    </span>
  );
}

export default function BankruptcyRadarPage() {
  const [market, setMarket]     = useState('San Gabriel Valley (SGV)');
  const [industry, setIndustry] = useState('Manufacturing');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed]   = useState(0);

  async function runSearch() {
    setLoading(true);
    setResult(null);
    setStepIndex(0);
    setElapsed(0);

    const start = Date.now();
    const stepTimer = setInterval(() => {
      const secs = Math.floor((Date.now() - start) / 1000);
      setElapsed(secs);
      setStepIndex(Math.min(Math.floor(secs / 6), LOADING_STEPS.length - 1));
    }, 500);

    try {
      const res = await fetch('/api/bankruptcy-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market, industry }),
      });
      const data = await res.json();
      setResult(data.result || null);
    } catch(e) {
      console.error(e);
      setResult({ filings: [], summary: 'Search failed. Please try again.' });
    } finally {
      clearInterval(stepTimer);
      setLoading(false);
    }
  }

  async function createLeadFromFiling(filing) {
    try {
      const { createClient } = await import('@/lib/supabase');
      const supabase = createClient();
      const { error } = await supabase.from('leads').insert({
        lead_name: filing.company,
        company:   filing.company,
        address:   filing.location || null,
        stage:     'New',
        priority:  'Critical',
        notes: [
          `⚖️ Chapter ${filing.chapter} bankruptcy filing`,
          filing.filing_date && `Filed: ${filing.filing_date}`,
          filing.employees && `Employees: ${filing.employees}`,
          filing.facility_size && `Facility: ${filing.facility_size}`,
          filing.real_estate_status && `RE Status: ${filing.real_estate_status}`,
          filing.cre_opportunity && `Opportunity: ${filing.cre_opportunity}`,
          filing.source && `Source: ${filing.source}`,
        ].filter(Boolean).join('\n'),
        catalyst_tags: JSON.stringify([
          { tag: 'Distress / Special Servicer', category: 'Owner Signal', priority: 'high' },
          { tag: 'WARN Notice', category: 'Occupier Signal', priority: 'high' },
        ]),
      });
      if (error) throw error;
      alert(`Lead created for ${filing.company}!`);
    } catch(e) {
      alert('Error creating lead: ' + e.message);
    }
  }

  return (
    <div>
      <div className="cl-page-header">
        <div>
          <h1 className="cl-page-title">Bankruptcy Radar</h1>
          <p className="cl-page-subtitle">AI-powered search for Chapter 11 & Chapter 7 filings with industrial real estate implications</p>
        </div>
      </div>

      {/* Explainer */}
      <div style={{
        background: 'rgba(88,56,160,0.06)', border: '1px solid rgba(88,56,160,0.15)',
        borderRadius: 10, padding: '14px 18px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>⚖️</span>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--purple)' }}>Bankruptcy Radar</strong> searches court filings, news, and press releases for Chapter 11 and Chapter 7 bankruptcies in your target market.
          Companies in bankruptcy are often rejecting leases, closing facilities, or liquidating — creating high-urgency vacancy opportunities before space hits CoStar.
        </p>
      </div>

      {/* Search panel */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, overflow: 'hidden', marginBottom: 24, boxShadow: 'var(--card-shadow)' }}>
        <div style={{ background: '#EDE8E0', borderBottom: '1px solid rgba(0,0,0,0.07)', padding: '10px 18px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#78726A' }}>
            Search Parameters
          </span>
        </div>
        <div style={{ padding: '20px 18px', display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
              Market
            </label>
            <select
              value={market}
              onChange={e => setMarket(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.025)', border: '1px solid var(--card-border)', borderRadius: 8, fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text-primary)', outline: 'none' }}
            >
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
              Industry
            </label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.025)', border: '1px solid var(--card-border)', borderRadius: 8, fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text-primary)', outline: 'none' }}
            >
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <button
            className="cl-btn cl-btn-primary"
            onClick={runSearch}
            disabled={loading}
            style={{ minWidth: 180, height: 42 }}
          >
            {loading ? '⚖️ Searching…' : '⚖️ Run Bankruptcy Radar'}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '36px 28px', boxShadow: 'var(--card-shadow)', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ fontSize: 28 }}>⚖️</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                Searching bankruptcy filings for {industry} in {market}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Scanning PACER, court records, and news sources · {elapsed}s elapsed
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LOADING_STEPS.map((step, i) => {
              const isDone = i < stepIndex;
              const isActive = i === stepIndex;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDone ? 'var(--green)' : isActive ? 'var(--blue)' : 'rgba(0,0,0,0.06)',
                    fontSize: 10, color: '#fff',
                  }}>
                    {isDone ? '✓' : isActive ? '…' : ''}
                  </div>
                  <span style={{
                    fontSize: 13,
                    color: isDone ? 'var(--text-tertiary)' : isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    fontWeight: isActive ? 500 : 400,
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div>
          {/* Summary */}
          {result.summary && (
            <div style={{ background: 'rgba(88,56,160,0.05)', border: '1px solid rgba(88,56,160,0.15)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, borderLeft: '3px solid var(--purple)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--purple)', textTransform: 'uppercase', marginBottom: 6 }}>Market Summary</div>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.65 }}>{result.summary}</p>
            </div>
          )}

          {/* Count */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 14 }}>
            {result.filings?.length || 0} filing{result.filings?.length !== 1 ? 's' : ''} found · {market} · {industry}
          </div>

          {/* Filing cards */}
          {!result.filings?.length ? (
            <div className="cl-empty" style={{ padding: 48 }}>
              <div className="cl-empty-label">No filings found</div>
              <div className="cl-empty-sub">Try a different market or industry combination</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {result.filings.map((filing, i) => (
                <div key={i} style={{
                  background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                  borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--card-shadow)',
                  borderLeft: `3px solid ${filing.urgency === 'high' ? 'var(--rust)' : filing.urgency === 'medium' ? 'var(--amber)' : 'var(--blue)'}`,
                }}>
                  {/* Card header */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {filing.company}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {filing.location && <span>📍 {filing.location}</span>}
                        {filing.filing_date && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Filed: {filing.filing_date}</span>}
                        {filing.employees && <span>{Number(filing.employees).toLocaleString()} employees</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        background: filing.chapter === 11 ? 'rgba(168,112,16,0.1)' : 'rgba(184,55,20,0.1)',
                        color: filing.chapter === 11 ? 'var(--amber)' : 'var(--rust)',
                        border: `1px solid ${filing.chapter === 11 ? 'rgba(168,112,16,0.25)' : 'rgba(184,55,20,0.25)'}`,
                      }}>
                        Ch. {filing.chapter}
                      </span>
                      <UrgencyBadge urgency={filing.urgency} />
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 6 }}>Real Estate Status</div>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{filing.real_estate_status || '—'}</p>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--green)', textTransform: 'uppercase', marginBottom: 6 }}>CRE Opportunity</div>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>{filing.cre_opportunity || '—'}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.02)', borderTop: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {filing.facility_size && <span>📐 {filing.facility_size} · </span>}
                      {filing.source_url
                        ? <a href={filing.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none' }}>Source: {filing.source}</a>
                        : <span>Source: {filing.source || '—'}</span>
                      }
                    </div>
                    <button
                      className="cl-btn cl-btn-primary cl-btn-sm"
                      onClick={() => createLeadFromFiling(filing)}
                      style={{ fontSize: 12 }}
                    >
                      + Create Lead
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !result && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '56px 32px', textAlign: 'center', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>⚖️</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            Find bankruptcy leads before they hit CoStar
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 440, margin: '0 auto 20px' }}>
            Select a market and industry above. The radar will search court filings, news, and press releases for companies with industrial space that may be coming available.
          </p>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
            Typical search takes 25–40 seconds
          </div>
        </div>
      )}
    </div>
  );
}
