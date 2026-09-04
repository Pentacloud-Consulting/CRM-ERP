'use client';
import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Building2, Users, Briefcase, Package, Navigation, Globe, Phone, FileText, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Mail, Banknote, MapPin, Activity, ShieldCheck, CircleDollarSign, Calendar, User, Target, HeartPulse, MoreVertical, Pencil, Plus } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AccountAISummary from '@/components/ai/AccountAISummary';
import { formatDate, formatWeight, formatCurrency, getStatusColor } from '@/lib/utils/formatters';
import styles from './detail.module.css';

export default function AccountDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, dispatch, getContact, getContactsForOrg, getOpportunitiesForOrg, getShipmentsForOrg } = useApp();
  
  const [activeTab, setActiveTab] = useState('info');
  const [expandedShipment, setExpandedShipment] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const account = state.organizations.find(a => a.org_id === id);

  if (!account) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.page}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/crm/accounts')}>Back to Accounts</Button>
          <div className={styles.notFound}>Account not found</div>
        </div>
      </div>
    );
  }

  const contacts = getContactsForOrg(account.org_id);
  const opportunities = getOpportunitiesForOrg(account.org_id);
  const shipments = getShipmentsForOrg(account.org_id);
  // Optional: if the backend handles converted leads, this gets them. Otherwise empty array.
  const leads = state.leads ? state.leads.filter(l => l.converted_org_id === account.org_id) : [];

  const primaryContact = contacts.find(c => c.is_primary) || contacts[0];

  const toggleShipment = (shipmentId) => {
    setExpandedShipment(expandedShipment === shipmentId ? null : shipmentId);
  };

  const openEdit = () => {
    setEditForm({ 
      ...account,
      phone: account.phone || primaryContact?.phone || ''
    });
  };

  const handleSave = () => {
    if (!editForm.legal_name?.trim()) return;
    dispatch({ type: 'UPDATE_ORGANIZATION', payload: { ...editForm } });
    setEditForm(null);
  };

  const totalShipments = shipments.length;
  const openOpportunities = opportunities.filter(o => o.status !== 'Closed Won' && o.status !== 'Closed Lost').length;
  const expectedRevenue = opportunities.reduce((sum, o) => sum + (Number(o.expected_revenue) || 0), 0);
  
  // Frontend calculated mock health score
  let healthScore = 100;
  if (totalShipments === 0) healthScore -= 20;
  if (contacts.length === 0) healthScore -= 10;
  if (opportunities.length > 0 && openOpportunities === 0) healthScore -= 5;
  const healthLabel = healthScore > 85 ? 'Healthy' : healthScore > 70 ? 'At Risk' : 'Needs Attention';

  return (
    <div className={styles.pageWrapper} style={{ '--primary': '#14B8A6', '--primary-tint': 'rgba(20, 184, 166, 0.1)' }}>
      <div className={styles.page}>
        <div style={{ marginBottom: '24px' }}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/crm/accounts')}>Accounts</Button>
        </div>

        {/* ══════ HERO CARD ══════ */}
        <div className={styles.heroCardGlass}>
          <img src="/images/custom_hero_bg.png" alt="Logistics Command Center" className={styles.heroMapBg} onError={(e) => e.target.style.display = 'none'} />
          
          <div className={styles.heroTopRow}>
            <div className={styles.heroLeft}>
              <div style={{ position: 'relative' }}>
                <div className={styles.heroAvatarPremium}>
                  {(account.legal_name || '?').substring(0, 2).toUpperCase()}
                </div>
                <div className={styles.verifiedBadgeAvatar}>
                  <CheckCircle2 size={16} fill="#6D4AFF" color="white" />
                </div>
              </div>
              
              <div>
                <div className={styles.heroTitleRow}>
                  <h1 className={styles.heroTitle}>{account.legal_name}</h1>
                  <CheckCircle2 size={24} fill="#6D4AFF" color="white" style={{ marginTop: '4px' }} />
                </div>
                
                <div className={styles.heroSubtitle}>
                  <div className={styles.iconBg} style={{ background: 'rgba(20, 184, 166, 0.08)', color: '#14B8A6' }}>
                    <Building2 size={14} />
                  </div>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>Account</span>
                  <span style={{ color: '#CBD5E1', margin: '0 4px' }}>•</span>
                  <span>{account.industry || 'Enterprise Technology Partner'}</span>
                  <span style={{ color: '#CBD5E1', margin: '0 4px' }}>•</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6D4AFF', fontWeight: 600 }}>
                    <ShieldCheck size={16} /> Verified Customer
                  </div>
                </div>
                
                <div className={styles.heroInfoGrid}>
                  <div className={styles.heroInfoItem}>
                    <div className={styles.heroInfoLabel}><div className={styles.iconBg}><Globe size={12} /></div> Website</div>
                    {account.website ? (
                      <a href={account.website.startsWith('http') ? account.website : `https://${account.website}`} target="_blank" rel="noopener noreferrer" className={styles.heroInfoLink}>{account.website}</a>
                    ) : <span className={styles.heroInfoValue} style={{ color: '#94A3B8' }}>—</span>}
                  </div>
                  <div className={styles.heroInfoItem}>
                    <div className={styles.heroInfoLabel}><div className={styles.iconBg}><Phone size={12} /></div> Phone</div>
                    {(account.phone || primaryContact?.phone) ? (
                      <span className={styles.heroInfoValue}>{account.phone || primaryContact?.phone}</span>
                    ) : <span className={styles.heroInfoValue} style={{ color: '#94A3B8' }}>—</span>}
                  </div>
                  <div className={styles.heroInfoItem}>
                    <div className={styles.heroInfoLabel}><div className={styles.iconBg}><MapPin size={12} /></div> Country</div>
                    <span className={styles.heroInfoValue}>{account.country || 'India'} {account.country === 'India' || !account.country ? '🇮🇳' : ''}</span>
                  </div>
                  <div className={styles.heroInfoItem}>
                    <div className={styles.heroInfoLabel}><div className={styles.iconBg}><CircleDollarSign size={12} /></div> Currency</div>
                    <span className={styles.heroInfoValue}>{account.default_currency || 'USD'}</span>
                  </div>
                  <div className={styles.heroInfoItem}>
                    <div className={styles.heroInfoLabel}><div className={styles.iconBg}><Calendar size={12} /></div> Customer Since</div>
                    <span className={styles.heroInfoValue}>{formatDate(account.customer_since || account.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

              <div className={styles.quickActions}>
                <button className={styles.btnSecondary} onClick={openEdit}>
                  <Pencil size={14} /> Edit Account
                </button>
              </div>
          </div>
        
        {/* ══════ METRICS ROW (SEPARATE CARD) ══════ */}
        <div className={styles.metricsCard}>
          <div className={styles.metricBlock}>
            <div className={styles.metricIconBox} style={{ background: 'rgba(109,74,255,0.08)', color: '#6D4AFF' }}><Package size={14} /></div>
            <div>
              <div className={styles.metricLabel}>Total Shipments</div>
              <div className={styles.metricValue}>{totalShipments}</div>
              <div className={styles.metricTrend}>↑ 12% vs last month</div>
            </div>
          </div>
          <div className={styles.metricDivider}></div>
          <div className={styles.metricBlock}>
            <div className={styles.metricIconBox} style={{ background: 'rgba(16,185,129,0.08)', color: '#10B981' }}><CircleDollarSign size={14} /></div>
            <div>
              <div className={styles.metricLabel}>Expected Revenue</div>
              <div className={styles.metricValue}>${(expectedRevenue/1000).toFixed(0)}K</div>
              <div className={styles.metricTrend}>↑ 18% vs last month</div>
            </div>
          </div>
          <div className={styles.metricDivider}></div>
          <div className={styles.metricBlock}>
            <div className={styles.metricIconBox} style={{ background: 'rgba(109,74,255,0.08)', color: '#6D4AFF' }}><User size={14} /></div>
            <div>
              <div className={styles.metricLabel}>Contacts</div>
              <div className={styles.metricValue}>{contacts.length}</div>
              <div className={styles.metricTrend}>↑ 8% vs last month</div>
            </div>
          </div>
          <div className={styles.metricDivider}></div>
          <div className={styles.metricBlock}>
            <div className={styles.metricIconBox} style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B' }}><Target size={14} /></div>
            <div>
              <div className={styles.metricLabel}>Open Opportunities</div>
              <div className={styles.metricValue}>{openOpportunities}</div>
              <div className={styles.metricTrend}>↑ 14% vs last month</div>
            </div>
          </div>
        </div>
        </div>

        {/* ══════ 360 LAYOUT ══════ */}
        <div className={styles.layoutGrid}>
          {/* Sidebar Navigation */}
          <div className={styles.sidebarNav}>
            <button className={`${styles.navItem} ${activeTab === 'info' ? styles.active : ''}`} onClick={() => setActiveTab('info')}>
              <div className={styles.navItemLeft}><Building2 size={16} /> Overview</div>
            </button>
            <button className={`${styles.navItem} ${activeTab === 'contacts' ? styles.active : ''}`} onClick={() => setActiveTab('contacts')}>
              <div className={styles.navItemLeft}><Users size={16} /> Contacts</div>
              <span className={styles.navItemCount}>{contacts.length}</span>
            </button>
            <button className={`${styles.navItem} ${activeTab === 'opportunities' ? styles.active : ''}`} onClick={() => setActiveTab('opportunities')}>
              <div className={styles.navItemLeft}><Briefcase size={16} /> Opportunities</div>
              <span className={styles.navItemCount}>{opportunities.length}</span>
            </button>
            <button className={`${styles.navItem} ${activeTab === 'shipments' ? styles.active : ''}`} onClick={() => setActiveTab('shipments')}>
              <div className={styles.navItemLeft}><Package size={16} /> Shipments</div>
              <span className={styles.navItemCount}>{shipments.length}</span>
            </button>
            <button className={`${styles.navItem} ${activeTab === 'documents' ? styles.active : ''}`} onClick={() => setActiveTab('documents')}>
              <div className={styles.navItemLeft}><FileText size={16} /> Documents</div>
            </button>
            <button className={`${styles.navItem} ${activeTab === 'activity' ? styles.active : ''}`} onClick={() => setActiveTab('activity')}>
              <div className={styles.navItemLeft}><Activity size={16} /> Activity</div>
            </button>
          </div>

          {/* Content Area */}
          <div className={styles.contentSection}>
            
            {/* ── INFO TAB ── */}
            {activeTab === 'info' && (
              <div>
                {/* AI Executive Summary */}
                <AccountAISummary orgId={id} />
                <div style={{ height: '20px' }} />
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 className={styles.sectionTitle}>Account Information</h2>
                    <div className={styles.sectionSubtitle}>Core organizational details and settings.</div>
                  </div>
                  <button className={styles.btnSecondary} onClick={() => setIsEditing(true)}><Pencil size={14} /> Edit Information</button>
                </div>

                <div className={styles.infoCard}>
                  {/* Left List */}
                  <div className={styles.infoList}>
                    <div className={styles.infoRow}>
                      <div className={styles.infoRowIcon}><Building2 size={16} /></div>
                      <div className={styles.infoRowLabel}>Legal Name</div>
                      <div className={styles.infoRowValue}>{account.legal_name}</div>
                    </div>
                    
                    <div className={styles.infoRow}>
                      <div className={styles.infoRowIcon}><Package size={16} /></div>
                      <div className={styles.infoRowLabel}>Account Tier</div>
                      <div className={styles.infoRowValue}>{account.account_tier || '—'}</div>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoRowIcon}><Briefcase size={16} /></div>
                      <div className={styles.infoRowLabel}>Industry</div>
                      <div className={styles.infoRowValue}>{account.industry || '—'}</div>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoRowIcon}><Globe size={16} /></div>
                      <div className={styles.infoRowLabel}>Country</div>
                      <div className={styles.infoRowValue}>{account.country || '—'} {account.country === 'India' || !account.country ? '🇮🇳' : ''}</div>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoRowIcon}><User size={16} /></div>
                      <div className={styles.infoRowLabel}>Account Owner</div>
                      <div className={styles.infoRowValue}>
                        {account.owner_id === 'user-1' ? 'Alex Miller' : account.owner_id === 'user-2' ? 'Sarah Jenkins' : 'Unassigned'}
                      </div>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoRowIcon}><FileText size={16} /></div>
                      <div className={styles.infoRowLabel}>Tax ID</div>
                      <div className={styles.infoRowValue}>{account.tax_id || '—'}</div>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoRowIcon}><MapPin size={16} /></div>
                      <div className={styles.infoRowLabel}>Billing Address</div>
                      <div className={styles.infoRowValue}>{account.billing_address || '—'}</div>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoRowIcon}><CircleDollarSign size={16} /></div>
                      <div className={styles.infoRowLabel}>Default Currency</div>
                      <div className={styles.infoRowValue}>{account.default_currency || 'USD'}</div>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoRowIcon}><User size={16} /></div>
                      <div className={styles.infoRowLabel}>Primary Contact</div>
                      <div className={styles.infoRowValue}>
                        {primaryContact ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#14B8A6' }} onClick={() => router.push(`/crm/contacts/${primaryContact.contact_id}`)}>
                            {primaryContact.full_name || 'Primary Contact'} <ChevronRight size={14} />
                          </div>
                        ) : '—'}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ── CONTACTS TAB ── */}
            {activeTab === 'contacts' && (
              <div>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 className={styles.sectionTitle}>Contacts</h2>
                    <div className={styles.sectionSubtitle}>Customer points of contact.</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" style={{ color: '#6D4AFF', borderColor: 'rgba(109,74,255,0.2)' }} icon={Plus}>Add Contact</Button>
                    <button className={styles.paginationBtn} aria-label="Previous"><ChevronLeft size={16} /></button>
                    <button className={styles.paginationBtn} aria-label="Next"><ChevronRight size={16} /></button>
                  </div>
                </div>
                {contacts.length === 0 ? (
                  <div className={styles.emptyBlock}>
                    <Users size={32} className={styles.emptyBlockIcon} />
                    <div className={styles.emptyBlockText}>No contacts found</div>
                    <div className={styles.emptyBlockDesc}>Create a contact from the Contacts module.</div>
                  </div>
                ) : (
                  <div className={styles.gridCards}>
                    {contacts.map(c => (
                      <div key={c.contact_id} className={styles.cardItem} onClick={() => router.push(`/crm/contacts/${c.contact_id}`)}>
                        <div className={styles.cardHeader}>
                          <div className={styles.cardIdentity}>
                            <div className={`${styles.cardAvatar} ${c.is_primary ? styles.avatarPrimary : styles.avatarSecondary}`}>
                              {(c.full_name || c.first_name || '?').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className={styles.cardTitle}>{c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Contact'}</div>
                              <div className={styles.cardSubtitle}>{c.is_primary ? 'Primary Contact' : 'Contact'}</div>
                            </div>
                          </div>
                          <button className={styles.btnIcon} style={{ background: 'white', border: '1px solid rgba(16, 24, 40, 0.08)' }}><MoreVertical size={16} /></button>
                        </div>
                        <div className={styles.cardBody}>
                          {c.email && <div className={styles.cardRow}><div className={styles.cardRowIcon}><Mail size={14} /></div> {c.email}</div>}
                          {c.phone && <div className={styles.cardRow}><div className={styles.cardRowIcon}><Phone size={14} /></div> {c.phone}</div>}
                          {c.title && <div className={styles.cardRow}><div className={styles.cardRowIcon}><Briefcase size={14} /></div> {c.title}</div>}
                        </div>
                        <div className={styles.cardDivider}></div>
                        <div className={styles.cardFooter}>
                          View Contact <ChevronRight size={16} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── OPPORTUNITIES TAB ── */}
            {activeTab === 'opportunities' && (
              <div>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 className={styles.sectionTitle}>Opportunities</h2>
                    <div className={styles.sectionSubtitle}>Active and historical sales pipeline.</div>
                  </div>
                </div>
                {opportunities.length === 0 ? (
                  <div className={styles.emptyBlock}>
                    <Briefcase size={32} className={styles.emptyBlockIcon} />
                    <div className={styles.emptyBlockText}>No opportunities found</div>
                    <div className={styles.emptyBlockDesc}>Create an opportunity from the Pipeline module.</div>
                  </div>
                ) : (
                  <div className={styles.gridCards}>
                    {opportunities.map(o => {
                      const contactId = o.primary_contact_id || o.contact_id;
                      const contact = contactId ? getContact(contactId) : null;
                      return (
                      <div key={o.opportunity_id} className={`${styles.cardItem} ${styles.cardOpp}`} onClick={() => router.push(`/crm/pipeline/${o.opportunity_id}`)} style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                          
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(109,74,255,0.08)', color: '#6D4AFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Briefcase size={18} />
                                </div>
                                <div className={styles.cardTitle} style={{ fontSize: '16px', lineHeight: '1.3', margin: 0 }}>{o.name || o.title}</div>
                              </div>
                              {contact && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', marginLeft: '48px' }}>
                                  <User size={13} /> {contact.full_name}
                                </div>
                              )}
                            </div>
                            <Badge variant={o.stage === 'Won' ? 'success' : o.stage === 'Lost' ? 'danger' : 'primary'} size="small">{o.stage || o.status}</Badge>
                          </div>

                          <div className="gridAuto" style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', marginBottom: '20px', flexGrow: 1, border: '1px solid #F1F5F9' }}>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Est. Revenue</div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>{formatCurrency(o.pipeline_value || o.expected_revenue, o.currency_code || account.default_currency) || '—'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Probability</div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>{o.win_probability ? `${o.win_probability}%` : '—'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Target Close</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{o.expected_close_date ? formatDate(o.expected_close_date) : 'TBD'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Status</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{o.status || 'Active'}</div>
                            </div>
                          </div>
                        </div>

                        <div className={styles.cardFooter} style={{ margin: 0, padding: '16px 24px', background: '#F1F5F9', borderTop: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#6D4AFF', fontWeight: 700, fontSize: '13px', transition: 'background 0.2s' }}>
                          View Opportunity Details <ChevronRight size={16} />
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── SHIPMENTS TAB ── */}
            {activeTab === 'shipments' && (
              <div>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Shipments</h2>
                  <div className={styles.sectionSubtitle}>Logistics operations for this account.</div>
                </div>
                {shipments.length === 0 ? (
                  <div className={styles.emptyBlock}>
                    <Package size={32} className={styles.emptyBlockIcon} />
                    <div className={styles.emptyBlockText}>No shipments found</div>
                    <div className={styles.emptyBlockDesc}>This account does not have any shipments yet.</div>
                  </div>
                ) : (
                  <div>
                    {shipments.map(s => {
                      const isExpanded = expandedShipment === s.shipment_id;
                      const routeText = s.origin_airport && s.destination_airport 
                        ? <><span style={{fontFamily:'var(--font-mono)', color:'#0F172A'}}>{s.origin_airport}</span> <ChevronRight size={12} className={styles.routeArrow} /> <span style={{fontFamily:'var(--font-mono)', color:'#0F172A'}}>{s.destination_airport}</span></>
                        : 'Route TBD';
                        
                      return (
                        <div key={s.shipment_id} className={styles.premiumShipmentCard}>
                          <div className={styles.shipmentHeaderPremium} onClick={() => toggleShipment(s.shipment_id)}>
                            <div className={styles.shipmentMainInfo}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                  <span className={styles.shipmentRef}>{s.shipment_reference}</span>
                                  <div className={styles.transportBadge}>
                                    {s.transport_mode === 'SEA' ? '🚢 Sea Freight' : s.transport_mode === 'AIR' ? '✈ Air Freight' : s.transport_mode === 'ROAD' ? '🚚 Road Freight' : '🚂 Rail Freight'}
                                  </div>
                                  <Badge variant={getStatusColor(s.status)} className={s.status === 'Delivered' ? styles.pulseBadge : ''} dot>{s.status}</Badge>
                                </div>
                                <div className={styles.routeVis}>
                                  <span>{s.origin_airport || 'Origin'}</span>
                                  <div className={styles.routeLine}>
                                    <div className={styles.routePlane}>✈</div>
                                  </div>
                                  <span>{s.destination_airport || 'Destination'}</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{s.pieces} pcs</span>
                                <span style={{ fontSize: '12px', color: '#64748B' }}>{formatWeight(s.gross_weight_kg)}</span>
                              </div>
                              <ChevronRight size={20} className={`${styles.shipmentChevron} ${isExpanded ? styles.open : ''}`} />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className={styles.shipmentExpandedArea}>
                              
                              <div className={styles.shipmentMetricsPremium}>
                                <div className={styles.spMetric}>
                                  <span className={styles.metricLabel}>Date Created</span>
                                  <span className={styles.shipmentDetailValue}>{formatDate(s.created_at)}</span>
                                </div>
                                <div className={styles.spMetric}>
                                  <span className={styles.metricLabel}>Incoterm</span>
                                  <span className={styles.shipmentDetailValue}>{s.incoterm || '—'}</span>
                                </div>
                                <div className={styles.spMetric}>
                                  <span className={styles.metricLabel}>Service Level</span>
                                  <span className={styles.shipmentDetailValue}>{s.service_level || '—'}</span>
                                </div>
                                <div className={styles.spMetric}>
                                  <span className={styles.metricLabel}>Est. Revenue</span>
                                  <span className={styles.shipmentDetailValue}>{s.revenue ? formatCurrency(s.revenue, 'USD') : '—'}</span>
                                </div>
                              </div>

                              <div className={styles.insightBlock}>
                                <div className={styles.insightHeader}>
                                  <Activity size={14} /> Operational Insights
                                </div>
                                <ul className={styles.insightList}>
                                  <li><CheckCircle2 size={14} /> Shipment operations proceeding smoothly without delays</li>
                                  <li><CheckCircle2 size={14} /> Documentation requirements satisfied</li>
                                  {s.status === 'Delivered' && <li><CheckCircle2 size={14} /> Final mile delivery completed successfully</li>}
                                </ul>
                              </div>

                              <div 
                                className={styles.workspaceBtn}
                                onClick={(e) => { e.stopPropagation(); router.push(`/operations/shipments/${s.shipment_id}`); }}
                              >
                                Shipment Workspace <ArrowRight size={16} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── DOCUMENTS TAB ── */}
            {activeTab === 'documents' && (
              <div>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Documents</h2>
                  <div className={styles.sectionSubtitle}>Files and contracts associated with this account.</div>
                </div>
                <div className={styles.emptyBlock}>
                  <FileText size={32} className={styles.emptyBlockIcon} />
                  <div className={styles.emptyBlockText}>No documents uploaded</div>
                  <div className={styles.emptyBlockDesc}>Upload files to see them here.</div>
                </div>
              </div>
            )}

            {/* ── ACTIVITY TAB ── */}
            {activeTab === 'activity' && (
              <div>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Recent Activity</h2>
                  <div className={styles.sectionSubtitle}>Audit log and recent events.</div>
                </div>
                <div className={styles.timeline}>
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineIcon}><Package size={14} /></div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineTitle}>Shipment Delivered</div>
                      <div className={styles.timelineDesc}>Shipment SHP-2026-29895 has been marked as delivered.</div>
                      <div className={styles.timelineTime}>2 hours ago</div>
                    </div>
                  </div>
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineIcon}><Users size={14} /></div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineTitle}>Contact Added</div>
                      <div className={styles.timelineDesc}>Mohamed Waseem was added as Primary Contact.</div>
                      <div className={styles.timelineTime}>Yesterday</div>
                    </div>
                  </div>
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineIcon}><Briefcase size={14} /></div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineTitle}>Opportunity Won</div>
                      <div className={styles.timelineDesc}>Pentacloud Enterprise Contract closed won for $120,000.</div>
                      <div className={styles.timelineTime}>Aug 20, 2026</div>
                    </div>
                  </div>
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineIcon}><Building2 size={14} /></div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineTitle}>Account Created</div>
                      <div className={styles.timelineDesc}>Pentacloud was created in the system.</div>
                      <div className={styles.timelineTime}>Aug 15, 2026</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── EDIT ACCOUNT MODAL ── */}
      <Modal
        open={!!editForm}
        onClose={() => setEditForm(null)}
        title="Edit Account"
        subtitle="Update account details"
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditForm(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!editForm?.legal_name?.trim()} style={{ background: '#14B8A6', borderColor: '#14B8A6' }}>
              Save Changes
            </Button>
          </>
        }
      >
        {editForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Company Information */}
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company Information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Legal Name <span style={{ color: '#f43f5e' }}>*</span></label>
              <input type="text" value={editForm.legal_name} onChange={e => setEditForm(p => ({ ...p, legal_name: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16, 24, 40, 0.1)', fontSize: '14px' }} placeholder="Company legal name" />
            </div>
            <div className="form-row">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Industry</label>
                <input type="text" value={editForm.industry || ''} onChange={e => setEditForm(p => ({ ...p, industry: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16, 24, 40, 0.1)', fontSize: '14px' }} placeholder="e.g. Manufacturing, Tech" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Tax ID</label>
                <input type="text" value={editForm.tax_id || ''} onChange={e => setEditForm(p => ({ ...p, tax_id: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16, 24, 40, 0.1)', fontSize: '14px' }} placeholder="Tax / VAT ID" />
              </div>
            </div>
            <div className="form-row">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Organization Type</label>
                <select value={editForm.org_type || 'Customer'} onChange={e => setEditForm(p => ({ ...p, org_type: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16, 24, 40, 0.1)', fontSize: '14px', background: 'white' }}>
                  <option value="Customer">Customer</option>
                  <option value="Carrier">Carrier</option>
                  <option value="Vendor">Vendor</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Phone</label>
                <input type="text" value={editForm.phone || ''} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16, 24, 40, 0.1)', fontSize: '14px' }} placeholder="Main phone" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Website</label>
                <input type="text" value={editForm.website || ''} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16, 24, 40, 0.1)', fontSize: '14px' }} placeholder="https://..." />
              </div>
            </div>

            {/* Business Information */}
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Business Information</div>
            <div className="form-row">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Country</label>
                <input type="text" value={editForm.country || ''} onChange={e => setEditForm(p => ({ ...p, country: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16, 24, 40, 0.1)', fontSize: '14px' }} placeholder="e.g. US, DE, QA" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Default Currency</label>
                <select value={editForm.default_currency || 'USD'} onChange={e => setEditForm(p => ({ ...p, default_currency: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16, 24, 40, 0.1)', fontSize: '14px', background: 'white' }}>
                  {['USD','EUR','GBP','QAR','AED','SGD','JPY','INR','AUD','HKD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Account Tier</label>
                <select value={editForm.account_tier || 'Standard'} onChange={e => setEditForm(p => ({ ...p, account_tier: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16, 24, 40, 0.1)', fontSize: '14px', background: 'white' }}>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Account Owner</label>
                <select value={editForm.owner_id || 'user-1'} onChange={e => setEditForm(p => ({ ...p, owner_id: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16, 24, 40, 0.1)', fontSize: '14px', background: 'white' }}>
                  <option value="user-1">Alex Miller</option>
                  <option value="user-2">Sarah Jenkins</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Billing Address</label>
              <input type="text" value={editForm.billing_address || ''} onChange={e => setEditForm(p => ({ ...p, billing_address: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16, 24, 40, 0.1)', fontSize: '14px' }} placeholder="123 Main St, City, Country" />
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
