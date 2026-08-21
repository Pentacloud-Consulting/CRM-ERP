'use client';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plane, Building2, Calendar, FileText, Anchor, Clock, CheckCircle2, Box, PlaneTakeoff, ShieldAlert, Sparkles, ExternalLink, Download, Share2, Edit2, Activity } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDate, formatDateTime, formatWeight } from '@/lib/utils/formatters';

import styles from './detail.module.css';

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state } = useApp();

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
            <Button icon={Edit2} variant="secondary">Edit Booking</Button>
          </div>
        </div>

        {/* ══════ 3-COLUMN SMART GRID ══════ */}
        <div className={styles.layoutGrid}>
          
          {/* Column 1: Flight & Route */}
          <div>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><PlaneTakeoff size={18} /> Flight Information</h2>
              </div>
              <div className={styles.dataGrid}>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}><Anchor size={14} /> Flight No.</span>
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

              {shipment && (
                <div className={styles.routeVis}>
                  <div className={styles.routeNode}>
                    <div className={styles.routeCode}>{shipment.origin_airport}</div>
                    <div className={styles.routeName}>Origin</div>
                  </div>
                  <div className={styles.routeLine}>
                    <Plane size={16} />
                  </div>
                  <div className={styles.routeNode}>
                    <div className={styles.routeCode}>{shipment.destination_airport}</div>
                    <div className={styles.routeName}>Destination</div>
                  </div>
                </div>
              )}
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

      </div>
    </div>
  );
}
