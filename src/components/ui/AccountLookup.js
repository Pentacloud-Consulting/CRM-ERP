'use client';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import styles from './lookup.module.css';

export default function AccountLookup({ orgId, size = 'default' }) {
  const router = useRouter();
  const { getOrganization } = useApp();

  if (!orgId) {
    return <span className={styles.pillNull}>—</span>;
  }

  const account = getOrganization(orgId);

  if (!account) {
    return <span className={styles.pillNull}>Unknown</span>;
  }

  return (
    <span
      className={`${styles.pill} ${styles.accountPill} ${size === 'small' ? styles.pillSmall : ''}`}
      onClick={(e) => { e.stopPropagation(); router.push(`/crm/accounts/${orgId}`); }}
      title={account.legal_name}
    >
      <Building2 size={size === 'small' ? 12 : 14} />
      <span className={styles.pillLabel}>{account.legal_name}</span>
    </span>
  );
}
