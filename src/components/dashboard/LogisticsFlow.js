'use client';
import { useState } from 'react';
import { 
  Package, ShieldCheck, Plane, MapPin, CheckCircle2, Clock, 
  Sparkles, Navigation, Anchor, FileText, Activity, ArrowRight, ChevronRight
} from 'lucide-react';
import styles from './DashboardComponents.module.css';

const SHIPMENTS_DATA = [
  {
    id: 'FF-8842',
    mode: 'Air Freight',
    icon: Plane,
    route: 'DXB → LHR',
    carrier: 'Emirates SkyCargo • EK-201',
    status: 'In Transit / Import',
    progress: 72,
    eta: 'Today, 06:30 PM',
    activeStep: 3,
    stages: [
      {
        id: 'origin',
        shortTitle: 'Origin',
        title: 'Origin Pickup & Cargo Scan',
        location: 'Dubai Logistics City (DLC)',
        time: 'Sep 3, 08:30 AM',
        status: 'completed',
        icon: Package,
        detail: 'Palletized ULD-902 scanned & received at export facility.'
      },
      {
        id: 'export',
        shortTitle: 'Export',
        title: 'Export Customs Clearance',
        location: 'DXB Cargo Mega Terminal',
        time: 'Sep 3, 02:15 PM',
        status: 'completed',
        icon: ShieldCheck,
        detail: 'Customs declaration approved. Zero discrepancies flagged by AI Guard.'
      },
      {
        id: 'transit',
        shortTitle: 'Transit',
        title: 'Airway In-Flight Transit',
        location: 'Airborne (Alt: 35,000 ft)',
        time: 'Sep 4, 02:40 AM',
        status: 'completed',
        icon: Plane,
        detail: 'Flight EK-201 departed DXB. On schedule with live telemetry tracking.'
      },
      {
        id: 'import',
        shortTitle: 'Import',
        title: 'Import Clearance & Inspection',
        location: 'London Heathrow (LHR) Hub',
        time: 'In Progress (ETA ~2h)',
        status: 'active',
        icon: Navigation,
        detail: 'Customs clearance documents submitted. Final clearance verification underway.',
        telemetry: {
          temp: '4.2°C',
          compliance: '100% Verified',
          sla: 'On Time'
        }
      },
      {
        id: 'delivered',
        shortTitle: 'Delivered',
        title: 'Final Destination Delivery',
        location: 'Customer Warehouse, Slough UK',
        time: 'Scheduled Sep 5',
        status: 'upcoming',
        icon: CheckCircle2,
        detail: 'Final mile transport pre-assigned to UK Express Logistics.'
      }
    ]
  },
  {
    id: 'SH-4091',
    mode: 'Ocean Freight',
    icon: Anchor,
    route: 'SHA → RTM',
    carrier: 'Maersk Line • Vessel MSK-708',
    status: 'On Ocean Transit',
    progress: 45,
    eta: 'Sep 12, 10:00 AM',
    activeStep: 2,
    stages: [
      {
        id: 'origin',
        shortTitle: 'Origin',
        title: 'Container Loading & Gate-In',
        location: 'Port of Shanghai (SHA)',
        time: 'Aug 28, 11:00 AM',
        status: 'completed',
        icon: Package,
        detail: '40ft High Cube Container #MSKU-9102 gate-in complete.'
      },
      {
        id: 'export',
        shortTitle: 'Export',
        title: 'Maritime Export Filing',
        location: 'Shanghai Customs Zone',
        time: 'Aug 29, 04:30 PM',
        status: 'completed',
        icon: ShieldCheck,
        detail: 'Bill of Lading issued & automated export clearance released.'
      },
      {
        id: 'transit',
        shortTitle: 'Transit',
        title: 'Deep Sea Vessel Voyage',
        location: 'Indian Ocean Transit',
        time: 'In Progress (Day 6 of 14)',
        status: 'active',
        icon: Anchor,
        detail: 'Vessel traveling at 18.2 knots. Weather parameters normal.',
        telemetry: {
          temp: 'Ambient',
          compliance: 'Clean Pass',
          sla: 'On Schedule'
        }
      },
      {
        id: 'import',
        shortTitle: 'Import',
        title: 'Europort Customs Clearance',
        location: 'Port of Rotterdam (RTM)',
        time: 'Scheduled Sep 10',
        status: 'upcoming',
        icon: Navigation,
        detail: 'Pre-arrival customs filing scheduled 48h before docking.'
      },
      {
        id: 'delivered',
        shortTitle: 'Delivered',
        title: 'Inland Rail Hub Delivery',
        location: 'Duisburg Logistics Hub, DE',
        time: 'Scheduled Sep 12',
        status: 'upcoming',
        icon: CheckCircle2,
        detail: 'Rail barge slot reserved.'
      }
    ]
  }
];

