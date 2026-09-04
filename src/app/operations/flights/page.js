'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate, formatWeight } from '@/lib/utils/formatters';
import { Plane, Plus, Eye, Edit2, Download, Share2, Trash2, PlaneTakeoff, ShieldCheck, Activity, BarChart3, Globe, Compass, Target, Radar } from 'lucide-react';
import { LOCATIONS } from '@/lib/data/seedData';
import styles from './manifests.module.css';

export default function ManifestsPage() {
  const router = useRouter();
  const { state, dispatch, getManifestTotalAllocatedWeight } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [newManifest, setNewManifest] = useState({
    flight_number: '', flight_date: '', carrier_id: '',
    origin_airport: '', destination_airport: '', status: 'Draft'
  });
  const [showEdit, setShowEdit] = useState(false);
  const [editManifest, setEditManifest] = useState(null);

  const getCarrier = (id) => state.organizations.find(c => c.org_id === id);
  const carriers = useMemo(() => state.organizations.filter(o => o.org_type === 'Carrier'), [state.organizations]);

  // Status mapping for premium flight badges
  const getFlightStatusVariant = (status) => {
    switch (status) {
      case 'Departed': return 'success';
      case 'Scheduled': return 'primary';
      case 'Boarding': return 'warning';
      case 'Delayed': return 'danger';
      case 'Filed': return 'primary';
      case 'Closed': return 'neutral';
      default: return 'neutral';
    }
  };

  // ──────── KPIs & Analytics ────────
  const analytics = useMemo(() => {
    let totalMax = 0;
    let totalAllocated = 0;
    let activeFlights = 0;

    state.transportManifests.forEach(f => {
      const max = f.max_weight_kg || 10000;
      const allocated = getManifestTotalAllocatedWeight(f.manifest_id);
      totalMax += max;
      totalAllocated += allocated;
      if (['Scheduled', 'Boarding', 'Filed'].includes(f.status)) {
        activeFlights++;
      }
    });

    const utilization = totalMax > 0 ? (totalAllocated / totalMax) * 100 : 0;

    return {
      total: state.transportManifests.length,
      active: activeFlights,
      totalMax,
      totalAllocated,
      utilization: Math.round(utilization)
    };
  }, [state.transportManifests, getManifestTotalAllocatedWeight]);

  const columns = [
    { 
      key: 'flight', 
      label: 'FLIGHT', 
      accessor: 'flight_number', 
      render: (row) => (
        <div className={styles.flightNumberCell}>
          {row.flight_number}
          <div className={styles.flightDate}>{formatDate(row.flight_date)}</div>
        </div>
      ) 
    },
    { 
      key: 'carrier', 
      label: 'CARRIER', 
      accessor: row => getCarrier(row.carrier_id)?.code, 
      render: (row) => (
        <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '14px' }}>
          {getCarrier(row.carrier_id)?.legal_name || '—'}
        </span>
      ) 
    },
    { 
      key: 'route', 
      label: 'ROUTE', 
      accessor: row => `${row.departure_airport}–${row.arrival_airport}`, 
      render: (row) => (
        <div className={styles.routeCell}>
          <span className={styles.routeCode}>{row.departure_airport}</span>
          <div className={styles.routeLine}><Plane size={14} /></div>
          <span className={styles.routeCode}>{row.arrival_airport}</span>
        </div>
      )
    },
    { 
      key: 'capacity', 
      label: 'CAPACITY UTILIZATION', 
      accessor: 'max_weight_kg', 
      render: (row) => {
        const allocated = getManifestTotalAllocatedWeight(row.manifest_id);
        const max = row.max_weight_kg || 10000;
        const pct = Math.min(100, Math.round((allocated / max) * 100));
        let color = '#10B981'; // green
        if (pct > 75) color = '#F59E0B'; // yellow
        if (pct > 90) color = '#F43F5E'; // red

        return (
          <div className={styles.capacityCell}>
            <div className={styles.capacityHeader}>
              <span className={styles.capacityPct} style={{ color }}>{pct}%</span>
              <span className={styles.capacityDetails}>{formatWeight(allocated)} / {formatWeight(max)}</span>
            </div>
            <div className={styles.capacityTrack}>
              <div className={styles.capacityFill} style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          </div>
        );
      }
    },
    { 
      key: 'status', 
      label: 'STATUS', 
      accessor: 'status', 
      render: (row) => <Badge variant={getFlightStatusVariant(row.status)} dot>{row.status}</Badge> 
    },
    { 
      key: 'actions', 
      label: '', 
      accessor: 'actions', 
      align: 'right',
      render: (row) => (
        <div className={styles.actionButtons}>
          <button className={styles.actionBtn} title="View Details" onClick={(e) => { e.stopPropagation(); console.log('View manifest', row.manifest_id); }}>
            <Eye size={16} />
          </button>
          <button className={styles.actionBtn} title="Edit" onClick={(e) => { 
            e.stopPropagation(); 
            setEditManifest(row); 
            setShowEdit(true); 
          }}>
            <Edit2 size={16} />
          </button>
          <button className={styles.actionBtn} title="Download FFM">
            <Download size={16} />
          </button>
        </div>
      )
    },
  ];

  const handleCreate = () => {
    if (!newManifest.flight_number || !newManifest.carrier_id) return;
    dispatch({ 
      type: 'CREATE_MANIFEST', 
      payload: { ...newManifest, max_weight_kg: Number(newManifest.max_weight_kg) || 10000 }
    });
    setShowNew(false);
    setNewManifest({ flight_number: '', flight_date: '', carrier_id: '', origin_airport: '', destination_airport: '', max_weight_kg: '', status: 'Draft' });
  };

  const handleUpdate = () => {
    if (!editManifest) return;
    dispatch({ 
      type: 'UPDATE_MANIFEST', 
      payload: { ...editManifest, max_weight_kg: Number(editManifest.max_weight_kg) || 10000 }
    });
    setShowEdit(false);
  };

  return (
    <div className={styles.pageWrapper} style={{ '--primary': '#6366F1', '--primary-tint': 'rgba(99, 102, 241, 0.1)', '--primary-hover': '#4F46E5' }}>
      <div className={styles.page}>
        
        {/* ══════ COMMAND CENTER HEADER ══════ */}
        <div className={styles.heroHeader}>
          <div className={styles.heroLeft}>
            <div className={styles.titleRow}>
              <div className={styles.titleIcon}>
                <PlaneTakeoff size={32} />
              </div>
              <div>
                <h1 className={styles.title}>Flight Operations Center</h1>
                <p className={styles.subtitle}>
                  <ShieldCheck size={16} color="#10B981" />
                  Live aviation manifest tracking, capacity modeling, and FFM routing.
                </p>
              </div>
            </div>
          </div>
          <div className={styles.heroActions}>
            <button className={styles.newManifestBtn} onClick={() => setShowNew(true)}>
              <Plus size={18} /> New Flight Manifest
            </button>
          </div>
        </div>
        
        {/* ══════ KPI ANALYTICS ══════ */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={`${styles.kpiIconWrapper} indigo`}><Plane size={20} /></div>
            </div>
            <div className={styles.kpiMetric}>{analytics.total}</div>
            <div className={styles.kpiLabel}>Total Flights</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={`${styles.kpiIconWrapper} emerald`}><Activity size={20} /></div>
            </div>
            <div className={styles.kpiMetric}>{analytics.active}</div>
            <div className={styles.kpiLabel}>Active Airborne / Scheduled</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={`${styles.kpiIconWrapper} amber`}><Target size={20} /></div>
            </div>
            <div className={styles.kpiMetric}>{formatWeight(analytics.totalAllocated)}</div>
            <div className={styles.kpiLabel}>Total Utilized Capacity</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={`${styles.kpiIconWrapper} rose`}><BarChart3 size={20} /></div>
            </div>
            <div className={styles.kpiMetric}>{analytics.utilization}%</div>
            <div className={styles.kpiLabel}>Network Utilization Rate</div>
          </div>
        </div>

        {/* ══════ MAIN LAYOUT GRID ══════ */}
        <div className={styles.mainGrid}>
          
          {/* Main Table Area */}
          <div className={styles.tableContainer}>
            <DataTable
              columns={columns}
              data={state.transportManifests}
              searchPlaceholder="Search by flight number, origin, destination..."
              filters={[
                { key: 'status', label: 'Status', options: ['Draft', 'Scheduled', 'Boarding', 'Departed', 'Filed', 'Closed'] },
              ]}
            />
          </div>

          {/* Right Sidebar Analytics */}
          <div className={styles.sidebar}>
            
            {/* AI Live Tracker */}
            <div className={styles.aiTracker}>
              <div className={styles.aiTrackerHeader}>
                <div className={styles.aiTrackerTitle}>
                  <Radar size={16} /> Network Intelligence
                </div>
                <div className={styles.liveIndicator}>
                  <div className={styles.liveDot} /> LIVE
                </div>
              </div>
              <div className={styles.aiMessage}>
                <strong>QR8410 (DOH-LHR)</strong> is nearing max capacity (85%). Consider routing remaining LHR cargo through CDG.
              </div>
              <div className={styles.aiMessage} style={{ borderColor: '#10B981' }}>
                All scheduled flights for tomorrow have valid FFM messages generated. No compliance issues detected.
              </div>
            </div>

            {/* Carrier Utilization */}
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarHeader}>
                <Compass size={18} /> Top Routes by Utilization
              </div>
              <div className={styles.utilList}>
                <div className={styles.utilItem}>
                  <div className={styles.utilCarrier}>DOH <span style={{color: '#94A3B8'}}>→</span> LHR</div>
                  <div className={styles.utilBar}><div className={styles.utilFill} style={{width: '92%', background: '#F43F5E'}} /></div>
                  <div className={styles.utilVal}>92%</div>
                </div>
                <div className={styles.utilItem}>
                  <div className={styles.utilCarrier}>DXB <span style={{color: '#94A3B8'}}>→</span> LHR</div>
                  <div className={styles.utilBar}><div className={styles.utilFill} style={{width: '78%', background: '#F59E0B'}} /></div>
                  <div className={styles.utilVal}>78%</div>
                </div>
                <div className={styles.utilItem}>
                  <div className={styles.utilCarrier}>DOH <span style={{color: '#94A3B8'}}>→</span> CDG</div>
                  <div className={styles.utilBar}><div className={styles.utilFill} style={{width: '45%'}} /></div>
                  <div className={styles.utilVal}>45%</div>
                </div>
              </div>
            </div>

          </div>

        </div>

      {/* ══════ CREATE MODAL ══════ */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="New Flight Manifest"
        subtitle="Create a new FFM (Freight Manifest) routing record"
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newManifest.flight_number || !newManifest.carrier_id} style={{ background: '#6366F1', borderColor: '#6366F1' }}>Create Flight</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
          
          <div className={styles.formRowGrid}>
            <div className="form-group">
              <label className="form-label">Flight Number <span style={{ color: '#f43f5e' }}>*</span></label>
              <input className="form-input" style={{ fontSize: '16px', fontWeight: 'bold' }} value={newManifest.flight_number} onChange={e => setNewManifest(p => ({ ...p, flight_number: e.target.value }))} placeholder="e.g. QR8410" />
            </div>
            <div className="form-group">
              <label className="form-label">Departure Date <span style={{ color: '#f43f5e' }}>*</span></label>
              <input className="form-input" type="date" value={newManifest.flight_date} onChange={e => setNewManifest(p => ({ ...p, flight_date: e.target.value }))} />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Carrier <span style={{ color: '#f43f5e' }}>*</span></label>
            <select className="form-select" value={newManifest.carrier_id} onChange={e => setNewManifest(p => ({ ...p, carrier_id: e.target.value }))}>
              <option value="">Select Airline Carrier...</option>
              {carriers.map(c => <option key={c.org_id} value={c.org_id}>{c.legal_name}</option>)}
            </select>
          </div>
          
          <div className={styles.formRowGrid} style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div className="form-group">
              <label className="form-label">Origin Airport <span style={{ color: '#f43f5e' }}>*</span></label>
              <select className="form-select" value={newManifest.origin_airport} onChange={e => setNewManifest(p => ({ ...p, origin_airport: e.target.value }))}>
                <option value="">Select Departure...</option>
                {Object.values(LOCATIONS).map(a => <option key={a.code} value={a.code}>{a.name}, {a.country} ({a.code})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Destination Airport <span style={{ color: '#f43f5e' }}>*</span></label>
              <select className="form-select" value={newManifest.destination_airport} onChange={e => setNewManifest(p => ({ ...p, destination_airport: e.target.value }))}>
                <option value="">Select Arrival...</option>
                {Object.values(LOCATIONS).map(a => <option key={a.code} value={a.code}>{a.name}, {a.country} ({a.code})</option>)}
              </select>
            </div>
          </div>

          <div className={styles.formRowGrid}>
            <div className="form-group">
              <label className="form-label">Aircraft Max Capacity (kg)</label>
              <input className="form-input" type="number" step="100" value={newManifest.max_weight_kg} onChange={e => setNewManifest(p => ({ ...p, max_weight_kg: e.target.value }))} placeholder="10000" />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select className="form-select" value={newManifest.status} onChange={e => setNewManifest(p => ({ ...p, status: e.target.value }))}>
                {['Draft', 'Scheduled', 'Boarding', 'Departed', 'Filed', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* ══════ EDIT MODAL ══════ */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Flight Manifest"
        subtitle={`Update details for flight ${editManifest?.flight_number}`}
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleUpdate} style={{ background: '#6366F1', borderColor: '#6366F1' }}>Save Changes</Button>
          </>
        }
      >
        {editManifest && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
            <div className={styles.formRowGrid}>
              <div className="form-group">
                <label className="form-label">Flight Number <span style={{ color: '#f43f5e' }}>*</span></label>
                <input className="form-input" value={editManifest.flight_number} disabled style={{ background: '#F1F5F9' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Departure Date <span style={{ color: '#f43f5e' }}>*</span></label>
                <input className="form-input" type="date" value={editManifest.flight_date} onChange={e => setEditManifest(p => ({ ...p, flight_date: e.target.value }))} />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Carrier <span style={{ color: '#f43f5e' }}>*</span></label>
              <select className="form-select" value={editManifest.carrier_id} onChange={e => setEditManifest(p => ({ ...p, carrier_id: e.target.value }))}>
                <option value="">Select Airline Carrier...</option>
                {carriers.map(c => <option key={c.org_id} value={c.org_id}>{c.legal_name}</option>)}
              </select>
            </div>
            
            <div className={styles.formRowGrid} style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <div className="form-group">
                <label className="form-label">Origin Airport <span style={{ color: '#f43f5e' }}>*</span></label>
                <select className="form-select" value={editManifest.departure_airport} onChange={e => setEditManifest(p => ({ ...p, departure_airport: e.target.value }))}>
                  <option value="">Select Departure...</option>
                  {Object.values(LOCATIONS).map(a => <option key={a.code} value={a.code}>{a.name}, {a.country} ({a.code})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Destination Airport <span style={{ color: '#f43f5e' }}>*</span></label>
                <select className="form-select" value={editManifest.arrival_airport} onChange={e => setEditManifest(p => ({ ...p, arrival_airport: e.target.value }))}>
                  <option value="">Select Arrival...</option>
                  {Object.values(LOCATIONS).map(a => <option key={a.code} value={a.code}>{a.name}, {a.country} ({a.code})</option>)}
                </select>
              </div>
            </div>

            <div className={styles.formRowGrid}>
              <div className="form-group">
                <label className="form-label">Aircraft Max Capacity (kg)</label>
                <input className="form-input" type="number" step="100" value={editManifest.max_weight_kg} onChange={e => setEditManifest(p => ({ ...p, max_weight_kg: e.target.value }))} placeholder="10000" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={editManifest.status} onChange={e => setEditManifest(p => ({ ...p, status: e.target.value }))}>
                  {['Draft', 'Scheduled', 'Boarding', 'Departed', 'Filed', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
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
