'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import AIPanel from './AIPanel';
import LoginScreen from '../auth/LoginScreen';
import { useApp } from '@/lib/store/AppContext';
import styles from './Shell.module.css';

export default function Shell({ children }) {
  const pathname = usePathname();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { state, isHydrated } = useApp();

  const isPublicRoute = pathname === '/' || pathname === '/login' || pathname?.startsWith('/sign');

  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Return empty or loading state until hydration is complete to prevent flashing
  if (!isHydrated) {
    return null;
  }

  if (!state?.isAuthenticated) {
    // We could use router.push('/login'), but rendering inline for protected routes 
    // completely prevents flashing. If the user hits a protected URL, they see the login.
    // However, the user specifically asked for a standalone /login route.
    // So we will redirect them to /login if they hit a protected route unauthenticated.
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null; // Return null while redirecting
  }

  return (
    <div className={`${styles.shell} ${sidebarCollapsed ? styles.sidebarCollapsed : ''} ${aiPanelOpen ? '' : styles.aiClosed}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      
      {mobileSidebarOpen && (
        <div className={styles.overlay} onClick={() => setMobileSidebarOpen(false)} />
      )}

      <main className={styles.workspace}>
        <div className={styles.mobileHeader}>
          <button className={styles.mobileToggle} onClick={() => setMobileSidebarOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div className={styles.mobileLogo}>
            <div className={styles.logoIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
            <span>FreightFlow</span>
          </div>
          <button className={styles.mobileToggle} onClick={() => setAiPanelOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
          </button>
        </div>
        
        {children}
      </main>

      <AIPanel
        open={aiPanelOpen}
        onToggle={() => setAiPanelOpen(!aiPanelOpen)}
      />
    </div>
  );
}
