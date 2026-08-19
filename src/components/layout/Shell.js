'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import AIPanel from './AIPanel';
import styles from './Shell.module.css';

export default function Shell({ children }) {
  const pathname = usePathname();
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Client-facing pages (e.g. /sign/...) render without the CRM shell
  if (pathname?.startsWith('/sign')) {
    return <>{children}</>;
  }

  return (
    <div className={`${styles.shell} ${sidebarCollapsed ? styles.sidebarCollapsed : ''} ${aiPanelOpen ? '' : styles.aiClosed}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className={styles.workspace}>
        {children}
      </main>
      <AIPanel
        open={aiPanelOpen}
        onToggle={() => setAiPanelOpen(!aiPanelOpen)}
      />
    </div>
  );
}