export default function LogisticsFlow() {
  const [selectedShipmentId, setSelectedShipmentId] = useState('FF-8842');
  const activeShipment = SHIPMENTS_DATA.find(s => s.id === selectedShipmentId) || SHIPMENTS_DATA[0];
  
  const [selectedStepIndex, setSelectedStepIndex] = useState(activeShipment.activeStep);

  const focusedStage = activeShipment.stages[selectedStepIndex] || activeShipment.stages[activeShipment.activeStep];
  const FocusedIcon = focusedStage.icon;

  return (
    <div className={styles.pipelineWrapper}>
      {/* Top Shipment Selector & Meta Header */}
      <div className={styles.shipmentSelectorBar}>
        <div className={styles.shipmentTabs}>
          {SHIPMENTS_DATA.map(shipment => {
            const Icon = shipment.icon;
            const isSelected = shipment.id === selectedShipmentId;
            return (
              <button
                key={shipment.id}
                onClick={() => {
                  setSelectedShipmentId(shipment.id);
                  setSelectedStepIndex(shipment.activeStep);
                }}
                className={`${styles.shipmentTab} ${isSelected ? styles.shipmentTabActive : ''}`}
              >
                <Icon size={13} />
                <span className={styles.tabId}>{shipment.id}</span>
                <span className={styles.tabRoute}>{shipment.route}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.shipmentMetaBadge}>
          <Sparkles size={11} className={styles.metaSparkle} />
          <span>{activeShipment.carrier}</span>
        </div>
      </div>

      {/* Progress Track Meta Bar */}
      <div className={styles.progressMetaRow}>
        <div className={styles.progressMetaLeft}>
          <span className={styles.livePulseDot} />
          <span className={styles.progressStatusText}>{activeShipment.status}</span>
        </div>
        <div className={styles.progressMetaRight}>
          <Clock size={12} />
          <span>ETA: {activeShipment.eta}</span>
        </div>
      </div>

      {/* Desktop Stepper (Horizontal Layout for Desktop) */}
      <div className={styles.desktopStepperContainer}>
        <div className={styles.stepperTrack}>
          <div 
            className={styles.stepperProgressFill}
            style={{ width: `${(activeShipment.activeStep / (activeShipment.stages.length - 1)) * 100}%` }}
          />
        </div>

        <div className={styles.stepperNodesRow}>
          {activeShipment.stages.map((stage, idx) => {
            const StepIcon = stage.icon;
            const isCompleted = stage.status === 'completed';
            const isActive = stage.status === 'active';
            const isSelected = selectedStepIndex === idx;

            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStepIndex(idx)}
                className={`${styles.stepperNodeBtn} ${isCompleted ? styles.completedStep : ''} ${isActive ? styles.activeStep : ''} ${isSelected ? styles.selectedStep : ''}`}
              >
                <div className={styles.stepCircle}>
                  {isCompleted ? '✓' : <StepIcon size={13} />}
                </div>
                <span className={styles.stepTitle}>{stage.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Stage Detail Card (Desktop Focused Active View) */}
      <div className={styles.featuredStageCard}>
        <div className={styles.featuredHeader}>
          <div className={styles.featuredTitleBox}>
            <div className={`${styles.featuredIconBadge} ${focusedStage.status === 'completed' ? styles.badgeSuccess : focusedStage.status === 'active' ? styles.badgePrimary : styles.badgeMuted}`}>
              <FocusedIcon size={16} />
            </div>
            <div>
              <h4 className={styles.featuredTitle}>{focusedStage.title}</h4>
              <p className={styles.featuredLocation}>{focusedStage.location}</p>
            </div>
          </div>

          <div className={styles.featuredMetaBox}>
            <span className={styles.featuredTime}>{focusedStage.time}</span>
            {focusedStage.status === 'active' && (
              <span className={styles.activePill}>
                <span className={styles.activePillDot} />
                IN PROGRESS
              </span>
            )}
            {focusedStage.status === 'completed' && (
              <span className={styles.completedPill}>✓ Completed</span>
            )}
          </div>
        </div>

        <p className={styles.featuredDetail}>{focusedStage.detail}</p>

        {/* Telemetry Bar if available */}
        {focusedStage.telemetry && (
          <div className={styles.telemetryBar}>
            <div className={styles.telemetryStat}>
              <span className={styles.statLabel}>Temp</span>
              <span className={styles.statVal}>{focusedStage.telemetry.temp}</span>
            </div>
            <div className={styles.statSep} />
            <div className={styles.telemetryStat}>
              <span className={styles.statLabel}>AI Guard</span>
              <span className={styles.statValSuccess}>{focusedStage.telemetry.compliance}</span>
            </div>
            <div className={styles.statSep} />
            <div className={styles.telemetryStat}>
              <span className={styles.statLabel}>SLA Status</span>
              <span className={styles.statValPrimary}>{focusedStage.telemetry.sla}</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile/Tablet Fallback Stream (Rendered only on Mobile <= 767px) */}
      <div className={styles.mobileFlowContainer}>
        {activeShipment.stages.map((stage) => {
          const StageIcon = stage.icon;
          return (
            <div key={stage.id} className={styles.mobileStageRow}>
              <div className={`${styles.mobileIconCircle} ${stage.status === 'completed' ? styles.completed : stage.status === 'active' ? styles.active : ''}`}>
                <StageIcon size={14} />
              </div>
              <div className={styles.mobileStageInfo}>
                <div className={styles.mobileStageTop}>
                  <span className={styles.mobileStageName}>{stage.title}</span>
                  <span className={styles.mobileStageTime}>{stage.time}</span>
                </div>
                <span className={styles.mobileStageSub}>{stage.location}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
