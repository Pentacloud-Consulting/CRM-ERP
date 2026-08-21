'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit2, Trash2, Search, Target, MapPin, Package, ArrowRight } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate, formatWeight, formatCurrency, getStatusColor } from '@/lib/utils/formatters';
import { LEAD_SOURCES, LEAD_STATUSES, CARGO_TYPES, INCOTERMS, INCOTERM_LABELS, LOCATIONS, TRANSPORT_MODES } from '@/lib/data/seedData';
import AccountLookup from '@/components/ui/AccountLookup';
import AsyncLocationSelect from '@/components/ui/AsyncLocationSelect';
import styles from './leads.module.css';
import { PlaneTakeoff, Ship, Truck } from 'lucide-react';

const EMPTY_LEAD = {
  company_name: '', first_name: '', last_name: '', phone: '', email: '',
  source: 'Inbound RFQ Portal', status: 'New', transport_mode: 'AIR', origin_location: '', destination_location: '', cargo_type: 'General',
  est_pieces: '', est_gross_weight_kg: '', incoterm: 'CPT',
  estimated_value: '', currency_code: 'USD', owner_id: 'user-1',
};

export const getLocationName = (loc) => {
  if (!loc) return '?';
  try {
    return JSON.parse(loc).name;
  } catch {
    return loc; // It's a standard code like 'DXB'
  }
};

export const getLocationCountry = (loc) => {
  if (!loc) return null;
  try {
    return JSON.parse(loc).country;
  } catch {
    return LOCATIONS[loc]?.country || null;
  }
};

