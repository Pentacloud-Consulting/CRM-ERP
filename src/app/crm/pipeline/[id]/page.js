'use client';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Target, Phone, Building2, User, Globe, Briefcase, TrendingUp } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import styles from '../../leads/[id]/detail.module.css';

export default function PipelineDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, getAccount, getContact } = useApp();

  const opp = state.opportunities.find(o => o.opportunity_id === id);

  if (!opp) {
    return (
      <div className={styles.page}>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/crm/pipeline')}>Back to Pipeline</Button>
        <div className={styles.notFound}>Opportunity not found</div>
      </div>
    );
  }

  const account = getAccount(opp.account_id);
  const contact = getContact(opp.primary_contact_id);

  return (
    <div className={`ambient-mesh-bg`} style={{ minHeight: '100vh', padding: '24px' }}>
      <div className={styles.page} style={{ margin: '0 auto', maxWidth: '800px' }}>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/crm/pipeline')} style={{ marginBottom: '24px' }}>Back to Pipeline</Button>
        
        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', borderBottom: '1px solid var(--border-light)', paddingBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
              <TrendingUp size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0', color: '#0F172A' }}>{opp.name}</h1>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '14px', fontWeight: 500 }}>{account?.legal_name || 'Opportunity'}</p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <Badge variant={opp.stage === 'Won' ? 'success' : opp.stage === 'Lost' ? 'danger' : 'neutral'}>{opp.stage}</Badge>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className={styles.field}>
              <span className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={14} /> Pipeline Value</span>
              <span className={styles.fieldValue} style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)' }}>{formatCurrency(opp.pipeline_value, opp.currency_code)}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={14} /> Trade Lane</span>
              <span className={styles.fieldValue} style={{ fontWeight: 600, color: 'var(--primary)' }}>{opp.trade_lane || '—'}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={14} /> Account</span>
              <span className={styles.fieldValue} style={{ fontWeight: 600 }}>{account ? account.legal_name : '—'}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> Primary Contact</span>
              <span className={styles.fieldValue}>{contact ? contact.full_name : '—'}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Cargo Type</span>
              <span className={styles.fieldValue}>{opp.cargo_type || '—'}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Incoterm</span>
              <span className={styles.fieldValue}>{opp.incoterm || '—'}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Est. Weight</span>
              <span className={styles.fieldValue}>{opp.est_chargeable_weight_kg ? `${opp.est_chargeable_weight_kg} kg` : '—'}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Created</span>
              <span className={styles.fieldValue}>{opp.created_at ? formatDate(opp.created_at) : '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
