'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Plane, Box, Globe, CreditCard } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { formatDate, formatWeight, formatCurrency, formatAWBNumber, getStatusColor } from '@/lib/utils/formatters';
import { CARRIERS } from '@/lib/data/seedData';
import ComprehensiveAWB from '@/components/documents/ComprehensiveAWB';
import styles from '../../../crm/leads/[id]/detail.module.css';

export default function AWBDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, dispatch } = useApp();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ ratePerKg: 2.50, handlingFee: 75, docFee: 35 });

  const awb = state.airWaybills.find(a => a.awb_id === id);

  if (!awb) {
    return (
      <div className={styles.page}>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/operations/awb')}>Back to Air Waybills</Button>
        <div className={styles.notFound}>Air Waybill not found</div>
      </div>
    );
  }

  const shipment = state.shipments.find(s => s.shipment_id === awb.shipment_id);
  const carrier = CARRIERS.find(c => c.id === awb.carrier_id);
  const account = shipment ? state.accounts.find(a => a.account_id === shipment.account_id) : null;
  const doc = state.documents.find(d => (d.awb_id === id || d.shipment_id === awb.shipment_id) && d.document_type === 'Comprehensive AWB');

  return (
    <div className={`ambient-mesh-bg`} style={{ minHeight: '100vh', padding: '24px' }}>
      <div className={styles.page} style={{ margin: '0 auto', maxWidth: '800px' }}>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/operations/awb')} style={{ marginBottom: '24px' }}>Back to Air Waybills</Button>
        
        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', borderBottom: '1px solid var(--border-light)', paddingBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
              <FileText size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0', color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{formatAWBNumber(awb.awb_number)}</h1>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '14px', fontWeight: 500 }}>{awb.awb_type} · {carrier ? carrier.name : 'Carrier'}</p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <Badge variant={getStatusColor(awb.fwb_status)} dot>{awb.fwb_status}</Badge>
            </div>
          </div>

          <div className="grid2" style={{ gap: '24px' }}>
            <div className={styles.field}>
              <span className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Box size={14} /> Shipment Ref</span>
              <span className={styles.fieldValue} style={{ fontWeight: 600 }}>{shipment ? shipment.shipment_reference : '—'}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Plane size={14} /> Route</span>
              <span className={styles.fieldValue} style={{ fontWeight: 600, color: 'var(--primary)' }}>{awb.origin_airport} → {awb.destination_airport}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={14} /> Total Charges</span>
              <span className={styles.fieldValue} style={{ fontWeight: 800, fontSize: '16px' }}>{formatCurrency(awb.total_charges, awb.currency_code)}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Weight & Pieces</span>
              <span className={styles.fieldValue}>{formatWeight(awb.chargeable_weight_kg)} · {awb.pieces} Pcs</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Rate Class</span>
              <span className={styles.fieldValue}>{awb.rate_class}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Freight Terms</span>
              <span className={styles.fieldValue}>{awb.freight_terms}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Declared Value (Carriage)</span>
              <span className={styles.fieldValue}>{formatCurrency(awb.declared_value_for_carriage, awb.currency_code)}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Issued At</span>
              <span className={styles.fieldValue}>{awb.issued_at ? formatDate(awb.issued_at) : 'Draft'}</span>
            </div>
          </div>
        </div>

        {/* Document Action Card */}
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>Related Documents</h2>
          
          <div style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: 'var(--radius-xl)', 
            padding: '24px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all var(--transition-fast)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={24} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Comprehensive Waybill & Invoice</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  <Badge variant={getStatusColor(doc ? doc.status : 'Draft')} dot>{doc ? doc.status : 'Draft'}</Badge>
                  <span>{doc ? formatDate(doc.created_at) : 'Not Generated'}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {doc ? (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setEditForm({
                        ratePerKg: doc.invoice_data?.ratePerKg ?? 2.50,
                        handlingFee: doc.invoice_data?.handlingFee ?? 75,
                        docFee: doc.invoice_data?.docFee ?? 35
                      });
                      setIsEditModalOpen(true);
                    }}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Edit Invoice
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => router.push(`/operations/documents/${doc.document_id}`)}
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: 'var(--text-secondary)' }}
                  >
                    View Invoice
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={async () => {
                      try {
                        const html2pdf = (await import('html2pdf.js')).default;
                        const element = document.getElementById('hidden-invoice-to-print');
                        if (element) {
                          const opt = {
                            margin: [10, 10, 10, 10],
                            filename: `invoice-${awb.awb_number}.pdf`,
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2, useCORS: true },
                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                            pagebreak: { mode: ['css', 'legacy'], avoid: 'tr, .avoid-page-break' }
                          };
                          await html2pdf().set(opt).from(element).save();
                        }
                      } catch (error) {
                        console.error('Error generating PDF:', error);
                      }
                    }}
                  >
                    Download PDF
                  </Button>
                </>
              ) : (
                <Button 
                  variant="primary" 
                  onClick={() => router.push(`/operations/shipments/${awb.shipment_id}`)}
                >
                  Generate Invoice
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Hidden Invoice for PDF Generation */}
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1 }}>
          <div id="hidden-invoice-to-print" style={{ width: '710px', background: 'white' }}>
            <ComprehensiveAWB 
              awb={awb} 
              shipment={shipment} 
              account={account} 
              signature={doc?.signature_data} 
              doc={doc}
            />
          </div>
        </div>

      </div>

      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Invoice Amounts"
        subtitle="Modify the charges for this comprehensive invoice"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              dispatch({
                type: 'UPDATE_DOCUMENT',
                payload: {
                  document_id: doc.document_id,
                  invoice_data: { ...doc.invoice_data, ...editForm }
                }
              });
              setIsEditModalOpen(false);
            }}>Save Changes</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Rate Per Kg ($)</label>
            <input 
              type="number" 
              step="0.01"
              value={editForm.ratePerKg} 
              onChange={e => setEditForm(f => ({...f, ratePerKg: parseFloat(e.target.value)}))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Handling Fee ($)</label>
            <input 
              type="number" 
              value={editForm.handlingFee} 
              onChange={e => setEditForm(f => ({...f, handlingFee: parseFloat(e.target.value)}))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Documentation Fee ($)</label>
            <input 
              type="number" 
              value={editForm.docFee} 
              onChange={e => setEditForm(f => ({...f, docFee: parseFloat(e.target.value)}))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}
