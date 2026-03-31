'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import ContactDetailPage from '@/components/ContactDetailPage';

export default function ContactDetailRoute() {
  const { id } = useParams();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setContact(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="cl-loading" style={{ padding: 60 }}>
      <div className="cl-spinner" />Loading contact…
    </div>
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 0 64px' }}>
      <ContactDetailPage contact={contact} />
    </div>
  );
}
