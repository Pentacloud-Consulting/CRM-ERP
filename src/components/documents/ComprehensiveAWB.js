'use client';
import { formatDate, formatWeight, formatCurrency, formatAWBNumber } from '@/lib/utils/formatters';
import { CARRIERS, AIRPORTS } from '@/lib/data/seedData';
import styles from './documents.module.css';

export default function ComprehensiveAWB({ awb, shipment, account, signature, doc }) {
  const carrier = CARRIERS.find(c => c.id === awb?.carrier_id);
  const origin = AIRPORTS[awb?.origin_airport];
  const dest = AIRPORTS[awb?.destination_airport];

  if (!shipment && !awb) return null;

  // Compute Bill/Invoice amounts dynamically if not stored on AWB
  const chargeableWt = shipment?.chargeable_weight_kg || awb?.chargeable_weight_kg || 0;
  
  const invoiceData = doc?.invoice_data || {};
  const ratePerKg = invoiceData.ratePerKg !== undefined ? Number(invoiceData.ratePerKg) : 2.50;
  const handlingFee = invoiceData.handlingFee !== undefined ? Number(invoiceData.handlingFee) : 75;
  const docFee = invoiceData.docFee !== undefined ? Number(invoiceData.docFee) : 35;
  
  const freightCharge = chargeableWt * ratePerKg;
  const fuelSurcharge = freightCharge * 0.15;
  const securityFee = chargeableWt * 0.10;
  const subtotal = freightCharge + fuelSurcharge + securityFee + handlingFee + docFee;
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const currency = awb?.currency_code || 'USD';

  return (
    <div className={styles.documentPage}>
      {/* Header */}
      <div className={styles.docHeader}>
        <div className={styles.docHeaderLeft}>
          <div className={styles.docLogo}>
            <div className={styles.logoIcon}>✈</div>
            <div>
              <div className={styles.companyName}>FreightFlow Logistics</div>
              <div className={styles.companySubtitle}>Air Freight Solutions</div>
            </div>
          </div>
          <div className={styles.companyAddress}>
            <div>P.O. Box 12345, Doha, Qatar</div>
            <div>Tel: +974 4444 5555 | info@freightflow.qa</div>
          </div>
        </div>
        <div className={styles.docHeaderRight}>
          <div className={styles.docType} style={{ fontSize: 20 }}>COMPREHENSIVE WAYBILL & INVOICE</div>
          <div className={styles.awbNumber}>{awb ? formatAWBNumber(awb.awb_number) : 'PENDING AWB'}</div>
          <div className={styles.invoiceDate}>Date: {formatDate(awb?.created_at || new Date().toISOString())}</div>
        </div>
      </div>

      <div className={styles.docDivider} />

      {/* Parties Grid */}
      <div className={styles.partiesGrid}>
        <div className={styles.partyBox}>
          <div className={styles.partyLabel}>SHIPPER / BILL TO</div>
          <div className={styles.partyName}>{account?.legal_name || '—'}</div>
          <div className={styles.partyDetail}>{account?.country || ''}</div>
          <div className={styles.partyDetail}>Tax ID: {account?.tax_id || 'N/A'}</div>
        </div>
        <div className={styles.partyBox}>
          <div className={styles.partyLabel}>CONSIGNEE</div>
          <div className={styles.partyName}>{shipment?.consignee_name || account?.legal_name || '—'}</div>
          <div className={styles.partyDetail}>{dest?.city || ''}, {dest?.country || ''}</div>
          <div className={styles.partyDetail}>Shipment Ref: {shipment?.shipment_reference || ''}</div>
        </div>
      </div>

      {/* Routing */}
      <div className={styles.routingSection} style={{ marginBottom: 16 }}>
        <div className={styles.routeBox}>
          <div className={styles.routeLabel}>DEPARTURE</div>
          <div className={styles.routeCode}>{awb?.origin_airport || shipment?.origin_airport}</div>
          <div className={styles.routeCity}>{origin?.city || ''}, {origin?.country || ''}</div>
        </div>
        <div className={styles.routeArrow}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M8 20h24M24 12l8 8-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className={styles.routeCarrier}>{carrier?.code} — {carrier?.name}</div>
        </div>
        <div className={styles.routeBox}>
          <div className={styles.routeLabel}>DESTINATION</div>
          <div className={styles.routeCode}>{awb?.destination_airport || shipment?.destination_airport}</div>
          <div className={styles.routeCity}>{dest?.city || ''}, {dest?.country || ''}</div>
        </div>
      </div>

      {/* Packing List / Shipment Details */}
      <div className={styles.detailsTable}>
        <div className={styles.tableHeader}>PACKAGE DETAILS</div>
        <table className={styles.docTable}>
          <thead>
            <tr>
              <th>Total Pieces</th>
              <th>Dimensions (cm)</th>
              <th>Commodity</th>
              <th>Gross Wt (kg)</th>
              <th>Chg Wt (kg)</th>
              <th>Handling</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{shipment?.pieces || awb?.pieces}</td>
              <td>{shipment?.dimensions || '60×40×40'}</td>
              <td>{shipment?.cargo_type || 'General Cargo'}</td>
              <td>{formatWeight(shipment?.gross_weight_kg || awb?.gross_weight_kg)}</td>
              <td>{formatWeight(chargeableWt)}</td>
              <td>{shipment?.special_handling_codes?.join(', ') || 'STD'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Itemized Billing / Invoice */}
      <div className={styles.detailsTable}>
        <div className={styles.tableHeader}>ITEMIZED CHARGES</div>
        <table className={styles.docTable}>
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Description</th>
              <th style={{ width: '15%' }}>Qty / Wt</th>
              <th style={{ width: '15%' }}>Rate</th>
              <th style={{ width: '20%', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Air Freight Charge ({awb?.rate_class || 'Q'} Class)</td>
              <td>{formatWeight(chargeableWt)}</td>
              <td>{formatCurrency(ratePerKg, currency)}/kg</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(freightCharge, currency)}</td>
            </tr>
            <tr>
              <td>Fuel Surcharge (15%)</td>
              <td>1</td>
              <td>—</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(fuelSurcharge, currency)}</td>
            </tr>
            <tr>
              <td>Security Surcharge</td>
              <td>{formatWeight(chargeableWt)}</td>
              <td>{formatCurrency(0.10, currency)}</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(securityFee, currency)}</td>
            </tr>
            <tr>
              <td>Terminal Handling Fee</td>
              <td>1</td>
              <td>{formatCurrency(75, currency)}</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(handlingFee, currency)}</td>
            </tr>
            <tr>
              <td>Documentation Fee</td>
              <td>1</td>
              <td>{formatCurrency(35, currency)}</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(docFee, currency)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className={`${styles.invoiceTotals} avoid-page-break`}>
        <div className={styles.totalsRow}>
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal, currency)}</span>
        </div>
        <div className={styles.totalsRow}>
          <span>Tax (5% VAT)</span>
          <span>{formatCurrency(tax, currency)}</span>
        </div>
        <div className={`${styles.totalsRow} ${styles.grandTotal}`}>
          <span>TOTAL DUE</span>
          <span>{formatCurrency(total, currency)}</span>
        </div>
      </div>

      {/* Conditions of Contract / Liability */}
      <div className={`${styles.termsSection} avoid-page-break`} style={{ marginTop: 32, background: '#f8fafc', borderColor: '#e2e8f0' }}>
        <div className={styles.termsTitle} style={{ color: '#475569', fontSize: 10 }}>CONDITIONS OF CONTRACT & LIMITATION OF LIABILITY</div>
        <div className={styles.termsText} style={{ color: '#64748b', fontSize: 10, lineHeight: 1.4 }}>
          1. Carrier's liability is limited in accordance with the Warsaw Convention and the Montreal Convention. In the event of loss, damage, delay, or airplane crash, the Carrier is not responsible for any consequential or indirect damages. Liability for cargo is strictly limited to 22 SDR (Special Drawing Rights) per kilogram, unless a higher value is declared in advance and supplementary charges are paid.<br/>
          2. The Shipper guarantees payment of all charges, including return freight, in the event the consignee refuses delivery.<br/>
          3. Goods may be subject to security checks and x-ray screening by relevant authorities without prior notice.
        </div>
      </div>

      {/* Signatures */}
      <div className={`${styles.docFooter} avoid-page-break`}>
        <div className={styles.signatureBox}>
          <div className={styles.sigTitle}>Shipper / Exporter Signature</div>
          {signature ? (
            signature.startsWith('TEXT:') ? (
              <div style={{ padding: 20, fontFamily: 'cursive', fontSize: 24, color: '#0f172a' }}>
                {signature.replace('TEXT:', '')}
              </div>
            ) : signature.startsWith('TYPED:') ? (
              <div style={{ padding: 20, fontFamily: signature.split(':')[1], fontSize: 28, color: '#0f172a' }}>
                {signature.split(':').slice(2).join(':')}
              </div>
            ) : (
              <img src={signature} alt="Signature" className={styles.sigImage} />
            )
          ) : (
            <div className={styles.sigPlaceholder}>Awaiting Signature</div>
          )}
        </div>
        <div className={styles.signatureBox}>
          <div className={styles.sigLabel}>AUTHORIZED CARRIER / AGENT</div>
          <div className={styles.sigCarrier}>FreightFlow Logistics</div>
          <div className={styles.sigDate}>Date: {formatDate(awb?.created_at || new Date().toISOString())}</div>
        </div>
      </div>

      <div className={styles.docWatermark}>
        <div>Comprehensive Bill Ref: {awb?.awb_number || shipment?.shipment_reference || 'PENDING'}</div>
        <div>Generated: {formatDate(new Date().toISOString())}</div>
      </div>
    </div>
  );
}
