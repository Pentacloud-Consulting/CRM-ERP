'use client';
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Building2, User, Globe, ChevronRight, Activity, Package, Calendar, Ship, Truck, PlaneTakeoff, Scale, Box, DollarSign, FileText, CalendarClock, Check, X } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Badge from '@/components/ui/Badge';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils/formatters';
import { getLocationName, getLocationCountry } from '@/app/crm/leads/page';
import { OPPORTUNITY_STAGES } from '@/lib/data/seedData';
import styles from './detail.module.css';

export default function PipelineDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, dispatch, getOrganization, getContact } = useApp();

  const opp = state.opportunities.find(o => o.opportunity_id === id);

  if (!opp) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.page}>
          <div className={styles.backBtn} onClick={() => router.push('/crm/pipeline')}><ArrowLeft size={14} /> Sales Pipeline</div>
          <div style={{ padding: '64px', textAlign: 'center', color: '#64748B' }}>Opportunity not found</div>
        </div>
      </div>
    );
  }

  const account = getOrganization(opp.org_id) || {};
  const contactId = opp.primary_contact_id || opp.contact_id;
  const contact = contactId ? getContact(contactId) : {};
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
  let originName = getLocationName(opp.origin_location) || 'Mumbai';
  let destName = getLocationName(opp.destination_location) || 'Dubai';
  let isDomestic = false;
  if (opp.origin_location && opp.destination_location) {
    const o = getLocationCountry(opp.origin_location);
    const d = getLocationCountry(opp.destination_location);
    isDomestic = o && d && o === d;
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.page}>
        
        {/* --- Top Nav --- */}
        <div className={styles.topNav}>
          <div className={styles.backBtn} onClick={() => router.push('/crm/pipeline')}>
            <ArrowLeft size={14} /> Sales Pipeline
          </div>
          <div className={styles.calendarBtn}>
            <CalendarClock size={16} />
          </div>
        </div>

        {/* --- Hero Banner --- */}
        <div className={styles.heroBanner}>
          <img src="/images/custom_hero_bg.png" alt="Map Graphic" className={styles.mapBg} onError={(e) => e.target.style.display = 'none'} />
          
          <div className={styles.heroLeft}>
            <div className={styles.heroIconBox}>
              <TrendingUp size={36} strokeWidth={2.5} />
            </div>
            
            <div className={styles.heroTitleBlock}>
              <select 
                className={styles.qualifyingDropdown}
                value={opp.stage || 'Qualifying'}
                onChange={(e) => dispatch({ type: 'UPDATE_OPPORTUNITY_STAGE', payload: { opportunity_id: opp.opportunity_id, stage: e.target.value } })}
              >
                {OPPORTUNITY_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className={styles.heroTitleRow}>
                <h1 className={styles.heroTitle}>{account.legal_name || opp.name || 'Abc company'}</h1>
                <span className={styles.newBadge}>New</span>
              </div>
              <div className={styles.heroMeta}>
                <div className={styles.heroMetaItem}><Globe size={12} /> Inbound RFQ Portal</div>
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#CBD5E1' }}></div>
                <div className={styles.heroMetaItem}><Calendar size={12} /> Created 25 Aug 2026</div>
              </div>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.pipelineValueBlock}>
              <span className={styles.pipelineValueLabel}>Pipeline Value</span>
              <span className={styles.pipelineValue}>{formatCurrency(opp.expected_revenue || 0, account.default_currency || 'USD')}</span>
            </div>
            <select 
              className={styles.statusDropdown}
              value={opp.status || 'New'}
              onChange={(e) => dispatch({ type: 'UPDATE_OPPORTUNITY', payload: { ...opp, status: e.target.value } })}
            >
              {['New', 'Active', 'On Hold', 'Closed Won', 'Closed Lost'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* --- Pipeline Flow Visualizer --- */}
        <div className={styles.pipelineFlow}>
          {OPPORTUNITY_STAGES.map((stage, index) => {
            const currentIndex = OPPORTUNITY_STAGES.indexOf(opp.stage || 'Qualifying');
            
            // Logic for visual states
            let stateClass = '';
            let icon = null;
            
            if (stage === opp.stage) {
              if (stage === 'Lost') stateClass = styles.lost;
              else stateClass = styles.active;
            } else if (index < currentIndex) {
              if (opp.stage === 'Lost') stateClass = styles.lostCompleted;
              else {
                stateClass = styles.completed;
                icon = <Check size={18} strokeWidth={3} />;
              }
            }
            
            if (stage === 'Lost' && opp.stage === 'Lost') {
              icon = <X size={18} strokeWidth={3} />;
            }
            
            return (
              <div 
                key={stage} 
                className={`${styles.pipelineStep} ${stateClass}`}
                onClick={() => dispatch({ type: 'UPDATE_OPPORTUNITY_STAGE', payload: { opportunity_id: opp.opportunity_id, stage } })}
              >
                <div className={styles.stepIndicator}>
                  {icon || <div className={styles.stepInner} />}
                </div>
                <div className={styles.stepLabel}>{stage}</div>
              </div>
            );
          })}
        </div>

        {/* --- Main Layout Grid --- */}
        <div className={styles.mainLayout}>
          
          {/* LEFT SIDE */}
          <div className={styles.leftSide}>
            
            {/* TOP CARDS ROW */}
            <div className={styles.topCards}>
              
              {/* Freight Requirements */}
              <div className={styles.glassCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <div className={`${styles.cardIcon} ${styles.green}`}><Globe size={14} /></div>
                    <span className={styles.cardTitle}>Freight Requirements</span>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.routeMode}>
                    <span className={styles.routeModeTitle}>Route & Mode</span>
                    <span className={styles.routeModeValue}>
                      {opp.transport_mode === 'SEA' ? <Ship size={16} color="#6D4AFF" /> : opp.transport_mode === 'ROAD' ? <Truck size={16} color="#6D4AFF" /> : <PlaneTakeoff size={16} color="#6D4AFF" />}
                      {opp.transport_mode || 'AIR'}
                    </span>
                    <div className={styles.routePathContainer}>
                      <span className={styles.routePathCity}>{originName}</span>
                      <ArrowLeft size={14} className={styles.routeArrow} style={{ transform: 'rotate(180deg)' }} />
                      <span className={styles.routePathCity}>{destName}</span>
                      <Badge variant={isDomestic ? 'neutral' : 'primary'} style={{ marginLeft: '4px' }}>
                        {isDomestic ? 'Domestic' : 'International'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className={styles.infoGrid3}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}><Package size={12} /> Cargo Type</span>
                      <span className={styles.infoValue}>{opp.cargo_type || 'General'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}><FileText size={12} /> Incoterm</span>
                      <span className={styles.infoValue}>{opp.incoterm || 'CPT'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}><Scale size={12} /> Est. Weight</span>
                      <span className={styles.infoValue}>{opp.est_gross_weight_kg ? `${opp.est_gross_weight_kg} kg` : '—'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}><Box size={12} /> Volume</span>
                      <span className={styles.infoValue}>{opp.volume_cbm ? `${opp.volume_cbm} CBM` : '—'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}><DollarSign size={12} /> Currency</span>
                      <span className={styles.infoValue}>{opp.currency_code || 'USD'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className={styles.glassCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <div className={`${styles.cardIcon} ${styles.green}`}><Building2 size={14} /></div>
                    <span className={styles.cardTitle}>Account Details</span>
                  </div>
                  <div className={styles.cardAction} onClick={() => router.push(`/crm/accounts/${account.org_id}`)}>
                    View Account <ChevronRight size={12} />
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Legal Name</span>
                      <span className={styles.infoValue}>{account.legal_name || opp.name || 'Abc company'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Tier</span>
                      <span className={styles.infoValue}>{account.tier || 'Standard'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Industry</span>
                      <span className={styles.infoValue}>{account.industry || '—'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Tax ID</span>
                      <span className={styles.infoValue}>{account.tax_id || '—'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Country</span>
                      <span className={styles.infoValue}>{account.country_code || '—'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Billing Address</span>
                      <span className={styles.infoValue}>{account.billing_address_line1 || '—'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Phone</span>
                      <span className={styles.infoValue}>{account.phone || '—'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Owner</span>
                      <span className={styles.infoValue}>{opp.owner_id === 'user-1' ? 'Alex Miller' : opp.owner_id === 'user-2' ? 'Sarah Jenkins' : 'Alex Miller'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Website</span>
                      <span className={styles.infoValue}>{account.website || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM CARDS ROW (Timeline + Logistics) */}
            <div className={styles.topCards}>
              {/* Opportunity Timeline */}
              <div className={styles.glassCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <div className={`${styles.cardIcon} ${styles.green}`} style={{ background: '#F0FDF4' }}><Activity size={14} /></div>
                    <span className={styles.cardTitle}>Opportunity Timeline</span>
                  </div>
                </div>
                <div className={styles.cardBody} style={{ overflow: 'hidden', position: 'relative' }}>
                  <div className={styles.timelineWrapper}>
                    {activityEvents.map((evt, idx) => (
                      <div key={idx} className={styles.timelineItem}>
                        <div className={styles.timelineIcon}>
                          {evt.title.includes('Created') ? <Calendar size={14} /> : <TrendingUp size={14} />}
                        </div>
                        <div className={styles.timelineContent}>
                          <span className={styles.timelineTitle}>{evt.title}</span>
                          <span className={styles.timelineDesc}>{evt.desc}</span>
                          <span className={styles.timelineDate}>{formatDateTime(evt.time)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Logistics Execution */}
              <div className={styles.glassCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <div className={`${styles.cardIcon} ${styles.purple}`}><Package size={14} /></div>
                    <span className={styles.cardTitle}>Logistics Execution</span>
                  </div>
                </div>
                
                <div className={styles.cardBody}>
                  {shipments.length === 0 ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyStateIcon}><Package size={24} /></div>
                      <div className={styles.emptyStateTitle}>No Shipments Created</div>
                      <div className={styles.emptyStateDesc}>Shipments will appear here once the deal converts to an operational job.</div>
                    </div>
                  ) : (
                    <div className={styles.shipmentsList}>
                      {shipments.slice(0, 3).map(shipment => (
                        <div key={shipment.shipment_id} className={styles.shipmentItem} onClick={() => router.push(`/operations/shipments/${shipment.shipment_id}`)}>
                          <div className={styles.shipmentHeader}>
                            <span className={styles.shipmentRef}>{shipment.shipment_reference || 'SHP-PENDING'}</span>
                            <Badge variant={shipment.status === 'Delivered' ? 'success' : 'primary'} size="small">{shipment.status}</Badge>
                          </div>
                          <div className={styles.shipmentRoute}>
                            <span className={styles.shipmentCity}>{getLocationName(shipment.origin_location) || originName}</span>
                            <ArrowLeft size={12} style={{ transform: 'rotate(180deg)', color: '#94A3B8' }} />
                            <span className={styles.shipmentCity}>{getLocationName(shipment.destination_location) || destName}</span>
                          </div>
                          <div className={styles.shipmentMeta}>
                            <span className={styles.shipmentMetaItem}><Package size={10} /> {shipment.pieces || opp.est_pieces || 0} pcs</span>
                            <span className={styles.shipmentMetaItem}><Scale size={10} /> {shipment.gross_weight_kg || opp.estimated_weight_kg || 0} kg</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className={styles.rightCol}>
            
            {/* Opportunity Details */}
            <div className={styles.glassCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={`${styles.cardIcon} ${styles.green}`}><TrendingUp size={14} /></div>
                  <span className={styles.cardTitle}>Opportunity Details</span>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Opportunity Owner</span>
                    <span className={styles.infoValue}>{opp.owner_id === 'user-1' ? 'Alex Miller' : opp.owner_id === 'user-2' ? 'Sarah Jenkins' : 'Alex Miller'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Win Probability</span>
                    <span className={styles.infoValue}>{opp.win_probability ? `${opp.win_probability}%` : '—'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Expected Close</span>
                    <span className={styles.infoValue}>{opp.expected_close_date ? formatDate(opp.expected_close_date) : '—'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Cargo Ready</span>
                    <span className={styles.infoValue}>{opp.cargo_ready_date ? formatDate(opp.cargo_ready_date) : '28 Aug 2026'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Req. Delivery</span>
                    <span className={styles.infoValue}>{opp.required_delivery_date ? formatDate(opp.required_delivery_date) : '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className={styles.glassCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={`${styles.cardIcon} ${styles.green}`} style={{ color: '#10B981', background: '#ECFDF5' }}><User size={14} /></div>
                  <span className={styles.cardTitle}>Contact Details</span>
                </div>
                {contact.contact_id && (
                  <div className={styles.cardAction} onClick={() => router.push(`/crm/contacts/${contact.contact_id}`)}>
                    View Contact <ChevronRight size={12} />
                  </div>
                )}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Full Name</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.infoValue}>{contact.full_name || contact.first_name || 'sadadsads'}</span>
                      <Badge variant="primary" size="small">Primary</Badge>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Job Title</span>
                    <span className={styles.infoValue}>{contact.title || '—'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue} style={{ color: '#10B981' }}>{contact.email || 'dssda@dafad.okn'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Role</span>
                    <span className={styles.infoValue}>Decision Maker</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Phone</span>
                    <span className={styles.infoValue} style={{ color: '#10B981' }}>{contact.phone || '9988777777'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
