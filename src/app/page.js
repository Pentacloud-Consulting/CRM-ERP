'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Anchor, Plane, Truck, ShieldCheck, FileText, Globe, ArrowRight, Zap, LineChart, Target, Server } from 'lucide-react';
import styles from './Home.module.css';

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

export default function MarketingHomepage() {
  const { scrollYProgress } = useScroll();
  const navBackground = useTransform(
    scrollYProgress,
    [0, 0.05],
    ["rgba(6, 11, 20, 0)", "rgba(6, 11, 20, 0.8)"]
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.ambientBg} />

      {/* NAVBAR */}
      <motion.nav 
        className={styles.navbar}
        style={{ background: navBackground }}
      >
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          FreightFlow AI
        </div>
        
        <div className={styles.navActions}>
          <Link href="/login" className={styles.loginBtn}>
            Login to Platform
          </Link>
        </div>
      </motion.nav>

      <div className={styles.contentWrapper}>
        {/* HERO SECTION */}
        <section className={styles.hero}>
          <motion.div 
            className={styles.heroContent}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div className={styles.heroBadge} variants={fadeUp}>
              <Zap size={14} style={{ display: 'inline', marginRight: '6px' }} />
              FreightForwarding v2.0
            </motion.div>
            <motion.h1 className={styles.heroTitle} variants={fadeUp}>
              The intelligence engine<br/>for modern logistics.
            </motion.h1>
            <motion.p className={styles.heroSubtitle} variants={fadeUp}>
              Manage leads, instantly book freight, clear customs, and track every shipment globally with our unified, AI-native command center.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/login" className={styles.loginBtn} style={{ padding: '16px 32px', fontSize: '16px' }}>
                Enter the Command Center
              </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            className={styles.heroVisual}
            initial="hidden"
            animate="visible"
            variants={scaleIn}
          >
            <div className={styles.mockupCard}>
              <div className={styles.mockupHeader}>
                <div className={styles.mockupTitle}>
                  <Globe size={18} color="#00F0FF" />
                  Live Tracking: AWB-847291
                </div>
                <div className={styles.pulseDot} />
              </div>
              <div className={styles.mockupMap}>
                <div className={styles.mapLine} />
              </div>
            </div>
          </motion.div>
        </section>

        {/* TRUST BAR */}
        <motion.section 
          className={styles.trustBar}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
        >
          <p className={styles.trustText}>POWERING NEXT-GENERATION FORWARDERS & CARRIERS</p>
          <div className={styles.trustLogos}>
            <span className={styles.trustLogo}>MAERSK</span>
            <span className={styles.trustLogo}>DHL</span>
            <span className={styles.trustLogo}>FEDEX</span>
            <span className={styles.trustLogo}>EXPEDITORS</span>
            <span className={styles.trustLogo}>KUEHNE+NAGEL</span>
          </div>
        </motion.section>

        {/* BENTO GRID FEATURES */}
        <section className={styles.features}>
          <motion.div 
            className={styles.sectionHeader}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className={styles.sectionTitle}>Everything you need. Nothing you don&apos;t.</h2>
            <p className={styles.heroSubtitle} style={{ margin: '0 auto' }}>
              We stripped away the clutter of legacy ERPs to build a beautifully fast, highly capable platform.
            </p>
          </motion.div>

          <motion.div 
            className={styles.bentoGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className={`${styles.bentoCard} ${styles.bentoCardLarge}`} variants={fadeUp}>
              <div className={styles.bentoIcon}><Target size={28} /></div>
              <h3 className={styles.bentoTitle}>AI-Driven CRM & Quoting</h3>
              <p className={styles.bentoDesc}>Automatically parse emails to generate quotes, capture leads instantly, and calculate complex volumetric routing margins in milliseconds.</p>
            </motion.div>
            
            <motion.div className={styles.bentoCard} variants={fadeUp}>
              <div className={styles.bentoIcon}><Globe size={28} /></div>
              <h3 className={styles.bentoTitle}>Global Visibility</h3>
              <p className={styles.bentoDesc}>Connect directly to ocean and air carriers for real-time tracking data and ETAs.</p>
            </motion.div>

            <motion.div className={styles.bentoCard} variants={fadeUp}>
              <div className={styles.bentoIcon}><FileText size={28} /></div>
              <h3 className={styles.bentoTitle}>Automated Docs</h3>
              <p className={styles.bentoDesc}>Generate MAWBs, HAWBs, commercial invoices and packing lists automatically.</p>
            </motion.div>

            <motion.div className={`${styles.bentoCard} ${styles.bentoCardLarge}`} variants={fadeUp}>
              <div className={styles.bentoIcon}><ShieldCheck size={28} /></div>
              <h3 className={styles.bentoTitle}>Seamless Customs Clearance</h3>
              <p className={styles.bentoDesc}>Native integrations with global customs agencies allow you to submit declarations and clear cargo without ever leaving the platform.</p>
            </motion.div>
          </motion.div>
        </section>

        {/* WORKFLOW DIAGRAM */}
        <section className={styles.workflow}>
          <motion.div 
            className={styles.sectionHeader}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className={styles.sectionTitle}>The Unified Freight Pipeline</h2>
          </motion.div>

          <motion.div 
            className={styles.flowContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-150px" }}
            variants={staggerContainer}
          >
            {/* Animated SVG Path connecting nodes */}
            <svg style={{ position: 'absolute', top: '75px', left: '100px', width: 'calc(100% - 200px)', height: '2px', zIndex: 1 }}>
              <motion.line 
                x1="0" y1="0" x2="100%" y2="0" 
                stroke="rgba(0, 240, 255, 0.3)" 
                strokeWidth="2" 
                strokeDasharray="8 8"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </svg>

            {[
              { icon: <Target size={32} />, label: "Lead & Quote", desc: "Instantly reply to RFQs." },
              { icon: <Plane size={32} />, label: "Book Carrier", desc: "Secure air or ocean space." },
              { icon: <FileText size={32} />, label: "Docs & AWB", desc: "Auto-generate paperwork." },
              { icon: <ShieldCheck size={32} />, label: "Clear Customs", desc: "Frictionless borders." },
              { icon: <Truck size={32} />, label: "Final Mile", desc: "Deliver and invoice." }
            ].map((node, i) => (
              <motion.div className={styles.flowNode} key={i} variants={scaleIn}>
                <div className={styles.flowIconWrapper}>
                  {node.icon}
                </div>
                <div className={styles.flowLabel}>{node.label}</div>
                <div className={styles.flowDesc}>{node.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* STATISTICS SECTION */}
        <motion.section 
          className={styles.stats}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className={styles.statsGrid}>
            <motion.div variants={fadeUp}>
              <div className={styles.statNumber}>10x</div>
              <div className={styles.statLabel}>Faster Quoting Process</div>
            </motion.div>
            <motion.div variants={fadeUp}>
              <div className={styles.statNumber}>$2.4B+</div>
              <div className={styles.statLabel}>Freight Value Managed</div>
            </motion.div>
            <motion.div variants={fadeUp}>
              <div className={styles.statNumber}>99.9%</div>
              <div className={styles.statLabel}>Platform Uptime</div>
            </motion.div>
          </div>
        </motion.section>

        {/* CTA BANNER */}
        <section className={styles.cta}>
          <motion.div 
            className={styles.ctaInner}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <h2 className={styles.sectionTitle} style={{ marginBottom: '16px' }}>Stop tracking spreadsheets.</h2>
            <p className={styles.heroSubtitle} style={{ margin: '0 auto 40px' }}>
              Upgrade to the intelligence engine that scales with your logistics business.
            </p>
            <Link href="/login" className={styles.loginBtn} style={{ padding: '16px 40px', fontSize: '18px', background: 'rgba(0, 102, 255, 0.2)' }}>
              Login to Platform
            </Link>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
