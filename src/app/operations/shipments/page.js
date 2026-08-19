'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Trash2 } from 'lucide-react';
import { formatDate, formatWeight, getStatusColor } from '@/lib/utils/formatters';
import { SHIPMENT_STATUSES, SERVICE_TYPES, CARGO_TYPES, INCOTERMS, INCOTERM_LABELS, AIRPORTS } from '@/lib/data/seedData';
import styles from './shipments.module.css';
import commonStyles from '@/app/crm/leads/leads.module.css';
 
export default function ShipmentsPage() {
  const router = useRouter();
  const { state, dispatch, getAccount } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [newShipment, setNewShipment] = useState({
    shipment_reference: '', account_id: '', service_type: 'Airport-to-Airport',
    origin_airport: '', destination_airport: '', incoterm: 'CPT', cargo_type: 'General',
    special_handling_codes: '', pieces: '', gross_weight_kg: '', volume_cbm: '', status: 'Booked'
  });

  const columns = [
    { key: 'ref', label: 'Reference', accessor: 'shipment_reference',
      render: (row) => <span className={styles.ref}>{row.shipment_reference}</span> },
    { key: 'status', label: 'Status', accessor: 'status', width: '140px',
      render: (row) => <Badge variant={getStatusColor(row.status)} dot>{row.status}</Badge> },
    { key: 'account', label: 'Account', accessor: row => getAccount(row.account_id)?.legal_name,
      render: (row) => <span>{getAccount(row.account_id)?.legal_name || '—'}</span> },
    { key: 'route', label: 'Route', accessor: row => `${row.origin_airport}–${row.destination_airport}`,
      render: (row) => (
        <span className={styles.route}>
          <span className={styles.airport}>{row.origin_airport}</span>
          <span className={styles.routeArrow}>→</span>
          <span className={styles.airport}>{row.destination_airport}</span>
        </span>
      ) },
    { key: 'cargo', label: 'Cargo', accessor: 'cargo_type', render: (row) => <span className={styles.cargoType}>{row.cargo_type}</span> },
    { key: 'pieces', label: 'Pcs', accessor: 'pieces', align: 'right', render: (row) => <span className="tabular-nums">{row.pieces}</span> },
    { key: 'weight', label: 'Chg. Weight', accessor: 'chargeable_weight_kg', align: 'right',
      render: (row) => <span className="tabular-nums">{formatWeight(row.chargeable_weight_kg)}</span> },
    { key: 'milestone', label: 'Milestone', accessor: 'current_milestone_code', width: '80px',
      render: (row) => row.current_milestone_code ? (
        <span className={styles.milestone}>{row.current_milestone_code}</span>
      ) : <span className={styles.noMilestone}>—</span> },
    { key: 'created', label: 'Created', accessor: 'created_at',
      render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{formatDate(row.created_at)}</span> },
    { key: 'actions', label: '', accessor: 'actions', align: 'right',
      render: (row) => (
        <div className={commonStyles.actionButtons}>
          <button className={`${commonStyles.actionBtn} ${commonStyles.deleteBtn} hover-scale click-spin`} title="Delete" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_SHIPMENT', payload: row.shipment_id }); }}>
            <Trash2 size={16} className="click-spin-inner" />
          </button>
        </div>
      )
    },
  ];

  const handleCreate = () => {
    if (!newShipment.shipment_reference.trim() || !newShipment.account_id) return;
    dispatch({ 
      type: 'CREATE_SHIPMENT', 
      payload: { 
        ...newShipment, 
        special_handling_codes: newShipment.special_handling_codes.split(',').map(s => s.trim()).filter(Boolean),
        pieces: Number(newShipment.pieces) || 0,
        gross_weight_kg: Number(newShipment.gross_weight_kg) || 0,
        volume_cbm: Number(newShipment.volume_cbm) || 0,
        chargeable_weight_kg: Math.max(Number(newShipment.gross_weight_kg) || 0, (Number(newShipment.volume_cbm) || 0) * 167)
      } 
    });
    setShowNew(false);
    setNewShipment({ shipment_reference: '', account_id: '', service_type: 'Airport-to-Airport', origin_airport: '', destination_airport: '', incoterm: 'CPT', cargo_type: 'General', special_handling_codes: '', pieces: '', gross_weight_kg: '', volume_cbm: '', status: 'Booked' });
  };

  return (
    <div className={`ambient-mesh-bg ${commonStyles.pageWrapper}`}>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Shipments</h1>
            <p className={styles.subtitle}>{state.shipments.length} shipments · {state.shipments.filter(s => s.status === 'In Transit').length} in transit</p>
          </div>
        </div>
        
        <div className={`glass-panel ${commonStyles.tableContainer}`}>
          <DataTable
            columns={columns}
        data={state.shipments}
        onRowClick={(row) => router.push(`/operations/shipments/${row.shipment_id}`)}
        searchPlaceholder="Search by reference, airport, account..."
        filters={[
          { key: 'status', label: 'Status', options: SHIPMENT_STATUSES },
          { key: 'cargo_type', label: 'Cargo', options: CARGO_TYPES },
        ]}
        renderActions={() => (
          <Button icon={Plus} onClick={() => setShowNew(true)}>New Shipment</Button>
        )}
      />
      </div>

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="New Shipment"
        subtitle="Create a new air freight shipment"
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newShipment.shipment_reference.trim() || !newShipment.account_id}>Create Shipment</Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Shipment Reference *</label>
              <input className="form-input" value={newShipment.shipment_reference} onChange={e => setNewShipment(p => ({ ...p, shipment_reference: e.target.value }))} placeholder="e.g. SHP-2024-001" />
            </div>
            <div className="form-group">
              <label className="form-label">Account *</label>
              <select className="form-select" value={newShipment.account_id} onChange={e => setNewShipment(p => ({ ...p, account_id: e.target.value }))}>
                <option value="">Select Account...</option>
                {state.accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.legal_name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Service Type</label>
              <select className="form-select" value={newShipment.service_type} onChange={e => setNewShipment(p => ({ ...p, service_type: e.target.value }))}>
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cargo Type</label>
              <select className="form-select" value={newShipment.cargo_type} onChange={e => setNewShipment(p => ({ ...p, cargo_type: e.target.value }))}>
                {CARGO_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Origin Airport</label>
              <select className="form-select" value={newShipment.origin_airport} onChange={e => setNewShipment(p => ({ ...p, origin_airport: e.target.value }))}>
                <option value="">Select Origin...</option>
                {Object.values(AIRPORTS).map(a => <option key={a.code} value={a.code}>{a.code} - {a.city}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Destination Airport</label>
              <select className="form-select" value={newShipment.destination_airport} onChange={e => setNewShipment(p => ({ ...p, destination_airport: e.target.value }))}>
                <option value="">Select Destination...</option>
                {Object.values(AIRPORTS).map(a => <option key={a.code} value={a.code}>{a.code} - {a.city}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Special Handling Codes (Comma separated)</label>
              <input className="form-input" value={newShipment.special_handling_codes} onChange={e => setNewShipment(p => ({ ...p, special_handling_codes: e.target.value }))} placeholder="e.g. PER, DGR, AVI" />
            </div>
            <div className="form-group">
              <label className="form-label">Pieces</label>
              <input className="form-input" type="number" value={newShipment.pieces} onChange={e => setNewShipment(p => ({ ...p, pieces: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Gross Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" value={newShipment.gross_weight_kg} onChange={e => setNewShipment(p => ({ ...p, gross_weight_kg: e.target.value }))} placeholder="0.0" />
            </div>
            <div className="form-group">
              <label className="form-label">Volume (cbm)</label>
              <input className="form-input" type="number" step="0.01" value={newShipment.volume_cbm} onChange={e => setNewShipment(p => ({ ...p, volume_cbm: e.target.value }))} placeholder="0.00" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Incoterm</label>
              <select className="form-select" value={newShipment.incoterm} onChange={e => setNewShipment(p => ({ ...p, incoterm: e.target.value }))}>
                {INCOTERMS.map(i => <option key={i} value={i}>{INCOTERM_LABELS[i]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select className="form-select" value={newShipment.status} onChange={e => setNewShipment(p => ({ ...p, status: e.target.value }))}>
                {SHIPMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}
