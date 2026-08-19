'use client';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import styles from './lookup.module.css';

export default function ContactLookup({ contactId, size = 'default' }) {
  const router = useRouter();
  const { getContact } = useApp();

  if (!contactId) {
    return <span className={styles.pillNull}>—</span>;
  }

  const contact = getContact(contactId);

  if (!contact) {
    return <span className={styles.pillNull}>Unknown</span>;
  }

  return (
    <span
      className={`${styles.pill} ${styles.contactPill} ${size === 'small' ? styles.pillSmall : ''}`}
      onClick={(e) => { e.stopPropagation(); router.push(`/crm/contacts/${contactId}`); }}
      title={contact.full_name}
    >
      <User size={size === 'small' ? 12 : 14} />
      <span className={styles.pillLabel}>{contact.full_name}</span>
    </span>
  );
}
