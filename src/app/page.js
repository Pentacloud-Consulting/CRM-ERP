'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Anchor, Plane, Truck, ShieldCheck, FileText, Globe, ArrowRight, 
  Zap, BarChart, Target, Server, ChevronRight, Activity, MapPin, 
  Package, Brain, CheckCircle2, Navigation, Ship
} from 'lucide-react';
import styles from './Home.module.css';

// Base Animations
const springConfig = { type: "spring", stiffness: 100, damping: 20 };

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function MarketingHomepage() {
  const { scrollYProgress } = useScroll();
  const navBackground = useTransform(
    scrollYProgress,
    [0, 0.05],
    ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.9)"]
  );
  
  const [activeTab, setActiveTab] = useState('Air');
  const [activeScreen, setActiveScreen] = useState(0);
  
  // Simulated Pipeline Progression
  const [pipelineStep, setPipelineStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPipelineStep(prev => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.pageWrapper}>
      {/* NAVBAR */}
      <motion.nav className={styles.nav} style={{ background: navBackground }}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Anchor size={18} />
          </div>
          FreightFlow AI
        </div>
        <div className={styles.navLinks}>
          <Link href="#platform" className={styles.navLink}>Platform</Link>
          <Link href="#intelligence" className={styles.navLink}>AI Intelligence</Link>
          <Link href="#solutions" className={styles.navLink}>Solutions</Link>
          <Link href="#customers" className={styles.navLink}>Customers</Link>
        </div>
        <div className={styles.navActions}>
          <Link href="/login" className={styles.navLink}>Log In</Link>
          <Link href="/login" className={styles.btnPrimary}>Book a Demo</Link>
        </div>
      </motion.nav>

      {/* 1. HERO SECTION */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroGrid} />
        
        <div className={styles.heroContainer}>
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={staggerContainer}
          >
            <motion.h1 className={styles.heroTitle} variants={fadeUp}>
              The AI Operating System<br/>For <span>Modern Freight</span>.
            </motion.h1>
            <motion.p className={styles.heroSubtitle} variants={fadeUp}>
              Manage leads, quotations, bookings, customs, documentation, tracking and delivery from one intelligent platform.
            </motion.p>
            
            <motion.div className={styles.heroActions} variants={fadeUp}>
              <Link href="/login" className={styles.btnPrimary}>
                Book a Demo <ArrowRight size={16} style={{ marginLeft: 8 }} />
              </Link>
              <Link href="#demo" className={styles.btnSecondary}>
                Watch Platform Tour
              </Link>
            </motion.div>
            
            <motion.div className={styles.heroTrust} variants={fadeUp}>
              <div className={styles.trustIndicator}><CheckCircle2 size={16} color="var(--ff-success)" /> 10x Faster Operations</div>
              <div className={styles.trustIndicator}><CheckCircle2 size={16} color="var(--ff-success)" /> 99.9% Uptime</div>
            </motion.div>
          </motion.div>

          <motion.div 
            className={styles.heroVisual}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ position: 'relative' }}
          >
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '150%', height: '150%', background: 'radial-gradient(circle, rgba(109, 74, 255, 0.15) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ position: 'relative', width: '100%', height: '650px', zIndex: 1 }}
            >
              <Image 
                src="/images/hero_command_light.png" 
                alt="FreightFlow AI Command Center" 
                fill
                style={{ objectFit: 'contain', scale: 1.1 }}
                priority
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. METRICS BAR */}
      <section className={styles.metricsBar}>
        <div className={styles.container}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <div className={styles.metricValue}>10x</div>
              <div className={styles.metricLabel}>Faster Operations</div>
            </div>
            <div className={styles.metricItem}>
              <div className={styles.metricValue}>99.9%</div>
              <div className={styles.metricLabel}>Platform Uptime</div>
            </div>
            <div className={styles.metricItem}>
              <div className={styles.metricValue}>500K+</div>
              <div className={styles.metricLabel}>Shipments Processed</div>
            </div>
            <div className={styles.metricItem}>
              <div className={styles.metricValue}>24/7</div>
              <div className={styles.metricLabel}>AI Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE PRODUCT DEMO */}
      <section id="demo" className={`${styles.section} ${styles.demoSection}`}>
        <div className={styles.container}>
          <h2 className={`${styles.sectionTitle} ${styles.textCenter}`}>From Lead to Delivered Cargo</h2>
          <p className={`${styles.sectionSubtitle} ${styles.textCenter}`}>
            Watch how a single piece of freight moves through the entire FreightFlow AI ecosystem.
          </p>
          
          <div className={styles.demoContainer}>
            <div className={styles.demoHeader}>
              <div className={styles.demoTitle}>Live Pipeline Simulation</div>
              <div className={styles.dashStatus} style={{ background: 'rgba(255,255,255,0.1)' }}>Auto-Pilot Active</div>
            </div>
            
            <div className={styles.demoPipeline}>
              <div className={styles.demoLine} />
              
              {[
                { icon: Target, label: "Lead" },
                { icon: Package, label: "Booking" },
                { icon: ShieldCheck, label: "Customs" },
                { icon: Plane, label: "Transit" },
                { icon: CheckCircle2, label: "Delivered" }
              ].map((step, idx) => (
                <div key={idx} className={`${styles.demoStep} ${pipelineStep >= idx ? styles.active : ''}`}>
                  <div className={styles.demoStepIcon}>
                    <step.icon size={20} />
                  </div>
                  <div className={styles.demoStepLabel}>{step.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRUSTED BY */}
      <section className={styles.trustedSection}>
        <div className={styles.container}>
          <div className={styles.trustedLogos}>
            <span className={styles.trustedLogo}>MAERSK</span>
            <span className={styles.trustedLogo}>DHL</span>
            <span className={styles.trustedLogo}>FEDEX</span>
            <span className={styles.trustedLogo}>KUEHNE+NAGEL</span>
            <span className={styles.trustedLogo}>EXPEDITORS</span>
          </div>
        </div>
      </section>

      {/* 5. UNIFIED PLATFORM */}
      <section id="platform" className={styles.section}>
        <div className={styles.container}>
          <h2 className={`${styles.sectionTitle} ${styles.textCenter}`}>Everything You Need.<br/>Nothing You Don't.</h2>
          <p className={`${styles.sectionSubtitle} ${styles.textCenter}`}>
            Replace fragmented spreadsheets and legacy systems with one intelligent platform.
          </p>
          
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Target size={24} /></div>
              <h3 className={styles.featureTitle}>AI CRM & Sales</h3>
              <ul className={styles.featureList}>
                <li className={styles.featureListItem}><CheckCircle2 size={16} className={styles.featureListIcon}/> Lead Management</li>
                <li className={styles.featureListItem}><CheckCircle2 size={16} className={styles.featureListIcon}/> Opportunity Tracking</li>
                <li className={styles.featureListItem}><CheckCircle2 size={16} className={styles.featureListIcon}/> AI Lead Scoring</li>
                <li className={styles.featureListItem}><CheckCircle2 size={16} className={styles.featureListIcon}/> Quote Generation</li>
              </ul>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Plane size={24} /></div>
              <h3 className={styles.featureTitle}>Shipment Operations</h3>
              <ul className={styles.featureList}>
                <li className={styles.featureListItem}><CheckCircle2 size={16} className={styles.featureListIcon}/> Booking Management</li>
                <li className={styles.featureListItem}><CheckCircle2 size={16} className={styles.featureListIcon}/> Automated AWBs</li>
                <li className={styles.featureListItem}><CheckCircle2 size={16} className={styles.featureListIcon}/> Workflow Automation</li>
                <li className={styles.featureListItem}><CheckCircle2 size={16} className={styles.featureListIcon}/> Smart Scheduling</li>
              </ul>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><ShieldCheck size={24} /></div>
              <h3 className={styles.featureTitle}>Customs & Compliance</h3>
              <ul className={styles.featureList}>
                <li className={styles.featureListItem}><CheckCircle2 size={16} className={styles.featureListIcon}/> Import & Export Clearance</li>
                <li className={styles.featureListItem}><CheckCircle2 size={16} className={styles.featureListIcon}/> Document Management</li>
                <li className={styles.featureListItem}><CheckCircle2 size={16} className={styles.featureListIcon}/> Regulatory Validation</li>
              </ul>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><MapPin size={24} /></div>
              <h3 className={styles.featureTitle}>Real-Time Tracking</h3>
              <ul className={styles.featureList}>
                <li className={styles.featureListItem}><CheckCircle2 size={16} className={styles.featureListIcon}/> Live Visibility Dashboard</li>
                <li className={styles.featureListItem}><CheckCircle2 size={16} className={styles.featureListIcon}/> Predictive Alerts</li>
                <li className={styles.featureListItem}><CheckCircle2 size={16} className={styles.featureListIcon}/> Customer Portal</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. AI INTELLIGENCE */}
      <section id="intelligence" className={`${styles.section} ${styles.aiSection}`}>
        <div className={styles.container}>
          <div className={styles.aiContainer}>
            <div>
              <h2 className={styles.aiTitle}>The Brain Behind<br/>Every Shipment.</h2>
              <p className={styles.heroSubtitle} style={{ color: 'rgba(255,255,255,0.7)' }}>
                FreightFlow AI doesn't just store data; it understands your logistics operations and automates the heavy lifting.
              </p>
              
              <div className={styles.aiList}>
                <div className={styles.aiItem}>
                  <div className={styles.aiItemIcon}><Brain size={20} /></div>
                  <div>
                    <div className={styles.aiItemTitle}>AI Quote Engine</div>
                    <div className={styles.aiItemDesc}>Instantly parses inbound RFQs and generates optimal pricing and routes.</div>
                  </div>
                </div>
                <div className={styles.aiItem}>
                  <div className={styles.aiItemIcon}><Activity size={20} /></div>
                  <div>
                    <div className={styles.aiItemTitle}>Predictive ETA & Exceptions</div>
                    <div className={styles.aiItemDesc}>Foresees delays based on global weather, port congestion, and historical data.</div>
                  </div>
                </div>
                <div className={styles.aiItem}>
                  <div className={styles.aiItemIcon}><FileText size={20} /></div>
                  <div>
                    <div className={styles.aiItemTitle}>Smart Customs Validation</div>
                    <div className={styles.aiItemDesc}>Automatically cross-references documentation against local compliance rules.</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.aiVisual}>
              <motion.div 
                className={styles.aiNode} 
                animate={{ scale: [1, 1.1, 1], boxShadow: ["0 0 20px rgba(109,74,255,0.2)", "0 0 60px rgba(109,74,255,0.6)", "0 0 20px rgba(109,74,255,0.2)"] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Brain size={32} />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. MULTI-MODAL LOGISTICS */}
      <section id="solutions" className={`${styles.section} ${styles.tabsSection}`}>
        <div className={styles.container}>
          <h2 className={`${styles.sectionTitle} ${styles.textCenter}`}>Built for Every Mode.</h2>
          
          <div className={styles.tabsHeader}>
            {['Air', 'Ocean', 'Road'].map(tab => (
              <button 
                key={tab} 
                className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'Air' && <Plane size={18} />}
                {tab === 'Ocean' && <Ship size={18} />}
                {tab === 'Road' && <Truck size={18} />}
                {tab} Freight
              </button>
            ))}
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={styles.tabContent}
            >
              <div>
                <h3 className={styles.featureTitle}>
                  {activeTab === 'Air' && "High-Velocity Air Cargo."}
                  {activeTab === 'Ocean' && "Global Ocean Network."}
                  {activeTab === 'Road' && "Connected Final Mile."}
                </h3>
                <p className={styles.heroSubtitle} style={{ marginBottom: 24 }}>
                  {activeTab === 'Air' && "Connect directly to airline APIs for real-time capacity, e-AWB submission, and instant FSU milestone tracking."}
                  {activeTab === 'Ocean' && "Manage full vessel schedules, FCL/LCL bookings, and maritime terminal events seamlessly."}
                  {activeTab === 'Road' && "Dispatch trucks, track GPS coordinates, and manage proof of delivery natively."}
                </p>
                <Link href="/login" className={styles.btnSecondary}>Explore {activeTab} Features</Link>
              </div>
              <div style={{ height: 350, position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <Image 
                  src="/images/tracking_map.png" 
                  alt="Global Tracking Map" 
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 9. STICKY SCREENS STORY */}
      <section className={styles.storySection}>
        <div className={styles.container}>
          <div className={styles.storyGrid}>
            <div className={styles.storyContent}>
              <div className={styles.storyItem}>
                <h3 className={styles.featureTitle}>1. CRM Dashboard</h3>
                <p className={styles.heroSubtitle}>Your logistics pipeline starts here. Automatically capture leads and track sales performance.</p>
              </div>
              <div className={styles.storyItem}>
                <h3 className={styles.featureTitle}>2. Shipment Command</h3>
                <p className={styles.heroSubtitle}>Convert won deals into active shipments instantly. No rekeying data.</p>
              </div>
              <div className={styles.storyItem}>
                <h3 className={styles.featureTitle}>3. Customs & Compliance</h3>
                <p className={styles.heroSubtitle}>Clear borders faster with AI-validated documentation.</p>
              </div>
            </div>
            
            <div className={styles.storyVisual}>
              <div className={styles.mockupWindow}>
                <div className={styles.mockupTop}>
                  <div className={styles.mockupDot} style={{ background: '#ff5f56' }}/>
                  <div className={styles.mockupDot} style={{ background: '#ffbd2e' }}/>
                  <div className={styles.mockupDot} style={{ background: '#27c93f' }}/>
                </div>
                <div className={styles.mockupBody} style={{ padding: 0, position: 'relative' }}>
                  <div className={styles.floatingPill} style={{ top: '20%', left: '-10%', zIndex: 10 }}>
                    <ShieldCheck size={16} color="var(--ff-success)" /> Customs Cleared
                  </div>
                  <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                    <Image 
                      src="/images/crm_dashboard.png" 
                      alt="Premium CRM Dashboard" 
                      fill
                      style={{ objectFit: 'cover' }}
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. WHY FREIGHTFLOW */}
      <section className={`${styles.section} ${styles.compareSection}`}>
        <div className={styles.container}>
          <h2 className={`${styles.sectionTitle} ${styles.textCenter}`}>Why FreightFlow AI Wins.</h2>
          
          <div className={styles.compareTable}>
            <div className={styles.compareRow}>
              <div className={styles.compareHeader}>Traditional ERP</div>
              <div className={`${styles.compareHeader} ${styles.ffAI}`}>FreightFlow AI</div>
            </div>
            <div className={styles.compareRow}>
              <div className={`${styles.compareCell} ${styles.traditional}`}>Multiple Disconnected Systems</div>
              <div className={`${styles.compareCell} ${styles.ffAI}`}><CheckCircle2 size={20} color="var(--ff-violet)"/> One Unified Platform</div>
            </div>
            <div className={styles.compareRow}>
              <div className={`${styles.compareCell} ${styles.traditional}`}>Manual Data Entry</div>
              <div className={`${styles.compareCell} ${styles.ffAI}`}><CheckCircle2 size={20} color="var(--ff-violet)"/> AI Automation</div>
            </div>
            <div className={styles.compareRow}>
              <div className={`${styles.compareCell} ${styles.traditional}`}>Reactive Operations</div>
              <div className={`${styles.compareCell} ${styles.ffAI}`}><CheckCircle2 size={20} color="var(--ff-violet)"/> Predictive Intelligence</div>
            </div>
          </div>
        </div>
      </section>

      {/* 13. FINAL CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow} />
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Modernize<br/>Your Freight Operations?</h2>
            <p className={`${styles.heroSubtitle} ${styles.textCenter}`}>
              Replace disconnected systems with one AI-powered logistics platform.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Link href="/login" className={styles.btnPrimary}>Book a Demo</Link>
              <Link href="/login" className={styles.btnSecondary}>Schedule Consultation</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 14. FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div>
              <div className={styles.logo} style={{ marginBottom: 24 }}>
                <div className={styles.logoIcon}><Anchor size={16} /></div>
                FreightFlow AI
              </div>
              <p style={{ color: 'var(--ff-gray-500)', lineHeight: 1.6, fontSize: '0.875rem' }}>
                The AI operating system for modern freight forwarders and logistics operators globally.
              </p>
            </div>
            <div>
              <div className={styles.footerColTitle}>Platform</div>
              <Link href="#" className={styles.footerLink}>CRM & Sales</Link>
              <Link href="#" className={styles.footerLink}>Operations</Link>
              <Link href="#" className={styles.footerLink}>Customs</Link>
              <Link href="#" className={styles.footerLink}>Tracking</Link>
            </div>
            <div>
              <div className={styles.footerColTitle}>Company</div>
              <Link href="#" className={styles.footerLink}>About Us</Link>
              <Link href="#" className={styles.footerLink}>Careers</Link>
              <Link href="#" className={styles.footerLink}>Contact</Link>
            </div>
            <div>
              <div className={styles.footerColTitle}>Legal</div>
              <Link href="#" className={styles.footerLink}>Privacy Policy</Link>
              <Link href="#" className={styles.footerLink}>Terms of Service</Link>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <div>© 2026 FreightFlow AI. All rights reserved.</div>
            <div>System Status: All Systems Operational</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
