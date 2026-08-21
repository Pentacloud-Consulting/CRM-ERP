'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Eye, Edit2, Trash2, Building2, Users, Briefcase, Package, DollarSign, Activity, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/formatters';
import AsyncLocationSelect from '@/components/ui/AsyncLocationSelect';
import { TRANSPORT_MODES, CARGO_TYPES, INCOTERMS, INCOTERM_LABELS, LEAD_SOURCES, LEAD_STATUSES } from '@/lib/data/seedData';
import styles from './accounts.module.css';

const EMPTY_ACCOUNT = {
  legal_name: '', account_tier: 'Standard', tax_id: '',
  country: '', default_currency: 'USD', phone: '', website: '', industry: '', org_type: 'Customer',
  source: '', status: 'New', transport_mode: 'ROAD', route_type: 'Domestic',
  origin_location: '', destination_location: '', cargo_type: 'General', incoterm: 'CPT',
  est_pieces: '', est_gross_weight_kg: ''
};

export default function AccountsPage() {
  const router = useRouter();
  const { state, dispatch, getContactsForOrg, getOpportunitiesForOrg, getShipmentsForOrg } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [newAccount, setNewAccount] = useState({ ...EMPTY_ACCOUNT });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // ──────── Filter Accounts ────────
  const customerAccounts = useMemo(() => {
    return state.organizations.filter(org => org.org_type === 'Customer');
  }, [state.organizations]);

  // ──────── KPI Data ────────
  const kpis = useMemo(() => {
    let totalRevenue = 0;
    let activeAccounts = 0;
    let totalContacts = 0;
    let totalOpps = 0;
    let totalShipments = 0;

    customerAccounts.forEach(acc => {
      const contacts = getContactsForOrg(acc.org_id);
      const opps = getOpportunitiesForOrg(acc.org_id);
      const shipments = getShipmentsForOrg(acc.org_id);
      
      totalContacts += contacts.length;
      totalOpps += opps.length;
      totalShipments += shipments.length;

      if (shipments.length > 0 || opps.length > 0) {
        activeAccounts++;
      }

      opps.forEach(o => {
        if (o.status !== 'Closed Lost') {
          totalRevenue += parseFloat(o.expected_revenue || 0);
        }
      });
    });

    return {
      total: customerAccounts.length,
      active: activeAccounts,
      contacts: totalContacts,
      opps: totalOpps,
      shipments: totalShipments,
      revenue: totalRevenue
    };
  }, [customerAccounts, getContactsForOrg, getOpportunitiesForOrg, getShipmentsForOrg]);

  // ──────── Table Columns ────────
  const columns = [
    { key: 'account', label: 'Account', accessor: 'legal_name',
      render: (row) => (
        <div className={styles.accountCell}>
          <div className={styles.accountAvatar}>{(row.legal_name || '?').substring(0, 2).toUpperCase()}</div>
          <div>
            <div className={styles.accountName}>{row.legal_name}</div>
            <div className={styles.accountIndustry}>{row.industry || 'No Industry'} • {row.country || 'Global'}</div>
          </div>
        </div>
      )
    },
    { key: 'tier', label: 'Tier', accessor: 'account_tier',
      render: (row) => {
        const colors = {
          'Enterprise': { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE', dot: '#8B5CF6' },
          'Premium': { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
          'Standard': { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', dot: '#94A3B8' }
        };
        const c = colors[row.account_tier] || colors['Standard'];
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '12px', fontSize: '12px', fontWeight: 700, color: c.text }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.dot }} />
            {row.account_tier}
          </div>
        );
      }
    },
    { key: 'contacts', label: 'Contacts', accessor: row => getContactsForOrg(row.org_id).length, align: 'center',
      render: (row) => {
        const count = getContactsForOrg(row.org_id).length;
        return <div className={styles.statsCell} title="Contacts"><Users size={14} className={styles.statsIcon} /> <span>{count}</span></div>;
      }
    },
    { key: 'opportunities', label: 'Opportunities', accessor: row => getOpportunitiesForOrg(row.org_id).length, align: 'center',
      render: (row) => {
        const count = getOpportunitiesForOrg(row.org_id).length;
        return <div className={styles.statsCell} title="Opportunities"><Briefcase size={14} className={styles.statsIcon} /> <span>{count}</span></div>;
      }
    },
    { key: 'shipments', label: 'Shipments', accessor: row => getShipmentsForOrg(row.org_id).length, align: 'center',
      render: (row) => {
        const count = getShipmentsForOrg(row.org_id).length;
        return <div className={styles.statsCell} title="Shipments"><Package size={14} className={styles.statsIcon} /> <span>{count}</span></div>;
      }
    },
    { key: 'currency', label: 'Currency', accessor: 'default_currency', align: 'center',
      render: (row) => <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)' }}>{row.default_currency}</span>
    },
    { key: 'actions', label: '', accessor: 'actions', align: 'right',
      render: (row) => (
        <div className={styles.actionButtons}>
          <button className={styles.actionBtn} title="View Details" onClick={(e) => { e.stopPropagation(); router.push(`/crm/accounts/${row.org_id}`); }}>
            <Eye size={16} />
          </button>
          <button className={styles.actionBtn} title="Edit" onClick={(e) => { 
            e.stopPropagation(); 
            setEditingAccountId(row.org_id);
            setNewAccount({ ...EMPTY_ACCOUNT, ...row });
            setShowNew(true);
          }}>
            <Edit2 size={16} />
          </button>
          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete" onClick={(e) => { 
            e.stopPropagation(); 
            setShowDeleteConfirm(row.org_id);
            setDeleteError(null);
          }}>
            <Trash2 size={16} />
          </button>
        </div>
      )
    },
  ];

  // ──────── Handlers ────────
  const handleCreateOrUpdate = () => {
    if (!newAccount.legal_name.trim()) return;
    
    if (editingAccountId) {
      dispatch({ type: 'UPDATE_ORGANIZATION', payload: { ...newAccount, org_id: editingAccountId } });
    } else {
      dispatch({ type: 'CREATE_ORGANIZATION', payload: { ...newAccount, org_type: newAccount.org_type || 'Customer' } });
    }
    
    closeModal();
  };

  const handleDelete = () => {
    if (!showDeleteConfirm) return;
    
    // Relational check
    const contacts = getContactsForOrg(showDeleteConfirm).length;
    const opps = getOpportunitiesForOrg(showDeleteConfirm).length;
    const shipments = getShipmentsForOrg(showDeleteConfirm).length;

    if (contacts > 0 || opps > 0 || shipments > 0) {
      setDeleteError(`Cannot delete account. It has ${contacts} contacts, ${opps} opportunities, and ${shipments} shipments associated with it.`);
      return;
    }

    dispatch({ type: 'DELETE_ORGANIZATION', payload: showDeleteConfirm });
    setShowDeleteConfirm(null);
    setDeleteError(null);
  };

  const openNewAccount = () => {
    setEditingAccountId(null);
    setNewAccount({ ...EMPTY_ACCOUNT });
    setShowNew(true);
  };

  const closeModal = () => {
    setShowNew(false);
    setEditingAccountId(null);
    setNewAccount({ ...EMPTY_ACCOUNT });
  };

  // ──────── RENDER ────────
  return (
    <div className={styles.pageWrapper} style={{ '--primary': '#14B8A6', '--primary-tint': 'rgba(20, 184, 166, 0.1)', '--primary-hover': '#0F766E' }}>
      <div className={styles.page}>

        {/* ══════ HEADER ══════ */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Accounts</h1>
            <p className={styles.subtitle}>Manage customer organizations, contacts, opportunities and shipment relationships.</p>
          </div>
          <Button icon={Plus} onClick={openNewAccount} style={{ background: '#14B8A6', borderColor: '#14B8A6' }}>New Account</Button>
        </div>
        
        {/* ══════ KPI CARDS ══════ */}
        <div className={styles.kpiRow}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>{kpis.total}</div>
            <div className={styles.kpiLabel}>Total Accounts</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>{kpis.active}</div>
            <div className={styles.kpiLabel}>Active Accounts</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>{kpis.contacts}</div>
            <div className={styles.kpiLabel}>Contacts</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>{kpis.opps}</div>
            <div className={styles.kpiLabel}>Opportunities</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>{kpis.shipments}</div>
            <div className={styles.kpiLabel}>Shipments</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiValue} ${styles.kpiValueSmall}`}>{formatCurrency(kpis.revenue, 'USD')}</div>
            <div className={styles.kpiLabel}>Revenue Pipeline</div>
          </div>
        </div>

        {/* ══════ TABLE ══════ */}
        {customerAccounts.length > 0 ? (
          <>
            <div className={styles.tableContainer}>
              <DataTable 
                columns={columns} 
                data={customerAccounts} 
                searchPlaceholder="Search accounts by name, industry, country..." 
                onRowClick={(row) => router.push(`/crm/accounts/${row.org_id}`)}
              />
            </div>

            {/* ══════ MOBILE CARDS ══════ */}
            <div className={styles.mobileCards}>
              {customerAccounts.map(acc => {
                const contacts = getContactsForOrg(acc.org_id).length;
                const opps = getOpportunitiesForOrg(acc.org_id).length;
                const shipments = getShipmentsForOrg(acc.org_id).length;

                return (
                  <div key={acc.org_id} className={styles.mobileCard} onClick={() => router.push(`/crm/accounts/${acc.org_id}`)}>
                    <div className={styles.mobileCardHeader}>
                      <div className={styles.mobileCardIdentity}>
                        <div className={styles.accountAvatar}>{(acc.legal_name || '?').substring(0, 2).toUpperCase()}</div>
                        <div>
                          <div className={styles.accountName}>{acc.legal_name}</div>
                          <div className={styles.accountIndustry}>{acc.industry || 'No Industry'} • {acc.country || 'Global'}</div>
                        </div>
                      </div>
                      <Badge variant={acc.account_tier === 'Enterprise' ? 'primary' : acc.account_tier === 'Premium' ? 'warning' : 'neutral'} size="small">{acc.account_tier}</Badge>
                    </div>
                    
                    <div className={styles.mobileCardStats}>
                      <div className={styles.mobileStat}>
                        <div className={styles.mobileStatValue}>{contacts}</div>
                        <div className={styles.mobileStatLabel}>Contacts</div>
                      </div>
                      <div className={styles.mobileStat}>
                        <div className={styles.mobileStatValue}>{opps}</div>
                        <div className={styles.mobileStatLabel}>Opps</div>
                      </div>
                      <div className={styles.mobileStat}>
                        <div className={styles.mobileStatValue}>{shipments}</div>
                        <div className={styles.mobileStatLabel}>Shipments</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Building2 size={32} /></div>
            <h3 className={styles.emptyTitle}>No Accounts Yet</h3>
            <p className={styles.emptyDesc}>
              Start managing your customer organizations and shipment relationships.
            </p>
            <Button icon={Plus} onClick={openNewAccount} style={{ background: '#14B8A6', borderColor: '#14B8A6' }}>Create Account</Button>
          </div>
        )}

      {/* ══════ CREATE / EDIT MODAL ══════ */}
      <Modal
        open={showNew}
        onClose={closeModal}
        title={editingAccountId ? "Edit Account" : "Create New Account"}
        subtitle={editingAccountId ? "Update account details" : "Add a customer organization to your CRM"}
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleCreateOrUpdate} disabled={!newAccount.legal_name.trim()} style={{ background: '#14B8A6', borderColor: '#14B8A6' }}>
              {editingAccountId ? "Save Changes" : "Create Account"}
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          {/* Company Information */}
          <div className={styles.formSectionTitle}>Company Information</div>
          <div className="form-group">
            <label className="form-label">Legal Name <span style={{ color: '#f43f5e' }}>*</span></label>
            <input className="form-input" value={newAccount.legal_name} onChange={e => setNewAccount(p => ({ ...p, legal_name: e.target.value }))} placeholder="Company legal name" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Industry</label>
              <input className="form-input" value={newAccount.industry} onChange={e => setNewAccount(p => ({ ...p, industry: e.target.value }))} placeholder="e.g. Manufacturing, Tech" />
            </div>
            <div className="form-group">
              <label className="form-label">Tax ID</label>
              <input className="form-input" value={newAccount.tax_id} onChange={e => setNewAccount(p => ({ ...p, tax_id: e.target.value }))} placeholder="Tax / VAT ID" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Organization Type</label>
              <select className="form-select" value={newAccount.org_type} onChange={e => setNewAccount(p => ({ ...p, org_type: e.target.value }))}>
                <option value="Customer">Customer</option>
                <option value="Carrier">Carrier</option>
                <option value="Vendor">Vendor</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={newAccount.phone} onChange={e => setNewAccount(p => ({ ...p, phone: e.target.value }))} placeholder="Main phone" />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" value={newAccount.website} onChange={e => setNewAccount(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
            </div>
          </div>

          {/* Business Information */}
          <div className={styles.formSectionTitle} style={{ marginTop: '16px' }}>Business Information</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Country</label>
              <input className="form-input" value={newAccount.country} onChange={e => setNewAccount(p => ({ ...p, country: e.target.value }))} placeholder="e.g. US, DE, QA" />
            </div>
            <div className="form-group">
              <label className="form-label">Default Currency</label>
              <select className="form-select" value={newAccount.default_currency} onChange={e => setNewAccount(p => ({ ...p, default_currency: e.target.value }))}>
                {['USD','EUR','GBP','QAR','AED','SGD','JPY','INR','AUD','HKD'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Account Tier</label>
              <select className="form-select" value={newAccount.account_tier} onChange={e => setNewAccount(p => ({ ...p, account_tier: e.target.value }))}>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Lead/Logistics Information */}
          <div className={styles.formSectionTitle} style={{ marginTop: '16px' }}>Logistics Information</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Source</label>
              <select className="form-select" value={newAccount.source} onChange={e => setNewAccount(p => ({ ...p, source: e.target.value }))}>
                <option value="">Select Source...</option>
                {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={newAccount.status} onChange={e => setNewAccount(p => ({ ...p, status: e.target.value }))}>
                {LEAD_STATUSES.filter(s => s !== 'Converted').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Transport Mode</label>
              <select className="form-select" value={newAccount.transport_mode} onChange={e => setNewAccount(p => ({ ...p, transport_mode: e.target.value }))}>
                {TRANSPORT_MODES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Route Type</label>
              <div style={{ height: '42px', display: 'flex', alignItems: 'center', padding: '0 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Badge variant={newAccount.route_type === 'Domestic' ? 'neutral' : 'primary'} dot>{newAccount.route_type}</Badge>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Origin Location</label>
              <AsyncLocationSelect value={newAccount.origin_location} onChange={val => setNewAccount(p => ({ ...p, origin_location: val, route_type: (val && newAccount.destination_location && JSON.parse(val).country !== JSON.parse(newAccount.destination_location).country) ? 'International' : 'Domestic' }))} placeholder="Search origin..." />
            </div>
            <div className="form-group">
              <label className="form-label">Destination Location</label>
              <AsyncLocationSelect value={newAccount.destination_location} onChange={val => setNewAccount(p => ({ ...p, destination_location: val, route_type: (val && newAccount.origin_location && JSON.parse(val).country !== JSON.parse(newAccount.origin_location).country) ? 'International' : 'Domestic' }))} placeholder="Search destination..." />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cargo Type</label>
              <select className="form-select" value={newAccount.cargo_type} onChange={e => setNewAccount(p => ({ ...p, cargo_type: e.target.value }))}>
                {CARGO_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Incoterm</label>
              <select className="form-select" value={newAccount.incoterm} onChange={e => setNewAccount(p => ({ ...p, incoterm: e.target.value }))}>
                {INCOTERMS.map(i => <option key={i} value={i}>{INCOTERM_LABELS[i]}</option>)}
              </select>
            </div>
          </div>

          {/* Shipment Details */}
          <div className={styles.formSectionTitle} style={{ marginTop: '16px' }}>Shipment Details</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pieces</label>
              <input className="form-input" type="number" value={newAccount.est_pieces} onChange={e => setNewAccount(p => ({ ...p, est_pieces: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Gross Weight (kg)</label>
              <input className="form-input" type="number" value={newAccount.est_gross_weight_kg} onChange={e => setNewAccount(p => ({ ...p, est_gross_weight_kg: e.target.value }))} placeholder="0" />
            </div>
          </div>
        </div>
      </Modal>

      {/* ══════ DELETE CONFIRMATION MODAL ══════ */}
      <Modal
        open={!!showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(null); setDeleteError(null); }}
        title="Delete Account?"
        subtitle="This action cannot be undone."
        size="small"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowDeleteConfirm(null); setDeleteError(null); }}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={!!deleteError}>Delete Account</Button>
          </>
        }
      >
        <div style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
          {deleteError ? (
            <div style={{ padding: '16px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', color: '#991B1B' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Deletion Prevented</div>
              {deleteError}
            </div>
          ) : (
            <p>Are you sure you want to delete this account? All associated data not constrained by relational dependencies will be removed.</p>
          )}
        </div>
      </Modal>
      </div>
    </div>
  );
}
