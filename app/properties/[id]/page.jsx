'use client';

import { useParams, useRouter } from 'next/navigation';
import PropertyDetail from '@/components/PropertyDetail';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div style={{ fontFamily: 'var(--font-ui)', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Slim breadcrumb */}
      <div style={{ height: 44, background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 6 }}>
        <button
          onClick={() => router.push('/properties')}
          style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Properties
        </button>
        <span style={{ color: 'var(--text-tertiary)', opacity: 0.4, fontSize: 14 }}>›</span>
        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>Property Detail</span>
      </div>

      {/* Full page PropertyDetail — not inline */}
      <PropertyDetail id={id} inline={false} />
    </div>
  );
}
