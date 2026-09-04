import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

export default function Button({
  variant = 'primary',
  size = 'default',
  icon: Icon,
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}) {
  return (
    <button
      className={`${styles.btn} ${styles[variant] || ''} ${styles[size] || ''} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className={styles.spinner} />
      ) : Icon ? (
        <Icon size={16} className={styles.icon} />
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
}
