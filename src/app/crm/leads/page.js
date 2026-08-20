'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowRightCircle, Eye, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate, formatWeight, formatCurrency, getStatusColor } from '@/lib/utils/formatters';
import { LEAD_SOURCES, LEAD_STATUSES, CARGO_TYPES, INCOTERMS, INCOTERM_LABELS } from '@/lib/data/seedData';
import AccountLookup from '@/components/ui/AccountLookup';
import styles from './leads.module.css';

export default function LeadsPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [approxRate, setApproxRate] = useState('');
  const [newLead, setNewLead] = useState({
    company_name: '', first_name: '', last_name: '', phone: '', email: '', source: 'Inbound RFQ Portal', status: 'New',
    trade_lane: '', cargo_type: 'General', est_pieces: '', est_gross_weight_kg: '',
    incoterm: 'CPT', estimated_value: '', currency_code: 'USD', owner_id: 'user-1',
  });
  const [showCompanyAutocomplete, setShowCompanyAutocomplete] = useState(false);

  const columns = [
    { key: 'status', label: 'Status', accessor: 'status', width: '120px',
      render: (row) => <Badge variant={getStatusColor(row.status)} dot>{row.status}</Badge> },
    { key: 'company', label: 'Company', accessor: 'company_name',
      render: (row) => <span className={styles.companyName}>{row.company_name}</span> },
    { key: 'contact', label: 'Contact', accessor: 'first_name',
      render: (row) => (
        <div>
          <div>{row.first_name ? `${row.first_name} ${row.last_name || ''}` : row.contact_name}</div>
          {row.phone && <div className="text-xs text-slate-500">{row.phone}</div>}
        </div>
      )
    },
    { key: 'account', label: 'Account', accessor: row => row.converted_account_id || '',
      render: (row) => row.converted_account_id ? <AccountLookup accountId={row.converted_account_id} size="small" /> : <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>—</span>
    },
    { key: 'source', label: 'Source', accessor: 'source',
      render: (row) => <span className={styles.source}>{row.source}</span> },
    { key: 'lane', label: 'Trade Lane', accessor: 'trade_lane',
      render: (row) => <span className={styles.tradeLane}>{row.trade_lane}</span> },
    { key: 'cargo', label: 'Cargo Type', accessor: 'cargo_type' },
    { key: 'weight', label: 'Est. Weight', accessor: 'est_gross_weight_kg', align: 'right',
      render: (row) => <span className="tabular-nums">{formatWeight(row.est_gross_weight_kg)}</span> },
    { key: 'value', label: 'Est. Value', accessor: 'estimated_value', align: 'right',
      render: (row) => <span className="tabular-nums">{formatCurrency(row.estimated_value, row.currency_code)}</span> },
    { key: 'created', label: 'Created', accessor: 'created_at',
      render: (row) => <span className={styles.date}>{formatDate(row.created_at)}</span> },
    { key: 'actions', label: '', accessor: 'actions', align: 'right',
      render: (row) => (
        <div className={styles.actionButtons}>
          <button className={`${styles.actionBtn} hover-scale click-spin`} title="View Details" onClick={(e) => { e.stopPropagation(); router.push(`/crm/leads/${row.lead_id}`); }}>
            <Eye size={16} className="click-spin-inner" />
          </button>
          <button className={`${styles.actionBtn} hover-scale click-spin`} title="Edit" onClick={(e) => { 
            e.stopPropagation(); 
            setEditingLeadId(row.lead_id);
            setNewLead({ ...row });
            setShowNew(true);
          }}>
            <Edit2 size={16} className="click-spin-inner" />
          </button>
          <button className={`${styles.actionBtn} ${styles.deleteBtn} hover-scale click-spin`} title="Delete" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_LEAD', payload: row.lead_id }); }}>
            <Trash2 size={16} className="click-spin-inner" />
          </button>
        </div>
      )
    },
  ];

  const handleCreateOrUpdate = () => {
    if (!newLead.company_name.trim() || (!newLead.first_name.trim() && !newLead.last_name.trim())) return;
    
    const payload = { 
      ...newLead, 
      est_pieces: Number(newLead.est_pieces) || 0, 
      est_gross_weight_kg: Number(newLead.est_gross_weight_kg) || 0, 
      estimated_value: Number(newLead.estimated_value) || 0 
    };

    if (editingLeadId) {
      dispatch({ type: 'UPDATE_LEAD', payload: { ...payload, lead_id: editingLeadId } });
    } else {
      dispatch({ type: 'CREATE_LEAD', payload });
    }

    setShowNew(false);
    setEditingLeadId(null);
    setNewLead({ company_name: '', first_name: '', last_name: '', phone: '', email: '', source: 'Inbound RFQ Portal', status: 'New', trade_lane: '', cargo_type: 'General', est_pieces: '', est_gross_weight_kg: '', incoterm: 'CPT', estimated_value: '', currency_code: 'USD', owner_id: 'user-1' });
    setApproxRate('');
  };

  const handleWeightChange = (e) => {
    const weight = e.target.value;
    setNewLead(p => {
      const updates = { ...p, est_gross_weight_kg: weight };
      if (approxRate) {
        updates.estimated_value = (Number(weight) || 0) * Number(approxRate);
      }
      return updates;
    });
  };

  const handleRateChange = (e) => {
    const rate = e.target.value;
    setApproxRate(rate);
    if (rate) {
      setNewLead(p => ({ ...p, estimated_value: (Number(p.est_gross_weight_kg) || 0) * Number(rate) }));
    }
  };

  const getCurrencySymbol = (code) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).formatToParts(0).find(x => x.type === 'currency').value;
    } catch {
      return '$';
    }
  };
  const sym = getCurrencySymbol(newLead.currency_code);

  return (
    <div style={{ backgroundColor: '#F7F9FB', minHeight: '100vh', '--primary': '#14B8A6', '--primary-tint': 'rgba(20, 184, 166, 0.1)' }} className={styles.pageWrapper}>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title} style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Leads</h1>
            <p className={styles.subtitle}>{state.leads.length} total leads · {state.leads.filter(l => l.status === 'New').length} new</p>
          </div>
          <Button icon={Plus} onClick={() => {
            setEditingLeadId(null);
            setNewLead({ company_name: '', first_name: '', last_name: '', phone: '', email: '', source: 'Inbound RFQ Portal', status: 'New', trade_lane: '', cargo_type: 'General', est_pieces: '', est_gross_weight_kg: '', incoterm: 'CPT', estimated_value: '', currency_code: 'USD', owner_id: 'user-1' });
            setShowNew(true);
          }}>New Lead</Button>
        </div>

        <div className={styles.tableContainer}>
          <DataTable
            columns={columns}
            data={state.leads}
            onRowClick={(row) => router.push(`/crm/leads/${row.lead_id}`)}
            searchPlaceholder="Search leads by company, contact, trade lane..."
            filters={[
              { key: 'status', label: 'Status', options: LEAD_STATUSES },
              { key: 'source', label: 'Source', options: LEAD_SOURCES },
              { key: 'cargo_type', label: 'Cargo', options: CARGO_TYPES },
            ]}
          />
        </div>

        <Modal
          open={showNew}
          onClose={() => {
            setShowNew(false);
            setEditingLeadId(null);
            setNewLead({ company_name: '', first_name: '', last_name: '', phone: '', email: '', source: 'Inbound RFQ Portal', status: 'New', trade_lane: '', cargo_type: 'General', est_pieces: '', est_gross_weight_kg: '', incoterm: 'CPT', estimated_value: '', currency_code: 'USD', owner_id: 'user-1' });
          }}
          title={editingLeadId ? "Edit Lead" : "New Lead"}
          subtitle={editingLeadId ? "Update lead details" : "Capture a new freight forwarding lead"}
          size="large"
          footer={
            <>
              <Button variant="secondary" onClick={() => {
                setShowNew(false);
                setEditingLeadId(null);
                setNewLead({ company_name: '', first_name: '', last_name: '', phone: '', email: '', source: 'Inbound RFQ Portal', status: 'New', trade_lane: '', cargo_type: 'General', est_pieces: '', est_gross_weight_kg: '', incoterm: 'CPT', estimated_value: '', currency_code: 'USD', owner_id: 'user-1' });
              }}>Cancel</Button>
              <Button onClick={handleCreateOrUpdate} disabled={!newLead.company_name.trim()}>{editingLeadId ? "Save Changes" : "Create Lead"}</Button>
            </>
          }
        >
        <div className={styles.form}>
          <div className="form-row">
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Company Name *</label>
              <input className="form-input" value={newLead.company_name} onFocus={() => setShowCompanyAutocomplete(true)} onBlur={() => setTimeout(() => setShowCompanyAutocomplete(false), 200)} onChange={e => setNewLead(p => ({ ...p, company_name: e.target.value }))} placeholder="Company name" />
              {showCompanyAutocomplete && newLead.company_name && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px', zIndex: 10, maxHeight: '150px', overflowY: 'auto' }}>
                  {state.accounts.filter(a => a.legal_name.toLowerCase().includes(newLead.company_name.toLowerCase())).map((a, aIdx) => (
                    <div key={a.account_id || aIdx} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }} onClick={() => { setNewLead(p => ({ ...p, company_name: a.legal_name })); setShowCompanyAutocomplete(false); }}>
                      {a.legal_name}
                    </div>
                  ))}
                  {state.accounts.filter(a => a.legal_name.toLowerCase().includes(newLead.company_name.toLowerCase())).length === 0 && (
                    <div style={{ padding: '8px', color: '#888', fontStyle: 'italic' }}>New Account will be created</div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-input" value={newLead.first_name} onChange={e => setNewLead(p => ({ ...p, first_name: e.target.value }))} placeholder="First name" />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className="form-input" value={newLead.last_name} onChange={e => setNewLead(p => ({ ...p, last_name: e.target.value }))} placeholder="Last name" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" type="tel" value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} placeholder="+1 234 567 8900" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Source</label>
              <select className="form-select" value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))}>
                {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={newLead.status} onChange={e => setNewLead(p => ({ ...p, status: e.target.value }))}>
                {LEAD_STATUSES.filter(s => s !== 'Converted').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Trade Lane (Origin–Destination)</label>
              <input className="form-input" value={newLead.trade_lane} onChange={e => setNewLead(p => ({ ...p, trade_lane: e.target.value }))} placeholder="e.g. DOH–FRA" />
            </div>
            <div className="form-group">
              <label className="form-label">Cargo Type</label>
              <select className="form-select" value={newLead.cargo_type} onChange={e => setNewLead(p => ({ ...p, cargo_type: e.target.value }))}>
                {CARGO_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Incoterm</label>
              <select className="form-select" value={newLead.incoterm} onChange={e => setNewLead(p => ({ ...p, incoterm: e.target.value }))}>
                {INCOTERMS.map(i => <option key={i} value={i}>{INCOTERM_LABELS[i]}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pieces</label>
              <input className="form-input" type="number" value={newLead.est_pieces} onChange={e => setNewLead(p => ({ ...p, est_pieces: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Gross Weight (kg)</label>
              <input className="form-input" type="number" value={newLead.est_gross_weight_kg} onChange={handleWeightChange} placeholder="0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Approx Value/kg</label>
              <select className="form-select" value={approxRate} onChange={handleRateChange}>
                <option value="">Custom Value...</option>
                <option value="500">Low ({sym}500/kg)</option>
                <option value="1000">Medium ({sym}1000/kg)</option>
                <option value="1500">High ({sym}1500/kg)</option>
                <option value="2000">Very High ({sym}2000/kg)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Total Est. Value</label>
              <input className="form-input" type="number" value={newLead.estimated_value} onChange={e => { setApproxRate(''); setNewLead(p => ({ ...p, estimated_value: e.target.value })) }} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={newLead.currency_code} onChange={e => setNewLead(p => ({ ...p, currency_code: e.target.value }))}>
                {['USD','EUR','GBP','QAR','AED','SGD','JPY','INR','AUD','HKD'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}