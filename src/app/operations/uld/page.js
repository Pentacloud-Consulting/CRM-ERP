'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import { Plus, Edit2, Eye, Trash2, Box, Package, Activity, Compass, Target, Navigation, ShieldCheck, LayoutGrid, List, Plane } from 'lucide-react';
import { formatDate, formatWeight } from '@/lib/utils/formatters';
import { LOCATIONS, TRANSPORT_MODES, CONTAINER_TYPES, TRUCK_TYPES } from '@/lib/data/seedData';
import AsyncLocationSelect from '@/components/ui/AsyncLocationSelect';
import { getLocationName } from '@/app/crm/leads/page';
import styles from './uld.module.css';

const ULD_STATUS_ORDER = ['Available', 'Build-Up in Progress', 'Built-Up', 'Loaded', 'In Transit', 'Delivered'];

const ULD_TYPES = [
  { code: 'AKE', name: 'LD3 Container' },
  { code: 'PMC', name: 'P6P Pallet' },
  { code: 'PAG', name: 'P1P Pallet' },
  { code: 'ALF', name: 'LD6 Container' },
  { code: 'AMP', name: 'LD29 Container' },
  { code: 'RAP', name: 'Cooltainer' }
];

export default function ULDPage() {
  const router = useRouter();
  const { state, dispatch, getULDTotalAllocatedWeight } = useApp();
  const [viewMode, setViewMode] = useState('kanban');
  
  const [showNew, setShowNew] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [newULD, setNewULD] = useState({
    uld_number: '', uld_type: 'AKE', owner_id: '', tare_weight_kg: '', max_gross_weight_kg: '',
    current_location: '', status: 'Available', transport_mode: 'AIR'
  });
  const [showEdit, setShowEdit] = useState(false);
  const [editULD, setEditULD] = useState(null);

  const carriers = useMemo(() => state.organizations.filter(o => o.org_type === 'Carrier'), [state.organizations]);
  const airports = useMemo(() => Object.values(LOCATIONS).filter(l => l.type === 'Airport'), []);
  const seaports = useMemo(() => Object.values(LOCATIONS).filter(l => l.type === 'Seaport'), []);
  const allLocations = useMemo(() => Object.values(LOCATIONS), []);

  const columns = useMemo(() => {
    return ULD_STATUS_ORDER.map(status => ({
      status,
      ulds: state.ulds.filter(u => u.status === status),
    }));
  }, [state.ulds]);

  const metrics = useMemo(() => {
    let totalMax = 0;
    let totalAllocated = 0;
    
    state.ulds.forEach(u => {
      totalMax += (u.max_gross_weight_kg || 0) - (u.tare_weight_kg || 0);
      totalAllocated += getULDTotalAllocatedWeight(u.uld_id);
    });

    const activeUlds = state.ulds.filter(u => ['Build-Up in Progress', 'Built-Up', 'Loaded', 'In Transit'].includes(u.status)).length;
    const available = state.ulds.filter(u => u.status === 'Available').length;
    const transit = state.ulds.filter(u => u.status === 'In Transit').length;
    const utilPct = totalMax > 0 ? (totalAllocated / totalMax) * 100 : 0;

    return { total: state.ulds.length, active: activeUlds, available, transit, utilPct: Math.round(utilPct) };
  }, [state.ulds, getULDTotalAllocatedWeight]);

  const handleDragStart = (e, uldId) => {
    e.dataTransfer.setData('text/plain', uldId);
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const uldId = e.dataTransfer.getData('text/plain');
    if (uldId) {
      dispatch({ type: 'UPDATE_ULD', payload: { uld_id: uldId, status } });
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleCreate = () => {
    if (!newULD.uld_number.trim() || !newULD.owner_id) return;
    dispatch({ 
      type: 'CREATE_ULD', 
      payload: { 
        ...newULD, 
        tare_weight_kg: Number(newULD.tare_weight_kg) || 0,
        max_gross_weight_kg: Number(newULD.max_gross_weight_kg) || 0,
      } 
    });
    setShowNew(false);
    setNewULD({ uld_number: '', uld_type: 'AKE', owner_id: '', tare_weight_kg: '', max_gross_weight_kg: '', current_location: '', status: 'Available', transport_mode: 'AIR' });
  };

  const handleUpdate = () => {
    if (!editULD) return;
    dispatch({
      type: 'UPDATE_ULD',
      payload: { ...editULD, tare_weight_kg: Number(editULD.tare_weight_kg) || 0, max_gross_weight_kg: Number(editULD.max_gross_weight_kg) || 0 }
    });
    setShowEdit(false);
  };

  const handleDelete = (uldId) => {
    dispatch({ type: 'DELETE_ULD', payload: uldId });
    setShowDeleteConfirm(null);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Build-Up in Progress': return 'warning';
      case 'Built-Up': return 'primary';
      case 'Loaded': return 'violet';
      case 'In Transit': return 'blue';
      case 'Delivered': return 'neutral';
      default: return 'neutral';
    }
  };

  const statusColors = {
    'Available': '#10B981', // Emerald
    'Build-Up in Progress': '#F59E0B', // Amber
    'Built-Up': '#0EA5E9', // Sky
    'Loaded': '#8B5CF6', // Violet
    'In Transit': '#3B82F6', // Blue
    'Delivered': '#64748B', // Slate
  };

  const getColumnGradient = (status) => {
    switch (status) {
      case 'Available': return 'linear-gradient(90deg, #10B981, #34D399)';
      case 'Build-Up in Progress': return 'linear-gradient(90deg, #F59E0B, #FBBF24)';
      case 'Built-Up': return 'linear-gradient(90deg, #0EA5E9, #38BDF8)';
      case 'Loaded': return 'linear-gradient(90deg, #8B5CF6, #A78BFA)';
      case 'In Transit': return 'linear-gradient(90deg, #3B82F6, #60A5FA)';
      case 'Delivered': return 'linear-gradient(90deg, #64748B, #94A3B8)';
      default: return 'linear-gradient(90deg, #CBD5E1, #E2E8F0)';
    }
  };

  const listColumns = [
    { key: 'number', label: 'EQUIPMENT NUMBER', accessor: 'uld_number', render: (row) => <span className={styles.uldNumberCell}>{row.uld_number}</span> },
    { key: 'type', label: 'TYPE', accessor: 'uld_type', render: (row) => <Badge variant="neutral">{row.uld_type}</Badge> },
    { key: 'owner', label: 'OWNER', accessor: 'owner_id', render: (row) => {
      const org = carriers.find(c => c.org_id === row.owner_id);
      return <span style={{ fontWeight: 800, color: '#6366F1' }}>{org?.legal_name || row.owner_id}</span>
    }},
    { key: 'location', label: 'LOCATION', accessor: 'current_location', render: (row) => <span style={{ fontWeight: 600 }} title={getLocationName(row.current_location)}>{getLocationName(row.current_location)}</span> },
    { key: 'capacity', label: 'UTILIZATION', accessor: 'utilization', render: (row) => {
        const allocated = getULDTotalAllocatedWeight(row.uld_id);
        const maxPayload = Math.max(0, (row.max_gross_weight_kg || 0) - (row.tare_weight_kg || 0));
        const pct = maxPayload > 0 ? Math.min(100, Math.round((allocated / maxPayload) * 100)) : 0;
        let capColor = '#10B981';
        if (pct > 60) capColor = '#F59E0B';
        if (pct > 85) capColor = '#F43F5E';
        return (
          <div className={styles.listCapacityCell}>
            <div className={styles.capHeader}>
              <span className={styles.capPct} style={{ color: capColor, fontSize: '12px' }}>{pct}%</span>
              <span className={styles.capDetails} style={{ fontSize: '10px' }}>{formatWeight(allocated)} / {formatWeight(maxPayload)}</span>
            </div>
            <div className={styles.capTrack}>
              <div className={styles.capFill} style={{ width: `${pct}%`, backgroundColor: capColor }} />
            </div>
          </div>
        );
    }},
    { key: 'status', label: 'STATUS', accessor: 'status', render: (row) => <Badge variant={getStatusBadgeVariant(row.status)} dot>{row.status}</Badge> },
    { key: 'updated', label: 'UPDATED', accessor: 'updated_at', render: (row) => <span style={{ fontSize: '12px', color: '#64748B' }}>{row.updated_at ? formatDate(row.updated_at) : 'Just now'}</span> },
    { key: 'actions', label: '', accessor: 'actions', align: 'right', render: (row) => (
      <div className={styles.listActionButtons}>
        <button className={styles.listActionBtn} title="View Details" onClick={(e) => { e.stopPropagation(); router.push(`/operations/uld/${row.uld_id}`); }}>
          <Eye size={16} />
        </button>
        <button className={styles.listActionBtn} title="Edit" onClick={(e) => { e.stopPropagation(); setEditULD(row); setShowEdit(true); }}>
          <Edit2 size={16} />
        </button>
        <button className={`${styles.listActionBtn} ${styles.deleteBtn}`} title="Delete" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(row.uld_id); }}>
          <Trash2 size={16} />
        </button>
      </div>
    )}
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.page}>
        
        {/* ══════ HERO & COMMAND CENTER ══════ */}
        <div className={styles.heroHeader}>
          <div className={styles.heroLeft}>
            <div className={styles.titleRow}>
              <div className={styles.titleIcon}>
                <Box size={32} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 className={styles.title}>Equipment Control Center</h1>
                  <Badge variant="blue"><Plane size={12} style={{marginRight: 4}}/> Multi-Modal Network</Badge>
                </div>
                <p className={styles.subtitle}>
                  <ShieldCheck size={16} color="#10B981" />
                  Live equipment tracking, capacity planning, and consolidation.
                </p>
              </div>
            </div>
          </div>
          <div className={styles.heroActions}>
            <Button variant="secondary" icon={Activity}>Export Report</Button>
            <Button icon={Plus} onClick={() => setShowNew(true)} style={{ background: '#0F172A', color: 'white', border: 'none' }}>New Equipment</Button>
          </div>
        </div>

        {/* ══════ 3D OPERATIONS DASHBOARD ══════ */}
        <div className={styles.opsDashboard}>
          <div className={styles.opsMetric}>
            <div className={styles.metricLabel}><Package size={14} /> Total Equipment</div>
            <div className={styles.metricValue}>{metrics.total}</div>
          </div>
          <div className={styles.opsMetric}>
            <div className={styles.metricLabel}><Target size={14} /> Available</div>
            <div className={styles.metricValue}>{metrics.available}</div>
          </div>
          <div className={styles.opsMetric}>
            <div className={styles.metricLabel}><Activity size={14} /> Active Build-Up</div>
            <div className={styles.metricValue}>{metrics.active}</div>
          </div>
          <div className={styles.opsMetric}>
            <div className={styles.metricLabel}><Navigation size={14} /> In Transit</div>
            <div className={styles.metricValue}>{metrics.transit}</div>
          </div>
          <div className={styles.opsMetric} style={{ gridColumn: 'span 2' }}>
            <div className={styles.metricLabel}><Compass size={14} /> Global Capacity Utilization</div>
            <div className={styles.metricValue}>{metrics.utilPct}%</div>
            <div className={styles.metricTrend}>Network health is optimal</div>
          </div>
        </div>

        {/* ══════ VIEW SEGMENTED TOGGLE ══════ */}
        <div className={styles.viewToggle}>
          <button 
            className={`${styles.viewToggleBtn} ${viewMode === 'kanban' ? styles.active : ''}`}
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid size={16} /> Kanban View
          </button>
          <button 
            className={`${styles.viewToggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={16} /> List View
          </button>
        </div>

        {/* ══════ CONDITIONAL RENDER: BOARD OR LIST ══════ */}
        {viewMode === 'kanban' ? (
          <div className={styles.boardContainer}>
            <div className={styles.board}>
              {columns.map(({ status, ulds }) => {
                const totalAllocatedInStatus = ulds.reduce((sum, u) => sum + getULDTotalAllocatedWeight(u.uld_id), 0);
                
                return (
                  <div key={status} className={styles.column} onDrop={(e) => handleDrop(e, status)} onDragOver={handleDragOver}>
                    <div className={styles.columnBorder} style={{ background: getColumnGradient(status) }} />
                    <div className={styles.columnHeader}>
                      <div className={styles.columnHeaderTop}>
                        <div className={styles.columnDot} style={{ background: statusColors[status] || '#94A3B8' }} />
                        <div className={styles.columnTitle}>{status}</div>
                      </div>
                      
                      <div className={styles.columnStats}>
                        <div className={styles.statBlock}>
                          <span className={styles.statValue}>{ulds.length}</span>
                          <span className={styles.statLabel}>UNITS</span>
                        </div>
                        <div className={`${styles.statBlock} ${styles.right}`}>
                          <span className={styles.statValue}>{formatWeight(totalAllocatedInStatus)}</span>
                          <span className={styles.statLabel}>Allocated</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.columnBody}>
                      {ulds.map(uld => {
                        const org = carriers.find(c => c.org_id === uld.owner_id);
                        const allocatedWeight = getULDTotalAllocatedWeight(uld.uld_id);
                        const maxWeight = uld.max_gross_weight_kg || 0;
                        const tare = uld.tare_weight_kg || 0;
                        const maxPayload = Math.max(0, maxWeight - tare);
                        const usedPct = maxPayload > 0 ? Math.min(100, Math.round((allocatedWeight / maxPayload) * 100)) : 0;
                        const availableWeight = Math.max(0, maxPayload - allocatedWeight);

                        let capColor = '#10B981'; // green
                        if (usedPct > 60) capColor = '#F59E0B'; // amber
                        if (usedPct > 85) capColor = '#F43F5E'; // red

                        return (
                          <div key={uld.uld_id} className={styles.card} draggable onDragStart={(e) => handleDragStart(e, uld.uld_id)}>
                            <div className={styles.cardTop}>
                              <div className={styles.uldId}>{uld.uld_number}</div>
                              <div className={styles.cardActions}>
                                <Edit2 size={14} className={styles.actionIcon} onClick={(e) => { e.stopPropagation(); setEditULD(uld); setShowEdit(true); }} />
                              </div>
                            </div>

                            <div className={styles.cardMeta}>
                              <div className={styles.metaRow}>
                                <span className={styles.metaLabel}>Type</span>
                                <span className={styles.metaValue}><Badge variant="neutral">{uld.uld_type}</Badge></span>
                              </div>
                              <div className={styles.metaRow}>
                                <span className={styles.metaLabel}>Owner</span>
                                <span className={styles.metaValue}><span className={styles.ownerLogo}>{org?.legal_name || uld.owner_id}</span></span>
                              </div>
                              <div className={styles.metaRow}>
                                <span className={styles.metaLabel}>Location</span>
                                <span className={styles.metaValue} title={getLocationName(uld.current_location)}>{getLocationName(uld.current_location)}</span>
                              </div>
                            </div>

                            <div className={styles.capacitySection}>
                              <div className={styles.capHeader}>
                                <span className={styles.capPct} style={{ color: capColor }}>{usedPct}%</span>
                                <span className={styles.capDetails}>{formatWeight(allocatedWeight)} / {formatWeight(maxPayload)}</span>
                              </div>
                              <div className={styles.capTrack}>
                                <div className={styles.capFill} style={{ width: `${usedPct}%`, backgroundColor: capColor }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {ulds.length === 0 && (
                        <div className={styles.emptyCol}>
                          <div className={styles.emptyTitle}>No Equipment in {status}</div>
                          <div className={styles.emptySubtitle}>Drag items here to change their operational status.</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.listContainer}>
            <DataTable 
              columns={listColumns} 
              data={state.ulds} 
              searchPlaceholder="Search by ULD number, owner, or location..."
              filters={[
                { key: 'status', label: 'Status', options: ULD_STATUS_ORDER },
                { key: 'uld_type', label: 'Type', options: ULD_TYPES.map(t => t.code) },
              ]}
              onRowClick={(row) => { setEditULD(row); setShowEdit(true); }}
            />
          </div>
        )}

      {/* ══════ CREATE / EDIT MODALS ══════ */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Register Equipment"
        subtitle="Add a new container, trailer, or ULD to the network"
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newULD.uld_number.trim() || !newULD.owner_id} style={{ background: '#0F172A', borderColor: '#0F172A' }}>Register Equipment</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
          
          <div className={styles.formSection}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px' }}>Identification</div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Transport Mode <span style={{ color: '#f43f5e' }}>*</span></label>
              <select className="form-select" value={newULD.transport_mode} onChange={e => setNewULD(p => ({ ...p, transport_mode: e.target.value, uld_type: e.target.value === 'SEA' ? '20GP' : e.target.value === 'ROAD' ? 'FTL' : 'AKE' }))}>
                {TRANSPORT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label">{newULD.transport_mode === 'AIR' ? 'ULD Number' : newULD.transport_mode === 'SEA' ? 'Container Number' : 'Trailer/Vehicle Number'} <span style={{ color: '#f43f5e' }}>*</span></label>
                <input className="form-input" style={{ fontSize: '16px', fontWeight: 'bold' }} value={newULD.uld_number} onChange={e => setNewULD(p => ({ ...p, uld_number: e.target.value }))} placeholder={newULD.transport_mode === 'AIR' ? "e.g. AKE12345QR" : "e.g. TCNU1234567"} />
              </div>
              <div className="form-group">
                <label className="form-label">{newULD.transport_mode === 'AIR' ? 'ULD Type' : newULD.transport_mode === 'SEA' ? 'Container Type' : 'Vehicle Type'}</label>
                <select className="form-select" value={newULD.uld_type} onChange={e => setNewULD(p => ({ ...p, uld_type: e.target.value }))}>
                  {newULD.transport_mode === 'AIR' && ULD_TYPES.map(t => <option key={t.code} value={t.code}>{t.code} ({t.name})</option>)}
                  {newULD.transport_mode === 'SEA' && CONTAINER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  {newULD.transport_mode === 'ROAD' && TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">{newULD.transport_mode === 'AIR' ? 'Owner Airline' : newULD.transport_mode === 'SEA' ? 'Shipping Line' : 'Trucking Company'} <span style={{ color: '#f43f5e' }}>*</span></label>
              <select className="form-select" value={newULD.owner_id} onChange={e => setNewULD(p => ({ ...p, owner_id: e.target.value }))}>
                <option value="">Select Carrier...</option>
                {carriers.filter(c => (c.carrier_type || 'Airline') === (newULD.transport_mode === 'SEA' ? 'Shipping Line' : newULD.transport_mode === 'ROAD' ? 'Trucking Company' : 'Airline')).map(c => <option key={c.org_id} value={c.org_id}>{c.code ? c.code + ' - ' : ''}{c.legal_name}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.formSection}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px' }}>Operational Specs</div>
            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label">{newULD.transport_mode === 'AIR' ? 'Current Airport' : newULD.transport_mode === 'SEA' ? 'Current Seaport' : 'Current Location'}</label>
                <AsyncLocationSelect
                  value={newULD.current_location}
                  onChange={val => setNewULD(p => ({ ...p, current_location: val }))}
                  placeholder="Type location to search..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Initial Status</label>
                <select className="form-select" value={newULD.status} onChange={e => setNewULD(p => ({ ...p, status: e.target.value }))}>
                  {ULD_STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.formGrid} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Tare Weight (kg)</label>
                <input className="form-input" type="number" step="0.1" value={newULD.tare_weight_kg} onChange={e => setNewULD(p => ({ ...p, tare_weight_kg: e.target.value }))} placeholder="0.0" />
              </div>
              <div className="form-group">
                <label className="form-label">Max Gross Weight (kg)</label>
                <input className="form-input" type="number" step="0.1" value={newULD.max_gross_weight_kg} onChange={e => setNewULD(p => ({ ...p, max_gross_weight_kg: e.target.value }))} placeholder="0.0" />
              </div>
            </div>
          </div>

        </div>
      </Modal>

      {/* ══════ DELETE CONFIRMATION MODAL ══════ */}
      <Modal
        open={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Equipment?"
        subtitle="This action cannot be undone."
        size="small"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleDelete(showDeleteConfirm)}>Delete</Button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
          Are you sure you want to delete this equipment? This action cannot be undone and will remove it from the system.
        </p>
      </Modal>

      {/* ══════ EDIT MODAL ══════ */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Equipment"
        subtitle={`Update operational details for ${editULD?.uld_number}`}
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleUpdate} style={{ background: '#0F172A', borderColor: '#0F172A' }}>Save Changes</Button>
          </>
        }
      >
        {editULD && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
            <div className={styles.formSection}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px' }}>Identification</div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Transport Mode <span style={{ color: '#f43f5e' }}>*</span></label>
                <select className="form-select" value={editULD.transport_mode || 'AIR'} onChange={e => setEditULD(p => ({ ...p, transport_mode: e.target.value, uld_type: e.target.value === 'SEA' ? '20GP' : e.target.value === 'ROAD' ? 'FTL' : 'AKE' }))}>
                  {TRANSPORT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label">{editULD.transport_mode === 'AIR' ? 'ULD Number' : editULD.transport_mode === 'SEA' ? 'Container Number' : 'Trailer/Vehicle Number'} <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input className="form-input" style={{ background: '#F1F5F9' }} value={editULD.uld_number} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">{editULD.transport_mode === 'AIR' ? 'ULD Type' : editULD.transport_mode === 'SEA' ? 'Container Type' : 'Vehicle Type'}</label>
                  <select className="form-select" value={editULD.uld_type} onChange={e => setEditULD(p => ({ ...p, uld_type: e.target.value }))}>
                    {(!editULD.transport_mode || editULD.transport_mode === 'AIR') && ULD_TYPES.map(t => <option key={t.code} value={t.code}>{t.code} ({t.name})</option>)}
                    {editULD.transport_mode === 'SEA' && CONTAINER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    {editULD.transport_mode === 'ROAD' && TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label">{editULD.transport_mode === 'AIR' ? 'Owner Airline' : editULD.transport_mode === 'SEA' ? 'Shipping Line' : 'Trucking Company'} <span style={{ color: '#f43f5e' }}>*</span></label>
                <select className="form-select" value={editULD.owner_id || ''} onChange={e => setEditULD(p => ({ ...p, owner_id: e.target.value }))}>
                  <option value="">Select Carrier...</option>
                  {carriers.filter(c => (c.carrier_type || 'Airline') === (editULD.transport_mode === 'SEA' ? 'Shipping Line' : editULD.transport_mode === 'ROAD' ? 'Trucking Company' : 'Airline')).map(c => <option key={c.org_id} value={c.org_id}>{c.code ? c.code + ' - ' : ''}{c.legal_name}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.formSection}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px' }}>Operational Specs</div>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label">{editULD.transport_mode === 'AIR' ? 'Current Airport' : editULD.transport_mode === 'SEA' ? 'Current Seaport' : 'Current Location'}</label>
                  <AsyncLocationSelect
                    value={editULD.current_location || ''}
                    onChange={val => setEditULD(p => ({ ...p, current_location: val }))}
                    placeholder="Type location to search..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Status</label>
                  <select className="form-select" value={editULD.status} onChange={e => setEditULD(p => ({ ...p, status: e.target.value }))}>
                    {ULD_STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formGrid} style={{ marginTop: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Tare Weight (kg)</label>
                  <input className="form-input" type="number" step="0.1" value={editULD.tare_weight_kg} onChange={e => setEditULD(p => ({ ...p, tare_weight_kg: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Gross Weight (kg)</label>
                  <input className="form-input" type="number" step="0.1" value={editULD.max_gross_weight_kg} onChange={e => setEditULD(p => ({ ...p, max_gross_weight_kg: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      </div>
    </div>
  );
}
