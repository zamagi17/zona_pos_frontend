import React, { useState } from 'react';
import { useShift } from '../context/ShiftContext';
import { CheckCircle2, AlertTriangle, X, Calculator, Printer } from 'lucide-react';

export function CloseShiftModal({ isOpen, onClose, onShiftClosed, onPrintXReport }) {
  const { activeShift, closeShift } = useShift();
  const [actualCash, setActualCash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !activeShift) return null;

  const totalIn = activeShift.totalCashIn || 0;
  const totalOut = activeShift.totalCashOut || 0;
  const expected = activeShift.expectedCash != null
    ? activeShift.expectedCash
    : (activeShift.startCash + (activeShift.totalCashSales || 0) + totalIn - totalOut);
  const diff = actualCash !== '' ? Number(actualCash) - expected : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await closeShift(Number(actualCash));
      if (onShiftClosed) onShiftClosed(res);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <Calculator size={20} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Tutup & Rekonsiliasi Shift</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Shift Summary Cards */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Modal Awal Kasir:</span>
            <span style={{ fontWeight: 600 }}>Rp {activeShift.startCash?.toLocaleString('id-ID')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Penjualan Tunai (Cash):</span>
            <span style={{ fontWeight: 600, color: '#34d399' }}>+ Rp {activeShift.totalCashSales?.toLocaleString('id-ID')}</span>
          </div>
          {totalIn > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Kas Masuk (Suntik Modal / Lainnya):</span>
              <span style={{ fontWeight: 600, color: '#34d399' }}>+ Rp {totalIn.toLocaleString('id-ID')}</span>
            </div>
          )}
          {totalOut > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Kas Keluar (Petty Cash / Operasional):</span>
              <span style={{ fontWeight: 600, color: '#fb7185' }}>- Rp {totalOut.toLocaleString('id-ID')}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Penjualan Non-Tunai (QRIS/Debit):</span>
            <span style={{ fontWeight: 600, color: '#818cf8' }}>Rp {activeShift.totalNonCashSales?.toLocaleString('id-ID')}</span>
          </div>
          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700 }}>
            <span style={{ color: 'var(--text-main)' }}>Estimasi Fisik Laci (Expected):</span>
            <span style={{ color: '#10b981' }}>Rp {expected?.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Uang Fisik Aktual di Laci (Actual Cash)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontWeight: 700 }}>
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="500"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                required
                className="form-input"
                style={{ paddingLeft: '42px', fontSize: '1.15rem', fontWeight: 700 }}
                placeholder="Hitung & ketik total uang kas fisik di laci..."
                autoFocus
              />
            </div>
          </div>

          {/* Difference Indicator */}
          {actualCash !== '' && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '20px',
              background: diff === 0 ? 'rgba(16, 185, 129, 0.15)' : diff < 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${diff === 0 ? '#10b981' : diff < 0 ? '#f43f5e' : '#f59e0b'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {diff === 0 ? 'Kas Cocok (Seimbang)' : diff < 0 ? 'Kas Kurang (Minus)' : 'Kas Lebih (Surplus)'}
              </span>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: diff === 0 ? '#34d399' : diff < 0 ? '#fb7185' : '#fbbf24' }}>
                {diff > 0 ? `+Rp ${diff.toLocaleString('id-ID')}` : `Rp ${diff.toLocaleString('id-ID')}`}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => onPrintXReport && onPrintXReport(activeShift)}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Cetak struk pembacaan sementara shift (X-Report)"
            >
              <Printer size={15} />
              <span>Cetak X-Report</span>
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-outline">
                Batal
              </button>
              <button type="submit" disabled={loading || actualCash === ''} className="btn btn-amber" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} />
                <span>{loading ? 'Menutup...' : 'Tutup Shift & Cetak Z-Report'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
