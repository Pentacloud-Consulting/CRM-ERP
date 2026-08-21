'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Plane, FileText, ShieldCheck, AlertTriangle, MapPin, Truck, Edit, ArrowRight, CheckCircle, Copy, Clock, Zap, RefreshCw, CalendarDays, ClipboardList, PartyPopper, ChevronRight } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate, formatDateTime, formatWeight, formatCurrency, formatAWBNumber, getStatusColor } from '@/lib/utils/formatters';
import { SHIPMENT_STATUSES, SERVICE_TYPES, CARGO_TYPES, INCOTERMS, INCOTERM_LABELS, LOCATIONS, TRANSPORT_PROVIDERS, TRANSPORT_MODES, CONTAINER_TYPES, TRUCK_TYPES } from '@/lib/data/seedData';
import AsyncLocationSelect from '@/components/ui/AsyncLocationSelect';
import { getLocationName } from '@/app/crm/leads/page';
import styles from './detail.module.css';

// ──────────── ULD status constants ────────────
const ULD_STATUSES = ['Packaging', 'Loaded in Container', 'Moved to Airline', 'Delivered to Airline'];
const ULD_STATUS_MAP = { 'Build-Up in Progress': 0, 'Packaging': 0, 'Built-Up': 1, 'Loaded in Container': 1, 'Loaded': 2, 'Moved to Airline': 2, 'In Transit': 3, 'Delivered to Airline': 3 };

