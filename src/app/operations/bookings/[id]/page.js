'use client';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plane, Building2, Calendar, FileText, Anchor } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDate, formatWeight, getStatusColor } from '@/lib/utils/formatters';
import { CARRIERS } from '@/lib/data/seedData';
import styles from '../../../crm/leads/[id]/detail.module.css';

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state } = useApp();

  const booking = state.bookingRequests.find(b => b.booking_request_id === id);

  if (!booking) {
    return (
      <div className={styles.page}>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/operations/bookings')}>Back to Bookings</Button>
        <div className={styles.notFound}>Booking Request not found</div>
      </div>
    );
  }

  const shipment = state.shipments.find(s => s.shipment_id === booking.shipment_id);
  const carrier = CARRIERS.find(c => c.id === booking.carrier_id);

  return (
    <div className={`ambient-mesh-bg`} style={{ minHeight: '100vh', padding: '24px' }}>
      <div className={styles.page} style={{ margin: '0 auto', maxWidth: '800px' }}>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/operations/bookings')} style={{ marginBottom: '24px' }}>Back to Bookings</Button>
        
        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', borderBottom: '1px solid var(--border-light)', paddingBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(20, 184, 166, 0.1)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
              <Plane size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0', color: '#0F172A' }}>{booking.booking_request_id}</h1>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '14px', fontWeight: 500 }}>{carrier ? carrier.name : 'Carrier'}</p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <Badge variant={getStatusColor(booking.status)} dot>{booking.status}</Badge>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className={styles.field}>
              <span className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14} /> Shipment Ref</span>
              <span className={styles.fieldValue} style={{ fontWeight: 600 }}>{shipment ? shipment.shipment_reference : '—'}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Anchor size={14} /> Flight No.</span>
              <span className={styles.fieldValue} style={{ fontWeight: 600, color: 'var(--primary)' }}>{booking.confirmed_flight_number || 'Pending'}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Flight Date</span>
              <span className={styles.fieldValue}>{booking.confirmed_flight_date ? formatDate(booking.confirmed_flight_date) : (booking.requested_flight_date ? `${formatDate(booking.requested_flight_date)} (Req)` : '—')}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Requested Weight</span>
              <span className={styles.fieldValue}>{formatWeight(booking.requested_weight_kg)}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Requested Pieces</span>
              <span className={styles.fieldValue}>{booking.requested_pieces || 0}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Allotment Reference</span>
              <span className={styles.fieldValue}>{booking.allotment_reference || '—'}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Created</span>
              <span className={styles.fieldValue}>{booking.created_at ? formatDate(booking.created_at) : '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
