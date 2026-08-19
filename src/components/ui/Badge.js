import styles from './Badge.module.css';

export default function Badge({ variant = 'neutral', children, dot = false, size = 'default' }) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]} ${dot ? styles.withDot : ''}`}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}
