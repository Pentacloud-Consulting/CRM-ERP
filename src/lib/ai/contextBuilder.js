/**
 * FreightFlow AI — Relational Context Builder
 * 
 * Aggregates application state into a structured, relational graph context
 * for AI consumption. Maps: Contact → Account → Opportunity → Shipment → Invoice.
 * 
 * Context is tenant-scoped via tenantGuard before reaching the LLM.
 */

import { filterByTenant } from '@/lib/security/tenantGuard';

/**
 * Build full platform context for AI queries.
 * @param {Object} state - Full AppContext state
 * @param {Object} options - Optional filters { accountId, shipmentId, leadId }
 * @returns {Object} Structured AI context
 */
export function buildContext(state, options = {}) {
  const leads = filterByTenant(state.leads || []);
  const contacts = filterByTenant(state.contacts || []);
  const organizations = filterByTenant(state.organizations || []).filter(o => o.org_type !== 'carrier');
  const opportunities = filterByTenant(state.opportunities || []);
  const shipments = filterByTenant(state.shipments || []);
  const bookings = filterByTenant(state.bookingRequests || []);
  const invoices = filterByTenant(state.invoices || []);
  const customs = filterByTenant(state.customsClearances || []);

  return {
    leads: leads.map(l => ({
      id: l.lead_id,
      company: l.company_name,
      name: l.full_name,
      email: l.email,
      phone: l.phone,
      status: l.status,
      source: l.source,
      owner: l.owner_id,
      estimated_value: l.estimated_value,
      transport_mode: l.transport_mode,
      origin: l.origin_location,
      destination: l.destination_location,
      created: l.created_at,
    })),
    contacts: contacts.map(c => ({
      id: c.contact_id,
      name: `${c.first_name} ${c.last_name}`,
      email: c.email,
      phone: c.phone,
      designation: c.designation,
      account_id: c.org_id,
      account_name: organizations.find(o => o.org_id === c.org_id)?.legal_name || 'Unknown',
    })),
    accounts: organizations.map(o => {
      const accountContacts = contacts.filter(c => c.org_id === o.org_id);
      const accountOpportunities = opportunities.filter(op => op.org_id === o.org_id);
      const accountShipments = shipments.filter(s => s.org_id === o.org_id);
      const accountInvoices = invoices.filter(inv => inv.org_id === o.org_id);
      const totalRevenue = accountInvoices.filter(i => i.status !== 'Cancelled').reduce((sum, i) => sum + (i.total_amount || 0), 0);
      return {
        id: o.org_id,
        name: o.legal_name,
        industry: o.industry,
        country: o.address?.country,
        city: o.address?.city,
        contact_count: accountContacts.length,
        primary_contact: accountContacts[0] ? `${accountContacts[0].first_name} ${accountContacts[0].last_name}` : null,
        open_opportunities: accountOpportunities.filter(op => op.status !== 'Closed Won' && op.status !== 'Closed Lost').length,
        won_opportunities: accountOpportunities.filter(op => op.status === 'Closed Won').length,
        active_shipments: accountShipments.filter(s => !['Delivered', 'Cancelled'].includes(s.status)).length,
        total_shipments: accountShipments.length,
        total_revenue: totalRevenue,
        last_activity: o.updated_at || o.created_at,
      };
    }),
    opportunities: opportunities.map(op => ({
      id: op.opp_id,
      name: op.name,
      account_id: op.org_id,
      account_name: organizations.find(o => o.org_id === op.org_id)?.legal_name || 'Unknown',
      status: op.status,
      stage: op.stage,
      value: op.estimated_value,
      probability: op.probability,
      expected_close: op.expected_close_date,
      owner: op.owner_id,
    })),
    shipments: shipments.map(s => ({
      id: s.shipment_id,
      ref: s.tracking_ref,
      account_id: s.org_id,
      account_name: organizations.find(o => o.org_id === s.org_id)?.legal_name || 'Unknown',
      origin: s.origin,
      destination: s.destination,
      status: s.status,
      carrier: s.carrier,
      transport_mode: s.transport_mode,
      cargo_description: s.cargo_description,
      gross_weight: s.gross_weight_kg,
      chargeable_weight: s.chargeable_weight_kg,
      pieces: s.pieces,
      created: s.created_at,
    })),
    invoices: invoices.map(inv => ({
      id: inv.invoice_id,
      number: inv.invoice_number,
      account_id: inv.org_id,
      amount: inv.total_amount,
      currency: inv.currency,
      status: inv.status,
      due_date: inv.due_date,
      issued_date: inv.issued_date,
    })),
    customs: customs.map(c => ({
      id: c.clearance_id,
      shipment_id: c.shipment_id,
      jurisdiction: c.jurisdiction,
      direction: c.direction,
      status: c.status,
      dwell_hours: c.dwell_time_hours,
    })),
    summary: {
      total_leads: leads.length,
      total_contacts: contacts.length,
      total_accounts: organizations.length,
      total_opportunities: opportunities.length,
      total_shipments: shipments.length,
      total_invoices: invoices.length,
    },
  };
}

/**
 * Build context scoped to a specific account.
 */
export function buildAccountContext(state, orgId) {
  const full = buildContext(state);
  const account = full.accounts.find(a => a.id === orgId);
  if (!account) return null;
  return {
    account,
    contacts: full.contacts.filter(c => c.account_id === orgId),
    opportunities: full.opportunities.filter(o => o.account_id === orgId),
    shipments: full.shipments.filter(s => s.account_id === orgId),
    invoices: full.invoices.filter(i => i.account_id === orgId),
    customs: full.customs.filter(c => {
      const shipmentIds = full.shipments.filter(s => s.account_id === orgId).map(s => s.id);
      return shipmentIds.includes(c.shipment_id);
    }),
  };
}
