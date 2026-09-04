'use client';
import { useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Ship, Plane, Truck, PackageCheck, AlertTriangle, ShieldCheck, TrendingUp, Package,
  ArrowUpRight, Clock, CheckCircle2, XCircle, BarChart3,
  Search, Bell, MessageSquare, Settings, UserCircle2, Zap, LayoutDashboard,
  Bot, Route, ArrowDownRight, Users, FileSpreadsheet, Building2,
  Shield, Radar, Globe, Activity, Sparkles, CircleCheck,
  ChevronLeft, ChevronRight, LayoutGrid, Layers
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
  
  const kpiGridRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileViewMode, setMobileViewMode] = useState('carousel'); // 'carousel' | 'grid'
  const TOTAL_CARDS = 6;

  const handleSpin = (id) => {
    setSpinningId(id);
    setTimeout(() => setSpinningId(null), 600);
  };

  const handleKpiScroll = () => {
    if (!kpiGridRef.current) return;
    const { scrollLeft, clientWidth } = kpiGridRef.current;
    if (clientWidth === 0) return;
    const firstCard = kpiGridRef.current.firstElementChild;
    const cardWidth = firstCard ? firstCard.clientWidth + 14 : clientWidth * 0.82;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(Math.max(index, 0), TOTAL_CARDS - 1));
  };

  const scrollNext = () => {
    if (!kpiGridRef.current) return;
    const firstCard = kpiGridRef.current.firstElementChild;
    const cardWidth = firstCard ? firstCard.clientWidth + 14 : 280;
    kpiGridRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
  };

  const scrollPrev = () => {
    if (!kpiGridRef.current) return;
    const firstCard = kpiGridRef.current.firstElementChild;
    const cardWidth = firstCard ? firstCard.clientWidth + 14 : 280;
    kpiGridRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  };

  const scrollToCard = (idx) => {
    if (!kpiGridRef.current) return;
    const firstCard = kpiGridRef.current.firstElementChild;
    const cardWidth = firstCard ? firstCard.clientWidth + 14 : 280;
    kpiGridRef.current.scrollTo({ left: cardWidth * idx, behavior: 'smooth' });
    setActiveIndex(idx);
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

        {/* Mobile KPI Toolbar Header (Shown on Mobile <= 767px) */}
        <div className={styles.mobileKpiHeader}>
          <div className={styles.mobileKpiTitleGroup}>
            <span className={styles.mobileKpiBadge}>
              Metric {activeIndex + 1} of {TOTAL_CARDS}
            </span>
            <div className={styles.mobileKpiDots}>
              {Array.from({ length: TOTAL_CARDS }).map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${activeIndex === i ? styles.activeDot : ''}`}
                  onClick={() => scrollToCard(i)}
                  aria-label={`Go to metric ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className={styles.mobileKpiActions}>
            <button
              className={styles.viewToggleBtn}
              onClick={() => setMobileViewMode(prev => prev === 'carousel' ? 'grid' : 'carousel')}
              title={mobileViewMode === 'carousel' ? 'Switch to Grid View' : 'Switch to Swipe View'}
            >
              {mobileViewMode === 'carousel' ? (
                <><LayoutGrid size={14} /> Grid</>
              ) : (
                <><Layers size={14} /> Swipe</>
              )}
            </button>

            {mobileViewMode === 'carousel' && (
              <div className={styles.navArrows}>
                <button 
                  className={styles.navArrowBtn} 
                  onClick={scrollPrev}
                  disabled={activeIndex === 0}
                  aria-label="Previous Metric"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  className={`${styles.navArrowBtn} ${styles.nextHighlight}`} 
                  onClick={scrollNext}
                  disabled={activeIndex === TOTAL_CARDS - 1}
                  aria-label="Next Metric"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Top KPI Cards Grid */}
        <div className={styles.kpiGridWrapper}>
          <div 
            ref={kpiGridRef}
            onScroll={handleKpiScroll}
            className={`${styles.kpiGrid} ${mobileViewMode === 'grid' ? styles.gridMode : ''}`}
          >
            {/* 1. Active Shipments */}
            <Link href="/operations/shipments" onClick={() => handleSpin('kpi1')} className={`${styles.kpiCard} hover-scale ${spinningId === 'kpi1' ? 'is-spinning' : ''}`}>
              <div className={styles.kpiTopRow}>
                <div className={styles.kpiIconWrapper} style={{ background: 'rgba(106, 76, 255, 0.08)', color: '#6A4CFF' }}>
                  <Ship size={18} className="click-spin-inner" strokeWidth={2} />
                </div>
                <div className={`${styles.kpiTrend} ${styles.trendUp}`}>+12% <ArrowUpRight size={13} /></div>
              </div>
              <div className={styles.kpiInfo}>
                <div className={styles.kpiValue}>{metrics.activeShipments}</div>
                <div className={styles.kpiLabelRow}>
                  <span className={styles.kpiLabel}>Active Shipments</span>
                  <span className={styles.kpiSubText}>2 Air • 1 Ocean</span>
                </div>
              </div>
            </Link>

            {/* 2. Operational Risk Monitor */}
            <Link href="/operations/tracking" onClick={() => handleSpin('kpi2')} className={`${styles.kpiCard} hover-scale ${spinningId === 'kpi2' ? 'is-spinning' : ''}`}>
              <div className={styles.kpiTopRow}>
                <div className={styles.kpiIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10B981' }}>
                  <ShieldCheck size={18} className="click-spin-inner" strokeWidth={2} />
                </div>
                <div className={`${styles.kpiBadgePill} ${styles.pillSuccess}`}>
                  <CircleCheck size={11} />
                  <span>All Clear</span>
                </div>
              </div>
              <div className={styles.kpiInfo}>
                <div className={styles.kpiValueSuccess}>98% <span className={styles.kpiValueSub}>Health</span></div>
                <div className={styles.kpiLabelRow}>
                  <span className={styles.kpiLabel}>Operational Risk</span>
                  <span className={styles.kpiSubText}>0 Critical Issues</span>
                </div>
              </div>
            </Link>

            {/* 3. Customs Compliance */}
            <Link href="/operations/customs" onClick={() => handleSpin('kpi3')} className={`${styles.kpiCard} hover-scale ${spinningId === 'kpi3' ? 'is-spinning' : ''}`}>
              <div className={styles.kpiTopRow}>
                <div className={styles.kpiIconWrapper} style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3B82F6' }}>
                  <Globe size={18} className="click-spin-inner" strokeWidth={2} />
                </div>
                <div className={`${styles.kpiBadgePill} ${styles.pillPrimary}`}>
                  <ShieldCheck size={11} />
                  <span>Compliant</span>
                </div>
              </div>
              <div className={styles.kpiInfo}>
                <div className={styles.kpiValue}>96.8%</div>
                <div className={styles.kpiLabelRow}>
                  <span className={styles.kpiLabel}>Customs Clearance</span>
                  <span className={styles.kpiSubText}>18.5h Avg Dwell</span>
                </div>
              </div>
            </Link>

            {/* 4. Pending Bookings */}
            <Link href="/operations/bookings" onClick={() => handleSpin('kpi4')} className={`${styles.kpiCard} hover-scale ${spinningId === 'kpi4' ? 'is-spinning' : ''}`}>
              <div className={styles.kpiTopRow}>
                <div className={styles.kpiIconWrapper} style={{ background: 'rgba(99, 102, 241, 0.08)', color: '#6366F1' }}>
                  <Plane size={18} className="click-spin-inner" strokeWidth={2} />
                </div>
                <div className={`${styles.kpiTrend} ${styles.trendUp}`}>+18% <ArrowUpRight size={13} /></div>
              </div>
              <div className={styles.kpiInfo}>
                <div className={styles.kpiValue}>{metrics.pendingBookings}</div>
                <div className={styles.kpiLabelRow}>
                  <span className={styles.kpiLabel}>Pending Bookings</span>
                  <span className={styles.kpiSubText}>Dispatch Ready</span>
                </div>
              </div>
            </Link>

            {/* 5. Won Deals */}
            <Link href="/crm/pipeline" onClick={() => handleSpin('kpi5')} className={`${styles.kpiCard} hover-scale ${spinningId === 'kpi5' ? 'is-spinning' : ''}`}>
              <div className={styles.kpiTopRow}>
                <div className={styles.kpiIconWrapper} style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#F59E0B' }}>
                  <TrendingUp size={18} className="click-spin-inner" strokeWidth={2} />
                </div>
                <div className={`${styles.kpiTrend} ${styles.trendUp}`}>+8% <ArrowUpRight size={13} /></div>
              </div>
              <div className={styles.kpiInfo}>
                <div className={styles.kpiValue}>{metrics.wonDeals}</div>
                <div className={styles.kpiLabelRow}>
                  <span className={styles.kpiLabel}>Closed Won Deals</span>
                  <span className={styles.kpiSubText}>$45.0k Value</span>
                </div>
              </div>
            </Link>

            {/* 6. New Leads */}
            <Link href="/crm/leads" onClick={() => handleSpin('kpi6')} className={`${styles.kpiCard} hover-scale ${spinningId === 'kpi6' ? 'is-spinning' : ''}`}>
              <div className={styles.kpiTopRow}>
                <div className={styles.kpiIconWrapper} style={{ background: 'rgba(14, 165, 233, 0.08)', color: '#0EA5E9' }}>
                  <BarChart3 size={18} className="click-spin-inner" strokeWidth={2} />
                </div>
                <div className={`${styles.kpiTrend} ${styles.trendUp}`}>+24% <ArrowUpRight size={13} /></div>
              </div>
              <div className={styles.kpiInfo}>
                <div className={styles.kpiValue}>{metrics.newLeads}</div>
                <div className={styles.kpiLabelRow}>
                  <span className={styles.kpiLabel}>New Leads</span>
                  <span className={styles.kpiSubText}>100% SLA Response</span>
                </div>
              </div>
            </Link>
          </div>
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
            <div style={{ padding: '16px 20px' }}>
              <LogisticsFlow />
            </div>
          </div>
        </div>

        {/* Executive KPIs */}
        <h2 className={styles.sectionTitle}>Key Performance Analytics</h2>
        <div className={styles.analyticsGrid}>
          
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
