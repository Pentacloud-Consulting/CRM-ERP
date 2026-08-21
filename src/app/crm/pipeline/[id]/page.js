'use client';
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Building2, User, Globe, Briefcase, ChevronRight, Activity, Package, Mail, Phone, Calendar } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils/formatters';
import { LOCATIONS } from '@/lib/data/seedData';
import { PlaneTakeoff, Ship, Truck, Anchor } from 'lucide-react';
import { getLocationName, getLocationCountry } from '@/app/crm/leads/page';
import styles from './detail.module.css';

export default function PipelineDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, getOrganization, getContact } = useApp();

  const opp = state.opportunities.find(o => o.opportunity_id === id);

  if (!opp) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.page}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/crm/pipeline')}>Back to Pipeline</Button>
          <div className={styles.notFound}>Opportunity not found</div>
        </div>
      </div>
    );
  }

  const account = getOrganization(opp.org_id);
  const contact = opp.primary_contact_id ? getContact(opp.primary_contact_id) : null;
  const shipments = state.shipments.filter(s => s.opportunity_id === opp.opportunity_id);

  // Construct activity timeline from domain events targeting this opportunity
  const activityEvents = useMemo(() => {
    let events = [];
    if (state.domainEvents) {
      events = state.domainEvents.filter(de => 
        de.message.includes(opp.opportunity_id) || 
        de.message.includes(opp.name) ||
        (de.type === 'OPPORTUNITY_UPDATED' && de.message.includes('Opportunity'))
      ).map(de => ({
        id: de.id,
        title: de.message,
        desc: de.source || 'System',
        time: de.timestamp,
      }));
    }
    
    // Add a synthetic creation event if not present
    if (!events.some(e => e.title.includes('Created'))) {
      events.push({
        id: 'creation',
        title: 'Opportunity Created',
        desc: 'System',
        time: opp.created_at || new Date().toISOString()
      });
    }

    return events.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
  }, [state.domainEvents, opp]);


  // Format Route & Mode
  let routeDisplay = <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
  if (opp.origin_location || opp.destination_location) {
    const o = getLocationCountry(opp.origin_location);
    const d = getLocationCountry(opp.destination_location);
    const isDomestic = o && d && o === d;
    
    routeDisplay = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#94A3B8', display: 'flex' }}>
            {opp.transport_mode === 'SEA' ? <Ship size={14} /> : opp.transport_mode === 'ROAD' ? <Truck size={14} /> : <PlaneTakeoff size={14} />}
          </span>
          <span style={{ fontWeight: 600 }}>{opp.transport_mode || 'AIR'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{getLocationName(opp.origin_location)}</span>
          <ChevronRight size={14} style={{ color: '#94A3B8' }} />
          <span>{getLocationName(opp.destination_location)}</span>
          {o && d && (
            <Badge variant={isDomestic ? 'neutral' : 'primary'} dot style={{ marginLeft: '4px' }}>
              {isDomestic ? 'Domestic' : 'International'}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  // Determine Stage Colors for Badges
  const getStageColor = (stage) => {
    if (stage === 'Won') return 'success';
    if (stage === 'Lost') return 'danger';
    if (stage === 'Negotiation') return 'warning';
    return 'primary';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'success';
      case 'In Transit': return 'primary';
      case 'Customs Clearance': return 'warning';
      case 'Exception': return 'danger';
      default: return 'neutral';
    }
  };


  return (
    <div className={styles.pageWrapper} style={{ '--primary': '#14B8A6', '--primary-tint': 'rgba(20, 184, 166, 0.1)' }}>
      <div className={styles.page}>
        <div style={{ marginBottom: '24px' }}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/crm/pipeline')}>Sales Pipeline</Button>
        </div>

        {/* ══════ HERO CARD ══════ */}
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.heroIcon}>
              <TrendingUp size={36} />
            </div>
            <div>
              <div className={styles.heroTitleRow}>
                <h1 className={styles.heroTitle}>{opp.name}</h1>
                <Badge variant={getStageColor(opp.stage)}>{opp.stage}</Badge>
              </div>
              <div className={styles.heroSubtitle}>
                <Building2 size={16} />
                <span>{account?.legal_name || 'Opportunity'}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                Created {formatDate(opp.created_at)}
              </div>
            </div>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.heroValueLabel}>Pipeline Value</div>
            <div className={styles.heroValueAmount}>{formatCurrency(opp.pipeline_value, opp.currency_code)}</div>
          </div>
        </div>

        {/* ══════ 2-COLUMN LAYOUT ══════ */}
        <div className={styles.layoutGrid}>
          
          {/* Left Column */}
          <div>
            {/* Freight Requirements */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><Globe size={18} color="#14B8A6" /> Freight Requirements</h2>
              </div>
              <div className={styles.dataGrid}>
                <div className={styles.dataItem} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.dataLabel}><Anchor size={12} style={{marginRight: 4}} /> Route & Mode</span>
                  <div className={styles.dataLane} style={{ marginTop: 8 }}>{routeDisplay}</div>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>Cargo Type</span>
                  <span className={styles.dataValue}>{opp.cargo_type || '—'}</span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>Incoterm</span>
                  <span className={styles.dataValue}>{opp.incoterm || '—'}</span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>Est. Weight</span>
                  <span className={styles.dataValue}>{opp.est_chargeable_weight_kg ? `${opp.est_chargeable_weight_kg} kg` : '—'}</span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>Currency</span>
                  <span className={styles.dataValue}>{opp.currency_code || 'USD'}</span>
                </div>
              </div>
            </div>

            {/* Opportunity Timeline */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><Activity size={18} color="#14B8A6" /> Opportunity Timeline</h2>
              </div>
              <div className={styles.timeline}>
                {activityEvents.map((evt, idx) => (
                  <div key={evt.id || idx} className={styles.timelineItem}>
                    <div className={styles.timelineIcon} style={{ borderColor: evt.title.includes('Won') ? '#10B981' : '#14B8A6', color: evt.title.includes('Won') ? '#10B981' : '#14B8A6' }}>
                      {evt.title.includes('Won') ? <TrendingUp size={16} /> : <Calendar size={16} />}
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
          </div>

          {/* Right Column */}
          <div>
            {/* Account Relationship */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader} style={{ marginBottom: '16px', paddingBottom: '16px' }}>
                <h2 className={styles.sectionTitle} style={{ fontSize: '14px' }}>CRM Relationships</h2>
              </div>
              
              <div className={styles.relCard} onClick={() => account && router.push(`/crm/accounts/${account.org_id}`)}>
                <div className={styles.relLeft}>
                  <div className={styles.relIcon}><Building2 size={20} /></div>
                  <div>
                    <div className={styles.relSubtitle}>ACCOUNT</div>
                    <div className={styles.relTitle}>{account?.legal_name || 'No Account'}</div>
                  </div>
                </div>
                <div className={styles.relRight}>
                  View <ChevronRight size={16} className={styles.relArrow} />
                </div>
              </div>

              {contact && (
                <div className={styles.relCard} onClick={() => router.push(`/crm/contacts/${contact.contact_id}`)}>
                  <div className={styles.relLeft}>
                    <div className={styles.relIcon}><User size={20} /></div>
                    <div>
                      <div className={styles.relSubtitle}>PRIMARY CONTACT</div>
                      <div className={styles.relTitle}>{contact.full_name}</div>
                    </div>
                  </div>
                  <div className={styles.relRight}>
                    View <ChevronRight size={16} className={styles.relArrow} />
                  </div>
                </div>
              )}
            </div>

            {/* Shipment Readiness / Conversion */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader} style={{ marginBottom: '16px', paddingBottom: '16px' }}>
                <h2 className={styles.sectionTitle} style={{ fontSize: '14px' }}>Logistics Execution</h2>
              </div>

              {shipments.length > 0 ? (
                shipments.map(s => (
                  <div key={s.shipment_id} className={styles.relCard} onClick={() => router.push(`/operations/shipments/${s.shipment_id}`)} style={{ borderColor: '#8B5CF6' }}>
                    <div className={styles.relLeft}>
                      <div className={styles.relIcon} style={{ color: '#8B5CF6', borderColor: '#8B5CF6', background: 'rgba(139, 92, 246, 0.05)' }}>
                        <Package size={20} />
                      </div>
                      <div>
                        <div className={styles.relSubtitle} style={{ color: '#8B5CF6', fontWeight: 700 }}>SHIPMENT CREATED</div>
                        <div className={styles.relTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{s.shipment_reference}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.relRight} style={{ color: '#8B5CF6' }}>
                      <ChevronRight size={16} className={styles.relArrow} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-tertiary)' }}>
                  <Package size={24} style={{ opacity: 0.5, marginBottom: '8px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>No Shipments Created</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Shipments will appear here once the deal converts to an operational job.</div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
