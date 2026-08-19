'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDate, formatWeight, getStatusColor } from '@/lib/utils/formatters';
import { CARRIERS } from '@/lib/data/seedData';
import styles from '../shipments/shipments.module.css';
import commonStyles from '@/app/crm/leads/leads.module.css';

export default function BookingsPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [newBooking, setNewBooking] = useState({
    shipment_id: '', carrier_id: '', requested_flight_date: '', ready_for_carriage_at: '',
    requested_pieces: '', requested_weight_kg: '',
    allotment_reference: '', confirmed_flight_number: '', confirmed_flight_date: ''
  });

  const getCarrier = (id) => CARRIERS.find(c => c.id === id);
  const getShipment = (id) => state.shipments.find(s => s.shipment_id === id);

  const columns = [
    { key: 'id', label: 'ID', accessor: 'booking_request_id', render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--primary-hover)' }}>{row.booking_request_id}</span> },
    { key: 'status', label: 'Status', accessor: 'status', render: (row) => <Badge variant={getStatusColor(row.status)} dot>{row.status}</Badge> },
    { key: 'shipment', label: 'Shipment', accessor: row => getShipment(row.shipment_id)?.shipment_reference, render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{getShipment(row.shipment_id)?.shipment_reference || '—'}</span> },
    { key: 'carrier', label: 'Carrier', accessor: row => getCarrier(row.carrier_id)?.name, render: (row) => getCarrier(row.carrier_id)?.name || '—' },
    { key: 'flight', label: 'Flight', accessor: 'confirmed_flight_number', render: (row) => row.confirmed_flight_number ? <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{row.confirmed_flight_number}</span> : <span style={{ color: 'var(--text-tertiary)' }}>Pending</span> },
    { key: 'date', label: 'Flight Date', accessor: row => row.confirmed_flight_date || row.requested_flight_date, render: (row) => formatDate(row.confirmed_flight_date || row.requested_flight_date) },
    { key: 'weight', label: 'Weight', accessor: 'requested_weight_kg', align: 'right', render: (row) => <span className="tabular-nums">{formatWeight(row.requested_weight_kg)}</span> },
    { key: 'shc', label: 'SHC', accessor: row => (row.special_handling_codes || []).join(','), render: (row) => (row.special_handling_codes || []).map(s => <Badge key={s} variant="warning" size="small">{s}</Badge>) },
    { key: 'actions', label: '', accessor: 'actions', align: 'right',
      render: (row) => (
        <div className={commonStyles.actionButtons}>
          <button className={`${commonStyles.actionBtn} hover-scale click-spin`} title="View Details" onClick={(e) => { e.stopPropagation(); router.push(`/operations/bookings/${row.booking_request_id}`); }}>
            <Eye size={16} className="click-spin-inner" />
          </button>
          <button className={`${commonStyles.actionBtn} hover-scale click-spin`} title="Edit" onClick={(e) => { 
            e.stopPropagation(); 
            setEditingBookingId(row.booking_request_id);
            setNewBooking({ ...row });
            setShowNew(true);
          }}>
            <Edit2 size={16} className="click-spin-inner" />
          </button>
          <button className={`${commonStyles.actionBtn} ${commonStyles.deleteBtn} hover-scale click-spin`} title="Delete" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_BOOKING', payload: row.booking_request_id }); }}>
            <Trash2 size={16} className="click-spin-inner" />
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
    setNewBooking({ shipment_id: '', carrier_id: '', requested_flight_date: '', ready_for_carriage_at: '', requested_pieces: '', requested_weight_kg: '', allotment_reference: '', confirmed_flight_number: '', confirmed_flight_date: '' });
  };

  return (
    <div className={`ambient-mesh-bg ${commonStyles.pageWrapper}`}>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Booking Requests</h1>
            <p className={styles.subtitle}>{state.bookingRequests.length} bookings · {state.bookingRequests.filter(b => b.status === 'Requested').length} pending</p>
          </div>
          <Button icon={Plus} onClick={() => {
            setEditingBookingId(null);
            setNewBooking({ shipment_id: '', carrier_id: '', requested_flight_date: '', ready_for_carriage_at: '', requested_pieces: '', requested_weight_kg: '', allotment_reference: '', confirmed_flight_number: '', confirmed_flight_date: '' });
            setShowNew(true);
          }}>New Booking Request</Button>
        </div>
        
        <div className={`glass-panel ${commonStyles.tableContainer}`}>
          <DataTable
            columns={columns}
            data={state.bookingRequests}
            onRowClick={(row) => router.push(`/operations/bookings/${row.booking_request_id}`)}
            searchPlaceholder="Search bookings..."
            filters={[{ key: 'status', label: 'Status', options: ['Requested', 'Space Confirmed', 'Waitlisted', 'Rejected', 'Cancelled'] }]}
          />
        </div>

      <Modal
        open={showNew}
        onClose={() => {
          setShowNew(false);
          setEditingBookingId(null);
          setNewBooking({ shipment_id: '', carrier_id: '', requested_flight_date: '', ready_for_carriage_at: '', requested_pieces: '', requested_weight_kg: '', allotment_reference: '', confirmed_flight_number: '', confirmed_flight_date: '' });
        }}
        title={editingBookingId ? "Edit Booking Request" : "New Booking Request"}
        subtitle={editingBookingId ? "Update booking details" : "Request space from a carrier"}
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowNew(false);
              setEditingBookingId(null);
              setNewBooking({ shipment_id: '', carrier_id: '', requested_flight_date: '', ready_for_carriage_at: '', requested_pieces: '', requested_weight_kg: '', allotment_reference: '', confirmed_flight_number: '', confirmed_flight_date: '' });
            }}>Cancel</Button>
            <Button onClick={handleCreateOrUpdate} disabled={!newBooking.shipment_id || !newBooking.carrier_id}>{editingBookingId ? "Save Changes" : "Submit Request"}</Button>
          </>
        }
      >
        <div className={styles.form}>
          {editingBookingId && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status *</label>
                <select className="form-select" value={newBooking.status || 'Requested'} onChange={e => setNewBooking(p => ({ ...p, status: e.target.value }))}>
                  {['Requested', 'Space Confirmed', 'Waitlisted', 'Rejected', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                {/* Spacer */}
              </div>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Shipment *</label>
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
              <label className="form-label">Carrier *</label>
              <select className="form-select" value={newBooking.carrier_id} onChange={e => setNewBooking(p => ({ ...p, carrier_id: e.target.value }))}>
                <option value="">Select Carrier...</option>
                {CARRIERS.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
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
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Allotment Reference</label>
              <input className="form-input" value={newBooking.allotment_reference} onChange={e => setNewBooking(p => ({ ...p, allotment_reference: e.target.value }))} placeholder="e.g. ALOT-123" />
            </div>
            <div className="form-group">
              {/* Spacer for alignment */}
            </div>
          </div>
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
        </div>
      </Modal>
      </div>
    </div>
  );
}
