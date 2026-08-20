'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate, getStatusColor } from '@/lib/utils/formatters';
import { ShieldCheck, AlertTriangle, Plus, Edit, Trash2, Eye } from 'lucide-react';
import styles from '../shipments/shipments.module.css';

export default function CustomsPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [editingClearanceId, setEditingClearanceId] = useState(null);
  const [newClearance, setNewClearance] = useState({
    shipment_id: '', awb_id: '', clearance_type: 'Import', jurisdiction: 'US-ACE',
    declaration_number: '', hs_codes: '', broker_id: '', status: 'Pending Filing', hold_reason: '',
    duty_amount: '', tax_amount: '', currency_code: 'USD'
  });

  const getShipment = (id) => state.shipments.find(s => s.shipment_id === id);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this customs clearance?')) {
      dispatch({ type: 'DELETE_CUSTOMS', payload: id });
    }
  };

  const handleEdit = (e, row) => {
    e.stopPropagation();
    setEditingClearanceId(row.clearance_id);
    setNewClearance({
      ...row,
      hs_codes: Array.isArray(row.hs_codes) ? row.hs_codes.join(', ') : (row.hs_codes || ''),
    });
    setShowNew(true);
  };

  const columns = [
    { key: 'shipment', label: 'Shipment', accessor: row => getShipment(row.shipment_id)?.shipment_reference, render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--primary-hover)' }}>{getShipment(row.shipment_id)?.shipment_reference || '—'}</span> },
    { key: 'jurisdiction', label: 'Jurisdiction', accessor: 'jurisdiction', render: (row) => <span style={{ fontWeight: 600 }}>{row.jurisdiction}</span> },
    { key: 'type', label: 'Type', accessor: 'clearance_type' },
    { key: 'status', label: 'Status', accessor: 'status', render: (row) => <Badge variant={getStatusColor(row.status)} dot>{row.status}</Badge> },
    { key: 'declaration', label: 'Declaration #', accessor: 'declaration_number', render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{row.declaration_number || '—'}</span> },
    { key: 'date', label: 'Date', accessor: 'clearance_date', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{row.clearance_date ? formatDate(row.clearance_date) : 'Pending'}</span> },
    { key: 'issues', label: 'Hold Reason', accessor: 'hold_reason', width: '250px', render: (row) => {
        if (!row.hold_reason) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
        return (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: 'var(--danger)', fontSize: 'var(--text-xs)', lineHeight: 1.4 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{row.hold_reason}</span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }} onClick={(e) => { e.stopPropagation(); router.push(`/operations/shipments/${row.shipment_id}`); }} title="View Shipment">
            <Eye size={16} />
          </button>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }} onClick={(e) => handleEdit(e, row)} title="Edit">
            <Edit size={16} />
          </button>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }} onClick={(e) => handleDelete(e, row.clearance_id)} title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const handleCreate = () => {
    if (!newClearance.shipment_id || !newClearance.jurisdiction) return;
    
    const payload = { 
      ...newClearance,
      hs_codes: newClearance.hs_codes.split(',').map(c => c.trim()).filter(Boolean),
      duty_amount: Number(newClearance.duty_amount) || 0,
      tax_amount: Number(newClearance.tax_amount) || 0
    };

    if (editingClearanceId) {
      dispatch({ type: 'UPDATE_CUSTOMS', payload: { ...payload, clearance_id: editingClearanceId } });
    } else {
      dispatch({ type: 'CREATE_CUSTOMS', payload });
    }

    setShowNew(false);
    setEditingClearanceId(null);
    setNewClearance({ shipment_id: '', awb_id: '', clearance_type: 'Import', jurisdiction: 'US-ACE', declaration_number: '', hs_codes: '', broker_id: '', status: 'Pending Filing', hold_reason: '', duty_amount: '', tax_amount: '', currency_code: 'USD' });
  };

  const holds = state.customsClearances.filter(c => c.status === 'Held');

  return (
    <div style={{ maxWidth: 1400, animation: 'fadeInUp var(--transition-slow) ease both' }}>
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={28} color="var(--primary)" />
            Customs Clearances
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
            {state.customsClearances.length} records · {holds.length} active holds
          </p>
        </div>
        <Button icon={Plus} onClick={() => setShowNew(true)}>New Clearance</Button>
      </div>
      
      <DataTable
        columns={columns}
        data={state.customsClearances}
        onRowClick={(row) => router.push(`/operations/shipments/${row.shipment_id}`)}
        searchPlaceholder="Search by declaration, jurisdiction..."
        filters={[
          { key: 'status', label: 'Status', options: ['Pending Filing', 'Filed', 'Under Inspection', 'Cleared', 'Held', 'Rejected'] },
          { key: 'clearance_type', label: 'Type', options: ['Export', 'Import', 'Transit / In-Bond'] },
        ]}
      />

      <Modal
        open={showNew}
        onClose={() => {
          setShowNew(false);
          setEditingClearanceId(null);
          setNewClearance({ shipment_id: '', awb_id: '', clearance_type: 'Import', jurisdiction: 'US-ACE', declaration_number: '', hs_codes: '', broker_id: '', status: 'Pending Filing', hold_reason: '', duty_amount: '', tax_amount: '', currency_code: 'USD' });
        }}
        title={editingClearanceId ? "Edit Customs Clearance" : "New Customs Clearance"}
        subtitle={editingClearanceId ? "Update existing clearance details" : "File a customs declaration for a shipment"}
        size="medium"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowNew(false);
              setEditingClearanceId(null);
              setNewClearance({ shipment_id: '', awb_id: '', clearance_type: 'Import', jurisdiction: 'US-ACE', declaration_number: '', hs_codes: '', broker_id: '', status: 'Pending Filing', hold_reason: '', duty_amount: '', tax_amount: '', currency_code: 'USD' });
            }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newClearance.shipment_id || !newClearance.jurisdiction}>
              {editingClearanceId ? "Save Changes" : "Create Clearance"}
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className="form-group">
            <label className="form-label">Shipment *</label>
            <select className="form-select" value={newClearance.shipment_id} onChange={e => setNewClearance(p => ({ ...p, shipment_id: e.target.value }))}>
              <option value="">Select Shipment...</option>
              {state.shipments.map(s => <option key={s.shipment_id} value={s.shipment_id}>{s.shipment_reference}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">AWB (Optional)</label>
            <select className="form-select" value={newClearance.awb_id} onChange={e => setNewClearance(p => ({ ...p, awb_id: e.target.value }))}>
              <option value="">Select AWB...</option>
              {state.airWaybills.filter(a => !newClearance.shipment_id || a.shipment_id === newClearance.shipment_id).map(a => <option key={a.awb_id} value={a.awb_id}>{a.awb_number}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Clearance Type</label>
              <select className="form-select" value={newClearance.clearance_type} onChange={e => setNewClearance(p => ({ ...p, clearance_type: e.target.value }))}>
                <option value="Import">Import</option>
                <option value="Export">Export</option>
                <option value="Transit / In-Bond">Transit / In-Bond</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Jurisdiction *</label>
              <input className="form-input" value={newClearance.jurisdiction} onChange={e => setNewClearance(p => ({ ...p, jurisdiction: e.target.value }))} placeholder="e.g. US-ACE, EU-ICS2" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Declaration Number</label>
              <input className="form-input" value={newClearance.declaration_number} onChange={e => setNewClearance(p => ({ ...p, declaration_number: e.target.value }))} placeholder="Entry number" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={newClearance.status} onChange={e => setNewClearance(p => ({ ...p, status: e.target.value }))}>
                {['Pending Filing', 'Filed', 'Under Inspection', 'Cleared', 'Held', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">HS Codes (Comma separated)</label>
              <input className="form-input" value={newClearance.hs_codes} onChange={e => setNewClearance(p => ({ ...p, hs_codes: e.target.value }))} placeholder="e.g. 8471.30.0100" />
            </div>
            <div className="form-group">
              <label className="form-label">Broker ID</label>
              <input className="form-input" value={newClearance.broker_id} onChange={e => setNewClearance(p => ({ ...p, broker_id: e.target.value }))} placeholder="Broker ID (Optional)" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duty Amount</label>
              <input className="form-input" type="number" step="0.01" value={newClearance.duty_amount} onChange={e => setNewClearance(p => ({ ...p, duty_amount: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Tax Amount</label>
              <input className="form-input" type="number" step="0.01" value={newClearance.tax_amount} onChange={e => setNewClearance(p => ({ ...p, tax_amount: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={newClearance.currency_code} onChange={e => setNewClearance(p => ({ ...p, currency_code: e.target.value }))}>
                {['USD','EUR','GBP','QAR','AED'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
