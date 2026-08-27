'use client';
import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRightCircle, Check, AlertCircle, Building2, User, Briefcase, Lock, Target, Phone, Globe, Package, MapPin, Calendar, DollarSign, Anchor, FileText, ChevronRight, Mail } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate, formatDateTime, formatWeight, formatCurrency, getStatusColor } from '@/lib/utils/formatters';
import { LEAD_STATUSES, LOCATIONS } from '@/lib/data/seedData';
import { PlaneTakeoff, Ship, Truck } from 'lucide-react';
import { getLocationName, getLocationCountry } from '../page';
import styles from './detail.module.css';

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, dispatch, getOrganization, getContact, getOpportunity } = useApp();

  const lead = state.leads.find(l => l.lead_id === id);
  const [showConvert, setShowConvert] = useState(false);
  const [convertStep, setConvertStep] = useState(0); // 0: duplicate check, 1: field mapping, 2: confirm
  const [converting, setConverting] = useState(false);
  const [reuseAccountId, setReuseAccountId] = useState(null);
  const [accountData, setAccountData] = useState({ tax_id: '', country: '', phone: '', website: '', industry: '' });
  const [contactData, setContactData] = useState({ email: '', phone: '', title: '' });
  const [opportunityName, setOpportunityName] = useState('');

  const duplicateAccounts = useMemo(() => {
    if (!lead) return [];
    return state.organizations.filter(o => o.legal_name.toLowerCase().includes(lead.company_name.toLowerCase()));
  }, [lead, state.organizations]);

  if (!lead) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.page}>
          <Link href="/crm/leads" className={styles.backLink}>
            <ArrowLeft size={16} /> Leads
          </Link>
          <div className={styles.notFound}>Lead not found</div>
        </div>
      </div>
    );
  }

  const isConverted = !!lead.converted_at;
  const canConvert = lead.status === 'Qualified' && !isConverted;

  const handleStartConvert = () => {
    setOpportunityName(`${lead.company_name} — Freight Opportunity`);
    setAccountData({ tax_id: '', country: lead.country || '', phone: lead.phone || '', website: lead.website || '', industry: lead.industry || '' });
    setContactData({ email: lead.email || '', phone: lead.contact_phone || lead.phone || '', title: lead.job_title || '' });
    setConvertStep(duplicateAccounts.length > 0 ? 0 : 1);
    setReuseAccountId(null);
    setShowConvert(true);
  };

  const handleConvert = () => {
    setConverting(true);
    setTimeout(() => {
      dispatch({
        type: 'CONVERT_LEAD',
        payload: {
          lead_id: lead.lead_id,
          organization: { ...accountData, legal_name: lead.company_name },
          contact: { 
            ...contactData, 
            full_name: lead.full_name || 'Primary Contact',
            is_primary: true
          },
          opportunity: { name: opportunityName },
          reuseOrgId: reuseAccountId,
        },
      });
      setConverting(false);
      setShowConvert(false);
    }, 800);
  };

  const handleStatusChange = (newStatus) => {
    if (isConverted) return;
    dispatch({ type: 'UPDATE_LEAD', payload: { lead_id: lead.lead_id, status: newStatus } });
  };

  const convertedAccount = lead.converted_org_id ? getOrganization(lead.converted_org_id) : null;
  const convertedContact = lead.converted_contact_id ? getContact(lead.converted_contact_id) : null;
  const convertedOpp = lead.converted_opportunity_id ? getOpportunity(lead.converted_opportunity_id) : null;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.page}>
        <Link href="/crm/leads" className={styles.backLink}>
          <ArrowLeft size={16} /> Leads
        </Link>

        {/* ══════ SUCCESS CONVERSION BANNER ══════ */}
        {isConverted && (
          <div className={styles.successBanner}>
            <div className={styles.successBannerLeft}>
              <div className={styles.successIconBadge}><Check size={20} strokeWidth={3} /></div>
              <div className={styles.successBannerText}>
                <h2 className={styles.successTitle}>Lead Converted Successfully</h2>
                <p className={styles.successSubtext}>{lead.company_name} is now an active organization.</p>
              </div>
            </div>
            <Button variant="outline" className={styles.successBannerCta} onClick={() => router.push(`/crm/accounts/${lead.converted_org_id}`)}>View Organization</Button>
          </div>
        )}

        {/* ══════ HERO CARD ══════ */}
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.heroAvatar}>
              <div className={styles.heroAvatarInner}>
                <Target size={28} />
              </div>
            </div>
            <div>
              <div className={styles.heroTitleRow}>
                <h1 className={styles.heroTitle}>{lead.company_name}</h1>
                <div className={styles.statusPillWrapper}>
                  <Badge variant={getStatusColor(lead.status)} dot>{lead.status}</Badge>
                </div>
              </div>
              <div className={styles.heroMeta}>
                <div className={styles.heroMetaItem}><Globe size={14} className={styles.metaIcon} /> {lead.source}</div>
                <div className={styles.metaDivider}>•</div>
                <div className={styles.heroMetaItem}><Calendar size={14} className={styles.metaIcon} /> Created {formatDate(lead.created_at)}</div>
              </div>
            </div>
          </div>
          <div className={styles.heroRight}>
            {!isConverted && lead.status !== 'Converted' && (
              <select
                className={styles.statusSelect}
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                {LEAD_STATUSES.filter(s => s !== 'Converted').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
            {canConvert && (
              <Button icon={ArrowRightCircle} onClick={handleStartConvert} size="large">
                Convert Lead
              </Button>
            )}
            {isConverted && (
              <div className={styles.convertedBadge}>
                <Lock size={14} className={styles.convertedLockIcon} /> Converted {formatDate(lead.converted_at)}
              </div>
            )}
          </div>
        </div>

        <div className={styles.detailGrid}>
          {/* ══════ COMPANY & CONTACT ══════ */}
          <div className={styles.reqCard}>
            <div className={styles.cardHeader}>
              <User size={16} color="#6A4CFF" />
              <h2 className={styles.cardTitle}>Company & Contact</h2>
            </div>
            <div className={styles.reqGrid}>
              <div className={styles.reqItem}>
                <div className={styles.reqLabel}><div className={styles.reqIconBg}><Building2 size={12} className={styles.reqLabelIcon} /></div> Company Name</div>
                <div className={styles.reqValue}>{lead.company_name}</div>
              </div>
              <div className={styles.reqItem}>
                <div className={styles.reqLabel}><div className={styles.reqIconBg}><User size={12} className={styles.reqLabelIcon} /></div> Full Name</div>
                <div className={styles.reqValue}>{lead.full_name || '—'}</div>
              </div>
              <div className={styles.reqItem}>
                <div className={styles.reqLabel}><div className={styles.reqIconBg}><Phone size={12} className={styles.reqLabelIcon} /></div> Phone Number</div>
                <div className={styles.reqValue}>{lead.phone || '—'}</div>
              </div>
              <div className={styles.reqItem}>
                <div className={styles.reqLabel}><div className={styles.reqIconBg}><Mail size={12} className={styles.reqLabelIcon} /></div> Email Address</div>
                <div className={styles.reqValue}>{lead.email || '—'}</div>
              </div>
            </div>
          </div>

          {/* ══════ OWNERSHIP & QUALIFICATION ══════ */}
          <div className={styles.reqCard}>
            <div className={styles.cardHeader}>
              <Briefcase size={16} color="#6A4CFF" />
              <h2 className={styles.cardTitle}>Ownership & Qualification</h2>
            </div>
            <div className={styles.reqGrid}>
              <div className={styles.reqItem}>
                <div className={styles.reqLabel}><div className={styles.reqIconBg}><User size={12} className={styles.reqLabelIcon} /></div> Lead Owner</div>
                <div className={styles.reqValue}>{lead.owner_id === 'user-1' ? 'Alex Miller' : lead.owner_id === 'user-2' ? 'Sarah Jenkins' : 'Unassigned'}</div>
              </div>
              <div className={styles.reqItem}>
                <div className={styles.reqLabel}><div className={styles.reqIconBg}><Target size={12} className={styles.reqLabelIcon} /></div> Status</div>
                <div className={styles.reqValue}>{lead.status}</div>
              </div>
              <div className={styles.reqItem}>
                <div className={styles.reqLabel}><div className={styles.reqIconBg}><Globe size={12} className={styles.reqLabelIcon} /></div> Lead Source</div>
                <div className={styles.reqValue}>{lead.source}</div>
              </div>
            </div>
          </div>

          {/* ══════ LEAD REQUIREMENTS ══════ */}
          <div className={styles.reqCard} style={{ gridColumn: '1 / -1' }}>
            <div className={styles.cardHeader}>
              <FileText size={16} color="#6A4CFF" />
              <h2 className={styles.cardTitle}>Lead Requirements</h2>
            </div>
            <div className={styles.reqGrid} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className={`${styles.reqItem} ${styles.reqItemHighlight}`} style={{ gridColumn: 'span 2' }}>
                <div className={styles.reqLabel}><div className={styles.reqIconBg}><Anchor size={12} className={styles.reqLabelIcon} /></div> Route & Mode</div>
                <div className={styles.reqTradeLane}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#14B8A6', background: 'rgba(20, 184, 166, 0.1)', padding: '4px 10px', borderRadius: '16px', fontSize: '12px' }}>
                    {lead.transport_mode === 'SEA' ? <Ship size={12} /> : lead.transport_mode === 'ROAD' ? <Truck size={12} /> : <PlaneTakeoff size={12} />}
                    <span style={{ fontWeight: 700 }}>{lead.transport_mode || 'AIR'}</span>
                  </div>
                  <div className={styles.metaDivider}>•</div>
                  {(lead.origin_location || lead.destination_location) ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {getLocationName(lead.origin_location)} <span className={styles.tradeLaneArrow}>→</span> {getLocationName(lead.destination_location)}
                      </div>
                      {(() => {
                        const o = getLocationCountry(lead.origin_location);
                        const d = getLocationCountry(lead.destination_location);
                        if (o && d) {
                          return <Badge variant={o === d ? 'neutral' : 'primary'} dot>{o === d ? 'Domestic' : 'International'}</Badge>;
                        }
                        return null;
                      })()}
                    </>
                  ) : <span className={styles.reqValue}>—</span>}
                </div>
              </div>
              <div className={styles.reqItem}>
                <div className={styles.reqLabel}><div className={styles.reqIconBg}><Package size={12} className={styles.reqLabelIcon} /></div> Cargo Type</div>
                <div className={styles.reqValue}>{lead.cargo_type || '—'}</div>
              </div>
              <div className={styles.reqItem}>
                <div className={styles.reqLabel}><div className={styles.reqIconBg}><MapPin size={12} className={styles.reqLabelIcon} /></div> Incoterm</div>
                <div className={styles.reqValue}>{lead.incoterm || '—'}</div>
              </div>
              <div className={styles.reqItem}>
                <div className={styles.reqLabel}><div className={styles.reqIconBg}><Package size={12} className={styles.reqLabelIcon} /></div> Est. Weight</div>
                <div className={styles.reqValue} style={{ fontFamily: 'var(--font-mono)' }}>{lead.est_gross_weight_kg ? formatWeight(lead.est_gross_weight_kg) : '—'}</div>
              </div>
              <div className={styles.reqItem}>
                <div className={styles.reqLabel}><div className={styles.reqIconBg}><Package size={12} className={styles.reqLabelIcon} /></div> Volume / CBM</div>
                <div className={styles.reqValue} style={{ fontFamily: 'var(--font-mono)' }}>{lead.volume_cbm ? `${lead.volume_cbm} CBM` : '—'}</div>
              </div>
              <div className={styles.reqItem}>
                <div className={styles.reqLabel}><div className={styles.reqIconBg}><Package size={12} className={styles.reqLabelIcon} /></div> Pieces</div>
                <div className={styles.reqValue}>{lead.est_pieces || '—'}</div>
              </div>
              <div className={styles.reqItem}>
                <div className={styles.reqLabel}><div className={styles.reqIconBg}><DollarSign size={12} className={styles.reqLabelIcon} /></div> Est. Value</div>
                <div className={styles.reqValue} style={{ fontFamily: 'var(--font-mono)' }}>{lead.pipeline_value ? formatCurrency(lead.pipeline_value, lead.currency_code) : '—'}</div>
              </div>
              <div className={styles.reqItem}>
                <div className={styles.reqLabel}><div className={styles.reqIconBg}><Calendar size={12} className={styles.reqLabelIcon} /></div> Cargo Ready Date</div>
                <div className={styles.reqValue}>{lead.cargo_ready_date ? formatDate(lead.cargo_ready_date) : '—'}</div>
              </div>
            </div>
          </div>

          {/* ══════ CONVERSION DETAILS ══════ */}
          {isConverted && (
            <div className={styles.reqCard}>
              <div className={styles.cardHeader}>
                <Check size={18} color="#14B8A6" />
                <h2 className={styles.cardTitle}>Conversion Details</h2>
              </div>
              <div className={styles.conversionResults}>
                <div className={styles.conversionItem} onClick={() => router.push(`/crm/accounts/${convertedAccount?.org_id || ''}`)}>
                  <div className={styles.conversionItemLeft}>
                    <div className={`${styles.conversionIcon} ${styles.iconOrg}`}><Building2 size={18} /></div>
                    <div className={styles.conversionTextWrapper}>
                      <div className={styles.conversionLabel}>Organization</div>
                      <div className={styles.conversionValue}>{convertedAccount?.legal_name || lead.converted_org_id}</div>
                    </div>
                  </div>
                  <ChevronRight className={styles.conversionArrow} size={18} />
                </div>
                
                <div className={styles.conversionItem} onClick={() => router.push(`/crm/contacts/${convertedContact?.contact_id || ''}`)}>
                  <div className={styles.conversionItemLeft}>
                    <div className={`${styles.conversionIcon} ${styles.iconContact}`}><User size={18} /></div>
                    <div className={styles.conversionTextWrapper}>
                      <div className={styles.conversionLabel}>Contact</div>
                      <div className={styles.conversionValue}>{convertedContact?.full_name || lead.converted_contact_id}</div>
                    </div>
                  </div>
                  <ChevronRight className={styles.conversionArrow} size={18} />
                </div>
                
                <div className={styles.conversionItem} onClick={() => router.push(`/crm/pipeline/${convertedOpp?.opportunity_id || ''}`)}>
                  <div className={styles.conversionItemLeft}>
                    <div className={`${styles.conversionIcon} ${styles.iconOpp}`}><Briefcase size={18} /></div>
                    <div className={styles.conversionTextWrapper}>
                      <div className={styles.conversionLabel}>Opportunity</div>
                      <div className={styles.conversionValue}>{convertedOpp?.name || lead.converted_opportunity_id}</div>
                    </div>
                  </div>
                  <ChevronRight className={styles.conversionArrow} size={18} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════ CONVERT MODAL ══════ */}
      <Modal
        open={showConvert}
        onClose={() => setShowConvert(false)}
        title="Convert Lead"
        subtitle="Create Account, Contact, and Opportunity"
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              if (convertStep > 0) setConvertStep(convertStep - 1);
              else setShowConvert(false);
            }}>
              {convertStep > 0 ? 'Back' : 'Cancel'}
            </Button>
            {convertStep < 2 ? (
              <Button onClick={() => setConvertStep(convertStep + 1)}>
                Next
              </Button>
            ) : (
              <Button onClick={handleConvert} loading={converting} icon={Check}>
                Convert Lead
              </Button>
            )}
          </>
        }
      >
        <div className={styles.steps}>
          <div className={`${styles.step} ${convertStep >= 0 ? styles.stepActive : ''}`}>
            <span className={styles.stepNum}>{convertStep > 0 ? '✓' : '1'}</span>
            <span>Duplicate Check</span>
          </div>
          <div className={styles.stepConnector} />
          <div className={`${styles.step} ${convertStep >= 1 ? styles.stepActive : ''}`}>
            <span className={styles.stepNum}>{convertStep > 1 ? '✓' : '2'}</span>
            <span>Field Mapping</span>
          </div>
          <div className={styles.stepConnector} />
          <div className={`${styles.step} ${convertStep >= 2 ? styles.stepActive : ''}`}>
            <span className={styles.stepNum}>3</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Step 0: Duplicate check */}
        {convertStep === 0 && (
          <div className={styles.convertSection}>
            <h4>Account Duplicate Check</h4>
            {duplicateAccounts.length > 0 ? (
              <>
                <div className={styles.duplicateWarning}>
                  <AlertCircle size={16} />
                  <span>Found {duplicateAccounts.length} potential match(es). Link to existing or create new.</span>
                </div>
                {duplicateAccounts.map(acc => (
                  <div
                    key={acc.org_id}
                    className={`${styles.duplicateItem} ${reuseAccountId === acc.org_id ? styles.selected : ''}`}
                    onClick={() => setReuseAccountId(reuseAccountId === acc.org_id ? null : acc.org_id)}
                  >
                    <div className={styles.dupCheck}>
                      <Check size={14} />
                    </div>
                    <div>
                      <div className={styles.dupName}>{acc.legal_name}</div>
                      <div className={styles.dupDetail}>{acc.country} · {acc.account_tier} · {acc.tax_id}</div>
                    </div>
                  </div>
                ))}
                <div className={styles.dupNote}>
                  {reuseAccountId ? 'Will link to the selected existing account' : 'Will create a new account'}
                </div>
              </>
            ) : (
              <div className={styles.noDuplicates}>
                <Check size={18} />
                <span>No duplicate accounts found. A new account will be created automatically.</span>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Field mapping */}
        {convertStep === 1 && (
          <div className={styles.convertSection}>
            <h4>Field Mapping Preview</h4>
            <div className={styles.mappingGrid}>
              <div className={styles.mappingSection}>
                <h5><Building2 size={16} /> Account</h5>
                <div className={styles.mappingRow}>
                  <span className={styles.mappingFrom}>company_name</span>
                  <span className={styles.mappingArrow}>→</span>
                  <span className={styles.mappingTo}>{lead.company_name}</span>
                </div>
                <div className={styles.mappingRow}>
                  <span className={styles.mappingFrom}>account_tier</span>
                  <span className={styles.mappingArrow}>→</span>
                  <span className={styles.mappingTo}>Standard (default)</span>
                </div>
                <div className={styles.mappingRow}>
                  <span className={styles.mappingFrom}>currency</span>
                  <span className={styles.mappingArrow}>→</span>
                  <span className={styles.mappingTo}>{lead.currency_code}</span>
                </div>
              </div>
              <div className={styles.mappingSection}>
                <h5><User size={16} /> Contact</h5>
                <div className={styles.mappingRow}>
                  <span className={styles.mappingFrom}>full_name</span>
                  <span className={styles.mappingArrow}>→</span>
                  <span className={styles.mappingTo}>{lead.full_name || 'Primary Contact'}</span>
                </div>
                <div className="form-row" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={contactData.email} onChange={e => setContactData(p => ({ ...p, email: e.target.value }))} placeholder="email@company.com" />
                  </div>
                </div>
              </div>
              <div className={styles.mappingSection}>
                <h5><Briefcase size={16} /> Opportunity</h5>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Opportunity Name</label>
                  <input className="form-input" value={opportunityName} onChange={e => setOpportunityName(e.target.value)} />
                </div>
                <div className={styles.mappingRow}>
                  <span className={styles.mappingFrom}>stage</span>
                  <span className={styles.mappingArrow}>→</span>
                  <span className={styles.mappingTo}>Qualifying (default)</span>
                </div>
                <div className={styles.mappingRow}>
                  <span className={styles.mappingFrom}>pipeline_value</span>
                  <span className={styles.mappingArrow}>→</span>
                  <span className={styles.mappingTo}>{formatCurrency(lead.pipeline_value, lead.currency_code)}</span>
                </div>
                <div className={styles.mappingRow}>
                  <span className={styles.mappingFrom}>trade_lane / cargo</span>
                  <span className={styles.mappingArrow}>→</span>
                  <span className={styles.mappingTo}>{lead.trade_lane} / {lead.cargo_type}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Confirm */}
        {convertStep === 2 && (
          <div className={styles.convertSection}>
            <h4>Confirm Conversion</h4>
            <div className={styles.confirmSummary}>
              <div className={styles.confirmItem}>
                <Building2 size={18} />
                <span>{reuseAccountId ? `Link to existing: ${state.organizations.find(a => a.org_id === reuseAccountId)?.legal_name}` : `Create new Organization: ${lead.company_name}`}</span>
              </div>
              <div className={styles.confirmItem}>
                <User size={18} />
                <span>Create Contact: {lead.full_name || 'Primary Contact'} (Primary)</span>
              </div>
              <div className={styles.confirmItem}>
                <Briefcase size={18} />
                <span>Create Opportunity: {opportunityName}</span>
              </div>
            </div>
            <div className={styles.confirmNote}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>This action is permanent.</strong>
                The lead will be marked as Converted and cannot be reconverted. All three records will be created simultaneously in a single transaction.
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
