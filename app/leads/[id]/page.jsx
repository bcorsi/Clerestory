'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import LeadDetail from '@/components/LeadDetail';

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadLead(); }, [id]);

  async function loadLead() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setLead(data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="cl-loading" style={{ padding: 80 }}>
      <div className="cl-spinner" />Loading lead…
    </div>
  );

  if (!lead) return (
    <div className="cl-empty" style={{ padding: 80 }}>
      <div className="cl-empty-label">Lead not found</div>
      <button className="cl-btn cl-btn-secondary" onClick={() => router.push('/leads')} style={{ marginTop: 16 }}>
        ← Back to Lead Gen
      </button>
    </div>
  );

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ padding: '12px 0 0', marginBottom: -4, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-tertiary)' }}>
        <span style={{ cursor: 'pointer', color: 'var(--blue)' }} onClick={() => router.push('/leads')}>← Lead Gen</span>
        <span style={{ opacity: 0.4 }}>›</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{lead.lead_name || lead.company}</span>
      </div>
      <LeadDetail
        lead={lead}
        onClose={() => router.push('/leads')}
        onRefresh={loadLead}
        fullPage={true}
      />
    </div>
  );
}
