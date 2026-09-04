/**
 * FreightFlow AI — Multi-Tenant Data Isolation Guard
 * 
 * Ensures every AI context request is strictly scoped to the authenticated
 * tenant's data. Prevents cross-tenant data leakage before any context
 * reaches the LLM or frontend.
 * 
 * For the current MVP (single-tenant), this applies a passthrough but
 * establishes the architectural contract for future multi-tenant SaaS.
 */

const DEFAULT_TENANT_ID = 'tenant-freightflow-001';

/**
 * Get the current tenant ID from session/auth context.
 * In future multi-tenant mode, this reads from JWT claims or session.
 */
export function getCurrentTenantId() {
  // MVP: Single tenant. Future: Extract from auth token.
  return DEFAULT_TENANT_ID;
}

/**
 * Filter an array of records to only include those belonging to the current tenant.
 * Records without a tenant_id are assumed to belong to the current tenant (MVP seed data).
 */
export function filterByTenant(records, tenantId = null) {
  const tid = tenantId || getCurrentTenantId();
  if (!Array.isArray(records)) return [];
  return records.filter(r => !r.tenant_id || r.tenant_id === tid);
}

/**
 * Stamp a new record with the current tenant ID before creation.
 */
export function stampTenant(record) {
  return {
    ...record,
    tenant_id: getCurrentTenantId(),
  };
}

/**
 * Validate that a specific record belongs to the current tenant.
 * Returns true if the record is accessible, false if it's a cross-tenant violation.
 */
export function validateTenantAccess(record) {
  if (!record) return false;
  if (!record.tenant_id) return true; // MVP: no tenant_id means it's legacy seed data
  return record.tenant_id === getCurrentTenantId();
}
