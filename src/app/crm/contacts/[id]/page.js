'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mail, Phone, Building2, User, FileText, Shield, Ship, ChevronRight } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Badge from '@/components/ui/Badge';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { formatDate, formatWeight, formatCurrency, getStatusColor, formatAWBNumber } from '@/lib/utils/formatters';
import { CARRIERS } from '@/lib/data/seedData';
import styles from '../../leads/[id]/detail.module.css';
import lk from '@/components/ui/lookup.module.css';

export default function ContactDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, getAccount, getShipmentsForContact, getRelatedDataForShipment } = useApp();
  const [expandedShipment, setExpandedShipment] = useState(null);

  const contact = state.contacts.find(c => c.contact_id === id);

  if (!contact) {
    return (
      <div className={`ambient-mesh-bg`} style={{ minHeight: '100vh', padding: '24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Breadcrumbs items={[{ label: 'Contacts', href: '/crm/contacts' }, { label: 'Not Found' }]} />
          <div className={styles.notFound}>Contact not found</div>
        </div>
      </div>
    );
  }

  const account = getAccount(contact.account_id);
  // Get shipments specifically assigned to this contact
  const shipments = getShipmentsForContact(contact.contact_id);

  // Always resolve full breadcrumb from data (fix #4)
  const breadcrumbItems = [
    { label: 'Accounts', href: '/crm/accounts' },
    ...(account ? [{ label: account.legal_name, href: `/crm/accounts/${account.account_id}` }] : []),
    { label: contact.full_name },
  ];

  const toggleShipment = (shipmentId) => {
    setExpandedShipment(expandedShipment === shipmentId ? null : shipmentId);
  };

  return (
    <div className={`ambient-mesh-bg`} style={{ minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Breadcrumbs items={breadcrumbItems} />

        {/* Contact Header */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
              {contact.full_name?.charAt(0) || <User size={28} />}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0', color: '#0F172A' }}>{contact.full_name}</h1>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '14px', fontWeight: 500 }}>{contact.title || 'Contact'}</p>
            </div>
            {contact.is_primary && (
              <Badge variant="primary">Primary Contact</Badge>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className={styles.field}>
              <span className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> Email</span>
              <span className={styles.fieldValue} style={{ color: 'var(--primary)' }}>{contact.email || '—'}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> Phone</span>
              <span className={styles.fieldValue}>{contact.phone || '—'}</span>
            </div>
          </div>
        </div>

        {/* Parent Account Summary Card */}
        {account && (
          <div
            className={lk.accountSummaryCard}
            onClick={() => router.push(`/crm/accounts/${account.account_id}`)}
          >
            <div className={lk.accountSummaryIcon}>
              <Building2 size={20} />
            </div>
            <div className={lk.accountSummaryInfo}>
              <div className={lk.accountSummaryName}>{account.legal_name}</div>
              <div className={lk.accountSummaryMeta}>{account.industry || 'Account'} · {account.country || ''} · {account.default_currency || ''}</div>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        )}

        {/* Related Shipments (for this Contact) */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Contact's Shipments</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '0 0 20px' }}>
            All shipments assigned specifically to {contact.full_name}. Expand to see AWBs, customs, bookings, and tracking.
          </p>

          {shipments.length === 0 ? (
            <div className={lk.emptyState}>No shipments assigned specifically to this contact yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {shipments.map(s => {
                const isExpanded = expandedShipment === s.shipment_id;
                const related = isExpanded ? getRelatedDataForShipment(s.shipment_id) : null;

                return (
                  <div key={s.shipment_id} className={lk.accordion}>
                    <button className={lk.accordionHeader} onClick={() => toggleShipment(s.shipment_id)}>
                      <span className={`${lk.accordionChevron} ${isExpanded ? lk.accordionChevronOpen : ''}`}>
                        <ChevronRight size={16} />
                      </span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div 
                          style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)', fontFamily: 'var(--font-mono)', textDecoration: 'underline', cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); router.push(`/operations/shipments/${s.shipment_id}`); }}
                        >
                          {s.shipment_reference}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          {s.origin_airport} → {s.destination_airport} · {s.pieces} pcs · {formatWeight(s.gross_weight_kg)}
                        </div>
                      </div>
                      <Badge variant={getStatusColor(s.status)} size="small" dot>{s.status}</Badge>
                    </button>

                    {isExpanded && related && (
                      <div className={lk.accordionBody}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', alignItems: 'start' }}>
                          {/* 1. AWBs */}
                          <div className={lk.relatedSection} style={{ marginBottom: 0 }}>
                            <div className={lk.relatedSectionTitle}><FileText size={14} /> Air Waybills ({related.awbs.length})</div>
                            {related.awbs.length === 0 ? <div className={lk.emptyState} style={{padding:'12px'}}>No AWBs linked</div> :
                              related.awbs.map(a => {
                                const carrier = CARRIERS.find(c => c.id === a.carrier_id);
                                return (
                                  <div 
                                    key={a.awb_id} 
                                    className={lk.relatedCard} 
                                    style={{ cursor: 'pointer', padding: '16px' }} 
                                    onClick={() => router.push(`/operations/awb/${a.awb_id}`)}
                                  >
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span className={lk.relatedLabel}>AWB Number</span><span className={lk.relatedValue} style={{fontFamily:'var(--font-mono)'}}>{formatAWBNumber(a.awb_number)}</span></div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span className={lk.relatedLabel}>Carrier</span><span className={lk.relatedValue}>{carrier?.name || '—'}</span></div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span className={lk.relatedLabel}>Charges</span><span className={lk.relatedValue}>{formatCurrency(a.total_charges, a.currency_code)}</span></div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span className={lk.relatedLabel}>Type</span><span className={lk.relatedValue}>{a.awb_type}</span></div>
                                    </div>
                                  </div>
                                );
                              })
                            }
                          </div>

                          {/* 2. Bookings */}
                          <div className={lk.relatedSection} style={{ marginBottom: 0 }}>
                            <div className={lk.relatedSectionTitle}><Ship size={14} /> Booking Requests ({related.bookings.length})</div>
                            {related.bookings.length === 0 ? <div className={lk.emptyState} style={{padding:'12px'}}>No bookings</div> :
                              related.bookings.map(b => (
                                <div 
                                  key={b.booking_request_id} 
                                  className={lk.relatedCard} 
                                  style={{ cursor: 'pointer', padding: '16px' }}
                                  onClick={() => router.push(`/operations/bookings/${b.booking_request_id}`)}
                                >
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span className={lk.relatedLabel}>Flight</span><span className={lk.relatedValue} style={{fontFamily:'var(--font-mono)'}}>{b.confirmed_flight_number || '—'}</span></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span className={lk.relatedLabel}>Status</span><Badge variant={getStatusColor(b.status)} size="small">{b.status}</Badge></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}><span className={lk.relatedLabel}>Date</span><span className={lk.relatedValue}>{b.confirmed_flight_date || b.requested_flight_date || '—'}</span></div>
                                  </div>
                                </div>
                              ))
                            }
                          </div>

                          {/* 3. Customs */}
                          <div className={lk.relatedSection} style={{ marginBottom: 0 }}>
                            <div className={lk.relatedSectionTitle}><Shield size={14} /> Customs Clearance ({related.customs.length})</div>
                            {related.customs.length === 0 ? <div className={lk.emptyState} style={{padding:'12px'}}>No clearances</div> :
                              related.customs.map(c => (
                                <div 
                                  key={c.clearance_id} 
                                  className={lk.relatedCard}
                                  style={{ padding: '16px' }}
                                >
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span className={lk.relatedLabel}>Declaration</span><span className={lk.relatedValue} style={{fontFamily:'var(--font-mono)'}}>{c.declaration_number}</span></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span className={lk.relatedLabel}>Type</span><span className={lk.relatedValue}>{c.clearance_type}</span></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span className={lk.relatedLabel}>Status</span><Badge variant={getStatusColor(c.status)} size="small">{c.status}</Badge></div>
                                  </div>
                                </div>
                              ))
                            }
                          </div>

                          {/* 4. Tracking Timeline */}
                          <div className={lk.relatedSection} style={{ marginBottom: 0 }}>
                            <div className={lk.relatedSectionTitle}>Tracking Events ({related.tracking.length})</div>
                            {related.tracking.length === 0 ? <div className={lk.emptyState} style={{padding:'12px'}}>No tracking events</div> : (
                              <div className={lk.timeline}>
                                {related.tracking.map((t, i) => (
                                  <div key={t.event_id} className={lk.timelineItem}>
                                    <div className={lk.timelineLine}>
                                      <div className={lk.timelineDot} />
                                      {i < related.tracking.length - 1 && <div className={lk.timelineConnector} />}
                                    </div>
                                    <div className={lk.timelineContent}>
                                      <div className={lk.timelineCode}>{t.fsu_code} — {t.airport_code}</div>
                                      <div className={lk.timelineDesc}>{t.description}</div>
                                      <div className={lk.timelineTime}>{formatDate(t.event_time)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 5. ULD Allocations */}
                          {related.uldAllocations.length > 0 && (
                            <div className={lk.relatedSection} style={{ marginBottom: 0 }}>
                              <div className={lk.relatedSectionTitle}>ULD Allocations ({related.uldAllocations.length})</div>
                              {related.uldAllocations.map(u => {
                                const uld = state.ulds.find(ud => ud.uld_id === u.uld_id);
                                return (
                                  <div 
                                    key={u.allocation_id} 
                                    className={lk.relatedCard}
                                    style={{ cursor: 'pointer', padding: '16px' }}
                                    onClick={() => router.push(`/operations/uld/${u.uld_id}`)}
                                  >
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}><span className={lk.relatedLabel}>ULD</span><span className={lk.relatedValue} style={{fontFamily:'var(--font-mono)'}}>{uld?.uld_number || u.uld_id}</span></div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span className={lk.relatedLabel}>Pieces</span><span className={lk.relatedValue}>{u.allocated_pieces}</span></div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span className={lk.relatedLabel}>Weight</span><span className={lk.relatedValue}>{formatWeight(u.allocated_weight_kg)}</span></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
