'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, UserCircle, Building2, TrendingUp,
  Ship, Plane, FileText, Package, MapPin, ShieldCheck,
  Bot, MessageSquare, FileSearch, ChevronLeft, ChevronRight,
  AlertTriangle, Anchor, Truck, Warehouse, FileSpreadsheet, CreditCard, ArrowRightLeft, Globe
} from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  {
    section: 'OVERVIEW',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'CRM',
    items: [
      { href: '/crm/leads', label: 'Leads', icon: Users, badgeKey: 'newLeads' },
      { href: '/crm/contacts', label: 'Contacts', icon: UserCircle },
      { href: '/crm/accounts', label: 'Accounts', icon: Building2 },
      { href: '/crm/pipeline', label: 'Sales Pipeline', icon: TrendingUp },
    ],
  },
  {
    section: 'OPERATIONS',
    items: [
      { href: '/operations/shipments', label: 'Shipments', icon: Ship },
      { href: '/operations/bookings', label: 'Bookings', icon: Plane },
      { href: '/operations/transport-docs', label: 'Transport Docs', icon: FileText },
      { href: '/operations/transport-manifests', label: 'Transport Manifests', icon: FileSpreadsheet },
      { href: '/operations/uld', label: 'Equipment & Containers', icon: Package },
      { href: '/operations/tracking', label: 'Tracking Board', icon: MapPin },
      { href: '/operations/customs', label: 'Customs', icon: ShieldCheck, badgeKey: 'customsHolds' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const pathname = usePathname();
  const { state } = useApp();
  const [spinningItem, setSpinningItem] = useState(null);

  const handleItemClick = (href) => {
    setSpinningItem(href);
    setTimeout(() => setSpinningItem(null), 600);
    if (onMobileClose) onMobileClose();
  };

  const badges = {
    newLeads: state.leads.filter(l => l.status === 'New').length,
    customsHolds: state.customsClearances.filter(c => c.status === 'Held').length,
    exceptions: state.shipments.filter(s => s.status === 'Exception' || s.status === 'Customs Hold').length,
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
      <div className={styles.header}>
        {(!collapsed || mobileOpen) && (
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <Anchor size={20} />
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoName}>FreightFlow</span>
              <span className={styles.logoSub}>AI Logistics</span>
            </div>
          </div>
        )}
        <button className={styles.toggleBtn} onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(group => (
          <div key={group.section} className={styles.navGroup}>
            {(!collapsed || mobileOpen) && <div className={styles.navGroupLabel}>{group.section}</div>}
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
              const isSpinning = spinningItem === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleItemClick(item.href)}
                  className={`${styles.navItem} hover-scale ${isActive ? styles.active : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className={`click-spin ${isSpinning ? 'is-spinning' : ''}`}>
                    <Icon size={18} className={`${styles.navIcon} click-spin-inner`} />
                  </div>
                  {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                  {!collapsed && badgeCount > 0 && (
                    <span className={styles.badge}>{badgeCount}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Exception indicator */}
        {badges.exceptions > 0 && (
          <div className={styles.navGroup}>
            {!collapsed && <div className={styles.navGroupLabel}>Alerts</div>}
            <Link
              href="/operations/tracking"
              className={`${styles.navItem} ${styles.alertItem}`}
              title={collapsed ? 'Exceptions' : undefined}
            >
              <AlertTriangle size={18} className={styles.navIcon} />
              {!collapsed && <span className={styles.navLabel}>Exceptions</span>}
              {!collapsed && (
                <span className={`${styles.badge} ${styles.dangerBadge}`}>{badges.exceptions}</span>
              )}
            </Link>
          </div>
        )}
      </nav>

      {!collapsed && (
        <div className={styles.footer}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>JD</div>
            <div>
              <div className={styles.userName}>Jane Doe</div>
              <div className={styles.userRole}>Operations Manager</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