export default function LeadsPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [approxRate, setApproxRate] = useState('');
  const [newLead, setNewLead] = useState({ ...EMPTY_LEAD });
  const [showCompanyAutocomplete, setShowCompanyAutocomplete] = useState(false);
  const [kpiFilter, setKpiFilter] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // ──────── KPI Data ────────
  const kpis = useMemo(() => {
    const leads = state.leads;
    return {
      total: leads.length,
      new: leads.filter(l => l.status === 'New').length,
      qualifying: leads.filter(l => l.status === 'Qualifying' || l.status === 'Qualified').length,
      converted: leads.filter(l => l.status === 'Converted').length,
      lost: leads.filter(l => l.status === 'Disqualified').length,
    };
  }, [state.leads]);

  // ──────── Filtered data for table ────────
  const filteredLeads = useMemo(() => {
    if (!kpiFilter) return state.leads;
    if (kpiFilter === 'new') return state.leads.filter(l => l.status === 'New');
    if (kpiFilter === 'qualifying') return state.leads.filter(l => l.status === 'Qualifying' || l.status === 'Qualified');
    if (kpiFilter === 'converted') return state.leads.filter(l => l.status === 'Converted');
    if (kpiFilter === 'lost') return state.leads.filter(l => l.status === 'Disqualified');
    return state.leads;
  }, [state.leads, kpiFilter]);

  // ──────── Table Columns ────────
  const columns = [
    { key: 'status', label: 'Status', accessor: 'status', width: '110px',
      render: (row) => <Badge variant={getStatusColor(row.status)} dot>{row.status}</Badge> },
    { key: 'company', label: 'Company', accessor: 'company_name',
      render: (row) => (
        <div className={styles.companyCell}>
          <div className={styles.companyAvatar}>{(row.company_name || '?')[0].toUpperCase()}</div>
          <div>
            <div className={styles.companyName}>{row.company_name}</div>
            {row.email && <div className={styles.companyMeta}>{row.email}</div>}
          </div>
        </div>
      )},
    { key: 'contact', label: 'Contact', accessor: 'first_name',
      render: (row) => (
        <div>
          <div className={styles.contactName}>{row.first_name ? `${row.first_name} ${row.last_name || ''}` : row.contact_name || '—'}</div>
          {row.phone && <div className={styles.contactPhone}>{row.phone}</div>}
        </div>
      )},
    { key: 'lane', label: 'Route', accessor: 'origin_location', width: '220px',
      render: (row) => {
        const originCtry = getLocationCountry(row.origin_location);
        const destCtry = getLocationCountry(row.destination_location);
        const isDomestic = originCtry && destCtry && originCtry === destCtry;
        
        return (
          <div>
            <div className={styles.tradeLaneCell} style={{ marginBottom: '4px' }}>
              <span style={{ color: '#94A3B8', marginRight: '6px', display: 'inline-flex' }}>
                {row.transport_mode === 'SEA' ? <Ship size={14} /> : row.transport_mode === 'ROAD' ? <Truck size={14} /> : <PlaneTakeoff size={14} />}
              </span>
              <span className={styles.tradeLaneCode}>{getLocationName(row.origin_location)}</span>
              <span className={styles.tradeLaneArrow}>→</span>
              <span className={styles.tradeLaneCode}>{getLocationName(row.destination_location)}</span>
            </div>
            <Badge variant={isDomestic ? 'neutral' : 'primary'} dot>{isDomestic ? 'Domestic' : 'International'}</Badge>
          </div>
        );
      }},
    { key: 'cargo', label: 'Cargo', accessor: 'cargo_type',
      render: (row) => (
        <div>
          <div className={styles.cargoCell}>{row.cargo_type || '—'}</div>
          <div className={styles.cargoMeta}>
            {row.est_pieces ? `${row.est_pieces} pcs` : ''}
            {row.est_pieces && row.est_gross_weight_kg ? ' · ' : ''}
            {row.est_gross_weight_kg ? formatWeight(row.est_gross_weight_kg) : ''}
          </div>
        </div>
      )},
    { key: 'source', label: 'Source', accessor: 'source',
      render: (row) => <span className={styles.source}>{row.source}</span> },
    { key: 'value', label: 'Est. Value', accessor: 'estimated_value', align: 'right',
      render: (row) => <span className="tabular-nums" style={{ fontSize: '13px', fontWeight: 600 }}>{row.estimated_value ? formatCurrency(row.estimated_value, row.currency_code) : '—'}</span> },
    { key: 'created', label: 'Created', accessor: 'created_at',
      render: (row) => <span className={styles.date}>{formatDate(row.created_at)}</span> },
    { key: 'actions', label: '', accessor: 'actions', align: 'right',
      render: (row) => (
        <div className={styles.actionButtons}>
          <button className={styles.actionBtn} title="View Details" onClick={(e) => { e.stopPropagation(); router.push(`/crm/leads/${row.lead_id}`); }}>
            <Eye size={15} />
          </button>
          <button className={styles.actionBtn} title="Edit" onClick={(e) => {
            e.stopPropagation();
            setEditingLeadId(row.lead_id);
            setNewLead({ ...row });
            setShowNew(true);
          }}>
            <Edit2 size={15} />
          </button>
          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(row.lead_id); }}>
            <Trash2 size={15} />
          </button>
        </div>
      )},
  ];

  // ──────── Handlers ────────
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
    setNewLead({ ...EMPTY_LEAD });
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

  const handleDelete = (leadId) => {
    dispatch({ type: 'DELETE_LEAD', payload: leadId });
    setShowDeleteConfirm(null);
  };

  const getCurrencySymbol = (code) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).formatToParts(0).find(x => x.type === 'currency').value;
    } catch {
      return '$';
    }
  };
  const sym = getCurrencySymbol(newLead.currency_code);

  const openNewLead = () => {
    setEditingLeadId(null);
    setNewLead({ ...EMPTY_LEAD });
    setApproxRate('');
    setShowNew(true);
  };

  const closeModal = () => {
    setShowNew(false);
    setEditingLeadId(null);
    setNewLead({ ...EMPTY_LEAD });
    setApproxRate('');
  };

  const activeLocations = useMemo(() => {
    return Object.values(LOCATIONS).filter(loc => {
      if (newLead.transport_mode === 'AIR') return loc.type === 'Airport';
      if (newLead.transport_mode === 'SEA') return loc.type === 'Seaport';
      if (newLead.transport_mode === 'ROAD') return loc.type === 'City' || loc.type === 'Warehouse';
      return true;
    });
  }, [newLead.transport_mode]);

  const originCtry = getLocationCountry(newLead.origin_location);
  const destCtry = getLocationCountry(newLead.destination_location);
  const isDomestic = originCtry && destCtry && originCtry === destCtry;
  const showRouteType = originCtry && destCtry;

  // ──────── RENDER ────────
  return (
    <div className={styles.pageWrapper} style={{ '--primary': '#14B8A6', '--primary-tint': 'rgba(20, 184, 166, 0.1)' }}>
      <div className={styles.page}>

        {/* ══════ HEADER ══════ */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Leads</h1>
            <p className={styles.subtitle}>Manage, qualify and convert your freight forwarding opportunities.</p>
          </div>
          <Button icon={Plus} onClick={openNewLead}>New Lead</Button>
        </div>

        {/* ══════ KPI CARDS ══════ */}
        <div className={styles.kpiRow}>
          <div className={`${styles.kpiCard} ${kpiFilter === null ? styles.kpiActive : ''}`} onClick={() => setKpiFilter(null)}>
            <div className={styles.kpiValue}>{kpis.total}</div>
            <div className={styles.kpiLabel}>Total Leads</div>
          </div>
          <div className={`${styles.kpiCard} ${kpiFilter === 'new' ? styles.kpiActive : ''}`} onClick={() => setKpiFilter(kpiFilter === 'new' ? null : 'new')}>
            <div className={styles.kpiValue}><span className={styles.kpiDot} style={{ background: '#60a5fa' }} />{kpis.new}</div>
            <div className={styles.kpiLabel}>New</div>
          </div>
          <div className={`${styles.kpiCard} ${kpiFilter === 'qualifying' ? styles.kpiActive : ''}`} onClick={() => setKpiFilter(kpiFilter === 'qualifying' ? null : 'qualifying')}>
            <div className={styles.kpiValue}><span className={styles.kpiDot} style={{ background: '#f59e0b' }} />{kpis.qualifying}</div>
            <div className={styles.kpiLabel}>In Progress</div>
          </div>
          <div className={`${styles.kpiCard} ${kpiFilter === 'converted' ? styles.kpiActive : ''}`} onClick={() => setKpiFilter(kpiFilter === 'converted' ? null : 'converted')}>
            <div className={styles.kpiValue}><span className={styles.kpiDot} style={{ background: '#14B8A6' }} />{kpis.converted}</div>
            <div className={styles.kpiLabel}>Converted</div>
          </div>
          <div className={`${styles.kpiCard} ${kpiFilter === 'lost' ? styles.kpiActive : ''}`} onClick={() => setKpiFilter(kpiFilter === 'lost' ? null : 'lost')}>
            <div className={styles.kpiValue}><span className={styles.kpiDot} style={{ background: '#f43f5e' }} />{kpis.lost}</div>
            <div className={styles.kpiLabel}>Lost</div>
          </div>
        </div>

        {/* ══════ TABLE (Desktop) ══════ */}
        {filteredLeads.length > 0 ? (
          <>
            <div className={styles.tableContainer}>
              <DataTable
                columns={columns}
                data={filteredLeads}
                onRowClick={(row) => router.push(`/crm/leads/${row.lead_id}`)}
                searchPlaceholder="Search by company, contact, phone or email..."
                filters={[
                  { key: 'status', label: 'Status', options: LEAD_STATUSES },
                  { key: 'source', label: 'Source', options: LEAD_SOURCES },
                  { key: 'cargo_type', label: 'Cargo', options: CARGO_TYPES },
                ]}
              />
            </div>

            {/* ══════ MOBILE CARDS ══════ */}
            <div className={styles.mobileCards}>
              {filteredLeads.map(lead => (
                <div key={lead.lead_id} className={styles.mobileCard} onClick={() => router.push(`/crm/leads/${lead.lead_id}`)}>
                  <div className={styles.mobileCardHeader}>
                    <div>
                      <div className={styles.mobileCardCompany}>{lead.company_name}</div>
                      <div className={styles.mobileCardContact}>{lead.first_name ? `${lead.first_name} ${lead.last_name || ''}` : lead.contact_name || ''}</div>
                    </div>
                    <Badge variant={getStatusColor(lead.status)} dot>{lead.status}</Badge>
                  </div>
                  {newLead.origin_location || newLead.destination_location ? (
                    <div className={styles.tradeLaneCell} style={{ marginBottom: '4px' }}>
                      <span className={styles.tradeLaneCode}>{getLocationName(lead.origin_location)}</span><span className={styles.tradeLaneArrow}>→</span><span className={styles.tradeLaneCode}>{getLocationName(lead.destination_location)}</span>
                    </div>
                  ) : null}
                  <div className={styles.mobileCardMeta}>
                    {lead.cargo_type && <span>{lead.cargo_type}</span>}
                    {lead.est_pieces > 0 && <span>{lead.est_pieces} pcs</span>}
                    {lead.est_gross_weight_kg > 0 && <span>{formatWeight(lead.est_gross_weight_kg)}</span>}
                    <span style={{ marginLeft: 'auto' }}>{formatDate(lead.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Target size={28} /></div>
            <h3 className={styles.emptyTitle}>{kpiFilter ? 'No matching leads' : 'No leads yet'}</h3>
            <p className={styles.emptyDesc}>
              {kpiFilter ? 'Try adjusting your filters or clear the selection.' : 'Start capturing your freight forwarding opportunities and manage them from one place.'}
            </p>
            {!kpiFilter && <Button icon={Plus} onClick={openNewLead}>Create New Lead</Button>}
            {kpiFilter && <Button variant="secondary" onClick={() => setKpiFilter(null)}>Clear Filter</Button>}
          </div>
        )}

        {/* ══════ CREATE / EDIT MODAL ══════ */}
        <Modal
          open={showNew}
          onClose={closeModal}
          title={editingLeadId ? 'Edit Lead' : 'Create New Lead'}
          subtitle={editingLeadId ? 'Update lead details' : 'Capture a new freight forwarding opportunity'}
          size="large"
          footer={
            <>
              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button onClick={handleCreateOrUpdate} disabled={!newLead.company_name.trim()}>{editingLeadId ? 'Save Changes' : 'Create Lead'}</Button>
            </>
          }
        >
          <div className={styles.form}>
            {/* Section A: Company & Contact */}
            <div className={styles.formSectionTitle}>Company & Contact</div>
            <div className="form-row">
              <div className="form-group" style={{ position: 'relative', flex: 2 }}>
                <label className="form-label">Company Name <span style={{ color: '#f43f5e' }}>*</span></label>
                <input className="form-input" value={newLead.company_name} onFocus={() => setShowCompanyAutocomplete(true)} onBlur={() => setTimeout(() => setShowCompanyAutocomplete(false), 200)} onChange={e => setNewLead(p => ({ ...p, company_name: e.target.value }))} placeholder="Company name" />
                {showCompanyAutocomplete && newLead.company_name && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', zIndex: 10, maxHeight: '150px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                    {state.organizations.filter(a => a.legal_name.toLowerCase().includes(newLead.company_name.toLowerCase())).map((a, aIdx) => (
                      <div key={a.org_id || aIdx} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', fontSize: '14px', fontWeight: 500 }} onClick={() => { setNewLead(p => ({ ...p, company_name: a.legal_name })); setShowCompanyAutocomplete(false); }}>
                        {a.legal_name}
                      </div>
                    ))}
                    {state.organizations.filter(a => a.legal_name.toLowerCase().includes(newLead.company_name.toLowerCase())).length === 0 && (
                      <div style={{ padding: '10px 14px', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>New Account will be created</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name <span style={{ color: '#f43f5e' }}>*</span></label>
                <input className="form-input" value={newLead.first_name} onChange={e => setNewLead(p => ({ ...p, first_name: e.target.value }))} placeholder="First name" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name <span style={{ color: '#f43f5e' }}>*</span></label>
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

            {/* Section B: Lead Information */}
            <div className={styles.formSectionTitle}>Lead Information</div>
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
                <label className="form-label">Transport Mode</label>
                <select className="form-select" value={newLead.transport_mode} onChange={e => setNewLead(p => ({ ...p, transport_mode: e.target.value, origin_location: '', destination_location: '' }))}>
                  {TRANSPORT_MODES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Route Type</label>
                <div style={{ height: '42px', display: 'flex', alignItems: 'center', padding: '0 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  {showRouteType ? <Badge variant={isDomestic ? 'neutral' : 'primary'} dot>{isDomestic ? 'Domestic' : 'International'}</Badge> : <span style={{ color: '#94A3B8', fontSize: '14px' }}>Select origin & destination</span>}
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Origin Location</label>
                <AsyncLocationSelect value={newLead.origin_location} onChange={val => setNewLead(p => ({ ...p, origin_location: val }))} placeholder="Search any city..." />
              </div>
              <div className="form-group">
                <label className="form-label">Destination Location</label>
                <AsyncLocationSelect value={newLead.destination_location} onChange={val => setNewLead(p => ({ ...p, destination_location: val }))} placeholder="Search any city..." />
              </div>
            </div>
            <div className="form-row">
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

            {/* Section C: Shipment Details */}
            <div className={styles.formSectionTitle}>Shipment Details</div>
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

          </div>
        </Modal>

        {/* ══════ DELETE CONFIRMATION MODAL ══════ */}
        <Modal
          open={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          title="Delete Lead"
          subtitle="This action cannot be undone."
          size="small"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDelete(showDeleteConfirm)}>Delete Lead</Button>
            </>
          }
        >
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Are you sure you want to permanently delete this lead? All associated data will be removed.
          </p>
        </Modal>
      </div>
    </div>
  );
}