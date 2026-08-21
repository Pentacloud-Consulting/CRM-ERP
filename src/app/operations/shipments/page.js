'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import TrackingMap from '@/components/ui/TrackingMap';
import { 
  Plus, Edit2, Trash2, Eye, PlaneTakeoff, Ship, Truck, Package, 
  Weight, CircleDollarSign, Activity, AlertTriangle, ShieldAlert,
  Clock, CheckCircle2, TrendingUp, Navigation, BarChart3, FileText, UploadCloud, MapPin, Globe
} from 'lucide-react';
import { formatDate, formatWeight, getStatusColor } from '@/lib/utils/formatters';
import { SHIPMENT_STATUSES, SERVICE_TYPES, CARGO_TYPES, INCOTERMS, INCOTERM_LABELS, LOCATIONS, TRANSPORT_MODES } from '@/lib/data/seedData';
import AsyncLocationSelect from '@/components/ui/AsyncLocationSelect';
import { getLocationName } from '@/app/crm/leads/page';
import styles from './shipments.module.css';
 
export default function ShipmentsPage() {
  const router = useRouter();
  const { state, dispatch, getOrganization } = useApp();
  
  // Wizard State
  const [showNew, setShowNew] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newShipment, setNewShipment] = useState({
    shipment_reference: '', org_id: '', transport_mode: 'AIR', service_type: 'Port-to-Port',
    origin_location: '', destination_location: '', incoterm: 'FOB', cargo_type: 'General',
    special_handling_codes: '', pieces: '', gross_weight_kg: '', volume_cbm: '', status: 'Booked',
    // Mode-specific optional UI fields
    container_count: '', container_type: '',
    truck_type: '',
  });

  const getOrg = (id) => state.organizations.find(a => a.org_id === id);
  const getContact = (id) => state.contacts.find(c => c.contact_id === id);

  // --- KPI & Pipeline Calculations ---
  const kpis = useMemo(() => {
    let totalWgt = 0;
    const s = state.shipments;
    s.forEach(x => totalWgt += (x.chargeable_weight_kg || x.gross_weight_kg || 0));
    return {
      total: s.length,
      transit: s.filter(x => x.status === 'In Transit').length,
      delivered: s.filter(x => ['Delivered', 'POD Confirmed'].includes(x.status)).length,
      holds: s.filter(x => x.status === 'Customs Hold' || x.status === 'Exception').length,
      weight: totalWgt,
      revenue: totalWgt * 4.50, // Mock calculation
      onTime: 98.4,
      routes: 14
    };
  }, [state.shipments]);

  const pipeline = useMemo(() => {
    const s = state.shipments;
    return {
      booked: s.filter(x => ['Booked', 'Documentation'].includes(x.status)).length,
      loaded: s.filter(x => ['Built-Up', 'Loaded', 'Ready for Carriage'].includes(x.status)).length,
      transit: s.filter(x => x.status === 'In Transit').length,
      delivered: s.filter(x => ['Delivered', 'POD Confirmed'].includes(x.status)).length
    };
  }, [state.shipments]);

  // --- Table Configuration ---
  const columns = [
    { key: 'ref', label: 'Reference', accessor: 'shipment_reference',
      render: (row) => <span className={styles.ref}>{row.shipment_reference}</span> },
    { key: 'mode', label: 'Mode', accessor: 'transport_mode', width: '80px',
      render: (row) => (
        <Badge variant="neutral">
          {row.transport_mode === 'AIR' && <PlaneTakeoff size={12} style={{marginRight: 4}}/>}
          {row.transport_mode === 'SEA' && <Ship size={12} style={{marginRight: 4}}/>}
          {row.transport_mode === 'ROAD' && <Truck size={12} style={{marginRight: 4}}/>}
          {row.transport_mode}
        </Badge>
      )},
    { key: 'status', label: 'Status', accessor: 'status', width: '130px',
      render: (row) => <Badge variant={getStatusColor(row.status)} dot>{row.status}</Badge> },
    { key: 'org', label: 'Customer', accessor: row => getOrganization(row.org_id)?.legal_name,
      render: (row) => {
        const org = getOrganization(row.org_id);
        const contact = getContact(row.shipper_contact_id || row.consignee_contact_id || row.contact_id) || state.contacts.find(c => c.org_id === row.org_id);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>{org?.legal_name || '—'}</span>
            <span style={{ fontSize: '11px', color: '#64748B' }}>{contact?.full_name || '—'}</span>
          </div>
        );
      } 
    },
    { key: 'route', label: 'Route', accessor: row => `${row.origin_location}–${row.destination_location}`,
      render: (row) => (
        <span className={styles.route}>
          <span className={styles.airport}>{getLocationName(row.origin_location)}</span>
          <span className={styles.routeArrow}>→</span>
          <span className={styles.airport}>{getLocationName(row.destination_location)}</span>
        </span>
      ) },
    { key: 'cargo', label: 'Cargo', accessor: 'cargo_type', render: (row) => <span className={styles.cargoType}>{row.cargo_type}</span> },
    { key: 'weight', label: 'Weight', accessor: 'gross_weight_kg', align: 'right',
      render: (row) => <span className="tabular-nums font-mono">{formatWeight(row.gross_weight_kg)}</span> },
    { key: 'actions', label: '', accessor: 'actions', align: 'right', width: '60px',
      render: (row) => (
        <button style={{background:'transparent', border:'none', color:'#94A3B8', cursor:'pointer'}} title="Delete" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_SHIPMENT', payload: row.shipment_id }); }}>
          <Trash2 size={16} />
        </button>
      )
    },
  ];

  const handleCreate = () => {
    if (!newShipment.shipment_reference.trim() || !newShipment.org_id) return;
    dispatch({ 
      type: 'CREATE_SHIPMENT', 
      payload: { 
        ...newShipment, 
        special_handling_codes: newShipment.special_handling_codes.split(',').map(s => s.trim()).filter(Boolean),
        pieces: Number(newShipment.pieces) || 0,
        gross_weight_kg: Number(newShipment.gross_weight_kg) || 0,
        volume_cbm: Number(newShipment.volume_cbm) || 0,
        container_count: Number(newShipment.container_count) || 0,
        chargeable_weight_kg: Math.max(Number(newShipment.gross_weight_kg) || 0, (Number(newShipment.volume_cbm) || 0) * 167)
      } 
    });
    setShowNew(false);
    setWizardStep(1);
    setNewShipment({ shipment_reference: '', org_id: '', transport_mode: 'AIR', service_type: 'Port-to-Port', origin_location: '', destination_location: '', incoterm: 'FOB', cargo_type: 'General', special_handling_codes: '', pieces: '', gross_weight_kg: '', volume_cbm: '', status: 'Booked', container_count: '', container_type: '', truck_type: '' });
  };

  const activeLocations = useMemo(() => {
    return Object.values(LOCATIONS).filter(loc => {
      if (newShipment.transport_mode === 'AIR') return loc.type === 'Airport';
      if (newShipment.transport_mode === 'SEA') return loc.type === 'Seaport';
      if (newShipment.transport_mode === 'ROAD') return loc.type === 'City' || loc.type === 'Warehouse';
      return true;
    });
  }, [newShipment.transport_mode]);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.dashboardContainer}>
        
        {/* ══════ HERO CONTROL CENTER ══════ */}
        <div className={styles.heroHeader}>
          <div className={styles.heroLeft}>
            <div className={styles.titleRow}>
              <div className={styles.titleIcon}>
                <Globe size={32} />
              </div>
              <div>
                <h1 className={styles.title}>Global Shipments</h1>
                <div className={styles.subtitle}>
                  <div className={styles.liveBadge}>
                    <div className={styles.pulseDot} /> LIVE
                  </div>
                  Multi-modal logistics pipeline & operations
                </div>
              </div>
            </div>
          </div>
          <div className={styles.heroActions}>
            <button className={styles.heroBtn}><UploadCloud size={16}/> Export Data</button>
            <button className={`${styles.heroBtn} ${styles.primary}`} onClick={() => setShowNew(true)}>
              <Plus size={16}/> New Shipment
            </button>
          </div>
        </div>

        <div className={styles.contentPadding}>
          {/* ══════ KPI DASHBOARD ══════ */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>Total Shipments</span>
                <Package size={18} className={styles.kpiIcon} style={{color: '#5B4DFF'}} />
              </div>
              <div className={styles.kpiValue}>{kpis.total}</div>
              <div className={`${styles.kpiTrend} ${styles.up}`}><TrendingUp size={12}/> +12% this week</div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>In Transit</span>
                <Globe size={18} className={styles.kpiIcon} style={{color: '#3B82F6'}} />
              </div>
              <div className={styles.kpiValue}>{kpis.transit}</div>
              <div className={`${styles.kpiTrend} ${styles.up}`}><TrendingUp size={12}/> Normal ops</div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>Delivered</span>
                <CheckCircle2 size={18} className={styles.kpiIcon} style={{color: '#10B981'}} />
              </div>
              <div className={styles.kpiValue}>{kpis.delivered}</div>
              <div className={`${styles.kpiTrend} ${styles.up}`}><TrendingUp size={12}/> +5% vs yesterday</div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>Est. Revenue</span>
                <CircleDollarSign size={18} className={styles.kpiIcon} style={{color: '#F59E0B'}} />
              </div>
              <div className={styles.kpiValue}>${(kpis.revenue).toLocaleString()}</div>
              <div className={`${styles.kpiTrend} ${styles.up}`}><TrendingUp size={12}/> Strong yield</div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>Total Weight</span>
                <Weight size={18} className={styles.kpiIcon} style={{color: '#E879F9'}} />
              </div>
              <div className={styles.kpiValue}>{formatWeight(kpis.weight)}</div>
              <div className={`${styles.kpiTrend} ${styles.up}`}><TrendingUp size={12}/> +200kg today</div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>Customs & Exceptions</span>
                <Activity size={18} className={styles.kpiIcon} style={{color: '#F43F5E'}} />
              </div>
              <div className={styles.kpiValue}>{kpis.holds}</div>
              <div className={`${styles.kpiTrend} ${kpis.holds === 0 ? styles.up : styles.down}`}><TrendingUp size={12}/> Requiring attention</div>
            </div>
          </div>

          {/* ══════ SHIPMENT PIPELINE ══════ */}
          <div className={styles.pipelineContainer}>
            <div className={`${styles.pipeStage} ${pipeline.booked > 0 ? styles.completed : ''}`}>
              <div className={styles.pipeDot}><FileText size={14}/></div>
              <span className={styles.pipeLabel}>Booked</span>
              <span className={styles.pipeCount}>{pipeline.booked} shipments</span>
            </div>
            <div className={`${styles.pipeStage} ${pipeline.loaded > 0 ? styles.active : ''}`}>
              <div className={styles.pipeDot}><Package size={14}/></div>
              <span className={styles.pipeLabel}>Loaded & Ready</span>
              <span className={styles.pipeCount}>{pipeline.loaded} shipments</span>
            </div>
            <div className={`${styles.pipeStage} ${pipeline.transit > 0 ? styles.active : ''}`}>
              <div className={styles.pipeDot}><Globe size={14}/></div>
              <span className={styles.pipeLabel}>In Transit</span>
              <span className={styles.pipeCount}>{pipeline.transit} shipments</span>
            </div>
            <div className={`${styles.pipeStage} ${pipeline.delivered > 0 ? styles.completed : ''}`}>
              <div className={styles.pipeDot}><CheckCircle2 size={14}/></div>
              <span className={styles.pipeLabel}>Delivered</span>
              <span className={styles.pipeCount}>{pipeline.delivered} shipments</span>
            </div>
          </div>

          {/* ══════ MAIN CONTENT SPLIT (Table / Map) ══════ */}
          <div className={styles.mainSplit}>
            <div className={styles.tablePanel}>
              <DataTable
                columns={columns}
                data={state.shipments}
                onRowClick={(row) => router.push(`/operations/shipments/${row.shipment_id}`)}
                searchPlaceholder="Search by reference, route, customer..."
                filters={[
                  { key: 'transport_mode', label: 'Mode', options: TRANSPORT_MODES },
                  { key: 'status', label: 'Status', options: SHIPMENT_STATUSES },
                  { key: 'cargo_type', label: 'Cargo', options: CARGO_TYPES },
                ]}
              />
            </div>
            
            <div className={styles.mapPanel}>
              {/* Note: The old TrackingMap expects airports. We will pass LOCATIONS, but filtering out non-Airports for now or updating the map later to handle multi-modal coords */}
              <TrackingMap shipments={state.shipments.filter(s => s.status !== 'Draft' && s.status !== 'Closed')} airports={LOCATIONS} />
              <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}><div style={{width: 8, height: 8, borderRadius: '50%', background: '#5B4DFF'}}/> Live Fleet</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}><div style={{width: 8, height: 8, borderRadius: '50%', background: '#10B981'}}/> Origin</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}><div style={{width: 8, height: 8, borderRadius: '50%', background: '#3B82F6'}}/> Dest</div>
              </div>
            </div>
          </div>

          {/* ══════ BOTTOM ROW: ANALYTICS & ALERTS ══════ */}
          <div className={styles.bottomGrid}>
            <div className={styles.alertsPanel} style={{ gridColumn: 'span 2' }}>
              <div className={styles.chartTitle} style={{fontSize: 16}}><ShieldAlert size={18} color="#F43F5E"/> Operations Alerts</div>
              <div className={styles.alertsList}>
                {kpis.holds > 0 && (
                  <div className={`${styles.alertItem} ${styles.danger}`}>
                    <AlertTriangle size={16} className={styles.alertIcon} />
                    <div className={styles.alertContent}>
                      <span className={styles.alertTitle}>{kpis.holds} Exceptions / Holds</span>
                      <span className={styles.alertDesc}>Action required for clearance or incident resolution.</span>
                    </div>
                  </div>
                )}
                {kpis.transit > 0 && (
                  <div className={`${styles.alertItem} ${styles.info}`}>
                    <Globe size={16} className={styles.alertIcon} />
                    <div className={styles.alertContent}>
                      <span className={styles.alertTitle}>{kpis.transit} Shipments in Transit</span>
                      <span className={styles.alertDesc}>Monitoring live multi-modal telemetry.</span>
                    </div>
                  </div>
                )}
                <div className={`${styles.alertItem} ${styles.success}`}>
                  <CheckCircle2 size={16} className={styles.alertIcon} />
                  <div className={styles.alertContent}>
                    <span className={styles.alertTitle}>Capacity Optimal</span>
                    <span className={styles.alertDesc}>No network bottlenecks detected.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ══════ MULTI-STEP WIZARD MODAL ══════ */}
        <Modal
          open={showNew}
          onClose={() => setShowNew(false)}
          title="New Shipment Entry"
          subtitle="PentaLogix Multi-Modal Booking Wizard"
          size="large"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
              <div style={{ display: 'flex', gap: 8 }}>
                {wizardStep > 1 && <Button variant="secondary" onClick={() => setWizardStep(p => p - 1)}>Back</Button>}
                {wizardStep < 3 ? (
                  <Button style={{ background: '#4F46E5', borderColor: '#4F46E5' }} onClick={() => setWizardStep(p => p + 1)}>Next Step</Button>
                ) : (
                  <Button style={{ background: '#10B981', borderColor: '#10B981' }} onClick={handleCreate} disabled={!newShipment.shipment_reference.trim() || !newShipment.org_id}>Submit Booking</Button>
                )}
              </div>
            </div>
          }
        >
          <div className={styles.wizardHeader}>
            <div className={`${styles.wizardStep} ${wizardStep === 1 ? styles.active : ''}`}><div className={styles.wizardNum}>1</div> Transport Mode</div>
            <div className={`${styles.wizardStep} ${wizardStep === 2 ? styles.active : ''}`}><div className={styles.wizardNum}>2</div> Cargo Details</div>
            <div className={`${styles.wizardStep} ${wizardStep === 3 ? styles.active : ''}`}><div className={styles.wizardNum}>3</div> Review & Terms</div>
          </div>

          {wizardStep === 1 && (
            <div className={styles.formSection}>
              <div className={styles.sectionTitle}><Globe size={16}/> Transport Mode Selection</div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <button 
                  onClick={() => setNewShipment(p => ({...p, transport_mode: 'AIR'}))}
                  style={{ flex: 1, padding: '24px', borderRadius: '12px', border: `2px solid ${newShipment.transport_mode === 'AIR' ? '#4F46E5' : '#E2E8F0'}`, background: newShipment.transport_mode === 'AIR' ? '#EEF2FF' : '#FFF', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
                >
                  <PlaneTakeoff size={32} color={newShipment.transport_mode === 'AIR' ? '#4F46E5' : '#94A3B8'} />
                  <span style={{ fontWeight: 600, color: newShipment.transport_mode === 'AIR' ? '#4F46E5' : '#64748B' }}>Air Freight</span>
                </button>
                <button 
                  onClick={() => setNewShipment(p => ({...p, transport_mode: 'SEA'}))}
                  style={{ flex: 1, padding: '24px', borderRadius: '12px', border: `2px solid ${newShipment.transport_mode === 'SEA' ? '#0F766E' : '#E2E8F0'}`, background: newShipment.transport_mode === 'SEA' ? '#CCFBF1' : '#FFF', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
                >
                  <Ship size={32} color={newShipment.transport_mode === 'SEA' ? '#0F766E' : '#94A3B8'} />
                  <span style={{ fontWeight: 600, color: newShipment.transport_mode === 'SEA' ? '#0F766E' : '#64748B' }}>Sea Freight</span>
                </button>
                <button 
                  onClick={() => setNewShipment(p => ({...p, transport_mode: 'ROAD'}))}
                  style={{ flex: 1, padding: '24px', borderRadius: '12px', border: `2px solid ${newShipment.transport_mode === 'ROAD' ? '#B45309' : '#E2E8F0'}`, background: newShipment.transport_mode === 'ROAD' ? '#FEF3C7' : '#FFF', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
                >
                  <Truck size={32} color={newShipment.transport_mode === 'ROAD' ? '#B45309' : '#94A3B8'} />
                  <span style={{ fontWeight: 600, color: newShipment.transport_mode === 'ROAD' ? '#B45309' : '#64748B' }}>Road Freight</span>
                </button>
              </div>

              <div className={styles.sectionTitle}><Navigation size={16}/> Routing & Parties</div>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label">Shipment Reference <span style={{ color: '#EF4444' }}>*</span></label>
                  <input className="form-input" style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }} value={newShipment.shipment_reference} onChange={e => setNewShipment(p => ({ ...p, shipment_reference: e.target.value }))} placeholder="e.g. SHP-2026-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Organization <span style={{ color: '#EF4444' }}>*</span></label>
                  <select className="form-select" value={newShipment.org_id} onChange={e => setNewShipment(p => ({ ...p, org_id: e.target.value }))}>
                    <option value="">Select Customer...</option>
                    {state.organizations.filter(o => o.org_type === 'Customer').map(a => <option key={a.org_id} value={a.org_id}>{a.legal_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Origin Location</label>
                  <AsyncLocationSelect value={newShipment.origin_location} onChange={val => setNewShipment(p => ({ ...p, origin_location: val }))} placeholder="Search any city..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Location</label>
                  <AsyncLocationSelect value={newShipment.destination_location} onChange={val => setNewShipment(p => ({ ...p, destination_location: val }))} placeholder="Search any city..." />
                </div>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className={styles.formSection}>
              <div className={styles.sectionTitle}><Package size={16}/> Cargo Dimensions & Type</div>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label">Cargo Type</label>
                  <select className="form-select" value={newShipment.cargo_type} onChange={e => setNewShipment(p => ({ ...p, cargo_type: e.target.value }))}>
                    {CARGO_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Special Handling Codes</label>
                  <input className="form-input" style={{ fontFamily: 'var(--font-mono)' }} value={newShipment.special_handling_codes} onChange={e => setNewShipment(p => ({ ...p, special_handling_codes: e.target.value }))} placeholder="e.g. PER, DGR" />
                </div>
                
                {newShipment.transport_mode === 'SEA' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Container Count</label>
                      <input className="form-input" type="number" value={newShipment.container_count} onChange={e => setNewShipment(p => ({ ...p, container_count: e.target.value }))} placeholder="0" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Container Type</label>
                      <select className="form-select" value={newShipment.container_type} onChange={e => setNewShipment(p => ({ ...p, container_type: e.target.value }))}>
                        <option value="">Select...</option>
                        <option value="20GP">20&apos; GP</option>
                        <option value="40HC">40&apos; HC</option>
                        <option value="Reefer">Reefer</option>
                      </select>
                    </div>
                  </>
                ) : newShipment.transport_mode === 'ROAD' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Total Pieces / Pallets</label>
                      <input className="form-input" type="number" value={newShipment.pieces} onChange={e => setNewShipment(p => ({ ...p, pieces: e.target.value }))} placeholder="0" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Truck Type</label>
                      <select className="form-select" value={newShipment.truck_type} onChange={e => setNewShipment(p => ({ ...p, truck_type: e.target.value }))}>
                        <option value="">Select...</option>
                        <option value="Trailer">Trailer</option>
                        <option value="Flatbed">Flatbed</option>
                        <option value="Reefer">Reefer</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Total Pieces</label>
                    <input className="form-input" type="number" value={newShipment.pieces} onChange={e => setNewShipment(p => ({ ...p, pieces: e.target.value }))} placeholder="0" />
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Gross Wgt (kg)</label>
                    <input className="form-input" type="number" step="0.1" value={newShipment.gross_weight_kg} onChange={e => setNewShipment(p => ({ ...p, gross_weight_kg: e.target.value }))} placeholder="0.0" />
                  </div>
                  <div>
                    <label className="form-label">Volume (cbm)</label>
                    <input className="form-input" type="number" step="0.01" value={newShipment.volume_cbm} onChange={e => setNewShipment(p => ({ ...p, volume_cbm: e.target.value }))} placeholder="0.00" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className={styles.formSection}>
              <div className={styles.sectionTitle}><FileText size={16}/> Service Terms</div>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label">Service Level</label>
                  <select className="form-select" value={newShipment.service_type} onChange={e => setNewShipment(p => ({ ...p, service_type: e.target.value }))}>
                    {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Incoterm</label>
                  <select className="form-select" value={newShipment.incoterm} onChange={e => setNewShipment(p => ({ ...p, incoterm: e.target.value }))}>
                    {INCOTERMS.map(i => <option key={i} value={i}>{INCOTERM_LABELS[i]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Operational Status</label>
                  <select className="form-select" value={newShipment.status} onChange={e => setNewShipment(p => ({ ...p, status: e.target.value }))}>
                    {SHIPMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </div>
  );
}
