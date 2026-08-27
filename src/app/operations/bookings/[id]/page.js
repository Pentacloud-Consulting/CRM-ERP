'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plane, Building2, Calendar, FileText, Anchor, Clock, CheckCircle2, Box, PlaneTakeoff, ShieldAlert, Sparkles, ExternalLink, Download, Share2, Edit2, Activity } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { getLocationName } from '@/app/crm/leads/page';
import { formatDate, formatDateTime, formatWeight } from '@/lib/utils/formatters';

import styles from './detail.module.css';

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, dispatch } = useApp();

  const [showEdit, setShowEdit] = useState(false);
  const [editBooking, setEditBooking] = useState(null);

  const getShipment = (id) => state.shipments.find(s => s.shipment_id === id);
  const carriers = state.organizations.filter(o => o.org_type === 'Carrier');

  const booking = state.bookingRequests.find(b => b.booking_request_id === id);

  if (!booking) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.page}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/operations/bookings')}>Back to Bookings</Button>
          <div className={styles.notFound}>Booking Request not found</div>
        </div>
      </div>
    );
  }

  const shipment = state.shipments.find(s => s.shipment_id === booking.shipment_id);
  const carrier = state.organizations.find(c => c.org_id === booking.carrier_id);

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

  const isConfirmed = booking.status === 'Space Confirmed';
  const flightDate = booking.confirmed_flight_date || booking.requested_flight_date;

  const handleUpdate = () => {
    if (!editBooking.shipment_id || !editBooking.carrier_id) return;
    const s = getShipment(editBooking.shipment_id);
    
    const payload = { 
      ...editBooking, 
      requested_pieces: Number(editBooking.requested_pieces) || 0,
      requested_weight_kg: Number(editBooking.requested_weight_kg) || 0,
      special_handling_codes: s?.special_handling_codes || [],
    };

    dispatch({ type: 'UPDATE_BOOKING', payload });
    setShowEdit(false);
    setEditBooking(null);
  };

  return (
    <div className={styles.pageWrapper} style={{ '--primary': '#6366F1', '--primary-tint': 'rgba(99, 102, 241, 0.1)' }}>
      <div className={styles.page}>
        
        <div style={{ marginBottom: '24px' }}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/operations/bookings')}>Booking Requests</Button>
        </div>

        {/* ══════ HERO CARD ══════ */}
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.heroIcon}>
              <Plane size={40} />
            </div>
            <div>
              <div className={styles.heroTitleRow}>
                <h1 className={styles.heroTitle}>{booking.booking_request_id}</h1>
                <Badge variant={getPremiumStatusVariant(booking.status)}>{booking.status}</Badge>
              </div>
              <div className={styles.heroSubtitle}>
                <span><Building2 size={16} /> {carrier ? carrier.legal_name : 'Unknown Carrier'}</span>
                {booking.confirmed_flight_number && (
                  <>
                    <span style={{ color: '#CBD5E1' }}>•</span>
                    <span style={{ color: '#6366F1', fontWeight: 800 }}><Anchor size={16} /> {booking.confirmed_flight_number}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className={styles.heroRight}>
            <Button icon={Edit2} variant="secondary" onClick={() => {
              setEditBooking({ ...booking });
              setShowEdit(true);
            }}>Edit Booking</Button>
          </div>
        </div>

        {/* ══════ 3-COLUMN SMART GRID ══════ */}
        <div className={styles.layoutGrid}>
          
          {/* Column 1: Flight & Route */}
          <div>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  {shipment?.transport_mode === 'SEA' ? <Anchor size={18} /> : shipment?.transport_mode === 'ROAD' ? <Truck size={18} /> : <PlaneTakeoff size={18} />} 
                  {' '}
                  {shipment?.transport_mode === 'SEA' ? 'Voyage Information' : shipment?.transport_mode === 'ROAD' ? 'Transit Information' : 'Flight Information'}
                </h2>
              </div>
              <div className={styles.dataGrid}>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}><Anchor size={14} /> {shipment?.transport_mode === 'SEA' ? 'Voyage No.' : shipment?.transport_mode === 'ROAD' ? 'Vehicle No.' : 'Flight No.'}</span>
                  <span className={styles.dataValue}>{booking.confirmed_flight_number || 'Pending Assignment'}</span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}><Calendar size={14} /> Schedule</span>
                  <span className={styles.dataValue}>{flightDate ? formatDate(flightDate) : 'Not Scheduled'}</span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}><Clock size={14} /> RFC Time</span>
                  <span className={styles.dataValue}>{booking.ready_for_carriage_at ? formatDateTime(booking.ready_for_carriage_at) : '—'}</span>
                </div>
              </div>

              {shipment && (() => {
                let ModeIcon = Plane;
                if (shipment.transport_mode === 'SEA') ModeIcon = Anchor;
                else if (shipment.transport_mode === 'ROAD') ModeIcon = Truck;
                
                return (
                  <div className={styles.routeVis}>
                    <div className={styles.routeNode}>
                      <div className={styles.routeCode} style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={getLocationName(shipment.origin_airport || shipment.origin_location)}>{getLocationName(shipment.origin_airport || shipment.origin_location) || '—'}</div>
                      <div className={styles.routeName}>Origin</div>
                    </div>
                    <div className={styles.routeLine}>
                      <ModeIcon size={16} />
                    </div>
                    <div className={styles.routeNode}>
                      <div className={styles.routeCode} style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={getLocationName(shipment.destination_airport || shipment.destination_location)}>{getLocationName(shipment.destination_airport || shipment.destination_location) || '—'}</div>
                      <div className={styles.routeName}>Destination</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Column 2: Shipment Details */}
          <div>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><Box size={18} /> Cargo Details</h2>
              </div>
              <div className={styles.dataGrid}>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}><FileText size={14} /> Shipment Ref</span>
                  <span className={styles.dataValue} style={{ cursor: 'pointer', color: '#6366F1' }} onClick={() => router.push(`/operations/shipments/${booking.shipment_id}`)}>
                    {shipment ? shipment.shipment_reference : '—'}
                  </span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>Weight (kg)</span>
                  <span className={styles.dataValue}>{formatWeight(booking.requested_weight_kg)}</span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>Pieces</span>
                  <span className={styles.dataValue}>{booking.requested_pieces || 0}</span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>SHC</span>
                  <span className={styles.dataValue}>
                    {(booking.special_handling_codes && booking.special_handling_codes.length > 0) 
                      ? booking.special_handling_codes.join(', ') 
                      : 'GEN'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><ShieldAlert size={18} /> Booking Status</h2>
              </div>
              <div className={styles.dataGrid}>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>Allotment Ref</span>
                  <span className={`${styles.dataValue} ${styles.dataHighlight}`}>{booking.allotment_reference || '—'}</span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>Request Date</span>
                  <span className={styles.dataValue}>{booking.created_at ? formatDate(booking.created_at) : '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Timeline & Actions */}
          <div>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><Activity size={18} /> Process Timeline</h2>
              </div>
              <div className={styles.timeline}>
                <div className={`${styles.timelineItem} ${styles.completed}`}>
                  <div className={styles.timelineIcon}><CheckCircle2 size={16} /></div>
                  <div className={styles.timelineContent}>
                    <h4 className={styles.timelineTitle}>Request Created</h4>
                    <p className={styles.timelineDesc}>Booking request generated</p>
                    <span className={styles.timelineTime}>{booking.created_at ? formatDateTime(booking.created_at) : '—'}</span>
                  </div>
                </div>
                
                <div className={`${styles.timelineItem} ${isConfirmed ? styles.completed : styles.active}`}>
                  <div className={styles.timelineIcon}>{isConfirmed ? <CheckCircle2 size={16} /> : <Clock size={16} />}</div>
                  <div className={styles.timelineContent}>
                    <h4 className={styles.timelineTitle}>Carrier Review</h4>
                    <p className={styles.timelineDesc}>Pending space confirmation</p>
                  </div>
                </div>

                <div className={`${styles.timelineItem} ${isConfirmed ? styles.active : ''}`}>
                  <div className={styles.timelineIcon}>{isConfirmed ? <PlaneTakeoff size={16} /> : <div style={{width: 8, height: 8, borderRadius: '50%', background: 'currentColor'}} />}</div>
                  <div className={styles.timelineContent}>
                    <h4 className={styles.timelineTitle}>Space Confirmed</h4>
                    <p className={styles.timelineDesc}>{isConfirmed ? `Confirmed on ${booking.confirmed_flight_number}` : 'Awaiting carrier approval'}</p>
                    {isConfirmed && booking.updated_at && <span className={styles.timelineTime}>{formatDateTime(booking.updated_at)}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><Sparkles size={18} /> Quick Actions</h2>
              </div>
              <div className={styles.actionList}>
                {shipment && (
                  <div className={styles.actionItem} onClick={() => router.push(`/operations/shipments/${booking.shipment_id}`)}>
                    <ExternalLink size={18} /> View Shipment Record
                  </div>
                )}
                <div className={styles.actionItem}>
                  <Download size={18} /> Download e-Booking PDF
                </div>
                <div className={styles.actionItem}>
                  <Share2 size={18} /> Share Booking Details
                </div>
              </div>
            </div>
          </div>

        </div>

      {/* ══════ EDIT MODAL ══════ */}
      <Modal
        open={showEdit}
        onClose={() => {
          setShowEdit(false);
          setEditBooking(null);
        }}
        title="Edit Booking Request"
        subtitle="Update booking details"
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowEdit(false);
              setEditBooking(null);
            }}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!editBooking?.shipment_id || !editBooking?.carrier_id} style={{ background: '#6366F1', borderColor: '#6366F1' }}>
              Save Changes
            </Button>
          </>
        }
      >
        {editBooking && (
        <div className={styles.form}>
          <div className={styles.formSectionTitle}>Booking Status</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status <span style={{ color: '#f43f5e' }}>*</span></label>
              <select className="form-select" value={editBooking.status || 'Requested'} onChange={e => setEditBooking(p => ({ ...p, status: e.target.value }))}>
                {['Requested', 'Space Confirmed', 'Waitlisted', 'Rejected', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group"></div>
          </div>

          <div className={styles.formSectionTitle} style={{ marginTop: '16px' }}>Request Details</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Shipment <span style={{ color: '#f43f5e' }}>*</span></label>
              <select className="form-select" value={editBooking.shipment_id} onChange={e => {
                const shipmentId = e.target.value;
                const shipment = getShipment(shipmentId);
                setEditBooking(p => ({ 
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
              <select className="form-select" value={editBooking.carrier_id} onChange={e => setEditBooking(p => ({ ...p, carrier_id: e.target.value }))}>
                <option value="">Select Carrier...</option>
                {carriers.map(c => <option key={c.org_id} value={c.org_id}>{c.legal_name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Customer Contact</label>
              <select className="form-select" value={editBooking.customer_contact_id || ''} onChange={e => setEditBooking(p => ({ ...p, customer_contact_id: e.target.value }))}>
                <option value="">Select Contact...</option>
                {editBooking.shipment_id && (() => {
                  const s = getShipment(editBooking.shipment_id);
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
              <input className="form-input" type="date" value={editBooking.requested_flight_date} onChange={e => setEditBooking(p => ({ ...p, requested_flight_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Ready for Carriage</label>
              <input className="form-input" type="datetime-local" value={editBooking.ready_for_carriage_at} onChange={e => setEditBooking(p => ({ ...p, ready_for_carriage_at: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Requested Pieces</label>
              <input className="form-input" type="number" value={editBooking.requested_pieces} onChange={e => setEditBooking(p => ({ ...p, requested_pieces: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Requested Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" value={editBooking.requested_weight_kg} onChange={e => setEditBooking(p => ({ ...p, requested_weight_kg: e.target.value }))} placeholder="0.0" />
            </div>
          </div>

          <div className={styles.formSectionTitle} style={{ marginTop: '16px' }}>Airline Confirmation</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Confirmed Flight Number</label>
              <input className="form-input" value={editBooking.confirmed_flight_number || ''} onChange={e => setEditBooking(p => ({ ...p, confirmed_flight_number: e.target.value }))} placeholder="e.g. QR8410" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmed Flight Date</label>
              <input className="form-input" type="date" value={editBooking.confirmed_flight_date || ''} onChange={e => setEditBooking(p => ({ ...p, confirmed_flight_date: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Allotment Reference</label>
              <input className="form-input" value={editBooking.allotment_reference || ''} onChange={e => setEditBooking(p => ({ ...p, allotment_reference: e.target.value }))} placeholder="e.g. ALOT-123" />
            </div>
            <div className="form-group"></div>
          </div>

        </div>
        )}
      </Modal>

      </div>
    </div>
  );
}
