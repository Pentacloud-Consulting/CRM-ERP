'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store/AppContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import { Plus, Eye, Edit2, Trash2, ChevronRight, Building2, User, LayoutGrid, List } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import AsyncLocationSelect from '@/components/ui/AsyncLocationSelect';
import { OPPORTUNITY_STAGES, CARGO_TYPES, INCOTERMS, INCOTERM_LABELS, TRANSPORT_MODES, LEAD_SOURCES, LEAD_STATUSES } from '@/lib/data/seedData';
import styles from './pipeline.module.css';

const EMPTY_OPP = {
  name: '', org_id: '', primary_contact_id: '', pipeline_value: '', currency_code: 'USD',
  stage: 'Qualifying', source: '', status: 'New', transport_mode: 'ROAD', route_type: 'Domestic',
  origin_location: '', destination_location: '', cargo_type: 'General', incoterm: 'CPT',
  est_pieces: '', est_gross_weight_kg: ''
};

const getLocationName = (loc) => {
  if (!loc) return '';
  if (typeof loc === 'object') return loc.name || loc.code || '';
  try {
    const parsed = JSON.parse(loc);
    return parsed.name || parsed.code || loc;
  } catch {
    return loc;
  }
};

export default function PipelinePage() {
  const router = useRouter();
  const { state, dispatch, getOrganization, getContact } = useApp();
  
  const [showNew, setShowNew] = useState(false);
  const [editingOppId, setEditingOppId] = useState(null);
  const [newOpp, setNewOpp] = useState({ ...EMPTY_OPP });
  
  const [viewMode, setViewMode] = useState('list');
  
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [mobileTab, setMobileTab] = useState(OPPORTUNITY_STAGES[0]);

  const normalizedOpportunities = useMemo(() => {
    return state.opportunities;
  }, [state.opportunities]);

  // ──────── KPIs ────────
  const kpis = useMemo(() => {
    let openCount = 0;
    let wonCount = 0;
    let lostCount = 0;
    let totalValue = 0;

    normalizedOpportunities.forEach(o => {
      if (o.stage === 'Won') wonCount++;
      else if (o.stage === 'Lost') lostCount++;
      else {
        openCount++;
        totalValue += parseFloat(o.pipeline_value || 0);
      }
    });

    return {
      total: normalizedOpportunities.length,
      open: openCount,
      won: wonCount,
      lost: lostCount,
      value: totalValue,
      avgSize: openCount > 0 ? (totalValue / openCount) : 0
    };
  }, [normalizedOpportunities]);

  const stageData = useMemo(() => {
    return OPPORTUNITY_STAGES.map(stage => {
      const opps = normalizedOpportunities.filter(o => o.stage === stage);
      return {
        stage,
        opportunities: opps,
        totalValue: opps.reduce((s, o) => s + parseFloat(o.pipeline_value || 0), 0),
        conversion: opps.length > 0 && kpis.open > 0 ? Math.round((opps.length / kpis.open) * 100) : 0
      };
    });
  }, [normalizedOpportunities, kpis.open]);

  // Premium stage colors map
  const stageColors = {
    'Qualifying': { hex: '#3B82F6', rgba: 'rgba(59, 130, 246, 0.03)' },
    'Proposal': { hex: '#8B5CF6', rgba: 'rgba(139, 92, 246, 0.03)' },
    'Negotiation': { hex: '#F59E0B', rgba: 'rgba(245, 158, 11, 0.03)' },
    'Won': { hex: '#10B981', rgba: 'rgba(16, 185, 129, 0.03)' },
    'Lost': { hex: '#EF4444', rgba: 'rgba(239, 68, 68, 0.03)' },
  };

  // ──────── Drag & Drop ────────
  const handleDragStart = (e, oppId) => {
    setDraggedItem(oppId);
    e.dataTransfer.setData('text/plain', oppId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const handleDrop = (e, stage) => {
    e.preventDefault();
    setDragOverColumn(null);
    const oppId = e.dataTransfer.getData('text/plain');
    if (oppId) {
      dispatch({ type: 'UPDATE_OPPORTUNITY_STAGE', payload: { opportunity_id: oppId, stage } });
    }
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    setDragOverColumn(stage);
  };

  const handleDragLeave = (e) => {
    setDragOverColumn(null);
  };

  // ──────── List View Columns ────────
  const listColumns = [
    { key: 'name', label: 'Opportunity', accessor: 'name',
      render: (row) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{row.name || (row.title)}</span>
    },
    { key: 'account', label: 'Account', accessor: row => getOrganization(row.org_id)?.legal_name || '—',
      render: (row) => {
        const org = getOrganization(row.org_id);
        return org ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
            <Building2 size={14} className={styles.iconMuted} /> {org.legal_name}
          </div>
        ) : <span className={styles.emptyText}>—</span>;
      }
    },
    { key: 'contact', label: 'Contact', accessor: row => getContact(row.primary_contact_id || row.contact_id)?.full_name || '—',
      render: (row) => {
        const contact = getContact(row.primary_contact_id || row.contact_id);
        const displayName = contact ? contact.full_name || [contact.first_name, contact.last_name].filter(Boolean).join(' ') : null;
        return displayName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
            <User size={14} className={styles.iconMuted} /> {displayName}
          </div>
        ) : <span className={styles.emptyText}>—</span>;
      }
    },
    { key: 'lane', label: 'Trade Lane', accessor: 'trade_lane',
      render: (row) => {
        let routeDisplay = row.trade_lane || (row.origin_location && row.destination_location ? getLocationName(row.origin_location) + ' - ' + getLocationName(row.destination_location) : '');
        if (routeDisplay && routeDisplay.includes(' - ')) {
          const parts = routeDisplay.split(' - ');
          return <><span style={{fontFamily:'var(--font-mono)'}}>{parts[0]}</span> <ChevronRight size={10} style={{color:'#94A3B8'}} /> <span style={{fontFamily:'var(--font-mono)'}}>{parts[1]}</span></>;
        } else if (routeDisplay && routeDisplay.includes('-')) {
          const parts = routeDisplay.split('-');
          return <><span style={{fontFamily:'var(--font-mono)'}}>{parts[0]}</span> <ChevronRight size={10} style={{color:'#94A3B8'}} /> <span style={{fontFamily:'var(--font-mono)'}}>{parts[1]}</span></>;
        }
        return routeDisplay ? <span style={{fontFamily:'var(--font-mono)'}}>{routeDisplay}</span> : <span className={styles.emptyText}>—</span>;
      }
    },
    { key: 'freight', label: 'Freight', accessor: 'cargo_type',
      render: (row) => (
        <div style={{ fontSize: '13px', color: '#475569' }}>
          {row.cargo_type || 'General Cargo'}
          {(row.est_gross_weight_kg || row.est_chargeable_weight_kg || row.estimated_weight_kg) ? ` • ${row.est_gross_weight_kg || row.est_chargeable_weight_kg || row.estimated_weight_kg} kg` : ''}
          {row.incoterm ? ` • ${row.incoterm}` : ''}
        </div>
      )
    },
    { key: 'stage', label: 'Stage', accessor: 'stage',
      render: (row) => {
        const colorMap = {
          'Qualifying': 'blue',
          'Proposal': 'purple',
          'Negotiation': 'orange',
          'Won': 'green',
          'Lost': 'red',
        };
        return <Badge variant={colorMap[row.stage] || 'gray'}>{row.stage}</Badge>;
      }
    },
    { key: 'value', label: 'Value', accessor: row => Number(row.pipeline_value || row.value), align: 'right',
      render: (row) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(row.pipeline_value || row.value, row.currency_code || row.currency || 'USD')}</span>
    },
    { key: 'actions', label: '', accessor: 'actions', align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
          <button className={styles.actionBtn} title="View Details" onClick={(e) => { e.stopPropagation(); router.push(`/crm/pipeline/${row.opportunity_id}`); }}>
            <Eye size={15} />
          </button>
          <button className={styles.actionBtn} title="Edit" onClick={(e) => { 
            e.stopPropagation(); 
            setEditingOppId(row.opportunity_id);
            setNewOpp({ ...EMPTY_OPP, ...row, name: row.name || row.title || '' });
            setShowNew(true);
          }}>
            <Edit2 size={15} />
          </button>
          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_OPPORTUNITY', payload: row.opportunity_id }); }}>
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ];

  // ──────── Handlers ────────
  const handleCreateOrUpdate = () => {
    if (!(newOpp.name || '').trim() || !newOpp.org_id) return;
    
    const payload = { 
      ...newOpp, 
      pipeline_value: Number(newOpp.pipeline_value) || 0,
      est_chargeable_weight_kg: Number(newOpp.est_chargeable_weight_kg) || 0,
      owner_id: 'user-1'
    };

    if (editingOppId) {
      dispatch({ type: 'UPDATE_OPPORTUNITY', payload: { ...payload, opportunity_id: editingOppId } });
    } else {
      dispatch({ type: 'CREATE_OPPORTUNITY', payload });
    }
    closeModal();
  };

  const openNewModal = () => {
    setEditingOppId(null);
    setNewOpp({ ...EMPTY_OPP });
    setShowNew(true);
  };

  const closeModal = () => {
    setShowNew(false);
    setEditingOppId(null);
    setNewOpp({ ...EMPTY_OPP });
  };

  const selectedAccountContacts = useMemo(() => {
    return state.contacts.filter(c => c.org_id === newOpp.org_id);
  }, [newOpp.org_id, state.contacts]);


  // ──────── Render Card ────────
  const renderCard = (opp) => {
    const account = getOrganization(opp.org_id);
    const contact = opp.primary_contact_id ? getContact(opp.primary_contact_id) : null;
    
    let routeDisplay = opp.trade_lane || (opp.origin_location && opp.destination_location ? getLocationName(opp.origin_location) + ' - ' + getLocationName(opp.destination_location) : '');
    if (routeDisplay && routeDisplay.includes('-')) {
      const parts = routeDisplay.split('-');
      routeDisplay = <>{parts[0]} <ChevronRight size={10} className={styles.laneArrow} /> {parts[1]}</>;
    } else if (routeDisplay && routeDisplay.includes('–')) {
       const parts = routeDisplay.split('–');
       routeDisplay = <>{parts[0]} <ChevronRight size={10} className={styles.laneArrow} /> {parts[1]}</>;
    }

    return (
      <div
        key={opp.opportunity_id}
        className={styles.card}
        draggable
        onDragStart={(e) => handleDragStart(e, opp.opportunity_id)}
        onDragEnd={handleDragEnd}
        style={{ opacity: draggedItem === opp.opportunity_id ? 0.5 : 1 }}
        onClick={() => router.push(`/crm/pipeline/${opp.opportunity_id}`)}
      >
        <div className={styles.cardName}>{opp.name || opp.title}</div>
        
        <div className={styles.cardAccountRow}>
          <Building2 size={14} /> {account?.legal_name || 'No Account'}
        </div>
        {contact && (
          <div className={styles.cardContactRow}>
            <User size={14} /> {contact.full_name}
          </div>
        )}

        {(opp.trade_lane || (opp.origin_location && opp.destination_location)) && (
          <div className={styles.cardLane}>
            {routeDisplay}
          </div>
        )}

        <div className={styles.cardFreight}>
          {opp.cargo_type && <span>{opp.cargo_type}</span>}
          {(opp.est_gross_weight_kg || opp.est_chargeable_weight_kg) ? <span>• {opp.est_gross_weight_kg || opp.est_chargeable_weight_kg} kg</span> : null}
          {opp.incoterm && <span>• {opp.incoterm}</span>}
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.cardValue}>{formatCurrency(opp.pipeline_value, opp.currency_code || 'USD')}</div>
          {opp.created_at && <div className={styles.cardDate}>{formatDate(opp.created_at)}</div>}
        </div>

        <div className={styles.actionOverlay}>
          <button className={styles.actionBtn} title="View Details" onClick={(e) => { e.stopPropagation(); router.push(`/crm/pipeline/${opp.opportunity_id}`); }}>
            <Eye size={14} />
          </button>
          <button className={styles.actionBtn} title="Edit" onClick={(e) => { 
            e.stopPropagation(); 
            setEditingOppId(opp.opportunity_id);
            setNewOpp({ ...opp, name: opp.name || opp.title || '' });
            setShowNew(true);
          }}>
            <Edit2 size={14} />
          </button>
          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_OPPORTUNITY', payload: opp.opportunity_id }); }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };


  return (
    <div className={styles.pageWrapper} style={{ '--primary': '#14B8A6', '--primary-tint': 'rgba(20, 184, 166, 0.1)', '--primary-hover': '#0F766E' }}>
      <div className={styles.page}>
        
        {/* ══════ HEADER ══════ */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Sales Pipeline</h1>
            <p className={styles.subtitle}>Manage freight opportunities, pipeline progression and expected revenue.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '4px' }}>
              <button 
                onClick={() => setViewMode('list')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', background: viewMode === 'list' ? 'white' : 'transparent', color: viewMode === 'list' ? '#0F172A' : '#64748B', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <List size={16} /> List
              </button>
              <button 
                onClick={() => setViewMode('kanban')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', background: viewMode === 'kanban' ? 'white' : 'transparent', color: viewMode === 'kanban' ? '#0F172A' : '#64748B', boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <LayoutGrid size={16} /> Kanban
              </button>
            </div>
            <Button icon={Plus} onClick={openNewModal} style={{ background: '#14B8A6', borderColor: '#14B8A6' }}>New Opportunity</Button>
          </div>
        </div>

        {/* ══════ PROGRESS INDICATOR ══════ */}
        <div className={styles.progressIndicator}>
          <div className={`${styles.progressStep} ${styles.active}`}>Lead</div>
          <ChevronRight size={14} className={styles.progressArrow} />
          <div className={`${styles.progressStep} ${styles.active}`}>Qualification</div>
          <ChevronRight size={14} className={styles.progressArrow} />
          <div className={styles.progressStep}>Proposal</div>
          <ChevronRight size={14} className={styles.progressArrow} />
          <div className={styles.progressStep}>Negotiation</div>
          <ChevronRight size={14} className={styles.progressArrow} />
          <div className={styles.progressStep}>Won / Lost</div>
        </div>
        
        {/* ══════ KPI CARDS ══════ */}
        <div className={styles.kpiRow}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>{kpis.total}</div>
            <div className={styles.kpiLabel}>Total Opportunities</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>{formatCurrency(kpis.value, 'USD')}</div>
            <div className={styles.kpiLabel}>Pipeline Value</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>{kpis.open}</div>
            <div className={styles.kpiLabel}>Open Deals</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue} style={{ color: '#10B981' }}>{kpis.won}</div>
            <div className={styles.kpiLabel}>Won Deals</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue} style={{ color: '#EF4444' }}>{kpis.lost}</div>
            <div className={styles.kpiLabel}>Lost Deals</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiValue} ${styles.kpiValueSmall}`}>{formatCurrency(kpis.avgSize, 'USD')}</div>
            <div className={styles.kpiLabel}>Avg Deal Size</div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '12px', overflow: 'hidden' }}>
            <DataTable 
              columns={listColumns} 
              data={normalizedOpportunities} 
              searchPlaceholder="Search opportunities by name, account, lane..." 
              onRowClick={(row) => router.push(`/crm/pipeline/${row.opportunity_id}`)}
              filters={[
                { key: 'stage', label: 'Stage', options: OPPORTUNITY_STAGES }
              ]}
            />
          </div>
        ) : (
          <>
            {/* ══════ MOBILE TABS ══════ */}
        <div className={styles.mobileTabs}>
          {stageData.map(({ stage, opportunities }) => (
            <button 
              key={stage} 
              className={`${styles.mobileTab} ${mobileTab === stage ? styles.active : ''}`}
              onClick={() => setMobileTab(stage)}
            >
              {stage} ({opportunities.length})
            </button>
          ))}
        </div>

        {/* ══════ KANBAN BOARD ══════ */}
        <div className={styles.boardWrapper}>
          <div className={styles.board}>
            {stageData.map(({ stage, opportunities, totalValue, conversion }) => {
              const theme = stageColors[stage] || { hex: '#CBD5E1', rgba: 'rgba(203, 213, 225, 0.05)' };
              return (
                <div
                  key={stage}
                  className={styles.column}
                  onDrop={(e) => handleDrop(e, stage)}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={handleDragLeave}
                  style={{ 
                    display: typeof window !== 'undefined' && window.innerWidth <= 768 && mobileTab !== stage ? 'none' : 'flex',
                    borderTop: `4px solid ${theme.hex}`
                  }}
                >
                  <div className={styles.columnHeader}>
                    <div className={styles.columnTitle}>
                      <span className={styles.columnDot} style={{ background: theme.hex }} />
                      <span>{stage === 'Won' ? '✓ ' + stage : stage}</span>
                    </div>
                    <div className={styles.columnMetrics}>
                      <div className={styles.metricBlock}>
                        <span className={styles.metricValue}>{opportunities.length}</span>
                        <span className={styles.metricLabel}>Deals</span>
                      </div>
                      <div className={styles.metricBlock} style={{ alignItems: 'flex-end' }}>
                        <span className={styles.metricValue} style={{ fontSize: '15px' }}>{formatCurrency(totalValue, 'USD')}</span>
                        <span className={styles.metricLabel}>Revenue</span>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`${styles.columnBody} ${dragOverColumn === stage ? styles.dragOver : ''}`}
                    style={{ background: theme.rgba }}
                  >
                    {opportunities.map(opp => renderCard(opp))}
                    
                    {opportunities.length === 0 && (
                      <div className={styles.emptyColumn}>
                        <div className={styles.emptyColumnTitle}>No opportunities in {stage}</div>
                        <div className={styles.emptyColumnDesc}>Move opportunities here to track active discussions.</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </>
        )}

      {/* ══════ CREATE / EDIT MODAL ══════ */}
      <Modal
        open={showNew}
        onClose={closeModal}
        title={editingOppId ? "Edit Opportunity" : "Create New Opportunity"}
        subtitle={editingOppId ? "Update deal details" : "Capture a freight forwarding revenue opportunity"}
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleCreateOrUpdate} disabled={!(newOpp.name || '').trim() || !newOpp.org_id} style={{ background: '#14B8A6', borderColor: '#14B8A6' }}>
              {editingOppId ? "Save Changes" : "Create Opportunity"}
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          
          {/* Account & Contact */}
          <div className={styles.formSectionTitle}>Account & Contact</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Organization <span style={{ color: '#f43f5e' }}>*</span></label>
              <select className="form-select" value={newOpp.org_id} onChange={e => setNewOpp(p => ({ ...p, org_id: e.target.value, primary_contact_id: '' }))}>
                <option value="">Select Organization...</option>
                {state.organizations.map(a => <option key={a.org_id} value={a.org_id}>{a.legal_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Primary Contact</label>
              <select className="form-select" value={newOpp.primary_contact_id} onChange={e => setNewOpp(p => ({ ...p, primary_contact_id: e.target.value }))} disabled={!newOpp.org_id}>
                <option value="">Select Contact...</option>
                {selectedAccountContacts.map(c => <option key={c.contact_id} value={c.contact_id}>{c.full_name}</option>)}
              </select>
            </div>
          </div>

          {/* Opportunity Info */}
          <div className={styles.formSectionTitle} style={{ marginTop: '16px' }}>Opportunity Information</div>
          <div className="form-group">
            <label className="form-label">Deal Name <span style={{ color: '#f43f5e' }}>*</span></label>
            <input className="form-input" value={newOpp.name} onChange={e => setNewOpp(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Acme Electronics - DOH to FRA" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Stage</label>
              <select className="form-select" value={newOpp.stage} onChange={e => setNewOpp(p => ({ ...p, stage: e.target.value }))}>
                {OPPORTUNITY_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Pipeline Value</label>
              <input className="form-input" type="number" value={newOpp.pipeline_value} onChange={e => setNewOpp(p => ({ ...p, pipeline_value: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={newOpp.currency_code} onChange={e => setNewOpp(p => ({ ...p, currency_code: e.target.value }))}>
                {['USD','EUR','GBP','QAR','AED','SGD','JPY','INR','AUD','HKD'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Lead/Logistics Information */}
          <div className={styles.formSectionTitle} style={{ marginTop: '16px' }}>Logistics Information</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Source</label>
              <select className="form-select" value={newOpp.source} onChange={e => setNewOpp(p => ({ ...p, source: e.target.value }))}>
                <option value="">Select Source...</option>
                {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={newOpp.status} onChange={e => setNewOpp(p => ({ ...p, status: e.target.value }))}>
                {LEAD_STATUSES.filter(s => s !== 'Converted').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Transport Mode</label>
              <select className="form-select" value={newOpp.transport_mode} onChange={e => setNewOpp(p => ({ ...p, transport_mode: e.target.value }))}>
                {TRANSPORT_MODES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Route Type</label>
              <div style={{ height: '42px', display: 'flex', alignItems: 'center', padding: '0 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Badge variant={newOpp.route_type === 'Domestic' ? 'neutral' : 'primary'} dot>{newOpp.route_type}</Badge>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Origin Location</label>
              <AsyncLocationSelect value={newOpp.origin_location} onChange={val => setNewOpp(p => ({ ...p, origin_location: val, route_type: (val && newOpp.destination_location && JSON.parse(val).country !== JSON.parse(newOpp.destination_location).country) ? 'International' : 'Domestic' }))} placeholder="Search origin..." />
            </div>
            <div className="form-group">
              <label className="form-label">Destination Location</label>
              <AsyncLocationSelect value={newOpp.destination_location} onChange={val => setNewOpp(p => ({ ...p, destination_location: val, route_type: (val && newOpp.origin_location && JSON.parse(val).country !== JSON.parse(newOpp.origin_location).country) ? 'International' : 'Domestic' }))} placeholder="Search destination..." />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cargo Type</label>
              <select className="form-select" value={newOpp.cargo_type} onChange={e => setNewOpp(p => ({ ...p, cargo_type: e.target.value }))}>
                {CARGO_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Incoterm</label>
              <select className="form-select" value={newOpp.incoterm} onChange={e => setNewOpp(p => ({ ...p, incoterm: e.target.value }))}>
                {INCOTERMS.map(i => <option key={i} value={i}>{INCOTERM_LABELS[i]}</option>)}
              </select>
            </div>
          </div>

          {/* Shipment Details */}
          <div className={styles.formSectionTitle} style={{ marginTop: '16px' }}>Shipment Details</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pieces</label>
              <input className="form-input" type="number" value={newOpp.est_pieces} onChange={e => setNewOpp(p => ({ ...p, est_pieces: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Gross Weight (kg)</label>
              <input className="form-input" type="number" value={newOpp.est_gross_weight_kg} onChange={e => setNewOpp(p => ({ ...p, est_gross_weight_kg: e.target.value }))} placeholder="0" />
            </div>
          </div>
        </div>
      </Modal>

      </div>
    </div>
  );
}
