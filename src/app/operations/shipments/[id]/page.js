'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Plane, FileText, ShieldCheck, AlertTriangle, MapPin, Truck, Edit, ArrowRight, Share2, CheckCircle, Receipt, Copy } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import StatusTimeline from '@/components/ui/StatusTimeline';
import { formatDate, formatDateTime, formatWeight, formatVolume, formatCurrency, formatAWBNumber, getStatusColor } from '@/lib/utils/formatters';
import { SHIPMENT_STATUSES, SERVICE_TYPES, CARGO_TYPES, INCOTERMS, INCOTERM_LABELS, AIRPORTS, CARRIERS } from '@/lib/data/seedData';
import styles from './detail.module.css';

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, dispatch, getAccount, getContact, getEventsForShipment, getClearancesForShipment, getBookingsForShipment, getAWB, getULDAllocationsForShipment, getManifestLineItemsForShipment, getULD, getManifest, getULDTotalAllocatedWeight, getManifestTotalAllocatedWeight, getDocumentsForShipment, getInvoicesForShipment } = useApp();

  const shipment = state.shipments.find(s => s.shipment_id === id);
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({});
  const [showQuickBooking, setShowQuickBooking] = useState(false);
  const [quickBookingData, setQuickBookingData] = useState({});
  const [showQuickAWB, setShowQuickAWB] = useState(false);
  const [quickAWBData, setQuickAWBData] = useState({});
  const [showQuickCustoms, setShowQuickCustoms] = useState(false);
  const [quickCustomsData, setQuickCustomsData] = useState({});
  const [showQuickULD, setShowQuickULD] = useState(false);
  const [quickULDData, setQuickULDData] = useState({});
  const [showQuickManifest, setShowQuickManifest] = useState(false);
  const [quickManifestData, setQuickManifestData] = useState({});

  const openQuickBooking = () => {
    setQuickBookingData({ carrier_id: '', requested_pieces: shipment.pieces, requested_weight_kg: shipment.chargeable_weight_kg, confirmed_flight_number: '', confirmed_flight_date: new Date().toISOString().split('T')[0] });
    setShowQuickBooking(true);
  };
  const openQuickAWB = () => {
    const carrierId = bookings[0]?.carrier_id || '';
    const carrier = CARRIERS.find(c => c.id === carrierId);
    let prefix = '157';
    if (carrier?.code === 'EK') prefix = '176';
    if (carrier?.code === 'LH') prefix = '020';
    if (carrier?.code === 'BA') prefix = '125';
    if (carrier?.code === 'SQ') prefix = '618';
    if (carrier?.code === 'CX') prefix = '160';

    setQuickAWBData({ awb_number: `${prefix}-${Math.floor(Math.random() * 99999999).toString().padStart(8, '0')}`, carrier_id: carrierId, currency: 'USD' });
    setShowQuickAWB(true);
  };
  const openQuickCustoms = () => {
    setQuickCustomsData({ declaration_number: `DEC-${Math.floor(Math.random() * 99999)}`, jurisdiction: 'Default' });
    setShowQuickCustoms(true);
  };
  const openQuickULD = () => {
    setQuickULDData({ uld_id: '', pieces: shipment.pieces, weight_kg: shipment.chargeable_weight_kg });
    setShowQuickULD(true);
  };
  const openQuickManifest = () => {
    setQuickManifestData({ manifest_id: '' });
    setShowQuickManifest(true);
  };

  if (!shipment) {
    return (
      <div className={styles.page}>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/operations/shipments')}>Back</Button>
        <div className={styles.notFound}>Shipment not found</div>
      </div>
    );
  }

  const account = getAccount(shipment.account_id);
  const events = getEventsForShipment(shipment.shipment_id);
  const clearances = getClearancesForShipment(shipment.shipment_id);
  const bookings = getBookingsForShipment(shipment.shipment_id);
  const mawb = shipment.mawb_id ? getAWB(shipment.mawb_id) : null;
  const uldAllocations = getULDAllocationsForShipment(shipment.shipment_id);
  const manifestLineItems = getManifestLineItemsForShipment(shipment.shipment_id);
  const documents = getDocumentsForShipment(shipment.shipment_id);
  const allDocsSigned = documents.length > 0 && documents.every(d => d.status === 'Signed' || d.status === 'Completed');

  const handleOpenEdit = () => {
    setEditData({
      shipment_reference: shipment.shipment_reference,
      account_id: shipment.account_id,
      service_type: shipment.service_type || 'Airport-to-Airport',
      cargo_type: shipment.cargo_type || 'General',
      origin_airport: shipment.origin_airport || '',
      destination_airport: shipment.destination_airport || '',
      incoterm: shipment.incoterm || 'CPT',
      status: shipment.status,
      pieces: shipment.pieces,
      gross_weight_kg: shipment.gross_weight_kg,
      chargeable_weight_kg: shipment.chargeable_weight_kg,
      special_handling_codes: shipment.special_handling_codes?.join(', ') || ''
    });
    setShowEdit(true);
  };

  const isBookingReady = shipment.service_type && shipment.cargo_type && shipment.origin_airport && shipment.destination_airport;

  let nextStep = null;
  const isBookingConfirmed = bookings.some(b => b.status === 'Space Confirmed');

  if (shipment.status === 'Delivered' || shipment.status === 'Closed') {
    nextStep = null;
  } else if (bookings.length === 0) {
    if (isBookingReady) {
      nextStep = { title: 'Action Required: Book Space', desc: 'Secure space with a carrier to proceed.', action: 'Request Booking', onClick: openQuickBooking };
    } else {
      nextStep = { title: 'Action Required: Complete Details', desc: 'Origin, Destination, Service, and Cargo Type are required before booking.', action: 'Edit Shipment', onClick: handleOpenEdit };
    }
  } else if (!isBookingConfirmed) {
    nextStep = { title: 'Waiting for Confirmation', desc: 'Booking is pending airline confirmation.', action: null };
  } else if (!mawb) {
    nextStep = { title: 'Action Required: Issue MAWB', desc: 'Contract of carriage needed for confirmed booking.', action: 'Issue Air Waybill', onClick: openQuickAWB };
  } else if (documents.length === 0) {
    nextStep = { title: 'Action Required: Generate Bill', desc: 'Create the Comprehensive Air Waybill for this shipment to share with the client.', action: 'Generate Bill', onClick: () => {
      dispatch({
        type: 'CREATE_DOCUMENT',
        payload: {
          shipment_id: shipment.shipment_id,
          awb_id: mawb?.awb_id,
          document_type: 'Comprehensive AWB',
          status: 'Generated',
        }
      });
    }};
  } else if (!allDocsSigned) {
    nextStep = { title: 'Awaiting Client Signature', desc: 'Documents have been generated. Share the link with your client for digital signature.', action: null };
  } else if (clearances.length === 0) {
    nextStep = { title: 'Action Required: Customs', desc: 'File clearance declaration for this shipment.', action: 'Create Clearance', onClick: openQuickCustoms };
  } else if (uldAllocations.length === 0 && shipment.cargo_type !== 'Loose') {
    nextStep = { title: 'Action Required: ULD Build-Up', desc: 'Assign this shipment to a ULD for the flight.', action: 'Assign to ULD', onClick: openQuickULD };
  } else if (manifestLineItems.length === 0) {
    nextStep = { title: 'Action Required: Flight Manifest', desc: 'Assign to a flight manifest for departure.', action: 'Add to Manifest', onClick: openQuickManifest };
  } else {
    nextStep = { title: 'In Progress', desc: 'Shipment is moving. Awaiting tracking updates.', action: null };
  }

  const handleSaveEdit = () => {
    dispatch({
      type: 'UPDATE_SHIPMENT',
      payload: {
        shipment_id: shipment.shipment_id,
        service_type: editData.service_type,
        cargo_type: editData.cargo_type,
        origin_airport: editData.origin_airport,
        destination_airport: editData.destination_airport,
        incoterm: editData.incoterm,
        status: editData.status,
        pieces: Number(editData.pieces) || 0,
        gross_weight_kg: Number(editData.gross_weight_kg) || 0,
        chargeable_weight_kg: Number(editData.chargeable_weight_kg) || 0,
        special_handling_codes: editData.special_handling_codes.split(',').map(s => s.trim()).filter(Boolean)
      }
    });
    setShowEdit(false);
  };

  const handleQuickBookingSubmit = () => {
    if (!quickBookingData.manifest_id) return;
    dispatch({
      type: 'CREATE_BOOKING',
      payload: {
        shipment_id: shipment.shipment_id,
        carrier_id: quickBookingData.carrier_id,
        requested_flight_date: quickBookingData.flight_date,
        ready_for_carriage_at: new Date().toISOString().slice(0, 16),
        requested_pieces: shipment.pieces,
        requested_weight_kg: shipment.chargeable_weight_kg,
        status: 'Space Confirmed',
        confirmed_flight_number: quickBookingData.flight_number,
        confirmed_flight_date: quickBookingData.flight_date
      }
    });
    dispatch({ type: 'UPDATE_SHIPMENT', payload: { shipment_id: shipment.shipment_id, status: 'Documentation' } });
    setShowQuickBooking(false);
  };

  const handleCreateQuickAWB = () => {
    if (!quickAWBData.carrier_id || !quickAWBData.awb_number) return;
    
    const chargeableWt = shipment.chargeable_weight_kg || 0;
    const ratePerKg = 2.50;
    const freightCharge = chargeableWt * ratePerKg;
    const otherCharges = (freightCharge * 0.15) + (chargeableWt * 0.10) + 75 + 35;
    const totalCharges = freightCharge + otherCharges + ((freightCharge + otherCharges) * 0.05);

    const accountContacts = state.contacts.filter(c => c.account_id === shipment.account_id);
    const defaultContactId = accountContacts.length > 0 ? accountContacts[0].contact_id : null;

    dispatch({
      type: 'CREATE_AWB',
      payload: {
        shipment_id: shipment.shipment_id,
        awb_number: quickAWBData.awb_number,
        awb_type: 'Master (MAWB)',
        carrier_id: quickAWBData.carrier_id,
        origin_airport: shipment.origin_airport,
        destination_airport: shipment.destination_airport,
        pieces: shipment.pieces,
        gross_weight_kg: shipment.gross_weight_kg,
        chargeable_weight_kg: shipment.chargeable_weight_kg,
        fwb_status: 'Sent',
        freight_terms: 'Prepaid',
        weight_charge: freightCharge,
        other_charges: otherCharges,
        total_charges: totalCharges,
        currency_code: quickAWBData.currency || 'USD',
        shipper_contact_id: defaultContactId,
        consignee_contact_id: defaultContactId,
        rate_class: 'Q'
      }
    });

    // Auto-generate comprehensive document after AWB creation
    dispatch({
      type: 'CREATE_DOCUMENT',
      payload: {
        shipment_id: shipment.shipment_id,
        awb_id: null, // Will be linked via shipment
        document_type: 'Comprehensive AWB',
        status: 'Generated',
      }
    });

    dispatch({ type: 'UPDATE_SHIPMENT', payload: { shipment_id: shipment.shipment_id, status: 'Ready for Carriage' } });
    setShowQuickAWB(false);
  };

  const handleCreateQuickCustoms = () => {
    if (!quickCustomsData.declaration_number) return;
    dispatch({
      type: 'CREATE_CUSTOMS',
      payload: {
        shipment_id: shipment.shipment_id,
        awb_id: mawb?.awb_id,
        clearance_type: 'Export',
        jurisdiction: quickCustomsData.jurisdiction,
        declaration_number: quickCustomsData.declaration_number,
        status: 'Cleared'
      }
    });
    dispatch({ type: 'UPDATE_SHIPMENT', payload: { shipment_id: shipment.shipment_id, status: 'In Transit' } });
    setShowQuickCustoms(false);
  };

  const handleCreateQuickULD = () => {
    if (!quickULDData.uld_id) return;
    dispatch({
      type: 'CREATE_ULD_ALLOCATION',
      payload: {
        uld_id: quickULDData.uld_id,
        shipment_id: shipment.shipment_id,
        pieces: Number(quickULDData.pieces),
        weight_kg: Number(quickULDData.weight_kg),
        notes: ''
      }
    });
    setShowQuickULD(false);
  };

  const handleCreateQuickManifest = () => {
    if (!quickManifestData.manifest_id) return;
    dispatch({
      type: 'CREATE_MANIFEST_LINE_ITEM',
      payload: {
        manifest_id: quickManifestData.manifest_id,
        shipment_id: shipment.shipment_id,
        uld_id: uldAllocations.length > 0 ? uldAllocations[0].uld_id : null,
      }
    });
    setShowQuickManifest(false);
  };

  return (
    <div className={styles.page}>
      <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/operations/shipments')}>Back to Shipments</Button>

      <div className={styles.detailHeader}>
        <div>
          <div className={styles.headerTop}>
            <h1 className={styles.ref}>{shipment.shipment_reference}</h1>
            <Badge variant={getStatusColor(shipment.status)} dot>{shipment.status}</Badge>
          </div>
          <div className={styles.headerMeta}>
            <span className={styles.route}>
              <MapPin size={14} />
              {shipment.origin_airport} → {shipment.destination_airport}
            </span>
            <span>·</span>
            <span>{account?.legal_name || '—'}</span>
            <span>·</span>
            <span>{shipment.service_type}</span>
          </div>
        </div>
        <div className={styles.detailActions}>
          <Button variant="secondary" icon={Edit} onClick={handleOpenEdit}>Edit Shipment</Button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        {[
          { label: 'Booking', active: bookings.length > 0 },
          { label: 'MAWB', active: !!mawb },
          { label: 'Comprehensive Bill', active: documents.length > 0 },
          { label: 'Signature', active: allDocsSigned },
          { label: 'Customs', active: clearances.length > 0 },
          { label: 'ULD Build-Up', active: uldAllocations.length > 0, skip: shipment.cargo_type === 'Loose' },
          { label: 'Manifest', active: manifestLineItems.length > 0 }
        ].filter(s => !s.skip).map((step, idx, arr) => (
          <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
              backgroundColor: step.active ? 'var(--success-bg)' : 'var(--bg-secondary)',
              color: step.active ? 'var(--success-color)' : 'var(--text-tertiary)',
              border: `1px solid ${step.active ? 'var(--success-border)' : 'var(--border-color)'}`,
              transition: 'all 0.2s'
            }}>
              {step.label}
            </div>
            {idx < arr.length - 1 && <ArrowRight size={14} color="var(--text-tertiary)" />}
          </div>
        ))}
      </div>

      {nextStep && (
        <div className={styles.nextStepBanner}>
          <div className={styles.nextStepInfo}>
            <div className={styles.nextStepIconBox}>
              {nextStep.action ? <AlertTriangle size={20} /> : <Truck size={20} />}
            </div>
            <div>
              <h3 className={styles.nextStepTitle}>{nextStep.title}</h3>
              <p className={styles.nextStepDesc}>{nextStep.desc}</p>
            </div>
          </div>
          {nextStep.action && (
            <Button onClick={nextStep.onClick} icon={ArrowRight}>{nextStep.action}</Button>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Pieces</span>
          <span className={styles.statValue}>{shipment.pieces}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Gross Weight</span>
          <span className={styles.statValue}>{formatWeight(shipment.gross_weight_kg)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Chargeable Weight</span>
          <span className={styles.statValue}>{formatWeight(shipment.chargeable_weight_kg)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Cargo Type</span>
          <span className={styles.statValue}>{shipment.cargo_type}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Incoterm</span>
          <span className={styles.statValue}>{shipment.incoterm}</span>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Truck size={16} />
          Tracking Timeline
        </h2>
        <div className={styles.timelineCard}>
          <StatusTimeline events={events} />
        </div>
      </div>

      <div className={styles.twoCol}>
        {/* AWB Info */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <FileText size={16} />
            Air Waybill
          </h2>
          {mawb ? (
            <div className={styles.infoCard} onClick={() => router.push(`/operations/awb/${mawb.awb_id}`)}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>MAWB Number</span>
                <span className={styles.awbNum}>{formatAWBNumber(mawb.awb_number)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>FWB Status</span>
                <Badge variant={getStatusColor(mawb.fwb_status)}>{mawb.fwb_status}</Badge>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Freight Terms</span>
                <span>{mawb.freight_terms}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Total Charges</span>
                <span className="tabular-nums">{formatCurrency(mawb.total_charges, mawb.currency_code)}</span>
              </div>
            </div>
          ) : (
            <div className={styles.emptyCard}>No AWB linked yet</div>
          )}
        </div>

        {/* Bookings */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Plane size={16} />
            Bookings
          </h2>
          {bookings.length > 0 ? (
            <div className={styles.bookingsList}>
              {bookings.map(bkr => (
                <div key={bkr.booking_request_id} className={styles.infoCard}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Status</span>
                    <Badge variant={getStatusColor(bkr.status)} dot>{bkr.status}</Badge>
                  </div>
                  {bkr.confirmed_flight_number && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Flight</span>
                      <span className={styles.flight}>{bkr.confirmed_flight_number}</span>
                    </div>
                  )}
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Date</span>
                    <span>{formatDate(bkr.confirmed_flight_date || bkr.requested_flight_date)}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Weight</span>
                    <span className="tabular-nums">{formatWeight(bkr.requested_weight_kg)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyCard}>No bookings yet</div>
          )}
        </div>
      </div>

      {/* Documents Section */}
      {(documents.length > 0 || mawb) && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <FileText size={16} />
            Comprehensive Air Waybill & Invoice
          </h2>
          {documents.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {documents.map(doc => {
                const getDocColor = (s) => {
                  if (s === 'Signed' || s === 'Completed') return 'success';
                  if (s === 'Viewed') return 'warning';
                  if (s === 'Shared') return 'info';
                  return 'neutral';
                };
                return (
                  <div key={doc.document_id} className={styles.infoCard} style={{ cursor: 'pointer' }} onClick={() => router.push(`/operations/documents/${doc.document_id}`)}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>{doc.document_type}</span>
                      <Badge variant={getDocColor(doc.status)} dot>{doc.status}</Badge>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Created</span>
                      <span style={{ fontSize: 'var(--text-sm)' }}>{formatDate(doc.created_at)}</span>
                    </div>
                    {doc.signed_at && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Signed by</span>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--success-color)' }}>
                          <CheckCircle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                          {doc.signer_name}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `${window.location.origin}/sign/${doc.share_token}`;
                          navigator.clipboard.writeText(url);
                          if (doc.status === 'Generated') {
                            dispatch({ type: 'UPDATE_DOCUMENT', payload: { document_id: doc.document_id, status: 'Shared' } });
                          }
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', borderRadius: 6, cursor: 'pointer' }}
                      >
                        <Copy size={11} /> Copy Link
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <div className={styles.emptyCard} style={{ marginBottom: 12 }}>No documents generated yet</div>
              <Button onClick={() => {
                dispatch({
                  type: 'CREATE_DOCUMENT',
                  payload: {
                    shipment_id: shipment.shipment_id,
                    awb_id: mawb?.awb_id,
                    document_type: 'Comprehensive AWB',
                    status: 'Generated',
                  }
                });
              }} icon={FileText}>Generate Bill</Button>
            </div>
          )}
        </div>
      )}




      {clearances.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <ShieldCheck size={16} />
            Customs Clearance
          </h2>
          {clearances.map(clr => (
            <div key={clr.clearance_id} className={`${styles.infoCard} ${clr.status === 'Held' ? styles.heldCard : ''}`}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Jurisdiction</span>
                <span className={styles.jurisdiction}>{clr.jurisdiction}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Status</span>
                <Badge variant={getStatusColor(clr.status)} dot>{clr.status}</Badge>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Declaration</span>
                <span className={styles.decl}>{clr.declaration_number}</span>
              </div>
              {clr.hold_reason && (
                <div className={styles.holdReason}>
                  <AlertTriangle size={14} />
                  <span>{clr.hold_reason}</span>
                </div>
              )}
              {clr.hs_codes?.length > 0 && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>HS Codes</span>
                  <span className={styles.hsCodes}>{clr.hs_codes.join(', ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ULD and Manifest tracking */}
      {(uldAllocations.length > 0 || manifestLineItems.length > 0) && (
        <div className={styles.twoCol}>
          {/* ULD Allocations */}
          {uldAllocations.length > 0 ? (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Package size={16} />
                ULD Build-Up
              </h2>
              <div className={styles.bookingsList}>
                {uldAllocations.map(alloc => {
                  const uld = getULD(alloc.uld_id);
                  return (
                    <div key={alloc.uld_allocation_id} className={styles.infoCard} onClick={() => router.push(`/operations/uld`)} style={{cursor: 'pointer'}}>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>ULD Number</span>
                        <span className={styles.awbNum}>{uld?.uld_number}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Status</span>
                        <Badge variant={getStatusColor(uld?.status)}>{uld?.status}</Badge>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Packed Pieces</span>
                        <span>{alloc.pieces}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Packed Weight</span>
                        <span className="tabular-nums">{formatWeight(alloc.weight_kg)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : <div />}

          {/* Flight Manifests */}
          {manifestLineItems.length > 0 ? (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Plane size={16} />
                Flight Manifests
              </h2>
              <div className={styles.bookingsList}>
                {manifestLineItems.map(item => {
                  const manifest = getManifest(item.manifest_id);
                  return (
                    <div key={item.manifest_line_item_id} className={styles.infoCard} onClick={() => router.push(`/operations/manifests`)} style={{cursor: 'pointer'}}>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Flight</span>
                        <span className={styles.flight}>{manifest?.flight_number}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Date</span>
                        <span>{formatDate(manifest?.departure_date)}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Status</span>
                        <Badge variant={getStatusColor(manifest?.status)} dot>{manifest?.status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : <div />}
        </div>
      )}

      {/* Special Handling */}
      {shipment.special_handling_codes?.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AlertTriangle size={16} />
            Special Handling
          </h2>
          <div className={styles.shcList}>
            {shipment.special_handling_codes.map(shc => (
              <Badge key={shc} variant="warning">{shc}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Shipment"
        subtitle={`Update details for ${shipment.shipment_reference}`}
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Shipment Reference</label>
              <input className="form-input" value={editData.shipment_reference || ''} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Account</label>
              <select className="form-select" value={editData.account_id || ''} disabled>
                <option value={editData.account_id}>{account?.legal_name || '—'}</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Service Type</label>
              <select className="form-select" value={editData.service_type || ''} onChange={e => setEditData({ ...editData, service_type: e.target.value })}>
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cargo Type</label>
              <select className="form-select" value={editData.cargo_type || ''} onChange={e => setEditData({ ...editData, cargo_type: e.target.value })}>
                {CARGO_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Origin Airport</label>
              <select className="form-select" value={editData.origin_airport || ''} onChange={e => setEditData({ ...editData, origin_airport: e.target.value })}>
                <option value="">Select Origin...</option>
                {Object.values(AIRPORTS).map(a => <option key={a.code} value={a.code}>{a.code} - {a.city}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Destination Airport</label>
              <select className="form-select" value={editData.destination_airport || ''} onChange={e => setEditData({ ...editData, destination_airport: e.target.value })}>
                <option value="">Select Destination...</option>
                {Object.values(AIRPORTS).map(a => <option key={a.code} value={a.code}>{a.code} - {a.city}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Special Handling Codes (Comma separated)</label>
              <input className="form-input" value={editData.special_handling_codes || ''} onChange={e => setEditData({ ...editData, special_handling_codes: e.target.value })} placeholder="e.g. PER, DGR, AVI" />
            </div>
            <div className="form-group">
              <label className="form-label">Pieces</label>
              <input className="form-input" type="number" value={editData.pieces || ''} onChange={e => setEditData({ ...editData, pieces: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Gross Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" value={editData.gross_weight_kg || ''} onChange={e => setEditData({ ...editData, gross_weight_kg: e.target.value })} placeholder="0.0" />
            </div>
            <div className="form-group">
              <label className="form-label">Chargeable Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" value={editData.chargeable_weight_kg || ''} onChange={e => setEditData({ ...editData, chargeable_weight_kg: e.target.value })} placeholder="0.0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Incoterm</label>
              <select className="form-select" value={editData.incoterm || ''} onChange={e => setEditData({ ...editData, incoterm: e.target.value })}>
                {INCOTERMS.map(i => <option key={i} value={i}>{INCOTERM_LABELS[i]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={editData.status || ''} onChange={e => setEditData({ ...editData, status: e.target.value })}>
                {SHIPMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Quick Actions Modals */}
      <Modal
        open={showQuickBooking}
        onClose={() => setShowQuickBooking(false)}
        title="Quick Action: Book Space"
        subtitle="Secure space on a scheduled flight for this shipment"
        size="medium"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowQuickBooking(false)}>Cancel</Button>
            <Button onClick={handleQuickBookingSubmit} disabled={!quickBookingData.manifest_id}>Confirm Booking</Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className="form-group">
            <label className="form-label">Select Scheduled Flight *</label>
            <select className="form-select" value={quickBookingData.manifest_id || ''} onChange={e => {
              const manifestId = e.target.value;
              const manifest = state.flightManifests.find(m => m.manifest_id === manifestId);
              if (manifest) {
                setQuickBookingData({
                  ...quickBookingData,
                  manifest_id: manifestId,
                  carrier_id: manifest.carrier_id,
                  flight_number: manifest.flight_number,
                  flight_date: manifest.flight_date
                });
              } else {
                setQuickBookingData({ ...quickBookingData, manifest_id: '', carrier_id: '', flight_number: '', flight_date: '' });
              }
            }}>
              <option value="">Select Flight with Available Capacity...</option>
              {state.flightManifests
                .filter(m => m.departure_airport === shipment.origin_airport && m.arrival_airport === shipment.destination_airport)
                .map(m => {
                 const allocated = getManifestTotalAllocatedWeight(m.manifest_id);
                 const available = Math.max(0, (m.max_weight_kg || 10000) - allocated);
                 const isDisabled = available < (shipment.chargeable_weight_kg || 0);
                 const car = CARRIERS.find(c => c.id === m.carrier_id);
                 return (
                   <option key={m.manifest_id} value={m.manifest_id} disabled={isDisabled}>
                     {car?.code} {m.flight_number} ({m.departure_airport}➔{m.arrival_airport}) on {formatDate(m.flight_date)} — {formatWeight(available)} available
                   </option>
                 );
              })}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pieces</label>
              <input className="form-input" type="number" value={quickBookingData.pieces || ''} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input className="form-input" type="number" value={quickBookingData.weight_kg || ''} disabled />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showQuickAWB} onClose={() => setShowQuickAWB(false)}
        title="Quick Action: Issue MAWB" subtitle="Generate Master Air Waybill"
        footer={<><Button variant="secondary" onClick={() => setShowQuickAWB(false)}>Cancel</Button><Button onClick={handleCreateQuickAWB} disabled={!quickAWBData.carrier_id || !quickAWBData.awb_number}>Generate AWB</Button></>}
      >
        <div className={styles.form}>
          <div className="form-group">
            <label className="form-label">AWB Number *</label>
            <input className="form-input" value={quickAWBData.awb_number || ''} onChange={e => setQuickAWBData({ ...quickAWBData, awb_number: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Carrier *</label>
              <select className="form-select" value={quickAWBData.carrier_id || ''} disabled>
                <option value="">Select Carrier...</option>
                {CARRIERS.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Currency</label>
              <select className="form-select" value={quickAWBData.currency || 'USD'} onChange={e => setQuickAWBData({ ...quickAWBData, currency: e.target.value })}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
                <option value="QAR">QAR</option>
                <option value="AED">AED</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showQuickCustoms} onClose={() => setShowQuickCustoms(false)}
        title="Quick Action: File Customs" subtitle="Create clearance declaration"
        footer={<><Button variant="secondary" onClick={() => setShowQuickCustoms(false)}>Cancel</Button><Button onClick={handleCreateQuickCustoms} disabled={!quickCustomsData.declaration_number}>File Customs</Button></>}
      >
        <div className={styles.form}>
          <div className="form-group">
            <label className="form-label">Declaration Number *</label>
            <input className="form-input" value={quickCustomsData.declaration_number || ''} onChange={e => setQuickCustomsData({ ...quickCustomsData, declaration_number: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Jurisdiction</label>
            <input className="form-input" value={quickCustomsData.jurisdiction || ''} onChange={e => setQuickCustomsData({ ...quickCustomsData, jurisdiction: e.target.value })} />
          </div>
        </div>
      </Modal>

      <Modal
        open={showQuickULD} onClose={() => setShowQuickULD(false)}
        title="Quick Action: Assign to ULD" subtitle="Pack this shipment into an airline container"
        footer={<><Button variant="secondary" onClick={() => setShowQuickULD(false)}>Cancel</Button><Button onClick={handleCreateQuickULD} disabled={!quickULDData.uld_id}>Assign to ULD</Button></>}
      >
        <div className={styles.form}>
          <div className="form-group">
            <label className="form-label">ULD *</label>
            <select className="form-select" value={quickULDData.uld_id || ''} onChange={e => setQuickULDData({ ...quickULDData, uld_id: e.target.value })}>
              <option value="">Select ULD...</option>
              {state.ulds.map(u => {
                 const allocated = getULDTotalAllocatedWeight(u.uld_id);
                 const available = Math.max(0, (u.max_gross_weight_kg || u.max_weight_kg || 0) - (u.tare_weight_kg || 0) - allocated);
                 const isDisabled = available < (shipment.chargeable_weight_kg || 0);
                 return (
                   <option key={u.uld_id} value={u.uld_id} disabled={isDisabled}>
                     {u.uld_number} ({u.type}) - {formatWeight(available)} available
                   </option>
                 );
              })}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pieces</label>
              <input className="form-input" type="number" value={quickULDData.pieces || ''} onChange={e => setQuickULDData({ ...quickULDData, pieces: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" value={quickULDData.weight_kg || ''} onChange={e => setQuickULDData({ ...quickULDData, weight_kg: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showQuickManifest} onClose={() => setShowQuickManifest(false)}
        title="Quick Action: Add to Manifest" subtitle="Assign to a flight manifest for departure"
        footer={<><Button variant="secondary" onClick={() => setShowQuickManifest(false)}>Cancel</Button><Button onClick={handleCreateQuickManifest} disabled={!quickManifestData.manifest_id}>Add to Manifest</Button></>}
      >
        <div className={styles.form}>
          <div className="form-group">
            <label className="form-label">Flight Manifest *</label>
            <select className="form-select" value={quickManifestData.manifest_id || ''} onChange={e => setQuickManifestData({ ...quickManifestData, manifest_id: e.target.value })}>
              <option value="">Select Flight Manifest...</option>
              {state.flightManifests
                .filter(m => m.departure_airport === shipment.origin_airport && m.arrival_airport === shipment.destination_airport)
                .map(m => {
                 const allocated = getManifestTotalAllocatedWeight(m.manifest_id);
                 const available = Math.max(0, (m.max_weight_kg || 10000) - allocated);
                 const isDisabled = available < (shipment.chargeable_weight_kg || 0);
                 return (
                   <option key={m.manifest_id} value={m.manifest_id} disabled={isDisabled}>
                     {m.flight_number} ({m.departure_airport}-{m.arrival_airport}) on {formatDate(m.flight_date)} - {formatWeight(available)} available
                   </option>
                 );
              })}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
