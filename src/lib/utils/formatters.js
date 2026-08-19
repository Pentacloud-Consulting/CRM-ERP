// Utility formatters for dates, weights, currencies, and AWB numbers

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function formatWeight(kg) {
  if (kg == null) return '—';
  return `${Number(kg).toLocaleString('en', { maximumFractionDigits: 1 })} kg`;
}

export function formatVolume(cbm) {
  if (cbm == null) return '—';
  return `${Number(cbm).toFixed(1)} CBM`;
}

export function formatCurrency(amount, currencyCode = 'USD') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAWBNumber(awbNum) {
  if (!awbNum || awbNum.length !== 11) return awbNum || '—';
  return `${awbNum.slice(0, 3)}-${awbNum.slice(3)}`;
}

export function validateAWBCheckDigit(awbNum) {
  if (!awbNum || awbNum.length !== 11) return false;
  const serial7 = parseInt(awbNum.slice(3, 10), 10);
  const checkDigit = parseInt(awbNum[10], 10);
  return serial7 % 7 === checkDigit;
}

export function calculateChargeableWeight(grossKg, volumeCbm) {
  const volumetricKg = volumeCbm * 167; // IATA standard: 1 CBM = 167 kg
  return Math.max(grossKg, volumetricKg);
}

export function getStatusColor(status) {
  const statusMap = {
    // Lead statuses
    'New': 'info',
    'Qualifying': 'warning',
    'Qualified': 'success',
    'Disqualified': 'danger',
    'Converted': 'primary',
    // Opportunity stages
    'Proposal': 'info',
    'Negotiation': 'warning',
    'Won': 'success',
    'Lost': 'danger',
    // Shipment statuses
    'Booked': 'info',
    'Documentation': 'info',
    'Ready for Carriage': 'primary',
    'In Transit': 'primary',
    'Customs Hold': 'danger',
    'Delivered': 'success',
    'POD Confirmed': 'success',
    'Closed': 'neutral',
    'Exception': 'danger',
    // Booking statuses
    'Requested': 'info',
    'Space Confirmed': 'success',
    'Waitlisted': 'warning',
    'Rejected': 'danger',
    'Cancelled': 'neutral',
    // AWB statuses
    'Not Transmitted': 'neutral',
    'Transmitted': 'warning',
    'Acknowledged': 'success',
    // Customs statuses
    'Pending Filing': 'info',
    'Filed': 'warning',
    'Under Inspection': 'warning',
    'Cleared': 'success',
    'Held': 'danger',
    // ULD statuses
    'Available': 'success',
    'Build-Up in Progress': 'warning',
    'Built-Up': 'primary',
    'Loaded': 'primary',
    'Empty Return': 'info',
    'Damaged': 'danger',
    'Under Repair': 'warning',
  };
  return statusMap[status] || 'neutral';
}

export function getEventTypeLabel(eventType) {
  const labels = {
    LeadConverted: 'Lead Converted',
    DealWon: 'Deal Won',
    BookingConfirmed: 'Booking Confirmed',
    AWBIssued: 'AWB Issued',
    FSUReceived: 'FSU Received',
    CustomsHeld: 'Customs Held',
    ShipmentDelivered: 'Shipment Delivered',
  };
  return labels[eventType] || eventType;
}

export function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function fuzzyMatch(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  // Simple character overlap
  const chars1 = new Set(s1.split(''));
  const chars2 = new Set(s2.split(''));
  const overlap = [...chars1].filter(c => chars2.has(c)).length;
  return overlap / Math.max(chars1.size, chars2.size);
}
