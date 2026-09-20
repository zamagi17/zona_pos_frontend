import React, { useState } from 'react';
import { useShift } from '../context/ShiftContext';
import { Clock, DollarSign, X } from 'lucide-react';

export function OpenShiftModal({ isOpen, onClose }) {
  const { openShift } = useShift();
  const [startCash, setStartCash] = useState('100000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await openShift(Number(startCash));
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
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <Clock size={20} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Buka Shift Kasir</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
          Masukkan nominal uang modal awal (uang kembalian) yang tersedia di dalam laci kasir sebelum memulai transaksi.
        </p>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">Modal Awal Kasir (Rp)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontWeight: 700 }}>
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                value={startCash}
                onChange={(e) => setStartCash(e.target.value)}
                required
                className="form-input"
                style={{ paddingLeft: '42px', fontSize: '1.1rem', fontWeight: 700 }}
                placeholder="Contoh: 100000"
                autoFocus
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-outline">
              Batal
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Membuka...' : 'Buka Shift Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
