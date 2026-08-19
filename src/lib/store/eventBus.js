// Domain Event Bus — publish/subscribe pattern for CRM ↔ Logistics integration
// Events: LeadConverted, DealWon, BookingConfirmed, AWBIssued, FSUReceived, CustomsHeld, ShipmentDelivered

class EventBus {
  constructor() {
    this.listeners = {};
    this.eventLog = [];
  }

  subscribe(eventType, callback) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
    return () => {
      this.listeners[eventType] = this.listeners[eventType].filter(cb => cb !== callback);
    };
  }

  publish(eventType, payload, user = 'system') {
    const event = {
      event_type: eventType,
      payload,
      timestamp: new Date().toISOString(),
      user,
    };
    this.eventLog.unshift(event);
    if (this.eventLog.length > 100) this.eventLog.pop();

    if (this.listeners[eventType]) {
      this.listeners[eventType].forEach(cb => {
        try { cb(event); } catch (e) { console.error(`Event handler error for ${eventType}:`, e); }
      });
    }
    return event;
  }

  getLog() {
    return [...this.eventLog];
  }
}

export const eventBus = new EventBus();

// Event type constants
export const EVENT_TYPES = {
  LEAD_CONVERTED: 'LeadConverted',
  DEAL_WON: 'DealWon',
  BOOKING_CONFIRMED: 'BookingConfirmed',
  AWB_ISSUED: 'AWBIssued',
  FSU_RECEIVED: 'FSUReceived',
  CUSTOMS_HELD: 'CustomsHeld',
  SHIPMENT_DELIVERED: 'ShipmentDelivered',
};
