'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Plane, Box, Globe, CreditCard, Clock, PlaneTakeoff, ShieldAlert, Sparkles, Download, Share2, Edit2, Activity, Map, Scale, FileCheck, Info, Files } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { formatDate, formatDateTime, formatWeight, formatCurrency, formatAWBNumber } from '@/lib/utils/formatters';
import { LOCATIONS } from '@/lib/data/seedData';
import { getLocationName } from '@/app/crm/leads/page';
import ComprehensiveAWB from '@/components/documents/ComprehensiveAWB';
import styles from './detail.module.css';

export default function AWBDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, dispatch } = useApp();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ ratePerKg: 2.50, handlingFee: 75, docFee: 35 });

  const awb = (state.transportDocuments || []).find(a => a.doc_id === id);

  if (!awb) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.page}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/operations/awb')}>Back to Air Waybills</Button>
          <div className={styles.notFound}>Air Waybill not found</div>
        </div>
      </div>
    );
  }

  const shipment = state.shipments.find(s => s.shipment_id === awb.shipment_id);
  const carrier = state.organizations.find(c => c.org_id === awb.carrier_id);
  const account = shipment ? state.organizations.find(a => a.org_id === shipment.org_id) : null;
  const doc = state.documents.find(d => (d.awb_id === id || d.shipment_id === awb.shipment_id) && d.document_type === 'Comprehensive AWB');

  // Status mapping for premium badges
  const getFwbStatusVariant = (status) => {
    switch (status) {
      case 'Acknowledged (FMA)': return 'success';
      case 'Rejected (FNA)': return 'danger';
      case 'Sent': return 'primary';
      default: return 'neutral';
    }
  };

  const isIssued = !!awb.issued_at;
  const isSent = awb.fwb_status === 'Sent' || awb.fwb_status === 'Acknowledged (FMA)' || awb.status === 'Sent' || awb.status === 'Acknowledged (FMA)';
  const isConfirmed = awb.fwb_status === 'Acknowledged (FMA)' || awb.status === 'Acknowledged (FMA)';

  const originCode = getLocationName(
    awb.origin_airport || awb.origin_location || awb.origin_port || shipment?.origin_airport || shipment?.origin_location || shipment?.origin_port_id || 'DOH'
  );
  const destCode = getLocationName(
    awb.destination_airport || awb.destination_location || awb.destination_port || shipment?.destination_airport || shipment?.destination_location || shipment?.destination_port_id || 'LHR'
  );

  const originLocObj = LOCATIONS[originCode] || Object.values(LOCATIONS).find(l => l.code === originCode || l.name === originCode || l.city === originCode);
  const destLocObj = LOCATIONS[destCode] || Object.values(LOCATIONS).find(l => l.code === destCode || l.name === destCode || l.city === destCode);

  const originName = originLocObj ? `${originLocObj.name}` : 'Origin Port';
  const destName = destLocObj ? `${destLocObj.name}` : 'Destination Port';

  return (
    <div className={styles.pageWrapper} style={{ '--primary': '#6366F1', '--primary-tint': 'rgba(99, 102, 241, 0.1)' }}>
      <div className={styles.page}>
        
        <div style={{ marginBottom: '24px' }}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/operations/awb')}>Air Waybills</Button>
        </div>

        {/* ══════ HERO SECTION ══════ */}
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.heroIcon}>
              <FileText size={40} />
            </div>
            <div>
              <div className={styles.heroTitleRow}>
                <h1 className={styles.heroTitle}>{formatAWBNumber(awb.awb_number || awb.doc_number)}</h1>
                <div className={styles.heroBadges}>
                  <Badge variant={awb.awb_type === 'Master (MAWB)' || awb.doc_type === 'MAWB' ? 'primary' : 'neutral'}>{awb.awb_type || awb.doc_type}</Badge>
                  <Badge variant={getFwbStatusVariant(awb.fwb_status || awb.status)} dot>{awb.fwb_status || awb.status}</Badge>
                </div>
              </div>
              <div className={styles.heroSubtitle}>
                <span><Plane size={16} /> {carrier ? carrier.name || carrier.legal_name : 'Unknown Carrier'}</span>
                {shipment && (
                  <>
                    <span style={{ color: '#CBD5E1' }}>•</span>
                    <span style={{ cursor: 'pointer', color: '#6366F1', fontWeight: 700 }} onClick={() => router.push(`/operations/shipments/${awb.shipment_id}`)}>
                      <Box size={16} /> {shipment.shipment_reference}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className={styles.heroRight}>
            <Button icon={Edit2} variant="secondary">Edit AWB</Button>
          </div>
        </div>

        {/* ══════ SMART GRID LAYOUT ══════ */}
        <div className={styles.layoutGrid}>
          
          {/* Main Content Column */}
          <div>
            {/* Aviation Route Intelligence */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><Map size={18} /> Route Intelligence</h2>
              </div>
              <div className={styles.aviationRoute}>
                <div className={styles.airportNode}>
                  <div className={styles.airportCode}>{originCode}</div>
                  <div className={styles.airportName}>{originName}</div>
                </div>
                <div className={styles.flightPath}>
                  <div className={styles.flightIconWrapper}>
                    <PlaneTakeoff size={24} />
                    {isConfirmed ? (
                      <span className={styles.flightStatus}>Booked</span>
                    ) : (
                      <span className={styles.flightStatus} style={{ color: '#94A3B8', background: '#F1F5F9' }}>Pending</span>
                    )}
                  </div>
                </div>
                <div className={styles.airportNode}>
                  <div className={styles.airportCode}>{destCode}</div>
                  <div className={styles.airportName}>{destName}</div>
                </div>
              </div>
            </div>

            {/* Cargo & Financials */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><CreditCard size={18} /> Cargo & Financials</h2>
              </div>
              <div className={styles.dataGrid}>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}><Scale size={14} /> Weight & Pieces</span>
                  <span className={styles.dataValue}>{formatWeight(awb.chargeable_weight_kg)} / {awb.pieces} Pcs</span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}><CreditCard size={14} /> Total Charges</span>
                  <span className={`${styles.dataValue} ${styles.dataMoney}`}>{formatCurrency(awb.total_charges, awb.currency_code)}</span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>Freight Terms</span>
                  <span className={styles.dataValue}>{awb.freight_terms}</span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>Rate Class</span>
                  <span className={styles.dataValue}>{awb.rate_class}</span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>Declared Value (Carriage)</span>
                  <span className={styles.dataValue}>{formatCurrency(awb.declared_value_for_carriage, awb.currency_code)}</span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>Declared Value (Customs)</span>
                  <span className={styles.dataValue}>{formatCurrency(awb.declared_value_for_customs, awb.currency_code)}</span>
                </div>
              </div>
            </div>

            {/* Document Hub */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><Files size={18} /> Document Center</h2>
              </div>
              
              <div className={styles.docHubCard}>
                <div className={styles.docLeft}>
                  <div className={styles.docIcon}>
                    <FileCheck size={24} />
                  </div>
                  <div>
                    <h3 className={styles.docTitle}>Comprehensive Waybill & Invoice</h3>
                    <div className={styles.docMeta}>
                      <Badge variant={doc ? 'success' : 'neutral'} dot>{doc ? doc.status : 'Draft'}</Badge>
                      <span>{doc ? formatDate(doc.created_at) : 'Not Generated'}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.docActions}>
                  {doc ? (
                    <>
                      <Button variant="ghost" onClick={() => {
                        setEditForm({ ratePerKg: doc.invoice_data?.ratePerKg ?? 2.50, handlingFee: doc.invoice_data?.handlingFee ?? 75, docFee: doc.invoice_data?.docFee ?? 35 });
                        setIsEditModalOpen(true);
                      }}>Edit</Button>
                      <Button variant="secondary" onClick={() => router.push(`/operations/documents/${doc.document_id}`)}>View</Button>
                      <Button onClick={async () => {
                        try {
                          const html2pdf = (await import('html2pdf.js')).default;
                          const element = document.getElementById('hidden-invoice-to-print');
                          if (element) {
                            const opt = { margin: [10, 10, 10, 10], filename: `invoice-${awb.awb_number}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
                            await html2pdf().set(opt).from(element).save();
                          }
                        } catch (error) {}
                      }}>Download PDF</Button>
                    </>
                  ) : (
                    <Button onClick={() => router.push(`/operations/shipments/${awb.shipment_id}`)}>Generate Document</Button>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Right Sidebar Column */}
          <div>
            
            {/* AI Insights */}
            <div className={styles.aiInsightPanel}>
              <div className={styles.aiHeader}>
                <Sparkles size={18} /> AI Operations Assistant
              </div>
              <div className={styles.aiContent}>
                <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>Route {originCode}-{destCode} typically clears customs in 12 hours.</li>
                  {awb.fwb_status !== 'Acknowledged (FMA)' && <li>FWB message needs to be transmitted to {carrier?.code || 'carrier'} to avoid delays.</li>}
                  <li>Chargeable weight aligns perfectly with standard volume ratios.</li>
                </ul>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><Activity size={18} /> Quick Actions</h2>
              </div>
              <div className={styles.actionList}>
                <div className={styles.actionItem}>
                  <PlaneTakeoff size={18} /> Transmit FWB Message
                </div>
                <div className={styles.actionItem}>
                  <Download size={18} /> Download JSON Payload
                </div>
                <div className={styles.actionItem}>
                  <Share2 size={18} /> Share AWB Details
                </div>
                {awb.awb_type === 'Master (MAWB)' && (
                  <div className={styles.actionItem}>
                    <Box size={18} /> Create Attached HAWB
                  </div>
                )}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><Clock size={18} /> AWB Lifecycle</h2>
              </div>
              <div className={styles.timeline}>
                <div className={`${styles.timelineItem} ${styles.completed}`}>
                  <div className={styles.timelineIcon}><FileText size={16} /></div>
                  <div className={styles.timelineContent}>
                    <h4 className={styles.timelineTitle}>AWB Created</h4>
                    <span className={styles.timelineTime}>{awb.created_at ? formatDateTime(awb.created_at) : 'System generated'}</span>
                  </div>
                </div>
                
                <div className={`${styles.timelineItem} ${isIssued ? styles.completed : styles.active}`}>
                  <div className={styles.timelineIcon}>{isIssued ? <ShieldAlert size={16} /> : <div style={{width: 8, height: 8, borderRadius: '50%', background: 'currentColor'}} />}</div>
                  <div className={styles.timelineContent}>
                    <h4 className={styles.timelineTitle}>{isIssued ? 'AWB Issued' : 'Draft Status'}</h4>
                    {isIssued && <span className={styles.timelineTime}>{formatDateTime(awb.issued_at)}</span>}
                  </div>
                </div>

                <div className={`${styles.timelineItem} ${isSent ? styles.completed : (!isIssued ? '' : styles.active)}`}>
                  <div className={styles.timelineIcon}>{isSent ? <PlaneTakeoff size={16} /> : <div style={{width: 8, height: 8, borderRadius: '50%', background: 'currentColor'}} />}</div>
                  <div className={styles.timelineContent}>
                    <h4 className={styles.timelineTitle}>FWB Transmitted</h4>
                    <p className={styles.timelineDesc}>{isSent ? 'Sent to Carrier' : 'Pending transmission'}</p>
                  </div>
                </div>

                <div className={`${styles.timelineItem} ${isConfirmed ? styles.active : ''}`}>
                  <div className={styles.timelineIcon}>{isConfirmed ? <FileCheck size={16} /> : <div style={{width: 8, height: 8, borderRadius: '50%', background: 'currentColor'}} />}</div>
                  <div className={styles.timelineContent}>
                    <h4 className={styles.timelineTitle}>{isConfirmed ? 'Carrier Acknowledged (FMA)' : 'Awaiting FMA'}</h4>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Hidden Invoice for PDF Generation */}
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1 }}>
          <div id="hidden-invoice-to-print" style={{ width: '710px', background: 'white' }}>
            <ComprehensiveAWB awb={awb} shipment={shipment} account={account} signature={doc?.signature_data} doc={doc} />
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
            <Button style={{ background: '#6366F1', borderColor: '#6366F1' }} onClick={() => {
              dispatch({
                type: 'UPDATE_DOCUMENT',
                payload: { document_id: doc.document_id, invoice_data: { ...doc.invoice_data, ...editForm } }
              });
              setIsEditModalOpen(false);
            }}>Save Changes</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Rate Per Kg ($)</label>
            <input type="number" step="0.01" value={editForm.ratePerKg} onChange={e => setEditForm(f => ({...f, ratePerKg: parseFloat(e.target.value)}))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Handling Fee ($)</label>
            <input type="number" value={editForm.handlingFee} onChange={e => setEditForm(f => ({...f, handlingFee: parseFloat(e.target.value)}))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Documentation Fee ($)</label>
            <input type="number" value={editForm.docFee} onChange={e => setEditForm(f => ({...f, docFee: parseFloat(e.target.value)}))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
          </div>
        </div>
      </Modal>

    </div>
  );
}
