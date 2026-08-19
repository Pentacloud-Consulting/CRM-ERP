'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from '../leads/leads.module.css';

export default function AccountsPage() {
  const router = useRouter();
  const { state, dispatch, getContactsForAccount, getOpportunitiesForAccount, getShipmentsForAccount } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [newAccount, setNewAccount] = useState({
    legal_name: '', account_tier: 'Standard', tax_id: '',
    country: '', default_currency: 'USD', phone: '', website: '', industry: ''
  });

  const columns = [
    { key: 'name', label: 'Legal Name', accessor: 'legal_name', render: (row) => <span className={styles.companyName}>{row.legal_name}</span> },
    { key: 'tier', label: 'Tier', accessor: 'account_tier', render: (row) => (
      <Badge variant={row.account_tier === 'Enterprise' ? 'primary' : row.account_tier === 'Premium' ? 'warning' : 'neutral'}>{row.account_tier}</Badge>
    )},
    { key: 'country', label: 'Country', accessor: 'country' },
    { key: 'industry', label: 'Industry', accessor: 'industry' },
    { key: 'currency', label: 'Currency', accessor: 'default_currency', width: '80px' },
    { key: 'contacts', label: 'Contacts', accessor: row => getContactsForAccount(row.account_id).length, align: 'right', render: (row) => <span className="tabular-nums">{getContactsForAccount(row.account_id).length}</span> },
    { key: 'opportunities', label: 'Opps', accessor: row => getOpportunitiesForAccount(row.account_id).length, align: 'right', render: (row) => <span className="tabular-nums">{getOpportunitiesForAccount(row.account_id).length}</span> },
    { key: 'shipments', label: 'Shipments', accessor: row => getShipmentsForAccount(row.account_id).length, align: 'right', render: (row) => <span className="tabular-nums">{getShipmentsForAccount(row.account_id).length}</span> },
    { key: 'actions', label: '', accessor: 'actions', align: 'right',
      render: (row) => (
        <div className={styles.actionButtons}>
          <button className={`${styles.actionBtn} hover-scale click-spin`} title="View Details" onClick={(e) => { e.stopPropagation(); router.push(`/crm/accounts/${row.account_id}`); }}>
            <Eye size={16} className="click-spin-inner" />
          </button>
          <button className={`${styles.actionBtn} hover-scale click-spin`} title="Edit" onClick={(e) => { 
            e.stopPropagation(); 
            setEditingAccountId(row.account_id);
            setNewAccount({ ...row });
            setShowNew(true);
          }}>
            <Edit2 size={16} className="click-spin-inner" />
          </button>
          <button className={`${styles.actionBtn} ${styles.deleteBtn} hover-scale click-spin`} title="Delete" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_ACCOUNT', payload: row.account_id }); }}>
            <Trash2 size={16} className="click-spin-inner" />
          </button>
        </div>
      )
    },
  ];

  const handleCreateOrUpdate = () => {
    if (!newAccount.legal_name.trim()) return;
    
    if (editingAccountId) {
      dispatch({ type: 'UPDATE_ACCOUNT', payload: { ...newAccount, account_id: editingAccountId } });
    } else {
      dispatch({ type: 'CREATE_ACCOUNT', payload: newAccount });
    }
    
    setShowNew(false);
    setEditingAccountId(null);
    setNewAccount({
      legal_name: '', account_tier: 'Standard', tax_id: '',
      country: '', default_currency: 'USD', phone: '', website: '', industry: ''
    });
  };

  return (
    <div className={`ambient-mesh-bg ${styles.pageWrapper}`}>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Accounts</h1>
            <p className={styles.subtitle}>{state.accounts.length} accounts</p>
          </div>
          <Button icon={Plus} onClick={() => {
            setEditingAccountId(null);
            setNewAccount({ legal_name: '', account_tier: 'Standard', tax_id: '', country: '', default_currency: 'USD', phone: '', website: '', industry: '' });
            setShowNew(true);
          }}>New Account</Button>
        </div>
        
        <div className={`glass-panel ${styles.tableContainer}`}>
          <DataTable 
            columns={columns} 
            data={state.accounts} 
            searchPlaceholder="Search accounts..." 
            onRowClick={(row) => router.push(`/crm/accounts/${row.account_id}`)}
          />
        </div>

      <Modal
        open={showNew}
        onClose={() => {
          setShowNew(false);
          setEditingAccountId(null);
          setNewAccount({ legal_name: '', account_tier: 'Standard', tax_id: '', country: '', default_currency: 'USD', phone: '', website: '', industry: '' });
        }}
        title={editingAccountId ? "Edit Account" : "New Account"}
        subtitle={editingAccountId ? "Update account details" : "Create a new client or partner account"}
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowNew(false);
              setEditingAccountId(null);
              setNewAccount({ legal_name: '', account_tier: 'Standard', tax_id: '', country: '', default_currency: 'USD', phone: '', website: '', industry: '' });
            }}>Cancel</Button>
            <Button onClick={handleCreateOrUpdate} disabled={!newAccount.legal_name.trim()}>{editingAccountId ? "Save Changes" : "Create Account"}</Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Legal Name *</label>
              <input className="form-input" value={newAccount.legal_name} onChange={e => setNewAccount(p => ({ ...p, legal_name: e.target.value }))} placeholder="Company legal name" />
            </div>
            <div className="form-group">
              <label className="form-label">Account Tier</label>
              <select className="form-select" value={newAccount.account_tier} onChange={e => setNewAccount(p => ({ ...p, account_tier: e.target.value }))}>
                {['Standard', 'Premium', 'Enterprise'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tax ID</label>
              <input className="form-input" value={newAccount.tax_id} onChange={e => setNewAccount(p => ({ ...p, tax_id: e.target.value }))} placeholder="Tax / VAT ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input className="form-input" value={newAccount.country} onChange={e => setNewAccount(p => ({ ...p, country: e.target.value }))} placeholder="e.g. US, DE, QA" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={newAccount.phone} onChange={e => setNewAccount(p => ({ ...p, phone: e.target.value }))} placeholder="Main phone" />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" value={newAccount.website} onChange={e => setNewAccount(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Industry</label>
              <input className="form-input" value={newAccount.industry} onChange={e => setNewAccount(p => ({ ...p, industry: e.target.value }))} placeholder="e.g. Manufacturing" />
            </div>
            <div className="form-group">
              <label className="form-label">Default Currency</label>
              <select className="form-select" value={newAccount.default_currency} onChange={e => setNewAccount(p => ({ ...p, default_currency: e.target.value }))}>
                {['USD','EUR','GBP','QAR','AED','SGD','JPY','INR','AUD','HKD'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}
