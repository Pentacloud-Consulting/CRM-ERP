'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mail, Phone, Building2, User, FileText, Shield, Ship, ChevronRight, Globe, TrendingUp, Users, Target, Package, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/store/AppContext';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import ContactLookup from '@/components/ui/ContactLookup';
import { formatDate, formatWeight, formatCurrency, getStatusColor, formatAWBNumber } from '@/lib/utils/formatters';
import { CARRIERS } from '@/lib/data/seedData';
import styles from '../../leads/[id]/detail.module.css';
import lk from '@/components/ui/lookup.module.css';

export default function AccountDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, getContactsForAccount, getOpportunitiesForAccount, getShipmentsForAccount, getLeadsForAccount, getAWBsForAccount, getClearancesForAccount, getRelatedDataForShipment } = useApp();
  const [activeTab, setActiveTab] = useState('contacts');
  const [expandedShipment, setExpandedShipment] = useState(null);

  const account = state.accounts.find(a => a.account_id === id);

  if (!account) {
    return (
      <div className={`ambient-mesh-bg`} style={{ minHeight: '100vh', padding: '24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <Breadcrumbs items={[{ label: 'Accounts', href: '/crm/accounts' }, { label: 'Not Found' }]} />
          <div className={styles.notFound}>Account not found</div>
        </div>
      </div>
    );
  }

  const contacts = getContactsForAccount(id);
  const leads = getLeadsForAccount(id);
  const opportunities = getOpportunitiesForAccount(id);
  const shipments = getShipmentsForAccount(id);
  const awbs = getAWBsForAccount(id);
  const clearances = getClearancesForAccount(id);

  const tabs = [
    { key: 'contacts', label: 'Contacts', icon: Users, count: contacts.length },
    { key: 'leads', label: 'Leads', icon: Target, count: leads.length },
    { key: 'opportunities', label: 'Opportunities', icon: TrendingUp, count: opportunities.length },
    { key: 'shipments', label: 'Shipments', icon: Ship, count: shipments.length },
    { key: 'awbs', label: 'Air Waybills', icon: FileText, count: awbs.length },
    { key: 'customs', label: 'Customs', icon: Shield, count: clearances.length },
  ];

  const toggleShipment = (shipmentId) => {
    setExpandedShipment(expandedShipment === shipmentId ? null : shipmentId);
  };

  return (
    <div style={{ backgroundColor: '#F7F9FB', minHeight: '100vh', padding: '24px', '--primary': '#14B8A6', '--primary-tint': 'rgba(20, 184, 166, 0.1)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Breadcrumbs items={[{ label: 'Accounts', href: '/crm/accounts' }, { label: account.legal_name }]} />

        {/* Account Header */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '24px', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), 0 8px 16px rgba(20, 184, 166, 0.25)' }}>
              <Building2 size={32} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0', color: '#0F172A', letterSpacing: '-0.02em' }}>{account.legal_name}</h1>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '15px', fontWeight: 500 }}>{account.industry || 'Account'} · {account.country || ''}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(20, 184, 166, 0.05)', border: '1px solid rgba(20, 184, 166, 0.2)', color: '#14B8A6', fontSize: '13px', fontWeight: 600, boxShadow: '0 0 12px rgba(20, 184, 166, 0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#14B8A6', boxShadow: '0 0 6px #14B8A6' }} />
                {account.account_tier || 'Standard'}
              </div>
            </div>
          </div>

          <div style={{ height: '1px', width: '100%', background: 'linear-gradient(90deg, rgba(20, 184, 166, 0.15) 0%, rgba(20, 184, 166, 0.02) 100%)', marginBottom: '24px' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                <Phone size={14} style={{ color: account.phone ? '#14B8A6' : 'inherit' }} /> Phone
              </span>
              {account.phone ? (
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{account.phone}</span>
              ) : (
                <span style={{ fontSize: '14px', color: '#94A3B8', borderBottom: '1px dashed #CBD5E1', paddingBottom: '2px' }}>Not Provided</span>
              )}
            </div>
            <div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                <Globe size={14} style={{ color: account.website ? '#14B8A6' : 'inherit' }} /> Website
              </span>
              {account.website ? (
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#14B8A6', cursor: 'pointer' }}>{account.website}</span>
              ) : (
                <span style={{ fontSize: '14px', color: '#94A3B8', borderBottom: '1px dashed #CBD5E1', paddingBottom: '2px' }}>Not Provided</span>
              )}
            </div>
            <div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                <FileText size={14} style={{ color: account.tax_id ? '#14B8A6' : 'inherit' }} /> Tax ID
              </span>
              {account.tax_id ? (
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{account.tax_id}</span>
              ) : (
                <span style={{ fontSize: '14px', color: '#94A3B8', borderBottom: '1px dashed #CBD5E1', paddingBottom: '2px' }}>Not Provided</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`glass-card ${lk.vLayout}`} style={{ padding: '0', position: 'relative' }}>
          {/* Vertical Sidebar */}
          <div className={lk.vTabBar}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  className={`${lk.vTab} ${isActive ? lk.vTabActive : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                  style={{ position: 'relative' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-tab-indicator"
                      className={lk.vTabIndicator}
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <div className={lk.vTabLeft} style={{ position: 'relative', zIndex: 2 }}>
                    <tab.icon size={16} />
                    {tab.label}
                  </div>
                  <span className={lk.vTabCount} style={{ position: 'relative', zIndex: 2 }}>{tab.count}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className={lk.vContent}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%' }}
              >
            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              contacts.length === 0 ? <div className={lk.emptyState}>No contacts linked to this account yet.</div> : (
                <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {contacts.map(c => (
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} whileTap={{ scale: 0.98 }} key={c.contact_id} className={lk.relatedCard} style={{ cursor: 'pointer' }} onClick={() => router.push(`/crm/contacts/${c.contact_id}`)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '15px', color: '#1E293B', letterSpacing: '-0.01em' }}>{c.full_name}</div>
                          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {c.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {c.email}</span>}
                            {c.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {c.phone}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          {c.is_primary && (
                            <div style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(20, 184, 166, 0.1)', color: '#14B8A6', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 0 10px rgba(20, 184, 166, 0.2)' }}>
                              Primary
                            </div>
                          )}
                          <ChevronRight size={18} className={lk.chevron} style={{ color: 'rgba(20, 184, 166, 0.5)' }} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )
            )}

            {/* Leads Tab */}
            {activeTab === 'leads' && (
              leads.length === 0 ? <div className={lk.emptyState}>No leads converted to this account yet.</div> : (
                <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {leads.map(l => (
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} whileTap={{ scale: 0.98 }} key={l.lead_id} className={lk.relatedCard} style={{ cursor: 'pointer' }} onClick={() => router.push(`/crm/leads/${l.lead_id}`)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '15px', color: '#1E293B', letterSpacing: '-0.01em' }}>{l.company_name}</div>
                          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {l.first_name} {l.last_name}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={12} /> {l.trade_lane || `${l.origin_airport || ''}→${l.destination_airport || ''}`}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <Badge variant={getStatusColor(l.status)} size="small" dot>{l.status}</Badge>
                          <ChevronRight size={18} className={lk.chevron} style={{ color: 'rgba(20, 184, 166, 0.5)' }} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )
            )}

            {/* Opportunities Tab */}
            {activeTab === 'opportunities' && (
              opportunities.length === 0 ? <div className={lk.emptyState}>No opportunities for this account yet.</div> : (
                <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {opportunities.map(o => (
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} whileTap={{ scale: 0.98 }} key={o.opportunity_id} className={lk.relatedCard} style={{ cursor: 'pointer' }} onClick={() => router.push(`/crm/pipeline/${o.opportunity_id}`)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '15px', color: '#1E293B', letterSpacing: '-0.01em' }}>{o.name || o.title}</div>
                          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={12} /> {o.trade_lane}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Package size={12} /> {o.cargo_type}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>{formatCurrency(o.pipeline_value, o.currency_code)}</span>
                          <Badge variant={getStatusColor(o.stage)} size="small" dot>{o.stage}</Badge>
                          <ChevronRight size={18} className={lk.chevron} style={{ color: 'rgba(20, 184, 166, 0.5)' }} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )
            )}

            {/* Shipments Tab */}
            {activeTab === 'shipments' && (
              shipments.length === 0 ? <div className={lk.emptyState}>No shipments for this account yet.</div> : (
                <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {shipments.map(s => {
                    const isExpanded = expandedShipment === s.shipment_id;
                    const related = isExpanded ? getRelatedDataForShipment(s.shipment_id) : null;

                    return (
                      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} key={s.shipment_id} className={lk.accordion}>
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
                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{s.origin_airport} → {s.destination_airport} · {s.pieces} pcs · {formatWeight(s.gross_weight_kg)}</div>
                          </div>
                          <Badge variant={getStatusColor(s.status)} size="small" dot>{s.status}</Badge>
                        </button>

                        {isExpanded && related && (
                          <div className={lk.accordionBody}>
                            {/* AWBs */}
                            <div className={lk.relatedSection}>
                              <div className={lk.relatedSectionTitle}><FileText size={14} /> Air Waybills ({related.awbs.length})</div>
                              {related.awbs.length === 0 ? <div className={lk.emptyState} style={{padding: '12px'}}>No AWBs linked</div> :
                                related.awbs.map(a => {
                                  const carrier = CARRIERS.find(c => c.id === a.carrier_id);
                                  return (
                                    <div 
                                      key={a.awb_id} 
                                      className={lk.relatedCard}
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => router.push(`/operations/awb/${a.awb_id}`)}
                                    >
                                      <div className={lk.relatedRow}><span className={lk.relatedLabel}>AWB Number</span><span className={lk.relatedValue} style={{fontFamily:'var(--font-mono)'}}>{formatAWBNumber(a.awb_number)}</span></div>
                                      <div className={lk.relatedRow}><span className={lk.relatedLabel}>Carrier</span><span className={lk.relatedValue}>{carrier?.name || a.carrier_id}</span></div>
                                      <div className={lk.relatedRow}><span className={lk.relatedLabel}>Charges</span><span className={lk.relatedValue}>{formatCurrency(a.total_charges, a.currency_code)}</span></div>
                                    </div>
                                  );
                                })
                              }
                            </div>

                            {/* Customs */}
                            <div className={lk.relatedSection}>
                              <div className={lk.relatedSectionTitle}><Shield size={14} /> Customs Clearance ({related.customs.length})</div>
                              {related.customs.length === 0 ? <div className={lk.emptyState} style={{padding: '12px'}}>No clearances</div> :
                                related.customs.map(c => (
                                  <div 
                                    key={c.clearance_id} 
                                    className={lk.relatedCard}
                                  >
                                    <div className={lk.relatedRow}><span className={lk.relatedLabel}>Declaration</span><span className={lk.relatedValue}>{c.declaration_number}</span></div>
                                    <div className={lk.relatedRow}><span className={lk.relatedLabel}>Status</span><Badge variant={getStatusColor(c.status)} size="small">{c.status}</Badge></div>
                                  </div>
                                ))
                              }
                            </div>

                            {/* Bookings */}
                            <div className={lk.relatedSection}>
                              <div className={lk.relatedSectionTitle}><Ship size={14} /> Bookings ({related.bookings.length})</div>
                              {related.bookings.length === 0 ? <div className={lk.emptyState} style={{padding: '12px'}}>No bookings</div> :
                                related.bookings.map(b => (
                                  <div 
                                    key={b.booking_request_id} 
                                    className={lk.relatedCard}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => router.push(`/operations/bookings/${b.booking_request_id}`)}
                                  >
                                    <div className={lk.relatedRow}><span className={lk.relatedLabel}>Flight</span><span className={lk.relatedValue} style={{fontFamily:'var(--font-mono)'}}>{b.confirmed_flight_number || '—'}</span></div>
                                    <div className={lk.relatedRow}><span className={lk.relatedLabel}>Status</span><Badge variant={getStatusColor(b.status)} size="small">{b.status}</Badge></div>
                                  </div>
                                ))
                              }
                            </div>

                            {/* Tracking */}
                            <div className={lk.relatedSection}>
                              <div className={lk.relatedSectionTitle}>Tracking Events ({related.tracking.length})</div>
                              {related.tracking.length === 0 ? <div className={lk.emptyState} style={{padding: '12px'}}>No tracking events</div> : (
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

                            {/* ULD Allocations */}
                            {related.uldAllocations.length > 0 && (
                              <div className={lk.relatedSection}>
                                <div className={lk.relatedSectionTitle}>ULD Allocations ({related.uldAllocations.length})</div>
                                {related.uldAllocations.map(u => {
                                  const uld = state.ulds.find(ud => ud.uld_id === u.uld_id);
                                  return (
                                    <div 
                                      key={u.allocation_id} 
                                      className={lk.relatedCard}
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => router.push(`/operations/uld/${u.uld_id}`)}
                                    >
                                      <div className={lk.relatedRow}><span className={lk.relatedLabel}>ULD</span><span className={lk.relatedValue} style={{fontFamily:'var(--font-mono)'}}>{uld?.uld_number || u.uld_id}</span></div>
                                      <div className={lk.relatedRow}><span className={lk.relatedLabel}>Weight</span><span className={lk.relatedValue}>{formatWeight(u.allocated_weight_kg)}</span></div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )
            )}

            {/* AWBs Tab */}
            {activeTab === 'awbs' && (
              awbs.length === 0 ? <div className={lk.emptyState}>No air waybills for this account yet.</div> : (
                <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {awbs.map(a => {
                    const carrier = CARRIERS.find(c => c.id === a.carrier_id);
                    return (
                      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} whileTap={{ scale: 0.98 }} key={a.awb_id} className={lk.relatedCard} style={{ cursor: 'pointer' }} onClick={() => router.push(`/operations/awb/${a.awb_id}`)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '15px', color: '#1E293B', fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em' }}>{formatAWBNumber(a.awb_number)}</div>
                            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={12} /> {carrier?.name || '—'}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {a.origin_airport} → {a.destination_airport}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>{formatCurrency(a.total_charges, a.currency_code)}</span>
                            <Badge variant={getStatusColor(a.fwb_status)} size="small">{a.fwb_status}</Badge>
                            <ChevronRight size={18} className={lk.chevron} style={{ color: 'rgba(20, 184, 166, 0.5)' }} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )
            )}

            {/* Customs Tab */}
            {activeTab === 'customs' && (
              clearances.length === 0 ? <div className={lk.emptyState}>No customs clearances for this account yet.</div> : (
                <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {clearances.map(c => (
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} key={c.clearance_id} className={lk.relatedCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{c.declaration_number}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{c.clearance_type} · {c.jurisdiction}</div>
                        </div>
                        <Badge variant={getStatusColor(c.status)} size="small" dot>{c.status}</Badge>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )
            )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
