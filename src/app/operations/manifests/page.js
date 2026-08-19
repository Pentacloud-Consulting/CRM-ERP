'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate, getStatusColor, formatWeight } from '@/lib/utils/formatters';
import { Plane, Plus } from 'lucide-react';
import { AIRPORTS, CARRIERS } from '@/lib/data/seedData';
import styles from '../shipments/shipments.module.css';

export default function ManifestsPage() {
  const router = useRouter();
  const { state, dispatch, getManifestTotalAllocatedWeight } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [newManifest, setNewManifest] = useState({
    flight_number: '', flight_date: '', carrier_id: '',
    origin_airport: '', destination_airport: '', status: 'Draft'
  });
  const [showEdit, setShowEdit] = useState(false);
  const [editManifest, setEditManifest] = useState(null);

  const getCarrier = (id) => CARRIERS.find(c => c.id === id);

  const columns = [
    { key: 'flight', label: 'Flight Number', accessor: 'flight_number', render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--primary-hover)' }}>{row.flight_number}</span> },
    { key: 'date', label: 'Flight Date', accessor: 'flight_date', render: (row) => <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{formatDate(row.flight_date)}</span> },
    { key: 'carrier', label: 'Carrier', accessor: row => getCarrier(row.carrier_id)?.code, render: (row) => <span style={{ fontWeight: 600 }}>{getCarrier(row.carrier_id)?.code || '—'}</span> },
    { key: 'route', label: 'Route', accessor: row => `${row.departure_airport}–${row.arrival_airport}`, render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-secondary)' }}>{row.departure_airport}</span>
          <span style={{ color: 'var(--text-quaternary)' }}>→</span>
          <span style={{ color: 'var(--text-primary)' }}>{row.arrival_airport}</span>
        </div>
      )
    },
    { key: 'capacity', label: 'Capacity', accessor: 'max_weight_kg', render: (row) => {
        const allocated = getManifestTotalAllocatedWeight(row.manifest_id);
        const max = row.max_weight_kg || 10000;
        const pct = Math.min(100, Math.round((allocated / max) * 100));
        return (
          <div style={{ width: 120 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 600 }}>
              <span>{pct}%</span>
              <span>{formatWeight(allocated)} / {formatWeight(max)}</span>
            </div>
            <div style={{ height: 4, backgroundColor: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, backgroundColor: pct > 90 ? 'var(--danger)' : pct > 70 ? 'var(--warning)' : 'var(--success)' }} />
            </div>
          </div>
        );
    }},
    { key: 'status', label: 'Status', accessor: 'status', render: (row) => <Badge variant={getStatusColor(row.status)} dot>{row.status}</Badge> },
  ];

  const handleCreate = () => {
    if (!newManifest.flight_number || !newManifest.carrier_id) return;
    dispatch({ 
      type: 'CREATE_MANIFEST', 
      payload: { ...newManifest, max_weight_kg: Number(newManifest.max_weight_kg) || 10000 }
    });
    setShowNew(false);
    setNewManifest({ flight_number: '', flight_date: '', carrier_id: '', departure_airport: '', arrival_airport: '', max_weight_kg: '', status: 'Draft' });
  };

  const handleUpdate = () => {
    if (!editManifest) return;
    dispatch({ 
      type: 'UPDATE_MANIFEST', 
      payload: { ...editManifest, max_weight_kg: Number(editManifest.max_weight_kg) || 10000 }
    });
    setShowEdit(false);
  };

  return (
    <div style={{ maxWidth: 1400, animation: 'fadeInUp var(--transition-slow) ease both' }}>
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plane size={28} color="var(--primary)" />
            Flight Manifests
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
            {state.flightManifests.length} manifests
          </p>
        </div>
        <Button icon={Plus} onClick={() => setShowNew(true)}>New Manifest</Button>
      </div>
      
      <DataTable
        columns={columns}
        data={state.flightManifests}
        onRowClick={(row) => { setEditManifest(row); setShowEdit(true); }}
        searchPlaceholder="Search by flight number, origin, destination..."
        filters={[
          { key: 'status', label: 'Status', options: ['Draft', 'Filed', 'Departed', 'Closed'] },
        ]}
      />

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="New Flight Manifest"
        subtitle="Create a new FFM (Freight Manifest) record"
        size="medium"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newManifest.flight_number || !newManifest.carrier_id}>Create Manifest</Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Flight Number *</label>
              <input className="form-input" value={newManifest.flight_number} onChange={e => setNewManifest(p => ({ ...p, flight_number: e.target.value }))} placeholder="e.g. QR8410" />
            </div>
            <div className="form-group">
              <label className="form-label">Flight Date *</label>
              <input className="form-input" type="date" value={newManifest.flight_date} onChange={e => setNewManifest(p => ({ ...p, flight_date: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Carrier *</label>
            <select className="form-select" value={newManifest.carrier_id} onChange={e => setNewManifest(p => ({ ...p, carrier_id: e.target.value }))}>
              <option value="">Select Carrier...</option>
              {CARRIERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Origin Airport *</label>
              <select className="form-select" value={newManifest.origin_airport} onChange={e => setNewManifest(p => ({ ...p, origin_airport: e.target.value }))}>
                <option value="">Select Airport...</option>
                {Object.values(AIRPORTS).map(a => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Destination Airport *</label>
              <select className="form-select" value={newManifest.destination_airport} onChange={e => setNewManifest(p => ({ ...p, destination_airport: e.target.value }))}>
                <option value="">Select Airport...</option>
                {Object.values(AIRPORTS).map(a => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={newManifest.status} onChange={e => setNewManifest(p => ({ ...p, status: e.target.value }))}>
              {['Draft', 'Filed', 'Departed', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Flight Manifest"
        subtitle={`Update details for ${editManifest?.flight_number}`}
        size="medium"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </>
        }
      >
        {editManifest && (
          <div className={styles.form}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Flight Number *</label>
                <input className="form-input" value={editManifest.flight_number} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Flight Date *</label>
                <input className="form-input" type="date" value={editManifest.flight_date} onChange={e => setEditManifest(p => ({ ...p, flight_date: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Carrier *</label>
              <select className="form-select" value={editManifest.carrier_id} onChange={e => setEditManifest(p => ({ ...p, carrier_id: e.target.value }))}>
                <option value="">Select Carrier...</option>
                {CARRIERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Departure Airport *</label>
                <select className="form-select" value={editManifest.departure_airport} onChange={e => setEditManifest(p => ({ ...p, departure_airport: e.target.value }))}>
                  <option value="">Select Airport...</option>
                  {Object.values(AIRPORTS).map(a => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Arrival Airport *</label>
                <select className="form-select" value={editManifest.arrival_airport} onChange={e => setEditManifest(p => ({ ...p, arrival_airport: e.target.value }))}>
                  <option value="">Select Airport...</option>
                  {Object.values(AIRPORTS).map(a => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Max Capacity (kg)</label>
                <input className="form-input" type="number" step="100" value={editManifest.max_weight_kg} onChange={e => setEditManifest(p => ({ ...p, max_weight_kg: e.target.value }))} placeholder="10000" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={editManifest.status} onChange={e => setEditManifest(p => ({ ...p, status: e.target.value }))}>
                  {['Draft', 'Filed', 'Departed', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
