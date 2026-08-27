'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Eye, Edit2, Trash2, ArrowUpRight, Plane, Activity, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDate, formatWeight } from '@/lib/utils/formatters';

import styles from './bookings.module.css';

export default function BookingsPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  
  const [newBooking, setNewBooking] = useState({
    shipment_id: '', carrier_id: '', customer_contact_id: '', requested_flight_date: '', ready_for_carriage_at: '',
    requested_pieces: '', requested_weight_kg: '',
    allotment_reference: '', confirmed_flight_number: '', confirmed_flight_date: ''
  });

  const getShipment = (id) => state.shipments.find(s => s.shipment_id === id);
  const getCarrier = (id) => state.organizations.find(o => o.org_id === id);
  const getOrg = (id) => state.organizations.find(o => o.org_id === id);
  const getContact = (id) => state.contacts.find(c => c.contact_id === id);
  const carriers = useMemo(() => state.organizations.filter(o => o.org_type === 'Carrier'), [state.organizations]);

  // Status mapping for premium badges
  const getPremiumStatusVariant = (status) => {
    switch (status) {
      case 'Space Confirmed': return 'success';
      case 'Waitlisted': return 'warning';
      case 'Requested': return 'warning';
      case 'Rejected': return 'danger';
      case 'Cancelled': return 'danger';
      default: return 'primary';
    }
  };

  // ──────── KPIs ────────
  const kpis = useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let totalWeight = 0;
    const airlines = new Set();

    state.bookingRequests.forEach(b => {
      if (b.status === 'Requested') pending++;
      if (b.status === 'Space Confirmed') confirmed++;
      if (b.requested_weight_kg) totalWeight += parseFloat(b.requested_weight_kg);
      if (b.carrier_id) airlines.add(b.carrier_id);
    });

    return {
      total: state.bookingRequests.length,
      pending,
      confirmed,
      totalWeight,
      activeAirlines: airlines.size
    };
  }, [state.bookingRequests]);

  const columns = [
    { 
      key: 'id', 
      label: 'ID', 
      accessor: 'booking_request_id', 
      render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#6366F1' }}>{row.booking_request_id}</span> 
    },
    { 
      key: 'status', 
      label: 'Status', 
      accessor: 'status', 
      render: (row) => <Badge variant={getPremiumStatusVariant(row.status)} dot>{row.status}</Badge> 
    },
    { 
      key: 'shipment', 
      label: 'Shipment', 
      accessor: row => getShipment(row.shipment_id)?.shipment_reference, 
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{getShipment(row.shipment_id)?.shipment_reference || '—'}</span>
        </div>
      ) 
    },
    { 
      key: 'customer', 
      label: 'Customer', 
      accessor: row => {
        const shp = getShipment(row.shipment_id);
        return getOrg(shp?.customer_org_id || shp?.org_id)?.legal_name;
      }, 
      render: (row) => {
        const shp = getShipment(row.shipment_id);
        const org = getOrg(shp?.customer_org_id || shp?.org_id);
        const contact = getContact(row.customer_contact_id) || getContact(shp?.shipper_contact_id || shp?.consignee_contact_id || shp?.contact_id) || state.contacts.find(c => c.org_id === (shp?.customer_org_id || shp?.org_id));
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>{org?.legal_name || '—'}</span>
            <span style={{ fontSize: '11px', color: '#64748B' }}>{contact?.full_name || '—'}</span>
          </div>
        );
      }
    },
    { 
      key: 'carrier', 
      label: 'Carrier', 
      accessor: row => getCarrier(row.carrier_id)?.name, 
      render: (row) => {
        const carrier = getCarrier(row.carrier_id);
        return (
          <div className={styles.carrierCell}>
            <div className={styles.carrierLogo}>{carrier?.code || '—'}</div>
            <div className={styles.carrierName}>{carrier?.legal_name || '—'}</div>
          </div>
        );
      }
    },
    { 
      key: 'route', 
      label: 'Route', 
      accessor: row => {
        const shipment = getShipment(row.shipment_id);
        return shipment ? `${shipment.origin_airport}-${shipment.destination_airport}` : '';
      }, 
      render: (row) => {
        const shipment = getShipment(row.shipment_id);
        if (!shipment) return '—';
        return (
          <div className={styles.routeCell}>
            <span className={styles.routeAirport}>{shipment.origin_airport}</span>
            <div className={styles.routeLine}><Plane size={12} className={styles.routePlane} /></div>
            <span className={styles.routeAirport}>{shipment.destination_airport}</span>
          </div>
        );
      }
    },
    { 
      key: 'flight', 
      label: 'Flight', 
      accessor: 'confirmed_flight_number', 
      render: (row) => row.confirmed_flight_number ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>{row.confirmed_flight_number}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{formatDate(row.confirmed_flight_date)}</span>
        </div>
      ) : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '12px' }}>Pending</span> 
    },
    { 
      key: 'weight', 
      label: 'Weight', 
      accessor: 'requested_weight_kg', 
      align: 'right', 
      render: (row) => <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>{formatWeight(row.requested_weight_kg)}</span> 
    },
    { 
      key: 'actions', 
      label: '', 
      accessor: 'actions', 
      align: 'right',
      render: (row) => (
        <div className={styles.actionButtons}>
          <button className={styles.actionBtn} title="View Details" onClick={(e) => { e.stopPropagation(); router.push(`/operations/bookings/${row.booking_request_id}`); }}>
            <Eye size={16} />
          </button>
          <button className={styles.actionBtn} title="Edit" onClick={(e) => { 
            e.stopPropagation(); 
            setEditingBookingId(row.booking_request_id);
            setNewBooking({ ...row });
            setShowNew(true);
          }}>
            <Edit2 size={16} />
          </button>
          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_BOOKING', payload: row.booking_request_id }); }}>
            <Trash2 size={16} />
          </button>
        </div>
      )
    },
  ];

  const handleCreateOrUpdate = () => {
    if (!newBooking.shipment_id || !newBooking.carrier_id) return;
    const shipment = getShipment(newBooking.shipment_id);
    
    const payload = { 
      ...newBooking, 
      requested_pieces: Number(newBooking.requested_pieces) || 0,
      requested_weight_kg: Number(newBooking.requested_weight_kg) || 0,
      special_handling_codes: shipment?.special_handling_codes || [],
    };

    if (editingBookingId) {
      dispatch({ type: 'UPDATE_BOOKING', payload: { ...payload, booking_request_id: editingBookingId } });
    } else {
      dispatch({ type: 'CREATE_BOOKING', payload });
    }

    setShowNew(false);
    setEditingBookingId(null);
    setNewBooking({ shipment_id: '', carrier_id: '', customer_contact_id: '', requested_flight_date: '', ready_for_carriage_at: '', requested_pieces: '', requested_weight_kg: '', allotment_reference: '', confirmed_flight_number: '', confirmed_flight_date: '' });
  };

  return (
    <div className={styles.pageWrapper} style={{ '--primary': '#6366F1', '--primary-tint': 'rgba(99, 102, 241, 0.1)', '--primary-hover': '#4F46E5' }}>
      <div className={styles.page}>
        
        {/* ══════ HEADER ══════ */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Booking Requests</h1>
            <p className={styles.subtitle}>
              Manage space allocations, carrier requests, and flight confirmations.
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button icon={Plus} onClick={() => {
              setEditingBookingId(null);
              setNewBooking({ shipment_id: '', carrier_id: '', customer_contact_id: '', requested_flight_date: '', ready_for_carriage_at: '', requested_pieces: '', requested_weight_kg: '', allotment_reference: '', confirmed_flight_number: '', confirmed_flight_date: '' });
              setShowNew(true);
            }} style={{ background: 'linear-gradient(to right, #6366F1, #8B5CF6)', borderColor: 'transparent', border: 'none' }}>
              New Booking Request
            </Button>
          </div>
        </div>
        
        {/* ══════ ANALYTICS ══════ */}
        <div className={styles.analyticsGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={`${styles.kpiIconWrapper} primary`}><Activity size={20} /></div>
              <div className={`${styles.kpiTrend} trendUp`}><ArrowUpRight size={14} /> +12%</div>
            </div>
            <div className={styles.kpiMetric}>{kpis.total}</div>
            <div className={styles.kpiLabel}>Total Bookings</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={`${styles.kpiIconWrapper} warning`}><AlertCircle size={20} /></div>
              <div className={`${styles.kpiTrend} trendNeutral`}>—</div>
            </div>
            <div className={styles.kpiMetric}>{kpis.pending}</div>
            <div className={styles.kpiLabel}>Pending Confirmation</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={`${styles.kpiIconWrapper} success`}><CheckCircle2 size={20} /></div>
              <div className={`${styles.kpiTrend} trendUp`}><ArrowUpRight size={14} /> +4%</div>
            </div>
            <div className={styles.kpiMetric}>{kpis.confirmed}</div>
            <div className={styles.kpiLabel}>Confirmed Space</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={`${styles.kpiIconWrapper} indigo`}><Plane size={20} /></div>
              <div className={`${styles.kpiTrend} trendUp`}><ArrowUpRight size={14} /></div>
            </div>
            <div className={styles.kpiMetric}>{formatWeight(kpis.totalWeight)}</div>
            <div className={styles.kpiLabel}>Total Requested Weight</div>
          </div>
        </div>

        {/* ══════ PREMIUM TABLE ══════ */}
        <div className={styles.tableContainer}>
          <DataTable
            columns={columns}
            data={state.bookingRequests}
            onRowClick={(row) => router.push(`/operations/bookings/${row.booking_request_id}`)}
            searchPlaceholder="Search bookings..."
            filters={[{ key: 'status', label: 'Status', options: ['Requested', 'Space Confirmed', 'Waitlisted', 'Rejected', 'Cancelled'] }]}
          />
        </div>

      {/* ══════ CREATE / EDIT MODAL ══════ */}
      <Modal
        open={showNew}
        onClose={() => {
          setShowNew(false);
          setEditingBookingId(null);
          setNewBooking({ shipment_id: '', carrier_id: '', customer_contact_id: '', requested_flight_date: '', ready_for_carriage_at: '', requested_pieces: '', requested_weight_kg: '', allotment_reference: '', confirmed_flight_number: '', confirmed_flight_date: '' });
        }}
        title={editingBookingId ? "Edit Booking Request" : "New Booking Request"}
        subtitle={editingBookingId ? "Update booking details" : "Request space from a carrier"}
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowNew(false);
              setEditingBookingId(null);
              setNewBooking({ shipment_id: '', carrier_id: '', customer_contact_id: '', requested_flight_date: '', ready_for_carriage_at: '', requested_pieces: '', requested_weight_kg: '', allotment_reference: '', confirmed_flight_number: '', confirmed_flight_date: '' });
            }}>Cancel</Button>
            <Button onClick={handleCreateOrUpdate} disabled={!newBooking.shipment_id || !newBooking.carrier_id} style={{ background: '#6366F1', borderColor: '#6366F1' }}>
              {editingBookingId ? "Save Changes" : "Submit Request"}
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          
          {editingBookingId && (
            <>
              <div className={styles.formSectionTitle}>Booking Status</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status <span style={{ color: '#f43f5e' }}>*</span></label>
                  <select className="form-select" value={newBooking.status || 'Requested'} onChange={e => setNewBooking(p => ({ ...p, status: e.target.value }))}>
                    {['Requested', 'Space Confirmed', 'Waitlisted', 'Rejected', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group"></div>
              </div>
            </>
          )}

          <div className={styles.formSectionTitle} style={{ marginTop: editingBookingId ? '16px' : '0' }}>Request Details</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Shipment <span style={{ color: '#f43f5e' }}>*</span></label>
              <select className="form-select" value={newBooking.shipment_id} onChange={e => {
                const shipmentId = e.target.value;
                const shipment = getShipment(shipmentId);
                setNewBooking(p => ({ 
                  ...p, 
                  shipment_id: shipmentId,
                  requested_pieces: shipment ? shipment.pieces : '',
                  requested_weight_kg: shipment ? shipment.chargeable_weight_kg : ''
                }));
              }}>
                <option value="">Select Shipment...</option>
                {state.shipments.map(s => <option key={s.shipment_id} value={s.shipment_id}>{s.shipment_reference} ({s.origin_airport}-{s.destination_airport})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Carrier <span style={{ color: '#f43f5e' }}>*</span></label>
              <select className="form-select" value={newBooking.carrier_id} onChange={e => setNewBooking(p => ({ ...p, carrier_id: e.target.value }))}>
                <option value="">Select Carrier...</option>
                {carriers.map(c => <option key={c.org_id} value={c.org_id}>{c.legal_name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Customer Contact</label>
              <select className="form-select" value={newBooking.customer_contact_id || ''} onChange={e => setNewBooking(p => ({ ...p, customer_contact_id: e.target.value }))}>
                <option value="">Select Contact...</option>
                {newBooking.shipment_id && (() => {
                  const s = getShipment(newBooking.shipment_id);
                  const orgId = s?.customer_org_id || s?.org_id;
                  return state.contacts.filter(c => c.org_id === orgId).map(c => <option key={c.contact_id} value={c.contact_id}>{c.full_name}</option>);
                })()}
              </select>
            </div>
            <div className="form-group">
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Requested Flight Date</label>
              <input className="form-input" type="date" value={newBooking.requested_flight_date} onChange={e => setNewBooking(p => ({ ...p, requested_flight_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Ready for Carriage</label>
              <input className="form-input" type="datetime-local" value={newBooking.ready_for_carriage_at} onChange={e => setNewBooking(p => ({ ...p, ready_for_carriage_at: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Requested Pieces</label>
              <input className="form-input" type="number" value={newBooking.requested_pieces} onChange={e => setNewBooking(p => ({ ...p, requested_pieces: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Requested Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" value={newBooking.requested_weight_kg} onChange={e => setNewBooking(p => ({ ...p, requested_weight_kg: e.target.value }))} placeholder="0.0" />
            </div>
          </div>

          <div className={styles.formSectionTitle} style={{ marginTop: '16px' }}>Airline Confirmation</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Confirmed Flight Number</label>
              <input className="form-input" value={newBooking.confirmed_flight_number} onChange={e => setNewBooking(p => ({ ...p, confirmed_flight_number: e.target.value }))} placeholder="e.g. QR8410" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmed Flight Date</label>
              <input className="form-input" type="date" value={newBooking.confirmed_flight_date} onChange={e => setNewBooking(p => ({ ...p, confirmed_flight_date: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Allotment Reference</label>
              <input className="form-input" value={newBooking.allotment_reference} onChange={e => setNewBooking(p => ({ ...p, allotment_reference: e.target.value }))} placeholder="e.g. ALOT-123" />
            </div>
            <div className="form-group"></div>
          </div>

        </div>
      </Modal>
      </div>
    </div>
  );
}
