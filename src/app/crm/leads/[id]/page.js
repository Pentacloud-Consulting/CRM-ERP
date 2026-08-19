'use client';
import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRightCircle, Check, AlertCircle, Building2, User, Briefcase, Lock } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate, formatDateTime, formatWeight, formatCurrency, getStatusColor } from '@/lib/utils/formatters';
import { LEAD_STATUSES } from '@/lib/data/seedData';
import styles from './detail.module.css';

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, dispatch, findDuplicateAccounts, getAccount, getContact, getOpportunity } = useApp();

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
    return findDuplicateAccounts(lead.company_name, '');
  }, [lead, findDuplicateAccounts]);

  if (!lead) {
    return (
      <div className={styles.page}>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/crm/leads')}>Back to Leads</Button>
        <div className={styles.notFound}>Lead not found</div>
      </div>
    );
  }

  const isConverted = !!lead.converted_at;
  const canConvert = lead.status === 'Qualified' && !isConverted;

  const handleStartConvert = () => {
    setOpportunityName(`${lead.company_name} — ${lead.trade_lane}`);
    setConvertStep(duplicateAccounts.length > 0 ? 0 : 1);
    setReuseAccountId(null);
    setShowConvert(true);
  };

  const handleConvert = () => {
    setConverting(true);
    // Simulate atomic transaction
    setTimeout(() => {
      dispatch({
        type: 'CONVERT_LEAD',
        payload: {
          lead_id: lead.lead_id,
          account: { ...accountData, legal_name: lead.company_name },
          contact: { ...contactData, full_name: lead.contact_name },
          opportunity: { name: opportunityName },
          reuseAccountId,
        },
      });
      setConverting(false);
      setShowConvert(false);
      // Find the new opportunity and navigate
      setTimeout(() => {
        const updatedLead = state.leads.find(l => l.lead_id === lead.lead_id);
        router.push('/crm/pipeline');
      }, 100);
    }, 800);
  };

  const handleStatusChange = (newStatus) => {
    if (isConverted) return;
    dispatch({ type: 'UPDATE_LEAD', payload: { lead_id: lead.lead_id, status: newStatus } });
  };

  const convertedAccount = lead.converted_account_id ? getAccount(lead.converted_account_id) : null;
  const convertedContact = lead.converted_contact_id ? getContact(lead.converted_contact_id) : null;
  const convertedOpp = lead.converted_opportunity_id ? getOpportunity(lead.converted_opportunity_id) : null;

  return (
    <div className={styles.page}>
      <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/crm/leads')}>Back to Leads</Button>

      <div className={styles.detailHeader}>
        <div className={styles.detailTitle}>
          <h1>{lead.company_name}</h1>
          <Badge variant={getStatusColor(lead.status)} dot>{lead.status}</Badge>
        </div>
        <div className={styles.detailActions}>
          {!isConverted && lead.status !== 'Converted' && (
            <select
              className="form-select"
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{ width: 160 }}
            >
              {LEAD_STATUSES.filter(s => s !== 'Converted').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          {canConvert && (
            <Button icon={ArrowRightCircle} onClick={handleStartConvert}>
              Convert to Opportunity
            </Button>
          )}
          {isConverted && (
            <Button variant="secondary" disabled icon={Lock}>
              Converted {formatDate(lead.converted_at)}
            </Button>
          )}
        </div>
      </div>

      <div className={styles.detailGrid}>
        {/* Lead Info */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Lead Information</h3>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Contact Name</span>
              <span className={styles.fieldValue}>{lead.contact_name}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Source</span>
              <span className={styles.fieldValue}>{lead.source}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Trade Lane</span>
              <span className={`${styles.fieldValue} ${styles.tradeLane}`}>{lead.trade_lane}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Cargo Type</span>
              <span className={styles.fieldValue}>{lead.cargo_type}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Incoterm</span>
              <span className={styles.fieldValue}>{lead.incoterm}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Est. Chargeable Weight</span>
              <span className={`${styles.fieldValue} tabular-nums`}>{formatWeight(lead.est_chargeable_weight_kg)}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Estimated Value</span>
              <span className={`${styles.fieldValue} tabular-nums`}>{formatCurrency(lead.estimated_value, lead.currency_code)}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Currency</span>
              <span className={styles.fieldValue}>{lead.currency_code}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Created</span>
              <span className={styles.fieldValue}>{formatDateTime(lead.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Conversion Details (if converted) */}
        {isConverted && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Conversion Details</h3>
            <div className={styles.conversionResults}>
              <div className={styles.conversionItem} onClick={() => router.push('/crm/accounts')}>
                <div className={styles.conversionIcon}><Building2 size={16} /></div>
                <div>
                  <div className={styles.conversionLabel}>Account</div>
                  <div className={styles.conversionValue}>{convertedAccount?.legal_name || lead.converted_account_id}</div>
                </div>
              </div>
              <div className={styles.conversionItem} onClick={() => router.push('/crm/contacts')}>
                <div className={styles.conversionIcon}><User size={16} /></div>
                <div>
                  <div className={styles.conversionLabel}>Contact</div>
                  <div className={styles.conversionValue}>{convertedContact?.full_name || lead.converted_contact_id}</div>
                </div>
              </div>
              <div className={styles.conversionItem} onClick={() => router.push('/crm/pipeline')}>
                <div className={styles.conversionIcon}><Briefcase size={16} /></div>
                <div>
                  <div className={styles.conversionLabel}>Opportunity</div>
                  <div className={styles.conversionValue}>{convertedOpp?.name || lead.converted_opportunity_id}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Convert Modal */}
      <Modal
        open={showConvert}
        onClose={() => setShowConvert(false)}
        title="Convert Lead to Opportunity"
        subtitle={`${lead.company_name} — ${lead.trade_lane}`}
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
        {/* Step indicators */}
        <div className={styles.steps}>
          <div className={`${styles.step} ${convertStep >= 0 ? styles.stepActive : ''}`}>
            <span className={styles.stepNum}>1</span>
            <span>Duplicate Check</span>
          </div>
          <div className={styles.stepConnector} />
          <div className={`${styles.step} ${convertStep >= 1 ? styles.stepActive : ''}`}>
            <span className={styles.stepNum}>2</span>
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
                    key={acc.account_id}
                    className={`${styles.duplicateItem} ${reuseAccountId === acc.account_id ? styles.selected : ''}`}
                    onClick={() => setReuseAccountId(reuseAccountId === acc.account_id ? null : acc.account_id)}
                  >
                    <div className={styles.dupCheck}>
                      {reuseAccountId === acc.account_id && <Check size={14} />}
                    </div>
                    <div>
                      <div className={styles.dupName}>{acc.legal_name}</div>
                      <div className={styles.dupDetail}>{acc.country} · {acc.account_tier} · {acc.tax_id}</div>
                    </div>
                  </div>
                ))}
                <p className={styles.dupNote}>
                  {reuseAccountId ? 'Will link to the selected existing account' : 'Will create a new account'}
                </p>
              </>
            ) : (
              <div className={styles.noDuplicates}>
                <Check size={16} />
                <span>No duplicate accounts found. A new account will be created.</span>
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
                <h5><Building2 size={14} /> Account</h5>
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
                <h5><User size={14} /> Contact</h5>
                <div className={styles.mappingRow}>
                  <span className={styles.mappingFrom}>contact_name</span>
                  <span className={styles.mappingArrow}>→</span>
                  <span className={styles.mappingTo}>{lead.contact_name}</span>
                </div>
                <div className="form-row" style={{ marginTop: '8px' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={contactData.email} onChange={e => setContactData(p => ({ ...p, email: e.target.value }))} placeholder="email@company.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input className="form-input" value={contactData.title} onChange={e => setContactData(p => ({ ...p, title: e.target.value }))} placeholder="Job title" />
                  </div>
                </div>
              </div>
              <div className={styles.mappingSection}>
                <h5><Briefcase size={14} /> Opportunity</h5>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label">Opportunity Name (editable)</label>
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
                  <span className={styles.mappingTo}>{formatCurrency(lead.estimated_value, lead.currency_code)}</span>
                </div>
                <div className={styles.mappingRow}>
                  <span className={styles.mappingFrom}>trade_lane / cargo / incoterm / weight</span>
                  <span className={styles.mappingArrow}>→</span>
                  <span className={styles.mappingTo}>{lead.trade_lane} / {lead.cargo_type} / {lead.incoterm} / {formatWeight(lead.est_chargeable_weight_kg)}</span>
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
                <Building2 size={16} />
                <span>{reuseAccountId ? `Link to existing: ${state.accounts.find(a => a.account_id === reuseAccountId)?.legal_name}` : `Create new Account: ${lead.company_name}`}</span>
              </div>
              <div className={styles.confirmItem}>
                <User size={16} />
                <span>Create Contact: {lead.contact_name} (Primary)</span>
              </div>
              <div className={styles.confirmItem}>
                <Briefcase size={16} />
                <span>Create Opportunity: {opportunityName}</span>
              </div>
            </div>
            <div className={styles.confirmNote}>
              <AlertCircle size={14} />
              <span>This action is permanent. The lead will be marked as Converted and cannot be reconverted. All three records will be created in a single atomic transaction.</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
