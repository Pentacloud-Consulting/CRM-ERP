'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Eye, Edit2, Trash2, ArrowUpRight, Plane, Activity, FileText, ChevronRight, Scale, DollarSign, Files } from 'lucide-react';
import { formatDate, formatWeight, formatCurrency, formatAWBNumber } from '@/lib/utils/formatters';
import { LOCATIONS } from '@/lib/data/seedData';
import styles from './awb.module.css';

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

  const getCarrier = (id) => state.organizations.find(c => c.org_id === id);
  const carriers = useMemo(() => state.organizations.filter(o => o.org_type === 'Carrier'), [state.organizations]);

  // Status mapping for premium FWB badges
  const getFwbStatusVariant = (status) => {
    switch (status) {
      case 'Acknowledged (FMA)': return 'success';
      case 'Rejected (FNA)': return 'danger';
      case 'Sent': return 'primary';
      default: return 'neutral';
    }
  };

  // ──────── KPIs ────────
  const kpis = useMemo(() => {
    let totalWeight = 0;
    let totalRevenue = 0;
    let master = 0;
    let house = 0;
    const docs = state.transportDocuments || [];

    docs.forEach(a => {
      if (a.doc_type === 'MAWB' || a.doc_type === 'MBL' || a.doc_type === 'LR') master++;
      if (a.doc_type === 'HAWB' || a.doc_type === 'HBL') house++;
      totalWeight += parseFloat(a.chargeable_weight_kg || a.gross_weight_kg || 0);
      totalRevenue += parseFloat(a.total_charges || 0);
    });

    return {
      total: docs.length,
      master,
      house,
      weight: totalWeight,
      revenue: totalRevenue
    };
  }, [state.transportDocuments]);

  const columns = [
    { 
      key: 'number', 
      label: 'DOC NUMBER', 
      accessor: 'doc_number', 
      render: (row) => (
        <span className={styles.awbNumberCell}>
          {row.doc_number}
        </span>
      ) 
    },
    { 
      key: 'type', 
      label: 'TYPE', 
      accessor: 'doc_type', 
      render: (row) => (
        <Badge variant={row.doc_type === 'MAWB' || row.doc_type === 'MBL' ? 'primary' : 'neutral'} dot>
          {row.doc_type}
        </Badge>
      ) 
    },
    { 
      key: 'fwb', 
      label: 'STATUS', 
      accessor: 'status', 
      render: (row) => <Badge variant={getFwbStatusVariant(row.status)}>{row.status}</Badge> 
    },
    { 
      key: 'carrier', 
      label: 'PROVIDER', 
      accessor: row => getCarrier(row.provider_id)?.code, 
      render: (row) => <span style={{ fontWeight: 800, color: '#0F172A' }}>{getCarrier(row.provider_id)?.code || '—'}</span> 
    },
    { 
      key: 'route', 
      label: 'ROUTE', 
      accessor: row => `${row.origin_location}–${row.destination_location}`, 
      render: (row) => (
        <div className={styles.routeCell}>
          <span className={styles.routeCode}>{row.origin_location}</span>
          <ChevronRight size={14} className={styles.routeArrow} />
          <span className={styles.routeCode}>{row.destination_location}</span>
        </div>
      )
    },
    { key: 'pieces', label: 'PCS', accessor: 'pieces', align: 'right', render: (row) => <span style={{ fontWeight: 600, color: '#334155' }}>{row.pieces}</span> },
    { key: 'weight', label: 'WEIGHT', accessor: 'gross_weight_kg', align: 'right', render: (row) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{formatWeight(row.gross_weight_kg)}</span> },
    { key: 'charges', label: 'TOTAL CHARGES', accessor: 'total_charges', align: 'right', render: (row) => <span style={{ fontWeight: 800, color: '#6366F1' }}>{formatCurrency(row.total_charges, row.currency_code)}</span> },
    { key: 'terms', label: 'TERMS', accessor: 'freight_terms', render: (row) => <span style={{ fontSize: '13px', color: '#64748B' }}>{row.freight_terms}</span> },
    { key: 'created', label: 'CREATED', accessor: 'created_at', render: (row) => <span style={{ fontSize: '12px', color: '#94A3B8' }}>{formatDate(row.created_at)}</span> },
    { key: 'actions', label: '', accessor: 'actions', align: 'right',
      render: (row) => (
        <div className={styles.actionButtons}>
          <button className={styles.actionBtn} title="View Details" onClick={(e) => { e.stopPropagation(); router.push(`/operations/transport-docs/${row.doc_id}`); }}>
            <Eye size={16} />
          </button>
          <button className={styles.actionBtn} title="Edit" onClick={(e) => { 
            e.stopPropagation(); 
            setEditingAwbId(row.doc_id);
            setNewAWB({ ...row });
            setShowNew(true);
          }}>
            <Edit2 size={16} />
          </button>
          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_TRANSPORT_DOC', payload: row.doc_id }); }}>
            <Trash2 size={16} />
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
      dispatch({ type: 'UPDATE_TRANSPORT_DOC', payload: { ...payload, doc_id: editingAwbId } });
    } else {
      dispatch({ type: 'CREATE_TRANSPORT_DOC', payload });
    }

    setShowNew(false);
    setEditingAwbId(null);
    setNewAWB({ awb_number: '', awb_type: 'Master (MAWB)', parent_mawb_id: '', shipment_id: '', carrier_id: '', shipper_contact_id: '', consignee_contact_id: '', origin_airport: '', destination_airport: '', pieces: '', gross_weight_kg: '', rate_class: 'Q', declared_value_for_carriage: '', declared_value_for_customs: '', freight_terms: 'Prepaid', currency_code: 'USD', weight_charge: '', other_charges: '', fwb_status: 'Not Transmitted' });
  };

  return (
    <div className={styles.pageWrapper} style={{ '--primary': '#6366F1', '--primary-tint': 'rgba(99, 102, 241, 0.1)', '--primary-hover': '#4F46E5' }}>
      <div className={styles.page}>
        
        {/* ══════ HEADER ══════ */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Air Waybills</h1>
            <p className={styles.subtitle}>
              Freight documents, billing rates, and routing execution.
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button icon={Plus} onClick={() => {
              setEditingAwbId(null);
              setNewAWB({ awb_number: '', awb_type: 'Master (MAWB)', parent_mawb_id: '', shipment_id: '', carrier_id: '', shipper_contact_id: '', consignee_contact_id: '', origin_airport: '', destination_airport: '', pieces: '', gross_weight_kg: '', rate_class: 'Q', declared_value_for_carriage: '', declared_value_for_customs: '', freight_terms: 'Prepaid', currency_code: 'USD', weight_charge: '', other_charges: '', fwb_status: 'Not Transmitted' });
              setShowNew(true);
            }} style={{ background: 'linear-gradient(to right, #6366F1, #8B5CF6)', borderColor: 'transparent', border: 'none' }}>
              New Air Waybill
            </Button>
          </div>
        </div>
        
        {/* ══════ ANALYTICS ══════ */}
        <div className={styles.analyticsGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={`${styles.kpiIconWrapper} indigo`}><Files size={20} /></div>
              <div className={`${styles.kpiTrend} trendUp`}><ArrowUpRight size={14} /> +24%</div>
            </div>
            <div className={styles.kpiMetric}>{kpis.total}</div>
            <div className={styles.kpiLabel}>Total AWBs</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={`${styles.kpiIconWrapper} primary`}><Plane size={20} /></div>
              <div className={`${styles.kpiTrend} trendNeutral`}>—</div>
            </div>
            <div className={styles.kpiMetric}>{kpis.master}</div>
            <div className={styles.kpiLabel}>Master AWBs</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={`${styles.kpiIconWrapper} violet`}><Scale size={20} /></div>
              <div className={`${styles.kpiTrend} trendUp`}><ArrowUpRight size={14} /></div>
            </div>
            <div className={styles.kpiMetric}>{formatWeight(kpis.weight)}</div>
            <div className={styles.kpiLabel}>Total Chargeable Weight</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={`${styles.kpiIconWrapper} success`}><DollarSign size={20} /></div>
              <div className={`${styles.kpiTrend} trendUp`}><ArrowUpRight size={14} /> +18%</div>
            </div>
            <div className={styles.kpiMetric}>{formatCurrency(kpis.revenue, 'USD')}</div>
            <div className={styles.kpiLabel}>Revenue Generated</div>
          </div>
        </div>

        {/* ══════ PREMIUM TABLE ══════ */}
        <div className={styles.tableContainer}>
          <DataTable
            columns={columns}
            data={state.transportDocuments || []}
            onRowClick={(row) => router.push(`/operations/transport-docs/${row.doc_id}`)}
            searchPlaceholder="Search by AWB number, carrier..."
            filters={[
              { key: 'awb_type', label: 'Type', options: ['Master (MAWB)', 'House (HAWB)', 'Direct'] },
              { key: 'fwb_status', label: 'FWB Status', options: ['Not Transmitted', 'Sent', 'Acknowledged (FMA)', 'Rejected (FNA)'] }
            ]}
          />
        </div>

      {/* ══════ CREATE / EDIT MODAL ══════ */}
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
            <Button onClick={handleCreateOrUpdate} disabled={!newAWB.awb_number.trim() || !newAWB.shipment_id || !newAWB.carrier_id} style={{ background: '#6366F1', borderColor: '#6366F1' }}>
              {editingAwbId ? "Save Changes" : "Issue AWB"}
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">AWB Number <span style={{ color: '#f43f5e' }}>*</span></label>
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
                  {(state.transportDocuments || []).filter(a => a.doc_type === 'MAWB').map(a => <option key={a.doc_id} value={a.doc_id}>{a.doc_number}</option>)}
                </select>
              </div>
            </div>
          )}
          
          <div className={styles.formSectionTitle} style={{ marginTop: '16px' }}>Logistics Route</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Shipment <span style={{ color: '#f43f5e' }}>*</span></label>
              <select className="form-select" value={newAWB.shipment_id} onChange={e => setNewAWB(p => ({ ...p, shipment_id: e.target.value }))}>
                <option value="">Select Shipment...</option>
                {state.shipments.map(s => <option key={s.shipment_id} value={s.shipment_id}>{s.shipment_reference}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Carrier <span style={{ color: '#f43f5e' }}>*</span></label>
              <select className="form-select" value={newAWB.carrier_id} onChange={e => setNewAWB(p => ({ ...p, carrier_id: e.target.value }))}>
                <option value="">Select Carrier...</option>
                {carriers.map(c => <option key={c.org_id} value={c.org_id}>{c.legal_name}</option>)}
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
                {Object.values(LOCATIONS).map(a => <option key={a.code} value={a.code}>{a.name}, {a.country} ({a.code})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Destination Airport</label>
              <select className="form-select" value={newAWB.destination_airport} onChange={e => setNewAWB(p => ({ ...p, destination_airport: e.target.value }))}>
                <option value="">Select Destination...</option>
                {Object.values(LOCATIONS).map(a => <option key={a.code} value={a.code}>{a.name}, {a.country} ({a.code})</option>)}
              </select>
            </div>
          </div>

          <div className={styles.formSectionTitle} style={{ marginTop: '16px' }}>Freight Charges</div>
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

          <div className={styles.formSectionTitle} style={{ marginTop: '16px' }}>Documentation</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">FWB Status</label>
              <select className="form-select" value={newAWB.fwb_status} onChange={e => setNewAWB(p => ({ ...p, fwb_status: e.target.value }))}>
                {['Not Transmitted', 'Sent', 'Acknowledged (FMA)', 'Rejected (FNA)'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"></div>
          </div>

        </div>
      </Modal>
      </div>
    </div>
  );
}
