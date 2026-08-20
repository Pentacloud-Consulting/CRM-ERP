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
    invoices: [],
    notifications: [],
    aiMessages: [],
    selectedEntity: null,
  };
}

// ---------- Reducer ----------
function appReducer(state, action) {
  switch (action.type) {
    // ---- System ----
    case 'HYDRATE': {
      let hydratedState = action.payload;
      
      // Auto-migrate legacy shipments that don't have a contact_id
      const needsMigration = hydratedState?.shipments?.some(s => !s.contact_id);
      if (needsMigration) {
        hydratedState = { ...hydratedState };
        hydratedState.shipments = [...hydratedState.shipments];
        
        // Group contacts by account for round-robin assignment
        const contactsByAccount = {};
        hydratedState.contacts.forEach(c => {
          if (!contactsByAccount[c.account_id]) contactsByAccount[c.account_id] = [];
          contactsByAccount[c.account_id].push(c);
        });
        
        // Keep track of index per account for round-robin
        const rrIndex = {};
        
        hydratedState.shipments = hydratedState.shipments.map(s => {
          if (s.contact_id) return s; // already has one
          const accountContacts = contactsByAccount[s.account_id];
          if (!accountContacts || accountContacts.length === 0) return s; // no contacts to assign to
          
          if (rrIndex[s.account_id] === undefined) rrIndex[s.account_id] = 0;
          
          const assignedContact = accountContacts[rrIndex[s.account_id] % accountContacts.length];
          rrIndex[s.account_id]++; // move to next contact for the next shipment
          
          return { ...s, contact_id: assignedContact.contact_id };
        });
      }
      
      return { ...state, ...hydratedState };
    }

    // ---- CRM ----
    case 'CREATE_LEAD': {
      const lead = { ...action.payload, lead_id: generateId('lead'), status: 'New', created_at: new Date().toISOString(), converted_at: null, converted_account_id: null, converted_contact_id: null, converted_opportunity_id: null };
      return { ...state, leads: [lead, ...state.leads] };
    }

    case 'UPDATE_LEAD': {
      return { ...state, leads: state.leads.map(l => l.lead_id === action.payload.lead_id ? { ...l, ...action.payload, updated_at: new Date().toISOString() } : l) };
    }

    case 'DELETE_LEAD': {
      return { ...state, leads: state.leads.filter(l => l.lead_id !== action.payload) };
    }

    case 'CONVERT_LEAD': {
      const { lead_id, account, contact, opportunity, reuseAccountId } = action.payload;
      const lead = state.leads.find(l => l.lead_id === lead_id);
      if (!lead || lead.status !== 'Qualified' || lead.converted_at) return state;

      const now = new Date().toISOString();
      let newAccounts = [...state.accounts];
      let accountId;

      if (reuseAccountId) {
        accountId = reuseAccountId;
      } else {
        const newAccount = {
          account_id: generateId('acc'),
          legal_name: account.legal_name || lead.company_name,
          account_tier: 'Standard',
          tax_id: account.tax_id || '',
          country: account.country || '',
          default_currency: lead.currency_code,
          phone: account.phone || lead.phone || '',
          website: account.website || '',
          industry: account.industry || '',
          created_at: now,
          updated_at: now,
        };
        newAccounts = [newAccount, ...newAccounts];
        accountId = newAccount.account_id;
      }

      const newContact = {
        contact_id: generateId('con'),
        full_name: contact.full_name || (lead.first_name ? `${lead.first_name} ${lead.last_name}` : lead.contact_name) || 'Unknown',
        email: contact.email || lead.email || '',
        phone: contact.phone || lead.phone || '',
        title: contact.title || '',
        account_id: accountId,
        is_primary: true,
        created_at: now,
      };

      const oppName = `${lead.company_name} — ${lead.trade_lane}`;
      const newOpportunity = {
        opportunity_id: generateId('opp'),
        name: opportunity.name || oppName,
        account_id: accountId,
        primary_contact_id: newContact.contact_id,
        stage: 'Qualifying',
        pipeline_value: lead.estimated_value,
        currency_code: lead.currency_code,
        trade_lane: lead.trade_lane,
        cargo_type: lead.cargo_type,
        incoterm: lead.incoterm,
        est_pieces: lead.est_pieces,
        est_gross_weight_kg: lead.est_gross_weight_kg,
        owner_id: lead.owner_id,
        won_shipment_id: null,
        created_at: now,
        updated_at: now,
      };

      const updatedLeads = state.leads.map(l =>
        l.lead_id === lead_id
          ? { ...l, status: 'Converted', converted_at: now, converted_account_id: accountId, converted_contact_id: newContact.contact_id, converted_opportunity_id: newOpportunity.opportunity_id, updated_at: now }
          : l
      );

      // Publish domain event
      eventBus.publish(EVENT_TYPES.LEAD_CONVERTED, {
        lead_id,
        account_id: accountId,
        contact_id: newContact.contact_id,
        opportunity_id: newOpportunity.opportunity_id,
        converted_by: 'user-1',
        converted_at: now,
      }, 'user-1');

      return {
        ...state,
        leads: updatedLeads,
        accounts: newAccounts,
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

      // If Won, publish DealWon event and create shipment
      if (stage === 'Won') {
        const opp = state.opportunities.find(o => o.opportunity_id === opportunity_id);
        if (opp && !opp.won_shipment_id) {
          const [origin, destination] = (opp.trade_lane || '').split('–');
          const newShipment = {
            shipment_id: generateId('shp'),
            shipment_reference: `SHP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
            opportunity_id,
            account_id: opp.account_id,
            contact_id: opp.primary_contact_id || null,
            service_type: 'Airport-to-Airport',
            origin_airport: origin || '',
            destination_airport: destination || '',
            incoterm: opp.incoterm,
            cargo_type: opp.cargo_type,
            special_handling_codes: [],
            pieces: opp.est_pieces || 0,
            gross_weight_kg: opp.est_gross_weight_kg || 0,
            chargeable_weight_kg: opp.est_gross_weight_kg || 0,
            mawb_id: null,
            status: 'Booked',
            current_milestone_code: null,
            pod_signed_at: null,
            created_at: now,
            updated_at: now,
          };

          newState = {
            ...newState,
            shipments: [newShipment, ...newState.shipments],
            opportunities: newState.opportunities.map(o =>
              o.opportunity_id === opportunity_id ? { ...o, won_shipment_id: newShipment.shipment_id } : o
            ),
          };

          eventBus.publish(EVENT_TYPES.DEAL_WON, {
            opportunity_id,
            shipment_id: newShipment.shipment_id,
            account_id: opp.account_id,
          }, 'user-1');
        }
      }

      return newState;
    }

    case 'CREATE_ACCOUNT': {
      const acc = { ...action.payload, account_id: generateId('acc'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      return { ...state, accounts: [acc, ...state.accounts] };
    }

    case 'UPDATE_ACCOUNT': {
      return { ...state, accounts: state.accounts.map(a => a.account_id === action.payload.account_id ? { ...a, ...action.payload, updated_at: new Date().toISOString() } : a) };
    }

    case 'DELETE_ACCOUNT': {
      return { ...state, accounts: state.accounts.filter(a => a.account_id !== action.payload) };
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
      const opp = { ...action.payload, opportunity_id: generateId('opp'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      return { ...state, opportunities: [opp, ...state.opportunities] };
    }

    case 'UPDATE_OPPORTUNITY': {
      return { ...state, opportunities: state.opportunities.map(o => o.opportunity_id === action.payload.opportunity_id ? { ...o, ...action.payload, updated_at: new Date().toISOString() } : o) };
    }

    case 'DELETE_OPPORTUNITY': {
      return { ...state, opportunities: state.opportunities.filter(o => o.opportunity_id !== action.payload) };
    }

    // ---- Logistics ----
    case 'CREATE_SHIPMENT': {
      const shp = { ...action.payload, shipment_id: generateId('shp'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      return { ...state, shipments: [shp, ...state.shipments] };
    }

    case 'UPDATE_SHIPMENT': {
      return { ...state, shipments: state.shipments.map(s => s.shipment_id === action.payload.shipment_id ? { ...s, ...action.payload, updated_at: new Date().toISOString() } : s) };
    }

    case 'DELETE_SHIPMENT': {
      return { 
        ...state, 
        shipments: state.shipments.filter(s => s.shipment_id !== action.payload),
        uldAllocations: state.uldAllocations.filter(a => a.shipment_id !== action.payload)
      };
    }

    case 'CREATE_BOOKING': {
      const bkr = { ...action.payload, booking_request_id: generateId('bkr'), status: 'Requested', created_at: new Date().toISOString() };
      return { ...state, bookingRequests: [bkr, ...state.bookingRequests] };
    }

    case 'UPDATE_BOOKING': {
      const updated = { ...state, bookingRequests: state.bookingRequests.map(b => b.booking_request_id === action.payload.booking_request_id ? { ...b, ...action.payload } : b) };
      if (action.payload.status === 'Space Confirmed') {
        const booking = updated.bookingRequests.find(b => b.booking_request_id === action.payload.booking_request_id);
        if (booking) {
          eventBus.publish(EVENT_TYPES.BOOKING_CONFIRMED, { booking_request_id: booking.booking_request_id, shipment_id: booking.shipment_id, flight: booking.confirmed_flight_number });
        }
      }
      return updated;
    }

    case 'DELETE_BOOKING': {
      return { ...state, bookingRequests: state.bookingRequests.filter(b => b.booking_request_id !== action.payload) };
    }

    case 'CREATE_AWB': {
      const awb = { ...action.payload, awb_id: generateId('awb'), created_at: new Date().toISOString() };
      let newState2 = { ...state, airWaybills: [awb, ...state.airWaybills] };
      
      if ((awb.awb_type === 'Master (MAWB)' || awb.awb_type === 'Master') && awb.shipment_id) {
        newState2.shipments = newState2.shipments.map(s => 
          s.shipment_id === awb.shipment_id ? { ...s, mawb_id: awb.awb_id, updated_at: new Date().toISOString() } : s
        );
      }

      eventBus.publish(EVENT_TYPES.AWB_ISSUED, { awb_id: awb.awb_id, awb_number: awb.awb_number, shipment_id: awb.shipment_id });
      return newState2;
    }

    case 'UPDATE_AWB': {
      return { ...state, airWaybills: state.airWaybills.map(a => a.awb_id === action.payload.awb_id ? { ...a, ...action.payload, updated_at: new Date().toISOString() } : a) };
    }

    case 'DELETE_AWB': {
      return { ...state, airWaybills: state.airWaybills.filter(a => a.awb_id !== action.payload) };
    }

    case 'SIMULATE_FLIGHT_TRACKING': {
      const { shipment_id, flight_date, origin_airport, destination_airport } = action.payload;
      const baseTime = new Date(flight_date).getTime();
      
      const newEvents = [
        { event_code: 'RCS', offset: -12 * 3600000, desc: 'Received from Shipper', location: origin_airport },
        { event_code: 'DEP', offset: 0, desc: 'Departed', location: origin_airport },
        { event_code: 'ARR', offset: 14 * 3600000, desc: 'Arrived', location: destination_airport },
        { event_code: 'RCF', offset: 16 * 3600000, desc: 'Received from Flight', location: destination_airport },
        { event_code: 'NFD', offset: 18 * 3600000, desc: 'Notification to Consignee', location: destination_airport },
        { event_code: 'AWD', offset: 20 * 3600000, desc: 'Awaiting Customs Docs', location: destination_airport },
        { event_code: 'CCD', offset: 24 * 3600000, desc: 'Customs Cleared', location: destination_airport },
        { event_code: 'DLV', offset: 36 * 3600000, desc: 'Delivered', location: destination_airport },
      ].map(m => ({
        event_id: generateId('evt'),
        shipment_id,
        event_code: m.event_code,
        event_description: m.desc,
        location_airport: m.location || '',
        event_timestamp: new Date(baseTime + m.offset).toISOString(),
        recorded_at: new Date().toISOString()
      }));

      let newShipments = state.shipments.map(s => {
        if (s.shipment_id !== shipment_id) return s;
        return { ...s, current_milestone_code: 'DLV', status: 'Delivered', updated_at: new Date().toISOString() };
      });

      return { ...state, trackingEvents: [...newEvents, ...state.trackingEvents], shipments: newShipments };
    }

    case 'ADD_TRACKING_EVENT': {
      const evt = { ...action.payload, event_id: generateId('evt'), recorded_at: new Date().toISOString() };
      const newState3 = { ...state, trackingEvents: [evt, ...state.trackingEvents] };

      // Update shipment milestone
      if (evt.shipment_id) {
        newState3.shipments = newState3.shipments.map(s => {
          if (s.shipment_id !== evt.shipment_id) return s;
          let newStatus = s.status;
          if (evt.event_code === 'DLV') newStatus = 'Delivered';
          else if (evt.event_code === 'CCD') newStatus = s.status === 'Customs Hold' ? 'In Transit' : s.status;
          else if (evt.event_code === 'AWD') newStatus = 'Customs Hold';
          else if (evt.event_code === 'AWR' || evt.event_code === 'MAN') newStatus = 'Exception';
          else if (evt.event_code === 'DEP' || evt.event_code === 'ARR') newStatus = 'In Transit';
          return { ...s, current_milestone_code: evt.event_code, status: newStatus, updated_at: new Date().toISOString() };
        });
      }

      eventBus.publish(EVENT_TYPES.FSU_RECEIVED, { event_code: evt.event_code, shipment_id: evt.shipment_id, awb_id: evt.awb_id });

      if (evt.event_code === 'DLV') {
        const shp = newState3.shipments.find(s => s.shipment_id === evt.shipment_id);
        if (shp) eventBus.publish(EVENT_TYPES.SHIPMENT_DELIVERED, { shipment_id: shp.shipment_id, account_id: shp.account_id });
      }

      return newState3;
    }

    case 'CREATE_CUSTOMS': {
      const clr = { ...action.payload, clearance_id: generateId('clr'), created_at: new Date().toISOString() };
      return { ...state, customsClearances: [clr, ...state.customsClearances] };
    }

    case 'UPDATE_CUSTOMS': {
      const updated2 = { ...state, customsClearances: state.customsClearances.map(c => c.clearance_id === action.payload.clearance_id ? { ...c, ...action.payload } : c) };
      if (action.payload.status === 'Held') {
        eventBus.publish(EVENT_TYPES.CUSTOMS_HELD, { clearance_id: action.payload.clearance_id, shipment_id: action.payload.shipment_id, reason: action.payload.hold_reason });
      }
      return updated2;
    }
    case 'DELETE_CUSTOMS': {
      return { ...state, customsClearances: state.customsClearances.filter(c => c.clearance_id !== action.payload) };
    }

    case 'CREATE_ULD': {
      const uld = { ...action.payload, uld_id: generateId('uld'), created_at: new Date().toISOString() };
      return { ...state, ulds: [uld, ...state.ulds] };
    }

    case 'UPDATE_ULD': {
      return { ...state, ulds: state.ulds.map(u => u.uld_id === action.payload.uld_id ? { ...u, ...action.payload } : u) };
    }

    case 'CREATE_MANIFEST': {
      const manifest = { ...action.payload, manifest_id: generateId('mnf'), created_at: new Date().toISOString() };
      return { ...state, flightManifests: [manifest, ...state.flightManifests] };
    }

    case 'UPDATE_MANIFEST': {
      return { ...state, flightManifests: state.flightManifests.map(m => m.manifest_id === action.payload.manifest_id ? { ...m, ...action.payload, updated_at: new Date().toISOString() } : m) };
    }

    case 'CREATE_MANIFEST_LINE_ITEM': {
      const item = { ...action.payload, manifest_line_item_id: generateId('mli'), created_at: new Date().toISOString() };
      return { ...state, manifestLineItems: [item, ...state.manifestLineItems] };
    }

    case 'CREATE_ULD_ALLOCATION': {
      const alloc = { ...action.payload, uld_allocation_id: generateId('ual'), created_at: new Date().toISOString() };
      return { ...state, uldAllocations: [alloc, ...state.uldAllocations] };
    }

    case 'CREATE_DOCUMENT': {
      const doc = {
        ...action.payload,
        document_id: generateId('doc'),
        status: action.payload.status || 'Generated',
        share_token: generateId('stk').replace('stk-', ''),
        signed_at: null,
        signature_data: null,
        signer_name: null,
        created_at: new Date().toISOString(),
      };
      return { ...state, documents: [doc, ...state.documents] };
    }

    case 'UPDATE_DOCUMENT': {
      return { ...state, documents: state.documents.map(d => d.document_id === action.payload.document_id ? { ...d, ...action.payload, updated_at: new Date().toISOString() } : d) };
    }

    case 'SIGN_DOCUMENT': {
      const { document_id, signature_data, signer_name } = action.payload;
      return {
        ...state,
        documents: state.documents.map(d => d.document_id === document_id ? {
          ...d,
          status: 'Signed',
          signature_data,
          signer_name,
          signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } : d),
      };
    }

    case 'CREATE_INVOICE': {
      const inv = {
        ...action.payload,
        invoice_id: generateId('inv'),
        status: action.payload.status || 'Draft',
        share_token: generateId('stk').replace('stk-', ''),
        signed_at: null,
        signature_data: null,
        signer_name: null,
        created_at: new Date().toISOString(),
      };
      return { ...state, invoices: [inv, ...state.invoices] };
    }

    case 'UPDATE_INVOICE': {
      return { ...state, invoices: state.invoices.map(i => i.invoice_id === action.payload.invoice_id ? { ...i, ...action.payload, updated_at: new Date().toISOString() } : i) };
    }

    case 'SIGN_INVOICE': {
      const { invoice_id, signature_data: sigData, signer_name: sigName } = action.payload;
      return {
        ...state,
        invoices: state.invoices.map(i => i.invoice_id === invoice_id ? {
          ...i,
          status: 'Signed',
          signature_data: sigData,
          signer_name: sigName,
          signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } : i),
      };
    }

    case 'ADD_NOTIFICATION': {
      return { ...state, notifications: [action.payload, ...state.notifications].slice(0, 50) };
    }

    case 'ADD_AI_MESSAGE': {
      return { ...state, aiMessages: [...state.aiMessages, action.payload] };
    }

    case 'CLEAR_AI_MESSAGES': {
      return { ...state, aiMessages: [] };
    }

    default:
      return state;
  }
}

// ---------- Provider ----------
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, getInitialState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('crm-erp-state');
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

  // Persist to local storage on change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('crm-erp-state', JSON.stringify(state));
    }
  }, [state, isHydrated]);

  // Helper to find duplicate accounts by fuzzy match
  const findDuplicateAccounts = useCallback((companyName, taxId) => {
    return state.accounts.filter(acc => {
      if (taxId && acc.tax_id === taxId) return true;
      if (fuzzyMatch(acc.legal_name, companyName) > 0.7) return true;
      return false;
    });
  }, [state.accounts]);

  const value = {
    state,
    dispatch,
    findDuplicateAccounts,
    // Convenience getters
    getAccount: (id) => state.accounts.find(a => a.account_id === id),
    getContact: (id) => state.contacts.find(c => c.contact_id === id),
    getOpportunity: (id) => state.opportunities.find(o => o.opportunity_id === id),
    getShipment: (id) => state.shipments.find(s => s.shipment_id === id),
    getAWB: (id) => state.airWaybills.find(a => a.awb_id === id),
    getULD: (id) => state.ulds.find(u => u.uld_id === id),
    getManifest: (id) => state.flightManifests.find(m => m.manifest_id === id),
    getEventsForShipment: (shipmentId) => state.trackingEvents.filter(e => e.shipment_id === shipmentId).sort((a, b) => new Date(a.event_timestamp) - new Date(b.event_timestamp)),
    getEventsForAWB: (awbId) => state.trackingEvents.filter(e => e.awb_id === awbId).sort((a, b) => new Date(a.event_timestamp) - new Date(b.event_timestamp)),
    getClearancesForShipment: (shipmentId) => state.customsClearances.filter(c => c.shipment_id === shipmentId),
    getBookingsForShipment: (shipmentId) => state.bookingRequests.filter(b => b.shipment_id === shipmentId),
    getULDAllocationsForShipment: (shipmentId) => state.uldAllocations.filter(u => u.shipment_id === shipmentId),
    getManifestLineItemsForShipment: (shipmentId) => state.manifestLineItems.filter(m => m.shipment_id === shipmentId),
    getULDTotalAllocatedWeight: (uldId) => state.uldAllocations.filter(a => a.uld_id === uldId).reduce((sum, a) => sum + (a.weight_kg || a.allocated_weight_kg || 0), 0),
    getManifestTotalAllocatedWeight: (manifestId) => {
      const manifest = state.flightManifests.find(m => m.manifest_id === manifestId);
      if (!manifest) return 0;
      const shipmentsOnFlight = new Set();
      
      state.bookingRequests.forEach(bkr => {
         if (bkr.confirmed_flight_number === manifest.flight_number && bkr.status !== 'Cancelled' && bkr.status !== 'Rejected') {
            shipmentsOnFlight.add(bkr.shipment_id);
         }
      });
      
      state.manifestLineItems.forEach(mli => {
         if (mli.manifest_id === manifestId) {
            shipmentsOnFlight.add(mli.shipment_id);
         }
      });
      
      let totalWeight = 0;
      shipmentsOnFlight.forEach(shipmentId => {
         const shipment = state.shipments.find(s => s.shipment_id === shipmentId);
         if (shipment) {
            totalWeight += (shipment.chargeable_weight_kg || shipment.gross_weight_kg || 0);
         }
      });
      
      return totalWeight;
    },
    getHouseAWBs: (mawbId) => state.airWaybills.filter(a => a.parent_mawb_id === mawbId),
    getContactsForAccount: (accountId) => state.contacts.filter(c => c.account_id === accountId),
    getOpportunitiesForAccount: (accountId) => state.opportunities.filter(o => o.account_id === accountId),
    getShipmentsForAccount: (accountId) => state.shipments.filter(s => s.account_id === accountId),
    getDocumentsForShipment: (shipmentId) => state.documents.filter(d => d.shipment_id === shipmentId),
    getInvoicesForShipment: (shipmentId) => state.invoices.filter(i => i.shipment_id === shipmentId),
    getDocumentByToken: (token) => state.documents.find(d => d.share_token === token),
    getInvoiceByToken: (token) => state.invoices.find(i => i.share_token === token),
    // Account-centric relational selectors
    getLeadsForAccount: (accountId) => state.leads.filter(l => l.converted_account_id === accountId),
    getShipmentsForContact: (contactId) => state.shipments.filter(s => s.contact_id === contactId),
    getAWBsForAccount: (accountId) => {
      const shipmentIds = new Set(state.shipments.filter(s => s.account_id === accountId).map(s => s.shipment_id));
      return state.airWaybills.filter(a => shipmentIds.has(a.shipment_id));
    },
    getClearancesForAccount: (accountId) => {
      const shipmentIds = new Set(state.shipments.filter(s => s.account_id === accountId).map(s => s.shipment_id));
      return state.customsClearances.filter(c => shipmentIds.has(c.shipment_id));
    },
    getRelatedDataForShipment: (shipmentId) => ({
      awbs: state.airWaybills.filter(a => a.shipment_id === shipmentId),
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
