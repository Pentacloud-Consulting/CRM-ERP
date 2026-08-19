import './globals.css';
import { AppProvider } from '@/lib/store/AppContext';
import Shell from '@/components/layout/Shell';

export const metadata = {
  title: 'FreightFlow AI — Logistics & Air Freight Management',
  description: 'AI-native CRM + ERP platform for freight forwarders. Manage leads, shipments, air waybills, tracking, and customs clearance.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProvider>
          <Shell>
            {children}
          </Shell>
        </AppProvider>
      </body>
    </html>
  );
}
