/**
 * FreightFlow AI — Account Summary Feature Prompt
 * 
 * Generates executive-level account summaries combining relationship health,
 * revenue trajectory, operational status, and recommended next actions.
 */

/**
 * Build a prompt for generating an account executive summary.
 * @param {Object} accountContext - Output from buildAccountContext()
 * @returns {string} Formatted prompt for the LLM
 */
export function buildAccountSummaryPrompt(accountContext) {
  if (!accountContext || !accountContext.account) {
    return 'No account data available. Please provide a valid account context.';
  }

  const { account, contacts, opportunities, shipments, invoices } = accountContext;

  const paidInvoices = invoices.filter(i => i.status === 'Paid');
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue');
  const openOpportunities = opportunities.filter(o => o.status !== 'Closed Won' && o.status !== 'Closed Lost');

  return `Generate a concise executive summary for the following account. Include: relationship overview, key metrics, risk assessment, and 3 recommended next actions.

## Account Context

**Account Name:** ${account.name}
**Industry:** ${account.industry || 'Not specified'}
**Location:** ${account.city || 'Unknown'}, ${account.country || 'Unknown'}
**Total Revenue (YTD):** $${(account.total_revenue || 0).toLocaleString()}

### Contacts (${contacts.length})
${contacts.length > 0 ? contacts.map(c => `- ${c.name} — ${c.designation || 'No title'} (${c.email || 'No email'})`).join('\n') : '- No contacts on file'}

### Opportunities (${opportunities.length} total, ${openOpportunities.length} open)
${opportunities.length > 0 ? opportunities.map(o => `- ${o.name} — Stage: ${o.stage || o.status} | Value: $${(o.value || 0).toLocaleString()}`).join('\n') : '- No opportunities'}

### Shipments (${shipments.length} total, ${account.active_shipments} active)
${shipments.length > 0 ? shipments.map(s => `- ${s.ref || s.id} — ${s.origin} → ${s.destination} | Status: ${s.status} | ${s.transport_mode || 'AIR'}`).join('\n') : '- No shipments'}

### Invoices (${invoices.length} total)
- Paid: ${paidInvoices.length}
- Overdue: ${overdueInvoices.length}
${overdueInvoices.length > 0 ? overdueInvoices.map(i => `- ⚠ ${i.number} — $${(i.amount || 0).toLocaleString()} OVERDUE`).join('\n') : ''}

Please provide the executive summary in markdown format with clear sections.`;
}
