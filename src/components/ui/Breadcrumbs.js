'use client';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import styles from './lookup.module.css';

export default function Breadcrumbs({ items }) {
  const router = useRouter();

  if (!items || items.length === 0) return null;

  return (
    <nav className={styles.breadcrumbs}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isLast ? (
              <span className={styles.breadcrumbCurrent}>{item.label}</span>
            ) : (
              <>
                <span
                  className={styles.breadcrumbItem}
                  onClick={() => router.push(item.href)}
                >
                  {item.label}
                </span>
                <span className={styles.breadcrumbSep}>
                  <ChevronRight size={14} />
                </span>
              </>
            )}
          </span>
        );
      })}
    </nav>
  );
}
