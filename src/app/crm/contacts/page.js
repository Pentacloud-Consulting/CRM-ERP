'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AccountLookup from '@/components/ui/AccountLookup';
import styles from '../leads/leads.module.css';

export default function ContactsPage() {
  const router = useRouter();
  const { state, dispatch, getAccount } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  const [newContact, setNewContact] = useState({
    full_name: '', email: '', phone: '', title: '', account_id: '', is_primary: false
  });

  const columns = [
    { key: 'name', label: 'Name', accessor: 'full_name', render: (row) => <span className={styles.companyName}>{row.full_name}</span> },
    { key: 'email', label: 'Email', accessor: 'email', render: (row) => <span style={{ color: 'var(--text-link)' }}>{row.email}</span> },
    { key: 'phone', label: 'Phone', accessor: 'phone' },
    { key: 'title', label: 'Title', accessor: 'title' },
    { key: 'account', label: 'Account', accessor: row => getAccount(row.account_id)?.legal_name || '—', render: (row) => {
      return <AccountLookup accountId={row.account_id} />;
    }},
    { key: 'primary', label: 'Primary', accessor: 'is_primary', width: '80px', render: (row) => row.is_primary ? <Badge variant="primary">Primary</Badge> : null },
    { key: 'actions', label: '', accessor: 'actions', align: 'right',
      render: (row) => (
        <div className={styles.actionButtons}>
          <button className={`${styles.actionBtn} hover-scale click-spin`} title="View Details" onClick={(e) => { e.stopPropagation(); router.push(`/crm/contacts/${row.contact_id}`); }}>
            <Eye size={16} className="click-spin-inner" />
          </button>
          <button className={`${styles.actionBtn} hover-scale click-spin`} title="Edit" onClick={(e) => { 
            e.stopPropagation(); 
            setEditingContactId(row.contact_id);
            setNewContact({ ...row });
            setShowNew(true);
          }}>
            <Edit2 size={16} className="click-spin-inner" />
          </button>
          <button className={`${styles.actionBtn} ${styles.deleteBtn} hover-scale click-spin`} title="Delete" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_CONTACT', payload: row.contact_id }); }}>
            <Trash2 size={16} className="click-spin-inner" />
          </button>
        </div>
      )
    },
  ];

  const handleCreateOrUpdate = () => {
    if (!newContact.full_name.trim() || !newContact.account_id) return;
    
    if (editingContactId) {
      dispatch({ type: 'UPDATE_CONTACT', payload: { ...newContact, contact_id: editingContactId } });
    } else {
      dispatch({ type: 'CREATE_CONTACT', payload: newContact });
    }
    
    setShowNew(false);
    setEditingContactId(null);
    setNewContact({ full_name: '', email: '', phone: '', title: '', account_id: '', is_primary: false });
  };

  return (
    <div className={`ambient-mesh-bg ${styles.pageWrapper}`}>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Contacts</h1>
            <p className={styles.subtitle}>{state.contacts.length} contacts</p>
          </div>
          <Button icon={Plus} onClick={() => {
            setEditingContactId(null);
            setNewContact({ full_name: '', email: '', phone: '', title: '', account_id: '', is_primary: false });
            setShowNew(true);
          }}>New Contact</Button>
        </div>
        
        <div className={`glass-panel ${styles.tableContainer}`}>
          <DataTable 
            columns={columns} 
            data={state.contacts} 
            searchPlaceholder="Search contacts..." 
            onRowClick={(row) => router.push(`/crm/contacts/${row.contact_id}`)}
          />
        </div>

      <Modal
        open={showNew}
        onClose={() => {
          setShowNew(false);
          setEditingContactId(null);
          setNewContact({ full_name: '', email: '', phone: '', title: '', account_id: '', is_primary: false });
        }}
        title={editingContactId ? "Edit Contact" : "New Contact"}
        subtitle={editingContactId ? "Update contact details" : "Add a new contact to an existing account"}
        size="medium"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowNew(false);
              setEditingContactId(null);
              setNewContact({ full_name: '', email: '', phone: '', title: '', account_id: '', is_primary: false });
            }}>Cancel</Button>
            <Button onClick={handleCreateOrUpdate} disabled={!newContact.full_name.trim() || !newContact.account_id}>{editingContactId ? "Save Changes" : "Create Contact"}</Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={newContact.full_name} onChange={e => setNewContact(p => ({ ...p, full_name: e.target.value }))} placeholder="Contact name" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Job Title</label>
              <input className="form-input" value={newContact.title} onChange={e => setNewContact(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Logistics Manager" />
            </div>
            <div className="form-group">
              <label className="form-label">Account *</label>
              <select className="form-select" value={newContact.account_id} onChange={e => setNewContact(p => ({ ...p, account_id: e.target.value }))}>
                <option value="">Select Account...</option>
                {state.accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.legal_name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <input 
              type="checkbox" 
              id="is_primary"
              checked={newContact.is_primary} 
              onChange={e => setNewContact(p => ({ ...p, is_primary: e.target.checked }))} 
            />
            <label htmlFor="is_primary" className="form-label" style={{ marginBottom: 0 }}>Make Primary</label>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}
