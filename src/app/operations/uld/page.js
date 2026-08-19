'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store/AppContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Edit } from 'lucide-react';
import { formatWeight, getStatusColor } from '@/lib/utils/formatters';
import { AIRPORTS, CARRIERS } from '@/lib/data/seedData';
import styles from './uld.module.css';

const ULD_STATUS_ORDER = ['Available', 'Build-Up in Progress', 'Built-Up', 'Loaded', 'In Transit', 'Empty Return', 'Damaged', 'Under Repair'];

const ULD_TYPES = [
  { code: 'AKE', name: 'LD3 Container' },
  { code: 'PMC', name: 'P6P Pallet' },
  { code: 'PAG', name: 'P1P Pallet' },
  { code: 'ALF', name: 'LD6 Container' },
  { code: 'AMP', name: 'LD29 Container' },
  { code: 'RAP', name: 'Cooltainer' }
];

export default function ULDPage() {
  const { state, dispatch, getULDTotalAllocatedWeight } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [newULD, setNewULD] = useState({
    uld_number: '', uld_type: 'AKE', owner_code: '', tare_weight_kg: '', max_gross_weight_kg: '',
    current_location: '', status: 'Available'
  });
  const [showEdit, setShowEdit] = useState(false);
  const [editULD, setEditULD] = useState(null);

  const columns = useMemo(() => {
    return ULD_STATUS_ORDER.map(status => ({
      status,
      ulds: state.ulds.filter(u => u.status === status),
    })).filter(col => col.ulds.length > 0 || ['Available', 'Build-Up in Progress', 'Built-Up'].includes(col.status));
  }, [state.ulds]);

  const handleDragStart = (e, uldId) => {
    e.dataTransfer.setData('text/plain', uldId);
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const uldId = e.dataTransfer.getData('text/plain');
    if (uldId) {
      // Simplified: in real app, would validate weight limits
      // dispatch({ type: 'UPDATE_ULD', payload: { uld_id: uldId, status } });
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleCreate = () => {
    if (!newULD.uld_number.trim() || !newULD.owner_code) return;
    dispatch({ 
      type: 'CREATE_ULD', 
      payload: { 
        ...newULD, 
        tare_weight_kg: Number(newULD.tare_weight_kg) || 0,
        max_gross_weight_kg: Number(newULD.max_gross_weight_kg) || 0,
      } 
    });
    setShowNew(false);
    setNewULD({ uld_number: '', uld_type: 'AKE', owner_code: '', tare_weight_kg: '', max_gross_weight_kg: '', current_location: '', status: 'Available' });
  };

  const handleUpdate = () => {
    if (!editULD) return;
    dispatch({
      type: 'UPDATE_ULD',
      payload: {
        ...editULD,
        tare_weight_kg: Number(editULD.tare_weight_kg) || 0,
        max_gross_weight_kg: Number(editULD.max_gross_weight_kg) || 0,
      }
    });
    setShowEdit(false);
  };

  const statusColors = {
    'Available': '#3DB56D',
    'Build-Up in Progress': '#F5A623',
    'Built-Up': '#5FC7BE',
    'Loaded': '#2E8F86',
    'In Transit': '#3B82F6',
    'Empty Return': '#8A9B9A',
    'Damaged': '#E5484D',
    'Under Repair': '#F5A623',
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>ULD Build-Up Board</h1>
            <p className={styles.subtitle}>{state.ulds.length} ULDs · Drag to change status</p>
          </div>
          <Button icon={Plus} onClick={() => setShowNew(true)}>New ULD</Button>
        </div>

      <div className={styles.board}>
        {columns.map(({ status, ulds }) => (
          <div
            key={status}
            className={styles.column}
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={handleDragOver}
          >
            <div className={styles.columnHeader}>
              <span className={styles.columnDot} style={{ background: statusColors[status] }} />
              <span className={styles.columnTitle}>{status}</span>
              <span className={styles.columnCount}>{ulds.length}</span>
            </div>
            <div className={styles.columnBody}>
              {ulds.map(uld => {
                const allocatedWeight = getULDTotalAllocatedWeight(uld.uld_id);
                const maxWeight = uld.max_gross_weight_kg || 0;
                const tare = uld.tare_weight_kg || 0;
                const maxPayload = Math.max(0, maxWeight - tare);
                const usedPct = maxPayload > 0 ? Math.min(100, Math.round((allocatedWeight / maxPayload) * 100)) : 0;
                const availableWeight = Math.max(0, maxPayload - allocatedWeight);

                return (
                  <div
                    key={uld.uld_id}
                    className={styles.card}
                    draggable
                    onDragStart={(e) => handleDragStart(e, uld.uld_id)}
                  >
                    <div className={styles.cardHeader}>
                      <span className={styles.uldNumber}>{uld.uld_number}</span>
                      <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                        <Badge variant={getStatusColor(uld.status)} size="small">{uld.uld_type}</Badge>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditULD(uld); setShowEdit(true); }}
                          style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-tertiary)'}}
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </div>
                    <div className={styles.cardDetails}>
                      <div className={styles.detailRow}>
                        <span>Owner</span>
                        <span className={styles.ownerCode}>{uld.owner_code}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Location</span>
                        <span className={styles.location}>{uld.current_location}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Max Gross</span>
                        <span className="tabular-nums">{formatWeight(uld.max_gross_weight_kg)}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Tare</span>
                        <span className="tabular-nums">{formatWeight(uld.tare_weight_kg)}</span>
                      </div>
                    </div>
                    <div className={styles.capacityBar}>
                      <div className={styles.capacityFill} style={{ width: `${usedPct}%`, backgroundColor: usedPct > 90 ? 'var(--danger)' : usedPct > 70 ? 'var(--warning)' : 'var(--success)' }} />
                    </div>
                    <div className={styles.capacityLabel} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{usedPct}% Full</span>
                      <span>{formatWeight(availableWeight)} available</span>
                    </div>
                  </div>
                );
              })}
              {ulds.length === 0 && (
                <div className={styles.emptyCol}>Drop ULDs here</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="New ULD"
        subtitle="Register a Unit Load Device in inventory"
        size="medium"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newULD.uld_number.trim() || !newULD.owner_code}>Register ULD</Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">ULD Number *</label>
              <input className="form-input" value={newULD.uld_number} onChange={e => setNewULD(p => ({ ...p, uld_number: e.target.value }))} placeholder="e.g. AKE12345QR" />
            </div>
            <div className="form-group">
              <label className="form-label">ULD Type</label>
              <select className="form-select" value={newULD.uld_type} onChange={e => setNewULD(p => ({ ...p, uld_type: e.target.value }))}>
                {ULD_TYPES.map(t => <option key={t.code} value={t.code}>{t.code} ({t.name})</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Owner Code *</label>
              <select className="form-select" value={newULD.owner_code} onChange={e => setNewULD(p => ({ ...p, owner_code: e.target.value }))}>
                <option value="">Select Carrier...</option>
                {CARRIERS.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Current Location</label>
              <select className="form-select" value={newULD.current_location} onChange={e => setNewULD(p => ({ ...p, current_location: e.target.value }))}>
                <option value="">Select Airport...</option>
                {Object.values(AIRPORTS).map(a => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tare Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" value={newULD.tare_weight_kg} onChange={e => setNewULD(p => ({ ...p, tare_weight_kg: e.target.value }))} placeholder="0.0" />
            </div>
            <div className="form-group">
              <label className="form-label">Max Gross Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" value={newULD.max_gross_weight_kg} onChange={e => setNewULD(p => ({ ...p, max_gross_weight_kg: e.target.value }))} placeholder="0.0" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={newULD.status} onChange={e => setNewULD(p => ({ ...p, status: e.target.value }))}>
              {ULD_STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit ULD"
        subtitle={`Update details for ${editULD?.uld_number}`}
        size="medium"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </>
        }
      >
        {editULD && (
          <div className={styles.form}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">ULD Number *</label>
                <input className="form-input" value={editULD.uld_number} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">ULD Type</label>
                <select className="form-select" value={editULD.uld_type} onChange={e => setEditULD(p => ({ ...p, uld_type: e.target.value }))}>
                  {ULD_TYPES.map(t => <option key={t.code} value={t.code}>{t.code} ({t.name})</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Owner Code *</label>
                <select className="form-select" value={editULD.owner_code} onChange={e => setEditULD(p => ({ ...p, owner_code: e.target.value }))}>
                  {CARRIERS.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Current Location</label>
                <select className="form-select" value={editULD.current_location} onChange={e => setEditULD(p => ({ ...p, current_location: e.target.value }))}>
                  <option value="">Select Airport...</option>
                  {Object.values(AIRPORTS).map(a => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tare Weight (kg)</label>
                <input className="form-input" type="number" step="0.1" value={editULD.tare_weight_kg} onChange={e => setEditULD(p => ({ ...p, tare_weight_kg: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Gross Weight (kg)</label>
                <input className="form-input" type="number" step="0.1" value={editULD.max_gross_weight_kg} onChange={e => setEditULD(p => ({ ...p, max_gross_weight_kg: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={editULD.status} onChange={e => setEditULD(p => ({ ...p, status: e.target.value }))}>
                {ULD_STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </div>
  );
}
