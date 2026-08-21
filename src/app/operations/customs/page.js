'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate, getStatusColor } from '@/lib/utils/formatters';
import { ShieldCheck, AlertTriangle, Plus, Edit2, Trash2, Eye, LayoutGrid, List, FileCheck2, ScrollText, CheckCircle2, DollarSign, Activity, Package } from 'lucide-react';
import styles from './customs.module.css';

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

  // --- KPI Metrics ---
  const metrics = useMemo(() => {
    const total = state.customsClearances.length;
    const cleared = state.customsClearances.filter(c => c.status === 'Cleared').length;
    const pending = state.customsClearances.filter(c => ['Pending Filing', 'Under Inspection'].includes(c.status)).length;
    const holds = state.customsClearances.filter(c => c.status === 'Held').length;
    let totalDuty = 0;
    state.customsClearances.forEach(c => totalDuty += (c.duty_amount || 0));
    
    // mock score
    const score = total > 0 ? Math.round(((total - holds) / total) * 100) : 100;

    return { total, cleared, pending, holds, totalDuty, score };
  }, [state.customsClearances]);

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

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Cleared': return 'success';
      case 'Pending Filing': return 'warning';
      case 'Under Inspection': return 'blue';
      case 'Held': return 'danger';
      case 'Rejected': return 'neutral'; // Dark red usually, mapping to neutral for now, or could use danger
      default: return 'neutral';
    }
  };

  const formatCurrency = (amt, curr) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr || 'USD' }).format(amt || 0);
  };

  const columns = [
    { key: 'shipment', label: 'Shipment', accessor: row => getShipment(row.shipment_id)?.shipment_reference, render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 800, color: '#4F46E5' }}>{getShipment(row.shipment_id)?.shipment_reference || '—'}</span> },
    { key: 'jurisdiction', label: 'Jurisdiction', accessor: 'jurisdiction', render: (row) => <span style={{ fontWeight: 700 }}>{row.jurisdiction}</span> },
    { key: 'type', label: 'Type', accessor: 'clearance_type' },
    { key: 'status', label: 'Status', accessor: 'status', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {row.status === 'Held' && <div className={styles.pulseRed} />}
        <Badge variant={getStatusBadgeVariant(row.status)} dot>{row.status}</Badge>
      </div>
    )},
    { key: 'declaration', label: 'Declaration #', accessor: 'declaration_number', render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{row.declaration_number || '—'}</span> },
    { key: 'duty', label: 'Duty', accessor: 'duty_amount', render: (row) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(row.duty_amount, row.currency_code)}</span> },
    { key: 'date', label: 'Date', accessor: 'clearance_date', render: (row) => <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{row.clearance_date ? formatDate(row.clearance_date) : 'Pending'}</span> },
    {
      key: 'actions',
      label: '',
      width: '120px',
      align: 'right',
      render: (row) => (
        <div className={styles.actionButtons} onClick={e => e.stopPropagation()}>
          <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); router.push(`/operations/shipments/${row.shipment_id}`); }} title="View Shipment">
            <Eye size={16} />
          </button>
          <button className={styles.actionBtn} onClick={(e) => handleEdit(e, row)} title="Edit">
            <Edit2 size={16} />
          </button>
          <button className={`${styles.actionBtn} ${styles.delete}`} onClick={(e) => handleDelete(e, row.clearance_id)} title="Delete">
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

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.page}>
        
        {/* ══════ HERO HEADER ══════ */}
        <div className={styles.heroHeader}>
          <div className={styles.heroLeft}>
            <div className={styles.titleRow}>
              <div className={styles.titleIcon}>
                <ShieldCheck size={32} />
              </div>
              <div>
                <h1 className={styles.title}>Customs Compliance Control Center</h1>
                <p className={styles.subtitle}>
                  <CheckCircle2 size={16} color="#10B981" />
                  Manage import/export declarations, duty calculations, and regulatory compliance globally.
                </p>
              </div>
            </div>
          </div>
          <Button icon={Plus} onClick={() => setShowNew(true)} style={{ background: '#4338CA', border: 'none' }}>New Clearance</Button>
        </div>

        {/* ══════ KPI DASHBOARD ══════ */}
        <div className={styles.opsDashboard}>
          <div className={styles.opsMetric}>
            <div className={styles.metricLabel}><FileCheck2 size={14} /> Total Declarations</div>
            <div className={styles.metricValue}>{metrics.total}</div>
          </div>
          <div className={styles.opsMetric}>
            <div className={styles.metricLabel}><CheckCircle2 size={14} /> Cleared Shipments</div>
            <div className={`${styles.metricValue} ${styles.cleared}`}>{metrics.cleared}</div>
          </div>
          <div className={styles.opsMetric}>
            <div className={styles.metricLabel}><Activity size={14} /> Pending Review</div>
            <div className={styles.metricValue}>{metrics.pending}</div>
          </div>
          <div className={styles.opsMetric}>
            <div className={styles.metricLabel}><AlertTriangle size={14} color="#EF4444" /> Active Holds</div>
            <div className={`${styles.metricValue} ${metrics.holds > 0 ? styles.hold : ''}`}>
              {metrics.holds}
              {metrics.holds > 0 && <div className={styles.pulseRed} style={{ display: 'inline-block', marginLeft: 8 }} />}
            </div>
          </div>
          <div className={styles.opsMetric}>
            <div className={styles.metricLabel}><DollarSign size={14} /> Total Duty (Est)</div>
            <div className={styles.metricValue}>{formatCurrency(metrics.totalDuty, 'USD')}</div>
          </div>
          <div className={styles.opsMetric}>
            <div className={styles.metricLabel}><ShieldCheck size={14} /> Compliance Score</div>
            <div className={styles.metricValue} style={{ color: metrics.score > 90 ? '#10B981' : '#F59E0B' }}>{metrics.score}%</div>
          </div>
        </div>

        {/* ══════ TOOLBAR ══════ */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px' }}>
          <Button variant="secondary" icon={ScrollText}>Export Report</Button>
        </div>

        {/* ══════ LIST VIEW ══════ */}
        <div className={styles.listContainer}>
          <DataTable
            columns={columns}
            data={state.customsClearances}
            onRowClick={(row) => router.push(`/operations/shipments/${row.shipment_id}`)}
            searchPlaceholder="Search by declaration, jurisdiction, or shipment..."
            filters={[
              { key: 'status', label: 'Status', options: ['Pending Filing', 'Filed', 'Under Inspection', 'Cleared', 'Held', 'Rejected'] },
              { key: 'clearance_type', label: 'Type', options: ['Export', 'Import', 'Transit / In-Bond'] },
              { key: 'jurisdiction', label: 'Jurisdiction', options: ['US-ACE', 'EU-ICS2', 'LHR', 'DOH'] },
            ]}
          />
        </div>

      {/* ══════ MULTI-STEP CREATION WIZARD (MODAL) ══════ */}
      <Modal
        open={showNew}
        onClose={() => {
          setShowNew(false);
          setEditingClearanceId(null);
          setNewClearance({ shipment_id: '', awb_id: '', clearance_type: 'Import', jurisdiction: 'US-ACE', declaration_number: '', hs_codes: '', broker_id: '', status: 'Pending Filing', hold_reason: '', duty_amount: '', tax_amount: '', currency_code: 'USD' });
        }}
        title={editingClearanceId ? "Edit Customs Clearance" : "New Customs Clearance"}
        subtitle={editingClearanceId ? "Update existing clearance details" : "File a customs declaration for a shipment"}
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowNew(false);
              setEditingClearanceId(null);
              setNewClearance({ shipment_id: '', awb_id: '', clearance_type: 'Import', jurisdiction: 'US-ACE', declaration_number: '', hs_codes: '', broker_id: '', status: 'Pending Filing', hold_reason: '', duty_amount: '', tax_amount: '', currency_code: 'USD' });
            }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newClearance.shipment_id || !newClearance.jurisdiction} style={{ background: '#4338CA', borderColor: '#4338CA' }}>
              {editingClearanceId ? "Save Changes" : "Create Clearance"}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', padding: '10px 0' }}>
          
          <div className={styles.formSection}>
            <div className={styles.sectionTitle}><Package size={16} /> Step 1 — Shipment Information</div>
            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label">Shipment <span style={{ color: '#EF4444' }}>*</span></label>
                <select className="form-select" value={newClearance.shipment_id} onChange={e => setNewClearance(p => ({ ...p, shipment_id: e.target.value }))}>
                  <option value="">Select Shipment...</option>
                  {state.shipments.map(s => <option key={s.shipment_id} value={s.shipment_id}>{s.shipment_reference}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">AWB (Optional)</label>
                <select className="form-select" value={newClearance.awb_id} onChange={e => setNewClearance(p => ({ ...p, awb_id: e.target.value }))}>
                  <option value="">Select AWB...</option>
                  {state.transportDocuments.filter(a => !newClearance.shipment_id || a.shipment_id === newClearance.shipment_id).map(a => <option key={a.doc_id} value={a.doc_id}>{a.doc_number}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.formGrid} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Clearance Type</label>
                <select className="form-select" value={newClearance.clearance_type} onChange={e => setNewClearance(p => ({ ...p, clearance_type: e.target.value }))}>
                  <option value="Import">Import</option>
                  <option value="Export">Export</option>
                  <option value="Transit / In-Bond">Transit / In-Bond</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Jurisdiction <span style={{ color: '#EF4444' }}>*</span></label>
                <input className="form-input" value={newClearance.jurisdiction} onChange={e => setNewClearance(p => ({ ...p, jurisdiction: e.target.value }))} placeholder="e.g. US-ACE, EU-ICS2, LHR" />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.sectionTitle}><FileCheck2 size={16} /> Step 2 — Declaration Details</div>
            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label">Declaration Number</label>
                <input className="form-input" style={{ fontFamily: 'var(--font-mono)' }} value={newClearance.declaration_number} onChange={e => setNewClearance(p => ({ ...p, declaration_number: e.target.value }))} placeholder="Entry number" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={newClearance.status} onChange={e => setNewClearance(p => ({ ...p, status: e.target.value }))}>
                  {['Pending Filing', 'Filed', 'Under Inspection', 'Cleared', 'Held', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.formGrid} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">HS Codes (Comma separated)</label>
                <input className="form-input" value={newClearance.hs_codes} onChange={e => setNewClearance(p => ({ ...p, hs_codes: e.target.value }))} placeholder="e.g. 8471.30.0100" />
              </div>
              <div className="form-group">
                <label className="form-label">Broker ID</label>
                <input className="form-input" value={newClearance.broker_id} onChange={e => setNewClearance(p => ({ ...p, broker_id: e.target.value }))} placeholder="Broker ID (Optional)" />
              </div>
            </div>
            {newClearance.status === 'Held' && (
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label" style={{ color: '#EF4444' }}>Hold Reason <span style={{ color: '#EF4444' }}>*</span></label>
                <input className="form-input" style={{ borderColor: '#FCA5A5', background: '#FEF2F2' }} value={newClearance.hold_reason} onChange={e => setNewClearance(p => ({ ...p, hold_reason: e.target.value }))} placeholder="Provide reason for customs hold..." />
              </div>
            )}
          </div>

          <div className={styles.formSection} style={{ marginBottom: 0 }}>
            <div className={styles.sectionTitle}><DollarSign size={16} /> Step 3 — Financial Details</div>
            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label">Duty Amount</label>
                <input className="form-input" type="number" step="0.01" value={newClearance.duty_amount} onChange={e => setNewClearance(p => ({ ...p, duty_amount: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Tax Amount</label>
                <input className="form-input" type="number" step="0.01" value={newClearance.tax_amount} onChange={e => setNewClearance(p => ({ ...p, tax_amount: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Currency</label>
                <select className="form-select" value={newClearance.currency_code} onChange={e => setNewClearance(p => ({ ...p, currency_code: e.target.value }))}>
                  {['USD','EUR','GBP','QAR','AED'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

        </div>
      </Modal>

      </div>
    </div>
  );
}
