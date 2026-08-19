'use client';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import { Package, MapPin, Hash, Scale, Box, Calendar, ChevronLeft, Building2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { formatWeight, formatDate, getStatusColor } from '@/lib/utils/formatters';

export default function ULDDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state } = useApp();

  const uld = state.ulds.find(u => u.uld_id === id);

  if (!uld) {
    return (
      <div className="ambient-mesh-bg" style={{ minHeight: '100vh', padding: '24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Breadcrumbs items={[{ label: 'ULD Build-Up', href: '/operations/uld' }, { label: 'Not Found' }]} />
          <div style={{ padding: '48px', textAlign: 'center', background: 'rgba(255,255,255,0.5)', borderRadius: '16px', marginTop: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>ULD Not Found</h2>
            <p style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>The requested ULD record could not be found.</p>
            <button onClick={() => router.push('/operations/uld')} style={{ marginTop: '24px', padding: '8px 16px', background: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Back to ULDs</button>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Operations', href: '/operations' },
    { label: 'ULD Build-Up', href: '/operations/uld' },
    { label: uld.uld_number },
  ];

  // Get allocations for this ULD
  const allocations = state.uldAllocations.filter(a => a.uld_id === uld.uld_id);
  const usedWeight = allocations.reduce((sum, a) => sum + (a.allocated_weight_kg || 0), 0);
  const availableWeight = Math.max(0, uld.max_gross_weight_kg - uld.tare_weight_kg - usedWeight);
  const usedPct = uld.max_gross_weight_kg > uld.tare_weight_kg 
    ? Math.round((usedWeight / (uld.max_gross_weight_kg - uld.tare_weight_kg)) * 100) 
    : 0;

  return (
    <div className="ambient-mesh-bg" style={{ minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Breadcrumbs items={breadcrumbItems} />

        {/* ULD Header Card */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(106, 76, 255, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0', color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{uld.uld_number}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-tertiary)', fontSize: '14px', fontWeight: 500 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Hash size={14} /> Type: {uld.uld_type}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={14} /> Owner: {uld.owner_code}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
              <Badge variant={getStatusColor(uld.status)} size="large">{uld.status}</Badge>
            </div>
          </div>

          <div className="grid4" style={{ gap: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} /> Location
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{uld.current_location || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Scale size={12} /> Tare Weight
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{formatWeight(uld.tare_weight_kg)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Scale size={12} /> Max Gross Wgt
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{formatWeight(uld.max_gross_weight_kg)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> Last Movement
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{formatDate(uld.last_movement_date) || '—'}</div>
            </div>
          </div>
          
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Capacity Used: {usedPct}%</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)' }}>{formatWeight(availableWeight)} available</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, usedPct)}%`, height: '100%', backgroundColor: usedPct > 90 ? 'var(--danger)' : usedPct > 70 ? 'var(--warning)' : 'var(--primary)', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </div>

        {/* Cargo Allocations */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Allocated Cargo ({allocations.length})</h2>
          
          {allocations.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 500, background: '#F8FAFC', borderRadius: '12px' }}>
              No cargo allocated to this ULD.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {allocations.map(a => {
                const shipment = state.shipments.find(s => s.shipment_id === a.shipment_id);
                return (
                  <div 
                    key={a.allocation_id} 
                    style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => router.push(`/operations/shipments/${a.shipment_id}`)}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{shipment?.shipment_reference || 'Unknown Shipment'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        {shipment?.origin_airport} → {shipment?.destination_airport}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', textAlign: 'right' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Allocated Pcs</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{a.allocated_pieces}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Allocated Wgt</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{formatWeight(a.allocated_weight_kg)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
