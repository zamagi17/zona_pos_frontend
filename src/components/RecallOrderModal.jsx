import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { PauseCircle, PlayCircle, X, ShoppingBag } from 'lucide-react';

export function RecallOrderModal({ isOpen, onClose }) {
  const { user, selectedOutletId } = useAuth();
  const { recallOrder } = useCart();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);

  const outletId = selectedOutletId || user?.outletId;

  const loadDrafts = () => {
    if (!outletId) return;
    setLoading(true);
    api.getTransactions(outletId, 'DRAFT')
      .then(setDrafts)
      .catch(() => setDrafts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadDrafts();
    }
  }, [isOpen, outletId]);

  if (!isOpen) return null;

  const handleSelectDraft = (draft) => {
    recallOrder(draft);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '24px', maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <PauseCircle size={20} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Daftar Pesanan Ditahan (Hold / Draft)</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pilih pesanan yang ingin diproses pembayarannya</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Memuat daftar draft pesanan...
          </div>
        ) : drafts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
            <ShoppingBag size={36} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tidak ada pesanan yang sedang di-hold.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
            {drafts.map(draft => (
              <div
                key={draft.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{draft.trxNo}</span>
                    <span className="badge badge-indigo">DRAFT</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Pelanggan: <strong style={{ color: 'var(--text-main)' }}>{draft.customerName || 'Umum'}</strong> • {draft.items?.length || 0} item
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {draft.createdAt ? new Date(draft.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>
                      Rp {draft.grandTotal?.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectDraft(draft)}
                    className="btn btn-primary"
                    style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                  >
                    <PlayCircle size={15} />
                    <span>Panggil (Recall)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button onClick={onClose} className="btn btn-outline">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
