import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Printer, Check, X } from 'lucide-react';

export function ReceiptModal({ isOpen, transaction, onClose }) {
  useEffect(() => {
    if (isOpen && transaction) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '6px', borderRadius: '8px' }}>
              <Check size={18} color="#10b981" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#10b981' }}>Transaksi Berhasil!</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Thermal Receipt Box */}
        <div
          id="printable-receipt"
          style={{
            background: '#ffffff',
            color: '#1e293b',
            padding: '24px 20px',
            borderRadius: '12px',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '0.82rem',
            lineHeight: 1.4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            marginBottom: '20px'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.05em', color: '#0f172a' }}>
              ZONA POS UMKM
            </h3>
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{transaction.outletName || 'Outlet Cabang'}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Sistem Kasir Cloud Multi-Tenant</div>
            <div style={{ borderBottom: '1px dashed #94a3b8', margin: '10px 0' }} />
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '12px', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>No. Trx:</span>
              <strong style={{ letterSpacing: '0.03em' }}>{transaction.trxNo}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Waktu:</span>
              <span>{transaction.createdAt ? new Date(transaction.createdAt).toLocaleString('id-ID') : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Kasir:</span>
              <span>{transaction.cashierName || 'Kasir'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pelanggan:</span>
              <span>{transaction.customerName || 'Umum'}</span>
            </div>
            <div style={{ borderBottom: '1px dashed #94a3b8', margin: '8px 0' }} />
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {transaction.items?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ maxWidth: '65%' }}>
                  <div style={{ fontWeight: 700 }}>{item.productName}</div>
                  {item.variantName && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>({item.variantName})</div>}
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {item.quantity} x Rp {item.unitPrice?.toLocaleString('id-ID')}
                  </div>
                </div>
                <div style={{ fontWeight: 700, textAlign: 'right' }}>
                  Rp {item.subtotal?.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
            <div style={{ borderBottom: '1px dashed #94a3b8', margin: '8px 0' }} />
          </div>

          {/* Calculation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>Rp {transaction.subtotal?.toLocaleString('id-ID')}</span>
            </div>
            {transaction.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                <span>Diskon:</span>
                <span>-Rp {transaction.discount?.toLocaleString('id-ID')}</span>
              </div>
            )}
            {transaction.tax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pajak:</span>
                <span>Rp {transaction.tax?.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, marginTop: '4px' }}>
              <span>TOTAL:</span>
              <span>Rp {transaction.grandTotal?.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ borderBottom: '1px dashed #94a3b8', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Metode Bayar:</span>
              <span style={{ fontWeight: 700 }}>{transaction.paymentMethod}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Bayar:</span>
              <span>Rp {transaction.paymentAmount?.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
              <span>Kembalian:</span>
              <span>Rp {transaction.changeAmount?.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Footer note */}
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.7rem', color: '#64748b' }}>
            <div>*** TERIMA KASIH ***</div>
            <div>Struk ini adalah bukti pembayaran yang sah</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handlePrint} className="btn btn-outline" style={{ flex: 1 }}>
            <Printer size={16} />
            <span>Cetak Struk</span>
          </button>
          <button onClick={onClose} className="btn btn-primary" style={{ flex: 1 }}>
            <span>Selesai / Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
}
