import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Printer, Check, X, Store, Phone } from 'lucide-react';
import { api } from '../services/api';

export function ReceiptModal({ isOpen, transaction, onClose }) {
  const [setting, setSetting] = useState(null);
  const [activePaperSize, setActivePaperSize] = useState('58mm');

  useEffect(() => {
    if (isOpen && transaction) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Load custom store and thermal receipt settings
      api.getReceiptSetting(transaction.outletId)
        .then(res => {
          if (res) {
            setSetting(res);
            if (res.paperSize) {
              setActivePaperSize(res.paperSize);
            }
          }
        })
        .catch(err => {
          console.warn('Gagal memuat pengaturan struk:', err);
        });
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const is80mm = activePaperSize === '80mm';
  const receiptWidth = is80mm ? '420px' : '310px';
  const receiptPrintWidth = is80mm ? '72mm' : '48mm';

  const storeName = setting?.businessName || transaction.outletName || 'ZONA POS UMKM';
  const storeAddress = setting?.address || 'Outlet Cabang';
  const storePhone = setting?.phone;
  const storeInstagram = setting?.instagram;
  const storeFooterNote = setting?.footerNote || 'Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.\nTerima kasih atas kunjungan Anda!';

  return (
    <div className="modal-overlay">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${receiptPrintWidth} !important;
            margin: 0 !important;
            padding: 3mm !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>

      <div className="modal-content" style={{ maxWidth: is80mm ? '500px' : '400px', padding: '20px', transition: 'max-width 0.2s ease' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
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

        {/* Paper Size Quick Selector Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '6px 10px',
          borderRadius: '8px',
          marginBottom: '14px',
          fontSize: '0.78rem'
        }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={14} color="#10b981" />
            <span>Format Kertas:</span>
          </span>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px' }}>
            <button
              type="button"
              onClick={() => setActivePaperSize('58mm')}
              style={{
                border: 'none',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: !is80mm ? '#10b981' : 'transparent',
                color: !is80mm ? '#0f172a' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              58mm (Mini)
            </button>
            <button
              type="button"
              onClick={() => setActivePaperSize('80mm')}
              style={{
                border: 'none',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: is80mm ? '#10b981' : 'transparent',
                color: is80mm ? '#0f172a' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              80mm (Desktop)
            </button>
          </div>
        </div>

        {/* Thermal Receipt Container */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div
            id="printable-receipt"
            style={{
              background: '#ffffff',
              color: '#1e293b',
              width: receiptWidth,
              padding: is80mm ? '24px 22px' : '18px 14px',
              borderRadius: '10px',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: is80mm ? '0.84rem' : '0.76rem',
              lineHeight: 1.35,
              boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
              transition: 'width 0.2s ease, font-size 0.2s ease'
            }}
          >
            {/* Header: Logo & Store Info */}
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              {setting?.showLogo && setting?.logoUrl && (
                <div style={{ marginBottom: '8px' }}>
                  <img
                    src={setting.logoUrl}
                    alt="Logo Toko"
                    style={{
                      maxHeight: is80mm ? '60px' : '45px',
                      maxWidth: is80mm ? '160px' : '120px',
                      objectFit: 'contain',
                      margin: '0 auto',
                      display: 'block'
                    }}
                  />
                </div>
              )}

              <h3 style={{
                fontSize: is80mm ? '1.2rem' : '1.05rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: '#0f172a',
                margin: '0 0 3px'
              }}>
                {storeName}
              </h3>

              <div style={{ fontSize: is80mm ? '0.78rem' : '0.72rem', color: '#475569', margin: '2px 0' }}>
                {storeAddress}
              </div>

              {storePhone && (
                <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                  Telp/WA: {storePhone}
                </div>
              )}

              {setting?.showSocialMedia && storeInstagram && (
                <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                  IG: {storeInstagram}
                </div>
              )}

              <div style={{ borderBottom: '1px dashed #94a3b8', margin: '10px 0' }} />
            </div>

            {/* Transaction Metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px', fontSize: is80mm ? '0.78rem' : '0.72rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>No. Trx:</span>
                <strong style={{ letterSpacing: '0.02em' }}>{transaction.trxNo}</strong>
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

            {/* Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '12px' }}>
              {transaction.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ maxWidth: '65%' }}>
                    <div style={{ fontWeight: 700 }}>{item.productName}</div>
                    {item.variantName && <div style={{ fontSize: '0.68rem', color: '#64748b' }}>({item.variantName})</div>}
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
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

            {/* Calculations & Discounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: is80mm ? '0.8rem' : '0.74rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>Rp {transaction.subtotal?.toLocaleString('id-ID')}</span>
              </div>

              {/* Detailed Discount Breakdown */}
              {transaction.itemDiscountTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                  <span>Diskon Produk:</span>
                  <span>-Rp {transaction.itemDiscountTotal?.toLocaleString('id-ID')}</span>
                </div>
              )}
              {transaction.orderDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                  <span>Diskon Nota {transaction.orderDiscountType === 'PERCENT' ? `(${transaction.orderDiscountRate}%)` : ''}:</span>
                  <span>-Rp {transaction.orderDiscount?.toLocaleString('id-ID')}</span>
                </div>
              )}
              {(transaction.voucherDiscount > 0 || transaction.voucherCode) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                  <span>Voucher ({transaction.voucherCode || 'Promo'}):</span>
                  <span>-Rp {(transaction.voucherDiscount || 0)?.toLocaleString('id-ID')}</span>
                </div>
              )}
              {(!transaction.itemDiscountTotal && !transaction.orderDiscount && !transaction.voucherDiscount && transaction.discount > 0) && (
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

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: is80mm ? '1.05rem' : '0.95rem',
                fontWeight: 900,
                marginTop: '4px'
              }}>
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

              {/* Split Payments Breakdown */}
              {transaction.payments && transaction.payments.length > 1 && (
                <div style={{ marginTop: '6px', borderTop: '1px dotted #94a3b8', paddingTop: '4px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
                    Rincian Split Payment:
                  </div>
                  {transaction.payments.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                      <span>• {p.paymentMethod}:</span>
                      <span>Rp {p.amount?.toLocaleString('id-ID')} {p.status === 'UNPAID' ? '(Tempo)' : ''}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tempo / Kasbon Notice */}
              {(transaction.dueDate || transaction.paymentStatus === 'UNPAID' || transaction.paymentStatus === 'PARTIAL') && (
                <div style={{
                  marginTop: '8px',
                  padding: '6px 8px',
                  background: '#fee2e2',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontSize: '0.72rem',
                  color: '#b91c1c',
                  fontWeight: 800
                }}>
                  <div>STATUS: KASBON / TEMPO (BELUM LUNAS)</div>
                  {transaction.dueDate && (
                    <div style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                      Jatuh Tempo: {new Date(transaction.dueDate).toLocaleDateString('id-ID')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Custom Footer Note */}
            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: is80mm ? '0.74rem' : '0.68rem', color: '#64748b' }}>
              <div style={{ borderTop: '1px dashed #94a3b8', margin: '8px 0' }} />
              {storeFooterNote.split('\n').map((line, i) => (
                <div key={i} style={{ fontWeight: i === 0 ? 600 : 400 }}>{line}</div>
              ))}
              <div style={{ marginTop: '6px', fontSize: '0.65rem', opacity: 0.8 }}>
                - Dicetak melalui Zona POS Cloud -
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handlePrint} className="btn btn-outline" style={{ flex: 1 }}>
            <Printer size={16} />
            <span>Cetak Struk ({activePaperSize})</span>
          </button>
          <button onClick={onClose} className="btn btn-primary" style={{ flex: 1 }}>
            <span>Selesai / Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
}
