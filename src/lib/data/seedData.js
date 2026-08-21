// Realistic multi-modal seed data for PentaLogix ERP
// Air, Sea, Road, CRM, Warehousing, Finance, Fleet

export const TRANSPORT_MODES = ['AIR', 'SEA', 'ROAD'];

export const LOCATIONS = {
  // Airports
  DOH: { code: 'DOH', name: 'Hamad International', type: 'Airport', city: 'Doha', country: 'Qatar', lat: 25.2731, lng: 51.6081 },
  FRA: { code: 'FRA', name: 'Frankfurt Airport', type: 'Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lng: 8.5622 },
  LHR: { code: 'LHR', name: 'Heathrow Airport', type: 'Airport', city: 'London', country: 'United Kingdom', lat: 51.4700, lng: -0.4543 },
  JFK: { code: 'JFK', name: 'John F. Kennedy', type: 'Airport', city: 'New York', country: 'USA', lat: 40.6413, lng: -73.7781 },
  SIN: { code: 'SIN', name: 'Changi Airport', type: 'Airport', city: 'Singapore', country: 'Singapore', lat: 1.3644, lng: 103.9915 },
  DXB: { code: 'DXB', name: 'Dubai International', type: 'Airport', city: 'Dubai', country: 'UAE', lat: 25.2532, lng: 55.3657 },
  HKG: { code: 'HKG', name: 'Hong Kong International', type: 'Airport', city: 'Hong Kong', country: 'China', lat: 22.3080, lng: 113.9185 },
  CDG: { code: 'CDG', name: 'Charles de Gaulle', type: 'Airport', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479 },
  ORD: { code: 'ORD', name: "O'Hare International", type: 'Airport', city: 'Chicago', country: 'USA', lat: 41.9742, lng: -87.9073 },
  NRT: { code: 'NRT', name: 'Narita International', type: 'Airport', city: 'Tokyo', country: 'Japan', lat: 35.7647, lng: 140.3864 },
  BOM: { code: 'BOM', name: 'Chhatrapati Shivaji', type: 'Airport', city: 'Mumbai', country: 'India', lat: 19.0896, lng: 72.8656 },
  SYD: { code: 'SYD', name: 'Sydney Kingsford Smith', type: 'Airport', city: 'Sydney', country: 'Australia', lat: -33.9461, lng: 151.1772 },

  // Seaports
  JEA: { code: 'JEA', name: 'Jebel Ali Port', type: 'Seaport', city: 'Dubai', country: 'UAE', lat: 24.9857, lng: 55.0273 },
  HMB: { code: 'HMB', name: 'Port of Hamburg', type: 'Seaport', city: 'Hamburg', country: 'Germany', lat: 53.5488, lng: 9.9872 },
  RTM: { code: 'RTM', name: 'Port of Rotterdam', type: 'Seaport', city: 'Rotterdam', country: 'Netherlands', lat: 51.9225, lng: 4.4791 },
  SINP: { code: 'SINP', name: 'Port of Singapore', type: 'Seaport', city: 'Singapore', country: 'Singapore', lat: 1.2644, lng: 103.8403 },
  MUNP: { code: 'MUNP', name: 'Mumbai Port Trust', type: 'Seaport', city: 'Mumbai', country: 'India', lat: 18.9438, lng: 72.8359 },
  SHA: { code: 'SHA', name: 'Port of Shanghai', type: 'Seaport', city: 'Shanghai', country: 'China', lat: 30.6225, lng: 122.0583 },
  LAXP: { code: 'LAXP', name: 'Port of Los Angeles', type: 'Seaport', city: 'Los Angeles', country: 'USA', lat: 33.7288, lng: -118.2620 },

  // Cities/Hubs
  DXBC: { code: 'DXBC', name: 'Dubai City', type: 'City', city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
  ABU: { code: 'ABU', name: 'Abu Dhabi City', type: 'City', city: 'Abu Dhabi', country: 'UAE', lat: 24.4539, lng: 54.3773 },
  RUH: { code: 'RUH', name: 'Riyadh City', type: 'City', city: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
  JED: { code: 'JED', name: 'Jeddah City', type: 'City', city: 'Jeddah', country: 'Saudi Arabia', lat: 21.4858, lng: 39.1925 },
  BOMC: { code: 'BOMC', name: 'Mumbai City', type: 'City', city: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
  DEL: { code: 'DEL', name: 'Delhi City', type: 'City', city: 'Delhi', country: 'India', lat: 28.7041, lng: 77.1025 },
  BLR: { code: 'BLR', name: 'Bangalore City', type: 'City', city: 'Bangalore', country: 'India', lat: 12.9716, lng: 77.5946 },
  MAA: { code: 'MAA', name: 'Chennai City', type: 'City', city: 'Chennai', country: 'India', lat: 13.0827, lng: 80.2707 },
  FRAC: { code: 'FRAC', name: 'Frankfurt City', type: 'City', city: 'Frankfurt', country: 'Germany', lat: 50.1109, lng: 8.6821 },
  LON: { code: 'LON', name: 'London City', type: 'City', city: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 }
};

export const TRANSPORT_PROVIDERS = [
  // Airlines
  { id: 'prv-1', code: 'QR', name: 'Qatar Airways Cargo', prefix: '157', type: 'Airline' },
  { id: 'prv-2', code: 'EK', name: 'Emirates SkyCargo', prefix: '176', type: 'Airline' },
  { id: 'prv-3', code: 'LH', name: 'Lufthansa Cargo', prefix: '020', type: 'Airline' },
  { id: 'prv-4', code: 'BA', name: 'IAG Cargo', prefix: '125', type: 'Airline' },
  
  // Shipping Lines
  { id: 'prv-5', code: 'MSK', name: 'Maersk Line', prefix: '', type: 'Shipping Line' },
  { id: 'prv-6', code: 'MSC', name: 'MSC', prefix: '', type: 'Shipping Line' },
  { id: 'prv-7', code: 'CMA', name: 'CMA CGM', prefix: '', type: 'Shipping Line' },
  { id: 'prv-8', code: 'HAP', name: 'Hapag-Lloyd', prefix: '', type: 'Shipping Line' },

  // Trucking & Couriers
  { id: 'prv-9', code: 'DHL', name: 'DHL Freight', prefix: '', type: 'Trucking Company' },
  { id: 'prv-10', code: 'FDX', name: 'FedEx Freight', prefix: '', type: 'Trucking Company' },
  { id: 'prv-11', code: 'ARM', name: 'Aramex', prefix: '', type: 'Trucking Company' },
  { id: 'prv-12', code: 'BLD', name: 'Blue Dart', prefix: '', type: 'Trucking Company' },
];

export const CARGO_TYPES = ['General', 'Perishable', 'Dangerous Goods', 'Live Animals', 'Pharma', 'Valuable', 'Human Remains', 'Oversized', 'Vehicles'];
export const INCOTERMS = ['EXW', 'FCA', 'FOB', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
export const INCOTERM_LABELS = {
  'EXW': 'EXW (Ex Works)', 'FCA': 'FCA (Free Carrier)', 'FOB': 'FOB (Free On Board)', 
  'CPT': 'CPT (Carriage Paid To)', 'CIP': 'CIP (Carriage and Insurance Paid To)', 
  'DAP': 'DAP (Delivered at Place)', 'DPU': 'DPU (Delivered at Place Unloaded)', 'DDP': 'DDP (Delivered Duty Paid)'
};
export const LEAD_SOURCES = ['Inbound RFQ Portal', 'Referral', 'Tender', 'Outbound', 'Event'];
export const LEAD_STATUSES = ['New', 'Qualifying', 'Qualified', 'Disqualified', 'Converted'];
export const SERVICE_TYPES = ['Port-to-Port', 'Door-to-Port', 'Port-to-Door', 'Door-to-Door', 'Airport-to-Airport'];
export const RATE_CLASSES = ['M', 'N', 'Q', 'C', 'U-E'];
export const FREIGHT_TERMS = ['Prepaid', 'Collect'];
export const OPPORTUNITY_STAGES = ['Qualifying', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export const CONTAINER_TYPES = ['20GP', '40GP', '40HC', '45HC', '20RF', '40RF', 'OT', 'FR', 'Tank'];
export const TRUCK_TYPES = ['Mini Truck', 'LCV', '20 FT', '32 FT', 'Trailer', 'Reefer', 'Flatbed', 'Tanker'];

export const SHIPMENT_STATUSES = [
  'Booked', 'Documentation', 'Ready for Carriage', 'In Transit',
  'Customs Hold', 'Delivered', 'POD Confirmed', 'Closed', 'Exception'
];

export const TRACKING_EVENTS = {
  AIR: [
    { code: 'RCS', label: 'Received from Shipper' }, { code: 'DEP', label: 'Departed' }, 
    { code: 'ARR', label: 'Arrived' }, { code: 'RCF', label: 'Received from Flight' },
    { code: 'NFD', label: 'Notification to Consignee' }, { code: 'AWD', label: 'Awaiting Customs Docs' },
    { code: 'CCD', label: 'Customs Cleared' }, { code: 'DLV', label: 'Delivered' }
  ],
  SEA: [
    { code: 'BKD', label: 'Booking Confirmed' }, { code: 'GIN', label: 'Gate In' },
    { code: 'LOV', label: 'Loaded On Vessel' }, { code: 'SAI', label: 'Sailed' },
    { code: 'ARP', label: 'Arrived Port' }, { code: 'CCD', label: 'Customs Cleared' },
    { code: 'DLV', label: 'Delivered' }
  ],
  ROAD: [
    { code: 'PKU', label: 'Picked Up' }, { code: 'ITR', label: 'In Transit' },
    { code: 'HUB', label: 'Reached Hub' }, { code: 'OFD', label: 'Out For Delivery' },
    { code: 'POD', label: 'POD Received' }, { code: 'DLV', label: 'Delivered' }
  ]
};

// ---- Seed Records ----
let _id = 0;
const nextId = (prefix) => `${prefix}-${String(++_id).padStart(4, '0')}`;

export function generateSeedData() {
  _id = 0;

  // CRM
  const organizations = [
    // Airlines
    { org_id: 'ORG-0001', legal_name: 'Qatar Airways Cargo', code: 'QR', org_type: 'Carrier', carrier_type: 'Airline', status: 'Active', created_at: new Date().toISOString() },
    { org_id: 'ORG-0002', legal_name: 'Emirates SkyCargo', code: 'EK', org_type: 'Carrier', carrier_type: 'Airline', status: 'Active', created_at: new Date().toISOString() },
    { org_id: 'ORG-0003', legal_name: 'Lufthansa Cargo', code: 'LH', org_type: 'Carrier', carrier_type: 'Airline', status: 'Active', created_at: new Date().toISOString() },
    { org_id: 'ORG-0004', legal_name: 'Cathay Pacific Cargo', code: 'CX', org_type: 'Carrier', carrier_type: 'Airline', status: 'Active', created_at: new Date().toISOString() },
    { org_id: 'ORG-0005', legal_name: 'Singapore Airlines Cargo', code: 'SQ', org_type: 'Carrier', carrier_type: 'Airline', status: 'Active', created_at: new Date().toISOString() },
    { org_id: 'ORG-0006', legal_name: 'FedEx Express', code: 'FX', org_type: 'Carrier', carrier_type: 'Airline', status: 'Active', created_at: new Date().toISOString() },
    
    // Shipping Lines
    { org_id: 'ORG-0007', legal_name: 'Maersk Line', code: 'MSK', org_type: 'Carrier', carrier_type: 'Shipping Line', status: 'Active', created_at: new Date().toISOString() },
    { org_id: 'ORG-0008', legal_name: 'MSC', code: 'MSC', org_type: 'Carrier', carrier_type: 'Shipping Line', status: 'Active', created_at: new Date().toISOString() },
    { org_id: 'ORG-0009', legal_name: 'CMA CGM', code: 'CMA', org_type: 'Carrier', carrier_type: 'Shipping Line', status: 'Active', created_at: new Date().toISOString() },
    { org_id: 'ORG-0010', legal_name: 'Hapag-Lloyd', code: 'HAP', org_type: 'Carrier', carrier_type: 'Shipping Line', status: 'Active', created_at: new Date().toISOString() },
    
    // Trucking Companies
    { org_id: 'ORG-0011', legal_name: 'DHL Freight', code: 'DHL', org_type: 'Carrier', carrier_type: 'Trucking Company', status: 'Active', created_at: new Date().toISOString() },
    { org_id: 'ORG-0012', legal_name: 'FedEx Freight', code: 'FDX', org_type: 'Carrier', carrier_type: 'Trucking Company', status: 'Active', created_at: new Date().toISOString() },
    { org_id: 'ORG-0013', legal_name: 'Aramex', code: 'ARM', org_type: 'Carrier', carrier_type: 'Trucking Company', status: 'Active', created_at: new Date().toISOString() },
    { org_id: 'ORG-0014', legal_name: 'Blue Dart', code: 'BLD', org_type: 'Carrier', carrier_type: 'Trucking Company', status: 'Active', created_at: new Date().toISOString() }
  ];
  const contacts = [
    { contact_id: 'con-0001', first_name: 'Jane', last_name: 'Doe', email: 'jane.doe@pentacloud.com', phone: '+1-555-0100', org_id: 'ORG-0001', is_primary: true, created_at: new Date().toISOString() },
  ];
  
  const opportunities = [
    { opportunity_id: 'opp-0001', title: 'TechNova Q3 Electronics Shipping', org_id: 'ORG-0001', contact_id: 'con-0001', pipeline_value: 45000, currency_code: 'USD', stage: 'Proposal', source: 'Referral', status: 'Active', transport_mode: 'AIR', route_type: 'International', origin_location: 'SFO', destination_location: 'LHR', cargo_type: 'Electronics', incoterm: 'CIF', est_pieces: 150, est_gross_weight_kg: 2500, created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
    { opportunity_id: 'opp-0002', title: 'GlobalTech Auto Parts', org_id: 'ORG-0002', contact_id: null, pipeline_value: 120000, currency_code: 'USD', stage: 'Negotiation', source: 'Website', status: 'Active', transport_mode: 'SEA', route_type: 'International', origin_location: 'SHA', destination_location: 'LAX', cargo_type: 'Automotive', incoterm: 'FOB', est_pieces: 5, est_gross_weight_kg: 18000, created_at: new Date(Date.now() - 86400000 * 12).toISOString() },
    { opportunity_id: 'opp-0003', title: 'MedSupply Urgent Vaccines', org_id: 'ORG-0003', contact_id: null, pipeline_value: 8500, currency_code: 'USD', stage: 'Qualifying', source: 'Direct Call', status: 'Active', transport_mode: 'AIR', route_type: 'Domestic', origin_location: 'JFK', destination_location: 'ORD', cargo_type: 'Pharma / Cold Chain', incoterm: 'EXW', est_pieces: 20, est_gross_weight_kg: 400, created_at: new Date(Date.now() - 86400000 * 2).toISOString() }
  ];
  
  const leads = [];

  // Operations - Shipments
  const shipments = [];

  // Operations - Transport Docs
  const transportDocuments = [];

  // Operations - Transport Manifests
  const transportManifests = [];

  const manifestLineItems = [];

  const bookingRequests = [];

  // Air Specific: ULDs
  const ulds = [];
  const uldAllocations = [];

  // Tracking Events
  const trackingEvents = [];

  const customsClearances = [];

  // Warehousing
  const warehouses = [];
  const storageLocations = [];
  const warehouseInventory = [];
  const stockMovements = [];

  // Fleet Management
  const fleetVehicles = [];
  const fleetDrivers = [];

  // Finance
  const quotes = [];
  const invoices = [];
  const payments = [];
  const vendorBills = [];
  const expenses = [];
  const creditNotes = [];

  const domainEvents = [];

  return {
    organizations,
    contacts,
    opportunities,
    leads,
    shipments,
    transportDocuments,
    transportManifests,
    bookingRequests,
    manifestLineItems,
    ulds,
    uldAllocations,
    trackingEvents,
    customsClearances,
    warehouses,
    storageLocations,
    warehouseInventory,
    stockMovements,
    fleetVehicles,
    fleetDrivers,
    quotes,
    invoices,
    payments,
    vendorBills,
    expenses,
    creditNotes,
    domainEvents,
  };
}
