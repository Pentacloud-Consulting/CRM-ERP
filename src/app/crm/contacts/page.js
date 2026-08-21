'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Eye, Edit2, Trash2, Mail, Phone, Building2, User, ChevronRight, Contact, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AsyncLocationSelect from '@/components/ui/AsyncLocationSelect';
import { TRANSPORT_MODES, CARGO_TYPES, INCOTERMS, INCOTERM_LABELS, LEAD_SOURCES, LEAD_STATUSES } from '@/lib/data/seedData';
import styles from './contacts.module.css';

const EMPTY_CONTACT = {
  full_name: '', email: '', phone: '', title: '', org_id: '', is_primary: false,
  source: '', status: 'New', transport_mode: 'ROAD', route_type: 'Domestic',
  origin_location: '', destination_location: '', cargo_type: 'General', incoterm: 'CPT',
  est_pieces: '', est_gross_weight_kg: ''
};

export default function ContactsPage() {
  const router = useRouter();
  const { state, dispatch, getOrganization } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  const [newContact, setNewContact] = useState({ ...EMPTY_CONTACT });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [kpiFilter, setKpiFilter] = useState(null);

  // ──────── KPI Data ────────
  const kpis = useMemo(() => {
    const contacts = state.contacts;
    return {
      total: contacts.length,
      primary: contacts.filter(c => c.is_primary).length,
      organizations: new Set(contacts.map(c => c.org_id).filter(Boolean)).size,
      withEmail: contacts.filter(c => !!c.email).length,
      withPhone: contacts.filter(c => !!c.phone).length,
    };
  }, [state.contacts]);

  // ──────── Filtered data for table ────────
  const filteredContacts = useMemo(() => {
    if (!kpiFilter) return state.contacts;
    if (kpiFilter === 'primary') return state.contacts.filter(c => c.is_primary);
    if (kpiFilter === 'withEmail') return state.contacts.filter(c => !!c.email);
    if (kpiFilter === 'withPhone') return state.contacts.filter(c => !!c.phone);
    return state.contacts;
  }, [state.contacts, kpiFilter]);

  // ──────── Helper for shipments ────────
  const getShipmentCount = (contactId) => {
    return state.shipments.filter(s => s.contact_id === contactId).length;
  };

  // ──────── Table Columns ────────
  const columns = [
    { key: 'contact', label: 'Contact', accessor: 'full_name',
      render: (row) => {
        const displayName = row.full_name || [row.first_name, row.last_name].filter(Boolean).join(' ') || 'Unknown';
        return (
          <div className={styles.contactCell}>
            <div className={styles.contactAvatar}>{displayName.substring(0, 2).toUpperCase()}</div>
            <div>
              <div className={styles.contactName}>{displayName}</div>
              {row.is_primary && (
                <div className={styles.contactPrimaryBadge}>Primary Contact</div>
              )}
            </div>
          </div>
        );
      }
    },
    { key: 'email', label: 'Email', accessor: 'email',
      render: (row) => row.email ? (
        <a href={`mailto:${row.email}`} onClick={e => e.stopPropagation()} className={styles.linkText}>
          <Mail size={14} className={styles.iconMuted} /> {row.email}
        </a>
      ) : <span className={styles.emptyText}>—</span>
    },
    { key: 'phone', label: 'Phone', accessor: 'phone',
      render: (row) => row.phone ? (
        <a href={`tel:${row.phone}`} onClick={e => e.stopPropagation()} className={styles.linkText}>
          <Phone size={14} className={styles.iconMuted} /> {row.phone}
        </a>
      ) : <span className={styles.emptyText}>—</span>
    },
    { key: 'title', label: 'Title', accessor: 'title', render: (row) => row.title || <span className={styles.emptyText}>—</span> },
    { key: 'organization', label: 'Organization', accessor: row => getOrganization(row.org_id)?.legal_name || '—', 
      render: (row) => {
        const org = getOrganization(row.org_id);
        if (!org) return <span className={styles.emptyText}>—</span>;
        return (
          <div className={styles.accountCell} onClick={(e) => { e.stopPropagation(); router.push(`/crm/accounts/${org.org_id}`); }}>
            <Building2 size={14} className={styles.accountIcon} /> {org.legal_name}
          </div>
        );
      }
    },
    { key: 'activity', label: 'Activity', accessor: row => getShipmentCount(row.contact_id), align: 'center',
      render: (row) => {
        const count = getShipmentCount(row.contact_id);
        return <div className={styles.shipmentCell}><span>{count}</span> {count === 1 ? 'Shipment' : 'Shipments'}</div>;
      }
    },
    { key: 'actions', label: '', accessor: 'actions', align: 'right',
      render: (row) => (
        <div className={styles.actionButtons}>
          <button className={styles.actionBtn} title="View Details" onClick={(e) => { e.stopPropagation(); router.push(`/crm/contacts/${row.contact_id}`); }}>
            <Eye size={15} />
          </button>
          <button className={styles.actionBtn} title="Edit" onClick={(e) => { 
            e.stopPropagation(); 
            setEditingContactId(row.contact_id);
            setNewContact({ ...EMPTY_CONTACT, ...row, full_name: row.full_name || [row.first_name, row.last_name].filter(Boolean).join(' ') || '' });
            setShowNew(true);
          }}>
            <Edit2 size={15} />
          </button>
          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(row.contact_id); }}>
            <Trash2 size={15} />
          </button>
        </div>
      )
    },
  ];

  // ──────── Handlers ────────
  const handleCreateOrUpdate = () => {
    if (!(newContact.full_name || '').trim() || !newContact.org_id) return;
    
    if (editingContactId) {
      dispatch({ type: 'UPDATE_CONTACT', payload: { ...newContact, contact_id: editingContactId } });
    } else {
      dispatch({ type: 'CREATE_CONTACT', payload: newContact });
    }
    
    closeModal();
  };

  const handleDelete = (contactId) => {
    dispatch({ type: 'DELETE_CONTACT', payload: contactId });
    setShowDeleteConfirm(null);
  };

  const openNewContact = () => {
    setEditingContactId(null);
    setNewContact({ ...EMPTY_CONTACT });
    setShowNew(true);
  };

  const closeModal = () => {
    setShowNew(false);
    setEditingContactId(null);
    setNewContact({ ...EMPTY_CONTACT });
  };

  // ──────── RENDER ────────
  return (
    <div className={styles.pageWrapper} style={{ '--primary': '#8B5CF6', '--primary-tint': 'rgba(139, 92, 246, 0.1)', '--primary-hover': '#7C3AED' }}>
      <div className={styles.page}>

        {/* ══════ HEADER ══════ */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Contacts</h1>
            <p className={styles.subtitle}>Manage customer contacts, accounts and shipment relationships.</p>
          </div>
          <Button icon={Plus} onClick={openNewContact} style={{ background: '#8B5CF6', borderColor: '#8B5CF6' }}>New Contact</Button>
        </div>
        
        {/* ══════ KPI CARDS ══════ */}
        <div className={styles.kpiRow}>
          <div className={styles.kpiCard} onClick={() => setKpiFilter(null)} style={{ borderColor: kpiFilter === null ? '#8B5CF6' : '', cursor: 'pointer' }}>
            <div className={styles.kpiValue}>{kpis.total}</div>
            <div className={styles.kpiLabel}>Total Contacts</div>
          </div>
          <div className={styles.kpiCard} onClick={() => setKpiFilter(kpiFilter === 'primary' ? null : 'primary')} style={{ borderColor: kpiFilter === 'primary' ? '#8B5CF6' : '', cursor: 'pointer' }}>
            <div className={styles.kpiValue}>{kpis.primary}</div>
            <div className={styles.kpiLabel}>Primary Contacts</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>{kpis.organizations}</div>
            <div className={styles.kpiLabel}>Organizations</div>
          </div>
          <div className={styles.kpiCard} onClick={() => setKpiFilter(kpiFilter === 'withEmail' ? null : 'withEmail')} style={{ borderColor: kpiFilter === 'withEmail' ? '#8B5CF6' : '', cursor: 'pointer' }}>
            <div className={styles.kpiValue}>{kpis.withEmail}</div>
            <div className={styles.kpiLabel}>With Email</div>
          </div>
          <div className={styles.kpiCard} onClick={() => setKpiFilter(kpiFilter === 'withPhone' ? null : 'withPhone')} style={{ borderColor: kpiFilter === 'withPhone' ? '#8B5CF6' : '', cursor: 'pointer' }}>
            <div className={styles.kpiValue}>{kpis.withPhone}</div>
            <div className={styles.kpiLabel}>With Phone</div>
          </div>
        </div>

        {/* ══════ TABLE (Desktop) ══════ */}
        {filteredContacts.length > 0 ? (
          <>
            <div className={styles.tableContainer}>
              <DataTable 
                columns={columns} 
                data={filteredContacts} 
                searchPlaceholder="Search contacts by name, email, phone..." 
                onRowClick={(row) => router.push(`/crm/contacts/${row.contact_id}`)}
                filters={[
                  { key: 'is_primary', label: 'Type', options: ['Primary', 'Non-primary'] }
                ]}
              />
            </div>

            {/* ══════ MOBILE CARDS ══════ */}
            <div className={styles.mobileCards}>
              {filteredContacts.map(contact => {
                const org = getOrganization(contact.org_id);
                const shipments = getShipmentCount(contact.contact_id);
                const displayName = contact.full_name || [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown';
                return (
                  <div key={contact.contact_id} className={styles.mobileCard} onClick={() => router.push(`/crm/contacts/${contact.contact_id}`)}>
                    <div className={styles.mobileCardHeader}>
                      <div className={styles.contactAvatar}>{displayName.substring(0, 2).toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div className={styles.contactName} style={{ fontSize: '16px' }}>{displayName}</div>
                          {contact.is_primary && <Badge variant="primary" size="small">Primary</Badge>}
                        </div>
                        {contact.title && <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{contact.title}</div>}
                      </div>
                    </div>
                    
                    <div className={styles.mobileCardBody}>
                      {contact.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0F172A' }}>
                          <Mail size={14} className={styles.iconMuted} /> {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0F172A' }}>
                          <Phone size={14} className={styles.iconMuted} /> {contact.phone}
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.mobileCardFooter}>
                      {org ? (
                        <div className={styles.accountCell} onClick={(e) => { e.stopPropagation(); router.push(`/crm/accounts/${org.org_id}`); }}>
                          <Building2 size={12} className={styles.accountIcon} /> {org.legal_name}
                        </div>
                      ) : <span />}
                      <div className={styles.shipmentCell}><span>{shipments}</span> {shipments === 1 ? 'Shipment' : 'Shipments'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Contact size={28} /></div>
            <h3 className={styles.emptyTitle}>{kpiFilter ? 'No matching contacts' : 'No contacts yet'}</h3>
            <p className={styles.emptyDesc}>
              {kpiFilter ? 'Try adjusting your filters or clear the selection.' : 'Add your first customer contact to start managing account relationships.'}
            </p>
            {!kpiFilter && <Button icon={Plus} onClick={openNewContact} style={{ background: '#8B5CF6', borderColor: '#8B5CF6' }}>Create Contact</Button>}
            {kpiFilter && <Button variant="secondary" onClick={() => setKpiFilter(null)}>Clear Filter</Button>}
          </div>
        )}

      {/* ══════ CREATE / EDIT MODAL ══════ */}
      <Modal
        open={showNew}
        onClose={closeModal}
        title={editingContactId ? "Edit Contact" : "Create New Contact"}
        subtitle={editingContactId ? "Update contact information" : "Add a customer contact to your CRM"}
        size="medium"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleCreateOrUpdate} disabled={!(newContact.full_name || '').trim() || !newContact.org_id} style={{ background: '#8B5CF6', borderColor: '#8B5CF6' }}>
              {editingContactId ? "Save Changes" : "Create Contact"}
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          {/* Personal Information */}
          <div className={styles.formSectionTitle}>Personal Information</div>
          <div className="form-group">
            <label className="form-label">Full Name <span style={{ color: '#f43f5e' }}>*</span></label>
            <input className="form-input" value={newContact.full_name} onChange={e => setNewContact(p => ({ ...p, full_name: e.target.value }))} placeholder="Contact name" />
          </div>
          <div className="form-group">
            <label className="form-label">Job Title</label>
            <input className="form-input" value={newContact.title} onChange={e => setNewContact(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Logistics Manager" />
          </div>

          {/* Contact Information */}
          <div className={styles.formSectionTitle} style={{ marginTop: '12px' }}>Contact Information</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} placeholder="+1 234 567 8900" />
            </div>
          </div>

          {/* Account Relationship */}
          <div className={styles.formSectionTitle} style={{ marginTop: '12px' }}>Organization Relationship</div>
          <div className="form-group">
            <label className="form-label">Organization <span style={{ color: '#f43f5e' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              <select className="form-select" value={newContact.org_id} onChange={e => setNewContact(p => ({ ...p, org_id: e.target.value }))} style={{ paddingLeft: '36px' }}>
                <option value="">Search organizations...</option>
                {state.organizations.map(a => <option key={a.org_id} value={a.org_id}>🏢 {a.legal_name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: '8px', padding: '16px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '14px', marginBottom: '4px' }}>Primary Contact</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>A primary contact is the main point of contact for this account.</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <div style={{ position: 'relative', width: '40px', height: '24px', background: newContact.is_primary ? '#8B5CF6' : '#E2E8F0', borderRadius: '12px', transition: 'background 0.3s' }}>
                  <div style={{ position: 'absolute', top: '2px', left: newContact.is_primary ? '18px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                </div>
                <input 
                  type="checkbox" 
                  checked={newContact.is_primary} 
                  onChange={e => setNewContact(p => ({ ...p, is_primary: e.target.checked }))}
                  style={{ opacity: 0, position: 'absolute' }}
                />
              </label>
            </div>
          </div>

          {/* Lead/Logistics Information */}
          <div className={styles.formSectionTitle} style={{ marginTop: '16px' }}>Logistics Information</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Source</label>
              <select className="form-select" value={newContact.source} onChange={e => setNewContact(p => ({ ...p, source: e.target.value }))}>
                <option value="">Select Source...</option>
                {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={newContact.status} onChange={e => setNewContact(p => ({ ...p, status: e.target.value }))}>
                {LEAD_STATUSES.filter(s => s !== 'Converted').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Transport Mode</label>
              <select className="form-select" value={newContact.transport_mode} onChange={e => setNewContact(p => ({ ...p, transport_mode: e.target.value }))}>
                {TRANSPORT_MODES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Route Type</label>
              <div style={{ height: '42px', display: 'flex', alignItems: 'center', padding: '0 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Badge variant={newContact.route_type === 'Domestic' ? 'neutral' : 'primary'} dot>{newContact.route_type}</Badge>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Origin Location</label>
              <AsyncLocationSelect value={newContact.origin_location} onChange={val => setNewContact(p => ({ ...p, origin_location: val, route_type: (val && newContact.destination_location && JSON.parse(val).country !== JSON.parse(newContact.destination_location).country) ? 'International' : 'Domestic' }))} placeholder="Search origin..." />
            </div>
            <div className="form-group">
              <label className="form-label">Destination Location</label>
              <AsyncLocationSelect value={newContact.destination_location} onChange={val => setNewContact(p => ({ ...p, destination_location: val, route_type: (val && newContact.origin_location && JSON.parse(val).country !== JSON.parse(newContact.origin_location).country) ? 'International' : 'Domestic' }))} placeholder="Search destination..." />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cargo Type</label>
              <select className="form-select" value={newContact.cargo_type} onChange={e => setNewContact(p => ({ ...p, cargo_type: e.target.value }))}>
                {CARGO_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Incoterm</label>
              <select className="form-select" value={newContact.incoterm} onChange={e => setNewContact(p => ({ ...p, incoterm: e.target.value }))}>
                {INCOTERMS.map(i => <option key={i} value={i}>{INCOTERM_LABELS[i]}</option>)}
              </select>
            </div>
          </div>

          {/* Shipment Details */}
          <div className={styles.formSectionTitle} style={{ marginTop: '16px' }}>Shipment Details</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pieces</label>
              <input className="form-input" type="number" value={newContact.est_pieces} onChange={e => setNewContact(p => ({ ...p, est_pieces: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Gross Weight (kg)</label>
              <input className="form-input" type="number" value={newContact.est_gross_weight_kg} onChange={e => setNewContact(p => ({ ...p, est_gross_weight_kg: e.target.value }))} placeholder="0" />
            </div>
          </div>
        </div>
      </Modal>

      {/* ══════ DELETE CONFIRMATION MODAL ══════ */}
      <Modal
        open={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Contact?"
        subtitle="This action cannot be undone."
        size="small"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleDelete(showDeleteConfirm)}>Delete Contact</Button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
          Are you sure you want to delete this contact? Any historical data associated with them will be retained on their respective records, but they will be removed from the account.
        </p>
      </Modal>
      </div>
    </div>
  );
}
