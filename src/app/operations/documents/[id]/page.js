'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Printer, CheckCircle, FileText, Copy, ExternalLink } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ComprehensiveAWB from '@/components/documents/ComprehensiveAWB';
import { formatDate, getStatusColor } from '@/lib/utils/formatters';
import styles from '@/components/documents/documents.module.css';

export default function DocumentViewerPage() {
  const { id } = useParams();
  const router = useRouter();
  const { state, dispatch, getAccount } = useApp();
  const [copied, setCopied] = useState(false);

  const doc = state.documents.find(d => d.document_id === id);
  const invoice = !doc ? state.invoices?.find(i => i.invoice_id === id) : null;
  const item = doc || invoice;
  if (!item) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => router.back()}>Back</Button>
        <p style={{ color: 'var(--text-tertiary)', marginTop: '2rem' }}>Document not found</p>
      </div>
    );
  }

  const shipment = state.shipments.find(s => s.shipment_id === item.shipment_id);
  const awb = item.awb_id ? state.airWaybills.find(a => a.awb_id === item.awb_id) : state.airWaybills.find(a => a.shipment_id === item.shipment_id);
  const account = shipment ? getAccount(shipment.account_id) : null;

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/sign/${item.share_token}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Update status to Shared if still Generated
    if (item.status === 'Generated' || item.status === 'Draft') {
      if (doc) {
        dispatch({ type: 'UPDATE_DOCUMENT', payload: { document_id: item.document_id, status: 'Shared' } });
      } else if (invoice) {
        dispatch({ type: 'UPDATE_INVOICE', payload: { invoice_id: item.invoice_id, status: 'Shared' } });
      }
    }
  };

  const handlePrint = () => window.print();

  const getDocStatusColor = (status) => {
    switch (status) {
      case 'Generated': case 'Draft': return 'neutral';
      case 'Shared': return 'info';
      case 'Viewed': return 'warning';
      case 'Signed': return 'success';
      case 'Completed': return 'success';
      default: return 'neutral';
    }
  };

  return (
    <div className={styles.viewerPage}>
      <Button variant="ghost" icon={ArrowLeft} onClick={() => router.back()}>Back</Button>

      <div className={styles.viewerHeader} style={{ marginTop: 16 }}>
        <div className={styles.viewerMeta}>
          <FileText size={20} />
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>
              {item.document_type || 'Invoice'} {item.invoice_number ? `— ${item.invoice_number}` : ''}
            </h1>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
              {shipment?.shipment_reference} · {formatDate(item.created_at)}
            </span>
          </div>
          <Badge variant={getDocStatusColor(item.status)} dot>{item.status}</Badge>
          {item.signed_at && (
            <Badge variant="success" dot>
              <CheckCircle size={12} style={{ marginRight: 4 }} />
              Signed {formatDate(item.signed_at)}
              {item.signer_name ? ` by ${item.signer_name}` : ''}
            </Badge>
          )}
        </div>
        <div className={styles.viewerActions}>
          <Button variant="secondary" icon={Printer} onClick={handlePrint}>Print</Button>
          <Button variant="primary" icon={Share2} onClick={copyLink}>
            {copied ? 'Link Copied!' : 'Share with Client'}
          </Button>
        </div>
      </div>

      {/* Share Link */}
      {item.share_token && (
        <div className={styles.shareLink}>
          <ExternalLink size={14} />
          <span>Client Link:</span>
          <span className={styles.shareLinkUrl}>{shareUrl}</span>
          <button onClick={copyLink} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', display: 'flex', alignItems: 'center' }}>
            <Copy size={14} />
          </button>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <ComprehensiveAWB awb={awb} shipment={shipment} account={account} signature={item.signature_data} doc={item} />
      </div>
    </div>
  );
}
