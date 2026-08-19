'use client';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import TrackingMap from '@/components/ui/TrackingMap';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { formatDateTime, getStatusColor, formatWeight } from '@/lib/utils/formatters';
import { AIRPORTS, SHIPMENT_STATUSES } from '@/lib/data/seedData';
import styles from './tracking.module.css';
import { MapPin, AlertTriangle, Info } from 'lucide-react';

export default function TrackingBoard() {
  const router = useRouter();
  const { state, getEventsForShipment, getAccount } = useApp();

  const activeShipments = useMemo(() => {
    return state.shipments.filter(s => !['Closed', 'Delivered', 'Draft'].includes(s.status));
  }, [state.shipments]);

  // AIRPORTS is already an object map
  const airportMap = AIRPORTS;

  const columns = [
    { key: 'ref', label: 'Reference', accessor: 'shipment_reference', width: '120px',
      render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary-hover)' }}>{row.shipment_reference}</span> },
    { key: 'status', label: 'Status', accessor: 'status', width: '130px',
      render: (row) => <Badge variant={getStatusColor(row.status)} dot>{row.status}</Badge> },
    { key: 'route', label: 'Route', accessor: row => `${row.origin_airport}–${row.destination_airport}`,
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'white', background: 'var(--primary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{row.origin_airport}</span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>→</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'white', background: 'var(--primary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{row.destination_airport}</span>
        </span>
      )
    },
    { key: 'account', label: 'Account', accessor: row => getAccount(row.account_id)?.legal_name || '—' },
    { key: 'milestone', label: 'Milestone', accessor: 'current_milestone_code', width: '90px',
      render: (row) => row.current_milestone_code ? (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-tint)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
          {row.current_milestone_code}
        </span>
      ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span> },
    { key: 'last_event', label: 'Latest Event', accessor: row => {
        const events = getEventsForShipment(row.shipment_id);
        const latest = events[0];
        return latest ? `${latest.event_code} at ${latest.location_airport}` : '—';
      },
      render: (row) => {
        const events = getEventsForShipment(row.shipment_id);
        const latest = events[0];
        if (!latest) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
        const isException = latest.event_code === 'AWR' || latest.event_code === 'MAN';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 'var(--text-xs)', color: isException ? 'var(--danger)' : 'var(--text-primary)', fontWeight: isException ? 600 : 400 }}>
              {isException && <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />}
              {latest.event_description}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {formatDateTime(latest.event_timestamp)} · {latest.location_airport}
            </span>
          </div>
        );
      }
    },
  ];

  const exceptions = activeShipments.filter(s => s.status === 'Exception' || s.status === 'Customs Hold');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Live Tracking Board</h1>
          <p className={styles.subtitle}>
            {activeShipments.length} active shipments · {exceptions.length} exceptions
          </p>
        </div>
      </div>

      <div className={styles.mapSection}>
        <TrackingMap shipments={activeShipments} airports={airportMap} />
      </div>

      <div className={styles.tableSection}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <MapPin size={18} color="var(--primary)" />
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>Active Shipments</h2>
        </div>
        
        <DataTable
          columns={columns}
          data={activeShipments}
          onRowClick={(row) => router.push(`/operations/shipments/${row.shipment_id}`)}
          searchPlaceholder="Search active shipments..."
          filters={[
            { key: 'status', label: 'Status', options: SHIPMENT_STATUSES.filter(s => !['Closed', 'Delivered', 'Draft'].includes(s)) },
          ]}
        />
      </div>
    </div>
  );
}
