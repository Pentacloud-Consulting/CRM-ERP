'use client';
import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Users, Briefcase, Package, Navigation, Globe, Phone, FileText, ChevronRight, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate, formatWeight, formatCurrency, getStatusColor } from '@/lib/utils/formatters';
import styles from './detail.module.css';

export default function AccountDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, getContactsForOrg, getOpportunitiesForOrg, getShipmentsForOrg } = useApp();
  
  const [activeTab, setActiveTab] = useState('contacts');
  const [expandedShipment, setExpandedShipment] = useState(null);

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

  return (
    <div className={styles.pageWrapper} style={{ '--primary': '#14B8A6', '--primary-tint': 'rgba(20, 184, 166, 0.1)' }}>
      <div className={styles.page}>
        <div style={{ marginBottom: '24px' }}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/crm/accounts')}>Accounts</Button>
        </div>

        {/* ══════ HERO CARD ══════ */}
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.heroAvatar}>
              {(account.legal_name || '?').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className={styles.heroTitleRow}>
                <h1 className={styles.heroTitle}>{account.legal_name}</h1>
                <Badge variant={account.account_tier === 'Enterprise' ? 'primary' : account.account_tier === 'Premium' ? 'warning' : 'neutral'}>
                  {account.account_tier}
                </Badge>
              </div>
              <div className={styles.heroSubtitle}>
                <Building2 size={16} />
                <span>Account • {account.industry || 'No Industry'}</span>
              </div>
              
              <div className={styles.heroInfoGrid}>
                <div className={styles.heroInfoItem}>
                  <div className={styles.heroInfoLabel}><Globe size={14} /> Website</div>
                  {account.website ? (
                    <a href={account.website.startsWith('http') ? account.website : `https://${account.website}`} target="_blank" rel="noopener noreferrer" className={styles.heroInfoLink}>{account.website}</a>
                  ) : <span className={styles.heroInfoValue} style={{ color: 'var(--text-tertiary)' }}>—</span>}
                </div>
                <div className={styles.heroInfoItem}>
                  <div className={styles.heroInfoLabel}><Phone size={14} /> Phone</div>
                  {account.phone ? (
                    <a href={`tel:${account.phone}`} className={styles.heroInfoLink}>{account.phone}</a>
                  ) : <span className={styles.heroInfoValue} style={{ color: 'var(--text-tertiary)' }}>—</span>}
                </div>
                <div className={styles.heroInfoItem}>
                  <div className={styles.heroInfoLabel}><FileText size={14} /> Tax ID</div>
                  <span className={styles.heroInfoValue} style={{ fontFamily: 'var(--font-mono)' }}>{account.tax_id || '—'}</span>
                </div>
                <div className={styles.heroInfoItem}>
                  <div className={styles.heroInfoLabel}>Currency</div>
                  <span className={styles.heroInfoValue}>{account.default_currency || 'USD'}</span>
                </div>
                <div className={styles.heroInfoItem}>
                  <div className={styles.heroInfoLabel}>Country</div>
                  <span className={styles.heroInfoValue}>{account.country || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════ 360 LAYOUT ══════ */}
        <div className={styles.layoutGrid}>
          {/* Sidebar Navigation */}
          <div className={styles.sidebarNav}>
            <button className={`${styles.navItem} ${activeTab === 'info' ? styles.active : ''}`} onClick={() => setActiveTab('info')}>
              <div className={styles.navItemLeft}><Building2 size={16} /> Account Info</div>
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
          </div>

          {/* Content Area */}
          <div className={styles.contentSection}>
            
            {/* ── INFO TAB ── */}
            {activeTab === 'info' && (
              <div>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Account Information</h2>
                  <div className={styles.sectionSubtitle}>Core organizational details and settings.</div>
                </div>
                <table className={styles.tableView}>
                  <tbody>
                    <tr>
                      <td style={{ width: '30%', color: 'var(--text-tertiary)', fontWeight: 600 }}>Legal Name</td>
                      <td style={{ fontWeight: 600 }}>{account.legal_name}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Account Tier</td>
                      <td><Badge variant={account.account_tier === 'Enterprise' ? 'primary' : account.account_tier === 'Premium' ? 'warning' : 'neutral'} size="small">{account.account_tier}</Badge></td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Industry</td>
                      <td>{account.industry || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Country</td>
                      <td>{account.country || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Default Currency</td>
                      <td>{account.default_currency || 'USD'}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Primary Contact</td>
                      <td>
                        {primaryContact ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#14B8A6', fontWeight: 600 }} onClick={() => router.push(`/crm/contacts/${primaryContact.contact_id}`)}>
                            {primaryContact.full_name} <ChevronRight size={14} />
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* ── CONTACTS TAB ── */}
            {activeTab === 'contacts' && (
              <div>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Contacts</h2>
                  <div className={styles.sectionSubtitle}>Customer points of contact.</div>
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
                              {(c.full_name || '?').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className={styles.cardTitle}>{c.full_name}</div>
                              <div className={styles.cardSubtitle}>{c.is_primary ? 'Primary Contact' : 'Contact'}</div>
                            </div>
                          </div>
                        </div>
                        <div className={styles.cardBody}>
                          {c.email && <div className={styles.cardRow}><Mail size={14} /> {c.email}</div>}
                          {c.phone && <div className={styles.cardRow}><Phone size={14} /> {c.phone}</div>}
                          {c.title && <div className={styles.cardRow}><Briefcase size={14} /> {c.title}</div>}
                        </div>
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
                  <h2 className={styles.sectionTitle}>Opportunities</h2>
                  <div className={styles.sectionSubtitle}>Active and historical sales pipeline.</div>
                </div>
                {opportunities.length === 0 ? (
                  <div className={styles.emptyBlock}>
                    <Briefcase size={32} className={styles.emptyBlockIcon} />
                    <div className={styles.emptyBlockText}>No opportunities found</div>
                    <div className={styles.emptyBlockDesc}>Create an opportunity from the Pipeline module.</div>
                  </div>
                ) : (
                  <div className={styles.gridCards}>
                    {opportunities.map(o => (
                      <div key={o.opportunity_id} className={styles.cardItem} onClick={() => router.push(`/crm/pipeline/${o.opportunity_id}`)}>
                        <div className={styles.cardHeader} style={{ marginBottom: '12px' }}>
                          <div className={styles.cardTitle}>{o.name}</div>
                        </div>
                        <div className={styles.cardBody}>
                          <div className={styles.cardRow}>
                            <span style={{ width: '80px', color: 'var(--text-tertiary)' }}>Stage</span>
                            <Badge variant={o.status === 'Closed Won' ? 'success' : o.status === 'Closed Lost' ? 'danger' : 'primary'} size="small">{o.stage || o.status}</Badge>
                          </div>
                          <div className={styles.cardRow}>
                            <span style={{ width: '80px', color: 'var(--text-tertiary)' }}>Revenue</span>
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>{formatCurrency(o.expected_revenue, account.default_currency)}</span>
                          </div>
                        </div>
                        <div className={styles.cardFooter}>
                          View Opportunity <ChevronRight size={16} />
                        </div>
                      </div>
                    ))}
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
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
