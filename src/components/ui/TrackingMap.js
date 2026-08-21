'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import styles from './TrackingMap.module.css';

import 'leaflet/dist/leaflet.css';

// Leaflet icon fix for Next.js
const setupLeaflet = async () => {
  const L = (await import('leaflet')).default;
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
  return L;
};

const findLocation = (airports, shipmentLoc, shipmentAirport) => {
  if (!shipmentLoc && !shipmentAirport) return null;
  
  let searchLoc = shipmentLoc;
  if (typeof searchLoc === 'string' && searchLoc.includes('{"name"')) {
    try { searchLoc = JSON.parse(searchLoc).name; } catch(e) {}
  }

  if (airports[shipmentAirport]) return airports[shipmentAirport];
  if (airports[searchLoc]) return airports[searchLoc];
  
  const values = Object.values(airports);
  return values.find(a => a.code === shipmentAirport) ||
         values.find(a => a.code === searchLoc) ||
         values.find(a => a.name === searchLoc || a.city === searchLoc) ||
         values.find(a => searchLoc && (a.name.includes(searchLoc) || a.city.includes(searchLoc)));
};

// We will use a ref to get the map instance directly
export default function TrackingMap({ shipments = [], airports = {}, selectedShipmentId = null }) {
  const [L, setL] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    setupLeaflet().then(setL);
  }, []);

  useEffect(() => {
    if (mapInstance && selectedShipmentId && L && airports) {
      const selectedShipment = shipments.find(s => s.shipment_id === selectedShipmentId);
      if (selectedShipment) {
        const origin = findLocation(airports, selectedShipment.origin_location, selectedShipment.origin_airport);
        const dest = findLocation(airports, selectedShipment.destination_location, selectedShipment.destination_airport);
        if (origin && dest) {
          const bounds = L.latLngBounds([origin.lat, origin.lng], [dest.lat, dest.lng]);
          mapInstance.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }, [mapInstance, selectedShipmentId, L, airports, shipments]);

  if (!L || typeof window === 'undefined') {
    return <div className={styles.loading}>Loading map...</div>;
  }

  // Create a custom icon for active shipments
  const activeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const exceptionIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Calculate center based on all airports or default to Middle East/Europe
  const center = [35, 30]; 
  const zoom = 3;

  return (
    <div className={styles.mapContainer}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className={styles.map} ref={setMapInstance}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Draw routes and markers for each shipment */}
        {shipments.map(shipment => {
          const origin = findLocation(airports, shipment.origin_location, shipment.origin_airport);
          const dest = findLocation(airports, shipment.destination_location, shipment.destination_airport);
          
          if (!origin || !dest) return null;

          const isException = shipment.status === 'Exception' || shipment.status === 'Customs Hold';
          const icon = isException ? exceptionIcon : activeIcon;
          
          const isSelected = selectedShipmentId === shipment.shipment_id;
          const isFaded = selectedShipmentId && !isSelected;
          
          return (
            <div key={shipment.shipment_id}>
              {/* Route line */}
              <Polyline 
                positions={[[origin.lat, origin.lng], [dest.lat, dest.lng]]} 
                color={isException ? '#E5484D' : (isSelected ? '#10B981' : '#5FC7BE')} 
                weight={isSelected ? 4 : 2}
                opacity={isFaded ? 0.2 : (isSelected ? 1 : 0.6)}
                dashArray={isSelected ? null : "5, 10"}
              />
              
              {/* Origin Marker */}
              <Marker position={[origin.lat, origin.lng]} title={origin.code} opacity={isFaded ? 0.4 : 1}>
                <Popup>
                  <strong>{origin.code}</strong><br />
                  {origin.name}
                </Popup>
              </Marker>
              
              {/* Destination Marker */}
              <Marker position={[dest.lat, dest.lng]} title={dest.code} opacity={isFaded ? 0.4 : 1}>
                <Popup>
                  <strong>{dest.code}</strong><br />
                  {dest.name}
                </Popup>
              </Marker>

              {/* Current position */}
              {(!isFaded || isSelected) && (
                <Marker position={[origin.lat, origin.lng]} icon={icon}>
                  <Popup>
                    <strong>{shipment.shipment_reference}</strong><br/>
                    Status: {shipment.status}<br/>
                    Route: {origin.code} → {dest.code}
                  </Popup>
                </Marker>
              )}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
