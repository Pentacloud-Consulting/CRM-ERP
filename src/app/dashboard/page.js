'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Ship, Plane, Truck, PackageCheck, AlertTriangle, ShieldCheck, TrendingUp, Package,
  ArrowUpRight, Clock, CheckCircle2, XCircle, BarChart3,
  Search, Bell, MessageSquare, Settings, UserCircle2, Zap, LayoutDashboard,
  Bot, Route, ArrowDownRight, Users, FileSpreadsheet, Building2
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
              <div className={`${styles.kpiIconWrapper} click-spin`} style={{ background: '#E0F2FE', color: '#0369A1' }}>
                <Ship size={20} className="click-spin-inner" strokeWidth={2} />
              </div>
              <div className={`${styles.kpiTrend} ${styles.trendUp}`}>+12% <ArrowUpRight size={14} /></div>
            </div>
            <div className={styles.kpiInfo}>
              <div className={styles.kpiValue}>{metrics.activeShipments}</div>
              <div className={styles.kpiLabel}>Active Shipments</div>
            </div>
          </Link>

          <Link href="/operations/tracking" onClick={() => handleSpin('kpi2')} className={`${styles.kpiCard} hover-scale ${spinningId === 'kpi2' ? 'is-spinning' : ''}`}>
            <div className={styles.kpiTopRow}>
              <div className={`${styles.kpiIconWrapper} click-spin`} style={{ background: '#FEE2E2', color: '#DC2626' }}>
                <AlertTriangle size={20} className="click-spin-inner" strokeWidth={2} />
              </div>
              <div className={`${styles.kpiTrend} ${styles.trendDown}`}>-3% <ArrowDownRight size={14} /></div>
            </div>
            <div className={styles.kpiInfo}>
              <div className={styles.kpiValue}>{metrics.openExceptions}</div>
              <div className={styles.kpiLabel}>Open Exceptions</div>
            </div>
          </Link>

          <Link href="/operations/customs" onClick={() => handleSpin('kpi3')} className={`${styles.kpiCard} hover-scale ${spinningId === 'kpi3' ? 'is-spinning' : ''}`}>
            <div className={styles.kpiTopRow}>
              <div className={`${styles.kpiIconWrapper} click-spin`} style={{ background: '#F3E8FF', color: '#7E22CE' }}>
                <ShieldCheck size={20} className="click-spin-inner" strokeWidth={2} />
              </div>
              <div className={`${styles.kpiTrend} ${styles.trendUp}`}>+2% <ArrowUpRight size={14} /></div>
            </div>
            <div className={styles.kpiInfo}>
              <div className={styles.kpiValue}>{metrics.customsHolds}</div>
              <div className={styles.kpiLabel}>Customs Holds</div>
            </div>
          </Link>

          <Link href="/operations/bookings" onClick={() => handleSpin('kpi4')} className={`${styles.kpiCard} hover-scale ${spinningId === 'kpi4' ? 'is-spinning' : ''}`}>
            <div className={styles.kpiTopRow}>
              <div className={`${styles.kpiIconWrapper} click-spin`} style={{ background: '#CCFBF1', color: '#0F766E' }}>
                <Plane size={20} className="click-spin-inner" strokeWidth={2} />
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
              <div className={`${styles.kpiIconWrapper} click-spin`} style={{ background: '#E0F2FE', color: '#0369A1' }}>
                <TrendingUp size={20} className="click-spin-inner" strokeWidth={2} />
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
              <div className={`${styles.kpiIconWrapper} click-spin`} style={{ background: '#DCFCE7', color: '#15803D' }}>
                <BarChart3 size={20} className="click-spin-inner" strokeWidth={2} />
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