// ──────────── Flight tracking constants ────────────
const FLIGHT_TRACKING_STEPS = ['Loaded', 'Take Off', 'In Transit', 'Landed'];

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, dispatch, getOrganization, getEventsForShipment, getClearancesForShipment, getBookingsForShipment, getAWB, getULDAllocationsForShipment, getManifestLineItemsForShipment, getULD, getManifest, getULDTotalAllocatedWeight, getManifestTotalAllocatedWeight, getDocumentsForShipment } = useApp();

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
  const [expandedStage, setExpandedStage] = useState(null);

  // ──────────── Quick action openers ────────────
  const openQuickBooking = () => {
    setQuickBookingData({ manifest_id: '', carrier_id: '', pieces: shipment.pieces, weight_kg: shipment.chargeable_weight_kg, flight_number: '', flight_date: new Date().toISOString().split('T')[0] });
    setShowQuickBooking(true);
  };
  const openQuickAWB = () => {
    const carrierId = bookings[0]?.carrier_id || '';
    const carrier = state.organizations.find(c => c.org_id === carrierId);
    let prefix = '157';
    if (carrier?.code === 'EK') prefix = '176';
    if (carrier?.code === 'LH') prefix = '020';
    if (carrier?.code === 'BA') prefix = '125';
    if (carrier?.code === 'SQ') prefix = '618';
    if (carrier?.code === 'CX') prefix = '160';
    setQuickAWBData({ awb_number: `${prefix}-${Math.floor(Math.random() * 99999999).toString().padStart(8, '0')}`, carrier_id: carrierId, currency: 'USD' });
    setShowQuickAWB(true);
  };
  const openQuickCustoms = (type = 'Export') => {
    setQuickCustomsData({ declaration_number: `DEC-${Math.floor(Math.random() * 99999)}`, jurisdiction: type === 'Export' ? shipment.origin_airport : shipment.destination_airport, clearance_type: type });
    setShowQuickCustoms(true);
  };
  const openQuickULD = () => {
    setQuickULDData({ uld_id: '', pieces: shipment.pieces, weight_kg: shipment.chargeable_weight_kg });
    setShowQuickULD(true);
  };
  const openQuickManifest = () => {
    // Auto-fetch the booking flight manifest
    const confirmedBooking = bookings.find(b => b.status === 'Space Confirmed') || bookings[0];
    const matchingManifest = confirmedBooking ? state.transportManifests.find(m => m.flight_number === confirmedBooking.confirmed_flight_number && m.flight_date === confirmedBooking.confirmed_flight_date) : null;
    setQuickManifestData({ manifest_id: matchingManifest ? matchingManifest.manifest_id : '' });
    setShowQuickManifest(true);
  };

  // ──────────── Audit Timeline (must be before early return to maintain hooks order) ────────────
  const auditEvents = useMemo(() => {
    if (!shipment) return [];
    const items = [];
    const evts = state.trackingEvents.filter(e => e.shipment_id === shipment.shipment_id).sort((a, b) => new Date(a.event_timestamp) - new Date(b.event_timestamp));
    evts.forEach(evt => {
      let desc = evt.event_description || evt.event_code;
      if (desc.includes('{"name"')) {
        try { desc = desc.replace(/\{.*\}/g, match => getLocationName(match)); } catch(e) {}
      }
      items.push({ time: evt.event_timestamp, message: desc, source: evt.tracking_source || 'System', type: 'auto' });
    });
    state.domainEvents?.filter(de => de.message?.includes(shipment.shipment_reference) || de.message?.includes(shipment.shipment_id)).forEach(de => {
      items.push({ time: de.timestamp, message: de.message, source: 'System', type: 'system' });
    });
    const bkgs = state.bookingRequests.filter(b => b.shipment_id === shipment.shipment_id);
    bkgs.forEach(b => {
      items.push({ time: b.created_at, message: `Booking ${b.status} — ${b.confirmed_flight_number || 'Pending'}`, source: 'Operations', type: 'manual' });
    });
    const clrs = state.customsClearances.filter(c => c.shipment_id === shipment.shipment_id);
    clrs.forEach(c => {
      items.push({ time: c.created_at, message: `${c.clearance_type} Customs — ${c.status} (${c.declaration_number})`, source: 'Customs', type: 'manual' });
    });
    const uldAllocs = state.uldAllocations.filter(u => u.shipment_id === shipment.shipment_id);
    if (uldAllocs.length > 0) {
      const uld = state.ulds.find(u => u.uld_id === uldAllocs[0].uld_id);
      if (uld?.status_history) {
        uld.status_history.forEach(h => {
          items.push({ time: h.timestamp, message: `ULD ${uld.uld_number}: ${h.status}`, source: h.updated_by, type: 'manual' });
        });
      }
    }
    return items.sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [shipment, state.trackingEvents, state.domainEvents, state.bookingRequests, state.customsClearances, state.uldAllocations, state.ulds]);

  // ──────────── Early return if no shipment ────────────
  if (!shipment) {
    return (
      <div className={styles.page}>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/operations/shipments')}>Back</Button>
        <div className={styles.notFound}>Shipment not found</div>
      </div>
    );
  }

  // ──────────── Data lookups ────────────
  const account = getOrganization(shipment.org_id);
  const events = getEventsForShipment(shipment.shipment_id);
  const clearances = getClearancesForShipment(shipment.shipment_id);
  const bookings = getBookingsForShipment(shipment.shipment_id);
  const mawb = shipment.mawb_id ? getAWB(shipment.mawb_id) : null;
  const uldAllocations = getULDAllocationsForShipment(shipment.shipment_id);
  const manifestLineItems = getManifestLineItemsForShipment(shipment.shipment_id);
  const documents = getDocumentsForShipment(shipment.shipment_id);
  const allDocsSigned = documents.length > 0 && documents.every(d => d.status === 'Signed' || d.status === 'Completed');
  const exportClearances = clearances.filter(c => c.clearance_type === 'Export');
  const importClearances = clearances.filter(c => c.clearance_type === 'Import');
  const isBookingConfirmed = bookings.some(b => b.status === 'Space Confirmed');
  const confirmedBooking = bookings.find(b => b.status === 'Space Confirmed') || bookings[0];
  const confirmedCarrier = confirmedBooking ? state.organizations.find(c => c.org_id === confirmedBooking.carrier_id) : null;
  const carriers = state.organizations.filter(o => o.org_type === 'Carrier');
  const isBookingReady = shipment.service_type && shipment.cargo_type && (shipment.origin_airport || shipment.origin_location) && (shipment.destination_airport || shipment.destination_location);

  // ULD status resolution
  const primaryULDAlloc = uldAllocations[0];
  const primaryULD = primaryULDAlloc ? getULD(primaryULDAlloc.uld_id) : null;
  const uldCurrentIndex = primaryULD ? (ULD_STATUS_MAP[primaryULD.status] ?? -1) : -1;
  const isULDDeliveredToAirline = uldCurrentIndex >= 3;

  // Flight tracking index
  const hasRCS = events.some(e => e.event_code === 'RCS');
  const hasDEP = events.some(e => e.event_code === 'DEP');
  const hasARR = events.some(e => e.event_code === 'ARR');
  const hasRCF = events.some(e => e.event_code === 'RCF');
  const flightTrackingIndex = hasARR ? 3 : (hasDEP ? 2 : (hasRCS ? 0 : -1));

  // ──────────── Master stage computation ────────────
  const masterStages = [
    { key: 'booking', label: 'Booking', icon: CalendarDays, animClass: 'icon-pulse', completed: isBookingConfirmed },
    { key: 'awb', label: 'AWB & Docs', icon: FileText, animClass: 'icon-float', completed: mawb && allDocsSigned },
    { key: 'origin_customs', label: 'Origin Customs', icon: ShieldCheck, animClass: 'icon-glow', completed: exportClearances.length > 0 },
    { key: 'uld', label: shipment.transport_mode === 'SEA' ? 'Container' : shipment.transport_mode === 'ROAD' ? 'Vehicle' : 'ULD', icon: Package, animClass: 'icon-rotate', completed: isULDDeliveredToAirline, skip: shipment.cargo_type === 'Loose' },
    { key: 'manifest', label: 'Manifest', icon: ClipboardList, animClass: 'icon-draw', completed: manifestLineItems.length > 0 },
    { key: 'tracking', label: 'Flight Tracking', icon: Plane, animClass: 'icon-fly', completed: hasARR },
    { key: 'dest_customs', label: 'Dest. Customs', icon: ShieldCheck, animClass: 'icon-scan', completed: importClearances.length > 0 },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle, animClass: 'icon-celebrate', completed: shipment.status === 'Delivered' },
  ].filter(s => !s.skip);

  const currentStageIndex = masterStages.reduce((acc, s, i) => s.completed ? i : acc, -1);

  // ──────────── Next Step Logic (strict dependency chain) ────────────
  let nextStep = null;
  if (shipment.status === 'Delivered' || shipment.status === 'Closed') {
    nextStep = null;
  } else if (bookings.length === 0) {
    nextStep = isBookingReady
      ? { title: 'Action Required: Book Space', desc: 'Select a flight and secure space with a carrier.', action: 'Request Booking', onClick: openQuickBooking }
      : { title: 'Action Required: Complete Details', desc: 'Origin, Destination, Service, and Cargo Type are required.', action: 'Edit Shipment', onClick: () => handleOpenEdit() };
  } else if (!isBookingConfirmed) {
    nextStep = { title: 'Waiting for Confirmation', desc: 'Booking is pending airline confirmation.', action: null };
  } else if (!mawb || !allDocsSigned) {
    nextStep = !mawb
      ? { title: 'Action Required: Issue MAWB', desc: 'Generate the contract of carriage.', action: 'Issue Air Waybill', onClick: openQuickAWB }
      : { title: 'Action Required: Finalize Docs', desc: 'Documents need to be generated and signed.', action: 'Generate Bill', onClick: () => { if (documents.length === 0) dispatch({ type: 'CREATE_DOCUMENT', payload: { shipment_id: shipment.shipment_id, awb_id: mawb?.awb_id, document_type: 'Comprehensive AWB', status: 'Generated' } }); } };
  } else if (exportClearances.length === 0) {
    nextStep = { title: 'Action Required: Origin Customs', desc: 'File export clearance before ULD build-up.', action: 'File Customs', onClick: () => openQuickCustoms('Export') };
  } else if (shipment.cargo_type !== 'Loose' && !isULDDeliveredToAirline) {
    nextStep = uldAllocations.length === 0
      ? { title: `Action Required: ${shipment.transport_mode === 'SEA' ? 'Container Stuffing' : shipment.transport_mode === 'ROAD' ? 'Vehicle Loading' : 'ULD Build-Up'}`, desc: `Assign shipment to ${shipment.transport_mode === 'SEA' ? 'a container' : shipment.transport_mode === 'ROAD' ? 'a vehicle' : 'a ULD'}.`, action: `Assign to ${shipment.transport_mode === 'SEA' ? 'Container' : shipment.transport_mode === 'ROAD' ? 'Vehicle' : 'ULD'}`, onClick: openQuickULD }
      : { title: `${shipment.transport_mode === 'SEA' ? 'Container' : shipment.transport_mode === 'ROAD' ? 'Vehicle' : 'ULD'} In Progress`, desc: `Current: ${primaryULD?.status || 'Unknown'}. Update status to proceed.`, action: `Update ${shipment.transport_mode === 'SEA' ? 'Container' : shipment.transport_mode === 'ROAD' ? 'Vehicle' : 'ULD'}`, onClick: () => handleAdvanceULD() };
  } else if (manifestLineItems.length === 0) {
    nextStep = { title: `Action Required: Transport Manifest`, desc: 'Assign to transport manifest for routing.', action: 'Add to Manifest', onClick: openQuickManifest };
  } else if (events.length === 0) {
    nextStep = { title: `Ready for ${shipment.transport_mode === 'SEA' ? 'Voyage' : shipment.transport_mode === 'ROAD' ? 'Transit' : 'Flight'}`, desc: `Initiate ${shipment.transport_mode === 'SEA' ? 'vessel' : shipment.transport_mode === 'ROAD' ? 'vehicle' : 'flight'} tracking.`, action: 'Start Tracking', onClick: () => {
      dispatch({ type: 'SIMULATE_FLIGHT_TRACKING', payload: { shipment_id: shipment.shipment_id, flight_date: confirmedBooking?.confirmed_flight_date || confirmedBooking?.requested_flight_date, origin_airport: getLocationName(shipment.origin_airport || shipment.origin_location), destination_airport: getLocationName(shipment.destination_airport || shipment.destination_location), mode: shipment.transport_mode } });
    }};
  } else if (!hasARR) {
    nextStep = { title: 'In Transit', desc: 'Flight is airborne. Waiting for arrival update.', action: null };
  } else if (importClearances.length === 0) {
    nextStep = { title: 'Action Required: Destination Customs', desc: 'File import clearance at destination.', action: 'File Customs', onClick: () => openQuickCustoms('Import') };
  } else if (shipment.status !== 'Delivered') {
    nextStep = { title: 'Action Required: Confirm Delivery', desc: 'Cargo has cleared customs. Confirm final delivery.', action: 'Mark Delivered', onClick: () => dispatch({ type: 'UPDATE_SHIPMENT', payload: { shipment_id: shipment.shipment_id, status: 'Delivered' } }) };
  }

  // ──────────── Handlers ────────────
  const handleOpenEdit = () => {
    setEditData({
      shipment_reference: shipment.shipment_reference, org_id: shipment.org_id,
      transport_mode: shipment.transport_mode || 'AIR',
      service_type: shipment.service_type || 'Airport-to-Airport', cargo_type: shipment.cargo_type || 'General',
      origin_airport: shipment.origin_airport || '', destination_airport: shipment.destination_airport || '',
      origin_location: shipment.origin_location || '', destination_location: shipment.destination_location || '',
      port_of_loading: shipment.port_of_loading || '', port_of_discharge: shipment.port_of_discharge || '',
      flight_number: shipment.flight_number || '',
      container_type: shipment.container_type || '', container_number: shipment.container_number || '', voyage_number: shipment.voyage_number || '',
      truck_type: shipment.truck_type || '', vehicle_number: shipment.vehicle_number || '', driver_name: shipment.driver_name || '',
      incoterm: shipment.incoterm || 'CPT', status: shipment.status,
      pieces: shipment.pieces, gross_weight_kg: shipment.gross_weight_kg,
      chargeable_weight_kg: shipment.chargeable_weight_kg,
      special_handling_codes: shipment.special_handling_codes?.join(', ') || ''
    });
    setShowEdit(true);
  };

  const handleSaveEdit = () => {
    dispatch({ type: 'UPDATE_SHIPMENT', payload: {
      shipment_id: shipment.shipment_id, 
      transport_mode: editData.transport_mode,
      service_type: editData.service_type, cargo_type: editData.cargo_type,
      origin_airport: editData.origin_airport, destination_airport: editData.destination_airport,
      origin_location: editData.origin_location, destination_location: editData.destination_location,
      port_of_loading: editData.port_of_loading, port_of_discharge: editData.port_of_discharge,
      flight_number: editData.flight_number,
      container_type: editData.container_type, container_number: editData.container_number, voyage_number: editData.voyage_number,
      truck_type: editData.truck_type, vehicle_number: editData.vehicle_number, driver_name: editData.driver_name,
      incoterm: editData.incoterm, status: editData.status,
      pieces: Number(editData.pieces) || 0, gross_weight_kg: Number(editData.gross_weight_kg) || 0,
      chargeable_weight_kg: Number(editData.chargeable_weight_kg) || 0,
      special_handling_codes: (typeof editData.special_handling_codes === 'string' ? editData.special_handling_codes : '').split(',').map(s => s.trim()).filter(Boolean)
    }});
    setShowEdit(false);
  };

  const handleQuickBookingSubmit = () => {
    if (!quickBookingData.manifest_id) return;
    dispatch({ type: 'CREATE_BOOKING', payload: {
      shipment_id: shipment.shipment_id, carrier_id: quickBookingData.carrier_id,
      requested_flight_date: quickBookingData.flight_date,
      ready_for_carriage_at: new Date().toISOString().slice(0, 16),
      requested_pieces: shipment.pieces, requested_weight_kg: shipment.chargeable_weight_kg,
      status: 'Space Confirmed', confirmed_flight_number: quickBookingData.flight_number,
      confirmed_flight_date: quickBookingData.flight_date
    }});
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
    const accountContacts = state.contacts.filter(c => c.org_id === shipment.org_id);
    const defaultContactId = accountContacts.length > 0 ? accountContacts[0].contact_id : null;

    dispatch({ type: 'CREATE_AWB', payload: {
      shipment_id: shipment.shipment_id, awb_number: quickAWBData.awb_number,
      awb_type: 'Master (MAWB)', carrier_id: quickAWBData.carrier_id,
      origin_airport: shipment.origin_airport, destination_airport: shipment.destination_airport,
      pieces: shipment.pieces, gross_weight_kg: shipment.gross_weight_kg,
      chargeable_weight_kg: shipment.chargeable_weight_kg, fwb_status: 'Sent',
      freight_terms: 'Prepaid', weight_charge: freightCharge, other_charges: otherCharges,
      total_charges: totalCharges, currency_code: quickAWBData.currency || 'USD',
      shipper_contact_id: defaultContactId, consignee_contact_id: defaultContactId, rate_class: 'Q'
    }});
    dispatch({ type: 'CREATE_DOCUMENT', payload: { shipment_id: shipment.shipment_id, awb_id: null, document_type: 'Comprehensive AWB', status: 'Generated' } });
    dispatch({ type: 'UPDATE_SHIPMENT', payload: { shipment_id: shipment.shipment_id, status: 'Ready for Carriage' } });
    setShowQuickAWB(false);
  };

  const handleCreateQuickCustoms = () => {
    if (!quickCustomsData.declaration_number) return;
    dispatch({ type: 'CREATE_CUSTOMS', payload: {
      shipment_id: shipment.shipment_id, awb_id: mawb?.awb_id,
      clearance_type: quickCustomsData.clearance_type || 'Export',
      jurisdiction: quickCustomsData.jurisdiction, declaration_number: quickCustomsData.declaration_number,
      status: 'Cleared'
    }});
    setShowQuickCustoms(false);
  };

  const handleCreateQuickULD = () => {
    if (!quickULDData.uld_id) return;
    dispatch({ type: 'CREATE_ULD_ALLOCATION', payload: {
      uld_id: quickULDData.uld_id, shipment_id: shipment.shipment_id,
      pieces: Number(quickULDData.pieces), weight_kg: Number(quickULDData.weight_kg), notes: ''
    }});
    // Set ULD to Packaging status
    dispatch({ type: 'UPDATE_ULD_STATUS', payload: { uld_id: quickULDData.uld_id, status: 'Packaging', updated_by: 'Operations Team' } });
    setShowQuickULD(false);
  };

  const handleCreateQuickManifest = () => {
    if (!quickManifestData.manifest_id) return;
    dispatch({ type: 'CREATE_MANIFEST_LINE_ITEM', payload: {
      manifest_id: quickManifestData.manifest_id, shipment_id: shipment.shipment_id,
      uld_id: uldAllocations.length > 0 ? uldAllocations[0].uld_id : null,
    }});
    setShowQuickManifest(false);
  };

  const handleAdvanceULD = () => {
    if (!primaryULD) return;
    const nextIndex = Math.min((uldCurrentIndex + 1), ULD_STATUSES.length - 1);
    if (nextIndex > uldCurrentIndex) {
      dispatch({ type: 'UPDATE_ULD_STATUS', payload: { uld_id: primaryULD.uld_id, status: ULD_STATUSES[nextIndex], updated_by: 'Operations Team' } });
    }
  };

  const handleRevertULD = () => {
    if (!primaryULD) return;
    const prevIndex = Math.max((uldCurrentIndex - 1), 0);
    if (prevIndex < uldCurrentIndex) {
      dispatch({ type: 'UPDATE_ULD_STATUS', payload: { uld_id: primaryULD.uld_id, status: ULD_STATUSES[prevIndex], updated_by: 'Operations Team (Reverted)' } });
    }
  };

  const handleAdvanceFlightTracking = () => {
    let newCode = '';
    let desc = '';
    if (!hasRCS) {
      newCode = 'RCS'; desc = 'Received / Loaded on Aircraft';
    } else if (!hasDEP) {
      newCode = 'DEP'; desc = 'Departed from Origin';
    } else if (!hasARR) {
      newCode = 'ARR'; desc = 'Arrived at Destination';
    } else {
      return;
    }
    
    dispatch({ type: 'ADD_TRACKING_EVENT', payload: {
      shipment_id: shipment.shipment_id,
      event_code: newCode,
      event_description: desc,
      event_timestamp: new Date().toISOString(),
      tracking_source: 'Manual Update'
    }});
  };

  const handleRevertFlightTracking = () => {
    let removeCode = '';
    if (hasARR) {
      removeCode = 'ARR';
    } else if (hasDEP) {
      removeCode = 'DEP';
    } else if (hasRCS) {
      removeCode = 'RCS';
    } else {
      return;
    }
    
    dispatch({ type: 'REMOVE_TRACKING_EVENT', payload: {
      shipment_id: shipment.shipment_id,
      event_code: removeCode
    }});
  };


  // ──────────── RENDER ────────────
  return (
    <div className={styles.page}>
      <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/operations/shipments')}>Back to Shipments</Button>

      {/* ══════ HEADER ══════ */}
      <div className={styles.detailHeader}>
        <div>
          <div className={styles.headerTop}>
            <h1 className={styles.ref}>{shipment.shipment_reference}</h1>
            <Badge variant={getStatusColor(shipment.status)} dot>{shipment.status}</Badge>
          </div>
          <div className={styles.headerMeta}>
            <div className={styles.headerRouteLocations}>
              <div className={styles.headerAirport}>{getLocationName(shipment.origin_airport || shipment.origin_location)}</div>
              <ChevronRight className={styles.headerRouteArrow} size={20} />
              <div className={styles.headerAirport}>{getLocationName(shipment.destination_airport || shipment.destination_location)}</div>
            </div>
            <span>·</span>
            <span>{account?.legal_name || '—'}</span>
            <span>·</span>
            <span>{shipment.service_type}</span>
          </div>
          {confirmedBooking && (
            <div className={styles.headerSummary}>
              {mawb && <div className={styles.headerSummaryItem}><span className={styles.headerSummaryLabel}>AWB</span><span className={styles.headerSummaryValue}>{formatAWBNumber(mawb.awb_number)}</span></div>}
              <div className={styles.headerSummaryItem}><span className={styles.headerSummaryLabel}>Flight</span><span className={styles.headerSummaryValue}>{confirmedBooking.confirmed_flight_number || '—'}</span></div>
              <div className={styles.headerSummaryItem}><span className={styles.headerSummaryLabel}>Date</span><span className={styles.headerSummaryValue}>{formatDate(confirmedBooking.confirmed_flight_date)}</span></div>
            </div>
          )}
        </div>
        <div className={styles.detailActions}>
          <Button variant="secondary" icon={Edit} onClick={handleOpenEdit}>Edit Shipment</Button>
        </div>
      </div>

      {/* ══════ SECTION 1: MASTER SHIPMENT TRACKER (PREMIUM) ══════ */}
      <motion.div 
        className={styles.masterTracker}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.masterTrackerTrack}>
          {masterStages.map((stage, idx) => {
            const isCompleted = stage.completed;
            const isCurrent = idx === currentStageIndex + 1 && !stage.completed;
            const isLast = idx === masterStages.length - 1;
            
            let cardClass = styles.masterTrackerCard;
            let labelClass = styles.masterTrackerLabel;
            if (isCompleted) { cardClass += ` ${styles.completed}`; labelClass += ` ${styles.completed}`; }
            else if (isCurrent) { cardClass += ` ${styles.current}`; labelClass += ` ${styles.current}`; }
            else { cardClass += ` ${styles.pending}`; labelClass += ` ${styles.pending}`; }

            let connectorClass = styles.masterTrackerConnector;
            if (isCompleted && masterStages[idx + 1]?.completed) connectorClass += ` ${styles.filled}`;
            else if (isCompleted && idx + 1 === currentStageIndex + 1) connectorClass += ` ${styles.currentLine}`;
            else connectorClass += ` ${styles.unfilled}`;

            return (
              <motion.div 
                key={stage.key} 
                className={styles.masterTrackerStep} 
                onClick={() => setExpandedStage(expandedStage === stage.key ? null : stage.key)} 
                style={{ cursor: (stage.key === 'uld' || stage.key === 'tracking') ? 'pointer' : 'default' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <div className={cardClass}>
                  <stage.icon size={22} strokeWidth={isCurrent ? 2.5 : 2} className={isCurrent ? styles[stage.animClass] : ''} />
                </div>
                {!isLast && (
                  <div className={connectorClass} />
                )}
                <span className={labelClass}>{stage.label}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ══════ NEXT STEP BANNER ══════ */}
      {nextStep && (
        <div className={styles.nextStepBanner}>
          <div className={styles.nextStepInfo}>
            <div className={styles.nextStepIconBox}>{nextStep.action ? <AlertTriangle size={20} /> : <Truck size={20} />}</div>
            <div>
              <h3 className={styles.nextStepTitle}>{nextStep.title}</h3>
              <p className={styles.nextStepDesc}>{nextStep.desc}</p>
            </div>
          </div>
          {nextStep.action && <Button onClick={nextStep.onClick} icon={ArrowRight}>{nextStep.action}</Button>}
        </div>
      )}

      {/* ══════ DELIVERED COMPLETION CARD (PREMIUM) ══════ */}
      {shipment.status === 'Delivered' && (
        <motion.div 
          className={styles.deliveredCard} 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div 
            className={styles.deliveredIcon}
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
          >
            <PartyPopper size={36} />
          </motion.div>
          <motion.h2 
            className={styles.deliveredTitle}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            SHIPMENT DELIVERED
          </motion.h2>
          <motion.p 
            className={styles.deliveredSubtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            {shipment.shipment_reference} — {getLocationName(shipment.origin_airport || shipment.origin_location)} → {getLocationName(shipment.destination_airport || shipment.destination_location)}
          </motion.p>
          <motion.div 
            className={styles.deliveredStats}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.9 } }
            }}
          >
            {mawb && (
              <motion.div className={styles.deliveredStat} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                <div className={styles.deliveredStatLabel}>AWB</div>
                <div className={styles.deliveredStatValue}>{formatAWBNumber(mawb.awb_number)}</div>
              </motion.div>
            )}
            {confirmedBooking && (
              <motion.div className={styles.deliveredStat} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                <div className={styles.deliveredStatLabel}>Flight</div>
                <div className={styles.deliveredStatValue}>{confirmedBooking.confirmed_flight_number}</div>
              </motion.div>
            )}
            <motion.div className={styles.deliveredStat} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <div className={styles.deliveredStatLabel}>Pieces</div>
              <div className={styles.deliveredStatValue}>{shipment.pieces}</div>
            </motion.div>
            <motion.div className={styles.deliveredStat} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <div className={styles.deliveredStatLabel}>Weight</div>
              <div className={styles.deliveredStatValue}>{formatWeight(shipment.gross_weight_kg)}</div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* ══════ MAIN LAYOUT (CONTENT + SIDEBAR) ══════ */}
      <div className={styles.mainLayout}>
        {/* Left Column - Main Operations Content */}
        <div className={styles.contentCol}>
      
      {/* ══════ SECTION 2: FLIGHT SUMMARY ══════ */}
      {confirmedBooking && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><Plane size={16} /> Flight Summary</h2>
            <span className={styles.autoBadge}><Zap size={10} /> From Booking</span>
          </div>
          <div className={styles.flightSummaryCard}>
            <div className={styles.flightSummaryAirport}>
              <div className={styles.flightSummaryCode}>{shipment.origin_airport}</div>
              <div className={styles.flightSummaryCity}>{LOCATIONS[shipment.origin_location || shipment.origin_airport]?.name || ''}</div>
            </div>
            <div className={styles.flightSummaryMid}>
              <div className={styles.flightSummaryRoute}>
                <div className={styles.flightSummaryLine} />
                <Plane size={16} color="var(--primary)" />
                <div className={styles.flightSummaryLine} />
              </div>
              <div className={styles.flightSummaryFlight}>{confirmedCarrier?.code} {confirmedBooking.confirmed_flight_number}</div>
              <div className={styles.flightSummaryMeta}>{formatDate(confirmedBooking.confirmed_flight_date)}</div>
              <div className={styles.flightAutoLabel}><CheckCircle size={12} /> Auto-fetched from Booking</div>
            </div>
            <div className={styles.flightSummaryAirport}>
              <div className={styles.flightSummaryCode}>{shipment.destination_airport}</div>
              <div className={styles.flightSummaryCity}>{LOCATIONS[shipment.destination_location || shipment.destination_airport]?.name || ''}</div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ STATS GRID ══════ */}
      <div className={styles.statsGrid}>
        <div className={styles.stat}><span className={styles.statLabel}>Pieces</span><span className={styles.statValue}>{shipment.pieces}</span></div>
        <div className={styles.stat}><span className={styles.statLabel}>Gross Weight</span><span className={styles.statValue}>{formatWeight(shipment.gross_weight_kg)}</span></div>
        <div className={styles.stat}><span className={styles.statLabel}>Chargeable</span><span className={styles.statValue}>{formatWeight(shipment.chargeable_weight_kg)}</span></div>
        <div className={styles.stat}><span className={styles.statLabel}>Cargo Type</span><span className={styles.statValue}>{shipment.cargo_type}</span></div>
        <div className={styles.stat}><span className={styles.statLabel}>Incoterm</span><span className={styles.statValue}>{shipment.incoterm}</span></div>
      </div>

      {/* ══════ SECTION 3: EQUIPMENT TRACKING ══════ */}
      {(uldAllocations.length > 0 || (exportClearances.length > 0 && shipment.cargo_type !== 'Loose')) && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><Package size={16} /> {shipment.transport_mode === 'SEA' ? 'Container' : shipment.transport_mode === 'ROAD' ? 'Vehicle' : 'ULD'} Tracking</h2>
            <span className={styles.manualBadge}><Edit size={10} /> Manual</span>
          </div>
          {uldAllocations.length > 0 ? (
            <div className={styles.card} style={{ cursor: 'pointer' }} onClick={() => router.push('/operations/uld')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{shipment.transport_mode === 'SEA' ? 'Container' : shipment.transport_mode === 'ROAD' ? 'Vehicle' : 'ULD'} #{primaryULD?.uld_number}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{primaryULD?.type} · {formatWeight(primaryULDAlloc?.weight_kg || 0)} packed</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {uldCurrentIndex > 0 && (
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleRevertULD(); }}>← Revert</Button>
                  )}
                  {uldCurrentIndex < ULD_STATUSES.length - 1 && (
                    <Button size="small" onClick={(e) => { e.stopPropagation(); handleAdvanceULD(); }}>Update Status →</Button>
                  )}
                </div>
              </div>
              {/* Equipment Stepper */}
              <div className={styles.uldStepper}>
                {ULD_STATUSES.map((step, idx) => {
                  const isCompleted = idx <= uldCurrentIndex;
                  const isCurrent = idx === uldCurrentIndex;
                  const isPending = idx > uldCurrentIndex;
                  const isLast = idx === ULD_STATUSES.length - 1;
                  const historyItem = primaryULD?.status_history?.find(h => h.status === step);
                  return (
                    <div key={step} className={styles.uldStep}>
                      <div className={`${styles.uldStepDot} ${isCompleted ? styles.uldCompleted : ''} ${isCurrent ? styles.uldCurrent : ''} ${isPending ? styles.uldPending : ''}`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      {!isLast && (
                        <div className={`${styles.uldStepConnector} ${isCompleted && idx < uldCurrentIndex ? styles.uldConnectorFilled : styles.uldConnectorEmpty}`} />
                      )}
                      <div>
                        <div className={`${styles.uldStepLabel} ${isCurrent ? styles.uldLabelActive : ''} ${isCompleted && !isCurrent ? styles.uldLabelDone : ''}`}>{step}</div>
                        {historyItem && <div className={styles.uldStepTimestamp}>{formatDateTime(historyItem.timestamp)}</div>}
                        {historyItem && <div className={styles.uldStepTimestamp}>{historyItem.updated_by}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={styles.emptyCard}>No equipment assigned. Complete Origin Customs first, then assign to {shipment.transport_mode === 'SEA' ? 'a container' : shipment.transport_mode === 'ROAD' ? 'a vehicle' : 'a ULD'}.</div>
          )}
        </div>
      )}

      {/* ══════ SECTION 4: FLIGHT MANIFEST ══════ */}
      {manifestLineItems.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><FileText size={16} /> Flight Manifest</h2>
            <span className={styles.autoBadge}><CheckCircle size={10} /> Auto-fetched from Booking</span>
          </div>
          <div className={styles.card}>
            {manifestLineItems.map(item => {
              const manifest = getManifest(item.manifest_id);
              const car = manifest ? state.organizations.find(c => c.org_id === manifest.carrier_id) : null;
              return (
                <div key={item.manifest_line_item_id} style={{ cursor: 'pointer' }} onClick={() => router.push('/operations/transport-manifests')}>
                  <div className={styles.infoRow}><span className={styles.infoLabel}>Flight</span><span className={styles.flight}>{car?.code} {manifest?.flight_number}</span></div>
                  <div className={styles.infoRow}><span className={styles.infoLabel}>Route</span><span>{getLocationName(manifest?.departure_airport)} → {getLocationName(manifest?.arrival_airport)}</span></div>
                  <div className={styles.infoRow}><span className={styles.infoLabel}>Date</span><span>{formatDate(manifest?.flight_date)}</span></div>
                  <div className={styles.infoRow}><span className={styles.infoLabel}>Status</span><Badge variant={getStatusColor(manifest?.status)} dot>{manifest?.status}</Badge></div>
                  <div className={styles.infoRow}><span className={styles.infoLabel}>Source</span><span className={styles.flightAutoLabel} style={{ marginTop: 0 }}><CheckCircle size={12} /> Booking Flight</span></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════ SECTION 5: FLIGHT TRACKING ══════ */}
      {events.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><Truck size={16} /> Flight Tracking</h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className={styles.autoBadge}><Zap size={10} /> Auto Tracked</span>
              <span className={styles.manualBadge}><Edit size={10} /> Manual Update</span>
            </div>
          </div>
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Flight: {confirmedBooking?.confirmed_flight_number || '—'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  Status: {hasARR ? 'Landed' : hasDEP ? 'In Transit' : hasRCS ? 'Loaded' : 'Pending'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Last synced</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{formatDateTime(events[events.length - 1]?.event_timestamp || events[0]?.event_timestamp)}</div>
                  </div>
                  {flightTrackingIndex >= 0 && (
                    <Button size="small" variant="secondary" onClick={handleRevertFlightTracking}>← Revert</Button>
                  )}
                  {!hasARR && <Button size="small" onClick={handleAdvanceFlightTracking}>Update Status →</Button>}
                </div>
              </div>
            </div>
            {/* Flight Tracking Stepper */}
            <div className={styles.flightStepper}>
              {FLIGHT_TRACKING_STEPS.map((step, idx) => {
                const isCompleted = idx <= flightTrackingIndex;
                const isCurrent = idx === flightTrackingIndex;
                const isPending = idx > flightTrackingIndex;
                const isLast = idx === FLIGHT_TRACKING_STEPS.length - 1;
                const relatedEvent = idx === 0 ? events.find(e => e.event_code === 'RCS') : idx === 1 ? events.find(e => e.event_code === 'DEP') : idx === 2 ? events.find(e => e.event_code === 'DEP') : events.find(e => e.event_code === 'ARR');
                return (
                  <div key={step} className={styles.flightStep}>
                    <div className={`${styles.flightStepDot} ${isCompleted ? styles.flightCompleted : ''} ${isCurrent ? styles.flightCurrent : ''} ${isPending ? styles.flightPending : ''}`}>
                      {isCompleted ? '✓' : '○'}
                    </div>
                    {!isLast && (
                      <div className={`${styles.flightStepConnector} ${isCompleted && idx < flightTrackingIndex ? styles.flightConnectorFilled : styles.flightConnectorEmpty}`} />
                    )}
                    <div>
                      <div className={`${styles.flightStepLabel} ${isCurrent ? styles.flightLabelActive : ''} ${isCompleted && !isCurrent ? styles.flightLabelDone : ''}`}>{step}</div>
                      {relatedEvent && isCompleted && <div className={styles.flightStepTimestamp}>{formatDateTime(relatedEvent.event_timestamp)}</div>}
                      {isCompleted && relatedEvent && <div className={styles.flightStepTimestamp} style={{ color: relatedEvent.tracking_source === 'Manual Update' ? '#f59e0b' : '#0ea5e9' }}>{relatedEvent.tracking_source === 'Manual Update' ? 'Manual Update' : 'Auto detected'}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════ SECTION 6: CUSTOMS ══════ */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><ShieldCheck size={16} /> Customs Clearance</h2>
        <div className={styles.customsGrid}>
          {/* Origin Customs */}
          <div className={`${styles.customsCard} ${exportClearances.length > 0 ? styles.customsDone : ''}`} style={{ cursor: 'pointer' }} onClick={() => router.push('/operations/customs')}>
            <div className={styles.customsCardHeader}>
              <span className={styles.customsCardTitle}>Origin Customs</span>
              {exportClearances.length > 0 ? <Badge variant="success" dot>Done</Badge> : <Badge variant="neutral">Pending</Badge>}
            </div>
            {exportClearances.length > 0 ? (
              <div>
                {exportClearances.map(clr => (
                  <div key={clr.clearance_id}>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Declaration</span><span className={styles.decl}>{clr.declaration_number}</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Jurisdiction</span><span>{clr.jurisdiction}</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Completed</span><span style={{ fontSize: '12px' }}>{formatDate(clr.created_at)}</span></div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                {mawb && allDocsSigned ? 'Ready to file.' : 'Requires AWB & signed documents first.'}
              </div>
            )}
          </div>

          {/* Destination Customs */}
          <div className={`${styles.customsCard} ${importClearances.length > 0 ? styles.customsDone : ''}`} style={{ cursor: 'pointer' }} onClick={() => router.push('/operations/customs')}>
            <div className={styles.customsCardHeader}>
              <span className={styles.customsCardTitle}>Destination Customs</span>
              {importClearances.length > 0 ? <Badge variant="success" dot>Done</Badge> : <Badge variant="neutral">Pending</Badge>}
            </div>
            {importClearances.length > 0 ? (
              <div>
                {importClearances.map(clr => (
                  <div key={clr.clearance_id}>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Declaration</span><span className={styles.decl}>{clr.declaration_number}</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Jurisdiction</span><span>{clr.jurisdiction}</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Completed</span><span style={{ fontSize: '12px' }}>{formatDate(clr.created_at)}</span></div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                {hasARR ? 'Flight landed. Ready to file.' : 'Waiting for flight to land.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════ AWB & BOOKINGS ══════ */}
      <div className={styles.twoCol}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}><FileText size={16} /> Air Waybill</h2>
          {mawb ? (
            <div className={styles.infoCard} style={{ cursor: 'pointer' }} onClick={() => router.push(`/operations/transport-docs/${mawb.doc_id || mawb.awb_id}`)}>
              <div className={styles.infoRow}><span className={styles.infoLabel}>MAWB</span><span className={styles.awbNum}>{formatAWBNumber(mawb.awb_number)}</span></div>
              <div className={styles.infoRow}><span className={styles.infoLabel}>FWB Status</span><Badge variant={getStatusColor(mawb.fwb_status)}>{mawb.fwb_status}</Badge></div>
              <div className={styles.infoRow}><span className={styles.infoLabel}>Freight Terms</span><span>{mawb.freight_terms}</span></div>
              <div className={styles.infoRow}><span className={styles.infoLabel}>Total Charges</span><span className="tabular-nums">{formatCurrency(mawb.total_charges, mawb.currency_code)}</span></div>
            </div>
          ) : <div className={styles.emptyCard}>No AWB linked yet</div>}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}><Plane size={16} /> Bookings</h2>
          {bookings.length > 0 ? (
            <div className={styles.bookingsList}>
              {bookings.map(bkr => (
                <div key={bkr.booking_request_id} className={styles.infoCard} style={{ cursor: 'pointer' }} onClick={() => router.push('/operations/bookings')}>
                  <div className={styles.infoRow}><span className={styles.infoLabel}>Status</span><Badge variant={getStatusColor(bkr.status)} dot>{bkr.status}</Badge></div>
                  {bkr.confirmed_flight_number && <div className={styles.infoRow}><span className={styles.infoLabel}>Flight</span><span className={styles.flight}>{bkr.confirmed_flight_number}</span></div>}
                  <div className={styles.infoRow}><span className={styles.infoLabel}>Date</span><span>{formatDate(bkr.confirmed_flight_date || bkr.requested_flight_date)}</span></div>
                  <div className={styles.infoRow}><span className={styles.infoLabel}>Weight</span><span className="tabular-nums">{formatWeight(bkr.requested_weight_kg)}</span></div>
                </div>
              ))}
            </div>
          ) : <div className={styles.emptyCard}>No bookings yet</div>}
        </div>
      </div>

      {/* ══════ DOCUMENTS ══════ */}
      {(documents.length > 0 || mawb) && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}><FileText size={16} /> Documents</h2>
          {documents.length > 0 ? (
            <div className={styles.bookingsList}>
              {documents.map(doc => (
                <div key={doc.document_id} className={styles.infoCard} onClick={() => router.push(`/operations/documents/${doc.document_id}`)}>
                  <div className={styles.infoRow}><span className={styles.infoLabel}>{doc.document_type}</span><Badge variant={doc.status === 'Signed' || doc.status === 'Completed' ? 'success' : doc.status === 'Shared' ? 'info' : 'neutral'} dot>{doc.status}</Badge></div>
                  {doc.signed_at && <div className={styles.infoRow}><span className={styles.infoLabel}>Signed by</span><span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--success-color)' }}><CheckCircle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />{doc.signer_name}</span></div>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button onClick={(e) => { e.stopPropagation(); const url = `${window.location.origin}/sign/${doc.share_token}`; navigator.clipboard.writeText(url); if (doc.status === 'Generated') dispatch({ type: 'UPDATE_DOCUMENT', payload: { document_id: doc.document_id, status: 'Shared' } }); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', borderRadius: 6, cursor: 'pointer' }}>
                      <Copy size={11} /> Copy Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className={styles.emptyCard} style={{ marginBottom: 12 }}>No documents generated yet</div>
              <Button onClick={() => dispatch({ type: 'CREATE_DOCUMENT', payload: { shipment_id: shipment.shipment_id, awb_id: mawb?.awb_id, document_type: 'Comprehensive AWB', status: 'Generated' } })} icon={FileText}>Generate Bill</Button>
            </div>
          )}
        </div>
      )}

      {/* ══════ SPECIAL HANDLING ══════ */}
      {shipment.special_handling_codes?.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}><AlertTriangle size={16} /> Special Handling</h2>
          <div className={styles.shcList}>{shipment.special_handling_codes.map(shc => <Badge key={shc} variant="warning">{shc}</Badge>)}</div>
        </div>
      )}

        </div> {/* End Content Col */}

        {/* Right Column - Sticky Sidebar */}
        <div className={styles.sidebarCol}>

      {/* ══════ SECTION 7: AUDIT TIMELINE ══════ */}
      {auditEvents.length > 0 && (
        <div className={styles.section} style={{ margin: 0 }}>
          <h2 className={styles.sectionTitle}><Clock size={16} /> Shipment Timeline</h2>
          <div className={styles.card} style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            <div className={styles.auditTimeline}>
              {auditEvents.slice(0, 50).map((evt, idx) => (
                <div key={idx} className={styles.auditEvent}>
                  <div className={`${styles.auditDot} ${evt.type === 'auto' ? styles.auditAuto : styles.auditManual}`} />
                  <div className={styles.auditTime}>{formatDateTime(evt.time)}</div>
                  <div className={styles.auditMessage}>{evt.message}</div>
                  <div className={styles.auditSource}>{evt.source} {evt.type === 'auto' && '· Auto'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

        </div> {/* End Sidebar Col */}
      </div> {/* End Main Layout */}

      {/* ══════ MODALS ══════ */}
      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Shipment" subtitle={`Update details for ${shipment.shipment_reference}`} size="large"
        footer={<><Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button><Button onClick={handleSaveEdit}>Save Changes</Button></>}>
        <div className={styles.form}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Shipment Reference</label><input className="form-input" value={editData.shipment_reference || ''} disabled /></div>
            <div className="form-group"><label className="form-label">Account</label><select className="form-select" value={editData.org_id || ''} disabled><option value={editData.org_id}>{account?.legal_name || '—'}</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Transport Mode</label><select className="form-select" value={editData.transport_mode || 'AIR'} onChange={e => setEditData({ ...editData, transport_mode: e.target.value })}>{TRANSPORT_MODES.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Service Type</label><select className="form-select" value={editData.service_type || ''} onChange={e => setEditData({ ...editData, service_type: e.target.value })}>{SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Cargo Type</label><select className="form-select" value={editData.cargo_type || ''} onChange={e => setEditData({ ...editData, cargo_type: e.target.value })}>{CARGO_TYPES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          
          {(editData.transport_mode === 'AIR' || !editData.transport_mode) && (
            <div className="form-row">
              <div className="form-group"><label className="form-label">Origin Airport</label><AsyncLocationSelect value={editData.origin_airport || editData.origin_location || ''} onChange={val => setEditData({ ...editData, origin_airport: val, origin_location: val })} placeholder="Select Origin..." /></div>
              <div className="form-group"><label className="form-label">Destination Airport</label><AsyncLocationSelect value={editData.destination_airport || editData.destination_location || ''} onChange={val => setEditData({ ...editData, destination_airport: val, destination_location: val })} placeholder="Select Destination..." /></div>
              <div className="form-group"><label className="form-label">Flight Number</label><input className="form-input" value={editData.flight_number || ''} onChange={e => setEditData({ ...editData, flight_number: e.target.value })} /></div>
            </div>
          )}

          {editData.transport_mode === 'SEA' && (
            <>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Port of Loading (Origin)</label><AsyncLocationSelect value={editData.port_of_loading || editData.origin_location || ''} onChange={val => setEditData({ ...editData, port_of_loading: val, origin_location: val })} placeholder="Select Origin Port..." /></div>
                <div className="form-group"><label className="form-label">Port of Discharge (Dest)</label><AsyncLocationSelect value={editData.port_of_discharge || editData.destination_location || ''} onChange={val => setEditData({ ...editData, port_of_discharge: val, destination_location: val })} placeholder="Select Dest Port..." /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Container Type</label><select className="form-select" value={editData.container_type || ''} onChange={e => setEditData({ ...editData, container_type: e.target.value })}><option value="">Select Container...</option>{CONTAINER_TYPES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Container Number</label><input className="form-input" value={editData.container_number || ''} onChange={e => setEditData({ ...editData, container_number: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Voyage Number</label><input className="form-input" value={editData.voyage_number || ''} onChange={e => setEditData({ ...editData, voyage_number: e.target.value })} /></div>
              </div>
            </>
          )}

          {editData.transport_mode === 'ROAD' && (
            <>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Origin Location</label><AsyncLocationSelect value={editData.origin_location || ''} onChange={val => setEditData({ ...editData, origin_location: val })} placeholder="Search any city..." /></div>
                <div className="form-group"><label className="form-label">Destination Location</label><AsyncLocationSelect value={editData.destination_location || ''} onChange={val => setEditData({ ...editData, destination_location: val })} placeholder="Search any city..." /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Truck Type</label><select className="form-select" value={editData.truck_type || ''} onChange={e => setEditData({ ...editData, truck_type: e.target.value })}><option value="">Select Truck...</option>{TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Vehicle Number</label><input className="form-input" value={editData.vehicle_number || ''} onChange={e => setEditData({ ...editData, vehicle_number: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Driver Name</label><input className="form-input" value={editData.driver_name || ''} onChange={e => setEditData({ ...editData, driver_name: e.target.value })} /></div>
              </div>
            </>
          )}
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}><label className="form-label">Special Handling Codes (Comma separated)</label><input className="form-input" value={editData.special_handling_codes || ''} onChange={e => setEditData({ ...editData, special_handling_codes: e.target.value })} placeholder="e.g. PER, DGR, AVI" /></div>
            <div className="form-group"><label className="form-label">Pieces</label><input className="form-input" type="number" value={editData.pieces || ''} onChange={e => setEditData({ ...editData, pieces: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Gross Weight (kg)</label><input className="form-input" type="number" step="0.1" value={editData.gross_weight_kg || ''} onChange={e => setEditData({ ...editData, gross_weight_kg: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Chargeable Weight (kg)</label><input className="form-input" type="number" step="0.1" value={editData.chargeable_weight_kg || ''} onChange={e => setEditData({ ...editData, chargeable_weight_kg: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Incoterm</label><select className="form-select" value={editData.incoterm || ''} onChange={e => setEditData({ ...editData, incoterm: e.target.value })}>{INCOTERMS.map(i => <option key={i} value={i}>{INCOTERM_LABELS[i]}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={editData.status || ''} onChange={e => setEditData({ ...editData, status: e.target.value })}>{SHIPMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
        </div>
      </Modal>

      {/* Booking Modal */}
      <Modal open={showQuickBooking} onClose={() => setShowQuickBooking(false)} title="Quick Action: Book Space" subtitle="Select a flight and confirm booking" size="medium"
        footer={<><Button variant="secondary" onClick={() => setShowQuickBooking(false)}>Cancel</Button><Button onClick={handleQuickBookingSubmit} disabled={!quickBookingData.manifest_id}>Confirm Booking</Button></>}>
        <div className={styles.form}>
          <div className="form-group">
            <label className="form-label">Select Scheduled Flight *</label>
            <select className="form-select" value={quickBookingData.manifest_id || ''} onChange={e => {
              const manifestId = e.target.value;
              const manifest = state.transportManifests.find(m => m.manifest_id === manifestId);
              if (manifest) {
                setQuickBookingData({ ...quickBookingData, manifest_id: manifestId, carrier_id: manifest.carrier_id, flight_number: manifest.flight_number, flight_date: manifest.flight_date });
              } else {
                setQuickBookingData({ ...quickBookingData, manifest_id: '', carrier_id: '', flight_number: '', flight_date: '' });
              }
            }}>
              <option value="">Select Flight with Available Capacity...</option>
              {state.transportManifests
                .filter(m => (m.departure_airport === shipment.origin_airport || m.departure_airport === shipment.origin_location) && (m.arrival_airport === shipment.destination_airport || m.arrival_airport === shipment.destination_location))
                .map(m => {
                  const allocated = getManifestTotalAllocatedWeight(m.manifest_id);
                  const available = Math.max(0, (m.max_weight_kg || 10000) - allocated);
                  const isDisabled = available < (shipment.chargeable_weight_kg || 0);
                  const car = state.organizations.find(c => c.org_id === m.carrier_id);
                  return <option key={m.manifest_id} value={m.manifest_id} disabled={isDisabled}>{car?.code} {m.flight_number} ({getLocationName(m.departure_airport)}➔{getLocationName(m.arrival_airport)}) on {formatDate(m.flight_date)} — {formatWeight(available)} available</option>;
                })}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Pieces</label><input className="form-input" type="number" value={quickBookingData.pieces || ''} disabled /></div>
            <div className="form-group"><label className="form-label">Weight (kg)</label><input className="form-input" type="number" value={quickBookingData.weight_kg || ''} disabled /></div>
          </div>
        </div>
      </Modal>

      {/* AWB Modal */}
      <Modal open={showQuickAWB} onClose={() => setShowQuickAWB(false)} title="Quick Action: Issue MAWB" subtitle="Generate Master Air Waybill"
        footer={<><Button variant="secondary" onClick={() => setShowQuickAWB(false)}>Cancel</Button><Button onClick={handleCreateQuickAWB} disabled={!quickAWBData.carrier_id || !quickAWBData.awb_number}>Generate AWB</Button></>}>
        <div className={styles.form}>
          <div className="form-group"><label className="form-label">AWB Number *</label><input className="form-input" value={quickAWBData.awb_number || ''} onChange={e => setQuickAWBData({ ...quickAWBData, awb_number: e.target.value })} /></div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}><label className="form-label">Carrier *</label><select className="form-select" value={quickAWBData.carrier_id || ''} disabled><option value="">Select Carrier...</option>{carriers.map(c => <option key={c.org_id} value={c.org_id}>{c.legal_name}</option>)}</select></div>
            <div className="form-group" style={{ flex: 1 }}><label className="form-label">Currency</label><select className="form-select" value={quickAWBData.currency || 'USD'} onChange={e => setQuickAWBData({ ...quickAWBData, currency: e.target.value })}><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="INR">INR</option><option value="QAR">QAR</option><option value="AED">AED</option></select></div>
          </div>
        </div>
      </Modal>

      {/* Customs Modal */}
      <Modal open={showQuickCustoms} onClose={() => setShowQuickCustoms(false)} title={`Quick Action: ${quickCustomsData.clearance_type || 'Export'} Customs`} subtitle={`File ${quickCustomsData.clearance_type || 'export'} clearance declaration`}
        footer={<><Button variant="secondary" onClick={() => setShowQuickCustoms(false)}>Cancel</Button><Button onClick={handleCreateQuickCustoms} disabled={!quickCustomsData.declaration_number}>File Customs</Button></>}>
        <div className={styles.form}>
          <div className="form-group"><label className="form-label">Declaration Number *</label><input className="form-input" value={quickCustomsData.declaration_number || ''} onChange={e => setQuickCustomsData({ ...quickCustomsData, declaration_number: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Jurisdiction</label><input className="form-input" value={quickCustomsData.jurisdiction || ''} onChange={e => setQuickCustomsData({ ...quickCustomsData, jurisdiction: e.target.value })} /></div>
        </div>
      </Modal>

      {/* Equipment Modal */}
      <Modal open={showQuickULD} onClose={() => setShowQuickULD(false)} title={`Quick Action: Assign to ${shipment.transport_mode === 'SEA' ? 'Container' : shipment.transport_mode === 'ROAD' ? 'Vehicle' : 'ULD'}`} subtitle={`Pack this shipment into ${shipment.transport_mode === 'SEA' ? 'a shipping container' : shipment.transport_mode === 'ROAD' ? 'a truck/trailer' : 'an airline container'}`}
        footer={<><Button variant="secondary" onClick={() => setShowQuickULD(false)}>Cancel</Button><Button onClick={handleCreateQuickULD} disabled={!quickULDData.uld_id}>Assign to {shipment.transport_mode === 'SEA' ? 'Container' : shipment.transport_mode === 'ROAD' ? 'Vehicle' : 'ULD'}</Button></>}>
        <div className={styles.form}>
          <div className="form-group">
            <label className="form-label">{shipment.transport_mode === 'SEA' ? 'Container' : shipment.transport_mode === 'ROAD' ? 'Vehicle' : 'ULD'} *</label>
            <select className="form-select" value={quickULDData.uld_id || ''} onChange={e => setQuickULDData({ ...quickULDData, uld_id: e.target.value })}>
              <option value="">Select Equipment...</option>
              {state.ulds.filter(u => (u.transport_mode || 'AIR') === (shipment.transport_mode || 'AIR')).map(u => {
                const allocated = getULDTotalAllocatedWeight(u.uld_id);
                // Graceful fallback to 10,000 if weight isn't defined
                const maxW = u.max_gross_weight_kg || u.max_weight_kg || 10000;
                const available = Math.max(0, maxW - (u.tare_weight_kg || 0) - allocated);
                const isDisabled = available < (shipment.chargeable_weight_kg || 0);
                return <option key={u.uld_id} value={u.uld_id} disabled={isDisabled}>{u.uld_number} ({u.type || u.uld_type}) - {formatWeight(available)} available</option>;
              })}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Pieces</label><input className="form-input" type="number" value={quickULDData.pieces || ''} onChange={e => setQuickULDData({ ...quickULDData, pieces: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Weight (kg)</label><input className="form-input" type="number" step="0.1" value={quickULDData.weight_kg || ''} onChange={e => setQuickULDData({ ...quickULDData, weight_kg: e.target.value })} /></div>
          </div>
        </div>
      </Modal>

      {/* Manifest Modal — auto-fetched from booking */}
      <Modal open={showQuickManifest} onClose={() => setShowQuickManifest(false)} title="Quick Action: Add to Manifest" subtitle="Confirm flight manifest assignment"
        footer={<><Button variant="secondary" onClick={() => setShowQuickManifest(false)}>Cancel</Button><Button onClick={handleCreateQuickManifest} disabled={!quickManifestData.manifest_id}>Add to Manifest</Button></>}>
        <div className={styles.form}>
          {quickManifestData.manifest_id ? (
            <div>
              <div className={styles.flightAutoLabel} style={{ marginBottom: '12px' }}><CheckCircle size={14} /> Flight auto-fetched from Booking</div>
              {(() => {
                const m = state.transportManifests.find(f => f.manifest_id === quickManifestData.manifest_id);
                const car = m ? TRANSPORT_PROVIDERS.find(c => c.id === m.carrier_id || c.code === m.carrier_id) || state.organizations.find(c => c.org_id === m.carrier_id) : null;
                return m ? (
                  <div className={styles.card}>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Airline</span><span style={{ fontWeight: 700 }}>{car?.name || '—'}</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Flight</span><span className={styles.flight}>{m.flight_number}</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Route</span><span>{getLocationName(m.departure_airport)} → {getLocationName(m.arrival_airport)}</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Date</span><span>{formatDate(m.flight_date)}</span></div>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: '12px' }}>Flight not found from Booking. Select manually:</div>
              <div className="form-group">
                <label className="form-label">Flight Manifest *</label>
                <select className="form-select" value={quickManifestData.manifest_id || ''} onChange={e => setQuickManifestData({ ...quickManifestData, manifest_id: e.target.value })}>
                  <option value="">Select Flight Manifest...</option>
                  {state.transportManifests.filter(m => (m.departure_airport === shipment.origin_airport || m.departure_airport === shipment.origin_location) && (m.arrival_airport === shipment.destination_airport || m.arrival_airport === shipment.destination_location)).map(m => {
                    const allocated = getManifestTotalAllocatedWeight(m.manifest_id);
                    const available = Math.max(0, (m.max_weight_kg || 10000) - allocated);
                    return <option key={m.manifest_id} value={m.manifest_id}>{m.flight_number} ({getLocationName(m.departure_airport)}-{getLocationName(m.arrival_airport)}) on {formatDate(m.flight_date)} - {formatWeight(available)} available</option>;
                  })}
                </select>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
