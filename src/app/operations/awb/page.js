'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { formatDate, formatWeight, formatCurrency, formatAWBNumber, getStatusColor } from '@/lib/utils/formatters';
import { CARRIERS, AIRPORTS } from '@/lib/data/seedData';
import styles from '../shipments/shipments.module.css';
import commonStyles from '@/app/crm/leads/leads.module.css';

export default function AWBPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [editingAwbId, setEditingAwbId] = useState(null);
  const [newAWB, setNewAWB] = useState({
    awb_number: '', awb_type: 'Master (MAWB)', parent_mawb_id: '', shipment_id: '', carrier_id: '',
    shipper_contact_id: '', consignee_contact_id: '', origin_airport: '', destination_airport: '',
    pieces: '', gross_weight_kg: '', rate_class: 'Q', declared_value_for_carriage: '',
    declared_value_for_customs: '', freight_terms: 'Prepaid', currency_code: 'USD',
    weight_charge: '', other_charges: '', fwb_status: 'Not Transmitted'
  });

  const getCarrier = (id) => CARRIERS.find(c => c.id === id);

  const columns = [
    { key: 'number', label: 'AWB Number', accessor: 'awb_number', render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--primary-hover)' }}>{formatAWBNumber(row.awb_number)}</span> },
    { key: 'type', label: 'Type', accessor: 'awb_type', width: '80px', render: (row) => <Badge variant={row.awb_type === 'Master (MAWB)' ? 'primary' : 'neutral'}>{row.awb_type}</Badge> },
    { key: 'fwb', label: 'FWB', accessor: 'fwb_status', render: (row) => <Badge variant={getStatusColor(row.fwb_status)}>{row.fwb_status}</Badge> },
    { key: 'carrier', label: 'Carrier', accessor: row => getCarrier(row.carrier_id)?.code, render: (row) => <span style={{ fontWeight: 600 }}>{getCarrier(row.carrier_id)?.code || '—'}</span> },
    { key: 'route', label: 'Route', accessor: row => `${row.origin_airport}–${row.destination_airport}`, render: (row) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'white', background: 'var(--primary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{row.origin_airport}</span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>→</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'white', background: 'var(--primary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{row.destination_airport}</span>
      </span>
    )},
    { key: 'pieces', label: 'Pcs', accessor: 'pieces', align: 'right', render: (row) => <span className="tabular-nums">{row.pieces}</span> },
    { key: 'weight', label: 'Chg. Wt', accessor: 'chargeable_weight_kg', align: 'right', render: (row) => <span className="tabular-nums">{formatWeight(row.chargeable_weight_kg)}</span> },
    { key: 'charges', label: 'Total Charges', accessor: 'total_charges', align: 'right', render: (row) => <span className="tabular-nums">{formatCurrency(row.total_charges, row.currency_code)}</span> },
    { key: 'terms', label: 'Terms', accessor: 'freight_terms', width: '80px' },
    { key: 'issued', label: 'Issued', accessor: 'issued_at', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{row.issued_at ? formatDate(row.issued_at) : 'Draft'}</span> },
    { key: 'actions', label: '', accessor: 'actions', align: 'right',
      render: (row) => (
        <div className={commonStyles.actionButtons}>
          <button className={`${commonStyles.actionBtn} hover-scale click-spin`} title="View Details" onClick={(e) => { e.stopPropagation(); router.push(`/operations/awb/${row.awb_id}`); }}>
            <Eye size={16} className="click-spin-inner" />
          </button>
          <button className={`${commonStyles.actionBtn} hover-scale click-spin`} title="Edit" onClick={(e) => { 
            e.stopPropagation(); 
            setEditingAwbId(row.awb_id);
            setNewAWB({ ...row });
            setShowNew(true);
          }}>
            <Edit2 size={16} className="click-spin-inner" />
          </button>
          <button className={`${commonStyles.actionBtn} ${commonStyles.deleteBtn} hover-scale click-spin`} title="Delete" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_AWB', payload: row.awb_id }); }}>
            <Trash2 size={16} className="click-spin-inner" />
          </button>
        </div>
      )
    },
  ];

  const handleCreateOrUpdate = () => {
    if (!newAWB.awb_number.trim() || !newAWB.shipment_id || !newAWB.carrier_id) return;
    
    const payload = { 
      ...newAWB, 
      pieces: Number(newAWB.pieces) || 0,
      gross_weight_kg: Number(newAWB.gross_weight_kg) || 0,
      chargeable_weight_kg: Number(newAWB.gross_weight_kg) || 0,
      declared_value_for_carriage: Number(newAWB.declared_value_for_carriage) || 0,
      declared_value_for_customs: Number(newAWB.declared_value_for_customs) || 0,
      weight_charge: Number(newAWB.weight_charge) || 0,
      other_charges: Number(newAWB.other_charges) || 0,
      total_charges: (Number(newAWB.weight_charge) || 0) + (Number(newAWB.other_charges) || 0),
      fwb_status: newAWB.fwb_status || 'Not Transmitted',
      issued_by: 'user-1'
    };

    if (editingAwbId) {
      dispatch({ type: 'UPDATE_AWB', payload: { ...payload, awb_id: editingAwbId } });
    } else {
      dispatch({ type: 'CREATE_AWB', payload });
    }

    setShowNew(false);
    setEditingAwbId(null);
    setNewAWB({ awb_number: '', awb_type: 'Master (MAWB)', parent_mawb_id: '', shipment_id: '', carrier_id: '', shipper_contact_id: '', consignee_contact_id: '', origin_airport: '', destination_airport: '', pieces: '', gross_weight_kg: '', rate_class: 'Q', declared_value_for_carriage: '', declared_value_for_customs: '', freight_terms: 'Prepaid', currency_code: 'USD', weight_charge: '', other_charges: '', fwb_status: 'Not Transmitted' });
  };

  return (
    <div className={`ambient-mesh-bg ${commonStyles.pageWrapper}`}>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Air Waybills</h1>
            <p className={styles.subtitle}>
              {state.airWaybills.length} AWBs · {state.airWaybills.filter(a => a.awb_type === 'Master (MAWB)').length} Master · {state.airWaybills.filter(a => a.awb_type === 'House (HAWB)').length} House
            </p>
          </div>
          <Button icon={Plus} onClick={() => {
            setEditingAwbId(null);
            setNewAWB({ awb_number: '', awb_type: 'Master (MAWB)', parent_mawb_id: '', shipment_id: '', carrier_id: '', shipper_contact_id: '', consignee_contact_id: '', origin_airport: '', destination_airport: '', pieces: '', gross_weight_kg: '', rate_class: 'Q', declared_value_for_carriage: '', declared_value_for_customs: '', freight_terms: 'Prepaid', currency_code: 'USD', weight_charge: '', other_charges: '', fwb_status: 'Not Transmitted' });
            setShowNew(true);
          }}>New Air Waybill</Button>
        </div>
        
        <div className={`glass-panel ${commonStyles.tableContainer}`}>
          <DataTable
            columns={columns}
            data={state.airWaybills}
            onRowClick={(row) => router.push(`/operations/awb/${row.awb_id}`)}
            searchPlaceholder="Search by AWB number, carrier..."
            filters={[
              { key: 'awb_type', label: 'Type', options: ['Master (MAWB)', 'House (HAWB)', 'Direct'] },
              { key: 'fwb_status', label: 'FWB Status', options: ['Not Transmitted', 'Sent', 'Acknowledged (FMA)', 'Rejected (FNA)'] }
            ]}
          />
        </div>

      <Modal
        open={showNew}
        onClose={() => {
          setShowNew(false);
          setEditingAwbId(null);
          setNewAWB({ awb_number: '', awb_type: 'Master (MAWB)', parent_mawb_id: '', shipment_id: '', carrier_id: '', shipper_contact_id: '', consignee_contact_id: '', origin_airport: '', destination_airport: '', pieces: '', gross_weight_kg: '', rate_class: 'Q', declared_value_for_carriage: '', declared_value_for_customs: '', freight_terms: 'Prepaid', currency_code: 'USD', weight_charge: '', other_charges: '', fwb_status: 'Not Transmitted' });
        }}
        title={editingAwbId ? "Edit Air Waybill" : "New Air Waybill"}
        subtitle={editingAwbId ? "Update AWB details" : "Issue a new Master or House Air Waybill"}
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowNew(false);
              setEditingAwbId(null);
              setNewAWB({ awb_number: '', awb_type: 'Master (MAWB)', parent_mawb_id: '', shipment_id: '', carrier_id: '', shipper_contact_id: '', consignee_contact_id: '', origin_airport: '', destination_airport: '', pieces: '', gross_weight_kg: '', rate_class: 'Q', declared_value_for_carriage: '', declared_value_for_customs: '', freight_terms: 'Prepaid', currency_code: 'USD', weight_charge: '', other_charges: '', fwb_status: 'Not Transmitted' });
            }}>Cancel</Button>
            <Button onClick={handleCreateOrUpdate} disabled={!newAWB.awb_number.trim() || !newAWB.shipment_id || !newAWB.carrier_id}>{editingAwbId ? "Save Changes" : "Issue AWB"}</Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">AWB Number *</label>
              <input className="form-input" value={newAWB.awb_number} onChange={e => setNewAWB(p => ({ ...p, awb_number: e.target.value }))} placeholder="e.g. 157-12345675" />
            </div>
            <div className="form-group">
              <label className="form-label">AWB Type</label>
              <select className="form-select" value={newAWB.awb_type} onChange={e => setNewAWB(p => ({ ...p, awb_type: e.target.value, parent_mawb_id: e.target.value === 'Master (MAWB)' ? '' : p.parent_mawb_id }))}>
                <option value="Master (MAWB)">Master (MAWB)</option>
                <option value="House (HAWB)">House (HAWB)</option>
              </select>
            </div>
          </div>
          {newAWB.awb_type === 'House (HAWB)' && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Parent Master AWB</label>
                <select className="form-select" value={newAWB.parent_mawb_id} onChange={e => setNewAWB(p => ({ ...p, parent_mawb_id: e.target.value }))}>
                  <option value="">Select MAWB...</option>
                  {state.airWaybills.filter(a => a.awb_type === 'Master (MAWB)').map(a => <option key={a.awb_id} value={a.awb_id}>{a.awb_number}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Shipment *</label>
              <select className="form-select" value={newAWB.shipment_id} onChange={e => setNewAWB(p => ({ ...p, shipment_id: e.target.value }))}>
                <option value="">Select Shipment...</option>
                {state.shipments.map(s => <option key={s.shipment_id} value={s.shipment_id}>{s.shipment_reference}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Carrier *</label>
              <select className="form-select" value={newAWB.carrier_id} onChange={e => setNewAWB(p => ({ ...p, carrier_id: e.target.value }))}>
                <option value="">Select Carrier...</option>
                {CARRIERS.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Shipper Contact</label>
              <select className="form-select" value={newAWB.shipper_contact_id} onChange={e => setNewAWB(p => ({ ...p, shipper_contact_id: e.target.value }))}>
                <option value="">Select Contact...</option>
                {state.contacts.map(c => <option key={c.contact_id} value={c.contact_id}>{c.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Consignee Contact</label>
              <select className="form-select" value={newAWB.consignee_contact_id} onChange={e => setNewAWB(p => ({ ...p, consignee_contact_id: e.target.value }))}>
                <option value="">Select Contact...</option>
                {state.contacts.map(c => <option key={c.contact_id} value={c.contact_id}>{c.full_name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Origin Airport</label>
              <select className="form-select" value={newAWB.origin_airport} onChange={e => setNewAWB(p => ({ ...p, origin_airport: e.target.value }))}>
                <option value="">Select Origin...</option>
                {Object.values(AIRPORTS).map(a => <option key={a.code} value={a.code}>{a.code}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Destination Airport</label>
              <select className="form-select" value={newAWB.destination_airport} onChange={e => setNewAWB(p => ({ ...p, destination_airport: e.target.value }))}>
                <option value="">Select Destination...</option>
                {Object.values(AIRPORTS).map(a => <option key={a.code} value={a.code}>{a.code}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pieces</label>
              <input className="form-input" type="number" value={newAWB.pieces} onChange={e => setNewAWB(p => ({ ...p, pieces: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Gross Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" value={newAWB.gross_weight_kg} onChange={e => setNewAWB(p => ({ ...p, gross_weight_kg: e.target.value }))} placeholder="0.0" />
            </div>
            <div className="form-group">
              <label className="form-label">Rate Class</label>
              <select className="form-select" value={newAWB.rate_class} onChange={e => setNewAWB(p => ({ ...p, rate_class: e.target.value }))}>
                {['M','N','Q','C','U','E'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Freight Terms</label>
              <select className="form-select" value={newAWB.freight_terms} onChange={e => setNewAWB(p => ({ ...p, freight_terms: e.target.value }))}>
                <option value="Prepaid">Prepaid</option>
                <option value="Collect">Collect</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={newAWB.currency_code} onChange={e => setNewAWB(p => ({ ...p, currency_code: e.target.value }))}>
                {['USD','EUR','GBP','QAR','AED'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Weight Charge</label>
              <input className="form-input" type="number" value={newAWB.weight_charge} onChange={e => setNewAWB(p => ({ ...p, weight_charge: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Other Charges</label>
              <input className="form-input" type="number" value={newAWB.other_charges} onChange={e => setNewAWB(p => ({ ...p, other_charges: e.target.value }))} placeholder="0" />
            </div>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}
