'use client';
import { Package, ShieldCheck, Plane, MapPin, CheckCircle2 } from 'lucide-react';
import styles from './DashboardComponents.module.css';

export default function LogisticsFlow() {
  return (
    <div className={styles.flowContainer}>
      <div className={styles.flowLine}></div>
      <div className={styles.flowLineActive}></div>
      
      <div className={`${styles.node} ${styles.completed}`}>
        <div className={styles.nodeIcon}><Package size={20} /></div>
        <div className={styles.nodeLabel}>Origin</div>
      </div>
      
      <div className={`${styles.node} ${styles.completed}`}>
        <div className={styles.nodeIcon}><ShieldCheck size={20} /></div>
        <div className={styles.nodeLabel}>Export</div>
      </div>
      
      <div className={`${styles.node} ${styles.completed}`}>
        <div className={styles.nodeIcon}><Plane size={20} /></div>
        <div className={styles.nodeLabel}>Transit</div>
      </div>
      
      <div className={`${styles.node} ${styles.active}`}>
        <div className={styles.nodeIcon}><ShieldCheck size={20} /></div>
        <div className={styles.nodeLabel}>Import</div>
      </div>
      
      <div className={styles.node}>
        <div className={styles.nodeIcon}><CheckCircle2 size={20} /></div>
        <div className={styles.nodeLabel}>Delivered</div>
      </div>
    </div>
  );
}
