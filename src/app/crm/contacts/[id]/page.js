'use client';
import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Building2, Briefcase, FileText, ChevronRight, Activity, Calendar, Lock, Shield, Ship, Package, Navigation, Check } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Badge from '@/components/ui/Badge';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Button from '@/components/ui/Button';
import { formatDate, formatDateTime, formatWeight, formatCurrency, getStatusColor, formatAWBNumber } from '@/lib/utils/formatters';
import styles from './detail.module.css';

export default function ContactDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, getOrganization, getRelatedDataForShipment } = useApp();
  const [expandedShipment, setExpandedShipment] = useState(null);

  const contact = state.contacts.find(c => c.contact_id === id);

  if (!contact) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.page}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/crm/contacts')}>Back to Contacts</Button>
          <div className={styles.notFound}>Contact not found</div>
        </div>
      </div>
    );
  }

  const account = getOrganization(contact.org_id);
  const shipments = state.shipments.filter(s => s.contact_id === contact.contact_id);

  const toggleShipment = (shipmentId) => {
    setExpandedShipment(expandedShipment === shipmentId ? null : shipmentId);
  };

  // Construct activity timeline from domain events targeting this contact or its shipments
  const activityEvents = useMemo(() => {
    let events = [];
    
    // Add domain events mentioning the contact
    if (state.domainEvents) {
      events = [...events, ...state.domainEvents.filter(de => 
        de.message.includes(contact.contact_id) || 
        de.message.includes(contact.full_name) ||
        de.message.includes('Contact created')
      ).map(de => ({
        id: de.id,
        type: 'contact',
        title: de.message,
        desc: de.source || 'System',
        time: de.timestamp,
        icon: <UserIcon />
      }))];
    }

    // Add recent shipment status changes if available
    shipments.forEach(s => {
      const rel = getRelatedDataForShipment(s.shipment_id);
      if (rel.tracking && rel.tracking.length > 0) {
        // Take the latest tracking event
        const latest = rel.tracking[0];
        events.push({
          id: latest.event_id,
          type: 'tracking',
          title: `Shipment ${s.shipment_reference} — ${latest.fsu_code}`,
          desc: latest.description,
          time: latest.event_time,
          icon: <Navigation size={16} />
        });
      }
    });

    // Sort descending
    return events.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
  }, [state.domainEvents, contact, shipments, getRelatedDataForShipment]);

  return (
    <div className={styles.pageWrapper} style={{ '--primary': '#8B5CF6', '--primary-tint': 'rgba(139, 92, 246, 0.1)' }}>
      <div className={styles.page}>
        <div style={{ marginBottom: '24px' }}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/crm/contacts')}>Contacts</Button>
        </div>

        {/* ══════ HERO CARD ══════ */}
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.heroAvatar}>
              {(() => {
                const displayName = contact.full_name || [contact.first_name, contact.last_name].filter(Boolean).join(' ') || '?';
                return displayName.substring(0, 2).toUpperCase();
              })()}
            </div>
            <div>
              <div className={styles.heroTitleRow}>
                <h1 className={styles.heroTitle}>{contact.full_name || [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown'}</h1>
                {contact.is_primary && (
                  <div className={styles.primaryBadge}>Primary Contact</div>
                )}
              </div>
              <p className={styles.heroSubtitle}>{contact.title || 'Contact'}</p>
              
              <div className={styles.heroContactInfo}>
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className={styles.heroContactItem}>
                    <Mail size={16} className={styles.heroContactIcon} /> {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className={styles.heroContactItem}>
                    <Phone size={16} className={styles.heroContactIcon} /> {contact.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.quickActions}>
              {contact.email && (
                <a href={`mailto:${contact.email}`} className={`${styles.quickActionBtn} ${styles.btnSecondary}`}>
                  <Mail size={14} /> Email
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className={`${styles.quickActionBtn} ${styles.btnSecondary}`}>
                  <Phone size={14} /> Call
                </a>
              )}
              <button 
                className={`${styles.quickActionBtn} ${styles.btnSecondary}`}
                onClick={() => router.push('/crm/contacts?edit=' + contact.contact_id)}
              >
                Edit Contact
              </button>
            </div>
          </div>
        </div>

        <div className="grid2" style={{ gap: '24px', alignItems: 'start' }}>
          <div>
            {/* ══════ ACCOUNT RELATIONSHIP ══════ */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <Building2 size={18} color="#8B5CF6" />
                  <h2 className={styles.sectionTitle}>Account Relationship</h2>
                </div>
              </div>
              
              {account ? (
                <div className={styles.accountCard} onClick={() => router.push(`/crm/accounts/${account.org_id}`)}>
                  <div className={styles.accountLeft}>
                    <div className={styles.accountIcon}>
                      <Building2 size={24} />
                    </div>
                    <div>
                      <div className={styles.accountName}>{account.legal_name}</div>
                      <div className={styles.accountMeta}>Account • {account.default_currency || 'USD'}</div>
                    </div>
                  </div>
                  <div className={styles.accountRight}>
                    View Account <ChevronRight size={18} className={styles.accountArrow} />
                  </div>
                </div>
              ) : (
                <div className={styles.emptyBlock}>
                  <Building2 size={24} className={styles.emptyBlockIcon} />
                  <div className={styles.emptyBlockText}>No account associated</div>
                </div>
              )}
            </div>

            {/* ══════ CONTACT INFORMATION ══════ */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <FileText size={18} color="#8B5CF6" />
                  <h2 className={styles.sectionTitle}>Contact Information</h2>
                </div>
              </div>
              
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{contact.email || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Phone</span>
                  <span className={styles.infoValue}>{contact.phone || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Job Title</span>
                  <span className={styles.infoValue}>{contact.title || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Contact Type</span>
                  <span className={styles.infoValue}>{contact.is_primary ? 'Primary Contact' : 'Secondary Contact'}</span>
                </div>
              </div>
            </div>

            {/* ══════ RECENT ACTIVITY ══════ */}
            {activityEvents.length > 0 && (
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleGroup}>
                    <Activity size={18} color="#8B5CF6" />
                    <h2 className={styles.sectionTitle}>Recent Activity</h2>
                  </div>
                </div>
                
                <div className={styles.timeline}>
                  {activityEvents.map((evt, idx) => (
                    <div key={evt.id || idx} className={styles.timelineItem}>
                      <div className={styles.timelineIcon} style={{ borderColor: evt.type === 'tracking' ? '#14B8A6' : '#8B5CF6', color: evt.type === 'tracking' ? '#14B8A6' : '#8B5CF6' }}>
                        {evt.icon}
                      </div>
                      <div className={styles.timelineContent}>
                        <h4 className={styles.timelineTitle}>{evt.title}</h4>
                        <p className={styles.timelineDesc}>{evt.desc}</p>
                        <span className={styles.timelineTime}>{formatDateTime(evt.time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            {/* ══════ CONTACT'S SHIPMENTS ══════ */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader} style={{ marginBottom: '16px' }}>
                <div>
                  <div className={styles.sectionTitleGroup}>
                    <Package size={18} color="#8B5CF6" />
                    <h2 className={styles.sectionTitle}>Contact's Shipments</h2>
                  </div>
                  <div className={styles.sectionSubtitle}>All shipments assigned specifically to this contact.</div>
                </div>
              </div>

              {shipments.length === 0 ? (
                <div className={styles.emptyBlock}>
                  <Ship size={24} className={styles.emptyBlockIcon} />
                  <div className={styles.emptyBlockText}>No shipments associated with this contact</div>
                </div>
              ) : (
                <div>
                  {shipments.map(s => {
                    const isExpanded = expandedShipment === s.shipment_id;
                    const routeText = s.origin_airport && s.destination_airport 
                      ? <><span style={{fontFamily:'var(--font-mono)', color:'#0F172A'}}>{s.origin_airport}</span> <ChevronRight size={12} className={styles.routeArrow} /> <span style={{fontFamily:'var(--font-mono)', color:'#0F172A'}}>{s.destination_airport}</span></>
                      : 'Route TBD';
                      
                    return (
                      <div key={s.shipment_id} className={styles.shipmentRow}>
                        <div className={styles.shipmentHeader} onClick={() => toggleShipment(s.shipment_id)}>
                          <div className={styles.shipmentHeaderLeft}>
                            <ChevronRight size={18} className={`${styles.shipmentChevron} ${isExpanded ? styles.open : ''}`} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                <span className={styles.shipmentRef}>{s.shipment_reference}</span>
                                <Badge variant={getStatusColor(s.status)} dot>{s.status}</Badge>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className={styles.shipmentRoute}>{routeText}</div>
                                <div className={styles.shipmentMeta}>
                                  {s.pieces} pcs • {formatWeight(s.gross_weight_kg)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className={styles.shipmentBody}>
                            <div className={styles.shipmentDetailGrid}>
                              <div className={styles.shipmentDetailItem}>
                                <span className={styles.shipmentDetailLabel}>Date Created</span>
                                <span className={styles.shipmentDetailValue}>{formatDate(s.created_at)}</span>
                              </div>
                              <div className={styles.shipmentDetailItem}>
                                <span className={styles.shipmentDetailLabel}>Incoterm</span>
                                <span className={styles.shipmentDetailValue}>{s.incoterm || '—'}</span>
                              </div>
                              <div className={styles.shipmentDetailItem}>
                                <span className={styles.shipmentDetailLabel}>Service Level</span>
                                <span className={styles.shipmentDetailValue}>{s.service_level || '—'}</span>
                              </div>
                            </div>
                            <Button 
                              variant="secondary" 
                              onClick={(e) => { e.stopPropagation(); router.push(`/operations/shipments/${s.shipment_id}`); }}
                              style={{ width: '100%', justifyContent: 'center' }}
                            >
                              View Complete Shipment Details
                            </Button>
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
      </div>
    </div>
  );
}

function UserIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
}
