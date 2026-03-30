'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import SlideDrawer from '@/components/SlideDrawer';

function fmt(n) { return n != null ? Number(n).toLocaleString() : '—'; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TYPE_COLORS = {
  'Buyer':       'blue',
  'Seller':      'rust',
  'Tenant':      'amber',
  'Broker':      'purple',
  'Lender':      'green',
  'Owner':       'rust',
  'Investor':    'blue',
  'Attorney':    'gray',
  'Other':       'gray',
};

export default function ContactsPage() {
  const [contacts, setContacts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [total, setTotal]             = useState(0);
  const [selectedId, setSelectedId]   = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('');
  const [sortBy, setSortBy]           = useState('updated_at');
  const [sortDir, setSortDir]         = useState('desc');
  const [page, setPage]               = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => { loadContacts(); }, [search, typeFilter, sortBy, sortDir, page]);

  async function loadContacts() {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from('contacts')
        .select('id, name, company, title, contact_type, phone, email, linkedin, notes, account_id, property_id, deal_id, created_at, updated_at', { count: 'exact' })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .order(sortBy, { ascending: sortDir === 'asc', nullsFirst: false });

      if (search) query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`);
      if (typeFilter) query = query.eq('contact_type', typeFilter);

      const { data, error, count } = await query;
      if (error) throw error;
      setContacts(data || []);
      setTotal(count || 0);
    } catch(e) {
      console.error('Contacts error:', e);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* Header */}
      <div className="cl-page-header">
        <div>
          <h1 className="cl-page-title">Contacts</h1>
          <p className="cl-page-subtitle">
            {loading ? 'Loading…' : `${fmt(total)} contact${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="cl-page-actions">
          <button className="cl-btn cl-btn-primary cl-btn-sm">+ New Contact</button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="cl-filter-bar">
        <input
          className="cl-search-input"
          placeholder="Search name, company, email…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          style={{ maxWidth: 340 }}
        />
        <select className="cl-select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }}>
          <option value="">All Types</option>
          {['Buyer','Seller','Tenant','Broker','Lender','Owner','Investor','Attorney','Other'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select className="cl-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="updated_at">Sort: Recent</option>
          <option value="name">Sort: Name</option>
          <option value="company">Sort: Company</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card-bg)', fontSize: 14 }}>
          <thead>
            <tr>
              {[
                { label: 'Name',     width: null },
                { label: 'Company',  width: 200 },
                { label: 'Title',    width: 180 },
                { label: 'Type',     width: 110 },
                { label: 'Phone',    width: 150 },
                { label: 'Email',    width: 220 },
                { label: 'Notes',    width: 260 },
              ].map(col => (
                <th key={col.label} style={{
                  width: col.width || undefined,
                  background: 'rgba(0,0,0,0.025)',
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
                  letterSpacing: '0.1em', color: 'var(--text-tertiary)',
                  textTransform: 'uppercase', padding: '12px 14px',
                  textAlign: 'left', borderBottom: '1px solid var(--card-border)',
                  whiteSpace: 'nowrap',
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>
                <div className="cl-loading" style={{ padding: 40 }}><div className="cl-spinner" />Loading contacts…</div>
              </td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="cl-empty" style={{ padding: 48 }}>
                  <div className="cl-empty-label">No contacts found</div>
                  <div className="cl-empty-sub">Add contacts manually or import from a deal or lead</div>
                </div>
              </td></tr>
            ) : contacts.map(contact => (
              <tr key={contact.id}
                onClick={() => { setSelectedId(contact.id); setSelectedContact(contact); }}
                style={{
                  background: selectedId === contact.id ? 'rgba(78,110,150,0.06)' : undefined,
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  cursor: 'pointer', transition: 'background 120ms',
                }}
                onMouseEnter={e => { if (selectedId !== contact.id) e.currentTarget.style.background = 'rgba(78,110,150,0.03)'; }}
                onMouseLeave={e => { if (selectedId !== contact.id) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Name + initials */}
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--blue-bg)', color: 'var(--blue)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                    }}>
                      {(contact.name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--blue)' }}>{contact.name}</div>
                    </div>
                  </div>
                </td>

                {/* Company */}
                <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {contact.company || '—'}
                </td>

                {/* Title */}
                <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {contact.title || '—'}
                </td>

                {/* Type */}
                <td style={{ padding: '12px 14px' }}>
                  {contact.contact_type ? (
                    <span className={`cl-badge cl-badge-${TYPE_COLORS[contact.contact_type] || 'gray'}`} style={{ fontSize: 11 }}>
                      {contact.contact_type}
                    </span>
                  ) : '—'}
                </td>

                {/* Phone */}
                <td style={{ padding: '12px 14px' }}>
                  {contact.phone ? (
                    <a href={`tel:${contact.phone}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}
                      onClick={e => e.stopPropagation()}>
                      {contact.phone}
                    </a>
                  ) : <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>}
                </td>

                {/* Email */}
                <td style={{ padding: '12px 14px' }}>
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`} style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}
                      onClick={e => e.stopPropagation()}>
                      {contact.email}
                    </a>
                  ) : <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>}
                </td>

                {/* Notes */}
                <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {contact.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {fmt(total)}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="cl-btn cl-btn-secondary cl-btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <button className="cl-btn cl-btn-secondary cl-btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}

      {/* Drawer */}
      <SlideDrawer
        open={!!selectedId}
        onClose={() => { setSelectedId(null); setSelectedContact(null); }}
        fullPageHref={selectedId ? `/contacts/${selectedId}` : undefined}
        title={selectedContact?.name || 'Contact'}
        subtitle={[selectedContact?.title, selectedContact?.company].filter(Boolean).join(' · ')}
        badge={selectedContact?.contact_type ? { label: selectedContact.contact_type, color: TYPE_COLORS[selectedContact.contact_type] || 'gray' } : undefined}
      >
        {selectedContact && <ContactDetail contact={selectedContact} />}
      </SlideDrawer>
    </div>
  );
}

// ── CONTACT DETAIL (drawer) ───────────────────────────────
function ContactDetail({ contact }) {
  const [activeTab, setActiveTab] = useState('overview');
  const TABS = ['overview', 'activity', 'deals'];

  return (
    <div>
      {/* Avatar + info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: 10, border: '1px solid var(--card-border)' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
          background: 'var(--blue-bg)', color: 'var(--blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
        }}>
          {(contact.name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{contact.name}</div>
          {contact.title && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{contact.title}</div>}
          {contact.company && <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{contact.company}</div>}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {contact.phone && <a href={`tel:${contact.phone}`} className="cl-btn cl-btn-secondary cl-btn-sm">📞 Call</a>}
        {contact.email && <a href={`mailto:${contact.email}`} className="cl-btn cl-btn-secondary cl-btn-sm">✉️ Email</a>}
        {contact.linkedin && <a href={contact.linkedin} target="_blank" rel="noreferrer" className="cl-btn cl-btn-secondary cl-btn-sm">💼 LinkedIn</a>}
        <button className="cl-btn cl-btn-secondary cl-btn-sm">📝 Log Note</button>
      </div>

      {/* Tabs */}
      <div className="cl-tabs">
        {TABS.map(tab => (
          <button key={tab} className={`cl-tab ${activeTab === tab ? 'cl-tab--active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Contact details */}
          <div className="cl-card" style={{ padding: '14px 16px' }}>
            <div className="cl-card-title" style={{ marginBottom: 10 }}>CONTACT INFO</div>
            {[
              { label: 'Type',    value: contact.contact_type },
              { label: 'Phone',   value: contact.phone, href: `tel:${contact.phone}` },
              { label: 'Email',   value: contact.email, href: `mailto:${contact.email}` },
              { label: 'LinkedIn', value: contact.linkedin, href: contact.linkedin },
            ].filter(r => r.value).map(row => (
              <div key={row.label} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)', width: 70, flexShrink: 0 }}>
                  {row.label.toUpperCase()}
                </div>
                {row.href ? (
                  <a href={row.href} target={row.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                    style={{ fontSize: 13, color: 'var(--blue)', textDecoration: 'none' }}>
                    {row.value}
                  </a>
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{row.value}</span>
                )}
              </div>
            ))}
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="cl-card" style={{ padding: '14px 16px' }}>
              <div className="cl-card-title" style={{ marginBottom: 8 }}>NOTES</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{contact.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="cl-empty" style={{ padding: 40 }}>
          <div className="cl-empty-label">No activity logged</div>
          <div className="cl-empty-sub">Log calls, emails, and meetings</div>
        </div>
      )}

      {activeTab === 'deals' && (
        <div className="cl-empty" style={{ padding: 40 }}>
          <div className="cl-empty-label">No deals linked</div>
          <div className="cl-empty-sub">Link this contact to a deal</div>
        </div>
      )}
    </div>
  );
}
