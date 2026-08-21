'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import TrackingMap from '@/components/ui/TrackingMap';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDateTime, getStatusColor } from '@/lib/utils/formatters';
import { LOCATIONS } from '@/lib/data/seedData';
import styles from './tracking.module.css';
import { 
  MapPin, AlertTriangle, Globe2, Plane, Ship, Truck, Activity, Clock, Target, 
  Search, Filter, ChevronRight, CheckCircle2, Package
} from 'lucide-react';

export default function TrackingBoard() {
  const router = useRouter();
  const { state, getEventsForShipment, getOrganization } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState(null);

  const activeShipments = useMemo(() => {
    return state.shipments.filter(s => !['Closed', 'Delivered', 'Draft', 'POD Confirmed'].includes(s.status));
  }, [state.shipments]);

  const exceptions = useMemo(() => {
    return activeShipments.filter(s => s.status === 'Exception' || s.status === 'Customs Hold');
  }, [activeShipments]);

  const filteredShipments = useMemo(() => {
    if (!searchTerm) return activeShipments;
    const lower = searchTerm.toLowerCase();
    return activeShipments.filter(s => 
      s.shipment_reference.toLowerCase().includes(lower) || 
      s.origin_location.toLowerCase().includes(lower) ||
      s.destination_location.toLowerCase().includes(lower)
    );
  }, [activeShipments, searchTerm]);

  // Derive mock feed from latest events across all active shipments
  const activityFeed = useMemo(() => {
    const allEvents = [];
    activeShipments.forEach(s => {
      const events = getEventsForShipment(s.shipment_id);
      if (events.length > 0) {
        allEvents.push({
          ...events[events.length - 1], // get the latest event
          shipmentRef: s.shipment_reference,
          transport_mode: s.transport_mode
        });
      }
    });
    return allEvents.sort((a, b) => new Date(b.event_time) - new Date(a.event_time)).slice(0, 8);
  }, [activeShipments, getEventsForShipment]);

  const getFeedIcon = (code, mode) => {
    if (mode === 'AIR') {
      switch(code) {
        case 'DEP': return <Plane size={14} className="feedIcon flight" />;
        case 'ARR': return <Plane size={14} className="feedIcon flight" style={{transform: 'rotate(90deg)'}} />;
        case 'RCS': return <CheckCircle2 size={14} className="feedIcon success" />;
        case 'RCF': return <Package size={14} className="feedIcon success" />;
      }
    }
    if (mode === 'SEA') {
      switch(code) {
        case 'SAI': return <Ship size={14} className="feedIcon flight" />;
        case 'LOV': return <Package size={14} className="feedIcon success" />;
      }
    }
    if (mode === 'ROAD') {
      switch(code) {
        case 'ITR': return <Truck size={14} className="feedIcon flight" />;
        case 'PKU': return <Package size={14} className="feedIcon success" />;
      }
    }
    return <Activity size={14} className="feedIcon" />;
  };

  const getModeIcon = (mode) => {
    if (mode === 'AIR') return <Plane size={16} />;
    if (mode === 'SEA') return <Ship size={16} />;
    if (mode === 'ROAD') return <Truck size={16} />;
    return <Package size={16} />;
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.page}>
        
        {/* ══════ HERO & COMMAND CENTER ══════ */}
        <div className={styles.heroHeader}>
          <div className={styles.heroLeft}>
            <div className={styles.titleRow}>
              <div className={styles.titleIcon}>
                <div className={styles.pulseDot} />
                <Globe2 size={32} />
              </div>
              <div>
                <h1 className={styles.title}>Global Tracking Center</h1>
                <p className={styles.subtitle}>
                  <Activity size={16} color="#10B981" />
                  Real-time visibility across all active shipments worldwide
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ══════ LIVE KPIs ══════ */}
        <div className={styles.opsDashboard}>
          <div className={styles.opsMetric}>
            <div className={styles.metricLabel}><Package size={14} /> Active Shipments</div>
            <div className={styles.metricValue}>{activeShipments.length}</div>
          </div>
          <div className={styles.opsMetric}>
            <div className={styles.metricLabel}><Globe2 size={14} /> Units In Transit</div>
            <div className={styles.metricValue}>{activeShipments.filter(s => s.status === 'In Transit').length}</div>
          </div>
          <div className={styles.opsMetric}>
            <div className={styles.metricLabel}><AlertTriangle size={14} color="#EF4444" /> Exceptions</div>
            <div className={styles.metricValue} style={{color: exceptions.length > 0 ? '#EF4444' : 'inherit'}}>{exceptions.length}</div>
          </div>
          <div className={styles.opsMetric}>
            <div className={styles.metricLabel}><Clock size={14} /> On-Time %</div>
            <div className={styles.metricValue} style={{color: '#10B981'}}>98.4%</div>
          </div>
          <div className={styles.opsMetric}>
            <div className={styles.metricLabel}><Target size={14} /> Network Health</div>
            <div className={styles.metricValue}>Optimal</div>
          </div>
        </div>

        {/* ══════ INTERACTIVE MAP ══════ */}
        <div className={styles.mapSection}>
          <div className={styles.mapOverlay}>
            <div className={styles.mapLegendItem}>
              <div className={styles.legendDot} style={{background: '#10B981'}} /> Origin
            </div>
            <div className={styles.mapLegendItem}>
              <div className={styles.legendDot} style={{background: '#3B82F6'}} /> Destination
            </div>
            <div className={styles.mapLegendItem}>
              <div className={styles.legendDot} style={{background: '#6366F1'}} /> In Transit
            </div>
          </div>
          <TrackingMap shipments={activeShipments} airports={LOCATIONS} selectedShipmentId={selectedShipmentId} />
        </div>

        {/* ══════ SPLIT LAYOUT ══════ */}
        <div className={styles.splitLayout}>
          
          {/* LEFT: Active Shipments Feed */}
          <div className={styles.shipmentsContainer}>
            <div className={styles.toolbar}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12 }} />
                <input 
                  className={styles.searchInput} 
                  placeholder="Search shipment, documents, or transport references..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: 36 }}
                />
              </div>
              <Button variant="secondary" icon={Filter}>Filters</Button>
            </div>

            <div className={styles.shipmentsList}>
              {filteredShipments.map(shp => {
                const org = getOrganization(shp.org_id);
                // Mock progress percentage based on status for visuals
                let pct = 10;
                if (shp.status === 'In Transit') pct = 65;
                if (['Delivered', 'POD Confirmed'].includes(shp.status)) pct = 100;
                
                return (
                  <div 
                    key={shp.shipment_id} 
                    className={`${styles.shipmentCard} ${selectedShipmentId === shp.shipment_id ? styles.selectedCard : ''}`} 
                    onClick={() => setSelectedShipmentId(selectedShipmentId === shp.shipment_id ? null : shp.shipment_id)}
                  >
                    
                    <div className={styles.cardBlock}>
                      <span className={styles.shpRef}>{shp.shipment_reference}</span>
                      <span className={styles.shpAccount}>{org?.legal_name || 'Unknown Account'}</span>
                      <div style={{marginTop: 4}}>
                        <Badge variant={getStatusColor(shp.status)} dot size="small">{shp.status}</Badge>
                      </div>
                    </div>

                    <div className={styles.routeVisual}>
                      <div className={styles.routePort}>{shp.origin_location}</div>
                      <div className={styles.routeLine}>
                        {shp.status === 'In Transit' && (
                          <div className={styles.routePlane}>
                            {getModeIcon(shp.transport_mode)}
                          </div>
                        )}
                      </div>
                      <div className={styles.routePort}>{shp.destination_location}</div>
                    </div>

                    <div className={styles.progressBlock}>
                      <div className={styles.progressMeta}>
                        <span className={styles.flightBadge}>{shp.transport_mode} Freight</span>
                        {shp.status === 'In Transit' ? (
                          <span className={styles.etaText}>In Transit</span>
                        ) : (
                          <span style={{color: '#64748B'}}>{pct}%</span>
                        )}
                      </div>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div 
                      className={styles.detailsBtn} 
                      onClick={(e) => { e.stopPropagation(); router.push(`/operations/shipments/${shp.shipment_id}`); }}
                    >
                      <ChevronRight size={20} />
                    </div>

                  </div>
                );
              })}
              {filteredShipments.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                  No shipments found matching your search.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Real-Time Activity Feed */}
          <div className={styles.activityFeed}>
            <div className={styles.feedHeader}>
              <Activity size={20} color="#0F172A" />
              Real-Time Activity Feed
              <div style={{ flex: 1 }} />
              <div className={styles.liveIndicator}>
                <div className={styles.pulseDot} style={{ position: 'relative', top: 0, right: 0 }} /> LIVE
              </div>
            </div>

            <div className={styles.feedList}>
              {activityFeed.map((event, idx) => (
                <div key={idx} className={styles.feedItem}>
                  <div className={styles.feedIconWrapper}>
                    {getFeedIcon(event.event_code, event.transport_mode)}
                  </div>
                  <div className={styles.feedContent}>
                    <div className={styles.feedDesc}>{event.description}</div>
                    <div className={styles.feedMeta}>
                      <span style={{ fontWeight: 600, color: '#6366F1' }}>{event.shipmentRef}</span>
                      <span>·</span>
                      <span>{event.location_code}</span>
                      <span>·</span>
                      <span>{formatDateTime(event.event_time)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
