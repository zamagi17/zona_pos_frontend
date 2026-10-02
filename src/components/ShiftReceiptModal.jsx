import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Printer, Check, X, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export function ShiftReceiptModal({ isOpen, shift, onClose }) {
  const isClosed = shift?.status === 'CLOSED';

  useEffect(() => {
    if (isOpen && isClosed) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen, isClosed]);

  if (!isOpen || !shift) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalIn = shift.totalCashIn || 0;
  const totalOut = shift.totalCashOut || 0;
  const cashSales = shift.totalCashSales || 0;
  const nonCashSales = shift.totalNonCashSales || 0;
  const totalSales = cashSales + nonCashSales;
  const expected = shift.expectedCash != null
    ? shift.expectedCash
    : ((shift.startCash || 0) + cashSales + totalIn - totalOut);
  const actual = shift.actualCash || 0;
  const diff = shift.cashDifference != null ? shift.cashDifference : (actual - expected);

  const movements = shift.cashMovements || [];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px', padding: '24px' }}>
        {/* Modal Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: isClosed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
              padding: '8px',
              borderRadius: '10px'
            }}>
              <Printer size={18} color={isClosed ? '#10b981' : '#818cf8'} />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: isClosed ? '#10b981' : '#818cf8' }}>
                {isClosed ? 'Rekap Penutupan Shift (Z-Report)' : 'Rekap Sementara Shift (X-Report)'}
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isClosed ? 'Struk resmi rekonsiliasi kas setoran' : 'Pembacaan kas berjalan kasir'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Thermal Receipt Paper Area */}
        <div
          id="printable-shift-receipt"
          style={{
            background: '#ffffff',
            color: '#0f172a',
            padding: '24px 20px',
            borderRadius: '12px',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '0.8rem',
            lineHeight: 1.45,
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            marginBottom: '20px',
            maxHeight: '62vh',
            overflowY: 'auto'
          }}
        >
          {/* Outlet Title */}
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.04em', margin: 0, color: '#000000' }}>
              ZONA POS UMKM
            </h3>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
              {shift.outletName || 'Outlet Cabang'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Sistem Point of Sale & Retail ERP
            </div>
            <div style={{ borderBottom: '1px dashed #64748b', margin: '8px 0' }} />
            <div style={{ fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.06em' }}>
              {isClosed ? '*** Z-REPORT (TUTUP SHIFT) ***' : '*** X-REPORT (INTERIM SHIFT) ***'}
            </div>
            <div style={{ borderBottom: '1px dashed #64748b', margin: '8px 0' }} />
          </div>

          {/* Session Metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.76rem', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>No. Shift:</span>
              <strong style={{ letterSpacing: '0.03em' }}>#SHIFT-{shift.id}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Kasir:</span>
              <strong>{shift.cashierName || 'Kasir'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Waktu Buka:</span>
              <span>{shift.openedAt ? new Date(shift.openedAt).toLocaleString('id-ID') : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Waktu Tutup:</span>
              <span>{shift.closedAt ? new Date(shift.closedAt).toLocaleString('id-ID') : 'BELUM DITUTUP (OPEN)'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Status Sesi:</span>
              <strong>{shift.status}</strong>
            </div>
            <div style={{ borderBottom: '1px dashed #64748b', margin: '6px 0' }} />
          </div>

          {/* Sales Performance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', marginBottom: '10px' }}>
            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a', marginBottom: '2px' }}>
              1. PERFORMA PENJUALAN
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Jumlah Transaksi:</span>
              <strong>{shift.totalTransactions || 0} Trx</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Penjualan Tunai (Cash):</span>
              <span>+Rp {cashSales.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Penjualan Non-Tunai:</span>
              <span>Rp {nonCashSales.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '1px dashed #cbd5e1', paddingTop: '3px' }}>
              <span>TOTAL OMSET:</span>
              <span>Rp {totalSales.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ borderBottom: '1px dashed #64748b', margin: '6px 0' }} />
          </div>

          {/* Cash Drawer Flow (Float, Sales, Petty Cash) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', marginBottom: '10px' }}>
            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a', marginBottom: '2px' }}>
              2. ARUS UANG KAS LACI (PETTY CASH)
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Modal Awal Kasir:</span>
              <span>Rp {(shift.startCash || 0).toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>(+) Penjualan Tunai:</span>
              <span>+Rp {cashSales.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>(+) Kas Masuk (Suntik):</span>
              <span>+Rp {totalIn.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>(-) Kas Keluar (Petty):</span>
              <span>-Rp {totalOut.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ borderBottom: '2px solid #0f172a', margin: '6px 0' }} />
          </div>

          {/* Reconciliation Balance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.82rem', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Estimasi Kas Laci (Expected):</span>
              <span>Rp {expected.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.86rem' }}>
              <span>Uang Fisik di Laci (Actual):</span>
              <span>{isClosed ? `Rp ${actual.toLocaleString('id-ID')}` : '(Menunggu Tutup)'}</span>
            </div>
            <div style={{ borderBottom: '2px solid #0f172a', margin: '4px 0' }} />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 900,
              fontSize: '0.92rem',
              color: isClosed && diff === 0 ? '#15803d' : isClosed && diff < 0 ? '#b91c1c' : '#b45309'
            }}>
              <span>SELISIH KAS (DIFF):</span>
              <span>
                {isClosed
                  ? (diff === 0
                      ? 'Rp 0 (SEIMBANG/PAS)'
                      : (diff > 0 ? `+Rp ${diff.toLocaleString('id-ID')} (LEBIH)` : `Rp ${diff.toLocaleString('id-ID')} (KURANG)`))
                  : 'Rp 0 (Shift Berjalan)'}
              </span>
            </div>
            <div style={{ borderBottom: '1px dashed #64748b', margin: '8px 0' }} />
          </div>

          {/* Petty Cash Detail Breakdown */}
          {movements.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.76rem', marginBottom: '6px' }}>
                RINCIAN MUTASI KAS KECIL ({movements.length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.72rem' }}>
                {movements.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted #cbd5e1', paddingBottom: '3px' }}>
                    <div style={{ maxWidth: '65%' }}>
                      <div>
                        <strong>[{m.type === 'CASH_IN' ? '+MASUK' : '-KELUAR'}]</strong> {m.category}
                      </div>
                      {m.notes && <div style={{ color: '#475569', fontStyle: 'italic' }}>"{m.notes}"</div>}
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 700 }}>
                      {m.type === 'CASH_IN' ? '+' : '-'}Rp {m.amount?.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderBottom: '1px dashed #64748b', margin: '10px 0' }} />
            </div>
          )}

          {/* Signature Lines */}
          <div style={{ marginTop: '16px', fontSize: '0.72rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '44px' }}>
              <div>
                <div>Kasir Bertugas,</div>
              </div>
              <div>
                <div>Manajer / Spv Toko,</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>( {shift.cashierName || '................'} )</div>
              <div>( ................ )</div>
            </div>
          </div>

          {/* Bottom Footnote */}
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.68rem', color: '#64748b' }}>
            <div>Dokumen Resmi Penutupan Kasir Zona POS</div>
            <div>Dicetak: {new Date().toLocaleString('id-ID')}</div>
            <div style={{ marginTop: '2px', fontWeight: 600 }}>* Lampirkan struk ini ke dalam amplop setoran uang bank *</div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 800 }}
          >
            <Printer size={18} />
            <span>Cetak Struk Rekap ({isClosed ? 'Z-Report' : 'X-Report'})</span>
          </button>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '12px 18px' }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
