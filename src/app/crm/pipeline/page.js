'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store/AppContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency, getStatusColor } from '@/lib/utils/formatters';
import { OPPORTUNITY_STAGES, CARGO_TYPES, INCOTERMS, INCOTERM_LABELS } from '@/lib/data/seedData';
import AccountLookup from '@/components/ui/AccountLookup';
import ContactLookup from '@/components/ui/ContactLookup';
import styles from './pipeline.module.css';

export default function PipelinePage() {
  const router = useRouter();
  const { state, dispatch, getAccount } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [editingOppId, setEditingOppId] = useState(null);
  const [newOpp, setNewOpp] = useState({
    name: '', account_id: '', primary_contact_id: '', pipeline_value: '', currency_code: 'USD',
    trade_lane: '', cargo_type: 'General', incoterm: 'CPT', est_chargeable_weight_kg: '', stage: 'Qualifying'
  });

  const stageData = useMemo(() => {
    return OPPORTUNITY_STAGES.map(stage => ({
      stage,
      opportunities: state.opportunities.filter(o => o.stage === stage),
      total: state.opportunities.filter(o => o.stage === stage).reduce((s, o) => s + (o.pipeline_value || 0), 0),
    }));
  }, [state.opportunities]);

  const handleDragStart = (e, oppId) => {
    e.dataTransfer.setData('text/plain', oppId);
  };

  const handleDrop = (e, stage) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData('text/plain');
    if (oppId) {
      dispatch({ type: 'UPDATE_OPPORTUNITY_STAGE', payload: { opportunity_id: oppId, stage } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleCreateOrUpdate = () => {
    if (!newOpp.name.trim() || !newOpp.account_id) return;
    
    const payload = { 
      ...newOpp, 
      pipeline_value: Number(newOpp.pipeline_value) || 0,
      est_chargeable_weight_kg: Number(newOpp.est_chargeable_weight_kg) || 0,
      owner_id: 'user-1'
    };

    if (editingOppId) {
      dispatch({ type: 'UPDATE_OPPORTUNITY', payload: { ...payload, opportunity_id: editingOppId } });
    } else {
      dispatch({ type: 'CREATE_OPPORTUNITY', payload });
    }

    setShowNew(false);
    setEditingOppId(null);
    setNewOpp({ name: '', account_id: '', primary_contact_id: '', pipeline_value: '', currency_code: 'USD', trade_lane: '', cargo_type: 'General', incoterm: 'CPT', est_chargeable_weight_kg: '', stage: 'Qualifying' });
  };

  const stageColors = {
    'Qualifying': '#3B82F6',
    'Proposal': '#8B5CF6',
    'Negotiation': '#F5A623',
    'Won': '#3DB56D',
    'Lost': '#E5484D',
  };

  const selectedAccountContacts = useMemo(() => {
    return state.contacts.filter(c => c.account_id === newOpp.account_id);
  }, [newOpp.account_id, state.contacts]);

  return (
    <div className={`ambient-mesh-bg ${styles.pageWrapper}`}>
      <div className={styles.page}>
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.title}>Sales Pipeline</h1>
            <p className={styles.subtitle}>
              {state.opportunities.length} opportunities ·
              Total pipeline: {formatCurrency(state.opportunities.filter(o => !['Won', 'Lost'].includes(o.stage)).reduce((s, o) => s + (o.pipeline_value || 0), 0), 'USD')}
            </p>
          </div>
          <Button icon={Plus} onClick={() => {
            setEditingOppId(null);
            setNewOpp({ name: '', account_id: '', primary_contact_id: '', pipeline_value: '', currency_code: 'USD', trade_lane: '', cargo_type: 'General', incoterm: 'CPT', est_chargeable_weight_kg: '', stage: 'Qualifying' });
            setShowNew(true);
          }}>New Opportunity</Button>
        </div>

      <div className={styles.board}>
        {stageData.map(({ stage, opportunities, total }) => (
          <div
            key={stage}
            className={styles.column}
            onDrop={(e) => handleDrop(e, stage)}
            onDragOver={handleDragOver}
          >
            <div className={styles.columnHeader}>
              <div className={styles.columnTitle}>
                <span className={styles.columnDot} style={{ background: stageColors[stage] }} />
                <span>{stage}</span>
                <span className={styles.columnCount}>{opportunities.length}</span>
              </div>
            </div>

            <div className={styles.columnBody}>
              {opportunities.map(opp => {
                const account = getAccount(opp.account_id);
                return (
                  <div
                    key={opp.opportunity_id}
                    className={styles.card}
                    draggable
                    onDragStart={(e) => handleDragStart(e, opp.opportunity_id)}
                  >
                    <div className={styles.cardName}>{opp.name}</div>
                    <div className={styles.cardAccount}>
                      <AccountLookup accountId={opp.account_id} size="small" />
                      {opp.primary_contact_id && <ContactLookup contactId={opp.primary_contact_id} size="small" />}
                    </div>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardLane}>{opp.trade_lane}</span>
                      <span className={styles.cardValue}>{formatCurrency(opp.pipeline_value, opp.currency_code)}</span>
                    </div>
                    <div className={styles.cardTags}>
                      <Badge variant={getStatusColor(opp.cargo_type === 'Pharma' ? 'info' : opp.cargo_type === 'Perishable' ? 'warning' : opp.cargo_type === 'Dangerous Goods' ? 'danger' : opp.cargo_type === 'Valuable' ? 'warning' : 'neutral')} size="small">
                        {opp.cargo_type}
                      </Badge>
                      <span className={styles.cardIncoterm}>{opp.incoterm}</span>
                    </div>
                    <div className={styles.actionButtons}>
                      <button className={`${styles.actionBtn} hover-scale click-spin`} title="View Details" onClick={(e) => { e.stopPropagation(); router.push(`/crm/pipeline/${opp.opportunity_id}`); }}>
                        <Eye size={14} className="click-spin-inner" />
                      </button>
                      <button className={`${styles.actionBtn} hover-scale click-spin`} title="Edit" onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingOppId(opp.opportunity_id);
                        setNewOpp({ ...opp });
                        setShowNew(true);
                      }}>
                        <Edit2 size={14} className="click-spin-inner" />
                      </button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn} hover-scale click-spin`} title="Delete" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_OPPORTUNITY', payload: opp.opportunity_id }); }}>
                        <Trash2 size={14} className="click-spin-inner" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {opportunities.length === 0 && (
                <div className={styles.emptyColumn}>No opportunities</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={showNew}
        onClose={() => {
          setShowNew(false);
          setEditingOppId(null);
          setNewOpp({ name: '', account_id: '', primary_contact_id: '', pipeline_value: '', currency_code: 'USD', trade_lane: '', cargo_type: 'General', incoterm: 'CPT', est_chargeable_weight_kg: '', stage: 'Qualifying' });
        }}
        title={editingOppId ? "Edit Opportunity" : "New Opportunity"}
        subtitle={editingOppId ? "Update deal details" : "Create a new freight forwarding deal"}
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowNew(false);
              setEditingOppId(null);
              setNewOpp({ name: '', account_id: '', primary_contact_id: '', pipeline_value: '', currency_code: 'USD', trade_lane: '', cargo_type: 'General', incoterm: 'CPT', est_chargeable_weight_kg: '', stage: 'Qualifying' });
            }}>Cancel</Button>
            <Button onClick={handleCreateOrUpdate} disabled={!newOpp.name.trim() || !newOpp.account_id}>{editingOppId ? "Save Changes" : "Create Opportunity"}</Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className="form-group">
            <label className="form-label">Deal Name *</label>
            <input className="form-input" value={newOpp.name} onChange={e => setNewOpp(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Acme Textiles - DOH-FRA" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Account *</label>
              <select className="form-select" value={newOpp.account_id} onChange={e => setNewOpp(p => ({ ...p, account_id: e.target.value, primary_contact_id: '' }))}>
                <option value="">Select Account...</option>
                {state.accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.legal_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Primary Contact</label>
              <select className="form-select" value={newOpp.primary_contact_id} onChange={e => setNewOpp(p => ({ ...p, primary_contact_id: e.target.value }))} disabled={!newOpp.account_id}>
                <option value="">Select Contact...</option>
                {selectedAccountContacts.map(c => <option key={c.contact_id} value={c.contact_id}>{c.full_name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pipeline Value</label>
              <input className="form-input" type="number" value={newOpp.pipeline_value} onChange={e => setNewOpp(p => ({ ...p, pipeline_value: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={newOpp.currency_code} onChange={e => setNewOpp(p => ({ ...p, currency_code: e.target.value }))}>
                {['USD','EUR','GBP','QAR','AED','SGD','JPY','INR','AUD','HKD'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Trade Lane (Origin–Destination)</label>
              <input className="form-input" value={newOpp.trade_lane} onChange={e => setNewOpp(p => ({ ...p, trade_lane: e.target.value }))} placeholder="e.g. DOH–FRA" />
            </div>
            <div className="form-group">
              <label className="form-label">Est. Chargeable Weight (kg)</label>
              <input className="form-input" type="number" value={newOpp.est_chargeable_weight_kg} onChange={e => setNewOpp(p => ({ ...p, est_chargeable_weight_kg: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cargo Type</label>
              <select className="form-select" value={newOpp.cargo_type} onChange={e => setNewOpp(p => ({ ...p, cargo_type: e.target.value }))}>
                {CARGO_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Incoterm</label>
              <select className="form-select" value={newOpp.incoterm} onChange={e => setNewOpp(p => ({ ...p, incoterm: e.target.value }))}>
                {INCOTERMS.map(i => <option key={i} value={i}>{INCOTERM_LABELS[i]}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}
