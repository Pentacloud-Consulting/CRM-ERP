'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Ship, Plane, Truck, PackageCheck, AlertTriangle, ShieldCheck, TrendingUp, Package,
  ArrowUpRight, Clock, CheckCircle2, XCircle, BarChart3,
  Search, Bell, MessageSquare, Settings, UserCircle2, Zap, LayoutDashboard,
  Bot, Route, ArrowDownRight, Users, FileSpreadsheet, Building2,
  Shield, Radar, Globe, Activity, Sparkles, CircleCheck
} from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import { eventBus } from '@/lib/store/eventBus';
import { formatCurrency } from '@/lib/utils/formatters';
import RevenueChart from '@/components/dashboard/RevenueChart';
import LogisticsFlow from '@/components/dashboard/LogisticsFlow';
import styles from './page.module.css';

export default function Dashboard() {
  const { state } = useApp();
  const [spinningId, setSpinningId] = useState(null);

  const handleSpin = (id) => {
    setSpinningId(id);
    setTimeout(() => setSpinningId(null), 600);
  };

  const metrics = useMemo(() => {
    const activeShipments = state.shipments.filter(s => !['Delivered', 'Cancelled'].includes(s.status)).length;
    const openExceptions = state.shipments.filter(s => s.status === 'Exception' || s.status === 'Customs Hold').length;
    const customsHolds = state.customsClearances.filter(c => c.status === 'Held').length;
    const pendingBookings = state.bookingRequests ? state.bookingRequests.filter(b => b.status === 'Requested' || b.status === 'Pending').length : 0;
    const wonDeals = state.opportunities.filter(o => o.status === 'Closed Won').length;
    const newLeads = state.leads.filter(l => l.status === 'New').length;
    
    const totalShipments = state.shipments.length;
    const totalBookings = state.bookingRequests ? state.bookingRequests.length : 0;
    
    const revenue = state.invoices
      .filter(i => i.status !== 'Cancelled')
      .reduce((sum, i) => sum + (i.total_amount || 0), 0);
      
    return {
      activeShipments,
      openExceptions,
      customsHolds,
      pendingBookings,
      wonDeals,
      newLeads,
      totalShipments,
      totalBookings,
      revenue,
      onTimeDelivery: 94.2,
      avgCustomsDwell: 18.5
    };
  }, [state]);

  return (
    <div className={`ambient-mesh-bg`}>
      <div className={styles.dashboard}>
        
        {/* Premium Top Navigation / Header */}
        <div className={styles.topNav}>
          <div className={styles.topLeft}>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Operations Overview | {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <div className={styles.topCenter}>
            <div className={styles.searchBar}>
              <Search size={18} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search shipments, bookings, AWB numbers, flights, customers..." 
                className={styles.searchInput}
              />
              <div className={styles.aiBadge}><Bot size={14}/> AI</div>
            </div>
          </div>
        </div>

        {/* Top KPI Cards Grid (8 Cards) */}
        <div className={styles.kpiGrid}>
          <Link href="/operations/shipments" onClick={() => handleSpin('kpi1')} className={`${styles.kpiCard} hover-scale ${spinningId === 'kpi1' ? 'is-spinning' : ''}`}>
            <div className={styles.kpiTopRow}>
              <div className={`${styles.kpiIconWrapper} click-spin`} style={{ background: 'rgba(106, 76, 255, 0.08)', color: '#6A4CFF' }}>
                <Ship size={18} className="click-spin-inner" strokeWidth={2} />
              </div>
              <div className={`${styles.kpiTrend} ${styles.trendUp}`}>+12% <ArrowUpRight size={14} /></div>
            </div>
            <div className={styles.kpiInfo}>
              <div className={styles.kpiValue}>{metrics.activeShipments}</div>
              <div className={styles.kpiLabel}>Active Shipments</div>
            </div>
          </Link>

          {/* ══════ PREMIUM: Operational Risk Monitor ══════ */}
          <Link href="/operations/tracking" onClick={() => handleSpin('kpi2')} className={`${styles.riskCard} hover-scale ${spinningId === 'kpi2' ? 'is-spinning' : ''}`}>
            <div className={styles.riskBgPattern}>
              <svg width="100%" height="100%" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="160" cy="80" r="60" stroke="rgba(139,92,246,0.06)" strokeWidth="1" fill="none" />
                <circle cx="160" cy="80" r="40" stroke="rgba(139,92,246,0.04)" strokeWidth="1" fill="none" />
                <circle cx="160" cy="80" r="20" stroke="rgba(139,92,246,0.03)" strokeWidth="1" fill="none" />
                <line x1="100" y1="80" x2="200" y2="80" stroke="rgba(139,92,246,0.04)" strokeWidth="1" />
                <line x1="160" y1="20" x2="160" y2="140" stroke="rgba(139,92,246,0.04)" strokeWidth="1" />
              </svg>
            </div>
            <div className={styles.riskTopRow}>
              <div className={styles.riskIconBox}>
                <Shield size={20} strokeWidth={2} />
              </div>
              <div className={styles.aiBadgeSmall}>
                <Sparkles size={10} />
                AI Protected
              </div>
            </div>
            <div className={styles.riskMetricRow}>
              {metrics.openExceptions === 0 ? (
                <>
                  <div className={styles.riskValueSuccess}>
                    <CircleCheck size={22} style={{ color: '#10B981' }} />
                    All Clear
                  </div>
                  <div className={styles.riskSubtitle}>No active operational risks</div>
                </>
              ) : (
                <>
                  <div className={styles.riskValue}>{metrics.openExceptions}</div>
                  <div className={styles.riskSubtitle}>Critical Issues</div>
                </>
              )}
            </div>
            <div className={styles.riskFooter}>
              <div className={styles.riskStat}>
                <span className={styles.riskStatValue}>98%</span>
                <span className={styles.riskStatLabel}>Health</span>
              </div>
              <div className={styles.riskDivider} />
              <div className={styles.riskStat}>
                <span className={`${styles.riskStatValue} ${styles.riskPositive}`}>+14%</span>
                <span className={styles.riskStatLabel}>Improved</span>
              </div>
              <div className={styles.riskDivider} />
              <div className={styles.riskStat}>
                <Activity size={12} className={styles.riskPulse} />
                <span className={styles.riskStatLabel}>Live</span>
              </div>
            </div>
          </Link>

          {/* ══════ PREMIUM: Customs Intelligence Center ══════ */}
          <Link href="/operations/customs" onClick={() => handleSpin('kpi3')} className={`${styles.customsCard} hover-scale ${spinningId === 'kpi3' ? 'is-spinning' : ''}`}>
            <div className={styles.customsBgPattern}>
              <svg width="100%" height="100%" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20,80 Q60,40 100,80 T180,80" stroke="rgba(16,185,129,0.06)" strokeWidth="1.5" fill="none" />
                <path d="M20,60 Q80,100 140,50 T200,70" stroke="rgba(139,92,246,0.05)" strokeWidth="1" fill="none" />
                <circle cx="40" cy="80" r="3" fill="rgba(16,185,129,0.08)" />
                <circle cx="100" cy="70" r="3" fill="rgba(139,92,246,0.08)" />
                <circle cx="160" cy="85" r="3" fill="rgba(16,185,129,0.08)" />
              </svg>
            </div>
            <div className={styles.riskTopRow}>
              <div className={styles.customsIconBox}>
                <Globe size={20} strokeWidth={2} />
              </div>
              <div className={styles.complianceBadge}>
                <ShieldCheck size={10} />
                Compliant
              </div>
            </div>
            <div className={styles.riskMetricRow}>
              {metrics.customsHolds === 0 ? (
                <>
                  <div className={styles.customsValueSuccess}>
                    <CircleCheck size={22} style={{ color: '#10B981' }} />
                    Healthy
                  </div>
                  <div className={styles.riskSubtitle}>No customs delays</div>
                </>
              ) : (
                <>
                  <div className={styles.customsValue}>{metrics.customsHolds}</div>
                  <div className={styles.riskSubtitle}>Active Holds</div>
                </>
              )}
            </div>
            <div className={styles.riskFooter}>
              <div className={styles.riskStat}>
                <span className={styles.riskStatValue}>96.8%</span>
                <span className={styles.riskStatLabel}>Clearance</span>
              </div>
              <div className={styles.riskDivider} />
              <div className={styles.riskStat}>
                <span className={styles.riskStatValue}>18.5h</span>
                <span className={styles.riskStatLabel}>Avg Time</span>
              </div>
              <div className={styles.riskDivider} />
              <div className={styles.riskStat}>
                <Globe size={12} style={{ color: '#10B981' }} />
                <span className={styles.riskStatLabel}>Stable</span>
              </div>
            </div>
          </Link>

          <Link href="/operations/bookings" onClick={() => handleSpin('kpi4')} className={`${styles.kpiCard} hover-scale ${spinningId === 'kpi4' ? 'is-spinning' : ''}`}>
            <div className={styles.kpiTopRow}>
              <div className={`${styles.kpiIconWrapper} click-spin`} style={{ background: 'rgba(106, 76, 255, 0.08)', color: '#6A4CFF' }}>
                <Plane size={18} className="click-spin-inner" strokeWidth={2} />
              </div>
              <div className={`${styles.kpiTrend} ${styles.trendUp}`}>+18% <ArrowUpRight size={14} /></div>
            </div>
            <div className={styles.kpiInfo}>
              <div className={styles.kpiValue}>{metrics.pendingBookings}</div>
              <div className={styles.kpiLabel}>Pending Bookings</div>
            </div>
          </Link>

          <Link href="/crm/pipeline" onClick={() => handleSpin('kpi5')} className={`${styles.kpiCard} hover-scale ${spinningId === 'kpi5' ? 'is-spinning' : ''}`}>
            <div className={styles.kpiTopRow}>
              <div className={`${styles.kpiIconWrapper} click-spin`} style={{ background: 'rgba(106, 76, 255, 0.08)', color: '#6A4CFF' }}>
                <TrendingUp size={18} className="click-spin-inner" strokeWidth={2} />
              </div>
              <div className={`${styles.kpiTrend} ${styles.trendUp}`}>+8% <ArrowUpRight size={14} /></div>
            </div>
            <div className={styles.kpiInfo}>
              <div className={styles.kpiValue}>{metrics.wonDeals}</div>
              <div className={styles.kpiLabel}>Won Deals</div>
            </div>
          </Link>

          <Link href="/crm/leads" onClick={() => handleSpin('kpi6')} className={`${styles.kpiCard} hover-scale ${spinningId === 'kpi6' ? 'is-spinning' : ''}`}>
            <div className={styles.kpiTopRow}>
              <div className={`${styles.kpiIconWrapper} click-spin`} style={{ background: 'rgba(5, 150, 105, 0.08)', color: '#059669' }}>
                <BarChart3 size={18} className="click-spin-inner" strokeWidth={2} />
              </div>
              <div className={`${styles.kpiTrend} ${styles.trendUp}`}>+24% <ArrowUpRight size={14} /></div>
            </div>
            <div className={styles.kpiInfo}>
              <div className={styles.kpiValue}>{metrics.newLeads}</div>
              <div className={styles.kpiLabel}>New Leads</div>
            </div>
          </Link>
        </div>

        {/* Two-column layout: Visual Diagrams */}
        <div className={styles.contentGrid}>
          {/* Graph Diagram */}
          <div className={`${styles.glassPanel} ${styles.panel}`}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <BarChart3 size={18} className={styles.panelIcon} />
                Revenue & Volume Analytics
              </h2>
            </div>
            <div style={{ padding: '24px' }}>
              <RevenueChart />
            </div>
          </div>

          {/* Flow Diagram */}
          <div className={`${styles.glassPanel} ${styles.panel}`}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <Route size={18} className={styles.panelIcon} />
                Live Shipment Pipeline
              </h2>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <LogisticsFlow />
            </div>
          </div>
        </div>

        {/* Executive KPIs */}
        <h2 className={styles.sectionTitle}>Key Performance Analytics</h2>
        <div className={styles.analyticsGrid} style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          
          <div onClick={() => handleSpin('b1')} className={`${styles.glassCard} hover-scale click-spin ${spinningId === 'b1' ? 'is-spinning' : ''}`} style={{cursor: 'pointer'}}>
            <div className={`${styles.analyticsTitle} click-spin-inner`}>Total Shipments</div>
            <div className={styles.analyticsValue}>{metrics.totalShipments}</div>
            <div className={styles.analyticsFooter}>
              <span className={`${styles.kpiTrend} ${styles.trendUp}`}>+4.2%</span> vs last month
            </div>
          </div>

          <div onClick={() => handleSpin('b2')} className={`${styles.glassCard} hover-scale click-spin ${spinningId === 'b2' ? 'is-spinning' : ''}`} style={{cursor: 'pointer'}}>
            <div className={`${styles.analyticsTitle} click-spin-inner`}>Total Bookings</div>
            <div className={styles.analyticsValue}>{metrics.totalBookings}</div>
            <div className={styles.analyticsFooter}>
              <span className={`${styles.kpiTrend} ${styles.trendUp}`}>+12.5%</span> vs last month
            </div>
          </div>

          <div onClick={() => handleSpin('b3')} className={`${styles.glassCard} hover-scale click-spin ${spinningId === 'b3' ? 'is-spinning' : ''}`} style={{cursor: 'pointer'}}>
            <div className={`${styles.analyticsTitle} click-spin-inner`}>Total Revenue</div>
            <div className={styles.analyticsValue}>{formatCurrency(metrics.revenue, 'USD')}</div>
            <div className={styles.analyticsFooter}>
              <span className={`${styles.kpiTrend} ${styles.trendUp}`}>+8.1%</span> vs last month
            </div>
          </div>

          <div onClick={() => handleSpin('b4')} className={`${styles.glassCard} hover-scale click-spin ${spinningId === 'b4' ? 'is-spinning' : ''}`} style={{cursor: 'pointer'}}>
            <div className={`${styles.analyticsTitle} click-spin-inner`}>On-Time Delivery</div>
            <div className={styles.analyticsValue}>{metrics.onTimeDelivery}%</div>
            <div className={styles.analyticsFooter}>
              <span className={`${styles.kpiTrend} ${styles.trendUp}`}>+2.4%</span> vs last month
            </div>
          </div>

          <div onClick={() => handleSpin('b5')} className={`${styles.glassCard} hover-scale click-spin ${spinningId === 'b5' ? 'is-spinning' : ''}`} style={{cursor: 'pointer'}}>
            <div className={`${styles.analyticsTitle} click-spin-inner`}>Avg Customs Dwell</div>
            <div className={styles.analyticsValue}>{metrics.avgCustomsDwell} hrs</div>
            <div className={styles.analyticsFooter}>
              <span className={`${styles.kpiTrend} ${styles.trendDown}`}>-1.2%</span> vs last month
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
