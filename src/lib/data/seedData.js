// Realistic seed data for the CRM + ERP system
// Airports, carriers, leads, accounts, contacts, opportunities, shipments, AWBs, tracking events

export const AIRPORTS = {
  DOH: { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', lat: 25.2731, lng: 51.6081 },
  FRA: { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lng: 8.5622 },
  LHR: { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', lat: 51.4700, lng: -0.4543 },
  JFK: { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA', lat: 40.6413, lng: -73.7781 },
  SIN: { code: 'SIN', name: 'Changi Airport', city: 'Singapore', country: 'Singapore', lat: 1.3644, lng: 103.9915 },
  DXB: { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE', lat: 25.2532, lng: 55.3657 },
  HKG: { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'China', lat: 22.3080, lng: 113.9185 },
  CDG: { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479 },
  ORD: { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'USA', lat: 41.9742, lng: -87.9073 },
  NRT: { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', lat: 35.7647, lng: 140.3864 },
  BOM: { code: 'BOM', name: 'Chhatrapati Shivaji International', city: 'Mumbai', country: 'India', lat: 19.0896, lng: 72.8656 },
  SYD: { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', lat: -33.9461, lng: 151.1772 },
};

export const CARRIERS = [
  { id: 'car-1', code: 'QR', name: 'Qatar Airways Cargo', prefix: '157' },
  { id: 'car-2', code: 'EK', name: 'Emirates SkyCargo', prefix: '176' },
  { id: 'car-3', code: 'LH', name: 'Lufthansa Cargo', prefix: '020' },
  { id: 'car-4', code: 'BA', name: 'IAG Cargo (British Airways)', prefix: '125' },
  { id: 'car-5', code: 'SQ', name: 'Singapore Airlines Cargo', prefix: '618' },
  { id: 'car-6', code: 'CX', name: 'Cathay Cargo', prefix: '160' },
];

export const CARGO_TYPES = ['General', 'Perishable', 'Dangerous Goods', 'Live Animals', 'Pharma', 'Valuable', 'Human Remains'];
export const INCOTERMS = ['EXW', 'FCA', 'FOB', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
export const INCOTERM_LABELS = {
  'EXW': 'EXW (Ex Works)',
  'FCA': 'FCA (Free Carrier)',
  'FOB': 'FOB (Free On Board)',
  'CPT': 'CPT (Carriage Paid To)',
  'CIP': 'CIP (Carriage and Insurance Paid To)',
  'DAP': 'DAP (Delivered at Place)',
  'DPU': 'DPU (Delivered at Place Unloaded)',
  'DDP': 'DDP (Delivered Duty Paid)'
};
export const LEAD_SOURCES = ['Inbound RFQ Portal', 'Referral', 'Tender', 'Outbound', 'Event'];
export const LEAD_STATUSES = ['New', 'Qualifying', 'Qualified', 'Disqualified', 'Converted'];
export const SERVICE_TYPES = ['Airport-to-Airport', 'Door-to-Airport', 'Airport-to-Door', 'Door-to-Door'];
export const RATE_CLASSES = ['M', 'N', 'Q', 'C', 'U-E'];
export const FREIGHT_TERMS = ['Prepaid', 'Collect'];

export const OPPORTUNITY_STAGES = ['Qualifying', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export const SHIPMENT_STATUSES = [
  'Booked', 'Documentation', 'Ready for Carriage', 'In Transit',
  'Customs Hold', 'Delivered', 'POD Confirmed', 'Closed', 'Exception'
];

export const FSU_CODES = [
  { code: 'RCS', label: 'Received from Shipper', order: 1 },
  { code: 'DEP', label: 'Departed', order: 2 },
  { code: 'ARR', label: 'Arrived', order: 3 },
  { code: 'RCF', label: 'Received from Flight', order: 4 },
  { code: 'NFD', label: 'Notification to Consignee', order: 5 },
  { code: 'AWD', label: 'Awaiting Customs Docs', order: 6 },
  { code: 'CCD', label: 'Customs Cleared', order: 7 },
  { code: 'DLV', label: 'Delivered', order: 8 },
];

export const EXCEPTION_CODES = [
  { code: 'AWR', label: 'Irregularity Reported' },
  { code: 'MAN', label: 'Manifest Discrepancy' },
];

// ---- Seed Records ----

let _id = 0;
const nextId = (prefix) => `${prefix}-${String(++_id).padStart(4, '0')}`;

export function generateSeedData() {
  _id = 0;

  const accounts = [
    { account_id: 'ACC-0001', legal_name: 'Waseem Seafoods LLC', account_type: 'Shipper', industry: 'Food & Beverage', status: 'Active', created_at: new Date(Date.now() - 86400000*5).toISOString() }
  ];

  const contacts = [
    { contact_id: 'CON-0001', account_id: 'ACC-0001', first_name: 'Waseem', last_name: 'Ahmad', email: 'waseem@seafoods.example.com', phone: '+974 5555 1234', is_primary: true }
  ];

  const opportunities = [
    { opportunity_id: 'OPP-0001', account_id: 'ACC-0001', contact_id: 'CON-0001', title: '1000kg Fresh Salmon DOH-LHR', stage: 'Won', origin_airport: 'DOH', destination_airport: 'LHR', estimated_weight_kg: 1000, value: 4500, currency: 'USD', created_at: new Date(Date.now() - 86400000*4).toISOString() }
  ];

  const leads = [
    { lead_id: 'LD-0001', company_name: 'Waseem Seafoods LLC', first_name: 'Waseem', last_name: 'Ahmad', email: 'waseem@seafoods.example.com', origin_airport: 'DOH', destination_airport: 'LHR', estimated_weight_kg: 1000, status: 'Converted', converted_account_id: 'ACC-0001', converted_contact_id: 'CON-0001', converted_opportunity_id: 'OPP-0001', converted_at: new Date(Date.now() - 86400000*5).toISOString(), created_at: new Date(Date.now() - 86400000*6).toISOString() }
  ];

  const shipments = [
    { shipment_id: 'SHP-2026-1001', shipment_reference: 'SHP-2026-1001', account_id: 'ACC-0001', contact_id: 'CON-0001', service_type: 'Airport-to-Airport', cargo_type: 'Perishable', origin_airport: 'DOH', destination_airport: 'LHR', incoterm: 'CPT', status: 'In Transit', pieces: 50, gross_weight_kg: 1000, volume_cbm: 4.5, chargeable_weight_kg: 1000, special_handling_codes: ['PER', 'ICE'], mawb_id: 'AWB-0001', created_at: new Date(Date.now() - 86400000*3).toISOString() },
    { shipment_id: 'SHP-2026-1002', shipment_reference: 'SHP-2026-1002', account_id: 'ACC-0001', contact_id: 'CON-0001', service_type: 'Airport-to-Airport', cargo_type: 'General', origin_airport: 'DOH', destination_airport: 'LHR', incoterm: 'EXW', status: 'In Transit', pieces: 10, gross_weight_kg: 200, volume_cbm: 1.0, chargeable_weight_kg: 200, special_handling_codes: [], mawb_id: 'AWB-0002', created_at: new Date(Date.now() - 86400000*2).toISOString() },
    { shipment_id: 'SHP-2026-1003', shipment_reference: 'SHP-2026-1003', account_id: 'ACC-0001', contact_id: 'CON-0001', service_type: 'Airport-to-Airport', cargo_type: 'General', origin_airport: 'DOH', destination_airport: 'CDG', incoterm: 'FCA', status: 'Ready for Carriage', pieces: 30, gross_weight_kg: 600, volume_cbm: 3.2, chargeable_weight_kg: 600, special_handling_codes: [], mawb_id: 'AWB-0003', created_at: new Date(Date.now() - 86400000*1).toISOString() }
  ];

  const airWaybills = [
    { awb_id: 'AWB-0001', shipment_id: 'SHP-2026-1001', awb_number: '157-88992233', awb_type: 'Master (MAWB)', carrier_id: 'car-1', origin_airport: 'DOH', destination_airport: 'LHR', pieces: 50, gross_weight_kg: 1000, chargeable_weight_kg: 1000, total_charges: 4500, currency_code: 'USD', fwb_status: 'Acknowledged (FMA)', freight_terms: 'Prepaid', created_at: new Date(Date.now() - 86400000*2).toISOString() },
    { awb_id: 'AWB-0002', shipment_id: 'SHP-2026-1002', awb_number: '157-88992244', awb_type: 'Master (MAWB)', carrier_id: 'car-1', origin_airport: 'DOH', destination_airport: 'LHR', pieces: 10, gross_weight_kg: 200, chargeable_weight_kg: 200, total_charges: 900, currency_code: 'USD', fwb_status: 'Acknowledged (FMA)', freight_terms: 'Collect', created_at: new Date(Date.now() - 86400000*1).toISOString() },
    { awb_id: 'AWB-0003', shipment_id: 'SHP-2026-1003', awb_number: '157-88992255', awb_type: 'Master (MAWB)', carrier_id: 'car-1', origin_airport: 'DOH', destination_airport: 'CDG', pieces: 30, gross_weight_kg: 600, chargeable_weight_kg: 600, total_charges: 2700, currency_code: 'USD', fwb_status: 'Acknowledged (FMA)', freight_terms: 'Prepaid', created_at: new Date().toISOString() }
  ];

  const bookingRequests = [
    { booking_request_id: 'BKR-0001', shipment_id: 'SHP-2026-1001', carrier_id: 'car-1', requested_flight_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], requested_pieces: 50, requested_weight_kg: 1000, status: 'Space Confirmed', confirmed_flight_number: 'QR8410', confirmed_flight_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], created_at: new Date(Date.now() - 86400000*3).toISOString() }
  ];

  const flightManifests = [
    { manifest_id: 'FFM-0001', carrier_id: 'car-1', flight_number: 'QR8410', departure_airport: 'DOH', arrival_airport: 'LHR', flight_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], status: 'Departed', max_weight_kg: 10000, created_at: new Date(Date.now() - 86400000).toISOString() },
    { manifest_id: 'FFM-0002', carrier_id: 'car-1', flight_number: 'QR8520', departure_airport: 'DOH', arrival_airport: 'CDG', flight_date: new Date(Date.now() + 86400000*2).toISOString().split('T')[0], status: 'Draft', max_weight_kg: 5000, created_at: new Date().toISOString() },
    { manifest_id: 'FFM-0003', carrier_id: 'car-2', flight_number: 'EK123', departure_airport: 'DXB', arrival_airport: 'LHR', flight_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], status: 'Draft', max_weight_kg: 12000, created_at: new Date().toISOString() }
  ];

  const manifestLineItems = [
    { line_item_id: 'MLI-0001', manifest_id: 'FFM-0001', awb_id: 'AWB-0001', loaded_pieces: 50, loaded_weight_kg: 1000 },
    { line_item_id: 'MLI-0002', manifest_id: 'FFM-0001', awb_id: 'AWB-0002', loaded_pieces: 10, loaded_weight_kg: 200 }
  ];

  const ulds = [
    { uld_id: 'ULD-0001', uld_number: 'AKE12345QR', type: 'AKE', owner_code: 'QR', current_location: 'DOH', status: 'Built-Up', max_gross_weight_kg: 1588, tare_weight_kg: 82 },
    { uld_id: 'ULD-0002', uld_number: 'PMC99887EK', type: 'PMC', owner_code: 'EK', current_location: 'DXB', status: 'Build-Up in Progress', max_gross_weight_kg: 6800, tare_weight_kg: 105 },
    { uld_id: 'ULD-0003', uld_number: 'ALF44556LH', type: 'ALF', owner_code: 'LH', current_location: 'FRA', status: 'Available', max_gross_weight_kg: 3175, tare_weight_kg: 120 }
  ];

  const uldAllocations = [
    { allocation_id: 'ULA-0001', uld_id: 'ULD-0001', shipment_id: 'SHP-2026-1001', allocated_pieces: 50, allocated_weight_kg: 1000 },
    { allocation_id: 'ULA-0002', uld_id: 'ULD-0001', shipment_id: 'SHP-2026-1002', allocated_pieces: 10, allocated_weight_kg: 200 }
  ];

  const trackingEvents = [
    { event_id: 'EVT-0001', shipment_id: 'SHP-2026-1001', fsu_code: 'RCS', airport_code: 'DOH', event_time: new Date(Date.now() - 86400000).toISOString(), description: 'Received from Shipper', created_at: new Date(Date.now() - 86400000).toISOString() },
    { event_id: 'EVT-0002', shipment_id: 'SHP-2026-1001', fsu_code: 'DEP', airport_code: 'DOH', event_time: new Date(Date.now() - 43200000).toISOString(), description: 'Departed on QR8410', flight_number: 'QR8410', created_at: new Date(Date.now() - 43200000).toISOString() }
  ];

  const customsClearances = [
    { clearance_id: 'CLR-0001', shipment_id: 'SHP-2026-1001', awb_id: 'AWB-0001', clearance_type: 'Export', jurisdiction: 'Qatar Customs', status: 'Cleared', declaration_number: 'DOH-EXP-99221', hs_codes: ['0302.14.00'], duties_taxes_amount: 0, currency: 'QAR', hold_reason: '', created_at: new Date(Date.now() - 86400000*2).toISOString() }
  ];

  const domainEvents = [
    { id: 'DE-001', type: 'LEAD_CONVERTED', message: 'Lead Waseem Seafoods converted to Account.', timestamp: new Date(Date.now() - 86400000*5).toISOString() },
    { id: 'DE-002', type: 'DEAL_WON', message: 'Opportunity 1000kg Fresh Salmon Won. Shipment SHP-2026-1001 drafted.', timestamp: new Date(Date.now() - 86400000*3).toISOString() },
    { id: 'DE-003', type: 'SPACE_CONFIRMED', message: 'Booking confirmed on QR8410.', timestamp: new Date(Date.now() - 86400000*2).toISOString() },
    { id: 'DE-004', type: 'CUSTOMS_CLEARED', message: 'Export clearance DOH-EXP-99221 approved.', timestamp: new Date(Date.now() - 86400000*1.5).toISOString() },
    { id: 'DE-005', type: 'FLIGHT_DEPARTED', message: 'QR8410 departed DOH.', timestamp: new Date(Date.now() - 43200000).toISOString() },
  ];

  return {
    accounts,
    contacts,
    opportunities,
    leads,
    shipments,
    airWaybills,
    bookingRequests,
    flightManifests,
    manifestLineItems,
    ulds,
    uldAllocations,
    trackingEvents,
    customsClearances,
    domainEvents,
  };
}

