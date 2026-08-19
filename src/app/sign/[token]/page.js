'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import ComprehensiveAWB from '@/components/documents/ComprehensiveAWB';
import SignaturePad from '@/components/documents/SignaturePad';
import styles from '@/components/documents/documents.module.css';

export default function ClientSigningPage() {
  const { token } = useParams();
  const { state, dispatch, getAccount } = useApp();
  const [signatureData, setSignatureData] = useState(null);
  const [signerName, setSignerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Look up the document or legacy invoice by share_token
  const doc = state.documents.find(d => d.share_token === token);
  const invoice = !doc ? state.invoices?.find(i => i.share_token === token) : null;
  const item = doc || invoice;

  // Mark as Viewed if not already
  useEffect(() => {
    if (item && (item.status === 'Shared' || item.status === 'Generated' || item.status === 'Draft')) {
      if (doc) {
        dispatch({ type: 'UPDATE_DOCUMENT', payload: { document_id: item.document_id, status: 'Viewed' } });
      } else if (invoice) {
        dispatch({ type: 'UPDATE_INVOICE', payload: { invoice_id: item.invoice_id, status: 'Viewed' } });
      }
    }
  }, [item?.status, item?.document_id, item?.invoice_id, doc, invoice, dispatch]);

  if (!item) {
    return (
      <div className={styles.signingPage}>
        <div className={styles.signingContainer}>
          <div className={styles.signingCard}>
            <div className={styles.successScreen}>
              <div className={styles.successIcon} style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', color: '#dc2626' }}>!</div>
              <div className={styles.successTitle}>Document Not Found</div>
              <div className={styles.successSubtitle}>
                This link may have expired or is invalid. Please contact your freight forwarder for a new link.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const shipment = state.shipments.find(s => s.shipment_id === item.shipment_id);
  const awb = item.awb_id ? state.airWaybills.find(a => a.awb_id === item.awb_id) : null;
  const account = shipment ? getAccount(shipment.account_id) : null;

  const isAlreadySigned = item.status === 'Signed' || item.status === 'Completed';

  const handleSubmitSignature = () => {
    if (!signerName.trim()) return;
    
    // Auto-generate a basic cursive signature if they didn't draw one
    const finalSignature = signatureData || `TEXT:${signerName.trim()}`;

    if (doc) {
      dispatch({
        type: 'SIGN_DOCUMENT',
        payload: { document_id: item.document_id, signature_data: finalSignature, signer_name: signerName.trim() }
      });
    } else if (invoice) {
      dispatch({
        type: 'SIGN_INVOICE',
        payload: { invoice_id: item.invoice_id, signature_data: finalSignature, signer_name: signerName.trim() }
      });
    }

    setSubmitted(true);
  };

  if (submitted || isAlreadySigned) {
    return (
      <div className={styles.signingPage}>
        <div className={styles.signingContainer}>
          <div className={styles.signingHeader}>
            <div className={styles.signingLogo}>
              <div className={styles.logoIcon}>✈</div>
              <div className={styles.companyName}>FreightFlow Logistics</div>
            </div>
          </div>
          <div className={styles.signingCard}>
            <div className={styles.successScreen}>
              <div className={styles.successIcon}>✓</div>
              <div className={styles.successTitle}>Document Signed Successfully</div>
              <div className={styles.successSubtitle}>
                Thank you{item.signer_name ? `, ${item.signer_name}` : ''}! Your signature has been recorded and the document has been updated in our system.
                You may close this page.
              </div>
            </div>
          </div>

          {/* Show the signed document */}
          <div className={styles.signingCard}>
            <ComprehensiveAWB awb={awb} shipment={shipment} account={account} signature={item.signature_data || signatureData} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.signingPage}>
      <div className={styles.signingContainer}>
        {/* Header */}
        <div className={styles.signingHeader}>
          <div className={styles.signingLogo}>
            <div className={styles.logoIcon}>✈</div>
            <div className={styles.companyName}>FreightFlow Logistics</div>
          </div>
          <div className={styles.signingTitle}>Document Review & Signature</div>
          <div className={styles.signingSubtitle}>
            Please review the document below carefully. Once satisfied, add your signature at the bottom to confirm.
          </div>
        </div>

        {/* Document Preview */}
        <div className={styles.signingCard}>
          <div className={styles.signingCardTitle}>📄 {item.document_type || 'Invoice'}</div>
          <div className={styles.signingCardSubtitle}>
            Shipment: {shipment?.shipment_reference} · {shipment?.origin_airport} → {shipment?.destination_airport}
          </div>

          <ComprehensiveAWB awb={awb} shipment={shipment} account={account} />
        </div>

        {/* Signature Section */}
        <div className={styles.signingCard}>
          <div className={styles.signingCardTitle}>✍️ Digital Signature</div>
          <div className={styles.signingCardSubtitle}>
            By signing below, you acknowledge that you have reviewed the above document and agree to its contents.
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Your Full Name *
            </label>
            <input
              type="text"
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              placeholder="Enter your full name"
              style={{
                width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 10,
                fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#0d9488'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Signature *
            </label>
            <SignaturePad onSignatureChange={setSignatureData} />
          </div>

          <div className={styles.signingActions}>
            <button
              className={`${styles.signingBtn} ${styles.signingBtnPrimary}`}
              onClick={handleSubmitSignature}
              disabled={!signerName.trim()}
            >
              Submit Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
