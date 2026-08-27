'use client';
import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { generateSeedData } from '../data/seedData';
import { eventBus, EVENT_TYPES } from './eventBus';
import { generateId, fuzzyMatch } from '../utils/formatters';

const AppContext = createContext(null);

// ---------- Initial state from seed data ----------
function getInitialState() {
  const seed = generateSeedData();
  return {
    ...seed,
    documents: [],
    notifications: [],
    aiMessages: [],
    selectedEntity: null,
    isAuthenticated: false,
  };
}

// ---------- Reducer ----------
function appReducer(state, action) {
  switch (action.type) {
    // ---- System ----
    case 'HYDRATE': {
      const hydrated = { ...state, ...action.payload };
      // Ensure seed organizations (carriers, etc.) are always present with correct types
      const seedOrgs = getInitialState().organizations;
      const existingIds = new Set((hydrated.organizations || []).map(o => o.org_id));
      // Add any seed orgs that are completely missing
      const missingOrgs = seedOrgs.filter(o => !existingIds.has(o.org_id));
      if (missingOrgs.length > 0) {
        hydrated.organizations = [...(hydrated.organizations || []), ...missingOrgs];
      }
      // Ensure seed org critical fields (org_type, carrier_type, code) are always correct
      hydrated.organizations = (hydrated.organizations || []).map(org => {
        const seedOrg = seedOrgs.find(so => so.org_id === org.org_id);
        if (seedOrg) {
          return { ...org, org_type: seedOrg.org_type, carrier_type: seedOrg.carrier_type, code: seedOrg.code };
        }
        return org;
      });
      return hydrated;
    }
    
    case 'LOGIN': {
      return { ...state, isAuthenticated: true };
    }
    
    case 'LOGOUT': {
      return { ...state, isAuthenticated: false };
    }

    // ---- CRM ----
    case 'CREATE_LEAD': {
      const lead = { ...action.payload, lead_id: generateId('lead'), status: 'New', created_at: new Date().toISOString(), converted_at: null, converted_org_id: null, converted_contact_id: null, converted_opportunity_id: null };
      return { ...state, leads: [lead, ...state.leads] };
    }

    case 'UPDATE_LEAD': {
      return { ...state, leads: state.leads.map(l => l.lead_id === action.payload.lead_id ? { ...l, ...action.payload, updated_at: new Date().toISOString() } : l) };
    }

    case 'DELETE_LEAD': {
      return { ...state, leads: state.leads.filter(l => l.lead_id !== action.payload) };
    }

    case 'CONVERT_LEAD': {
      const { lead_id, organization, contact, opportunity, reuseOrgId } = action.payload;
      const lead = state.leads.find(l => l.lead_id === lead_id);
      if (!lead || lead.status !== 'Qualified' || lead.converted_at) return state;

      const now = new Date().toISOString();
      let newOrgs = [...state.organizations];
      let orgId;

      if (reuseOrgId) {
        orgId = reuseOrgId;
      } else {
        const newOrg = {
          org_id: generateId('org'),
          legal_name: organization.legal_name || lead.company_name,
          org_type: 'Customer',
          industry: organization.industry || lead.industry || '',
          phone: lead.phone || '',
          website: lead.website || '',
          account_tier: 'Standard',
          status: 'Active',
          customer_since: now,
          owner_id: lead.owner_id || null,
          created_at: now,
          updated_at: now,
        };
        newOrgs = [newOrg, ...newOrgs];
        orgId = newOrg.org_id;
      }

      const newContact = {
        contact_id: generateId('con'),
        full_name: contact.full_name || lead.full_name || 'Unknown',
        email: contact.email || lead.email || '',
        phone: contact.phone || lead.phone || '',
        org_id: orgId,
        is_primary: true,
        created_at: now,
      };

      const originLoc = lead.origin_location || '';
      const destLoc = lead.destination_location || '';

      const safeGetLocationName = (loc) => {
        if (!loc) return '?';
        try { return JSON.parse(loc).name || '?'; } catch { return loc; }
      };

      const oppName = `${lead.company_name} (${lead.full_name || 'Contact'}) — ${safeGetLocationName(originLoc)} to ${safeGetLocationName(destLoc)}`;
      const newOpportunity = {
        opportunity_id: generateId('opp'),
        title: oppName,
        org_id: orgId,
        contact_id: newContact.contact_id,
        owner_id: lead.owner_id || null,
        stage: 'Qualifying',
        pipeline_value: Number(lead.pipeline_value) || 0,
        currency_code: lead.currency_code || 'USD',
        transport_mode: lead.transport_mode || 'AIR',
        origin_location: originLoc,
        destination_location: destLoc,
        route_type: lead.route_type || '',
        cargo_type: lead.cargo_type || 'General',
        incoterm: lead.incoterm || 'FOB',
        est_pieces: Number(lead.est_pieces) || 0,
        estimated_weight_kg: Number(lead.est_gross_weight_kg) || 0,
        volume_cbm: Number(lead.volume_cbm) || 0,
        cargo_ready_date: lead.cargo_ready_date || null,
        created_at: now,
        updated_at: now,
      };

      const updatedLeads = state.leads.map(l =>
        l.lead_id === lead_id
          ? { ...l, status: 'Converted', converted_at: now, converted_org_id: orgId, converted_contact_id: newContact.contact_id, converted_opportunity_id: newOpportunity.opportunity_id, updated_at: now }
          : l
      );

      return {
        ...state,
        leads: updatedLeads,
        organizations: newOrgs,
        contacts: [newContact, ...state.contacts],
        opportunities: [newOpportunity, ...state.opportunities],
      };
    }

    case 'UPDATE_OPPORTUNITY_STAGE': {
      const { opportunity_id, stage } = action.payload;
      const now = new Date().toISOString();

      let newState = {
        ...state,
        opportunities: state.opportunities.map(o =>
          o.opportunity_id === opportunity_id ? { ...o, stage, updated_at: now } : o
        ),
      };

      if (stage === 'Won') {
        const opp = state.opportunities.find(o => o.opportunity_id === opportunity_id);
        if (opp && !opp.won_shipment_id) {
          const newShipment = {
            shipment_id: generateId('shp'),
            shipment_reference: `SHP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
            opportunity_id,
            org_id: opp.org_id,
            contact_id: opp.contact_id || null,
            transport_mode: opp.transport_mode || 'AIR',
            service_type: 'Port-to-Port',
            origin_location: opp.origin_location || '',
            destination_location: opp.destination_location || '',
            incoterm: opp.incoterm || 'FOB',
            cargo_type: opp.cargo_type || 'General',
            special_handling_codes: [],
            pieces: opp.est_pieces || 0,
            gross_weight_kg: opp.estimated_weight_kg || 0,
            chargeable_weight_kg: opp.estimated_weight_kg || 0,
            master_doc_id: null,
            status: 'Booked',
            created_at: now,
          };

          newState = {
            ...newState,
            shipments: [newShipment, ...newState.shipments],
            opportunities: newState.opportunities.map(o =>
              o.opportunity_id === opportunity_id ? { ...o, won_shipment_id: newShipment.shipment_id } : o
            ),
          };
        }
      }

      return newState;
    }

    case 'CREATE_ORGANIZATION': {
      const org = { ...action.payload, org_id: generateId('org'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      return { ...state, organizations: [org, ...state.organizations] };
    }
    case 'UPDATE_ORGANIZATION': {
      return { ...state, organizations: state.organizations.map(o => o.org_id === action.payload.org_id ? { ...o, ...action.payload, updated_at: new Date().toISOString() } : o) };
    }
    case 'DELETE_ORGANIZATION': {
      return { ...state, organizations: state.organizations.filter(o => o.org_id !== action.payload) };
    }

    case 'CREATE_CONTACT': {
      const con = { ...action.payload, contact_id: generateId('con'), created_at: new Date().toISOString() };
      return { ...state, contacts: [con, ...state.contacts] };
    }
    case 'UPDATE_CONTACT': {
      return { ...state, contacts: state.contacts.map(c => c.contact_id === action.payload.contact_id ? { ...c, ...action.payload } : c) };
    }
    case 'DELETE_CONTACT': {
      return { ...state, contacts: state.contacts.filter(c => c.contact_id !== action.payload) };
    }

    case 'CREATE_OPPORTUNITY': {
      const opp = { ...action.payload, opportunity_id: generateId('opp'), created_at: new Date().toISOString() };
      return { ...state, opportunities: [opp, ...state.opportunities] };
    }
    case 'UPDATE_OPPORTUNITY': {
      return { ...state, opportunities: state.opportunities.map(o => o.opportunity_id === action.payload.opportunity_id ? { ...o, ...action.payload } : o) };
    }
    case 'DELETE_OPPORTUNITY': {
      return { ...state, opportunities: state.opportunities.filter(o => o.opportunity_id !== action.payload) };
    }

    // ---- Logistics ----
    case 'CREATE_SHIPMENT': {
      const shp = { ...action.payload, shipment_id: generateId('shp'), created_at: new Date().toISOString() };
      return { ...state, shipments: [shp, ...state.shipments] };
    }
    case 'UPDATE_SHIPMENT': {
      return { ...state, shipments: state.shipments.map(s => s.shipment_id === action.payload.shipment_id ? { ...s, ...action.payload } : s) };
    }
    case 'DELETE_SHIPMENT': {
      return { 
        ...state, 
        shipments: state.shipments.filter(s => s.shipment_id !== action.payload),
        uldAllocations: state.uldAllocations.filter(a => a.shipment_id !== action.payload)
      };
    }

    case 'CREATE_TRANSPORT_DOC': {
      const doc = { ...action.payload, doc_id: generateId('doc'), created_at: new Date().toISOString() };
      let newState = { ...state, transportDocuments: [doc, ...state.transportDocuments] };
      
      if ((doc.doc_type === 'MAWB' || doc.doc_type === 'MBL' || doc.doc_type === 'LR') && doc.shipment_id) {
        newState.shipments = newState.shipments.map(s => 
          s.shipment_id === doc.shipment_id ? { ...s, master_doc_id: doc.doc_id } : s
        );
      }
      return newState;
    }
    case 'UPDATE_TRANSPORT_DOC': {
      return { ...state, transportDocuments: state.transportDocuments.map(d => d.doc_id === action.payload.doc_id ? { ...d, ...action.payload } : d) };
    }
    case 'DELETE_TRANSPORT_DOC': {
      return { ...state, transportDocuments: state.transportDocuments.filter(d => d.doc_id !== action.payload) };
    }

    case 'CREATE_TRANSPORT_MANIFEST': {
      const manifest = { ...action.payload, manifest_id: generateId('man'), created_at: new Date().toISOString() };
      return { ...state, transportManifests: [manifest, ...state.transportManifests] };
    }
    case 'UPDATE_TRANSPORT_MANIFEST': {
      return { ...state, transportManifests: state.transportManifests.map(m => m.manifest_id === action.payload.manifest_id ? { ...m, ...action.payload } : m) };
    }
    case 'DELETE_TRANSPORT_MANIFEST': {
      return { ...state, transportManifests: state.transportManifests.filter(m => m.manifest_id !== action.payload) };
    }
    
    case 'CREATE_BOOKING': {
      const bkr = { ...action.payload, booking_request_id: generateId('bkr'), status: 'Requested', created_at: new Date().toISOString() };
      return { ...state, bookingRequests: [bkr, ...state.bookingRequests] };
    }
    case 'UPDATE_BOOKING': {
      return { ...state, bookingRequests: state.bookingRequests.map(b => b.booking_request_id === action.payload.booking_request_id ? { ...b, ...action.payload } : b) };
    }
    case 'DELETE_BOOKING': {
      return { ...state, bookingRequests: state.bookingRequests.filter(b => b.booking_request_id !== action.payload) };
    }

    case 'ADD_TRACKING_EVENT': {
      const evt = { ...action.payload, event_id: generateId('evt'), created_at: new Date().toISOString() };
      const newState = { ...state, trackingEvents: [evt, ...state.trackingEvents] };

      // Basic milestone update for shipment based on event code
      if (evt.shipment_id) {
        newState.shipments = newState.shipments.map(s => {
          if (s.shipment_id !== evt.shipment_id) return s;
          let newStatus = s.status;
          if (evt.event_code === 'DLV') newStatus = 'Delivered';
          else if (['DEP', 'ARR', 'SAI', 'ARP', 'LOV', 'ITR'].includes(evt.event_code)) newStatus = 'In Transit';
          return { ...s, status: newStatus };
        });
      }
      return newState;
    }

    case 'REMOVE_TRACKING_EVENT': {
      const { shipment_id, event_code } = action.payload;
      return { 
        ...state, 
        trackingEvents: state.trackingEvents.filter(e => !(e.shipment_id === shipment_id && e.event_code === event_code))
      };
    }

    case 'CREATE_CUSTOMS': {
      const clr = { ...action.payload, clearance_id: generateId('clr'), created_at: new Date().toISOString() };
      return { ...state, customsClearances: [clr, ...state.customsClearances] };
    }
    case 'UPDATE_CUSTOMS': {
      return { ...state, customsClearances: state.customsClearances.map(c => c.clearance_id === action.payload.clearance_id ? { ...c, ...action.payload } : c) };
    }
    case 'DELETE_CUSTOMS': {
      return { ...state, customsClearances: state.customsClearances.filter(c => c.clearance_id !== action.payload) };
    }

    // ULD Management
    case 'CREATE_ULD': {
      const uld = { ...action.payload, uld_id: generateId('uld'), created_at: new Date().toISOString() };
      return { ...state, ulds: [uld, ...state.ulds] };
    }
    case 'UPDATE_ULD': {
      return { ...state, ulds: state.ulds.map(u => u.uld_id === action.payload.uld_id ? { ...u, ...action.payload } : u) };
    }
    case 'DELETE_ULD': {
      return { ...state, ulds: state.ulds.filter(u => u.uld_id !== action.payload) };
    }

    // Finance (Quotes, Invoices)
    case 'CREATE_INVOICE': {
      const inv = { 
        ...action.payload, 
        invoice_id: generateId('inv'), 
        share_token: action.payload.share_token || generateId('tok'),
        status: action.payload.status || 'Draft', 
        created_at: new Date().toISOString() 
      };
      return { ...state, invoices: [inv, ...state.invoices] };
    }
    case 'UPDATE_INVOICE': {
      return { ...state, invoices: state.invoices.map(i => i.invoice_id === action.payload.invoice_id ? { ...i, ...action.payload } : i) };
    }
    case 'DELETE_INVOICE': {
      return { ...state, invoices: state.invoices.filter(i => i.invoice_id !== action.payload) };
    }
    case 'SIGN_INVOICE': {
      const { invoice_id, signature_data, signer_name } = action.payload;
      return { 
        ...state, 
        invoices: state.invoices.map(i => 
          i.invoice_id === invoice_id 
            ? { ...i, status: 'Signed', signature_data, signer_name, signed_at: new Date().toISOString() } 
            : i
        ) 
      };
    }
    
    // Documents
    case 'CREATE_DOCUMENT': {
      const doc = { 
        ...action.payload, 
        document_id: generateId('doc'), 
        share_token: action.payload.share_token || generateId('tok'),
        created_at: new Date().toISOString() 
      };
      return { ...state, documents: [doc, ...(state.documents || [])] };
    }
    case 'UPDATE_DOCUMENT': {
      return { ...state, documents: (state.documents || []).map(d => d.document_id === action.payload.document_id ? { ...d, ...action.payload } : d) };
    }
    case 'DELETE_DOCUMENT': {
      return { ...state, documents: (state.documents || []).filter(d => d.document_id !== action.payload) };
    }
    case 'SIGN_DOCUMENT': {
      const { document_id, signature_data, signer_name } = action.payload;
      return { 
        ...state, 
        documents: (state.documents || []).map(d => 
          d.document_id === document_id 
            ? { ...d, status: 'Signed', signature_data, signer_name, signed_at: new Date().toISOString() } 
            : d
        ) 
      };
    }

    // Missing actions used by Shipments Detail Page
    case 'CREATE_AWB': {
      const doc = { ...action.payload, doc_id: generateId('doc'), doc_type: action.payload.awb_type || 'MAWB', doc_number: action.payload.awb_number, created_at: new Date().toISOString() };
      let newState = { ...state, transportDocuments: [doc, ...(state.transportDocuments || [])] };
      if (doc.shipment_id) {
         newState.shipments = newState.shipments.map(s => s.shipment_id === doc.shipment_id ? { ...s, master_doc_id: doc.doc_id, mawb_id: doc.doc_id } : s);
      }
      return newState;
    }
    case 'CREATE_ULD_ALLOCATION': {
      const alloc = { ...action.payload, allocation_id: generateId('ula'), created_at: new Date().toISOString() };
      return { ...state, uldAllocations: [alloc, ...(state.uldAllocations || [])] };
    }
    case 'CREATE_MANIFEST_LINE_ITEM': {
       const mli = { ...action.payload, manifest_line_item_id: generateId('mli'), created_at: new Date().toISOString() };
       return { ...state, manifestLineItems: [mli, ...(state.manifestLineItems || [])] };
    }
    case 'UPDATE_ULD_STATUS': {
       return { 
           ...state, 
           ulds: state.ulds.map(u => {
              if (u.uld_id === action.payload.uld_id) {
                  const history = u.status_history || [];
                  return { ...u, status: action.payload.status, status_history: [...history, { status: action.payload.status, timestamp: new Date().toISOString(), updated_by: action.payload.updated_by }] };
              }
              return u;
           }) 
       };
    }
    case 'SIMULATE_FLIGHT_TRACKING': {
        const { shipment_id, origin_airport } = action.payload;
        const now = new Date();
        const evts = [
           { event_id: generateId('evt'), shipment_id, event_code: 'RCS', event_description: 'Cargo Received', tracking_source: 'Airline', event_timestamp: new Date(now.getTime() - 1200000).toISOString() },
           { event_id: generateId('evt'), shipment_id, event_code: 'DEP', event_description: `Departed ${origin_airport || ''}`, tracking_source: 'Airline', event_timestamp: now.toISOString() }
        ];
        let newState = { ...state, trackingEvents: [...evts, ...(state.trackingEvents || [])] };
        newState.shipments = newState.shipments.map(s => s.shipment_id === shipment_id ? { ...s, status: 'In Transit' } : s);
        return newState;
    }

    default:
      return state;
  }
}

// ---------- Provider ----------
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, getInitialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pentalogix-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'HYDRATE', payload: parsed });
      } catch (e) {
        console.error('Failed to parse state from localStorage', e);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('pentalogix-state', JSON.stringify(state));
    }
  }, [state, isHydrated]);

  const value = {
    state,
    dispatch,
    isHydrated,
    // Convenience getters
    getOrganization: (id) => state.organizations.find(o => o.org_id === id),
    getContact: (id) => state.contacts.find(c => c.contact_id === id),
    getOpportunity: (id) => state.opportunities.find(o => o.opportunity_id === id),
    getShipment: (id) => state.shipments.find(s => s.shipment_id === id),
    getTransportDocument: (id) => state.transportDocuments.find(d => d.doc_id === id),
    getTransportManifest: (id) => state.transportManifests.find(m => m.manifest_id === id),
    getULD: (id) => state.ulds.find(u => u.uld_id === id),
    
    getEventsForShipment: (shipmentId) => state.trackingEvents.filter(e => e.shipment_id === shipmentId).sort((a, b) => new Date(a.event_time) - new Date(b.event_time)),
    getClearancesForShipment: (shipmentId) => state.customsClearances.filter(c => c.shipment_id === shipmentId),
    getBookingsForShipment: (shipmentId) => state.bookingRequests.filter(b => b.shipment_id === shipmentId),
    getULDAllocationsForShipment: (shipmentId) => state.uldAllocations.filter(u => u.shipment_id === shipmentId),
    getAWB: (id) => state.transportDocuments.find(d => d.doc_id === id),
    getManifest: (id) => state.transportManifests.find(m => m.manifest_id === id),
    getManifestLineItemsForShipment: (shipmentId) => (state.manifestLineItems || []).filter(m => m.shipment_id === shipmentId),
    getDocumentsForShipment: (shipmentId) => (state.documents || []).filter(d => d.shipment_id === shipmentId),
    
    getManifestTotalAllocatedWeight: (manifestId) => {
      const manifest = state.transportManifests.find(m => m.manifest_id === manifestId);
      if (!manifest) return 0;
      
      let totalWeight = 0;
      (state.manifestLineItems || []).forEach(mli => {
         if (mli.manifest_id === manifestId) {
             totalWeight += (mli.loaded_weight_kg || 0);
         }
      });
      return totalWeight;
    },
    
    getULDTotalAllocatedWeight: (uldId) => {
      let totalWeight = 0;
      state.uldAllocations.forEach(a => {
        if (a.uld_id === uldId) {
          totalWeight += (a.weight_kg || a.loaded_weight_kg || 0);
        }
      });
      return totalWeight;
    },
    
    getContactsForOrg: (orgId) => state.contacts.filter(c => c.org_id === orgId),
    getOpportunitiesForOrg: (orgId) => state.opportunities.filter(o => o.org_id === orgId),
    getShipmentsForOrg: (orgId) => state.shipments.filter(s => s.org_id === orgId),
    getInvoicesForShipment: (shipmentId) => state.invoices.filter(i => i.shipment_id === shipmentId),
    
    getRelatedDataForShipment: (shipmentId) => ({
      transportDocs: state.transportDocuments.filter(d => d.shipment_id === shipmentId),
      customs: state.customsClearances.filter(c => c.shipment_id === shipmentId),
      bookings: state.bookingRequests.filter(b => b.shipment_id === shipmentId),
      tracking: state.trackingEvents.filter(t => t.shipment_id === shipmentId).sort((a, b) => new Date(a.event_time) - new Date(b.event_time)),
      uldAllocations: state.uldAllocations.filter(u => u.shipment_id === shipmentId),
    }),
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
